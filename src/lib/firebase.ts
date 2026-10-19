import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';
import firebaseConfig from './firebaseConfig.json';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

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
