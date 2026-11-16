// Firebase Cloud Messaging (FCM) Web Push Service Worker — Dükkânım Yanımda
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Dükkânım Yanımda',
    body: 'Yeni bir işletme bildiriminiz var.',
    url: '/',
    tag: 'dukkanim-fcm',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      const notif = parsed.notification || {};
      const data = parsed.data || {};
      payload = {
        title: notif.title || data.title || payload.title,
        body: notif.body || data.body || payload.body,
        url: data.url || (parsed.fcmOptions && parsed.fcmOptions.link) || payload.url,
        tag: notif.tag || data.tag || payload.tag,
      };
    } catch {
      const text = event.data.text();
      if (text) payload.body = text;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200, 100, 300],
      tag: payload.tag,
      renotify: true,
      requireInteraction: true,
      data: { url: payload.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl && targetUrl !== '/') {
            return client.navigate(targetUrl);
          }
          return client;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
