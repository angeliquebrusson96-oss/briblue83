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
const APP_DOC = db.collection("briblue").doc("app_data");

const RESEND_KEY = "re_FLTMeUdh_vL8QGqJhP2C293WEVCm9c7rh";
const FROM = "rapport-piscine@briblue83.com";
const COPY_TO = "briblue83@hotmail.com"; // Copie systématique sur tous les emails client

// FIX #6 — BCC systématique sur tous les emails envoyés aux clients
// FIX #3 — sendEmail centralise les options pour éviter les oublis
async function sendEmail({ to, bcc, subject, html, text }) {
  const payload = {
    from: `BRIBLUE <${FROM}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  };
  // Toujours copier Dorian sauf si l'email est déjà pour lui
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

// FIX #3 — Mise à jour Firebase ciblée (pas de spread allData)
// ⚠️ APP_DOC.set({ champ: valeur }, { merge: true }) ne touche QUE les champs spécifiés.
// L'ancien APP_DOC.set({ ...allData, ... }) réécrivait tout le document, risquant
// d'écraser des données plus récentes (ex: FOULON) sauvegardées entre le GET et le SET.
async function saveContrats(contrats, nowTs) {
  await APP_DOC.set({
    "bb_contrats_v1": contrats,
    // FIX #2 — timestamps mis à jour pour que le polling de l'app détecte le changement
    "_lastSavedAt": nowTs,
    "_savedAt_bb_contrats_v1": nowTs,
  }, { merge: true });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { contractId, clientId, signatureClient, signaturePrestataire, signedAt, statut_override, isPrestataire } = req.body;
  if (!contractId || !clientId) return res.status(400).json({ error: "contractId et clientId requis" });

  try {
    const snap = await APP_DOC.get();
    if (!snap.exists) return res.status(500).json({ error: "Document app_data introuvable" });

    const allData = snap.data() || {};
    const clients = allData["bb_clients_v2"] || [];
    const client = clients.find(c => c.id === clientId);
    // FIX #3 — on clone uniquement bb_contrats_v1, pas tout allData
    const contrats = { ...(allData["bb_contrats_v1"] || {}) };
    const existing = contrats[contractId] || {};
    const baseUrl = req.headers.origin || "https://briblue83.vercel.app";
    const nowTs = new Date().toISOString();

    // ── CAS 1 : marquer comme "demande envoyée" ──────────────────────────────
    if (statut_override === "demande_envoyee") {
      if (existing.statut && existing.statut !== "demande_envoyee") {
        return res.status(200).json({ success: true, skipped: true });
      }
      contrats[contractId] = { ...existing, clientId, statut: "demande_envoyee" };
      await saveContrats(contrats, nowTs);
      return res.status(200).json({ success: true });
    }

    // ── CAS 2 : co-signature prestataire (Dorian) ────────────────────────────
    if (isPrestataire === true) {
      if (existing.statut === "signe_complet") {
        return res.status(200).json({ success: true, already: true });
      }
      contrats[contractId] = {
        ...existing, clientId,
        signaturePrestataire: signaturePrestataire || "",
        signedByPrestaAt: signedAt || nowTs,
        statut: "signe_complet",
      };
      await saveContrats(contrats, nowTs);

      // Email de confirmation au client (avec copie Dorian en BCC)
      if (client?.email) {
        const dateStr = new Date(contrats[contractId].signedAt || nowTs)
          .toLocaleDateString("fr", { day: "2-digit", month: "long", year: "numeric" });
        await sendEmail({
          to: [client.email],
          subject: "Contrat BRIBLUE co-signé ✓",
          html: `<body style="font-family:Arial,sans-serif;padding:20px">
            <h2 style="color:#059669">Contrat signé par les deux parties</h2>
            <p>Bonjour <strong>${client.nom}</strong>,</p>
            <p>Votre contrat d'entretien piscine BRIBLUE est maintenant signé par les deux parties (${dateStr}).</p>
            <p>Cordialement,<br/>Dorian Briaire - BRI BLUE</p>
          </body>`,
          text: `Bonjour ${client.nom},\n\nContrat signé par les deux parties (${dateStr}).\n\nCordialement,\nDorian Briaire - BRI BLUE`,
        });
      }
      return res.status(200).json({ success: true, contractId });
    }

    // ── CAS 3 : signature client ─────────────────────────────────────────────
    if (!signatureClient) return res.status(400).json({ error: "signatureClient manquant" });
    if (existing.statut === "signe_client" || existing.statut === "signe_complet") {
      return res.status(200).json({ success: true, already: true });
    }

    contrats[contractId] = {
      ...existing, clientId, signatureClient,
      signaturePrestataire: existing.signaturePrestataire || "",
      signedAt: signedAt || nowTs,
      statut: "signe_client",
    };
    await saveContrats(contrats, nowTs);

    const dateStr = new Date(contrats[contractId].signedAt)
      .toLocaleDateString("fr", { day: "2-digit", month: "long", year: "numeric" });

    // Confirmation au client (BCC Dorian automatique)
    if (client?.email) {
      await sendEmail({
        to: [client.email],
        subject: "Signature enregistrée — Contrat BRIBLUE",
        html: `<body style="font-family:Arial,sans-serif;padding:20px">
          <p>Bonjour <strong>${client.nom}</strong>,</p>
          <p>Votre signature du ${dateStr} a bien été enregistrée. Votre contrat sera co-signé par Dorian Briaire sous peu.</p>
          <p>Cordialement,<br/>Dorian Briaire - BRI BLUE</p>
        </body>`,
        text: `Bonjour ${client.nom},\n\nVotre signature du ${dateStr} a bien été enregistrée.\n\nCordialement,\nDorian Briaire - BRI BLUE`,
      });
    }

    // Notification à Dorian avec lien de co-signature
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
  } catch (err) {
    console.error("sign-contract error:", err);
    return res.status(500).json({ error: err.message });
  }
}
