import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) });
const db = getFirestore();

const snap = await db.collection('users').get();
console.log(`Antal users: ${snap.size}`);
for (const doc of snap.docs) {
  const data = doc.data();
  console.log(`  ${doc.id}:`, JSON.stringify(data, null, 2));
}
