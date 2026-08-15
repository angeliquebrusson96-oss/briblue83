/* global process, Buffer */
// ─── CORRECTION PONCTUELLE D'UN CLIENT VIA ADMIN SDK ─────────────────────────
// Même pattern que update-contract.js / update-livraison.js / update-versement.js :
// contourne l'auth Firebase client (peu fiable) pour garantir qu'une correction
// ponctuelle (ex: date de fin de contrat erronée) atteint réellement Firestore.
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
const CLIENTS_DOC = db.collection("briblue").doc("clients");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { clientId, patch } = req.body || {};
  if (!clientId) return res.status(400).json({ error: "clientId requis" });
  if (!patch || typeof patch !== "object") return res.status(400).json({ error: "patch requis" });

  try {
    let found = false;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(CLIENTS_DOC);
      const data = Array.isArray(snap.data()?.data) ? snap.data().data : [];
      const nextData = data.map(c => {
        if (c?.id !== clientId) return c;
        found = true;
        return { ...c, ...patch };
      });
      tx.set(CLIENTS_DOC, { data: nextData, savedAt: new Date().toISOString() }, { merge: true });
    });
    if (!found) return res.status(404).json({ error: "clientId introuvable" });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[briblue] update-client error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
