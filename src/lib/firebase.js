import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCyRHh4hGaDYU1NumTrRJ-3KKuRxC8NU5k",
  authDomain: "briblue-729de.firebaseapp.com",
  projectId: "briblue-729de",
  storageBucket: "briblue-729de.firebasestorage.app",
  messagingSenderId: "683737993436",
  appId: "1:683737993436:web:090e2615396d08c75fe419"
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db      = getFirestore(firebaseApp);
export const auth    = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);
export const APP_DOC = doc(db, "briblue", "app_data");

export const FIRESTORE_REST_URL =
  `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}` +
  `/databases/(default)/documents/briblue/app_data`;

export default firebaseApp;
