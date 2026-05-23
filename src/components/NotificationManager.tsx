'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '../app/AppContext';
import { registerForPush } from '@/services/messaging';

const DAY_MAP = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getTodayDayKey() {
  return DAY_MAP[new Date().getDay()];
}

function parseTag(rawTag: string) {
  const tag = rawTag.replace(/-snooze$/, '');
  const parts = tag.split('-');
  if (parts.length < 3) return null;
  const offset = parts[0] === 'fg' || parts[0] === 'alarm' || parts[0] === 'snooze' ? 1 : 0;
  const medicineId = parts[offset];
  const scheduleTime = parts[offset + 1];
  const date = parts.slice(offset + 2).join('-');
  if (!medicineId || !scheduleTime || !date) return null;
  return { medicineId, scheduleTime, date };
}

const ACTIONS = [
  { action: 'taken', title: 'Ictim' },
  { action: 'skipped', title: 'Atla' },
  { action: 'snooze', title: '10dk Ertele' },
];

export default function NotificationManager() {
  const { user, medicines, dailyLogs, markTaken, markSkipped, markSnoozed } = useApp();
  const notifiedRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || user.isAdmin) return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      if (registration.active) {
        registration.active.postMessage({ type: 'SCHEDULE_NOTIFICATIONS', medicines });
      }
    }).catch(() => {});
  }, [medicines, user]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handler = (event: MessageEvent) => {
      const type = event.data?.type;
      const tag = event.data?.tag;
      if (!type || !tag) return;
      const parsed = parseTag(tag);
      if (!parsed) return;

      if (type === 'MEDICINE_TAKEN') {
        markTaken(parsed.medicineId, parsed.scheduleTime, parsed.date);
      }
      if (type === 'MEDICINE_SKIPPED') {
        markSkipped(parsed.medicineId, parsed.scheduleTime, parsed.date);
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [markTaken, markSkipped]);

  const checkMedicines = useCallback(() => {
    if (!user || user.isAdmin) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const today = getToday();
    const todayDay = getTodayDayKey();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const med of medicines) {
      if (!med.reminder) continue;
      if (!med.days.includes(todayDay as any)) continue;

      for (const schedTime of med.schedule) {
        const [h, m] = schedTime.split(':').map(Number);
        const schedMinutes = h * 60 + m;
        const diff = currentMinutes - schedMinutes;

        if (diff >= 0 && diff <= 2) {
          const notifKey = `${today}-${med.id}-${schedTime}`;
          if (notifiedRef.current.has(notifKey)) continue;
          notifiedRef.current.add(notifKey);

          const foodMsg = med.foodInstruction === 'Aç' ? '\nAc karnina alin.' : med.foodInstruction === 'Tok' ? '\nTok karnina alin.' : '';
          const dosageMsg = med.dosage ? `\nDozaj: ${med.dosage}` : '';

          if (med.reminderType === 'Alarm' || med.reminderType === 'İkisi de') {
            playAlarmSound();
          }

          if (med.reminderType === 'Bildirim' || med.reminderType === 'İkisi de') {
            navigator.serviceWorker?.ready.then(reg => {
              reg.showNotification(`Ilac: ${med.name} - ${schedTime}`, {
                body: `Ilac zamani geldi!${dosageMsg}${foodMsg}`,
                icon: '/icons/icon-192x192.png',
                tag: `fg-${med.id}-${schedTime}-${today}`,
                requireInteraction: true,
                vibrate: [300, 100, 300, 100, 300],
                actions: ACTIONS as any,
              } as any);
            });
          }

          if (med.reminderType === 'Alarm') {
            navigator.serviceWorker?.ready.then(reg => {
              reg.showNotification(`Alarm: ${med.name} - ${schedTime}`, {
                body: `Ilac alarm zamani!${dosageMsg}${foodMsg}`,
                icon: '/icons/icon-192x192.png',
                tag: `alarm-${med.id}-${schedTime}-${today}`,
                requireInteraction: true,
                vibrate: [500, 200, 500, 200, 500, 200, 500],
                actions: ACTIONS as any,
              } as any);
            });
          }
        }
      }
    }

    notifiedRef.current.forEach(key => {
      if (!key.startsWith(today)) notifiedRef.current.delete(key);
    });

    const nowDate = new Date();
    for (const log of dailyLogs.filter(l => l.status === 'snoozed')) {
      if (!log.snoozeNext) continue;
      const next = new Date(log.snoozeNext);
      if (nowDate < next) continue;

      const med = medicines.find(m => m.id === log.medicineId);
      if (!med) continue;
      if (med.reminderType === 'Alarm' || med.reminderType === 'İkisi de') playAlarmSound();

      const dosageMsg = med.dosage ? `\nDozaj: ${med.dosage}` : '';
      const foodMsg = med.foodInstruction === 'Aç' ? '\nAc karnina alin.' : med.foodInstruction === 'Tok' ? '\nTok karnina alin.' : '';

      navigator.serviceWorker?.ready.then(reg => {
        reg.showNotification(`Erteleme: ${med.name} - ${log.scheduleTime}`, {
          body: `Hatirlatma tekrarlandi.${dosageMsg}${foodMsg}`,
          icon: '/icons/icon-192x192.png',
          tag: `snooze-${med.id}-${log.scheduleTime}-${log.date}`,
          requireInteraction: true,
          vibrate: [300, 100, 300],
          actions: ACTIONS as any,
        } as any);
      });

      markSnoozed(log.medicineId, log.scheduleTime, log.date);
    }
  }, [user, medicines, dailyLogs, markSnoozed]);

  useEffect(() => {
    if (!user || user.isAdmin) return;
    registerForPush().catch(() => {});
    checkMedicines();
    intervalRef.current = setInterval(checkMedicines, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkMedicines, user]);

  return null;
}

function playAlarmSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const beepSequence = [0, 0.3, 0.6, 1.2, 1.5, 1.8];

    for (const startTime of beepSequence) {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startTime + 0.2);
      oscillator.start(audioCtx.currentTime + startTime);
      oscillator.stop(audioCtx.currentTime + startTime + 0.25);
    }

    if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300, 100, 300]);
  } catch {
    if ('vibrate' in navigator) navigator.vibrate([500, 200, 500, 200, 500]);
  }
}

