// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDn_6rJs8HBfMGxsPRhYgOTuvEkS8rZs9I',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'rpgben-arcade.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'rpgben-arcade',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'rpgben-arcade.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '241267491437',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:241267491437:web:6f49e6eac532e8db0bf564',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ?? 'https://rpgben-arcade-default-rtdb.firebaseio.com',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const rtdb = getDatabase(firebaseApp);
