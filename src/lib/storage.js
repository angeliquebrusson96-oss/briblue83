import { getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { DOCS, KEY_MAP, REST_URLS, auth } from "./firebase";

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
// Toutes les clés de type tableau utilisent le MERGE par ID :
// aucune donnée existante dans l'une des deux sources ne peut disparaître.
// Note : une suppression intentionnelle locale peut réapparaître depuis Firebase
// jusqu'au prochain push ; c'est un compromis acceptable face au risque de perte
// totale (comportement précédent "timestamp gagne").
const MERGE_ARRAY_KEYS = new Set([
  "bb_clients_v2",
  "bb_passages_v2",    // ← ajouté : empêche l'écrasement de rapports par des données locales vides
  "bb_rdvs_v1",        // ← idem
  "bb_livraisons_v1",  // ← idem
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

// Groupe les clés en attente par document Firestore cible
function _groupByDoc(pending) {
  const byDoc = {}; // { docName: { field: value, ... } }
  const now = new Date().toISOString();
  for (const [key, val] of Object.entries(pending)) {
    const mapping = KEY_MAP[key];
    if (!mapping) continue;
    if (!byDoc[mapping.doc]) byDoc[mapping.doc] = { savedAt: now };
    byDoc[mapping.doc][mapping.field] = val;
  }
  return byDoc;
}

// Sauvegarde REST Firestore par document (iOS — SDK tué en arrière-plan)
async function saveViaREST(pending, keepalive = false) {
  if (!Object.keys(pending).length) return;
  const token = await getAuthToken();
  if (!token) {
    for (const [k, v] of Object.entries(pending)) await saveToFirebaseSDK(k, v);
    return;
  }
  const byDoc = _groupByDoc(pending);
  for (const [docName, docFields] of Object.entries(byDoc)) {
    const url = REST_URLS[docName];
    if (!url) continue;
    const fields = {};
    const mask = [];
    for (const [f, v] of Object.entries(docFields)) {
      fields[f] = toFirestoreValue(v);
      mask.push(`updateMask.fieldPaths=${encodeURIComponent(f)}`);
    }
    const patchUrl = `${url}?${mask.join("&")}`;
    const opts = {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ fields }),
    };
    if (keepalive) opts.keepalive = true;
    const res = await fetch(patchUrl, opts);
    if (res.status === 401) {
      const newToken = await refreshAuthToken(true);
      if (newToken) {
        opts.headers["Authorization"] = `Bearer ${newToken}`;
        opts.keepalive = false;
        await fetch(patchUrl, opts).catch(() => {});
      }
      continue;
    }
    if (!res.ok) throw new Error(`REST ${res.status} (${docName})`);
  }
}

// ─── FIREBASE SDK (desktop/Android, connexion stable) ───────────────────────
async function saveToFirebaseSDK(key, val) {
  const mapping = KEY_MAP[key];
  if (!mapping) return;
  const now = new Date().toISOString();
  await setDoc(DOCS[mapping.doc], { [mapping.field]: val, savedAt: now }, { merge: true });
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

// ─── RÉCUPÉRATION FORCÉE DEPUIS FIREBASE ────────────────────────────────────
// Ignore complètement les timestamps locaux et tire les données depuis Firebase.
// Fusionne avec le local (le local l'emporte pour les conflits d'ID).
// Vérifie aussi l'ancien document app_data (legacy) pour récupérer des données
// antérieures à la migration.
// Retourne { restored: number, details: { key: count, ... } }
export async function forceRestoreFromFirebase() {
  const details = {};
  let totalRestored = 0;

  try {
    // 1. Lire tous les documents Firestore
    const docNames = [...new Set(Object.values(KEY_MAP).map(m => m.doc))];
    const snapshots = {};
    await Promise.all(docNames.map(async (docName) => {
      try {
        const s = await getDoc(DOCS[docName]);
        snapshots[docName] = s.exists() ? s.data() : null;
      } catch { snapshots[docName] = null; }
    }));

    // 2. Tenter aussi le document legacy app_data
    let legacyData = null;
    try {
      const legacySnap = await getDoc(DOCS.app_data);
      if (legacySnap.exists()) legacyData = legacySnap.data();
    } catch { /* noop */ }

    // 3. Pour chaque clé : merge Firebase → local
    for (const [key, mapping] of Object.entries(KEY_MAP)) {
      try {
        const docSnap = snapshots[mapping.doc];
        let remoteVal = docSnap?.[mapping.field] ?? null;

        // Fallback legacy
        if (remoteVal == null && legacyData) remoteVal = legacyData[key] ?? null;

        if (remoteVal == null) continue;

        const localRaw = localStorage.getItem("briblue_" + key);
        const localVal = localRaw ? JSON.parse(localRaw) : null;

        let finalVal;
        if (Array.isArray(remoteVal)) {
          const localArr  = Array.isArray(localVal) ? localVal : [];
          const remoteArr = remoteVal;
          // Merge : local prioritaire pour les conflits, Firebase ajoute les absents
          finalVal = mergeArrayById(localArr, remoteArr);
          const added = finalVal.length - localArr.length;
          if (added > 0) {
            details[key] = added;
            totalRestored += added;
          }
        } else if (typeof remoteVal === "object" && remoteVal !== null) {
          // Pour les objets : prendre Firebase si local est vide
          finalVal = (localVal && Object.keys(localVal).length > 0) ? localVal : remoteVal;
        } else {
          finalVal = localVal ?? remoteVal;
        }

        localStorage.setItem("briblue_" + key, JSON.stringify(finalVal));
        localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: Date.now() }));
      } catch { /* noop */ }
    }
  } catch (e) {
    console.warn("[briblue] forceRestoreFromFirebase:", e?.message);
  }

  return { restored: totalRestored, details };
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
    _loadPersistedQueue();

    const KEYS = ["bb_clients_v2","bb_passages_v2","bb_livraisons_v1","bb_rdvs_v1",
                  "bb_stock_v1","bb_contrats_v1","bb_versements_v1","bb_retards_carnet_v1","bb_notes_v1"];

    // ── Lire TOUS les documents Firestore en parallèle ───────────────────────
    const docNames = [...new Set(KEYS.map(k => KEY_MAP[k]?.doc).filter(Boolean))];
    const snapshots = {};
    await Promise.all(docNames.map(async (docName) => {
      try {
        const s = await getDoc(DOCS[docName]);
        snapshots[docName] = s.exists() ? s.data() : null;
      } catch { snapshots[docName] = null; }
    }));

    // ── Migration automatique depuis l'ancien app_data (1ère connexion) ──────
    const hasNewDocs = docNames.some(d => snapshots[d] !== null);
    let legacyData = null;
    if (!hasNewDocs) {
      try {
        const legacySnap = await getDoc(DOCS.app_data);
        if (legacySnap.exists()) {
          legacyData = legacySnap.data();
          console.info("[briblue] 🔄 Migration Firebase : app_data → documents séparés (clients, passages, contrats…)");
        }
      } catch { /* noop */ }
    }

    const toPush = {}; // { docName: { field: value, ... } }
    let needsPush = false;
    const now = new Date().toISOString();

    for (const key of KEYS) {
      const mapping = KEY_MAP[key];
      if (!mapping) continue;

      // Valeur distante (nouveau doc ou legacy)
      let remoteVal = null;
      let remoteTime = 0;
      const docSnap = snapshots[mapping.doc];
      if (docSnap) {
        remoteVal = docSnap[mapping.field] ?? null;
        remoteTime = docSnap.savedAt ? new Date(docSnap.savedAt).getTime() : 0;
      } else if (legacyData) {
        remoteVal = legacyData[key] ?? null;
        const legacyTs = legacyData[`_savedAt_${key}`] || legacyData["_lastSavedAt"];
        remoteTime = legacyTs ? new Date(legacyTs).getTime() : 0;
      }

      // Valeur locale
      let local = null;
      let localTime = 0;
      try { const ls = localStorage.getItem("briblue_" + key); if (ls) local = JSON.parse(ls); } catch {} // eslint-disable-line no-empty
      try { const m = localStorage.getItem("briblue_meta_" + key); if (m) localTime = JSON.parse(m).savedAt || 0; } catch {} // eslint-disable-line no-empty

      if (local == null && remoteVal == null) continue;

      // Rien en local → prendre Firebase
      if (local == null) {
        try {
          localStorage.setItem("briblue_" + key, JSON.stringify(remoteVal));
          localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: remoteTime }));
        } catch {} // eslint-disable-line no-empty
        continue;
      }

      // Rien sur Firebase → pousser le local
      if (remoteVal == null) {
        if (!toPush[mapping.doc]) toPush[mapping.doc] = { savedAt: now };
        toPush[mapping.doc][mapping.field] = local;
        needsPush = true;
        continue;
      }

      // ── MERGE pour les tableaux (clients, passages, rdvs, livraisons) ─────
      if (MERGE_ARRAY_KEYS.has(key)) {
        const localArr  = Array.isArray(local)     ? local     : [];
        const remoteArr = Array.isArray(remoteVal) ? remoteVal : [];
        const merged = localTime >= remoteTime
          ? mergeArrayById(localArr, remoteArr)
          : mergeArrayById(remoteArr, localArr);
        const hasNewLocal  = merged.length > remoteArr.length;
        const hasNewRemote = merged.length > localArr.length;
        try {
          localStorage.setItem("briblue_" + key, JSON.stringify(merged));
          localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: Date.now() }));
        } catch {} // eslint-disable-line no-empty
        if (localTime >= remoteTime || hasNewLocal) {
          if (!toPush[mapping.doc]) toPush[mapping.doc] = { savedAt: now };
          toPush[mapping.doc][mapping.field] = merged;
          needsPush = true;
        }
        if (hasNewRemote) console.info(`[briblue] ✅ MERGE "${key}" : ${merged.length - localArr.length} entrée(s) restaurée(s).`);
        continue;
      }

      // ── Timestamp gagne pour les objets (stock, contrats…) ───────────────
      if (localTime >= remoteTime) {
        if (!toPush[mapping.doc]) toPush[mapping.doc] = { savedAt: now };
        toPush[mapping.doc][mapping.field] = local;
        needsPush = true;
      } else {
        if (!offlineQueue.pending[key]) {
          try {
            localStorage.setItem("briblue_" + key, JSON.stringify(remoteVal));
            localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: remoteTime }));
          } catch {} // eslint-disable-line no-empty
        }
      }
    }

    if (needsPush) {
      await Promise.all(
        Object.entries(toPush).map(([docName, fields]) =>
          setDoc(DOCS[docName], fields, { merge: true })
        )
      );
      _persistQueue();
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
  if (key === "bb_clients_v2" && Array.isArray(val)) {
    try {
      const existingRaw = localStorage.getItem("briblue_bb_clients_v2");
      if (existingRaw) {
        const existing = JSON.parse(existingRaw);
        if (Array.isArray(existing) && existing.length > val.length + 1) {
          console.warn(`[briblue] GARDE-FOU clients : ${val.length} → ${existing.length} clients — fusion automatique.`);
          return save(key, mergeArrayById(val, existing));
        }
      }
    } catch { /* noop */ }
  }

  // ── GARDE-FOU anti-perte de passages ────────────────────────────────────────
  // Même protection que les clients : si une sauvegarde supprimerait > 3 rapports
  // d'un coup (état React périmé, rechargement partiel…), on fusionne.
  if (key === "bb_passages_v2" && Array.isArray(val)) {
    try {
      const existingRaw = localStorage.getItem("briblue_bb_passages_v2");
      if (existingRaw) {
        const existing = JSON.parse(existingRaw);
        if (Array.isArray(existing) && existing.length > val.length + 3) {
          console.warn(`[briblue] GARDE-FOU passages : tentative de sauvegarder ${val.length} passages alors que ${existing.length} existent — fusion automatique.`);
          return save(key, mergeArrayById(val, existing));
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

// ─── CACHE getDoc par document (8s — couvre le boot, périmé avant le poll) ──
const _docCache    = {}; // { docName: { snap, at } }
const _docPromises = {}; // { docName: Promise }
const GET_DOC_CACHE_MS = 8_000;

async function fetchDoc(docName) {
  const cached = _docCache[docName];
  if (cached && Date.now() - cached.at < GET_DOC_CACHE_MS) return cached.snap;
  if (_docPromises[docName]) return _docPromises[docName];
  _docPromises[docName] = getDoc(DOCS[docName]).then(snap => {
    _docCache[docName] = { snap, at: Date.now() };
    delete _docPromises[docName];
    return snap;
  }).catch(e => { delete _docPromises[docName]; throw e; });
  return _docPromises[docName];
}

// ─── LOAD ─────────────────────────────────────────────────────────────────────
export async function load(key, fallback) {
  let localData = null;
  let localTime = 0;
  try {
    const ls = localStorage.getItem("briblue_" + key);
    if (ls !== null) localData = JSON.parse(ls);
    const m = localStorage.getItem("briblue_meta_" + key);
    if (m) localTime = JSON.parse(m).savedAt || 0;
  } catch {} // eslint-disable-line no-empty

  if (offlineQueue.pending[key] !== undefined) return localData ?? fallback;

  const mapping = KEY_MAP[key];
  if (!mapping) return localData ?? fallback;

  try {
    const snap = await fetchDoc(mapping.doc);
    if (snap.exists()) {
      const docData = snap.data();
      const remoteVal  = docData[mapping.field];
      const remoteTime = docData.savedAt ? new Date(docData.savedAt).getTime() : 0;
      if (remoteVal !== undefined) {
        if (localData !== null && localTime >= remoteTime) return localData;
        try { localStorage.setItem("briblue_" + key, JSON.stringify(remoteVal)); } catch {} // eslint-disable-line no-empty
        return remoteVal;
      }
    }
  } catch { /* réseau indisponible → utiliser local */ }

  return localData ?? fallback;
}

// ─── EVENT LISTENERS ─────────────────────────────────────────────────────────
// ─── FIX #5 : expose invalidation du cache pour forcer un re-fetch Firebase ──
export function invalidateDocCache() {
  // Vider le cache de TOUS les documents
  Object.keys(_docCache).forEach(k => delete _docCache[k]);
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

// ─── REAL-TIME LISTENERS ─────────────────────────────────────────────────────
// Écoute les documents Firestore en temps réel avec onSnapshot.
// Dès qu'un autre appareil (ou la même session) modifie les données,
// le callback est appelé avec les nouvelles valeurs → React se met à jour.
//
// callbacks: {
//   clients: (array) => void        — bb_clients_v2
//   passages: (array) => void       — bb_passages_v2
//   rdvs: (array) => void           — bb_rdvs_v1
//   livraisons: (array) => void     — bb_livraisons_v1
//   contrats: (obj) => void         — bb_contrats_v1
//   stock: (obj) => void            — bb_stock_v1
//   meta: ({ notes, versements, retards }) => void
// }
// Retourne une fonction de désabonnement à appeler dans useEffect cleanup.
export function subscribeToRealtime(callbacks) {
  const unsubscribers = [];

  // Correspondance document → clé localStorage → champ → callback
  const DOC_SPEC = {
    clients:    { keys: ["bb_clients_v2"],                          cb: (d) => callbacks.clients?.(d["data"]) },
    passages:   { keys: ["bb_passages_v2"],                         cb: (d) => callbacks.passages?.(d["data"]) },
    rdvs:       { keys: ["bb_rdvs_v1"],                             cb: (d) => callbacks.rdvs?.(d["data"]) },
    livraisons: { keys: ["bb_livraisons_v1"],                       cb: (d) => callbacks.livraisons?.(d["data"]) },
    contrats:   { keys: ["bb_contrats_v1"],                         cb: (d) => callbacks.contrats?.(d["data"]) },
    stock:      { keys: ["bb_stock_v1"],                            cb: (d) => callbacks.stock?.(d["data"]) },
    meta:       { keys: ["bb_versements_v1","bb_retards_carnet_v1","bb_notes_v1"], cb: (d) => callbacks.meta?.(d) },
  };

  for (const [docName, spec] of Object.entries(DOC_SPEC)) {
    if (!callbacks[docName]) continue; // pas de callback → inutile d'écouter

    const unsub = onSnapshot(
      DOCS[docName],
      { includeMetadataChanges: false }, // ignorer les changements de métadonnées (hasPendingWrites, etc.)
      (snap) => {
        if (!snap.exists()) return;

        // ── Ignorer si nous avons des écritures en attente sur ce document ──
        // (nos propres modifications pas encore confirmées par Firebase)
        const hasPending = spec.keys.some(k => offlineQueue.pending[k] !== undefined);
        if (hasPending) return;

        const data = snap.data();

        // ── Mettre à jour le cache getDoc pour éviter un re-fetch inutile ──
        _docCache[docName] = { snap, at: Date.now() };

        // ── Mettre à jour localStorage ──────────────────────────────────────
        const remoteTime = data.savedAt ? new Date(data.savedAt).getTime() : 0;
        for (const key of spec.keys) {
          const mapping = KEY_MAP[key];
          if (!mapping) continue;
          const val = data[mapping.field];
          if (val === undefined) continue;
          try {
            localStorage.setItem("briblue_" + key, JSON.stringify(val));
            localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: remoteTime }));
          } catch { /* quota → pas critique, le state React sera à jour */ }
        }

        // ── Notifier l'app React ────────────────────────────────────────────
        spec.cb(data);
      },
      (err) => {
        // Erreur réseau normale (offline) — silencieuse
        if (err.code !== "unavailable") {
          console.warn(`[briblue] realtime(${docName}):`, err.message);
        }
      }
    );

    unsubscribers.push(unsub);
  }

  return () => unsubscribers.forEach(u => u());
}