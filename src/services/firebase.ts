import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyCWvii9pb_R4yOBGz9-ma88Fn9_6_TX7-c",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "ilactakip-208db.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "ilactakip-208db",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "ilactakip-208db.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "1007114525383",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:1007114525383:web:cc48d508b50fa0511dfce2",
};

function hasFirebaseEnv() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (hasFirebaseEnv()) {
  app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else if (typeof window !== "undefined") {
  console.warn(
    "Firebase env missing on client. App will continue in local/offline mode without cloud sync."
  );
}

export { app, db, auth };
