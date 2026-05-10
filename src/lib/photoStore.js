// ─── STOCKAGE PHOTOS ─────────────────────────────────────────────────────────
// Flux de SAUVEGARDE (extractPassagePhotos) : IDB local uniquement → instantané.
// Flux de MIGRATION (migratePassagePhotosToStorage) : Firebase Storage en arrière-plan.
//   → appelé après la sauvegarde, sans bloquer l'interface.
//   → remplace les idb:keys par des URL https:// accessibles sur tous les appareils.
// Flux de LECTURE (resolvePhoto / PhotoImg) :
//   https:// → URL directe (multi-appareil)
//   idb:key  → IDB, puis fallback localStorage (400 px — survit à la purge iOS)
//   data:    → base64 direct

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "./firebase";

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

// ─── FALLBACK LOCALSTORAGE (vignette 400 px) ─────────────────────────────────
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

// ─── ÉCRITURE IDB ────────────────────────────────────────────────────────────
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
      if (!loadFallback(key)) saveFallback(key, val); // rétrocompatibilité
      return val;
    }
  } catch { /* IDB indisponible */ }
  const fb = loadFallback(key);
  if (fb) { _cache.set(key, fb); return fb; }
  return "";
}

// ─── RÉSOLUTION ──────────────────────────────────────────────────────────────
export async function resolvePhoto(value) {
  if (!value) return "";
  if (value.startsWith("idb:")) return loadPhoto(value.slice(4));
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

// ─── MIGRATION VERS IDB (sauvegarde principale — instantanée) ────────────────
const _SINGLE = ["photoArrivee", "photoDepart"];
const _ARRAYS = ["photos", "photosDepart"];

export async function extractPassagePhotos(passage) {
  if (!passage?.id) return passage;
  const p = { ...passage };
  for (const field of _SINGLE) {
    if (p[field]?.startsWith("data:")) {
      const key = `${p.id}_${field}`;
      const ok = await savePhoto(key, p[field]);
      if (ok) p[field] = `idb:${key}`;
    }
  }
  for (const field of _ARRAYS) {
    if (!Array.isArray(p[field])) continue;
    p[field] = await Promise.all(
      p[field].map(async (v, i) => {
        if (!v?.startsWith("data:")) return v;
        const key = `${p.id}_${field}_${i}`;
        const ok = await savePhoto(key, v);
        return ok ? `idb:${key}` : v;
      })
    );
  }
  return p;
}

// ─── UPLOAD UN FICHIER VERS FIREBASE STORAGE ─────────────────────────────────
const UPLOAD_TIMEOUT_MS = 15000;

async function uploadOne(key, dataUrl) {
  if (!dataUrl || !navigator.onLine) return null;
  if (!auth.currentUser) return null;
  try {
    const [header, b64] = dataUrl.split(",");
    if (!b64) return null;
    const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    const storageRef = ref(storage, `photos/${key}.jpg`);
    const upload = uploadBytes(storageRef, blob, { contentType: "image/jpeg" })
      .then(() => getDownloadURL(storageRef));
    const timeout = new Promise((_, rej) =>
      setTimeout(() => rej(new Error("timeout")), UPLOAD_TIMEOUT_MS)
    );
    return await Promise.race([upload, timeout]);
  } catch (e) {
    console.warn("[briblue] uploadOne échoué:", key, e?.message);
    return null;
  }
}

// ─── MIGRATION ARRIÈRE-PLAN vers Firebase Storage ────────────────────────────
// Appelée APRÈS la sauvegarde (non bloquante).
// Retourne le passage avec les clés idb: remplacées par des URL https://.
// Retourne null si rien n'a changé (pas besoin de re-sauvegarder).
export async function migratePassagePhotosToStorage(passage) {
  if (!passage?.id || !navigator.onLine || !auth.currentUser) return null;
  const p = { ...passage };
  let changed = false;

  for (const field of _SINGLE) {
    const val = p[field];
    if (!val?.startsWith("idb:")) continue;
    const key = val.slice(4);
    const dataUrl = await loadPhoto(key);
    if (!dataUrl) continue;
    const url = await uploadOne(key, dataUrl);
    if (url) { p[field] = url; changed = true; }
  }
  for (const field of _ARRAYS) {
    if (!Array.isArray(p[field])) continue;
    const arr = [...p[field]];
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      if (!val?.startsWith("idb:")) continue;
      const key = val.slice(4);
      const dataUrl = await loadPhoto(key);
      if (!dataUrl) continue;
      const url = await uploadOne(key, dataUrl);
      if (url) { arr[i] = url; changed = true; }
    }
    if (changed) p[field] = arr;
  }
  return changed ? p : null;
}
