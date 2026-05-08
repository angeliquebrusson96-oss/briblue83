import { getDoc, setDoc } from "firebase/firestore";
import { APP_DOC, FIRESTORE_REST_URL, auth } from "./firebase";

export const IS_IOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !window.MSStream;

const FIREBASE_DEBOUNCE_MS = 800;
const offlineQueue    = { pending: {} };
const _debounceTimers = {};

let _cachedAuthToken = null;

async function refreshAuthToken() {
  try {
    const user = auth.currentUser;
    if (!user) return;
    _cachedAuthToken = await user.getIdToken(false);
  } catch {}
}

if (typeof window !== "undefined") {
  setTimeout(refreshAuthToken, 2000);
  setInterval(refreshAuthToken, 45 * 60 * 1000);
}

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

function flushViaKeepalive(pending) {
  const keys = Object.keys(pending);
  if (!keys.length) return;
  const fields = {};
  const updateMask = [];
  keys.forEach(key => {
    fields[key] = toFirestoreValue(pending[key]);
    updateMask.push(`updateMask.fieldPaths=${encodeURIComponent(key)}`);
  });
  fields["_lastSavedAt"] = { stringValue: new Date().toISOString() };
  updateMask.push("updateMask.fieldPaths=_lastSavedAt");
  const url = `${FIRESTORE_REST_URL}?${updateMask.join("&")}`;
  const headers = { "Content-Type": "application/json" };
  if (_cachedAuthToken) headers["Authorization"] = `Bearer ${_cachedAuthToken}`;
  try {
    fetch(url, { method: "PATCH", keepalive: true, headers, body: JSON.stringify({ fields }) }).catch(() => {});
  } catch {}
}

export function flushPendingNow() {
  const keys = Object.keys(offlineQueue.pending);
  if (!keys.length) return;
  Object.keys(_debounceTimers).forEach(k => { clearTimeout(_debounceTimers[k]); delete _debounceTimers[k]; });
  if (IS_IOS) {
    flushViaKeepalive({ ...offlineQueue.pending });
    keys.forEach(k => { delete offlineQueue.pending[k]; });
  } else {
    keys.forEach(key => {
      const val = offlineQueue.pending[key];
      saveToFirebase(key, val)
        .then(() => { if (offlineQueue.pending[key] === val) delete offlineQueue.pending[key]; })
        .catch(() => {});
    });
  }
}

async function saveToFirebase(key, val) {
  await setDoc(APP_DOC, { [key]: val, _lastSavedAt: new Date().toISOString() }, { merge: true });
}

async function flushOfflineQueue() {
  const keys = Object.keys(offlineQueue.pending);
  if (!keys.length) return;
  for (const key of keys) {
    try {
      await saveToFirebase(key, offlineQueue.pending[key]);
      delete offlineQueue.pending[key];
    } catch {}
  }
}

export async function reconcileOnBoot() {
  try {
    const snap    = await getDoc(APP_DOC);
    const remote  = snap.exists() ? snap.data() : {};
    const remoteTime = remote["_lastSavedAt"] ? new Date(remote["_lastSavedAt"]).getTime() : 0;
    const KEYS = ["bb_clients_v2","bb_passages_v2","bb_livraisons_v1","bb_rdvs_v1","bb_stock_v1","bb_contrats_v1"];
    const toPush = {};
    let needsPush = false;
    for (const key of KEYS) {
      let local = null;
      try { const ls = localStorage.getItem("briblue_" + key); if (ls) local = JSON.parse(ls); } catch {}
      if (local == null) {
        if (remote[key] != null) { try { localStorage.setItem("briblue_" + key, JSON.stringify(remote[key])); } catch {} }
        continue;
      }
      if (remote[key] == null) { toPush[key] = local; needsPush = true; continue; }
      let localTime = 0;
      try { const m = localStorage.getItem("briblue_meta_" + key); if (m) localTime = JSON.parse(m).savedAt || 0; } catch {}
      if (localTime > remoteTime) {
        toPush[key] = local; needsPush = true;
      } else {
        try {
          localStorage.setItem("briblue_" + key, JSON.stringify(remote[key]));
          localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: remoteTime }));
        } catch {}
      }
    }
    if (needsPush) { toPush["_lastSavedAt"] = new Date().toISOString(); await setDoc(APP_DOC, toPush, { merge: true }); }
  } catch (e) { console.warn("[briblue] reconcile skipped:", e?.message); }
}

export async function save(key, val) {
  try {
    localStorage.setItem("briblue_" + key, JSON.stringify(val));
    localStorage.setItem("briblue_meta_" + key, JSON.stringify({ savedAt: Date.now() }));
  } catch {}
  offlineQueue.pending[key] = val;
  if (!navigator.onLine) return;
  if (IS_IOS) {
    if (_debounceTimers[key]) { clearTimeout(_debounceTimers[key]); delete _debounceTimers[key]; }
    try {
      await saveToFirebase(key, val);
      if (offlineQueue.pending[key] === val) delete offlineQueue.pending[key];
    } catch {}
  } else {
    if (_debounceTimers[key]) clearTimeout(_debounceTimers[key]);
    _debounceTimers[key] = setTimeout(async () => {
      delete _debounceTimers[key];
      const latest = offlineQueue.pending[key];
      if (latest === undefined) return;
      try { await saveToFirebase(key, latest); if (offlineQueue.pending[key] === latest) delete offlineQueue.pending[key]; } catch {}
    }, FIREBASE_DEBOUNCE_MS);
  }
}

export async function load(key, fallback) {
  try {
    const snap = await getDoc(APP_DOC);
    if (snap.exists()) {
      const allData = snap.data();
      if (key in allData) {
        try { localStorage.setItem("briblue_" + key, JSON.stringify(allData[key])); } catch {}
        return allData[key];
      }
    }
    const ls = localStorage.getItem("briblue_" + key);
    if (ls) return JSON.parse(ls);
    return fallback;
  } catch {
    try { const ls = localStorage.getItem("briblue_" + key); if (ls) return JSON.parse(ls); } catch {}
    return fallback;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => { flushOfflineQueue(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushPendingNow(); });
  window.addEventListener("pagehide", () => { flushPendingNow(); });
  window.addEventListener("beforeunload", () => { flushPendingNow(); });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { reconcileOnBoot(); });
  } else {
    setTimeout(reconcileOnBoot, 0);
  }
  window.briblue = window.briblue || {};
  window.briblue._debug = () => ({ pending: {...offlineQueue.pending}, online: navigator.onLine, isIOS: IS_IOS, hasToken: !!_cachedAuthToken });
  window.briblue._forceFlush = flushPendingNow;
}
