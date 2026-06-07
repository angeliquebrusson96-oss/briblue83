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
import { signInAnonymously } from "firebase/auth";
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

// ─── CLÉ TEMPORAIRE ──────────────────────────────────────────────────────────
// Préfixe des clés IDB temporaires créées IMMÉDIATEMENT quand une photo est prise.
// Elles sont renommées en clés permanentes (${passageId}_${field}) lors du save.
// Avantage : le draft localStorage ne stocke jamais de data: (évite QuotaExceededError).
const TMP_PREFIX = "tmp_";

// Sauvegarde immédiate dans IDB avec une clé temporaire — appelé par PhotoPicker.
// Retourne la clé tmp ou null si IDB indisponible (fallback : data: conservé).
export async function savePhotoTemp(dataUrl) {
  if (!dataUrl?.startsWith("data:")) return null;
  const key = TMP_PREFIX + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  const ok = await savePhoto(key, dataUrl);
  return ok ? key : null;
}

// Copie une entrée IDB d'une clé vers une autre (tmp → permanente).
export async function copyPhoto(fromKey, toKey) {
  const data = await loadPhoto(fromKey);
  if (!data) return false;
  return savePhoto(toKey, data);
}

// ─── MIGRATION VERS IDB (sauvegarde principale — instantanée) ────────────────
const _SINGLE = ["photoArrivee", "photoDepart"];
const _ARRAYS = ["photos", "photosDepart"];

// Timeout upload par photo dans extractPassagePhotos (8s — plus court que uploadOne)
const EXTRACT_UPLOAD_TIMEOUT_MS = 8_000;

export async function extractPassagePhotos(passage) {
  if (!passage?.id) return passage;
  const p = { ...passage };

  // ── Étape 1 : IDB — synchroniser toutes les clés locales ─────────────────
  // On enregistre la clé permanente dans IDB et on note ce qui doit être uploadé.
  const toUpload = []; // { setVal: fn, key: string }

  for (const field of _SINGLE) {
    const val = p[field];
    if (!val) continue;

    if (val.startsWith("data:")) {
      // Ancien flux : data: → sauvegarde IDB permanente
      const key = `${p.id}_${field}`;
      const ok = await savePhoto(key, val);
      if (ok) {
        p[field] = `idb:${key}`;
        toUpload.push({ setVal: (url) => { p[field] = url; }, key });
      }
    } else if (val.startsWith("idb:")) {
      const rawKey = val.slice(4);
      if (rawKey.startsWith(TMP_PREFIX)) {
        // Nouveau flux : tmp → clé permanente
        const permKey = `${p.id}_${field}`;
        const ok = await copyPhoto(rawKey, permKey);
        if (ok) {
          p[field] = `idb:${permKey}`;
          toUpload.push({ setVal: (url) => { p[field] = url; }, key: permKey });
        }
      }
      // idb:permanent sans TMP → conserver (sera migré par migrateAllPassagesPhotos)
    }
    // https:// → déjà sur Firebase Storage → pas toucher
  }

  for (const field of _ARRAYS) {
    if (!Array.isArray(p[field])) continue;
    const arr = [...p[field]];
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (!v) continue;

      if (v.startsWith("data:")) {
        const key = `${p.id}_${field}_${i}`;
        const ok = await savePhoto(key, v);
        if (ok) {
          arr[i] = `idb:${key}`;
          const idx = i; // capture pour closure
          toUpload.push({ setVal: (url) => { arr[idx] = url; }, key });
        }
      } else if (v.startsWith("idb:")) {
        const rawKey = v.slice(4);
        if (rawKey.startsWith(TMP_PREFIX)) {
          const permKey = `${p.id}_${field}_${i}`;
          const ok = await copyPhoto(rawKey, permKey);
          if (ok) {
            arr[i] = `idb:${permKey}`;
            const idx = i;
            toUpload.push({ setVal: (url) => { arr[idx] = url; }, key: permKey });
          }
        }
      }
    }
    p[field] = arr;
  }

  // ── Étape 2 : Firebase Storage — upload en parallèle (si connecté) ────────
  // Les photos qui viennent d'être mises en IDB sont uploadées en parallèle.
  // Timeout par photo : 8s. Si l'upload réussit, on remplace idb: par https://.
  // Si échec → idb: reste → migrateAllPassagesPhotos tentera plus tard.
  if (toUpload.length > 0 && navigator.onLine) {
    if (!auth.currentUser) {
      try { await signInAnonymously(auth); } catch { /* réseau indisponible */ }
    }
    if (auth.currentUser) {
      await Promise.all(
        toUpload.map(async ({ setVal, key }) => {
          try {
            const dataUrl = await loadPhoto(key);
            if (!dataUrl) return;
            const url = await Promise.race([
              uploadOne(key, dataUrl),
              new Promise((resolve) => setTimeout(() => resolve(null), EXTRACT_UPLOAD_TIMEOUT_MS)),
            ]);
            if (url) setVal(url); // ✓ Photo sur Firebase Storage → https://
          } catch { /* upload échoué → idb: reste, migration ultérieure */ }
        })
      );
    }
  }

  return p;
}

