import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredKeys: Array<keyof typeof firebaseConfig> = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "appId",
];

const missing = requiredKeys.filter((key) => !firebaseConfig[key]);
if (missing.length > 0) {
  throw new Error(
    `Firebase の環境変数が不足しています: ${missing.join(
      ", "
    )} を .env.local に設定してください。`
  );
}

const normalizedBucket = firebaseConfig.storageBucket!.replace(/^gs:\/\//, "");
const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        ...firebaseConfig,
        storageBucket: normalizedBucket,
      });

export const firebaseApp = app;
export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app, `gs://${normalizedBucket}`);
