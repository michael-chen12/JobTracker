import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

// Initialize Firebase Admin SDK (server-side only)
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // Initialize with service account credentials
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    adminApp = getApps()[0]!;
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);

  return { adminApp, adminAuth, adminDb, adminStorage };
}

// Export initialized instances
export function getAdminApp() {
  if (!adminApp) {
    initializeFirebaseAdmin();
  }
  return adminApp;
}

export function getAdminAuth() {
  if (!adminAuth) {
    initializeFirebaseAdmin();
  }
  return adminAuth;
}

export function getAdminDb() {
  if (!adminDb) {
    initializeFirebaseAdmin();
  }
  return adminDb;
}

export function getAdminStorage() {
  if (!adminStorage) {
    initializeFirebaseAdmin();
  }
  return adminStorage;
}

// Verify ID token (used in middleware)
export async function verifyIdToken(token: string) {
  const auth = getAdminAuth();
  return auth.verifyIdToken(token);
}
