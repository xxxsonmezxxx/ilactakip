'use client';

import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

function normalizeEmail(email?: string | null) {
  return (email ?? '').trim().toLowerCase();
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function registerWebPushSubscription(email?: string | null) {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !db) return null;
  if (!('Notification' in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const publicKey =
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ??
    'BNTeD0LPbWaaCB3HYbmazx5eG0PiQyPzoF4RtnjTcMWXlaIpyyfTieDDFuo188bORZtUC2nQt_zSY3-flP1PgPU';
  if (!publicKey) {
    console.warn('NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY eksik, web push aboneliği atlandı.');
    return null;
  }

  const reg = await navigator.serviceWorker.ready;
  const appServerKey = urlBase64ToUint8Array(publicKey);
  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey,
    }));

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return sub;

  const safeId = normalizedEmail.replace(/\./g, ',');
  await setDoc(
    doc(db, 'pushSubscriptions', safeId),
    {
      email: normalizedEmail,
      subscription: sub.toJSON(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return sub;
}
