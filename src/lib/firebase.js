import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

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

// ─── NOUVELLE STRUCTURE FIRESTORE ───────────────────────────────────────────
// Chaque type de données a son propre document dans la collection "briblue".
// Avant : tout dans briblue/app_data (un seul document illisible, limite 1 Mo)
// Après : un document par type, lisible dans la console Firebase
export const DOCS = {
  clients:       doc(db, "briblue", "clients"),       // { data: [...clients] }
  passages:      doc(db, "briblue", "passages"),      // { data: [...passages] }
  rdvs:          doc(db, "briblue", "rdvs"),          // { data: [...rdvs] }
  livraisons:    doc(db, "briblue", "livraisons"),    // { data: [...livraisons] }
  contrats:      doc(db, "briblue", "contrats"),      // { data: {...contrats} }
  client_photos: doc(db, "briblue", "client_photos"), // { [clientId]: "data:..." } — fallback photos piscine
  stock:      doc(db, "briblue", "stock"),      // { data: {...stock} }
  meta:       doc(db, "briblue", "meta"),       // { notes, versements, retards }
  // Legacy — conservé pour la migration automatique au 1er démarrage
  app_data:   doc(db, "briblue", "app_data"),
};

// Mapping clé localStorage → document + champ Firestore
export const KEY_MAP = {
  "bb_clients_v2":           { doc: "clients",    field: "data" },
  "bb_passages_v2":          { doc: "passages",   field: "data" },
  "bb_deleted_passages_v1":  { doc: "passages",   field: "deletedIds" }, // IDs des passages supprimés (tombstones)
  "bb_rdvs_v1":              { doc: "rdvs",       field: "data" },
  "bb_livraisons_v1":        { doc: "livraisons", field: "data" },
  "bb_contrats_v1":          { doc: "contrats",   field: "data" },
  "bb_stock_v1":             { doc: "stock",      field: "data" },
  "bb_versements_v1":        { doc: "meta",       field: "versements" },
  "bb_retards_carnet_v1":    { doc: "meta",       field: "retards" },
  "bb_notes_v1":             { doc: "meta",       field: "notes" },
};

// URLs REST Firestore par document (pour iOS — le SDK peut être tué en arrière-plan)
const _projectId = firebaseConfig.projectId;
const _restBase = `https://firestore.googleapis.com/v1/projects/${_projectId}/databases/(default)/documents/briblue/`;
export const REST_URLS = {
  clients:    _restBase + "clients",
  passages:   _restBase + "passages",
  rdvs:       _restBase + "rdvs",
  livraisons: _restBase + "livraisons",
  contrats:   _restBase + "contrats",
  stock:      _restBase + "stock",
  meta:       _restBase + "meta",
};

// Legacy (gardé pour compatibilité avec les imports existants dans photoStore.js etc.)
export const APP_DOC = DOCS.app_data;
export const FIRESTORE_REST_URL = _restBase + "app_data";

// Bucket public pour construire les URLs Firebase Storage sans token (lecture publique)
export const STORAGE_BUCKET = firebaseConfig.storageBucket;

export default firebaseApp;
