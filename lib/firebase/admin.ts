import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let _auth: Auth | null = null;

function getAdminAuth(): Auth {
  if (_auth) return _auth;
  if (!getApps().length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set');
    initializeApp({ credential: cert(JSON.parse(key)) });
  }
  _auth = getAuth();
  return _auth;
}

export const adminAuth = {
  verifyIdToken: (token: string) => getAdminAuth().verifyIdToken(token),
};
