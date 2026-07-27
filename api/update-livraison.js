/* global process, Buffer */
// ─── SUPPRESSION LIVRAISON VIA ADMIN SDK ─────────────────────────────────────
// Même root cause que update-contract.js / update-versement.js : l'écriture
// faite depuis le navigateur (SDK client / REST, storage.js) dépend de l'auth
// anonyme Firebase, peu fiable. Résultat observé : l'admin supprime des
// livraisons en double, ça disparaît localement (persistant après F5) mais
// n'atteint jamais Firestore → le carnet du client, qui ne lit que Firestore,
// continue d'afficher les doublons. Cette route passe par le SDK Admin (pas
// d'auth client requise) pour garantir que la suppression atteint réellement
// Firestore.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT manquant");
  let serviceAccount;
  try { serviceAccount = JSON.parse(sa); }
  catch { serviceAccount = JSON.parse(Buffer.from(sa, "base64").toString("utf8")); }
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const LIVRAISONS_DOC = db.collection("briblue").doc("livraisons");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id, action, livraison } = req.body || {};

  try {
    if (action === "restore") {
      if (!livraison?.id) return res.status(400).json({ error: "livraison.id requis" });
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(LIVRAISONS_DOC);
        const current = snap.exists ? snap.data() : {};
        const data = Array.isArray(current.data) ? current.data : [];
        const deletedIds = Array.isArray(current.deletedIds) ? current.deletedIds : [];
        const nextData = data.some(l => l?.id === livraison.id) ? data : [...data, livraison];
        const nextDeletedIds = deletedIds.filter(x => x !== livraison.id);
        tx.set(LIVRAISONS_DOC, { data: nextData, deletedIds: nextDeletedIds, savedAt: new Date().toISOString() }, { merge: true });
      });
      return res.status(200).json({ success: true });
    }

    if (!id) return res.status(400).json({ error: "id requis" });
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(LIVRAISONS_DOC);
      const current = snap.exists ? snap.data() : {};
      const data = Array.isArray(current.data) ? current.data : [];
      const deletedIds = Array.isArray(current.deletedIds) ? current.deletedIds : [];
      const nextData = data.filter(l => l?.id !== id);
      const nextDeletedIds = deletedIds.includes(id) ? deletedIds : [...deletedIds, id];
      tx.set(LIVRAISONS_DOC, { data: nextData, deletedIds: nextDeletedIds, savedAt: new Date().toISOString() }, { merge: true });
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[briblue] update-livraison error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
