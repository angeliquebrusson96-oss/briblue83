import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT manquant");
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(sa);
  } catch(e) {
    serviceAccount = JSON.parse(Buffer.from(sa, 'base64').toString('utf8'));
  }
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { clientId } = req.query;
  if (!clientId) return res.status(400).json({ error: "clientId manquant" });

  try {
    const snap = await db.collection("briblue").doc("app_data").get();
    if (!snap.exists) return res.status(500).json({ error: "Document app_data introuvable" });

    const allData = snap.data() || {};
    const clients = allData["bb_clients_v2"] || [];
    const client = clients.find(c => c.id === clientId);
    if (!client) return res.status(404).json({ error: `Client introuvable (id: ${clientId})` });

    const contrats = allData["bb_contrats_v1"] || {};
    const contractId = `CT-${clientId}`;
    const contrat = contrats[contractId] || null;

    return res.status(200).json({
      client: {
        id: client.id,
        nom: client.nom,
        adresse: client.adresse || "",
        formule: client.formule || "",
        bassin: client.bassin || "",
        volume: client.volume || 0,
        prixPassageE: client.prixPassageE || 0,
        prixPassageC: client.prixPassageC || 0,
        dateDebut: client.dateDebut || "",
        dateFin: client.dateFin || "",
        moisParMois: client.moisParMois || {},
        email: client.email || "",
        notesTarifaires: client.notesTarifaires || "",
      },
      contrat,
      dejaSigné: contrat?.statut === "signe_complet",
      signedAt: contrat?.signedAt || null,
    });
  } catch (err) {
    console.error("get-contract error:", err);
    return res.status(500).json({ error: err.message });
  }
}
