// src/lib/pushover.ts

/**
 * Sends a high-priority push notification to the Pushover app.
 * This ensures the restaurant admin gets a loud, persistent alert even if the browser is closed.
 */
export async function sendPushoverNotification(orderId: string, total: number, customerName: string) {
  const userKey = process.env.PUSHOVER_USER_KEY;
  const token = process.env.PUSHOVER_TOKEN;

  if (!userKey || !token || token === 'YOUR_APP_TOKEN_HERE') {
    console.warn('Pushover notification skipped: PUSHOVER_USER_KEY or PUSHOVER_TOKEN is missing.');
    return;
  }

  const message = `🚨 طلب جديد وصل!
الزبون: ${customerName}
المجموع: ${total.toFixed(2)} د.أ
رقم الطلب: #${orderId.slice(-6).toUpperCase()}`;

  try {
    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        user: userKey,
        title: 'Xian Restaurant 🚨',
        message: message,
        priority: 1, // High priority
        sound: 'siren', // You can change this to 'bike', 'bugle', 'intermission', etc.
        url: `${process.env.NEXTAUTH_URL || 'https://xian-restaurant.vercel.app'}/admin`,
        url_title: 'افتح لوحة التحكم'
      }),
    });

    const result = await response.json();
    if (result.status !== 1) {
      console.error('Pushover API error:', result);
    } else {
      console.log('Pushover notification sent successfully!');
    }
  } catch (error) {
    console.error('Failed to send Pushover notification:', error);
  }
}
