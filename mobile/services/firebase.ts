import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "bellapdv-15ae0",
  appId: "1:900779146185:android:46245c0db76fee7a640618",
  apiKey: "AIzaSyABIrHCQUQPPGAkQlm1xv-B2A71YgO-TJ0",
  authDomain: "bellapdv-15ae0.firebaseapp.com",
  storageBucket: "bellapdv-15ae0.firebasestorage.app",
  messagingSenderId: "900779146185"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
