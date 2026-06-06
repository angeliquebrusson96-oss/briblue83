import { getDoc, setDoc } from "firebase/firestore";
import { APP_DOC, FIRESTORE_REST_URL, auth } from "./firebase";

export const IS_IOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !window.MSStream;

const FIREBASE_DEBOUNCE_MS = 800;
const offlineQueue    = { pending: {} };
const _debounceTimers = {};

// ─── QUEUE PERSISTANTE ───────────────────────────────────────────────────────
// Si l'app se ferme AVANT que Firebase reçoive les données (réseau coupé,
// fermeture brutale), la queue est sauvée en localStorage et restaurée au
// prochain démarrage. Plus aucune donnée ne peut disparaître entre les sessions.
const QUEUE_LS_KEY = "briblue_offline_queue_v1";

function _loadPersistedQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_LS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Restaurer uniquement les clés de données (pas de doublons avec ce qui est déjà en attente)
      for (const [k, v] of Object.entries(saved)) {
        if (!(k in offlineQueue.pending)) offlineQueue.pending[k] = v;
      }
    }
  } catch { /* noop */ }
}

function _persistQueue() {
  try {
    const keys = Object.keys(offlineQueue.pending);
    if (keys.length > 0) {
      localStorage.setItem(QUEUE_LS_KEY, JSON.stringify(offlineQueue.pending));
    } else {
      localStorage.removeItem(QUEUE_LS_KEY);
    }
  } catch { /* quota — la queue ne peut pas être sauvée mais les données principales le sont */ }
}

// ─── MERGE DONNÉES TABLEAUX ──────────────────────────────────────────────────
// Clés dont les valeurs sont des tableaux d'objets avec .id → fusion obligatoire
// JAMAIS de remplacement pur : on prend l'UNION des deux sources.
// Priorité aux entrées de "priorityArr" pour les IDs en commun.
const MERGE_ARRAY_KEYS = new Set([
  "bb_clients_v2", "bb_passages_v2", "bb_rdvs_v1", "bb_livraisons_v1"
]);

