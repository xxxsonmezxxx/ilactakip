import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { db, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function registerForPush(vapidKey?: string) {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  try {
    // Check if messaging is supported in this browser first
    const supported = await isSupported();
    if (!supported) return null;
    if (!db || !auth) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const messaging = getMessaging();
    const key = vapidKey || process.env.NEXT_PUBLIC_VAPID_KEY || '';
    if (!key) {
      console.warn('VAPID_KEY not configured, skipping push registration');
      return null;
    }

    const token = await getToken(messaging, { vapidKey: key });
    if (!token) return null;

    // Save token to Firestore under users/{uid}/fcmTokens/{token}
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, 'users', user.uid, 'fcmTokens', token), {
        token,
        createdAt: new Date().toISOString(),
      });
    }

    // Listen for foreground messages (optional)
    onMessage(messaging, (payload) => {
      console.log('FCM foreground message', payload);
    });

    return token;
  } catch (err) {
    console.error('registerForPush error (non-critical):', err);
    return null;
  }
}
