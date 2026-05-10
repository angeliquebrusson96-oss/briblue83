// ─── STOCKAGE PHOTOS DANS INDEXEDDB ─────────────────────────────────────────
// Évite de stocker les base64 dans Firestore (limite 1 Mo/document) et localStorage.
// Les photos restent sur l'appareil — accès instantané sans réseau.

const DB_NAME    = "briblue_photos";
const STORE_NAME = "photos";
const DB_VERSION = 1;

// Cache mémoire pour éviter des allers-retours IDB répétés
const _cache = new Map();

let _dbPromise = null;
function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("IDB absent")); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE_NAME);
    req.onsuccess  = e => resolve(e.target.result);
    req.onerror    = e => { _dbPromise = null; reject(e.target.error); };
  });
  return _dbPromise;
}

// ─── ÉCRITURE ────────────────────────────────────────────────────────────────
export async function savePhoto(key, dataUrl) {
  _cache.set(key, dataUrl);
  try {
    const db = await openDB();
    await new Promise((res, rej) => {
      const tx  = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(dataUrl, key);
      tx.oncomplete = res;
      tx.onerror    = e => rej(e.target.error);
    });
  } catch (e) {
    console.warn("[briblue] photoStore.savePhoto échoué:", e?.message);
  }
}

// ─── LECTURE ─────────────────────────────────────────────────────────────────
export async function loadPhoto(key) {
  if (_cache.has(key)) return _cache.get(key);
  try {
    const db = await openDB();
    const val = await new Promise((res, rej) => {
      const tx  = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => res(req.result || "");
      req.onerror   = e => rej(e.target.error);
    });
    if (val) _cache.set(key, val);
    return val;
  } catch {
    return "";
  }
}

// ─── RÉSOLUTION D'UNE VALEUR PHOTO ───────────────────────────────────────────
// Accepte indifféremment :
//   "idb:{key}"         → charge depuis IndexedDB
//   "data:image/..."    → base64 direct (ancien format)
//   "https://..."       → URL Firebase Storage ou autre
export async function resolvePhoto(value) {
  if (!value) return "";
  if (value.startsWith("idb:")) return loadPhoto(value.slice(4));
  return value;
}

// Version synchrone (depuis le cache mémoire uniquement)
export function resolvePhotoSync(value) {
  if (!value) return "";
  if (value.startsWith("idb:")) return _cache.get(value.slice(4)) || "";
  return value;
}

// Précharge une liste de valeurs photo dans le cache
export async function preloadPhotos(values) {
  await Promise.all(
    values.filter(v => v?.startsWith("idb:")).map(v => loadPhoto(v.slice(4)))
  );
}
