/* global process, Buffer */
// ─── LECTURE PHOTO VIA ADMIN SDK (proxy base64) ──────────────────────────────
// Contourne l'absence de CORS sur le bucket Firebase Storage : un <img> classique
// affiche les photos sans souci, mais html2canvas (génération PDF) charge les
// images en mode CORS strict et échoue silencieusement sans en-tête ACAO,
// ce qui produit un PDF entièrement blanc. Ce proxy télécharge le fichier
// côté serveur (pas de CORS pour un appel serveur-à-serveur) et le renvoie
// en base64, prêt à être intégré directement dans le HTML avant capture.
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

// Extrait le chemin d'objet ("photos/xxx.jpg") depuis une clé simple ou une URL complète.
function extractPath(input) {
  if (!input) return null;
  if (!input.includes("://")) return input.replace(/^\/+/, "");
  const m = input.match(/\/o\/([^?]+)/); // format firebasestorage.googleapis.com/v0/b/.../o/<path>?alt=media
  if (m) return decodeURIComponent(m[1]);
  const m2 = input.match(/^https:\/\/storage\.googleapis\.com\/[^/]+\/(.+)$/); // format storage.googleapis.com/BUCKET/<path>
  if (m2) return decodeURIComponent(m2[1]);
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const raw = req.query?.url || req.query?.key;
  const path = extractPath(raw);
  if (!path) return res.status(400).json({ error: "url ou key requis" });

  try {
    const bucket = getStorage().bucket(BUCKET);
    const file = bucket.file(path);
    const [buffer] = await file.download();
    const [meta] = await file.getMetadata().catch(() => [{}]);
    const contentType = meta?.contentType || "image/jpeg";
    return res.status(200).json({ dataUrl: `data:${contentType};base64,${buffer.toString("base64")}` });
  } catch (err) {
    console.error("[briblue] get-photo error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