function mergeArrayById(priorityArr, secondaryArr) {
  const result = Array.isArray(priorityArr) ? [...priorityArr] : [];
  const priorityIds = new Set(result.map(item => item?.id).filter(Boolean));
  for (const item of (Array.isArray(secondaryArr) ? secondaryArr : [])) {
    if (item?.id && !priorityIds.has(item.id)) {
      result.push(item); // ajoute uniquement les entrées absentes de la source principale
    }
  }
  return result;
}

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
  const now = new Date().toISOString();
  keys.forEach(key => {
    fields[key] = toFirestoreValue(pending[key]);
    updateMask.push(`updateMask.fieldPaths=${encodeURIComponent(key)}`);
    // Timestamp par clé → reconcile peut comparer clé par clé au lieu du timestamp global
    fields[`_savedAt_${key}`] = { stringValue: now };
    updateMask.push(`updateMask.fieldPaths=${encodeURIComponent(`_savedAt_${key}`)}`);
  });
  fields["_lastSavedAt"] = { stringValue: now };
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
  const now = new Date().toISOString();
  await setDoc(APP_DOC, { [key]: val, [`_savedAt_${key}`]: now, _lastSavedAt: now }, { merge: true });
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
// STRATÉGIE :
//   • Tableaux (clients, passages…) → MERGE par .id : union des deux sources.
//     On ne remplace JAMAIS — on ajoute uniquement ce qui manque.
//   • Autres clés (stock, contrats…) → timestamp gagne.
// Garantit qu'aucun client ne disparaît même si localStorage était incomplet.
export async function reconcileOnBoot() {
  try {
    // Restaurer la queue offline persistée (données en attente d'une session précédente)
    _loadPersistedQueue();

    const snap    = await getDoc(APP_DOC);
    const remote  = snap.exists() ? snap.data() : {};
    const remoteTime = remote["_lastSavedAt"] ? new Date(remote["_lastSavedAt"]).getTime() : 0;
    const KEYS = ["bb_clients_v2","bb_passages_v2","bb_livraisons_v1","bb_rdvs_v1","bb_stock_v1","bb_contrats_v1","bb_versements_v1","bb_retards_carnet_v1"];
    const toPush = {};
    let needsPush = false;

    for (const key of KEYS) {
      let local = null;
      try { const ls = localStorage.getItem("briblue_" + key); if (ls) local = JSON.parse(ls); } catch {} // eslint-disable-line no-empty

      let localTime = 0;
      try { const m = localStorage.getItem("briblue_meta_" + key); if (m) localTime = JSON.parse(m).savedAt || 0; } catch {} // eslint-disable-line no-empty

      const remoteKeyTs = remote[`_savedAt_${key}`];
      const remoteKeyTime = remoteKeyTs ? new Date(remoteKeyTs).getTime() : remoteTime;

      // ── Cas : rien en local ──────────────────────────────────────────────
      if (local == null) {
        if (remote[key] != null) {
          try {
            localStorage.setItem("briblue_" + key, JSON.stringify(remote[key]));
            localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: remoteKeyTime }));
          } catch {} // eslint-disable-line no-empty
        }
        continue;
      }

      // ── Cas : rien sur Firebase → pousser le local ───────────────────────
      if (remote[key] == null) {
        toPush[key] = local; needsPush = true; continue;
      }

      // ── Cas clés TABLEAU (clients, passages, rdvs, livraisons) ───────────
      // MERGE OBLIGATOIRE : union des deux sources, jamais de remplacement.
      // Scénario protégé : client créé en local (absent de Firebase) ou en Firebase
      // (absent du local après purge) → les deux sont conservés.
      if (MERGE_ARRAY_KEYS.has(key)) {
        const localArr  = Array.isArray(local)        ? local        : [];
        const remoteArr = Array.isArray(remote[key])  ? remote[key]  : [];

        // Priorité à la source la plus récente pour les IDs communs
        const merged = localTime >= remoteKeyTime
          ? mergeArrayById(localArr, remoteArr)   // local gagne pour les doublons
          : mergeArrayById(remoteArr, localArr);  // Firebase gagne pour les doublons

        const hasNewLocal  = merged.length > remoteArr.length; // local a des entrées absentes de Firebase
        const hasNewRemote = merged.length > localArr.length;  // Firebase a des entrées absentes du local

        // Toujours mettre à jour localStorage avec la version fusionnée
        try {
          localStorage.setItem("briblue_" + key, JSON.stringify(merged));
          localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: Date.now() }));
        } catch {} // eslint-disable-line no-empty

        // Pousser vers Firebase si : local plus récent OU local avait des entrées manquantes
        if (localTime >= remoteKeyTime || hasNewLocal) {
          toPush[key] = merged; needsPush = true;
        }
        // Si Firebase avait des entrées manquantes en local, déjà restauré via localStorage ci-dessus
        if (hasNewRemote) {
          console.info(`[briblue] reconcile MERGE "${key}" : ${merged.length - localArr.length} entrée(s) restaurée(s) depuis Firebase.`);
        }
        continue;
      }

      // ── Cas clés OBJET (stock, contrats…) → timestamp gagne ─────────────
      if (localTime >= remoteKeyTime) {
        toPush[key] = local; needsPush = true;
      } else {
        if (!offlineQueue.pending[key]) {
          try {
            localStorage.setItem("briblue_" + key, JSON.stringify(remote[key]));
            localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: remoteKeyTime }));
          } catch {} // eslint-disable-line no-empty
        }
      }
    }

    if (needsPush) {
      toPush["_lastSavedAt"] = new Date().toISOString();
      await setDoc(APP_DOC, toPush, { merge: true });
      _persistQueue(); // vider la queue persistée après push réussi
    }
  } catch (e) { console.warn("[briblue] reconcile skipped:", e?.message); }
}

// ─── FIX #1 : purge des vignettes photo quand localStorage est plein ─────────
// Les miniatures "bb_ph_*" (fallback IDB) peuvent saturer le quota (5-10 Mo).
// On les supprime pour libérer de la place, puis on réessaie la sauvegarde.
function purgePhotoFallbacks() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("bb_ph_")) keys.push(k);
    }
    keys.forEach(k => { try { localStorage.removeItem(k); } catch { /* noop */ } });
    console.warn(`[briblue] QuotaExceeded → purgé ${keys.length} vignettes photo pour libérer de l'espace.`);
    return keys.length > 0;
  } catch { return false; }
}

