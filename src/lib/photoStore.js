// ─── STOCKAGE PHOTOS ─────────────────────────────────────────────────────────
// Flux de SAUVEGARDE (extractPassagePhotos) : IDB local uniquement → instantané.
// Flux de MIGRATION (migratePassagePhotosToStorage) : Firebase Storage en arrière-plan.
//   → appelé après la sauvegarde, sans bloquer l'interface.
//   → remplace les idb:keys par des URL https:// accessibles sur tous les appareils.
// Flux de LECTURE (resolvePhoto / PhotoImg) :
//   https://  → URL directe (multi-appareil)
//   idb:key   → IDB, puis fallback localStorage (400 px — survit à la purge iOS)
//   data:     → base64 direct
//   fsp:id    → Firestore briblue/client_photos[id] (fallback garanti pour photos piscine)

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { storage, auth, DOCS, STORAGE_BUCKET } from "./firebase";

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

// ─── URL FIREBASE STORAGE (lecture publique — rules: allow read: if true) ────
// Construit l'URL de téléchargement sans token pour les photos publiques.
// Utilisée comme fallback quand idb:key n'est pas trouvée localement.
function buildStorageUrl(key) {
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/photos%2F${encodeURIComponent(key)}.jpg?alt=media`;
}

// ─── RÉSOLUTION ──────────────────────────────────────────────────────────────
export async function resolvePhoto(value) {
  if (!value) return "";
  if (value.startsWith("idb:")) {
    const key = value.slice(4);
    const local = await loadPhoto(key);
    if (local) return local;
    // Photo absente de l'IDB local (autre appareil ou IDB purgé par iOS).
    // Elle a peut-être déjà été uploadée vers Firebase Storage lors de la
    // migration. On retourne l'URL publique → l'image sera visible sur tous
    // les appareils même si la migration n'a pas encore mis à jour la référence.
    return buildStorageUrl(key);
  }
  // fsp:clientId → photo stockée dans Firestore briblue/client_photos
  if (value.startsWith("fsp:")) {
    const clientId = value.slice(4);
    const cacheKey = `__fsp_${clientId}`;
    if (_cache.has(cacheKey)) return _cache.get(cacheKey);
    try {
      const snap = await getDoc(DOCS.client_photos);
      const photoData = snap.exists() ? (snap.data()[clientId] || "") : "";
      if (photoData) _cache.set(cacheKey, photoData);
      return photoData;
    } catch { return ""; }
  }
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

// Timeout upload par photo dans extractPassagePhotos (45s — connexions mobiles lentes)
const EXTRACT_UPLOAD_TIMEOUT_MS = 45_000;

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

  // ── Étape 2 : Firebase Storage — uploads EN ARRIÈRE-PLAN (non bloquant) ─────
  // Les uploads NE bloquent PAS la sauvegarde. Le passage est sauvegardé
  // immédiatement avec des clés idb:. Les uploads s'effectuent en tâche de fond :
  // la queue persistante (bb_photo_upload_queue_v1) garantit qu'ils seront
  // retentés au démarrage ou au retour en ligne si le réseau échoue maintenant.
  if (toUpload.length > 0) {
    // Ajouter toutes les clés à la queue persistante de retry
    toUpload.forEach(({ key }) => _addToUploadQueue(key));

    // Lancer les uploads en arrière-plan (sans await)
    (async () => {
      if (!navigator.onLine) return;
      if (!auth.currentUser) {
        try { await signInAnonymously(auth); } catch { /* continue sans auth */ }
      }
      for (const { key } of toUpload) {
        if (!navigator.onLine) break;
        try {
          const dataUrl = await loadPhoto(key);
          if (dataUrl) await uploadOne(key, dataUrl);
        } catch { /* upload échoué → déjà dans la queue → retentative au prochain boot */ }
      }
    })();
  }

  // Retour IMMÉDIAT avec les clés idb: — sauvegarde non bloquée
  return p;
}

// ─── COMPRESSION AVANT UPLOAD (1200 px, 88 % — bonne qualité) ──────────────
function compressForUpload(dataUrl) {
  return new Promise(resolve => {
    if (!dataUrl?.startsWith("data:image/")) { resolve(dataUrl); return; }
    const img = new Image();
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const c = document.createElement("canvas");
      c.width = width; c.height = height;
      c.getContext("2d").drawImage(img, 0, 0, width, height);
      try { resolve(c.toDataURL("image/jpeg", 0.88)); } catch { resolve(dataUrl); }
    };
    img.src = dataUrl;
  });
}

// ─── QUEUE PERSISTANTE D'UPLOADS EN ATTENTE ──────────────────────────────────
// Stocke les clés IDB qui n'ont pas pu être uploadées (réseau, timeout, iOS bg).
// Traitée à chaque boot / retour en ligne.
const _UPLOAD_QUEUE_KEY = "briblue_photo_upload_queue_v1";

export function _getUploadQueue() {
  try { return JSON.parse(localStorage.getItem(_UPLOAD_QUEUE_KEY) || "[]"); } catch { return []; }
}
function _saveUploadQueue(arr) {
  try { localStorage.setItem(_UPLOAD_QUEUE_KEY, JSON.stringify(arr)); } catch { /* quota */ }
}
function _addToUploadQueue(key) {
  const q = _getUploadQueue();
  if (!q.includes(key)) { q.push(key); _saveUploadQueue(q); }
}
function _removeFromUploadQueue(key) {
  const q = _getUploadQueue().filter(k => k !== key);
  _saveUploadQueue(q);
}

// ─── UPLOAD UN FICHIER VERS FIREBASE STORAGE ─────────────────────────────────
// Utilise fetch().blob() (plus fiable sur iOS que atob + Uint8Array manuel).
// Timeout 60 s pour les connexions mobiles lentes.
const UPLOAD_TIMEOUT_MS = 60_000;

async function uploadOne(key, dataUrl) {
  if (!dataUrl || !navigator.onLine) return null;
  // Tentative de sign-in anonyme pour enrichir le token Firebase Storage.
  // Si ça échoue (401, 400 "anonymous disabled"), on tente l'upload quand même :
  // les règles Storage autorisent l'écriture publique (voir storage.rules).
  if (!auth.currentUser) {
    try { await signInAnonymously(auth); } catch { /* continue sans auth */ }
  }
  try {
    const compressed = await compressForUpload(dataUrl);
    if (!compressed?.startsWith("data:")) return null;

    // fetch().blob() — plus fiable que atob() sur iOS (évite les problèmes
    // de mémoire avec de grands tableaux Uint8Array et les bugs de charset)
    const blob = await fetch(compressed).then(r => r.blob());
    if (!blob || blob.size === 0) return null;

    const storageRef = ref(storage, `photos/${key}.jpg`);
    const uploadTask = uploadBytes(storageRef, blob, { contentType: "image/jpeg" })
      .then(snapshot => getDownloadURL(snapshot.ref));
    const timeout = new Promise((_, rej) =>
      setTimeout(() => rej(new Error("upload-timeout")), UPLOAD_TIMEOUT_MS)
    );
    const url = await Promise.race([uploadTask, timeout]);
    if (url) _removeFromUploadQueue(key); // succès → retirer de la queue
    return url;
  } catch (e) {
    console.warn("[briblue] uploadOne échoué:", key, e?.message);
    _addToUploadQueue(key); // échec → ajouter à la queue de retry
    return null;
  }
}

// ─── RETRY UPLOADS EN ATTENTE ─────────────────────────────────────────────────
// Appelée à chaque boot / retour en ligne pour uploader les photos manquantes.
// Retourne un mapping { idbKey → httpsUrl } pour les clés qui ont pu être uploadées.
export async function retryPendingUploads() {
  if (!navigator.onLine) return {};
  if (!auth.currentUser) {
    try { await signInAnonymously(auth); } catch { return {}; }
  }
  const queue = _getUploadQueue();
  if (!queue.length) return {};

  const results = {};
  for (const key of queue) {
    if (!navigator.onLine) break;
    try {
      // Vérifier si le fichier existe déjà en Storage (évite re-upload inutile)
      const existingUrl = buildStorageUrl(key);
      const head = await fetch(existingUrl, { method: "HEAD" }).catch(() => null);
      if (head?.ok) {
        // Fichier déjà sur Storage → récupérer l'URL et retirer de la queue
        results[key] = existingUrl;
        _removeFromUploadQueue(key);
        continue;
      }
      // Charger depuis IDB et re-tenter l'upload
      const dataUrl = await loadPhoto(key);
      if (!dataUrl) { _removeFromUploadQueue(key); continue; } // IDB purgé → abandonner
      const url = await uploadOne(key, dataUrl); // uploadOne retire de la queue si succès
      if (url) results[key] = url;
    } catch { /* noop — reste dans la queue */ }
  }
  return results; // { idbKey → httpsUrl }
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
// Tente d'uploader la photo vers Firebase Storage → URL https:// multi-appareils.
// Si offline ou upload échoué → retourne null (photo reste en idb: local).
// Les valeurs fsp: existantes sont traitées via resolvePhoto (lecture Firestore).
export async function migrateClientPhotoToStorage(client) {
  if (!client?.id || !navigator.onLine) return null;
  const val = client.photoPiscine;
  // Déjà en cloud → rien à faire
  if (!val || val.startsWith("https://") || val.startsWith("fsp:")) return null;

  // Récupérer le dataUrl depuis IDB/cache/fallback
  let dataUrl = null;
  if (val.startsWith("idb:")) {
    dataUrl = await loadPhoto(val.slice(4));
  } else if (val.startsWith("data:")) {
    dataUrl = val;
  }
  if (!dataUrl) return null;

  if (!auth.currentUser) {
    try { await signInAnonymously(auth); } catch { return null; }
  }
  if (!auth.currentUser) return null;

  const storageKey = `client_${client.id}_photoPiscine`;
  const url = await uploadOne(storageKey, dataUrl).catch(() => null);
  if (!url) return null;

  return { ...client, photoPiscine: url };
}
