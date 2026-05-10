import { getDoc, setDoc } from "firebase/firestore";
import { APP_DOC, FIRESTORE_REST_URL, auth } from "./firebase";

export const IS_IOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !window.MSStream;

const FIREBASE_DEBOUNCE_MS = 800;
const offlineQueue    = { pending: {} };
const _debounceTimers = {};

// ─── TOKEN ──────────────────────────────────────────────────────────────────
let _cachedAuthToken = null;
let _tokenPromise    = null; // évite les refreshs simultanés

async function refreshAuthToken(forceRefresh = false) {
  if (_tokenPromise) return _tokenPromise;
  _tokenPromise = (async () => {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      _cachedAuthToken = await user.getIdToken(forceRefresh);
      return _cachedAuthToken;
    } catch {
      return _cachedAuthToken; // garde l'ancien si refresh échoue
    } finally {
      _tokenPromise = null;
    }
  })();
  return _tokenPromise;
}

// Obtenir un token valide (refresh si absent ou expiré)
async function getAuthToken() {
  if (_cachedAuthToken) return _cachedAuthToken;
  return refreshAuthToken(false);
}

if (typeof window !== "undefined") {
  // Refresh initial dès que l'auth est prête
  auth.onAuthStateChanged(user => {
    if (user) refreshAuthToken(false);
  });
  // Refresh toutes les 45 min pour éviter l'expiration
  setInterval(() => refreshAuthToken(true), 45 * 60 * 1000);
}

// ─── FIRESTORE REST ─────────────────────────────────────────────────────────
function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean")  return { booleanValue: v };
  if (typeof v === "number")   return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string")   return { stringValue: v };
  if (Array.isArray(v))        return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === "object") {
    const fields = {};
    for (const [k, fv] of Object.entries(v)) fields[k] = toFirestoreValue(fv);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

// Sauvegarde REST Firestore (fonctionne sur iOS, survit au background)
async function saveViaREST(pending, keepalive = false) {
  const keys = Object.keys(pending);
  if (!keys.length) return;

  const token = await getAuthToken();
  if (!token) {
    // Pas de token → fallback SDK
    for (const key of keys) {
      await saveToFirebaseSDK(key, pending[key]);
    }
    return;
  }

  const fields = {};
  const updateMask = [];
  keys.forEach(key => {
    fields[key] = toFirestoreValue(pending[key]);
    updateMask.push(`updateMask.fieldPaths=${encodeURIComponent(key)}`);
  });
  fields["_lastSavedAt"] = { stringValue: new Date().toISOString() };
  updateMask.push("updateMask.fieldPaths=_lastSavedAt");

  const url = `${FIRESTORE_REST_URL}?${updateMask.join("&")}`;
  const opts = {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ fields }),
  };
  if (keepalive) opts.keepalive = true;

  const res = await fetch(url, opts);

  // Token expiré → refresh et retry une fois
  if (res.status === 401) {
    const newToken = await refreshAuthToken(true);
    if (newToken) {
      opts.headers["Authorization"] = `Bearer ${newToken}`;
      opts.keepalive = false; // keepalive + retry peut échouer
      await fetch(url, opts).catch(() => {});
    }
    return;
  }
  if (!res.ok) throw new Error(`REST ${res.status}`);
}

// ─── FIREBASE SDK (desktop/Android, connexion stable) ───────────────────────
async function saveToFirebaseSDK(key, val) {
  await setDoc(APP_DOC, { [key]: val, _lastSavedAt: new Date().toISOString() }, { merge: true });
}

// ─── FLUSH (iOS background / fermeture de page) ─────────────────────────────
export function flushPendingNow() {
  const keys = Object.keys(offlineQueue.pending);
  if (!keys.length) return;
  // Annuler tous les timers en cours
  Object.keys(_debounceTimers).forEach(k => { clearTimeout(_debounceTimers[k]); delete _debounceTimers[k]; });

  const snapshot = { ...offlineQueue.pending };
  keys.forEach(k => { delete offlineQueue.pending[k]; });

  // Toujours utiliser keepalive REST pour le flush (iOS ET desktop)
  // C'est le seul moyen fiable de survivre à la fermeture de page
  saveViaREST(snapshot, true).catch(() => {
    // Si REST échoue, remettre dans la queue
    Object.assign(offlineQueue.pending, snapshot);
  });
}

// ─── FLUSH ONLINE (reconnexion réseau) ──────────────────────────────────────
async function flushOfflineQueue() {
  const keys = Object.keys(offlineQueue.pending);
  if (!keys.length) return;
  const snapshot = { ...offlineQueue.pending };
  keys.forEach(k => { delete offlineQueue.pending[k]; });
  try {
    await saveViaREST(snapshot, false);
  } catch {
    // Remettre dans la queue si échec
    Object.assign(offlineQueue.pending, snapshot);
  }
}

