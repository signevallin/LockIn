import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from './config';

export async function requestNotificationPermission(userId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  // Explicitly register (or reuse) the Firebase messaging service worker
  let swReg: ServiceWorkerRegistration | undefined;
  try {
    swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
  } catch (err) {
    console.error('[FCM] SW registration failed:', err);
    // Fall through — getToken may still work without an explicit registration
  }

  const messaging = getMessaging(app);
  let token: string | null = null;
  try {
    token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      ...(swReg ? { serviceWorkerRegistration: swReg } : {}),
    });
    if (token) {
      await setDoc(doc(db, 'users', userId), { fcmToken: token }, { merge: true });
      console.log('[FCM] Token saved for user', userId);
    } else {
      console.warn('[FCM] getToken returned empty — check VAPID key and SW config');
    }
  } catch (err) {
    console.error('[FCM] getToken failed:', err);
    throw err;
  }
  return !!token;
}

export function setupForegroundMessages(onReceive: (payload: unknown) => void) {
  if (typeof window === 'undefined') return;
  const messaging = getMessaging(app);
  return onMessage(messaging, onReceive);
}
