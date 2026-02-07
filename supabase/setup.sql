-- 0. เปิดใช้งาน Extension สำหรับส่ง HTTP Request
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. สร้างตารางเก็บ Subscription (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- เพิ่มสิทธิ์ให้ table (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ลบ Policy เดิมถ้ามี
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can manage their own subscriptions"
ON public.push_subscriptions
FOR ALL
USING (auth.uid() = user_id);

-- 2. สร้าง Function เพื่อเรียก Edge Function
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldHRqaG5pcnh2ZWR3YWliYWxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEwNzk1MSwiZXhwIjoyMDg1NjgzOTUxfQ.ORPkd657gKxl-T0zdJHwvm3cEW6l9FLmIRIQkUTAzOo'; -- แนะนำให้ใส่ Service Role Key ตรงๆ ที่นี่
BEGIN
    -- เรียก Edge Function ผ่าน HTTP Request
    PERFORM
        net.http_post(
            url := 'https://wettjhnirxvedwaibalh.supabase.co/functions/v1/push-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || service_role_key
            ),
            body := jsonb_build_object(
                'type', TG_OP,
                'table', TG_TABLE_NAME,
                'record', row_to_json(NEW),
                'old_record', row_to_json(OLD)
            ),
            timeout_milliseconds := 2000
        );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. สร้าง Trigger เมื่อสถานะออเดอร์เปลี่ยน
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_order_status_change();
