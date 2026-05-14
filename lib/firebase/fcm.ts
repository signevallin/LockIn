import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from './config';

export async function requestNotificationPermission(userId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'),
  });

  if (token) {
    await setDoc(doc(db, 'users', userId), { fcmToken: token }, { merge: true });
  }
  return !!token;
}

export function setupForegroundMessages(onReceive: (payload: unknown) => void) {
  if (typeof window === 'undefined') return;
  const messaging = getMessaging(app);
  return onMessage(messaging, onReceive);
}