// ─── RECONCILE AU BOOT ──────────────────────────────────────────────────────
// ⚠️ PROTECTION : ne jamais écraser des données locales plus récentes que Firebase
export async function reconcileOnBoot() {
  try {
    const snap    = await getDoc(APP_DOC);
    const remote  = snap.exists() ? snap.data() : {};
    const remoteTime = remote["_lastSavedAt"] ? new Date(remote["_lastSavedAt"]).getTime() : 0;
    const KEYS = ["bb_clients_v2","bb_passages_v2","bb_livraisons_v1","bb_rdvs_v1","bb_stock_v1","bb_contrats_v1","bb_versements_v1","bb_retards_carnet_v1"];
    const toPush = {};
    let needsPush = false;

    for (const key of KEYS) {
      let local = null;
      try { const ls = localStorage.getItem("briblue_" + key); if (ls) local = JSON.parse(ls); } catch {} // eslint-disable-line no-empty

      if (local == null) {
        // Rien en local → prendre Firebase
        if (remote[key] != null) {
          try { localStorage.setItem("briblue_" + key, JSON.stringify(remote[key])); } catch {} // eslint-disable-line no-empty
        }
        continue;
      }

      if (remote[key] == null) {
        // Rien sur Firebase → pousser le local
        toPush[key] = local; needsPush = true; continue;
      }

      // Les deux existent → comparer les timestamps
      let localTime = 0;
      try { const m = localStorage.getItem("briblue_meta_" + key); if (m) localTime = JSON.parse(m).savedAt || 0; } catch {} // eslint-disable-line no-empty

      if (localTime >= remoteTime) {
        // Local plus récent ou égal → pousser vers Firebase
        toPush[key] = local; needsPush = true;
      } else {
        // Firebase plus récent → mettre à jour le local
        // ⚠️ Seulement si aucune donnée n'est en attente d'envoi pour cette clé
        if (!offlineQueue.pending[key]) {
          try {
            localStorage.setItem("briblue_" + key, JSON.stringify(remote[key]));
            localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: remoteTime }));
          } catch {} // eslint-disable-line no-empty
        }
      }
    }

    if (needsPush) {
      toPush["_lastSavedAt"] = new Date().toISOString();
      await setDoc(APP_DOC, toPush, { merge: true });
    }
  } catch (e) { console.warn("[briblue] reconcile skipped:", e?.message); }
}

// ─── SAVE ────────────────────────────────────────────────────────────────────
export async function save(key, val) {
  const serialized = JSON.stringify(val);

  // Avertir si les données dépassent 900 Ko (limite Firestore ~1 Mo)
  if (serialized.length > 900_000) {
    console.warn(`[briblue] save("${key}"): données volumineuses (${Math.round(serialized.length/1024)} Ko) — photos non compressées ?`);
  }

  // 1. Sauvegarder localement en priorité absolue
  try {
    localStorage.setItem("briblue_" + key, serialized);
    localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: Date.now() }));
  } catch (e) {
    // QuotaExceededError : localStorage plein, on continue quand même vers Firebase
    console.warn(`[briblue] localStorage plein pour "${key}" (${Math.round(serialized.length/1024)} Ko):`, e?.name);
  }

  // 2. Mettre dans la queue (protection si le réseau échoue)
  offlineQueue.pending[key] = val;

  if (!navigator.onLine) return;

  if (IS_IOS) {
    // iOS : annuler le timer précédent et utiliser REST directement
    // Le SDK Firebase peut être tué par iOS en arrière-plan
    if (_debounceTimers[key]) { clearTimeout(_debounceTimers[key]); delete _debounceTimers[key]; }

    // Debounce court pour éviter les appels trop fréquents
    _debounceTimers[key] = setTimeout(async () => {
      delete _debounceTimers[key];
      const latest = offlineQueue.pending[key];
      if (latest === undefined) return;
      try {
        await saveViaREST({ [key]: latest }, false);
        if (offlineQueue.pending[key] === latest) delete offlineQueue.pending[key];
      } catch (e) {
        console.warn(`[briblue] saveViaREST("${key}") échoué:`, e?.message);
        // Garde dans la queue → sera envoyé au prochain flush
      }
    }, 400);

  } else {
    // Desktop/Android : debounce SDK Firebase (plus fiable sur connexion stable)
    if (_debounceTimers[key]) clearTimeout(_debounceTimers[key]);
    _debounceTimers[key] = setTimeout(async () => {
      delete _debounceTimers[key];
      const latest = offlineQueue.pending[key];
      if (latest === undefined) return;
      try {
        await saveToFirebaseSDK(key, latest);
        if (offlineQueue.pending[key] === latest) delete offlineQueue.pending[key];
      } catch (e) {
        console.warn(`[briblue] saveToFirebaseSDK("${key}") échoué:`, e?.message);
        // Fallback REST si le SDK échoue
        try {
          await saveViaREST({ [key]: latest }, false);
          if (offlineQueue.pending[key] === latest) delete offlineQueue.pending[key];
        } catch (e2) {
          console.warn(`[briblue] saveViaREST fallback("${key}") échoué:`, e2?.message);
        }
      }
    }, FIREBASE_DEBOUNCE_MS);
  }
}

