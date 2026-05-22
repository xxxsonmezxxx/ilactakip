/* Firebase Messaging service worker skeleton
   Place your Firebase config in the main app and follow README steps to enable FCM.
*/

'use strict';

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'İlaç Hatırlatıcısı';
  const options = {
    body: data.body || 'İlacınızı alma zamanı',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    data: data.url || '/',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data || '/';
  event.waitUntil(clients.openWindow(url));
});
