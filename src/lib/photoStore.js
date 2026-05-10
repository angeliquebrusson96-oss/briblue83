// ─── STOCKAGE PHOTOS DANS INDEXEDDB + FALLBACK LOCALSTORAGE ─────────────────
// Flux normal : IDB (qualité maximale, accès instantané).
// Fallback    : si IDB vidé par iOS/Safari, repli sur une vignette localStorage (~15 Ko).
// Cela garantit que les photos survivent aux purges de stockage et aux redémarrages.

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

// ─── VIGNETTE FALLBACK (localStorage) ────────────────────────────────────────
// Réduit à max 400 px JPEG 0.6 → ~15-20 Ko — survit à la purge IDB d'iOS.
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
      try { resolve(c.toDataURL("image/jpeg", 0.6)); }
      catch { resolve(dataUrl); }
    };
    img.src = dataUrl;
  });
}

function saveFallback(key, dataUrl) {
  compressFallback(dataUrl).then(thumb => {
    try { localStorage.setItem(LS_PREFIX + key, thumb); } catch { /* quota — pas critique */ }
  });
}

function loadFallback(key) {
  try { return localStorage.getItem(LS_PREFIX + key) || ""; } catch { return ""; }
}

// ─── ÉCRITURE ────────────────────────────────────────────────────────────────
// Retourne true si l'écriture IDB a réussi, false sinon.
export async function savePhoto(key, dataUrl) {
  _cache.set(key, dataUrl);
  // Sauvegarder une vignette dans localStorage en parallèle (fallback si IDB vidé)
  saveFallback(key, dataUrl);
  try {
    const db = await openDB();
    await new Promise((res, rej) => {
      const tx  = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(dataUrl, key);
      tx.oncomplete = res;
      tx.onerror    = e => rej(e.target.error);
    });
    return true;
  } catch (e) {
    console.warn("[briblue] photoStore.savePhoto IDB échoué:", e?.message);
    return false;
  }
}

// ─── LECTURE ─────────────────────────────────────────────────────────────────
export async function loadPhoto(key) {
  if (_cache.has(key)) return _cache.get(key);
  // 1. Essayer IDB (qualité maximale)
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
      // Créer le fallback localStorage si pas encore présent (rétrocompatibilité)
      if (!loadFallback(key)) saveFallback(key, val);
      return val;
    }
  } catch { /* IDB indisponible → fallback */ }
  // 2. Fallback localStorage (vignette 400 px — IDB vidé par iOS)
  const fb = loadFallback(key);
  if (fb) { _cache.set(key, fb); return fb; }
  return "";
}

// ─── RÉSOLUTION D'UNE VALEUR PHOTO ───────────────────────────────────────────
// Accepte indifféremment :
//   "idb:{key}"         → charge depuis IDB ou fallback localStorage
//   "data:image/..."    → base64 direct (déjà résolu)
//   "https://..."       → URL distante
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

// ─── MIGRATION PHOTOS D'UN PASSAGE ──────────────────────────────────────────
// Déplace les base64 vers IDB. Si IDB échoue, garde le base64 dans le passage
// (meilleur qu'une clé idb: dangling qui disparaît au rechargement).
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
      // Si IDB échoue : garde le base64 — mieux que perdre la photo
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
