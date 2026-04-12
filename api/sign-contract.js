import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qhemxhnhbgdfvjqedwyi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZW14aG5oYmdkZnZqcWVkd3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODMzMDksImV4cCI6MjA5MTQ1OTMwOX0.JFcwVtN5QM-kEJISjU4l5qy9O559qo45LM2v62A9rMM"
);

const RESEND_API_KEY = "re_FLTMeUdh_vL8QGqJhP2C293WEVCm9c7rh";
const FROM = "rapport-piscine@briblue83.com";

async function sendConfirmationEmail(client, signedAt) {
  const dateStr = new Date(signedAt).toLocaleDateString("fr", {day:"2-digit", month:"long", year:"numeric"});
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:8px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;width:100%;">
  <tr><td style="background:#0c1222;padding:16px 20px;border-radius:10px 10px 0 0;">
    <span style="font-size:18px;font-weight:bold;color:#ffffff;letter-spacing:2px;">BRI BLUE</span>
  </td></tr>
  <tr><td style="background:#ffffff;padding:20px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 10px;">Bonjour <strong>${client.nom}</strong>,</p>
    <p style="font-size:14px;color:#475569;margin:0 0 14px;line-height:1.6;">Votre contrat d'entretien piscine a bien été signé le <strong>${dateStr}</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;">
      <tr><td style="background:#d1fae5;border-radius:10px;padding:14px 16px;border:1px solid #6ee7b7;">
        <p style="margin:0;font-size:15px;color:#059669;font-weight:bold;">Contrat signé et enregistré</p>
        <p style="margin:6px 0 0;font-size:13px;color:#047857;">Formule : ${client.formule || "—"}</p>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">Conservez cet email comme preuve de signature. Pour toute question, contactez-nous au +33 6 67 18 61 15.</p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:14px 20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">
    <p style="margin:0;font-size:12px;color:#64748b;"><strong>Dorian Briaire</strong><br/>Technicien de Piscine - BRI BLUE<br/>+33 6 67 18 61 15</p>
  </td></tr>
</table>
</body></html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `BRIBLUE <${FROM}>`,
      to: [client.email],
      bcc: ["briblue83@hotmail.com"],
      subject: `Confirmation de signature — Contrat BRIBLUE`,
      html,
      text: `Bonjour ${client.nom},\n\nVotre contrat BRIBLUE a bien été signé le ${dateStr}.\n\nCordialement,\nDorian Briaire\nTechnicien de Piscine - BRI BLUE`,
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

  try {
    // Lecture initiale pour trouver le client
    const { data: readData, error: readError } = await supabase
      .from("app_data").select("data").eq("id", 1).single();
    if (readError) return res.status(500).json({ error: readError.message });

    const clients = readData?.data?.["bb_clients_v2"] || [];
    const client = clients.find(c => c.id === clientId);

    // Re-fetch juste avant écriture pour éviter d'écraser des données récentes
    const { data: freshData, error: freshError } = await supabase
      .from("app_data").select("data").eq("id", 1).single();
    if (freshError) return res.status(500).json({ error: freshError.message });

    const allData = freshData?.data || {};

    // Mise à jour UNIQUEMENT de bb_contrats_v1 — ne touche pas aux autres clés
    const contrats = allData["bb_contrats_v1"] || {};
    contrats[contractId] = {
      ...(contrats[contractId] || {}),
      clientId,
      signatureClient,
      signaturePrestataire: signaturePrestataire || "",
      signedAt: signedAt || new Date().toISOString(),
      statut: "signe",
    };

    await supabase.from("app_data").upsert({
      id: 1,
      data: { ...allData, "bb_contrats_v1": contrats }
    });

    // Email de confirmation
    if (client?.email) {
      await sendConfirmationEmail(client, signedAt || new Date().toISOString());
    }

    return res.status(200).json({ success: true, contractId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
