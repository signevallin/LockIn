import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

function ensureApp(): void {
  if (!getApps().length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set');
    initializeApp({ credential: cert(JSON.parse(key)) });
  }
}

let _auth: Auth | null = null;
function getAdminAuth(): Auth {
  if (_auth) return _auth;
  ensureApp();
  _auth = getAuth();
  return _auth;
}

let _db: Firestore | null = null;
export function getAdminDb(): Firestore {
  if (_db) return _db;
  ensureApp();
  _db = getFirestore();
  return _db;
}

export const adminAuth = {
  verifyIdToken: (token: string) => getAdminAuth().verifyIdToken(token),
};
