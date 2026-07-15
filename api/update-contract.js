/* global process, Buffer */
// ─── SUPPRESSION / RÉINITIALISATION CONTRAT VIA ADMIN SDK ────────────────────
// Les écritures Firestore faites depuis le navigateur (SDK client / REST) via
// storage.js dépendent de l'auth anonyme Firebase, qui s'est révélée peu
// fiable (cf. photos, signatures). Résultat observé : un "reset" de contrat
// semblait fonctionner (persistant en localStorage après F5) mais n'avait
// jamais atteint Firestore, donc le contrat restait "signe_complet" côté
// serveur → le client rouvrant le lien de signature voyait "déjà signé".
// Cette route passe par le SDK Admin (pas d'auth client requise) pour
// garantir que l'action atteint réellement Firestore.
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
const CONTRATS_DOC = db.collection("briblue").doc("contrats");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { clientId, action } = req.body || {};
  if (!clientId) return res.status(400).json({ error: "clientId requis" });
  if (action !== "delete" && action !== "reset") return res.status(400).json({ error: "action doit être 'delete' ou 'reset'" });

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(CONTRATS_DOC);
      const contrats = { ...(snap.exists ? snap.data().data : {}) };
      // Toute entrée correspondant à ce client, quelle que soit sa clé
      // (cf. fallback de lecture Object.values(contrats).find(...) côté app).
      Object.keys(contrats).forEach(k => {
        if (k === `CT-${clientId}` || contrats[k]?.clientId === clientId) {
          if (action === "delete") {
            delete contrats[k];
          } else {
            contrats[k] = {
              ...contrats[k], clientId, statut: "cree",
              signatureClient: "", signaturePrestataire: "",
              signedAt: null, signedByPrestaAt: null,
            };
          }
        }
      });
      tx.set(CONTRATS_DOC, { data: contrats, savedAt: new Date().toISOString() }, { merge: true });
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[briblue] update-contract error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
