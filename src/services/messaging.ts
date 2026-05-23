import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function registerForPush(vapidKey?: string) {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: vapidKey || (process.env.NEXT_PUBLIC_VAPID_KEY as string) });
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
    console.error('registerForPush error', err);
    return null;
  }
}
