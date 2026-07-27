/* global process, Buffer */
// ─── TOGGLE MENSUALITÉ PAYÉE/NON PAYÉE VIA ADMIN SDK ─────────────────────────
// Même root cause que update-contract.js : l'écriture faite depuis le
// navigateur (SDK client / REST, storage.js) dépend de l'auth anonyme
// Firebase, qui s'est révélée peu fiable. Résultat observé : l'admin coche
// une mensualité comme payée (persistant en localStorage après F5, donc
// l'admin ne voit rien d'anormal) mais l'écriture n'atteint jamais Firestore
// → le carnet du client, qui lit uniquement Firestore, ne voit jamais le
// paiement. Cette route passe par le SDK Admin (pas d'auth client requise)
// pour garantir que l'action atteint réellement Firestore.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT manquant");
  let serviceAccount;
  try { serviceAccount = JSON.parse(sa); }
  catch { serviceAccount = JSON.parse(Buffer.from(sa, "base64").toString("utf8")); }
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const META_DOC = db.collection("briblue").doc("meta");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { key, paid } = req.body || {};
  if (!key || typeof key !== "string") return res.status(400).json({ error: "key requis" });

  try {
    await META_DOC.set({
      versements: { [key]: paid ? true : FieldValue.delete() },
      savedAt: new Date().toISOString(),
    }, { merge: true });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[briblue] update-versement error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
