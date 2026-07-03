/* global process, Buffer */
// ─── UPLOAD PHOTO VIA ADMIN SDK ───────────────────────────────────────────────
// Contourne les règles Firebase Storage et l'auth anonyme.
// Utilisé par l'app PWA pour uploader les photos des rapports sans erreur 403/400.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const BUCKET = "briblue-729de.firebasestorage.app";

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT manquant");
  let serviceAccount;
  try { serviceAccount = JSON.parse(sa); }
  catch { serviceAccount = JSON.parse(Buffer.from(sa, "base64").toString("utf8")); }
  initializeApp({ credential: cert(serviceAccount), storageBucket: BUCKET });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { key, dataUrl } = req.body || {};
  if (!key || !dataUrl) return res.status(400).json({ error: "key et dataUrl requis" });

  // Valider le format data URL
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: "dataUrl invalide" });

  const [, , b64] = match;
  const buffer = Buffer.from(b64, "base64");

  // Limite taille : 6 Mo (photos compressées sont < 300 Ko normalement)
  if (buffer.length > 6 * 1024 * 1024) {
    return res.status(413).json({ error: "Photo trop grande (max 6 Mo)" });
  }

  try {
    // Spécifier le bucket explicitement — évite l'erreur si l'app Firebase
    // a été initialisée sans storageBucket (ex: depuis sign-contract.js)
    const bucket = getStorage().bucket(BUCKET);
    const file   = bucket.file(`photos/${key}.jpg`);

    await file.save(buffer, {
      contentType: "image/jpeg",
      metadata: { cacheControl: "public, max-age=31536000" },
    });

    // Rendre publique (accessible sans token)
    await file.makePublic();

    const url = `https://storage.googleapis.com/${BUCKET}/photos/${key}.jpg`;
    return res.status(200).json({ url });
  } catch (err) {
    console.error("[briblue] upload-photo error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
