#!/usr/bin/env node
// Generates public/firebase-messaging-sw.js with real Firebase config values.
// Runs before `next build` so Vercel picks up the injected values.

const fs = require('fs');
const path = require('path');

const {
  NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID,
} = process.env;

const missing = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
].filter(k => !process.env[k]);

if (missing.length) {
  console.warn(`[generate-firebase-sw] Warning: missing env vars: ${missing.join(', ')}. SW will use placeholders.`);
}

const content = `importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '${NEXT_PUBLIC_FIREBASE_API_KEY || ''}',
  authDomain: '${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}',
  projectId: '${NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}',
  storageBucket: '${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}',
  messagingSenderId: '${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}',
  appId: '${NEXT_PUBLIC_FIREBASE_APP_ID || ''}',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  // Messages are sent as data-only to avoid FCM auto-showing a duplicate.
  // Read title/body from payload.data.
  const title = (payload.data && payload.data.title) ? payload.data.title : 'LockIn';
  const body = (payload.data && payload.data.body) ? payload.data.body : '';
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });
});
`;

const outPath = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.js');
fs.writeFileSync(outPath, content, 'utf8');
console.log('[generate-firebase-sw] Written:', outPath);