function writeLS(key, serialized) {
  try {
    localStorage.setItem("briblue_" + key, serialized);
    localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: Date.now() }));
    return true;
  } catch (e) {
    if (e?.name === "QuotaExceededError" || e?.name === "NS_ERROR_DOM_QUOTA_REACHED") {
      // Libérer de l'espace en purgeant les vignettes photo et réessayer une fois
      const purged = purgePhotoFallbacks();
      if (purged) {
        try {
          localStorage.setItem("briblue_" + key, serialized);
          localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: Date.now() }));
          return true;
        } catch { /* quota encore insuffisant après purge */ }
      }
    }
    console.warn(`[briblue] localStorage plein pour "${key}" (${Math.round(serialized.length / 1024)} Ko):`, e?.name);
    return false;
  }
}

// ─── SAVE ────────────────────────────────────────────────────────────────────
export async function save(key, val) {
  const serialized = JSON.stringify(val);

  // Avertir si les données dépassent 900 Ko (limite Firestore ~1 Mo)
  if (serialized.length > 900_000) {
    console.warn(`[briblue] save("${key}"): données volumineuses (${Math.round(serialized.length/1024)} Ko) — photos non compressées ?`);
  }

  // ── GARDE-FOU anti-perte de clients ────────────────────────────────────────
  // Si une sauvegarde de bb_clients_v2 réduirait le nombre de clients de façon
  // suspecte (≥ 2 clients en moins), on fusionne avec les données existantes
  // plutôt que de remplacer. Protège contre les états React périmés.
  if (key === "bb_clients_v2" && Array.isArray(val)) {
    try {
      const existingRaw = localStorage.getItem("briblue_bb_clients_v2");
      if (existingRaw) {
        const existing = JSON.parse(existingRaw);
        if (Array.isArray(existing) && existing.length > val.length + 1) {
          console.warn(`[briblue] GARDE-FOU clients : tentative de sauvegarder ${val.length} clients alors que ${existing.length} existent — fusion automatique.`);
          // Fusionner : garder les clients existants absents du nouveau tableau
          const merged = mergeArrayById(val, existing);
          return save(key, merged); // relancer avec la version fusionnée
        }
      }
    } catch { /* noop */ }
  }

  // 1. Sauvegarder localement en priorité absolue
  // FIX #1 — si localStorage est plein, purge les vignettes photo et réessaie
  writeLS(key, serialized);

  // 2. Mettre dans la queue (protection si le réseau échoue)
  offlineQueue.pending[key] = val;
  _persistQueue(); // persister la queue → survit à la fermeture de l'app

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
        if (offlineQueue.pending[key] === latest) { delete offlineQueue.pending[key]; _persistQueue(); }
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
        if (offlineQueue.pending[key] === latest) { delete offlineQueue.pending[key]; _persistQueue(); }
      } catch (e) {
        console.warn(`[briblue] saveToFirebaseSDK("${key}") échoué:`, e?.message);
        // Fallback REST si le SDK échoue
        try {
          await saveViaREST({ [key]: latest }, false);
          if (offlineQueue.pending[key] === latest) { delete offlineQueue.pending[key]; _persistQueue(); }
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
      // Préférer le timestamp par clé (mis à jour par sign-contract) plutôt que le timestamp global
      const remoteKeyTs = allData[`_savedAt_${key}`];
      const remoteGlobalTs = allData["_lastSavedAt"];
      const remoteTime = remoteKeyTs
        ? new Date(remoteKeyTs).getTime()
        : remoteGlobalTs ? new Date(remoteGlobalTs).getTime() : 0;
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
// ─── FIX #5 : expose invalidation du cache pour forcer un re-fetch Firebase ──
export function invalidateDocCache() {
  _getDocCache = null;
  _getDocCacheAt = 0;
}

if (typeof window !== "undefined") {
  // Restaurer la queue offline dès le chargement du module (données d'une session précédente)
  _loadPersistedQueue();

  // FIX #5 — au retour en ligne : vider le cache ET flusher la queue
  window.addEventListener("online", () => {
    invalidateDocCache(); // force un nouveau getDoc au prochain load/reconcile
    flushOfflineQueue();
  });

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