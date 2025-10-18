import { getApps, initializeApp, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export async function initializeServerApp() {
  if (!getApps().length) {
    try {
      // When deployed to App Hosting, the GOOGLE_APPLICATION_CREDENTIALS
      // environment variable is automatically set.
      return initializeApp();
    } catch (e) {
      // If it fails, we are likely in a local development environment.
      // In this case, we use a service account to initialize.
      // This is automatically created and configured for you by Firebase Studio.
      try {
        const serviceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT as string
        );
        const serverApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: firebaseConfig.projectId,
        });

        return {
          firestore: getFirestore(serverApp),
        };
      } catch (innerError) {
        console.error(
          "Couldn't initialize Firebase Admin SDK. Make sure you have the FIREBASE_SERVICE_ACCOUNT environment variable set with the content of your service account JSON file.",
          innerError
        );
        throw innerError;
      }
    }
  }

  // If already initialized, return the Firestore instance with the default app.
  return {
    firestore: getFirestore(getApp()),
  };
}
