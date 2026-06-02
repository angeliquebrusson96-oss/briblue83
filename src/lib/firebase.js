import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ─── CONFIG FIREBASE ──────────────────────────────────────────────────────────
// Les valeurs proviennent de .env.local (gitignore) via les variables VITE_*.
// Note : pour Firebase, l'apiKey est un identifiant PUBLIC — il n'est pas un
// secret. La sécurité réelle est assurée par les Firebase Security Rules et
// la restriction du domaine dans Google Cloud Console.
// → Console Firebase > Paramètres > Restreindre la clé API à votre domaine.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FB_API_KEY,
  authDomain:        import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID,
  appId:             import.meta.env.VITE_FB_APP_ID,
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db      = getFirestore(firebaseApp);
export const auth    = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);
export const APP_DOC = doc(db, "briblue", "app_data");

export const FIRESTORE_REST_URL =
  `https://firestore.googleapis.com/v1/projects/${import.meta.env.VITE_FB_PROJECT_ID}` +
  `/databases/(default)/documents/briblue/app_data`;

export default firebaseApp;
