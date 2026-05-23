'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useApp, MedicineRecord, DayKey } from '../app/AppContext';
import { registerForPush } from '@/services/messaging';

/**
 * NotificationManager - Dual notification system for PWA
 * 
 * Strategy:
 * 1. Service Worker notifications (works when app is in background on iOS PWA)
 * 2. In-app timer fallback (works when app is in foreground)
 * 
 * Both systems check medicine schedules every 30 seconds.
 * Deduplication prevents double-notifications.
 */

const DAY_MAP: DayKey[] = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getTodayDayKey(): DayKey {
  return DAY_MAP[new Date().getDay()];
}

export default function NotificationManager() {
  const { user, medicines, dailyLogs, markTaken, markSnoozed } = useApp();
  const notifiedRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync medicines to service worker whenever they change
  useEffect(() => {
    if (!user || user.isAdmin) return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'SCHEDULE_NOTIFICATIONS',
          medicines: medicines,
        });
      }
    }).catch(() => {});
  }, [medicines, user]);

  // Listen for SW messages (e.g. MEDICINE_TAKEN from notification click)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'MEDICINE_TAKEN' && event.data?.tag) {
        // The tag format is: medicineId-time-date
        const parts = event.data.tag.split('-');
        if (parts.length >= 3) {
          const medId = parts[0];
          const time = parts[1];
          const date = parts.slice(2).join('-');
          markTaken(medId, time, date);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [markTaken]);

  // In-app foreground check loop
  const checkMedicines = useCallback(() => {
    if (!user || user.isAdmin) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const today = getToday();
    const todayDay = getTodayDayKey();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const med of medicines) {
      if (!med.reminder) continue;
      if (!med.days.includes(todayDay)) continue;

      for (const schedTime of med.schedule) {
        const [h, m] = schedTime.split(':').map(Number);
        const schedMinutes = h * 60 + m;
        const diff = currentMinutes - schedMinutes;

        // Within 0-2 minute window
        if (diff >= 0 && diff <= 2) {
          const notifKey = `${today}-${med.id}-${schedTime}`;
          if (notifiedRef.current.has(notifKey)) continue;
          notifiedRef.current.add(notifKey);

          const foodMsg = med.foodInstruction === 'Aç' ? '\n🌅 Aç karnına alın.'
                        : med.foodInstruction === 'Tok' ? '\n🍽️ Tok karnına alın.' : '';
          const dosageMsg = med.dosage ? `\nDozaj: ${med.dosage}` : '';

          // Play alarm sound for Alarm or İkisi de
          if (med.reminderType === 'Alarm' || med.reminderType === 'İkisi de') {
            playAlarmSound();
          }

          // Show notification for Bildirim or İkisi de
          if (med.reminderType === 'Bildirim' || med.reminderType === 'İkisi de') {
            try {
              new Notification(`💊 ${med.name} — ${schedTime}`, {
                body: `İlaç zamanı geldi!${dosageMsg}${foodMsg}`,
                icon: '/icons/icon-192x192.png',
                tag: `fg-${med.id}-${schedTime}-${today}`,
                requireInteraction: true,
              });
            } catch {
              // Fallback: try SW notification
              navigator.serviceWorker?.ready.then(reg => {
                const opts: any = {
                  body: `İlaç zamanı geldi!${dosageMsg}${foodMsg}`,
                  icon: '/icons/icon-192x192.png',
                  tag: `fg-${med.id}-${schedTime}-${today}`,
                  requireInteraction: true,
                  vibrate: [300, 100, 300, 100, 300],
                };
                reg.showNotification(`💊 ${med.name} — ${schedTime}`, opts as any);
              });
            }
          }

          // For Alarm type only (no bildirim), still show via SW so it shows on lock screen
          if (med.reminderType === 'Alarm') {
            navigator.serviceWorker?.ready.then(reg => {
              const opts: any = {
                body: `İlaç alarm zamanı!${dosageMsg}${foodMsg}`,
                icon: '/icons/icon-192x192.png',
                tag: `alarm-${med.id}-${schedTime}-${today}`,
                requireInteraction: true,
                vibrate: [500, 200, 500, 200, 500, 200, 500],
              };
              reg.showNotification(`⏰ ${med.name} — ${schedTime}`, opts as any);
            });
          }
        }
      }
    }

    // Clean up old notification keys (from previous days)
    notifiedRef.current.forEach(key => {
      if (!key.startsWith(today)) notifiedRef.current.delete(key);
    });

    // Handle snoozed logs: notify if snoozeNext <= now
    try {
      const nowDate = new Date();
      for (const log of dailyLogs.filter(l => l.status === 'snoozed')) {
        if (!log.snoozeNext) continue;
        const next = new Date(log.snoozeNext);
        if (nowDate >= next) {
          // find medicine
          const med = medicines.find(m => m.id === log.medicineId);
          if (!med) continue;

          // play alarm if needed
          if (med.reminderType === 'Alarm' || med.reminderType === 'İkisi de') playAlarmSound();

          // show notification
          const dosageMsg = med.dosage ? `\nDozaj: ${med.dosage}` : '';
          const foodMsg = med.foodInstruction === 'Aç' ? '\n🌅 Aç karnına alın.'
                        : med.foodInstruction === 'Tok' ? '\n🍽️ Tok karnına alın.' : '';

          try {
            new Notification(`🔔 Erteleme: ${med.name} — ${log.scheduleTime}`, {
              body: `Hatırlatma tekrarlandı.${dosageMsg}${foodMsg}`,
              icon: '/icons/icon-192x192.png',
              tag: `snooze-${med.id}-${log.scheduleTime}-${log.date}`,
              requireInteraction: true,
            });
          } catch {
            navigator.serviceWorker?.ready.then(reg => {
              reg.showNotification(`🔔 Erteleme: ${med.name} — ${log.scheduleTime}`, {
                body: `Hatırlatma tekrarlandı.${dosageMsg}${foodMsg}`,
                icon: '/icons/icon-192x192.png',
                tag: `snooze-${med.id}-${log.scheduleTime}-${log.date}`,
                requireInteraction: true,
                vibrate: [300, 100, 300]
              } as any);
            });
          }

          // schedule next snooze in 5 minutes
          markSnoozed(log.medicineId, log.scheduleTime, log.date);
        }
      }
    } catch (err) { console.warn('Snooze check failed', err); }
  }, [user, medicines, dailyLogs, markSnoozed]);

  // Setup interval
  useEffect(() => {
    if (!user || user.isAdmin) return;
    
    // Attempt to register for push (stores token in Firestore) — vapidKey must be set in env
    registerForPush().then(tok => {
      if (tok) console.log('FCM token registered', tok);
    }).catch(() => {});
    
    // Run check every 30 seconds
    checkMedicines();
    intervalRef.current = setInterval(checkMedicines, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkMedicines, user]);

  return (
    <>
      {/* Hidden audio element for alarm sound */}
      <audio
        ref={audioRef}
        preload="none"
        id="alarm-audio"
        style={{ display: 'none' }}
      />
    </>
  );
}

function playAlarmSound() {
  // Generate a beep sound using Web Audio API (no external file needed)
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play a sequence of beeps for alarm effect
    const beepSequence = [0, 0.3, 0.6, 1.2, 1.5, 1.8];
    
    for (const startTime of beepSequence) {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startTime + 0.2);
      
      oscillator.start(audioCtx.currentTime + startTime);
      oscillator.stop(audioCtx.currentTime + startTime + 0.25);
    }

    // Vibrate if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300, 100, 300]);
    }
  } catch {
    // Web Audio API not available, try vibration only
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
  }
}
