// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDemoKeyReplace',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'rpgbenarcade.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'rpgbenarcade',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'rpgbenarcade.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '0',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '0',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ?? 'https://rpgbenarcade-default-rtdb.firebaseio.com',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const rtdb = getDatabase(firebaseApp);
