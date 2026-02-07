// Push Notification Utility Functions
import { supabase } from './supabaseClient';

// VAPID Public Key (ต้อง generate ใหม่สำหรับ production)
// สามารถ generate ได้ที่: https://vapidkeys.com/
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

/**
 * Convert VAPID key to Uint8Array for subscription
 */
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

/**
 * Check if push notification is supported
 */
export const isPushSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = () => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async () => {
    if (!isPushSupported()) {
        console.warn('Push notifications are not supported');
        return 'unsupported';
    }

    try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        return permission;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
    }
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPush = async () => {
    if (!isPushSupported()) {
        console.warn('Push notifications are not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Create new subscription
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            console.log('New push subscription created:', subscription);
        } else {
            console.log('Existing push subscription:', subscription);
        }

        return subscription;
    } catch (error) {
        console.error('Error subscribing to push:', error);
        return null;
    }
};

/**
 * Save push subscription to Supabase
 */
export const saveSubscriptionToSupabase = async (userId, subscription) => {
    if (!subscription || !userId) return false;

    try {
        const subscriptionJSON = subscription.toJSON();

        // Upsert subscription (update if exists, insert if not)
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                endpoint: subscriptionJSON.endpoint,
                p256dh: subscriptionJSON.keys.p256dh,
                auth: subscriptionJSON.keys.auth,
            }, {
                onConflict: 'user_id',
            });

        if (error) {
            console.error('Error saving subscription to Supabase:', error);
            return false;
        }

        console.log('Subscription saved to Supabase');
        return true;
    } catch (error) {
        console.error('Error saving subscription:', error);
        return false;
    }
};

/**
 * Show local notification (when app is open)
 */
export const showLocalNotification = (title, options = {}) => {
    if (getNotificationPermission() !== 'granted') {
        console.warn('Notification permission not granted');
        return;
    }

    const defaultOptions = {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        ...options,
    };

    try {
        new Notification(title, defaultOptions);
    } catch (error) {
        // Fallback for mobile browsers
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, defaultOptions);
            });
        }
    }
};

/**
 * Show order status notification
 */
export const showOrderStatusNotification = (orderId, status) => {
    const statusMessages = {
        waiting_payment: 'รอการชำระเงิน',
        waiting_confirmation: 'กำลังตรวจสอบการชำระเงิน',
        paid: 'ชำระเงินสำเร็จ กำลังเตรียมออเดอร์',
        completed: 'ออเดอร์เสร็จสิ้น พร้อมรับได้แล้ว!',
    };

    const message = statusMessages[status] || 'สถานะออเดอร์มีการอัปเดต';

    showLocalNotification(`ออเดอร์ #${orderId}`, {
        body: message,
        tag: `order-${orderId}`,
        renotify: true,
    });
};
