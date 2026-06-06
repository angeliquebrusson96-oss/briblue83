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

const db   = getFirestore();
const COLL = db.collection("briblue");

// Documents séparés — nouvelle architecture
const CLIENTS_DOC  = COLL.doc("clients");
const CONTRATS_DOC = COLL.doc("contrats");
const LEGACY_DOC   = COLL.doc("app_data"); // fallback migration

const RESEND_KEY = "re_FLTMeUdh_vL8QGqJhP2C293WEVCm9c7rh";
const FROM = "rapport-piscine@briblue83.com";
const COPY_TO = "briblue83@hotmail.com";

// BCC automatique sur tous les emails client sauf ceux déjà adressés à Dorian
async function sendEmail({ to, bcc, subject, html, text }) {
  const payload = {
    from: `BRIBLUE <${FROM}>`,
    to: Array.isArray(to) ? to : [to],
    subject, html, text,
  };
  const allTo = payload.to.map(e => e.toLowerCase());
  if (!allTo.includes(COPY_TO.toLowerCase())) {
    payload.bcc = bcc ? [...(Array.isArray(bcc) ? bcc : [bcc]), COPY_TO] : [COPY_TO];
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { contractId, clientId, signatureClient, signaturePrestataire, signedAt, statut_override, isPrestataire } = req.body;
  if (!contractId || !clientId) return res.status(400).json({ error: "contractId et clientId requis" });

  // ── TRANSACTION ATOMIQUE ──────────────────────────────────────────────────
  // Garantit qu'une seule requête passe même si 3 clics simultanés arrivent.
  // La lecture + écriture sont atomiques : impossible d'envoyer 2 emails.
  let client = null;
  let actionDone = null;
  let contractSnapshot = null;
  const baseUrl = req.headers.origin || "https://briblue83.vercel.app";

  try {
    await db.runTransaction(async (tx) => {
      // Lire les deux documents concernés (+ legacy pour migration)
      const [clientsSnap, contratsSnap, legacySnap] = await Promise.all([
        tx.get(CLIENTS_DOC),
        tx.get(CONTRATS_DOC),
        tx.get(LEGACY_DOC),
      ]);

      // Clients : nouveau document en priorité, sinon legacy
      const clientsData = (clientsSnap.exists && clientsSnap.data().data)
        || (legacySnap.exists && legacySnap.data()["bb_clients_v2"])
        || [];
      client = (Array.isArray(clientsData) ? clientsData : []).find(c => c.id === clientId) || null;

      // Contrats : nouveau document en priorité, sinon legacy
      const contratsData = (contratsSnap.exists && contratsSnap.data().data)
        || (legacySnap.exists && legacySnap.data()["bb_contrats_v1"])
        || {};
      const contrats = { ...contratsData };
      const existing = contrats[contractId] || {};
      const nowTs = new Date().toISOString();

      // CAS 1 — demande envoyée
      if (statut_override === "demande_envoyee") {
        if (existing.statut && existing.statut !== "demande_envoyee") {
          actionDone = "skipped"; return;
        }
        contrats[contractId] = { ...existing, clientId, statut: "demande_envoyee" };
        tx.set(CONTRATS_DOC, { data: contrats, savedAt: nowTs }, { merge: true });
        actionDone = "demande_envoyee";
        return;
      }

      // CAS 2 — co-signature Dorian
      if (isPrestataire === true) {
        if (existing.statut === "signe_complet") { actionDone = "already"; return; }
        contrats[contractId] = {
          ...existing, clientId,
          signaturePrestataire: signaturePrestataire || "",
          signedByPrestaAt: signedAt || nowTs,
          statut: "signe_complet",
        };
        tx.set(CONTRATS_DOC, { data: contrats, savedAt: nowTs }, { merge: true });
        contractSnapshot = contrats[contractId];
        actionDone = "signe_complet";
        return;
      }

      // CAS 3 — signature client
      if (!signatureClient) throw new Error("signatureClient manquant");
      if (existing.statut === "signe_client" || existing.statut === "signe_complet") {
        actionDone = "already"; return;
      }
      contrats[contractId] = {
        ...existing, clientId, signatureClient,
        signaturePrestataire: existing.signaturePrestataire || "",
        signedAt: signedAt || nowTs,
        statut: "signe_client",
      };
      tx.set(CONTRATS_DOC, { data: contrats, savedAt: nowTs }, { merge: true });
      contractSnapshot = contrats[contractId];
      actionDone = "signe_client";
    });
  } catch (err) {
    console.error("sign-contract transaction error:", err);
    return res.status(500).json({ error: err.message });
  }

  // ── EMAILS (hors transaction — Firestore est déjà validé) ─────────────────
  try {
    if (actionDone === "skipped")        return res.status(200).json({ success: true, skipped: true });
    if (actionDone === "already")        return res.status(200).json({ success: true, already: true });
    if (actionDone === "demande_envoyee") return res.status(200).json({ success: true });

    // Co-signature Dorian → email confirmation au client
    if (actionDone === "signe_complet") {
      if (client?.email) {
        const dateStr = new Date(contractSnapshot?.signedAt || new Date())
          .toLocaleDateString("fr", { day: "2-digit", month: "long", year: "numeric" });
        await sendEmail({
          to: [client.email],
          subject: "Contrat BRIBLUE co-signé ✓",
          html: `<body style="font-family:Arial,sans-serif;padding:20px">
            <h2 style="color:#059669">Contrat signé par les deux parties</h2>
            <p>Bonjour <strong>${client.nom}</strong>,</p>
            <p>Votre contrat est maintenant signé par les deux parties (${dateStr}).</p>
            <p>Cordialement,<br/>Dorian Briaire - BRI BLUE</p>
          </body>`,
          text: `Bonjour ${client.nom},\n\nContrat signé par les deux parties (${dateStr}).\n\nCordialement,\nDorian Briaire - BRI BLUE`,
        });
      }
      return res.status(200).json({ success: true, contractId });
    }

    // Signature client → confirmation + notification Dorian
    if (actionDone === "signe_client") {
      const dateStr = new Date(contractSnapshot?.signedAt || new Date())
        .toLocaleDateString("fr", { day: "2-digit", month: "long", year: "numeric" });

      if (client?.email) {
        await sendEmail({
          to: [client.email],
          subject: "Signature enregistrée — Contrat BRIBLUE",
          html: `<body style="font-family:Arial,sans-serif;padding:20px">
            <p>Bonjour <strong>${client.nom}</strong>,</p>
            <p>Votre signature du ${dateStr} a bien été enregistrée. Dorian Briaire co-signera votre contrat sous peu.</p>
            <p>Cordialement,<br/>Dorian Briaire - BRI BLUE</p>
          </body>`,
          text: `Bonjour ${client.nom},\n\nVotre signature du ${dateStr} a bien été enregistrée.\n\nCordialement,\nDorian Briaire - BRI BLUE`,
        });
      }

      const sigLinkDorian = `${baseUrl}/sign-prestataire.html?clientId=${clientId}&contractId=${contractId}`;
      await sendEmail({
        to: ["briblue83@hotmail.com"],
        subject: `Contrat signé par ${client?.nom || clientId} — À co-signer`,
        html: `<body style="font-family:Arial,sans-serif;padding:20px">
          <p>Bonjour Dorian,</p>
          <p><strong>${client?.nom || clientId}</strong> a signé son contrat le ${dateStr}.</p>
          <table cellpadding="0" cellspacing="0" style="margin:20px 0">
            <tr><td style="background:#0369a1;border-radius:10px;padding:14px 24px">
              <a href="${sigLinkDorian}" style="color:#fff;font-size:16px;font-weight:bold;text-decoration:none">Co-signer le contrat</a>
            </td></tr>
          </table>
        </body>`,
        text: `${client?.nom || clientId} a signé.\n\nCo-signez ici :\n${sigLinkDorian}`,
      });

      return res.status(200).json({ success: true, contractId });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("sign-contract email error:", err);
    // La signature est déjà enregistrée dans Firestore, l'email seul a échoué
    return res.status(200).json({ success: true, emailError: err.message });
  }
}
