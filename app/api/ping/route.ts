export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

// Lightweight warm-up endpoint. Initialises Firebase Admin so the subsequent
// /api/health/sync call doesn't hit a cold-start timeout.
export async function GET() {
  try {
    getAdminDb(); // initialise — ignore the result
  } catch {
    // still return 200 so the shortcut doesn't abort
  }
  return NextResponse.json({ ok: true });
}
