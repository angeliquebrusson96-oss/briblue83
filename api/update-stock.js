/* global process, Buffer */
// ─── CORRECTION PONCTUELLE DU STOCK VIA ADMIN SDK ────────────────────────────
// Même pattern que update-client.js / update-livraison.js. Permet de retirer
// ou corriger une entrée de stock (produit et/ou ses métadonnées) de façon
// fiable, sans dépendre de l'auth Firebase client.
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
const STOCK_DOC = db.collection("briblue").doc("stock");
const STOCK_META_DOC = db.collection("briblue").doc("stock_meta");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, nom } = req.body || {};
  if (!nom) return res.status(400).json({ error: "nom requis" });

  try {
    if (action === "delete") {
      await db.runTransaction(async (tx) => {
        const [stockSnap, metaSnap] = await Promise.all([tx.get(STOCK_DOC), tx.get(STOCK_META_DOC)]);
        const stockData = { ...(stockSnap.data()?.data || {}) };
        const metaData = { ...(metaSnap.data()?.data || {}) };
        delete stockData[nom];
        delete metaData[nom];
        tx.set(STOCK_DOC, { data: stockData, savedAt: new Date().toISOString() }, { merge: true });
        tx.set(STOCK_META_DOC, { data: metaData, savedAt: new Date().toISOString() }, { merge: true });
      });
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: "action doit être 'delete'" });
  } catch (err) {
    console.error("[briblue] update-stock error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