// ─── CACHE getDoc (partage la requête entre les 6 load() simultanés du boot) ──
let _getDocCache = null;
let _getDocCacheAt = 0;
let _getDocPromise = null;
const GET_DOC_CACHE_MS = 8_000; // 8s : couvre le boot, périmé avant le poll des contrats (10s)

async function fetchAppDoc() {
  const now = Date.now();
  if (_getDocCache && now - _getDocCacheAt < GET_DOC_CACHE_MS) return _getDocCache;
  if (_getDocPromise) return _getDocPromise;
  _getDocPromise = getDoc(APP_DOC).then(snap => {
    _getDocCache = snap;
    _getDocCacheAt = Date.now();
    _getDocPromise = null;
    return snap;
  }).catch(e => { _getDocPromise = null; throw e; });
  return _getDocPromise;
}

// ─── LOAD ─────────────────────────────────────────────────────────────────────
// Priorité au local s'il est aussi récent ou plus récent que Firebase.
// Évite d'écraser des sauvegardes iOS dont le push réseau a été interrompu.
export async function load(key, fallback) {
  // 1. Lire localStorage en premier (instantané, sans réseau)
  let localData = null;
  let localTime = 0;
  try {
    const ls = localStorage.getItem("briblue_" + key);
    if (ls !== null) localData = JSON.parse(ls);
    const m = localStorage.getItem("briblue_meta_" + key);
    if (m) localTime = JSON.parse(m).savedAt || 0;
  } catch {} // eslint-disable-line no-empty

  // 2. Ne jamais écraser une donnée en attente d'envoi
  if (offlineQueue.pending[key] !== undefined) return localData ?? fallback;

  // 3. Firebase avec vérification de timestamp
  try {
    const snap = await fetchAppDoc();
    if (snap.exists()) {
      const allData = snap.data();
      const remoteTime = allData["_lastSavedAt"] ? new Date(allData["_lastSavedAt"]).getTime() : 0;
      if (key in allData) {
        if (localData !== null && localTime >= remoteTime) {
          // Local identique ou plus récent → ne pas écraser
          return localData;
        }
        // Firebase plus récent → mettre à jour le cache local
        try { localStorage.setItem("briblue_" + key, JSON.stringify(allData[key])); } catch {} // eslint-disable-line no-empty
        return allData[key];
      }
    }
  } catch { /* réseau indisponible → utiliser local */ }

  return localData ?? fallback;
}

// ─── EVENT LISTENERS ─────────────────────────────────────────────────────────
if (typeof window !== "undefined") {
  // Flush quand réseau revient
  window.addEventListener("online", () => { flushOfflineQueue(); });

  // Flush garanti quand l'app passe en arrière-plan (iOS critical)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPendingNow();
  });

  // Double protection iOS : pagehide se déclenche même quand visibilitychange ne l'est pas
  window.addEventListener("pagehide", () => { flushPendingNow(); });

  // Desktop
  window.addEventListener("beforeunload", () => { flushPendingNow(); });

  // Reconcile au boot (après que l'auth soit prête)
  const doReconcile = () => {
    // Attendre que l'auth soit initialisée avant de reconcilier
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      if (user) {
        refreshAuthToken(false).then(() => {
          setTimeout(reconcileOnBoot, 500); // petit délai pour laisser l'app charger
        });
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", doReconcile);
  } else {
    doReconcile();
  }

  // Debug helpers
  window.briblue = window.briblue || {};
  window.briblue._debug = () => ({
    pending: {...offlineQueue.pending},
    online: navigator.onLine,
    isIOS: IS_IOS,
    hasToken: !!_cachedAuthToken,
    pendingCount: Object.keys(offlineQueue.pending).length,
  });
  window.briblue._forceFlush = flushPendingNow;
  window.briblue._forceReconcile = reconcileOnBoot;
}