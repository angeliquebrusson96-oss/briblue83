/* global process, Buffer */
// ─── MIGRATION PASSAGES : TABLEAU UNIQUE → UN DOCUMENT PAR PASSAGE ──────────
// Le document briblue/passages (un seul champ "data" contenant TOUS les
// passages) a fini par dépasser la limite Firestore de 1 Mo par document,
// bloquant TOUTE écriture de rapport pour TOUS les clients. Cette route copie
// chaque passage non supprimé vers briblue/passages/items/{passageId}
// (sous-collection, un document par passage — scale nativement, sans limite
// de taille globale). Idempotente : peut être rappelée sans risque.
//
// Actions :
//   POST { action: "migrate" }        → copie data[] → sous-collection items
//   POST { action: "shrink" }         → vide le champ "data" de l'ancien doc
//                                        une fois la migration confirmée
//   POST { action: "status" }         → compte les documents des deux côtés
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
const PASSAGES_DOC = db.collection("briblue").doc("passages");
const ITEMS_COL = PASSAGES_DOC.collection("items");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action } = req.body || {};

  try {
    if (action === "status") {
      const [oldSnap, itemsSnap] = await Promise.all([
        PASSAGES_DOC.get(),
        ITEMS_COL.count().get(),
      ]);
      const oldData = oldSnap.exists ? (oldSnap.data().data || []) : [];
      return res.status(200).json({
        oldDocPassagesCount: oldData.length,
        oldDocDeletedIdsCount: oldSnap.exists ? (oldSnap.data().deletedIds || []).length : 0,
        newSubcollectionCount: itemsSnap.data().count,
      });
    }

    if (action === "migrate") {
      const oldSnap = await PASSAGES_DOC.get();
      if (!oldSnap.exists) return res.status(200).json({ migrated: 0, message: "Aucun document source" });
      const data = Array.isArray(oldSnap.data().data) ? oldSnap.data().data : [];
      const deletedIds = new Set(oldSnap.data().deletedIds || []);
      const toMigrate = data.filter(p => p?.id && !deletedIds.has(p.id));

      // Firestore limite les batchs à 500 écritures — on découpe par précaution.
      let migrated = 0;
      for (let i = 0; i < toMigrate.length; i += 400) {
        const chunk = toMigrate.slice(i, i + 400);
        const batch = db.batch();
        for (const passage of chunk) {
          batch.set(ITEMS_COL.doc(String(passage.id)), passage);
        }
        await batch.commit();
        migrated += chunk.length;
      }
      return res.status(200).json({ migrated, skippedDeleted: data.length - toMigrate.length });
    }

    if (action === "shrink") {
      // Remplace le champ "data" surdimensionné par un tableau vide : le
      // document RESULTANT (après écriture) est minuscule, donc CETTE
      // écriture précise passe (Firestore valide la taille APRÈS écriture,
      // pas la taille actuelle avant). Conserve deletedIds pour compatibilité.
      await PASSAGES_DOC.set({ data: [], savedAt: new Date().toISOString() }, { merge: true });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "action doit être 'status', 'migrate' ou 'shrink'" });
  } catch (err) {
    console.error("[briblue] migrate-passages error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
