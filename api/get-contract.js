import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qhemxhnhbgdfvjqedwyi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZW14aG5oYmdkZnZqcWVkd3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODMzMDksImV4cCI6MjA5MTQ1OTMwOX0.JFcwVtN5QM-kEJISjU4l5qy9O559qo45LM2v62A9rMM"
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { clientId } = req.query;
  if (!clientId) return res.status(400).json({ error: "clientId manquant" });

  try {
    const { data, error } = await supabase
      .from("app_data").select("data").eq("id", 1).single();
    if (error) return res.status(500).json({ error: error.message });

    const allData = data?.data || {};
    const clients = allData["bb_clients_v2"] || [];
    const client = clients.find(c => c.id === clientId);
    if (!client) return res.status(404).json({ error: "Client introuvable" });

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
      },
      contrat,
      dejaSigné: contrat?.statut === "signe_complet",
      signedAt: contrat?.signedAt || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
