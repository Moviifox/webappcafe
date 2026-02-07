import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import webpush from "npm:web-push@3.6.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(
  "mailto:example@yourdomain.com",
  vapidPublicKey,
  vapidPrivateKey
);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Received payload:", payload);

    // Payload structure from Supabase Webhook:
    // { type: 'INSERT'|'UPDATE', table: 'orders', record: { ... }, old_record: { ... } }
    const { record, old_record, type } = payload;

    if (type !== "UPDATE") {
      return new Response("Only UPDATE events are handled", { status: 200 });
    }

    // Only notify if status changed
    if (record.status === old_record.status) {
      return new Response("Status not changed", { status: 200 });
    }

    const userId = record.user_id;
    const status = record.status;
    const orderId = record.id;

    // Get status message
    const statusMessages: Record<string, string> = {
      waiting_payment: "รอการชำระเงิน",
      waiting_confirmation: "กำลังตรวจสอบการชำระเงิน",
      paid: "ชำระเงินสำเร็จ กำลังเตรียมออเดอร์",
      completed: "ออเดอร์เสร็จสิ้น พร้อมรับได้แล้ว!",
    };
    const message = statusMessages[status] || "สถานะออเดอร์มีการอัปเดต";

    // 1. Fetch subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error || !subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions found for user:", userId);
      return new Response("No subscriptions", { status: 200 });
    }

    // 2. Send push to all subscriptions
    const notificationPayload = JSON.stringify({
      title: `ออเดอร์ #${orderId}`,
      body: message,
      icon: "/pwa-192x192.png",
      url: `/`, // Target URL when clicking notification
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, notificationPayload);
        console.log(`Notification sent to ${sub.id}`);
      } catch (err) {
        console.error(`Error sending to subscription ${sub.id}:`, err);
        // If subscription is expired, delete it
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
