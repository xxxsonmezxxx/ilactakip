'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useApp, isMedicineDueOnDate } from '../app/AppContext';
import { registerForPush } from '@/services/messaging';
import { registerWebPushSubscription } from '@/services/webPush';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
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
  { action: 'taken', title: 'İçtim' },
  { action: 'skipped', title: 'Atla' },
  { action: 'snooze', title: 'Hatırlat' },
];

export default function NotificationManager() {
  const { user, medicines, dailyLogs, markTaken, markSkipped, markSnoozed } = useApp();
  const notifiedRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || user.isAdmin) return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      if (registration.active) registration.active.postMessage({ type: 'SCHEDULE_NOTIFICATIONS', medicines });
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

      if (type === 'MEDICINE_TAKEN') markTaken(parsed.medicineId, parsed.scheduleTime, parsed.date);
      if (type === 'MEDICINE_SKIPPED') markSkipped(parsed.medicineId, parsed.scheduleTime, parsed.date);
      if (type === 'MEDICINE_SNOOZE') markSnoozed(parsed.medicineId, parsed.scheduleTime, parsed.date);
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [markTaken, markSkipped, markSnoozed]);

  const checkMedicines = useCallback(() => {
    if (!user || user.isAdmin) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const today = getToday();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const med of medicines) {
      if (!med.reminder) continue;
      if (!isMedicineDueOnDate(med, today)) continue;

      for (const schedTime of med.schedule) {
        const [h, m] = schedTime.split(':').map(Number);
        const schedMinutes = h * 60 + m;
        const diff = currentMinutes - schedMinutes;
        if (diff < 0 || diff > 2) continue;

        const notifKey = `${today}-${med.id}-${schedTime}`;
        if (notifiedRef.current.has(notifKey)) continue;
        notifiedRef.current.add(notifKey);

        const foodMsg = med.foodInstruction === 'Aç' ? '\nAç karnına alın.' : med.foodInstruction === 'Tok' ? '\nTok karnına alın.' : '';
        const dosageMsg = med.dosage ? `\nDozaj: ${med.dosage}` : '';

        navigator.serviceWorker?.ready.then((reg) => {
          reg.showNotification(`💊 ${med.name} - ${schedTime}`, {
            body: `İlaç zamanı geldi!${dosageMsg}${foodMsg}`,
            icon: '/icons/icon-192x192.png',
            tag: `fg-${med.id}-${schedTime}-${today}`,
            requireInteraction: true,
            vibrate: [300, 100, 300],
            actions: ACTIONS as any,
          } as any);
        });
      }
    }

    notifiedRef.current.forEach((key) => {
      if (!key.startsWith(today)) notifiedRef.current.delete(key);
    });

    const nowDate = new Date();
    for (const log of dailyLogs.filter((l) => l.status === 'snoozed')) {
      if (!log.snoozeNext) continue;
      if (nowDate < new Date(log.snoozeNext)) continue;

      const med = medicines.find((m) => m.id === log.medicineId);
      if (!med) continue;

      const dosageMsg = med.dosage ? `\nDozaj: ${med.dosage}` : '';
      const foodMsg = med.foodInstruction === 'Aç' ? '\nAç karnına alın.' : med.foodInstruction === 'Tok' ? '\nTok karnına alın.' : '';

      navigator.serviceWorker?.ready.then((reg) => {
        reg.showNotification(`🔔 Hatırlatma: ${med.name} - ${log.scheduleTime}`, {
          body: `İlaç tekrar hatırlatılıyor.${dosageMsg}${foodMsg}`,
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
    registerForPush(user.email).catch(() => {});
    registerWebPushSubscription(user.email).catch(() => {});
    checkMedicines();
    intervalRef.current = setInterval(checkMedicines, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkMedicines, user]);

  return null;
}
