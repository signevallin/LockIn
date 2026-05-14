importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Replace these with your actual Firebase config values from .env.local
firebase.initializeApp({
  apiKey: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_APP_ID',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const notification = payload.notification ?? {};
  const title = notification.title ?? 'LockIn';
  const body = notification.body ?? '';
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });
});
