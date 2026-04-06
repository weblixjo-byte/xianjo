import * as webpush from 'web-push';
import { BRANDING } from '@/constants/branding';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    `mailto:${BRANDING.contact.adminEmail}`,
    publicKey,
    privateKey
  );
}

export async function sendOrderNotification(
  subscription: { endpoint: string; p256dh: string; auth: string }, 
  orderId: string, 
  total: number
) {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };

    const payload = JSON.stringify({
      title: '📦 طلب جديد وصل! 🚨',
      body: `الطلب #${orderId.slice(-4)} بقيمة ${total.toFixed(2)} د.أ`,
      icon: BRANDING.logo.url,
      badge: BRANDING.logo.url,
      url: '/admin'
    });

    await webpush.sendNotification(pushSubscription, payload);
    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error };
  }
}
