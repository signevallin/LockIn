// Temporary test script — skickar en push-notis till alla användare med FCM-token
// Kör med: node --env-file=.env.local scripts/test-push.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!key) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY saknas i .env.local');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(key)) });

const db = getFirestore();
const messaging = getMessaging();

const usersSnap = await db.collection('users').get();
console.log(`Hittade ${usersSnap.size} användare`);

let sent = 0;
for (const userDoc of usersSnap.docs) {
  const token = userDoc.data()?.fcmToken;
  if (!token) {
    console.log(`  ${userDoc.id}: inget FCM-token lagrat`);
    continue;
  }
  try {
    await messaging.send({
      token,
      notification: {
        title: 'LockIn 🔒',
        body: 'Testnotis — push-notiser fungerar!',
      },
    });
    console.log(`  ✅ Skickad till ${userDoc.id}`);
    sent++;
  } catch (err) {
    console.error(`  ❌ Misslyckades för ${userDoc.id}:`, err.message);
  }
}

console.log(`\nFärdigt — ${sent}/${usersSnap.size} notiser skickade.`);
