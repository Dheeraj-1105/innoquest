import { getApps, initializeApp, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

let initialized = false;

export async function initializeServerApp() {
  // If already successfully initialized, return existing instance
  if (initialized && getApps().length > 0) {
    return { firestore: getFirestore(getApp()) };
  }

  // Try service account first (local development)
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountStr && serviceAccountStr.trim().length > 2) {
    try {
      // If app is not yet initialized, create it
      if (!getApps().length) {
        const serviceAccount = JSON.parse(serviceAccountStr);
        const serverApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: firebaseConfig.projectId,
        });
        initialized = true;
        return { firestore: getFirestore(serverApp) };
      }
      // App already initialized (possibly by a previous request attempt)
      initialized = true;
      return { firestore: getFirestore(getApp()) };
    } catch (e) {
      console.error('Firebase Admin: Service account initialization failed:', e);
      throw new Error('Firebase Admin SDK could not be initialized with the provided service account.');
    }
  }

  // Fallback: try App Hosting automatic initialization (production/Cloud Run)
  try {
    if (!getApps().length) {
      const serverApp = initializeApp({ projectId: firebaseConfig.projectId });
      initialized = true;
      return { firestore: getFirestore(serverApp) };
    }
    initialized = true;
    return { firestore: getFirestore(getApp()) };
  } catch (e) {
    console.error(
      'Firebase Admin: Auto-initialization failed. Set FIREBASE_SERVICE_ACCOUNT in your .env file.',
      e
    );
    throw new Error(
      'Firebase Admin SDK could not be initialized. Make sure FIREBASE_SERVICE_ACCOUNT is set in your .env file.'
    );
  }
}
