// ─── STOCKAGE PHOTOS ─────────────────────────────────────────────────────────
// Priorité : Firebase Storage (cloud, multi-appareil) → IDB (local) → localStorage fallback
//
// Flux d'écriture (extractPassagePhotos) :
//   data:base64 → upload Firebase Storage → URL https://...
//   Si upload échoue : IDB local → idb:key
//   Si IDB échoue aussi : garde le base64 (mieux que rien)
//
// Flux de lecture (resolvePhoto) :
//   https://...   → URL directe (fonctionne sur tous les appareils)
//   idb:key       → IDB, puis fallback localStorage
//   data:...      → base64 direct (ancien format)

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

// ─── INDEXEDDB ───────────────────────────────────────────────────────────────
const DB_NAME    = "briblue_photos";
const STORE_NAME = "photos";
const DB_VERSION = 1;
const _cache     = new Map();

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

// ─── FALLBACK LOCALSTORAGE ───────────────────────────────────────────────────
const LS_PREFIX = "bb_ph_";

function compressFallback(dataUrl) {
  return new Promise(resolve => {
    if (!dataUrl?.startsWith("data:image/")) { resolve(dataUrl); return; }
    const img = new Image();
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      const MAX = 400;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const c = document.createElement("canvas");
      c.width = width; c.height = height;
      c.getContext("2d").drawImage(img, 0, 0, width, height);
      try { resolve(c.toDataURL("image/jpeg", 0.6)); } catch { resolve(dataUrl); }
    };
    img.src = dataUrl;
  });
}

function saveFallback(key, dataUrl) {
  compressFallback(dataUrl).then(thumb => {
    try { localStorage.setItem(LS_PREFIX + key, thumb); } catch { /* quota */ }
  });
}

function loadFallback(key) {
  try { return localStorage.getItem(LS_PREFIX + key) || ""; } catch { return ""; }
}

// ─── UPLOAD FIREBASE STORAGE ─────────────────────────────────────────────────
// Convertit un data:base64 en Blob et l'upload dans Storage.
// Retourne l'URL de téléchargement publique (https://...) ou null si échec/timeout.
const UPLOAD_TIMEOUT_MS = 8000; // 8 s max — ne pas bloquer l'enregistrement

async function uploadToStorage(key, dataUrl) {
  // Ne pas tenter si pas de connexion ou pas d'utilisateur Firebase (auth anonyme)
  if (!navigator.onLine) return null;
  if (!auth.currentUser) {
    // Attendre max 3 s que l'auth anonyme soit prête
    try {
      await Promise.race([
        new Promise(res => {
          const unsub = auth.onAuthStateChanged(u => { if (u) { unsub(); res(); } });
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("auth timeout")), 3000)),
      ]);
    } catch { return null; }
  }
  if (!auth.currentUser) return null;

  try {
    const [header, b64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });

    const storageRef = ref(storage, `photos/${key}.jpg`);
    const uploadPromise = uploadBytes(storageRef, blob, { contentType: "image/jpeg" })
      .then(() => getDownloadURL(storageRef));
    const timeout = new Promise((_, rej) =>
      setTimeout(() => rej(new Error("upload timeout")), UPLOAD_TIMEOUT_MS)
    );
    const url = await Promise.race([uploadPromise, timeout]);
    return url;
  } catch (e) {
    console.warn("[briblue] uploadToStorage échoué:", e?.message);
    return null;
  }
}

// ─── ÉCRITURE IDB (fallback si Storage indisponible) ─────────────────────────
export async function savePhoto(key, dataUrl) {
  _cache.set(key, dataUrl);
  saveFallback(key, dataUrl);
  try {
    const db = await openDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(dataUrl, key);
      tx.oncomplete = res;
      tx.onerror = e => rej(e.target.error);
    });
    return true;
  } catch (e) {
    console.warn("[briblue] savePhoto IDB échoué:", e?.message);
    return false;
  }
}

// ─── LECTURE IDB ─────────────────────────────────────────────────────────────
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
    if (val) {
      _cache.set(key, val);
      if (!loadFallback(key)) saveFallback(key, val);
      return val;
    }
  } catch { /* IDB indisponible */ }
  // Fallback localStorage (vignette 400 px)
  const fb = loadFallback(key);
  if (fb) { _cache.set(key, fb); return fb; }
  return "";
}

// ─── RÉSOLUTION D'UNE VALEUR PHOTO ───────────────────────────────────────────
export async function resolvePhoto(value) {
  if (!value) return "";
  if (value.startsWith("idb:")) return loadPhoto(value.slice(4));
  // https:// ou data: → retourné directement
  return value;
}

export function resolvePhotoSync(value) {
  if (!value) return "";
  if (value.startsWith("idb:")) return _cache.get(value.slice(4)) || "";
  return value;
}

export async function preloadPhotos(values) {
  await Promise.all(
    values.filter(v => v?.startsWith("idb:")).map(v => loadPhoto(v.slice(4)))
  );
}

// ─── MIGRATION PHOTOS D'UN PASSAGE ──────────────────────────────────────────
// Ordre de priorité pour chaque photo base64 :
//   1. Upload Firebase Storage → URL https:// (cloud, multi-appareil)
//   2. IDB local → idb:key (même appareil, si hors-ligne)
//   3. Garde le base64 (dernier recours)
const _SINGLE = ["photoArrivee", "photoDepart"];
const _ARRAYS = ["photos", "photosDepart"];

async function migrateOnePhoto(dataUrl, key) {
  // 1. Essayer Firebase Storage (cloud)
  const storageUrl = await uploadToStorage(key, dataUrl);
  if (storageUrl) return storageUrl;
  // 2. Fallback IDB local
  const ok = await savePhoto(key, dataUrl);
  if (ok) return `idb:${key}`;
  // 3. Garder le base64
  return dataUrl;
}

// Migre une clé idb: existante vers Firebase Storage si possible
async function migrateIdbToStorage(idbKey) {
  const key = idbKey.slice(4); // retirer "idb:"
  const dataUrl = await loadPhoto(key);
  if (!dataUrl) return idbKey; // IDB vide, impossible de migrer
  const storageUrl = await uploadToStorage(key, dataUrl);
  return storageUrl || idbKey; // Si upload échoue, garder idb:
}

export async function extractPassagePhotos(passage) {
  if (!passage?.id) return passage;
  const p = { ...passage };
  for (const field of _SINGLE) {
    if (p[field]?.startsWith("data:")) {
      // base64 → Storage (ou IDB si hors-ligne)
      const key = `${p.id}_${field}`;
      p[field] = await migrateOnePhoto(p[field], key);
    } else if (p[field]?.startsWith("idb:")) {
      // idb: existant → tenter migration vers Storage
      p[field] = await migrateIdbToStorage(p[field]);
    }
  }
  for (const field of _ARRAYS) {
    if (!Array.isArray(p[field])) continue;
    p[field] = await Promise.all(
      p[field].map(async (v, i) => {
        if (v?.startsWith("data:")) {
          const key = `${p.id}_${field}_${i}`;
          return migrateOnePhoto(v, key);
        } else if (v?.startsWith("idb:")) {
          return migrateIdbToStorage(v);
        }
        return v;
      })
    );
  }
  return p;
}
