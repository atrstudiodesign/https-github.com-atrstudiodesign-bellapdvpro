import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';
import firebaseConfig from './firebaseConfig.json';

// Initialize Firebase App safely (prevent multiple instances in dev/HMR)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// App Check is opt-in until site key is configured and production verification is completed.
let appCheckInstance: AppCheck | null = null;
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY?.trim();
if (typeof window !== 'undefined' && appCheckSiteKey) {
  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn('[Firebase App Check] Initialization skipped:', error);
  }
}
export const appCheck = appCheckInstance;

// Safe initialization of Firebase Realtime Database
let rtdbInstance: Database | null = null;
try {
  if (firebaseConfig?.databaseURL) {
    rtdbInstance = getDatabase(app, firebaseConfig.databaseURL);
  } else {
    rtdbInstance = getDatabase(app);
  }
} catch (error) {
  console.warn(
    '[Firebase RTDB] Realtime Database não inicializado ou indisponível no projeto atual:',
    error instanceof Error ? error.message : error
  );
}

export const rtdb = rtdbInstance as Database;
export const database = rtdbInstance as Database;
