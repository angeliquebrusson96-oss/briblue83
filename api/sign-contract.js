import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qhemxhnhbgdfvjqedwyi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZW14aG5oYmdkZnZqcWVkd3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODMzMDksImV4cCI6MjA5MTQ1OTMwOX0.JFcwVtN5QM-kEJISjU4l5qy9O559qo45LM2v62A9rMM"
);

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
    // Lecture fraîche des données
    const { data, error } = await supabase.from("app_data").select("data").eq("id", 1).single();
    if (error) return res.status(500).json({ error: error.message });

    const allData = data?.data || {};
    const clients = allData["bb_clients_v2"] || [];
    const client = clients.find(c => c.id === clientId);
    const contrats = allData["bb_contrats_v1"] || {};
    const existing = contrats[contractId] || {};
    const baseUrl = req.headers.origin || "https://briblue83.vercel.app";

    // ─── CAS 1 : juste marquer "demande_envoyee" (pas de signature) ───
    if (statut_override === "demande_envoyee") {
      // Ne pas écraser une signature déjà présente
      if (existing.statut && existing.statut !== "demande_envoyee") {
        return res.status(200).json({ success: true, skipped: true });
      }
      contrats[contractId] = { ...existing, clientId, statut: "demande_envoyee" };
      await supabase.from("app_data").upsert({ id: 1, data: { ...allData, "bb_contrats_v1": contrats } });
      return res.status(200).json({ success: true });
    }

    // ─── CAS 2 : signature prestataire (co-signature) ───
    if (isPrestataire === true) {
      // Empêcher double-traitement
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
      await supabase.from("app_data").upsert({ id: 1, data: { ...allData, "bb_contrats_v1": contrats } });

      // Email confirmation finale au client uniquement
      if (client?.email) {
        const dateStr = new Date(contrats[contractId].signedAt || new Date()).toLocaleDateString("fr", { day: "2-digit", month: "long", year: "numeric" });
        await sendEmail(
          [client.email],
          "Contrat BRIBLUE co-signé ✓",
          `<body style="font-family:Arial,sans-serif;padding:20px"><h2 style="color:#059669">Contrat signé par les deux parties</h2><p>Bonjour <strong>${client.nom}</strong>,</p><p>Votre contrat BRIBLUE est maintenant signé par les deux parties (${dateStr}). Conservez cet email comme confirmation.</p><p>Cordialement,<br/>Dorian Briaire - BRI BLUE</p></body>`,
          `Bonjour ${client.nom},\n\nVotre contrat BRIBLUE est signé par les deux parties.\n\nCordialement,\nDorian Briaire - BRI BLUE`
        );
      }
      return res.status(200).json({ success: true, contractId });
    }

    // ─── CAS 3 : signature client ───
    if (!signatureClient) {
      return res.status(400).json({ error: "signatureClient manquant" });
    }
    // Empêcher double-traitement
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
    await supabase.from("app_data").upsert({ id: 1, data: { ...allData, "bb_contrats_v1": contrats } });

    // Email au client (confirmation)
    if (client?.email) {
      const dateStr = new Date(contrats[contractId].signedAt).toLocaleDateString("fr", { day: "2-digit", month: "long", year: "numeric" });
      await sendEmail(
        [client.email],
        "Signature enregistrée — Contrat BRIBLUE",
        `<body style="font-family:Arial,sans-serif;padding:20px"><p>Bonjour <strong>${client.nom}</strong>,</p><p>Votre signature du ${dateStr} a bien été enregistrée. Vous recevrez une copie finale une fois le contrat co-signé par BRIBLUE.</p><p>Cordialement,<br/>Dorian Briaire - BRI BLUE</p></body>`,
        `Bonjour ${client.nom},\n\nVotre signature a été enregistrée.\n\nCordialement,\nDorian Briaire - BRI BLUE`
      );
    }

    // Email à Dorian avec lien co-signature (UNE SEULE FOIS)
    const sigLinkDorian = `${baseUrl}/sign-prestataire.html?clientId=${clientId}&contractId=${contractId}`;
    const dateStr = new Date(contrats[contractId].signedAt).toLocaleDateString("fr", { day: "2-digit", month: "long", year: "numeric" });
    await sendEmail(
      ["briblue83@hotmail.com"],
      `Contrat signé par ${client?.nom || clientId} — À co-signer`,
      `<body style="font-family:Arial,sans-serif;padding:20px"><p>Bonjour Dorian,</p><p><strong>${client?.nom || clientId}</strong> a signé son contrat le ${dateStr}.</p><table cellpadding="0" cellspacing="0" style="margin:20px 0"><tr><td style="background:#0369a1;border-radius:10px;padding:14px 24px"><a href="${sigLinkDorian}" style="color:#fff;font-size:16px;font-weight:bold;text-decoration:none">Co-signer le contrat</a></td></tr></table><p style="font-size:12px;color:#64748b">Ou : ${sigLinkDorian}</p></body>`,
      `${client?.nom || clientId} a signé son contrat.\n\nCo-signez ici :\n${sigLinkDorian}`
    );

    return res.status(200).json({ success: true, contractId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
