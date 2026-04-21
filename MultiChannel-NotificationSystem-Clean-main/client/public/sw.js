// Service Worker for Web Push Notifications
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log('[Service Worker] Push had this data: ', event.data?.text());

  let notificationData = {
    title: 'Notification',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'notification',
    requireInteraction: false,
    data: {},
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        image: data.image,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        renotify: data.renotify || false,
        data: data.data || {},
        actions: data.actions || [],
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  // Build notification options, omitting undefined values
  const notificationOptions = {
    body: notificationData.body,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    silent: notificationData.silent,
    renotify: notificationData.renotify,
    data: notificationData.data,
    vibrate: [200, 100, 200],
  };
  
  // Only add optional fields if they exist
  if (notificationData.icon) notificationOptions.icon = notificationData.icon;
  if (notificationData.badge) notificationOptions.badge = notificationData.badge;
  if (notificationData.image) notificationOptions.image = notificationData.image;
  if (notificationData.actions && notificationData.actions.length > 0) {
    notificationOptions.actions = notificationData.actions;
  }

  const promiseChain = self.registration.showNotification(notificationData.title, notificationOptions);

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');

  event.notification.close();

  // Handle action clicks
  if (event.action) {
    console.log('[Service Worker] Action clicked: ', event.action);
    // You can handle different actions here
    return;
  }

  // Open or focus the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed.');
});

