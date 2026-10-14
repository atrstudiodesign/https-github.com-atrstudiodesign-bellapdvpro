import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0731708491",
  appId: "1:564684497286:web:83bddf5e91ca0b49c5cc07",
  apiKey: "AIzaSyDQwlGEyL__yS31Ay3zDax6qoTckd04ub8",
  authDomain: "gen-lang-client-0731708491.firebaseapp.com",
  storageBucket: "gen-lang-client-0731708491.firebasestorage.app",
  messagingSenderId: "564684497286"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-508781f5-edff-4cd1-bffa-1334db3e7e39");
export const auth = getAuth(app);
