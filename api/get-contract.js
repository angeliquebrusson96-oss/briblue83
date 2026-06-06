/* global process, Buffer */
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT manquant");
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(sa);
  } catch {
    serviceAccount = JSON.parse(Buffer.from(sa, 'base64').toString('utf8'));
  }
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const COLL = db.collection("briblue");

// Lit un champ depuis le nouveau document OU depuis l'ancien app_data (fallback migration)
async function readField(docName, field, legacyKey) {
  const snap = await COLL.doc(docName).get();
  if (snap.exists) {
    const val = snap.data()[field];
    if (val !== undefined) return val;
  }
  // Fallback : ancien document app_data
  const legacy = await COLL.doc("app_data").get();
  if (legacy.exists) return legacy.data()[legacyKey] ?? null;
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { clientId } = req.query;
  if (!clientId) return res.status(400).json({ error: "clientId manquant" });

  try {
    // Lecture parallèle des deux documents concernés
    const [clients, contrats] = await Promise.all([
      readField("clients",  "data", "bb_clients_v2"),
      readField("contrats", "data", "bb_contrats_v1"),
    ]);

    const clientList = Array.isArray(clients) ? clients : [];
    const client = clientList.find(c => c.id === clientId);
    if (!client) return res.status(404).json({ error: `Client introuvable (id: ${clientId})` });

    const contractId = `CT-${clientId}`;
    const contrat = (contrats && contrats[contractId]) || null;

    return res.status(200).json({
      client: {
        id:               client.id,
        nom:              client.nom,
        adresse:          client.adresse          || "",
        formule:          client.formule          || "",
        bassin:           client.bassin           || "",
        volume:           client.volume           || 0,
        prixPassageE:     client.prixPassageE     || 0,
        prixPassageC:     client.prixPassageC     || 0,
        dateDebut:        client.dateDebut        || "",
        dateFin:          client.dateFin          || "",
        moisParMois:      client.moisParMois      || {},
        email:            client.email            || "",
        notesTarifaires:  client.notesTarifaires  || "",
      },
      contrat,
      dejaSigné: contrat?.statut === "signe_complet",
      signedAt:  contrat?.signedAt || null,
    });
  } catch (err) {
    console.error("get-contract error:", err);
    return res.status(500).json({ error: err.message });
  }
}
