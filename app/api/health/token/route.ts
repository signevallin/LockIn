export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
  }

  const token = crypto.randomUUID();
  const db = getAdminDb();

  await db.collection('healthSyncTokens').doc(token).set({
    uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  await db
    .collection('users')
    .doc(uid)
    .collection('health_goals')
    .doc('goals')
    .set({ healthSyncToken: token }, { merge: true });

  return NextResponse.json({ token });
}
