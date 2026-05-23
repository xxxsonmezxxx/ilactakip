const CACHE_NAME = 'lit-cache-v4';
const STATIC_ASSETS = ['/', '/dashboard', '/ilaclarim', '/icons/icon-192x192.png', '/icons/icon-512x512.png', '/manifest.json'];

let medicines = [];
let notifiedKeys = {};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
  startCheckLoop();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_NOTIFICATIONS') {
    medicines = event.data.medicines || [];
    const today = getToday();
    Object.keys(notifiedKeys).forEach((k) => {
      if (!k.startsWith(today)) delete notifiedKeys[k];
    });
  }
});

function actions() {
  return [
    { action: 'taken', title: 'Ictim' },
    { action: 'skipped', title: 'Atla' },
    { action: 'snooze', title: '10dk Ertele' },
  ];
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const tag = event.notification.tag;

  if (event.action === 'snooze') {
    const title = event.notification.title;
    const body = event.notification.body;
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(async () => {
          await self.registration.showNotification(`${title} (Ertelendi)`, {
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            vibrate: [300, 100, 300, 100, 300],
            tag: `${tag}-snooze`,
            requireInteraction: true,
            actions: actions(),
          });
          resolve();
        }, 10 * 60 * 1000);
      })
    );
    return;
  }

  const messageType = event.action === 'taken' ? 'MEDICINE_TAKEN' : event.action === 'skipped' ? 'MEDICINE_SKIPPED' : null;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
        if (messageType) clients[0].postMessage({ type: messageType, tag });
      } else {
        self.clients.openWindow('/dashboard');
      }
    })
  );
});

const DAY_MAP = ['Paz', 'Pzt', 'Sal', 'Ã‡ar', 'Per', 'Cum', 'Cmt'];
function getToday() {
  return new Date().toISOString().split('T')[0];
}
function getTodayDayKey() {
  return DAY_MAP[new Date().getDay()];
}

async function checkAndNotify() {
  const now = new Date();
  const today = getToday();
  const todayDay = getTodayDayKey();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const med of medicines) {
    if (!med.reminder) continue;
    if (!med.days || !med.days.includes(todayDay)) continue;

    for (const schedTime of med.schedule || []) {
      const [h, m] = schedTime.split(':').map(Number);
      const diff = currentMinutes - (h * 60 + m);
      if (diff < 0 || diff > 2) continue;

      const notifKey = `${today}-${med.id}-${schedTime}`;
      if (notifiedKeys[notifKey]) continue;
      notifiedKeys[notifKey] = true;

      const foodMsg = med.foodInstruction === 'AÃ§' ? '\nAc karnina alin.' : med.foodInstruction === 'Tok' ? '\nTok karnina alin.' : '';
      const dosageMsg = med.dosage ? `\nDozaj: ${med.dosage}` : '';

      await self.registration.showNotification(`Ilac: ${med.name} - ${schedTime}`, {
        body: `Ilac zamani geldi!${dosageMsg}${foodMsg}`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: `${med.id}-${schedTime}-${today}`,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
        actions: actions(),
      });
    }
  }
}

let checkIntervalId = null;
function startCheckLoop() {
  if (checkIntervalId) clearInterval(checkIntervalId);
  checkIntervalId = setInterval(() => {
    checkAndNotify();
  }, 30000);
  checkAndNotify();
}

startCheckLoop();
