const CACHE_NAME = 'lit-cache-v5';
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
    { action: 'taken', title: 'İçtim' },
    { action: 'skipped', title: 'Atla' },
    { action: 'snooze', title: 'Hatırlat' },
  ];
}

function isDueToday(med, date) {
  const rule = med.repeatRule || 'manual';
  const anchor = med.anchorDate || (med.createdAt ? med.createdAt.slice(0, 10) : date);
  const ad = new Date(`${anchor}T00:00:00`);
  const dd = new Date(`${date}T00:00:00`);
  const diff = Math.floor((dd - ad) / 86400000);
  if (diff < 0) return false;

  if (rule === 'every2days') return diff % 2 === 0;
  if (rule === 'weekly1') return diff % 7 === 0;
  if (rule === 'weekly2') return diff % 7 === 0 || diff % 7 === 3;
  if (rule === 'monthly1') return ad.getDate() === dd.getDate();

  const dayMap = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const todayDay = dayMap[dd.getDay()];
  const days = (med.days || []).map((d) => (d === 'Ã‡ar' ? 'Çar' : d));
  return days.includes(todayDay);
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
          await self.registration.showNotification(`${title} (Tekrar)`, {
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            vibrate: [300, 100, 300],
            tag: `${tag}-snooze`,
            requireInteraction: true,
            actions: actions(),
          });
          resolve();
        }, 10 * 60 * 1000);
      })
    );

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        if (clients.length > 0) clients[0].postMessage({ type: 'MEDICINE_SNOOZE', tag });
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

function getToday() {
  return new Date().toISOString().split('T')[0];
}

async function checkAndNotify() {
  const now = new Date();
  const today = getToday();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const med of medicines) {
    if (!med.reminder) continue;
    if (!isDueToday(med, today)) continue;

    for (const schedTime of med.schedule || []) {
      const [h, m] = schedTime.split(':').map(Number);
      const diff = currentMinutes - (h * 60 + m);
      if (diff < 0 || diff > 2) continue;

      const notifKey = `${today}-${med.id}-${schedTime}`;
      if (notifiedKeys[notifKey]) continue;
      notifiedKeys[notifKey] = true;

      const foodMsg = med.foodInstruction === 'Aç' ? '\nAç karnına alın.' : med.foodInstruction === 'Tok' ? '\nTok karnına alın.' : '';
      const dosageMsg = med.dosage ? `\nDozaj: ${med.dosage}` : '';

      await self.registration.showNotification(`💊 ${med.name} - ${schedTime}`, {
        body: `İlaç zamanı geldi!${dosageMsg}${foodMsg}`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: `${med.id}-${schedTime}-${today}`,
        requireInteraction: true,
        vibrate: [300, 100, 300],
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
