// Service Worker for Leoparlı İlaç Takibim (L.İ.T)
// Robust notification system for PWA (iOS Home Screen + Android)

const CACHE_NAME = 'lit-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/ilaclarim',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json',
];

// ----- Medicines state -----
let medicines = [];
let notifiedKeys = {}; // Track which notifications were already sent today

// ----- Install -----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ----- Activate -----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
  // Start the check loop immediately upon activation
  startCheckLoop();
});

// ----- Fetch (network first, cache fallback) -----
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

// ----- Message handler (receive medicines from app) -----
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATIONS') {
    medicines = event.data.medicines || [];
    // Reset notified keys for the new day
    const today = getToday();
    const oldKeys = Object.keys(notifiedKeys);
    for (const k of oldKeys) {
      if (!k.startsWith(today)) delete notifiedKeys[k];
    }
  }
});

// ----- Push notification handler (for future server push) -----
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '💊 İlaç Zamanı!';
  const options = {
    body: data.body || 'İlaç alma zamanın geldi.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'medicine-reminder',
    requireInteraction: true,
    actions: [
      { action: 'taken', title: '✓ İçtim' },
      { action: 'snooze', title: '⏰ 10dk Sonra' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ----- Notification click -----
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'snooze') {
    // Snooze: re-notify after 10 minutes
    const tag = event.notification.tag;
    const title = event.notification.title;
    const body = event.notification.body;
    event.waitUntil(
      new Promise(resolve => {
        setTimeout(async () => {
          await self.registration.showNotification(title + ' (Ertelendi)', {
            body: body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            vibrate: [300, 100, 300, 100, 300],
            tag: tag + '-snooze',
            requireInteraction: true,
            actions: [
              { action: 'taken', title: '✓ İçtim' },
              { action: 'snooze', title: '⏰ 10dk Sonra' },
            ],
          });
          resolve();
        }, 10 * 60 * 1000); // 10 minutes
      })
    );
    return;
  }

  // Default or 'taken': open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
        clients[0].postMessage({ type: 'MEDICINE_TAKEN', tag: event.notification.tag });
      } else {
        self.clients.openWindow('/dashboard');
      }
    })
  );
});

// ----- Periodic background sync -----
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'medicine-check') {
    event.waitUntil(checkAndNotify());
  }
});

// ===== CORE NOTIFICATION ENGINE =====

const DAY_MAP = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getTodayDayKey() {
  return DAY_MAP[new Date().getDay()];
}

async function checkAndNotify() {
  const now = new Date();
  const today = getToday();
  const currentTime = getCurrentTime();
  const todayDay = getTodayDayKey();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const med of medicines) {
    if (!med.reminder) continue;
    if (!med.days || !med.days.includes(todayDay)) continue;

    for (const schedTime of (med.schedule || [])) {
      const [h, m] = schedTime.split(':').map(Number);
      const schedMinutes = h * 60 + m;
      const diff = currentMinutes - schedMinutes;

      // Notify if we're within 0-2 minutes of the scheduled time
      if (diff >= 0 && diff <= 2) {
        const notifKey = `${today}-${med.id}-${schedTime}`;

        // Skip if already notified for this slot today
        if (notifiedKeys[notifKey]) continue;
        notifiedKeys[notifKey] = true;

        const foodMsg = med.foodInstruction === 'Aç' ? '\n🌅 Aç karnına alın.'
                      : med.foodInstruction === 'Tok' ? '\n🍽️ Tok karnına alın.' : '';
        const dosageMsg = med.dosage ? `\n💊 Dozaj: ${med.dosage}` : '';

        try {
          await self.registration.showNotification(`💊 ${med.name} — ${schedTime}`, {
            body: `İlaç zamanı geldi!${dosageMsg}${foodMsg}`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            tag: `${med.id}-${schedTime}-${today}`,
            requireInteraction: true,
            vibrate: [300, 100, 300, 100, 300, 100, 300],
            actions: [
              { action: 'taken', title: '✓ İçtim' },
              { action: 'snooze', title: '⏰ 10dk Sonra' },
            ],
          });
        } catch (err) {
          console.warn('Bildirim gönderilemedi:', err);
        }
      }
    }
  }
}

// ----- Timer-based check loop (every 30 seconds) -----
let checkIntervalId = null;

function startCheckLoop() {
  if (checkIntervalId) clearInterval(checkIntervalId);
  checkIntervalId = setInterval(() => {
    checkAndNotify();
  }, 30000); // Check every 30 seconds
  // Also run immediately
  checkAndNotify();
}

// Start loop when SW loads
startCheckLoop();
