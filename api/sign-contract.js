import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const APP_DOC = db.collection("briblue").doc("app_data");

const RESEND_KEY = "re_FLTMeUdh_vL8QGqJhP2C293WEVCm9c7rh";
const FROM = "rapport-piscine@briblue83.com";

async function sendEmail(to, subject, html, text) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `BRIBLUE <${FROM}>`, to, subject, html, text }),
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

  if (!contractId || !clientId) {
    return res.status(400).json({ error: "contractId et clientId requis" });
  }

  try {
    const snap = await APP_DOC.get();
    if (!snap.exists) return res.status(500).json({ error: "Document app_data introuvable" });

    const allData = snap.data() || {};
    const clients = allData["bb_clients_v2"] || [];
    const client = clients.find(c => c.id === clientId);
    const contrats = allData["bb_contrats_v1"] || {};
    const existing = contrats[contractId] || {};
    const baseUrl = req.headers.origin || "https://briblue83.vercel.app";

    // ─── CAS 1 : demande_envoyee ───
    if (statut_override === "demande_envoyee") {
      if (existing.statut && existing.statut !== "demande_envoyee") {
        return res.status(200).json({ success: true, skipped: true });
      }
      contrats[contractId] = { ...existing, clientId, statut: "demande_envoyee" };
      await APP_DOC.set({ ...allData, "bb_contrats_v1": contrats }, { merge: true });
      return res.status(200).json({ success: true });
    }

    // ─── CAS 2 : signature prestataire ───
    if (isPrestataire === true) {
      if (existing.statut === "signe_complet") {
        return res.status(200).json({ success: true, already: true });
      }
      contrats[contractId] = {
        ...existing,
        clientId,
        signaturePrestataire: signaturePrestataire || "",
        signedByPrestaAt: signedAt || new Date().toISOString(),
        statut: "signe_complet",
      };
      await APP_DOC.set({ ...allData, "bb_contrats_v1": contrats }, { merge: true });

      if (client?.email) {
        const dateStr = new Date(contrats[contractId].signedAt || new Date()).toLocaleDateString("fr", { day: "2-digit", month: "long", year: "numeric" });
        await sendEmail(
          [client.email],
          "Contrat BRIBLUE co-signé ✓",
          `<body style="font-family:Arial,sans-serif;padding:20px"><h2 style="color:#059669">Contrat signé par les deux parties</h2><p>Bonjour <strong>${client.nom}</strong>,</p><p>Votre contrat BRIBLUE est maintenant signé par les deux parties (${dateStr}).</p><p>Cordialement,<br/>Dorian Briaire - BRI BLUE</p></body>`,
          `Bonjour ${client.nom},\n\nContrat signé par les deux parties.\n\nCordialement,\nDorian Briaire - BRI BLUE`
        );
      }
      return res.status(200).json({ success: true, contractId });
    }

    // ─── CAS 3 : signature client ───
    if (!signatureClient) {
      return res.status(400).json({ error: "signatureClient manquant" });
    }
    if (existing.statut === "signe_client" || existing.statut === "signe_complet") {
      return res.status(200).json({ success: true, already: true });
    }

    contrats[contractId] = {
      ...existing,
      clientId,
      signatureClient,
      signaturePrestataire: existing.signaturePrestataire || "",
      signedAt: signedAt || new Date().toISOString(),
      statut: "signe_client",
    };
    await APP_DOC.set({ ...allData, "bb_contrats_v1": contrats }, { merge: true });

    if (client?.email) {
      const dateStr = new Date(contrats[contractId].signedAt).toLocaleDateString("fr", { day: "2-digit", month: "long", year: "numeric" });
      await sendEmail(
        [client.email],
        "Signature enregistrée — Contrat BRIBLUE",
        `<body style="font-family:Arial,sans-serif;padding:20px"><p>Bonjour <strong>${client.nom}</strong>,</p><p>Votre signature du ${dateStr} a bien été enregistrée.</p><p>Cordialement,<br/>Dorian Briaire - BRI BLUE</p></body>`,
        `Bonjour ${client.nom},\n\nVotre signature a été enregistrée.\n\nCordialement,\nDorian Briaire - BRI BLUE`
      );
    }

    const sigLinkDorian = `${baseUrl}/sign-prestataire.html?clientId=${clientId}&contractId=${contractId}`;
    const dateStr = new Date(contrats[contractId].signedAt).toLocaleDateString("fr", { day: "2-digit", month: "long", year: "numeric" });
    await sendEmail(
      ["briblue83@hotmail.com"],
      `Contrat signé par ${client?.nom || clientId} — À co-signer`,
      `<body style="font-family:Arial,sans-serif;padding:20px"><p>Bonjour Dorian,</p><p><strong>${client?.nom || clientId}</strong> a signé son contrat le ${dateStr}.</p><table cellpadding="0" cellspacing="0" style="margin:20px 0"><tr><td style="background:#0369a1;border-radius:10px;padding:14px 24px"><a href="${sigLinkDorian}" style="color:#fff;font-size:16px;font-weight:bold;text-decoration:none">Co-signer le contrat</a></td></tr></table></body>`,
      `${client?.nom || clientId} a signé.\n\nCo-signez ici :\n${sigLinkDorian}`
    );

    return res.status(200).json({ success: true, contractId });
  } catch (err) {
    console.error("sign-contract error:", err);
    return res.status(500).json({ error: err.message });
  }
}
