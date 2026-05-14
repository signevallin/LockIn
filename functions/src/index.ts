import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

const todayKey = () => new Date().toISOString().split('T')[0];

async function sendToUser(userId: string, title: string, body: string) {
  const userDoc = await db.doc(`users/${userId}`).get();
  const token = userDoc.data()?.fcmToken as string | undefined;
  if (!token) return;
  await messaging.send({ token, notification: { title, body } });
}

// Kl 20:00 varje dag — påminnelse om incheckning
export const dailyCheckInReminder = functions.pubsub
  .schedule('0 20 * * *')
  .timeZone('Europe/Stockholm')
  .onRun(async () => {
    const today = todayKey();
    const usersSnap = await db.collection('users').get();
    await Promise.all(usersSnap.docs.map(async userDoc => {
      const checkIn = await db.doc(`users/${userDoc.id}/check_ins/${today}`).get();
      if (!checkIn.exists) {
        await sendToUser(userDoc.id, 'LockIn 📋', 'Du har inte checkat in idag. Hur mår du?');
      }
    }));
  });

// Kl 09:00 varje dag — milstolpe idag
export const milestoneCheck = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('Europe/Stockholm')
  .onRun(async () => {
    const today = todayKey();
    const usersSnap = await db.collection('users').get();
    await Promise.all(usersSnap.docs.map(async userDoc => {
      const uid = userDoc.id;
      const promisesSnap = await db.collection(`users/${uid}/promises`)
        .where('status', '==', 'active').get();
      for (const promDoc of promisesSnap.docs) {
        const milestones: { date: admin.firestore.Timestamp; completed: boolean; label: string }[] =
          promDoc.data().milestones ?? [];
        for (const ms of milestones) {
          const msDate = ms.date.toDate().toISOString().split('T')[0];
          if (msDate === today && !ms.completed) {
            await sendToUser(uid, 'LockIn 🏆', `Milstolpe idag: ${ms.label} för "${promDoc.data().title as string}"`);
          }
        }
      }
    }));
  });

// Kl 21:00 varje dag — streak i fara
export const streakWarning = functions.pubsub
  .schedule('0 21 * * *')
  .timeZone('Europe/Stockholm')
  .onRun(async () => {
    const today = todayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const usersSnap = await db.collection('users').get();
    await Promise.all(usersSnap.docs.map(async userDoc => {
      const uid = userDoc.id;
      const todayComp = await db.doc(`users/${uid}/task_completions/${today}`).get();
      const yesterdayComp = await db.doc(`users/${uid}/task_completions/${yesterday}`).get();
      if (!todayComp.exists && yesterdayComp.exists) {
        await sendToUser(uid, 'LockIn 🔥', 'Din streak är i fara! Slutför en uppgift idag.');
      }
    }));
  });