// ─── COMPRESSION AVANT UPLOAD (900 px, 72 % — optimisé réseau mobile) ───────
function compressForUpload(dataUrl) {
  return new Promise(resolve => {
    if (!dataUrl?.startsWith("data:image/")) { resolve(dataUrl); return; }
    const img = new Image();
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      const MAX = 900;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const c = document.createElement("canvas");
      c.width = width; c.height = height;
      c.getContext("2d").drawImage(img, 0, 0, width, height);
      try { resolve(c.toDataURL("image/jpeg", 0.72)); } catch { resolve(dataUrl); }
    };
    img.src = dataUrl;
  });
}

// ─── UPLOAD UN FICHIER VERS FIREBASE STORAGE ─────────────────────────────────
const UPLOAD_TIMEOUT_MS = 20000;

async function uploadOne(key, dataUrl) {
  if (!dataUrl || !navigator.onLine) return null;
  // Auto-signin anonyme si l'auth n'est pas encore prête (fire-and-forget dans App)
  if (!auth.currentUser) {
    try { await signInAnonymously(auth); } catch { /* réseau indisponible */ }
  }
  if (!auth.currentUser) return null;
  try {
    // Compresser avant envoi pour réduire la taille sur le réseau mobile
    const compressed = await compressForUpload(dataUrl);
    const [, b64] = compressed.split(",");
    if (!b64) return null;
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "image/jpeg" });
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

// ─── MIGRATION GLOBALE : tous les passages avec des clés idb: ────────────────
// Appelée au démarrage (après auth), non bloquante.
// Retourne la liste mise à jour (ou la même liste si rien n'a changé).
// Traite les passages séquentiellement pour ne pas saturer le réseau mobile
export async function migrateAllPassagesPhotos(passages) {
  if (!Array.isArray(passages) || !navigator.onLine) return passages;
  // S'assurer d'avoir une session Firebase avant de commencer
  if (!auth.currentUser) {
    try { await signInAnonymously(auth); } catch { return passages; }
  }
  if (!auth.currentUser) return passages;
  let changed = false;
  const updated = [...passages];
  for (let i = 0; i < passages.length; i++) {
    if (!navigator.onLine || !auth.currentUser) break;
    const migrated = await migratePassagePhotosToStorage(passages[i]);
    if (migrated) { updated[i] = migrated; changed = true; }
  }
  return changed ? updated : passages;
}

// ─── MIGRATION ARRIÈRE-PLAN vers Firebase Storage ────────────────────────────
// Appelée APRÈS la sauvegarde (non bloquante).
// Retourne le passage avec les clés idb: remplacées par des URL https://.
// Retourne null si rien n'a changé (pas besoin de re-sauvegarder).
export async function migratePassagePhotosToStorage(passage) {
  if (!passage?.id || !navigator.onLine) return null;
  // S'assurer d'avoir une session Firebase
  if (!auth.currentUser) {
    try { await signInAnonymously(auth); } catch { return null; }
  }
  if (!auth.currentUser) return null;
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
    let arrChanged = false;
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      if (!val?.startsWith("idb:")) continue;
      const key = val.slice(4);
      const dataUrl = await loadPhoto(key);
      if (!dataUrl) continue;
      const url = await uploadOne(key, dataUrl);
      if (url) { arr[i] = url; changed = true; arrChanged = true; }
    }
    if (arrChanged) p[field] = arr;
  }
  return changed ? p : null;
}

// ─── MIGRATION PHOTO PISCINE CLIENT ──────────────────────────────────────────
// Même logique que migratePassagePhotosToStorage mais pour client.photoPiscine.
// La photo est stockée en idb:tmp_xxx (local) au moment du save ; cette fonction
// l'uploade vers Firebase Storage et retourne le client avec une URL https://.
// Appelée en arrière-plan juste après saveClient — non bloquante.
// Retourne le client mis à jour, ou null si rien n'a changé.
export async function migrateClientPhotoToStorage(client) {
  if (!client?.id || !navigator.onLine) return null;
  const val = client.photoPiscine;
  // Rien à migrer si vide ou déjà sur Firebase Storage
  if (!val || val.startsWith("https://")) return null;

  if (!auth.currentUser) {
    try { await signInAnonymously(auth); } catch { return null; }
  }
  if (!auth.currentUser) return null;

  let dataUrl = null;
  const storageKey = `client_${client.id}_photoPiscine`;

  if (val.startsWith("idb:")) {
    dataUrl = await loadPhoto(val.slice(4));
  } else if (val.startsWith("data:")) {
    // Sauvegarder en IDB d'abord pour cohérence
    await savePhoto(storageKey, val);
    dataUrl = val;
  }

  if (!dataUrl) return null;

  const url = await uploadOne(storageKey, dataUrl);
  if (!url) return null;

  return { ...client, photoPiscine: url };
}
