import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ─── CONFIG FIREBASE ──────────────────────────────────────────────────────────
// Les variables VITE_FB_* viennent de .env.local (gitignore, développement local).
// En production (Vercel), configurer ces variables dans les Project Settings.
// Les valeurs hardcodées ci-dessous servent de fallback si les env vars sont absentes.
// Note : l'apiKey Firebase est un identifiant PUBLIC — pas un secret.
// La sécurité réelle repose sur les Firebase Security Rules et la restriction de
// domaine dans Google Cloud Console.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FB_API_KEY            || "AIzaSyCyRHh4hGaDYU1NumTrRJ-3KKuRxC8NU5k",
  authDomain:        import.meta.env.VITE_FB_AUTH_DOMAIN        || "briblue-729de.firebaseapp.com",
  projectId:         import.meta.env.VITE_FB_PROJECT_ID         || "briblue-729de",
  storageBucket:     import.meta.env.VITE_FB_STORAGE_BUCKET     || "briblue-729de.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID          || "683737993436",
  appId:             import.meta.env.VITE_FB_APP_ID             || "1:683737993436:web:090e2615396d08c75fe419",
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
