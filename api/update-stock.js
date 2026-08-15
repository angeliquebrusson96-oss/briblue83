/* global process, Buffer */
// ─── CORRECTION PONCTUELLE DU STOCK VIA ADMIN SDK ────────────────────────────
// Même pattern que update-client.js / update-livraison.js. Permet de retirer
// ou corriger une entrée de stock (produit et/ou ses métadonnées) de façon
// fiable, sans dépendre de l'auth Firebase client.
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
      // ⚠️ set(..., {merge:true}) sur un champ-objet ("data") fait un DEEP
      // MERGE des clés imbriquées : omettre une clé ne la supprime PAS, elle
      // est simplement ignorée/conservée. Seul un FieldValue.delete() explicite
      // sur cette clé imbriquée précise la supprime réellement.
      const now = new Date().toISOString();
      await Promise.all([
        STOCK_DOC.set({ data: { [nom]: FieldValue.delete() }, savedAt: now }, { merge: true }),
        STOCK_META_DOC.set({ data: { [nom]: FieldValue.delete() }, savedAt: now }, { merge: true }),
      ]);
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: "action doit être 'delete'" });
  } catch (err) {
    console.error("[briblue] update-stock error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
