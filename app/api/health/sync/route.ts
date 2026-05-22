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

  const { token, steps, totalCalories, workoutMinutes, date, weight: rawWeight, weightTenths } = body as {
    token?: string;
    steps?: number;
    totalCalories?: number;
    workoutMinutes?: number;
    date?: string;
    weight?: number | string;
    weightTenths?: number; // integer shortcut: send kg×10, e.g. 959 = 95.9 kg
  };

  // Parse weight: prefer weightTenths (integer, no locale issues), then number/string
  let weight: number | undefined;
  if (typeof weightTenths === 'number' && weightTenths > 0) {
    weight = weightTenths / 10;
  } else if (typeof rawWeight === 'number' && rawWeight > 0) {
    weight = rawWeight;
  } else if (typeof rawWeight === 'string' && rawWeight.trim().length > 0) {
    const normalized = rawWeight.trim().replace(',', '.');
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed) && parsed > 0) weight = parsed;
  }

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

  const payload: Record<string, unknown> = {
    steps,
    totalCalories,
    workoutMinutes,
    syncedAt: FieldValue.serverTimestamp(),
  };
  if (typeof weight === 'number' && weight > 0) payload.weight = Math.round(weight * 10) / 10;

  await db
    .collection('users')
    .doc(uid)
    .collection('health_data')
    .doc(date)
    .set(payload);

  return NextResponse.json({ ok: true });
}
