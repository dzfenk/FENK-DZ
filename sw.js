/* FENK V73 Web Push Service Worker */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || 'إشعار جديد من FENK';
  const options = {
    body: data.body || 'لديك تحديث جديد في FENK.',
    icon: data.icon || './assets/logo-clean.webp',
    badge: data.badge || './assets/logo-clean.webp',
    tag: data.tag || 'fenk-notification',
    renotify: true,
    dir: 'rtl',
    lang: 'ar',
    vibrate: [120, 60, 120],
    data: data.data || { url: './' },
    timestamp: Date.now(),
    requireInteraction: false
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification?.data?.url || './';
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
