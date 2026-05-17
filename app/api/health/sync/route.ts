export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { token, steps, totalCalories, workoutMinutes, date } = body as {
    token?: string;
    steps?: number;
    totalCalories?: number;
    workoutMinutes?: number;
    date?: string;
  };

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }
  if (
    typeof steps !== 'number' ||
    typeof totalCalories !== 'number' ||
    typeof workoutMinutes !== 'number'
  ) {
    return NextResponse.json({ error: 'Missing health metrics' }, { status: 400 });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  const db = getAdminDb();
  const tokenDoc = await db.collection('healthSyncTokens').doc(token).get();
  if (!tokenDoc.exists) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const uid = (tokenDoc.data() as { uid: string }).uid;
  await db
    .collection('users')
    .doc(uid)
    .collection('health_data')
    .doc(date)
    .set({ steps, totalCalories, workoutMinutes, syncedAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ ok: true });
}
