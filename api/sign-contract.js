import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qhemxhnhbgdfvjqedwyi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZW14aG5oYmdkZnZqcWVkd3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODMzMDksImV4cCI6MjA5MTQ1OTMwOX0.JFcwVtN5QM-kEJISjU4l5qy9O559qo45LM2v62A9rMM"
);

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
    // Load existing app_data
    const { data, error } = await supabase
      .from("app_data")
      .select("data")
      .eq("id", 1)
      .single();

    if (error) return res.status(500).json({ error: error.message });

    const allData = data?.data || {};

    // Update contract signatures
    const contrats = allData["bb_contrats_v1"] || {};
    contrats[contractId] = {
      ...(contrats[contractId] || {}),
      clientId,
      signatureClient,
      signaturePrestataire: signaturePrestataire || "",
      signedAt: signedAt || new Date().toISOString(),
      statut: "signe",
    };

    // Save back
    await supabase
      .from("app_data")
      .upsert({ id: 1, data: { ...allData, "bb_contrats_v1": contrats } });

    return res.status(200).json({ success: true, contractId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
