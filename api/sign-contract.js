import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qhemxhnhbgdfvjqedwyi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZW14aG5oYmdkZnZqcWVkd3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODMzMDksImV4cCI6MjA5MTQ1OTMwOX0.JFcwVtN5QM-kEJISjU4l5qy9O559qo45LM2v62A9rMM"
);

const RESEND_API_KEY = "re_FLTMeUdh_vL8QGqJhP2C293WEVCm9c7rh";
const FROM = "rapport-piscine@briblue83.com";

async function sendEmails(client, contractId, signedAt, baseUrl) {
  const dateStr = new Date(signedAt).toLocaleDateString("fr", {day:"2-digit", month:"long", year:"numeric"});
  const sigLinkDorian = `${baseUrl}/sign-prestataire.html?clientId=${client.id}&contractId=${contractId}`;

  // Email client - confirmation
  const htmlClient = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:8px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;width:100%;">
  <tr><td style="background:#0c1222;padding:16px 20px;border-radius:10px 10px 0 0;">
    <span style="font-size:18px;font-weight:bold;color:#ffffff;letter-spacing:2px;">BRI BLUE</span>
  </td></tr>
  <tr><td style="background:#ffffff;padding:20px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 10px;">Bonjour <strong>${client.nom}</strong>,</p>
    <p style="font-size:14px;color:#475569;margin:0 0 14px;line-height:1.6;">Votre contrat d'entretien piscine a bien été signé le <strong>${dateStr}</strong>. Vous recevrez une copie complète une fois le contrat co-signé par BRIBLUE.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;">
      <tr><td style="background:#d1fae5;border-radius:10px;padding:14px 16px;border:1px solid #6ee7b7;">
        <p style="margin:0;font-size:15px;color:#059669;font-weight:bold;">Signature enregistrée ✓</p>
        <p style="margin:6px 0 0;font-size:13px;color:#047857;">Formule : ${client.formule || "—"}</p>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">Pour toute question : +33 6 67 18 61 15</p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:14px 20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">
    <p style="margin:0;font-size:12px;color:#64748b;"><strong>Dorian Briaire</strong><br/>Technicien de Piscine - BRI BLUE</p>
  </td></tr>
</table>
</body></html>`;

  // Email Dorian - lien pour co-signer
  const htmlDorian = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:8px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;width:100%;">
  <tr><td style="background:#0c1222;padding:16px 20px;border-radius:10px 10px 0 0;">
    <span style="font-size:18px;font-weight:bold;color:#ffffff;letter-spacing:2px;">BRI BLUE — Action requise</span>
  </td></tr>
  <tr><td style="background:#ffffff;padding:20px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 10px;">Bonjour Dorian,</p>
    <p style="font-size:14px;color:#475569;margin:0 0 14px;line-height:1.6;"><strong>${client.nom}</strong> vient de signer son contrat le ${dateStr}. Il ne reste plus qu'à co-signer de votre côté.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr><td style="background:#0369a1;border-radius:10px;padding:14px 24px;text-align:center;">
        <a href="${sigLinkDorian}" style="color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;display:block;">Signer le contrat de ${client.nom}</a>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#64748b;margin:0;">Ou copiez ce lien : ${sigLinkDorian}</p>
  </td></tr>
</table>
</body></html>`;

  // Envoi email client
  if (client.email) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `BRIBLUE <${FROM}>`,
        to: [client.email],
        subject: `Signature enregistrée — Contrat BRIBLUE`,
        html: htmlClient,
        text: `Bonjour ${client.nom},\n\nVotre signature a bien été enregistrée le ${dateStr}.\n\nCordialement,\nDorian Briaire - BRI BLUE`,
      }),
    });
  }

  // Envoi email Dorian avec lien co-signature
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `BRIBLUE <${FROM}>`,
      to: ["briblue83@hotmail.com"],
      subject: `Contrat signé par ${client.nom} — À co-signer`,
      html: htmlDorian,
      text: `${client.nom} a signé son contrat le ${dateStr}.\n\nCo-signez ici :\n${sigLinkDorian}\n\nDorian Briaire - BRI BLUE`,
    }),
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { contractId, clientId, signatureClient, signaturePrestataire, signedAt } = req.body;
  if (!contractId || !clientId || !signatureClient) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  const baseUrl = req.headers.origin || "https://briblue83.vercel.app";

  try {
    const { data: readData, error: readError } = await supabase
      .from("app_data").select("data").eq("id", 1).single();
    if (readError) return res.status(500).json({ error: readError.message });

    const clients = readData?.data?.["bb_clients_v2"] || [];
    const client = clients.find(c => c.id === clientId);

    const { data: freshData, error: freshError } = await supabase
      .from("app_data").select("data").eq("id", 1).single();
    if (freshError) return res.status(500).json({ error: freshError.message });

    const allData = freshData?.data || {};
    const contrats = allData["bb_contrats_v1"] || {};
    const isPrestataire = req.body.isPrestataire === true;
    const statutOverride = req.body.statut_override;
    const existing = contrats[contractId] || {};

    if (statutOverride) {
      // Juste marquer le statut sans toucher aux signatures
      contrats[contractId] = { ...existing, clientId, statut: statutOverride };
    } else {
      contrats[contractId] = {
        ...existing,
        clientId,
        signatureClient: isPrestataire ? (existing.signatureClient || "") : signatureClient,
        signaturePrestataire: isPrestataire ? signaturePrestataire : (existing.signaturePrestataire || ""),
        signedAt: existing.signedAt || signedAt || new Date().toISOString(),
        signedByPrestaAt: isPrestataire ? (signedAt || new Date().toISOString()) : existing.signedByPrestaAt,
        statut: isPrestataire ? "signe_complet" : "signe_client",
      };
    }

    await supabase.from("app_data").upsert({
      id: 1,
      data: { ...allData, "bb_contrats_v1": contrats }
    });

    if (!statutOverride) {
      await sendEmails(client || { nom: clientId, email: null, formule: "—", id: clientId }, contractId, signedAt || new Date().toISOString(), baseUrl);
    }

    return res.status(200).json({ success: true, contractId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
