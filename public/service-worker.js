self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
  const data = event.data?.json() ?? {
    title: 'طلب جديد! 🚨',
    body: 'وصل طلب جديد لمطعم شيان',
    icon: '/logo.png',
    badge: '/logo.png'
  };

  const options = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    data: {
      url: '/admin'
    },
    actions: [
      {
        action: 'view-order',
        title: 'عرض الطلبات 🏃‍♂️'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/admin')
  );
});
