// @ts-nocheck
/* eslint-disable react-hooks/static-components */
import React, { useState, useEffect, useCallback } from "react";
import { getDoc } from "firebase/firestore";
import { APP_DOC } from "../lib/firebase";
import { getPH, getCL, getTemp, getResumePassage, isControleType, generateCarnetCode, calculerPassagesPrevusContrat, isPassageEffectue, isPassageDansContrat } from "../utils/helpers";
import { resolvePhoto } from "../lib/photoStore";
import { PhotoImg } from "../components/ui";

// Génération autonome du rapport client : évite le bouton PDF cassé si App.jsx n'est pas chargé ici.
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const cleanFileName = (v) => String(v || "rapport").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
const hasProductShape = (v) => v && typeof v === "object" && !Array.isArray(v) && (
  "nom" in v || "produit" in v || "label" in v || "name" in v || "designation" in v ||
  "titre" in v || "qte" in v || "quantite" in v || "quantité" in v || "qty" in v
);
const toArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.flatMap(toArray);
  if (typeof v === "string") return v.split(/[\n,;]+/).map(x => x.trim()).filter(Boolean);
  if (typeof v === "object") {
    if (hasProductShape(v)) return [v];
    return Object.values(v).flatMap(toArray);
  }
  return [String(v)];
};
const formatProduitLivre = (item) => {
  if (typeof item === "string") return item.trim();
  if (!item || typeof item !== "object") return "";
  const nom = item.nom || item.produit || item.label || item.name || item.designation || item.titre || "Produit";
  const qte = item.qte || item.quantite || item.quantité || item.qty || item.dose || item.volume || item.quantiteLivree || item.quantitéLivrée || "";
  const unite = item.unite || item.unité || item.unit || "";
  return `${nom}${qte ? ` — ${qte}${unite ? ` ${unite}` : ""}` : ""}`.trim();
};
const getProduitsLivres = (p = {}) => {
  const raw = [
    p.produitsLivres,
    p.produitsLivresTexte,
    p.produitsLivrés,
    p.produitsLivresClient,
    p.produitsLivresAuClient,
    p.produitsLivresClientTexte,
    p.livraisonProduitsListe,
    p.livraisonProduitsTexte,
    p.livraison,
    p.livraisons,
    p.produits,
    p.produitsLivre,
    p.produitsLivree,
  ].flatMap(toArray);

  // livraisonAutre = champ texte libre "autre" du formulaire passage
  if (p.livraisonAutre && String(p.livraisonAutre).trim()) raw.push(String(p.livraisonAutre).trim());
  // Compatibilité anciens rapports : case cochée mais sans produit sélectionné
  if ((p.livraisonProduits || p.produitLivre || p.produitsLivresCheck) && raw.length === 0) {
    raw.push(p.produitLivreTexte || p.produitLivre || p.nomProduit || p.produit || p.designationProduit || "Produits livrés");
  }

  return raw.map(formatProduitLivre).filter(Boolean);
};
const getProduitsApportes = (p = {}) => [
  ["Chlore", p.corrChlore], ["pH", p.corrPH], ["Sel", p.corrSel], ["Algicide", p.corrAlgicide],
  ["Chlore choc", p.corrChloreChoc], ["Peroxyde", p.corrPeroxyde], ["Phosphate", p.corrPhosphate],
  ["Alcafix", p.corrAlcafix], ["Autre", p.corrAutre],
].filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");
function buildRapportHTML(passage, client) {
  const p = passage || {};
  const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" }) : "—";
  const produitsLivres = getProduitsLivres(p);
  const produitsApportes = getProduitsApportes(p);
  const mesures = [
    ["pH", p.ph ?? p.pH ?? p.tauxPH ?? p.tauxPh],
    ["Chlore", p.chlore ?? p.cl ?? p.tauxChlore],
    ["Température", p.temp ?? p.temperature ?? p.temperatureEau],
    ["Sel", p.sel ?? p.tauxSel],
    ["Phosphate", p.phosphate ?? p.tauxPhosphate],
    ["Stabilisant", p.stabilisant ?? p.tauxStabilisant],
    ["TAC", p.alcalinite ?? p.tac],
  ].filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Rapport ${esc(client?.nom)}</title>
    <style>
      @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#0f172a;margin:0;background:#eef6fb}.page{max-width:820px;margin:0 auto;background:#fff;min-height:100vh;padding:30px}.head{background:linear-gradient(135deg,#0891b2,#0e7490);color:white;border-radius:18px;padding:24px;margin-bottom:18px}.brand{font-size:13px;letter-spacing:2px;font-weight:700;opacity:.9}.title{font-size:28px;font-weight:800;margin:8px 0 4px}.sub{font-size:14px;opacity:.9}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.card{border:1px solid #e2e8f0;border-radius:14px;padding:14px;background:#f8fafc}.label{font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:.5px;margin-bottom:5px}.val{font-size:15px;font-weight:700}.section{margin-top:18px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden}.section h2{font-size:15px;margin:0;padding:12px 14px;background:#f0f9ff;color:#075985}.section .content{padding:14px;line-height:1.55}.chips{display:flex;flex-wrap:wrap;gap:8px}.chip{background:#e0f2fe;color:#075985;border-radius:999px;padding:7px 11px;font-size:13px;font-weight:700}.green{background:#f0fdf4;color:#166534}.muted{color:#64748b}.print-btn{display:block;margin:28px auto 0;border:0;border-radius:999px;background:#0891b2;color:white;padding:14px 28px;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 10px 25px rgba(8,145,178,.35)}@media print{body{background:white}.page{padding:0}.print-btn{display:none}}
    </style></head><body><main class="page">
      <div class="head"><div class="brand">BRIBLUE</div><div class="title">Rapport d'intervention</div><div class="sub">Carnet d'entretien piscine</div></div>
      <div class="grid"><div class="card"><div class="label">Client</div><div class="val">${esc(client?.nom)}</div></div><div class="card"><div class="label">Date</div><div class="val">${esc(fmt(p.date))}${p.heure ? ` · ${esc(p.heure)}` : ""}</div></div><div class="card"><div class="label">Type</div><div class="val">${esc(p.type || "Entretien")}</div></div><div class="card"><div class="label">Technicien</div><div class="val">${esc(p.tech || "BRIBLUE")}</div></div></div>
      ${mesures.length ? `<div class="section"><h2>Mesures de l'eau</h2><div class="content chips">${mesures.map(([k,v])=>`<span class="chip">${esc(k)} : ${esc(v)}</span>`).join("")}</div></div>` : ""}
      ${(p.actions || p.travaux || p.resume || p.compteRendu) ? `<div class="section"><h2>Compte-rendu</h2><div class="content">${esc(p.actions || p.travaux || p.resume || p.compteRendu)}</div></div>` : ""}
      ${(p.obs || p.commentaires) ? `<div class="section"><h2>Observations</h2><div class="content">${esc(p.obs || p.commentaires)}</div></div>` : ""}
      ${produitsApportes.length ? `<div class="section"><h2>Produits apportés</h2><div class="content chips">${produitsApportes.map(([k,v])=>`<span class="chip">${esc(k)} : ${esc(v)}</span>`).join("")}</div></div>` : ""}
      ${produitsLivres.length ? `<div class="section"><h2>Produits livrés au client</h2><div class="content chips">${produitsLivres.map(x=>`<span class="chip green">${esc(x)}</span>`).join("")}</div></div>` : ""}
      <p class="muted" style="margin-top:28px;font-size:12px">BRIBLUE · La Seyne-sur-Mer · SIRET 84345436400053</p>
      <button class="print-btn" onclick="window.print()">🖨️ Enregistrer en PDF</button>
    </main></body></html>`;
}
async function resolvePassagePhotosLocal(passage) {
  const SINGLE = ["photoArrivee", "photoDepart", "signatureTech", "signatureClient"];
  const ARRAYS = ["photos", "photosDepart"];
  const p = { ...passage };
  for (const field of SINGLE) {
    if (p[field]) p[field] = await resolvePhoto(p[field]);
  }
  for (const field of ARRAYS) {
    if (Array.isArray(p[field])) {
      p[field] = await Promise.all(p[field].map(v => resolvePhoto(v)));
    }
  }
  return p;
}

async function ouvrirRapport(passage, client) {
  const resolved = await resolvePassagePhotosLocal(passage);
  const html = buildRapportHTML(resolved, client);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    telechargerRapport(passage, client, url);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function telechargerRapport(passage, client, existingUrl) {
  const p = passage || {};
  const url = existingUrl || (() => {
    const html = buildRapportHTML(p, client);
    return URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  })();
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cleanFileName(client?.nom)}-${cleanFileName(p.date)}-rapport.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Fallback init data (mirrors App.jsx)

const CLIENTS_INIT = [
  { id:"C001", nom:"GAMBIN IMMO - COPRO O GARDEN", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"Confort+", prix:2418, prixPassageE:78, prixPassageC:0, dateDebut:"2025-09-29", dateFin:"2026-09-29", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:2,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:2,controle:0},11:{entretien:2,controle:0},12:{entretien:2,controle:0}} },
  { id:"C002", nom:"Mme HAMMER", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"Confort", prix:2210, prixPassageE:85, prixPassageC:0, dateDebut:"2026-03-01", dateFin:"2027-03-01", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
  { id:"C003", nom:"Mme LOPEZ", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"VAC+", prix:1690, prixPassageE:65, prixPassageC:0, dateDebut:"2025-06-01", dateFin:"2026-06-01", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
  { id:"C004", nom:"Mme MARCELLOT", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"VAC+", prix:1690, prixPassageE:65, prixPassageC:0, dateDebut:"2025-11-20", dateFin:"2026-11-20", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:1,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
  { id:"C005", nom:"Mr MOREL", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"VAC+", prix:1690, prixPassageE:65, prixPassageC:0, dateDebut:"2026-03-01", dateFin:"2027-03-01", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
  { id:"C006", nom:"Mr NEGRE Claude", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"Confort", prix:1740, prixPassageE:65, prixPassageC:35, dateDebut:"2026-04-01", dateFin:"2027-04-01", photoPiscine:"", moisParMois:{1:{entretien:0,controle:1},2:{entretien:0,controle:1},3:{entretien:0,controle:1},4:{entretien:2,controle:1},5:{entretien:4,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:1},11:{entretien:0,controle:1},12:{entretien:0,controle:1}} },
  { id:"C007", nom:"Mme RITTER", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"VAC+", prix:1690, prixPassageE:65, prixPassageC:0, dateDebut:"2025-07-28", dateFin:"2026-07-28", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
];
const PASSAGES_INIT = [
  { id:1, clientId:"C001", date:"2026-04-06", type:"Entretien complet", ph:7.2, chlore:1.5, actions:"Nettoyage, vérif. pompe", obs:"RAS", tech:"Dorian", ok:true },
  { id:2, clientId:"C002", date:"2026-04-06", type:"Entretien complet", ph:7.4, chlore:1.2, actions:"Nettoyage, ajust. pH", obs:"Filtre à changer bientôt", tech:"Dorian", ok:true },
  { id:3, clientId:"C001", date:"2026-04-07", type:"Contrôle d'eau", ph:7.1, chlore:1.8, actions:"Contrôle mesures", obs:"RAS", tech:"Dorian", ok:true },
];

// ─────────────────────────────────────────────────────────────────────────────
// CARNET PUBLIC INLINE (aperçu interne, données déjà chargées)
// ─────────────────────────────────────────────────────────────────────────────
export function CarnetPublicInline({ client, passages, livraisons=[], versements={} }) {
  return <CarnetView client={client} passages={passages} livraisons={livraisons} versements={versements} onRefresh={null} refreshing={false}/>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CARNET PUBLIC (URL ?carnet=CODE)
// ─────────────────────────────────────────────────────────────────────────────
export function CarnetPublic({ code }) {
  const [loadedClients, setLoadedClients] = useState(null);
  const [loadedPassages, setLoadedPassages] = useState(null);
  const [loadedLivraisons, setLoadedLivraisons] = useState([]);
  const [loadedVersements, setLoadedVersements] = useState({});
  const [loadedRetardsCarnet, setLoadedRetardsCarnet] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const snap = await getDoc(APP_DOC);
      if (snap.exists()) {
        const d = snap.data();
        const c = d["bb_clients_v2"];
        const p = d["bb_passages_v2"];
        const l = d["bb_livraisons_v1"];
        const v = d["bb_versements_v1"];
        const rc = d["bb_retards_carnet_v1"];
        setLoadedClients(c && c.length ? c : CLIENTS_INIT);
        setLoadedPassages(p && p.length ? p : PASSAGES_INIT);
        setLoadedLivraisons(Array.isArray(l) ? l : []);
        setLoadedVersements(v && typeof v === "object" ? v : {});
        setLoadedRetardsCarnet(rc && typeof rc === "object" ? rc : {});
      } else {
        setLoadedClients(CLIENTS_INIT);
        setLoadedPassages(PASSAGES_INIT);
      }
    } catch {
      setLoadedClients(CLIENTS_INIT);
      setLoadedPassages(PASSAGES_INIT);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Actualisation auto : toutes les 30s quand la page est visible
    const interval = setInterval(() => {
      if (document.visibilityState !== "hidden") loadData();
    }, 30000);
    // Actualisation immédiate au retour au premier plan (iPhone: tab switch, app switch)
    const onVisible = () => { if (document.visibilityState === "visible") loadData(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadData]);

  if (loadedClients === null) return (
    <div style={{minHeight:"100vh",background:"#f0f6fb",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif"}}>
      <div style={{width:48,height:48,border:"4px solid #e0f2fe",borderTop:"4px solid #0891b2",borderRadius:"50%",animation:"spin 0.8s linear infinite",marginBottom:20}}/>
      <div style={{fontSize:15,color:"#0891b2",fontWeight:600}}>Chargement de votre carnet…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const client = loadedClients.find(c=>generateCarnetCode(c.id)===code.toUpperCase());
  if (!client) return (
    <div style={{minHeight:"100vh",background:"#f0f6fb",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif"}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <div style={{fontSize:18,fontWeight:700,color:"#0f172a",marginBottom:8}}>Code invalide</div>
      <div style={{fontSize:14,color:"#64748b"}}>Vérifiez le code fourni par votre technicien.</div>
    </div>
  );

  const clientLivraisons = loadedLivraisons.filter(l=>l.clientId===client.id);
  return <CarnetView client={client} passages={loadedPassages||[]} livraisons={clientLivraisons} versements={loadedVersements} retardsCarnet={loadedRetardsCarnet} onRefresh={loadData} refreshing={refreshing}/>;
}

// ─────────────────────────────────────────────────────────────────────────────
// VUE CARNET COMMUNE (partagée entre CarnetPublicInline et CarnetPublic)
// ─────────────────────────────────────────────────────────────────────────────
export function CarnetView({ client, passages, livraisons=[], versements={}, retardsCarnet={}, onRefresh, refreshing }) {
  const [selectedPassage, setSelectedPassage] = useState(null);
  const [activeTab, setActiveTab] = useState("accueil");
  const [showSOS, setShowSOS] = useState(false);

  const passClient = (passages||[])
    .filter(p => p.clientId === client.id)
    .sort((a,b) => new Date(b.date) - new Date(a.date));

  const last = passClient[0] || null;
  const phOk  = v => v >= 7 && v <= 7.6;
  const clOk  = v => v >= 0.5 && v <= 3;
  const fmtDate = (d, opts) => new Date(d).toLocaleDateString("fr", opts);
  const getResume = getResumePassage;

  const totalVisitesPrevues = calculerPassagesPrevusContrat(client);
  const passagesDeduits = passClient.filter(p => isPassageDansContrat(p, client) && isPassageEffectue(p));
  const visitesEffectuees = passagesDeduits.length;
  const visitesRestantes = Math.max(0, totalVisitesPrevues - visitesEffectuees);
  const _progressPct = totalVisitesPrevues > 0 ? Math.min(100, (visitesEffectuees / totalVisitesPrevues) * 100) : 0;

  const daysUntilFin = client.dateFin ? Math.ceil((new Date(client.dateFin) - new Date()) / (1000*60*60*24)) : null;
  const contratActif = daysUntilFin === null || daysUntilFin > 0;

  // ─── VERSEMENTS ────────────────────────────────────────────────────────────
  const versKey = (y, m) => `${client.id}_${y}_${String(m).padStart(2,"0")}`;
  const mensualite = client.prix ? Math.round(client.prix / 12) : 0;
  const MOIS_LONG = ["","Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

  const versementMoisDus = (() => {
    if (!client.dateDebut || !mensualite) return [];
    const today = new Date();
    const debut = new Date(client.dateDebut);
    const fin   = client.dateFin ? new Date(client.dateFin) : new Date(debut.getFullYear()+1, debut.getMonth(), debut.getDate());
    const dus = [];
    let cur = new Date(debut.getFullYear(), debut.getMonth(), 1);
    const finMois    = new Date(fin.getFullYear(), fin.getMonth(), 1);
    const curMois    = new Date(today.getFullYear(), today.getMonth(), 1);
    while (cur <= finMois && cur <= curMois) {
      const y = cur.getFullYear(), m = cur.getMonth()+1;
      if (!versements[versKey(y,m)]) dus.push({ year:y, month:m });
      cur = new Date(cur.getFullYear(), cur.getMonth()+1, 1);
    }
    return dus;
  })();

  // ─── WIDGET VERSEMENT (vue client) ─────────────────────────────────────────
  const VersementWidget = () => {
    if (!mensualite || !client.dateDebut) return null;
    const today = new Date();
    const nbDus = versementMoisDus.length;
    // mois en retard = tous les mois dus SAUF le mois courant
    const retards = versementMoisDus.filter(({year:y,month:m}) =>
      !(y === today.getFullYear() && m === today.getMonth()+1)
    );
    const aJour = nbDus === 0;
    const totalDu = nbDus * mensualite;

    return (
      <div style={{padding:"0 12px",marginBottom:4}}>
        <div style={{
          background:"#fff",borderRadius:16,overflow:"hidden",
          border:`1px solid ${aJour?"#bbf7d0":retards.length>=2?"#fca5a5":"#fed7aa"}`,
          boxShadow:`0 2px 10px ${aJour?"rgba(22,163,74,0.07)":retards.length>=2?"rgba(220,38,38,0.09)":"rgba(234,88,12,0.09)"}`,
        }}>
          <div style={{height:3,background:aJour
            ?"linear-gradient(90deg,#22c55e,#86efac)"
            :retards.length>=2?"linear-gradient(90deg,#ef4444,#f87171)"
            :"linear-gradient(90deg,#f97316,#fb923c)"
          }}/>
          <div style={{padding:"13px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:aJour?0:10}}>
              <div style={{width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                background:aJour?"#f0fdf4":retards.length>=2?"#fee2e2":"#fff7ed"}}>
                {aJour
                  ? <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={retards.length>=2?"#dc2626":"#ea580c"} strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                }
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>
                  {aJour ? "Paiements à jour" : retards.length>=2 ? `${retards.length} mensualité${retards.length>1?"s":""} en retard` : "Mensualité en attente"}
                </div>
                <div style={{fontSize:11,color:"#64748b",marginTop:2}}>
                  {aJour ? `${mensualite}€ / mois · contrat ${client.formule||""}` : `${totalDu}€ restant${totalDu>mensualite?"s":""} à régler`}
                </div>
              </div>
              {!aJour && (
                <div style={{flexShrink:0,textAlign:"right"}}>
                  <div style={{fontSize:18,fontWeight:900,color:retards.length>=2?"#dc2626":"#ea580c"}}>{totalDu}€</div>
                </div>
              )}
            </div>

            {!aJour && (
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {versementMoisDus.map(({year:y,month:m})=>{
                  const estCourant = y===today.getFullYear() && m===today.getMonth()+1;
                  return (
                    <div key={versKey(y,m)} style={{
                      display:"flex",alignItems:"center",justifyContent:"space-between",
                      padding:"8px 10px",borderRadius:10,
                      background:estCourant?"#fff7ed":"#fff1f2",
                      border:`1px solid ${estCourant?"#fed7aa":"#fecaca"}`,
                    }}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:30,height:30,borderRadius:8,background:estCourant?"#ffedd5":"#fee2e2",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                          <span style={{fontSize:8,fontWeight:700,color:estCourant?"#ea580c":"#dc2626",lineHeight:1.2}}>{MOIS_LONG[m].slice(0,3).toUpperCase()}</span>
                          <span style={{fontSize:8,color:estCourant?"#ea580c":"#dc2626",lineHeight:1.2}}>{y}</span>
                        </div>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:"#0f172a"}}>{MOIS_LONG[m]} {y}</div>
                          <div style={{fontSize:10,color:"#64748b"}}>{estCourant?"Mois en cours":"En retard"}</div>
                        </div>
                      </div>
                      <span style={{fontSize:14,fontWeight:700,color:estCourant?"#ea580c":"#dc2626"}}>{mensualite}€</span>
                    </div>
                  );
                })}
                <a href="tel:+33667186115" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginTop:2,padding:"10px",borderRadius:10,background:"linear-gradient(135deg,#0891b2,#0e7490)",textDecoration:"none",boxShadow:"0 4px 14px rgba(8,145,178,0.3)"}}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>
                  <span style={{fontSize:12,fontWeight:700,color:"white"}}>Contacter BRIBLUE</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const WAVES_SVG = (
    <svg viewBox="0 0 400 60" preserveAspectRatio="none" style={{position:"absolute",bottom:0,left:0,right:0,width:"100%",height:60,opacity:0.15}} aria-hidden="true">
      <path d="M0 40 C80 20 160 55 240 35 C320 15 360 45 400 30 L400 60 L0 60 Z" fill="white" className="cv-wave" style={{animationDelay:"0s"}}/>
      <path d="M0 50 C60 30 140 60 220 40 C300 20 360 50 400 38 L400 60 L0 60 Z" fill="white" opacity="0.6"/>
    </svg>
  );

  // ─── BOTTOM NAV ────────────────────────────────────────────────────────────
  const BottomNav = () => (
    <div style={{
      position:"sticky",bottom:0,zIndex:200,
      background:"rgba(255,255,255,0.92)",
      backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
      borderTop:"1px solid rgba(226,232,240,0.8)",
      display:"flex",padding:"6px 0 max(10px,env(safe-area-inset-bottom,10px))",
    }}>
      {[
        {id:"accueil",label:"Accueil",path:<><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></>},
        {id:"historique",label:"Rapports",path:<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>},
        {id:"sos",label:"SOS",path:<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,isSos:true},
        {id:"produits",label:"Produits",path:<><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></>},
        {id:"profil",label:"Profil",path:<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>},
      ].map(({id,label,path,isSos})=>{
        const isActive = !isSos && activeTab===id;
        return (
          <button key={id} className="cv-btn-press"
            onClick={()=>isSos ? setShowSOS(true) : setActiveTab(id)}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,border:"none",background:"none",cursor:"pointer",padding:"4px 0",transition:"opacity 0.15s"}}>
            {isSos ? (
              <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#0891b2,#0e4f6f)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(8,145,178,0.5)",marginBottom:1,marginTop:-8}}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">{path}</svg>
              </div>
            ) : (
              <div style={{width:36,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,background:isActive?"#e0f2fe":"transparent",transition:"background 0.2s"}}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={isActive?"#0891b2":"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
              </div>
            )}
            <span style={{fontSize:10,fontWeight:isActive?600:400,color:isSos?"#0891b2":isActive?"#0891b2":"#94a3b8",letterSpacing:isSos?"-0.1px":"0"}}>{label}</span>
          </button>
        );
      })}
    </div>
  );

  // ─── HERO ──────────────────────────────────────────────────────────────────
  const Hero = () => (
    <div className="cv-stagger-1" style={{margin:"12px 12px 0",borderRadius:20,overflow:"hidden",position:"relative",
      background:"linear-gradient(145deg,#0c6a8c 0%,#0891b2 40%,#0e7490 75%,#134e6b 100%)",
      boxShadow:"0 8px 32px rgba(8,145,178,0.35)",
    }}>
      {/* Orbs décoratifs */}
      <div style={{position:"absolute",right:-40,top:-40,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(56,189,248,0.3) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",left:-20,bottom:-30,width:130,height:130,borderRadius:"50%",background:"radial-gradient(circle,rgba(14,116,144,0.5) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",right:60,bottom:10,width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.05)",pointerEvents:"none"}}/>
      {WAVES_SVG}

      <div style={{position:"relative",padding:"18px 16px 22px"}}>
        {/* Row: logo + refresh */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div className="cv-glass" style={{width:34,height:34,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width={18} height={13} viewBox="0 0 32 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M2 8c2.5 3 5 3 7.5 0S14 5 16.5 8s5 3 7.5 0"/>
                <path d="M2 16c2.5 3 5 3 7.5 0S14 13 16.5 16s5 3 7.5 0"/>
              </svg>
            </div>
            <span style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.9)",letterSpacing:1}}>BRIBLUE</span>
          </div>
          {onRefresh && (
            <button onClick={onRefresh} disabled={refreshing} className="cv-glass cv-btn-press" style={{border:"none",cursor:"pointer",width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"white",padding:0}}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={refreshing?{animation:"cv-spin .7s linear infinite"}:{}}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
            </button>
          )}
        </div>

        {/* Nom + badge */}
        <div style={{fontSize:22,fontWeight:700,color:"#fff",lineHeight:1.2,letterSpacing:"-0.3px",marginBottom:6}}>{client.nom}</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:5,marginBottom:16,background:"rgba(255,255,255,0.15)",borderRadius:20,padding:"4px 11px",border:"1px solid rgba(255,255,255,0.2)"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:contratActif?"#4ade80":"#f87171",display:"inline-block",boxShadow:contratActif?"0 0 6px #4ade80":"0 0 6px #f87171"}}/>
          <span style={{fontSize:12,color:"#fff",fontWeight:500}}>Contrat {contratActif?"actif":"expiré"}</span>
        </div>

        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div className="cv-glass" style={{borderRadius:12,padding:"11px 13px"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.65)",marginBottom:3,display:"flex",alignItems:"center",gap:4}}>
              <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Fin de contrat
            </div>
            <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>
              {client.dateFin ? fmtDate(client.dateFin,{day:"2-digit",month:"short",year:"numeric"}) : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── SECTION HEADER ────────────────────────────────────────────────────────
  const SectionHead = ({icon, title, action, onAction}) => (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0 8px"}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <div style={{width:28,height:28,borderRadius:8,background:"#e0f2fe",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2" strokeLinecap="round">{icon}</svg>
        </div>
        <span style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>{title}</span>
      </div>
      {action && <button onClick={onAction} style={{fontSize:12,color:"#0891b2",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:500,padding:"4px 8px",borderRadius:6,background:"#f0f9ff"}}>{action} →</button>}
    </div>
  );

  // ─── DERNIÈRE INTERVENTION ─────────────────────────────────────────────────
  const DerniereIntervention = () => last ? (
    <div style={{padding:"0 12px"}}>
      <SectionHead
        icon={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
        title="Dernière intervention"
      />
      <div className="cv-card-hover" onClick={()=>setSelectedPassage(last)} style={{
        background:"#fff",borderRadius:16,border:"1px solid #e2e8f0",overflow:"hidden",
        boxShadow:"0 2px 12px rgba(0,0,0,0.06)",cursor:"pointer",
      }}>
        {/* Bande colorée en haut */}
        <div style={{height:3,background:"linear-gradient(90deg,#0891b2,#38bdf8,#7dd3fc)"}}/>
        <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
          {/* Date bloc */}
          <div style={{textAlign:"center",minWidth:52,background:"#f0f9ff",borderRadius:10,padding:"8px 4px"}}>
            <div style={{fontSize:9,color:"#0891b2",textTransform:"uppercase",letterSpacing:0.5,fontWeight:600}}>{fmtDate(last.date,{weekday:"short"})}</div>
            <div style={{fontSize:26,fontWeight:700,color:"#0891b2",lineHeight:1.1}}>{fmtDate(last.date,{day:"2-digit"})}</div>
            <div style={{fontSize:10,color:"#64748b"}}>{fmtDate(last.date,{month:"short"})}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:"#0f172a",marginBottom:3}}>{last.type||"Entretien"}</div>
            <div style={{fontSize:12,color:"#64748b",display:"flex",alignItems:"center",gap:4}}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {last.heure||"09:00"}{last.tech&&<> · <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>{last.tech}</>}
            </div>
            {(getPH(last)||getCL(last))&&(
              <div style={{display:"flex",gap:5,marginTop:7}}>
                {getPH(last)&&<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,background:phOk(getPH(last))?"#dcfce7":"#fef3c7",color:phOk(getPH(last))?"#15803d":"#92400e"}}>pH {getPH(last)}</span>}
                {getCL(last)&&<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,background:clOk(getCL(last))?"#dcfce7":"#fef3c7",color:clOk(getCL(last))?"#15803d":"#92400e"}}>Cl {getCL(last)}</span>}
                {getTemp(last)&&<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,background:"#e0f2fe",color:"#0369a1"}}>{getTemp(last)}°C</span>}
              </div>
            )}
          </div>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>
  ) : null;

  // ─── RAPPORTS LIST ─────────────────────────────────────────────────────────
  const RapportsList = ({list, showAll}) => (
    <div style={{padding:"0 12px"}}>
      <SectionHead
        icon={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></>}
        title={showAll?"Tous les rapports":"Rapports d'intervention"}
        action={!showAll&&passClient.length>3?"Voir tout":null}
        onAction={()=>setActiveTab("historique")}
      />
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {list.length===0&&(
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:13}}>
            <div style={{fontSize:32,marginBottom:8}}>📋</div>
            Aucune intervention enregistrée
          </div>
        )}
        {list.map((p,i)=>{
          const ph=getPH(p); const cl=getCL(p); const tmp=getTemp(p);
          const isNew = i===0;
          return (
            <div key={p.id||i} className="cv-rapport-row" onClick={()=>setSelectedPassage(p)} style={{
              background:"#fff",borderRadius:14,
              border:`1px solid ${isNew?"#bae6fd":"#e2e8f0"}`,
              boxShadow:isNew?"0 2px 12px rgba(8,145,178,0.1)":"0 1px 4px rgba(0,0,0,0.04)",
              overflow:"hidden",
            }}>
              {isNew&&<div style={{height:2,background:"linear-gradient(90deg,#0891b2,#7dd3fc)"}}/>}
              <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:38,height:38,borderRadius:10,background:isControleType(p.type)?"#e0f2fe":"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {isControleType(p.type)
                    ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2C6 2 2 12 2 12s4 10 10 10 10-10 10-10S18 2 12 2z"/></svg>
                    : <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                  }
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{p.type||"Contrôle de l'eau"}</div>
                  <div style={{fontSize:11,color:"#64748b",marginTop:1}}>{fmtDate(p.date,{weekday:"long",day:"2-digit",month:"short",year:"numeric"})}</div>
                  {(ph||cl||tmp)&&(
                    <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
                      {ph&&<span style={{fontSize:11,fontWeight:600,padding:"2px 7px",borderRadius:5,background:phOk(ph)?"#dcfce7":"#fef3c7",color:phOk(ph)?"#15803d":"#92400e"}}>pH {ph}</span>}
                      {cl&&<span style={{fontSize:11,fontWeight:600,padding:"2px 7px",borderRadius:5,background:clOk(cl)?"#dcfce7":"#fef3c7",color:clOk(cl)?"#15803d":"#92400e"}}>Cl {cl}</span>}
                      {tmp&&<span style={{fontSize:11,fontWeight:600,padding:"2px 7px",borderRadius:5,background:"#e0f2fe",color:"#0369a1"}}>{tmp}°C</span>}
                    </div>
                  )}
                </div>
                <button className="cv-btn-press" style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#0891b2",background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"6px 9px",cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}
                  onClick={e=>{e.stopPropagation(); ouvrirRapport(p, client);}}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── RAPPORT DÉTAILLÉ ──────────────────────────────────────────────────────
  const RapportDetail = () => {
    if (!last) return null;
    const params = [
      {label:"pH", val:getPH(last), unit:"", color:phOk(getPH(last))?"#ea580c":"#dc2626", ok:phOk(getPH(last)), okLabel:"Idéal", koLabel:"Revoir"},
      {label:"Chlore libre", val:getCL(last), unit:"mg/L", color:clOk(getCL(last))?"#16a34a":"#dc2626", ok:clOk(getCL(last)), okLabel:"Idéal", koLabel:"Revoir"},
      {label:"Alcalinité", val:last.alcalinite, unit:"mg/L", color:"#0891b2", ok:last.alcalinite>=80&&last.alcalinite<=120, okLabel:"Correct", koLabel:"Revoir"},
      {label:"Stabilisant", val:last.stabilisant, unit:"mg/L", color:"#0891b2", ok:last.stabilisant>=20&&last.stabilisant<=50, okLabel:"Correct", koLabel:"Revoir"},
      {label:"Température", val:getTemp(last), unit:"°C", color:"#0284c7", ok:true, okLabel:"Eau idéale", koLabel:""},
    ].filter(p=>p.val!==null&&p.val!==undefined&&p.val!=="");
    if (params.length===0) return null;
    return (
      <div style={{padding:"0 12px"}}>
        <SectionHead
          icon={<><path d="M12 2C6 2 2 12 2 12s4 10 10 10 10-10 10-10S18 2 12 2z"/></>}
          title="Dernier rapport détaillé"
        />
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #e2e8f0",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
          {/* Header */}
          <div style={{padding:"13px 16px 11px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"flex-start",justifyContent:"space-between",background:"linear-gradient(135deg,#f0f9ff,#fff)"}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#0891b2",marginBottom:2}}>{last.type||"Contrôle de l'eau"}</div>
              <div style={{fontSize:11,color:"#64748b"}}>{fmtDate(last.date,{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}{last.heure?` · ${last.heure}`:""}</div>
              {last.tech&&<div style={{fontSize:11,color:"#94a3b8",marginTop:2,display:"flex",alignItems:"center",gap:3}}>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {last.tech}
              </div>}
            </div>
            <button className="cv-btn-press" style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#0891b2",background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:"7px 11px",cursor:"pointer",flexShrink:0,fontFamily:"inherit",fontWeight:500}} onClick={()=>telechargerRapport(last,client)}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Télécharger
            </button>
          </div>
          {/* Params grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
            {params.map((p,i)=>{
              const col3 = (i+1)%3===0 || i===params.length-1;
              const lastRow = i >= params.length-3;
              const wide = i===params.length-1 && params.length%3!==0;
              return (
                <div key={p.label} className="cv-param-cell" style={{
                  padding:"12px 12px",
                  borderRight:col3?"none":"1px solid #f1f5f9",
                  borderBottom:lastRow?"none":"1px solid #f1f5f9",
                  gridColumn:wide?`span ${3-(params.length-1)%3}`:"span 1",
                }}>
                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:5,letterSpacing:"0.2px"}}>{p.label}</div>
                  <div style={{fontSize:p.label==="pH"?24:20,fontWeight:700,color:p.ok?p.color:"#dc2626",lineHeight:1,marginBottom:4}}>
                    {p.val}
                    {p.unit&&<span style={{fontSize:11,fontWeight:400,color:"#94a3b8",marginLeft:2}}>{p.unit}</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{
                      width:6,height:6,borderRadius:"50%",flexShrink:0,
                      background:p.ok?"#22c55e":"#ef4444",
                      boxShadow:p.ok?"0 0 5px rgba(34,197,94,0.5)":"0 0 5px rgba(239,68,68,0.5)",
                    }}/>
                    <span style={{fontSize:10,color:p.ok?"#16a34a":"#dc2626",fontWeight:500}}>{p.ok?p.okLabel:p.koLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Remarques */}
          {getResume(last)&&(
            <div style={{padding:"12px 16px",background:"#f8fafc",borderTop:"1px solid #f1f5f9",display:"flex",alignItems:"flex-start",gap:10}}>
              <div style={{width:28,height:28,borderRadius:8,background:"#dcfce7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"#0f172a",marginBottom:3}}>Remarques</div>
                <div style={{fontSize:12,color:"#64748b",lineHeight:1.6}}>{getResume(last)}</div>
              </div>
            </div>
          )}
          {last.obs&&(
            <div style={{padding:"12px 16px",background:"#fffbeb",borderTop:"1px solid #fef3c7",display:"flex",alignItems:"flex-start",gap:10}}>
              <div style={{width:28,height:28,borderRadius:8,background:"#fef9c3",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"#92400e",marginBottom:3}}>Observations</div>
                <div style={{fontSize:12,color:"#78350f",lineHeight:1.6}}>{last.obs}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── PRODUITS TAB ──────────────────────────────────────────────────────────
  const ProduitsTab = () => {
    // Livraisons séparées (bb_livraisons_v1) — créées automatiquement à chaque passage avec produits
    const livsDirectes = (livraisons||[])
      .filter(l => (l.produits||[]).length > 0 || (l.description && String(l.description).trim()))
      .map(l => ({ id:l.id, date:l.date, produits:l.produits||[], description:l.description||"", source:"livraison" }));
    // Dates déjà couvertes par une livraison directe (évite les doublons)
    const livraisonDates = new Set(livsDirectes.map(l => String(l.date).slice(0,10)));
    // Produits livrés lors des passages — uniquement si aucune livraison directe ce jour-là
    const livsPassage = passClient
      .filter(p => getProduitsLivres(p).length > 0 && !livraisonDates.has(String(p.date).slice(0,10)))
      .map(p => ({ id:p.id, date:p.date, produits:getProduitsLivres(p), source:"passage" }));
    const all = [...livsDirectes, ...livsPassage].sort((a,b)=>b.date.localeCompare(a.date));

    return (
      <div style={{padding:"0 12px"}}>
        <SectionHead
          icon={<><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></>}
          title="Produits livrés"
        />
        {all.length===0
          ? <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"40px 24px",textAlign:"center"}}>
              <div style={{width:48,height:48,background:"#f1f5f9",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
              </div>
              <div style={{fontSize:14,fontWeight:600,color:"#64748b",marginBottom:4}}>Aucune livraison</div>
              <div style={{fontSize:12,color:"#94a3b8"}}>Les livraisons de produits apparaîtront ici</div>
            </div>
          : <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {all.map((item,i)=>{
                const label = item.produits.length > 0 ? item.produits.join(", ") : (item.description||"Livraison");
                return (
                  <div key={item.id||i} style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"12px 14px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                    <div style={{width:40,height:40,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"1px solid #bbf7d0"}}>
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:1}}>{fmtDate(item.date,{day:"2-digit",month:"short",year:"numeric"})}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4,background:"#f0fdf4",color:"#15803d",borderRadius:8,padding:"4px 9px",fontSize:11,fontWeight:600,flexShrink:0,border:"1px solid #bbf7d0"}}>
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      Livré
                    </div>
                  </div>
                );
              })}
            </div>
        }
      </div>
    );
  };

  // ─── PROFIL TAB ────────────────────────────────────────────────────────────
  const ProfilTab = () => (
    <div style={{padding:"0 12px"}}>
      <SectionHead
        icon={<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
        title="Mon profil"
      />
      {/* Avatar card */}
      <div style={{background:"linear-gradient(135deg,#0891b2,#0e7490)",borderRadius:16,padding:"20px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:14,position:"relative",overflow:"hidden",boxShadow:"0 4px 18px rgba(8,145,178,0.3)"}}>
        <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.07)"}}/>
        <div style={{width:52,height:52,background:"rgba(255,255,255,0.2)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"2px solid rgba(255,255,255,0.3)"}}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:4}}>{client.nom}</div>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.18)",borderRadius:20,padding:"3px 10px",border:"1px solid rgba(255,255,255,0.2)"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:contratActif?"#4ade80":"#f87171",display:"inline-block",boxShadow:contratActif?"0 0 5px #4ade80":"0 0 5px #f87171"}}/>
            <span style={{fontSize:11,color:"#fff",fontWeight:500}}>Contrat {contratActif?"actif":"expiré"}</span>
          </div>
        </div>
      </div>
      {/* Infos card */}
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        {[
          client.bassin&&{label:"Type de bassin",val:client.bassin,icon:<rect x="2" y="6" width="20" height="12" rx="2"/>},
          client.volume&&{label:"Volume",val:client.volume+"m³",icon:<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></>},
          client.formule&&{label:"Formule",val:client.formule,icon:<><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>},
          client.dateDebut&&{label:"Début contrat",val:fmtDate(client.dateDebut,{day:"2-digit",month:"long",year:"numeric"}),icon:<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>},
          client.dateFin&&{label:"Fin contrat",val:fmtDate(client.dateFin,{day:"2-digit",month:"long",year:"numeric"}),icon:<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>},
          {label:"Passages prévus contrat",val:`${totalVisitesPrevues} passage${totalVisitesPrevues!==1?"s":""}`,icon:<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></>},
          {label:"Rapports déduits",val:`${visitesEffectuees} passage${visitesEffectuees!==1?"s":""}`,icon:<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>},
          {label:"Passages restants",val:`${visitesRestantes} passage${visitesRestantes!==1?"s":""}`,icon:<><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>},
        ].filter(Boolean).map((row,i,arr)=>(
          <div key={row.label} style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:i<arr.length-1?"1px solid #f8fafc":"none"}}>
            <div style={{width:30,height:30,background:"#f0f9ff",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round">{row.icon}</svg>
            </div>
            <span style={{fontSize:13,color:"#64748b",flex:1}}>{row.label}</span>
            <span style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{row.val}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── BOTTOM SHEET PASSAGE ──────────────────────────────────────────────────
  const PassageSheet = () => {
    const p = selectedPassage;
    if (!p) return null;
    return (
      <div onClick={()=>setSelectedPassage(null)} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:10002,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",animation:"cv-fadeIn 0.2s ease"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",WebkitOverflowScrolling:"touch",boxShadow:"0 -20px 60px rgba(0,0,0,0.25)",paddingBottom:"max(32px,env(safe-area-inset-bottom,32px))",animation:"cv-fadeUp 0.3s ease"}}>
          {/* Handle */}
          <div style={{padding:"14px 0 4px",display:"flex",justifyContent:"center"}}>
            <div style={{width:40,height:4,background:"#e2e8f0",borderRadius:2}}/>
          </div>
          {/* Bande type */}
          <div style={{height:3,background:isControleType(p.type)?"linear-gradient(90deg,#0891b2,#38bdf8)":"linear-gradient(90deg,#3b82f6,#93c5fd)",margin:"0 22px",borderRadius:2}}/>
          <div style={{padding:"16px 22px 0"}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18}}>
              <div>
                <div style={{fontSize:19,fontWeight:700,color:"#0f172a",marginBottom:4}}>{p.type||"Entretien"}</div>
                <div style={{fontSize:12,color:"#64748b",display:"flex",alignItems:"center",gap:5}}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {fmtDate(p.date,{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
                </div>
                {p.tech&&<div style={{fontSize:12,color:"#64748b",marginTop:3,display:"flex",alignItems:"center",gap:5}}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {p.tech}
                </div>}
              </div>
              <button onClick={()=>setSelectedPassage(null)} style={{width:34,height:34,borderRadius:10,background:"#f1f5f9",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Mesures */}
            {(getPH(p)||getCL(p)||getTemp(p))&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                {[
                  getPH(p)&&{label:"pH",val:getPH(p),ok:phOk(getPH(p)),color:phOk(getPH(p))?"#ea580c":"#dc2626",okLabel:"Idéal",koLabel:"Revoir",bg:phOk(getPH(p))?"#f0fdf4":"#fff7ed",border:phOk(getPH(p))?"#86efac":"#fed7aa"},
                  getCL(p)&&{label:"Chlore",val:getCL(p),ok:clOk(getCL(p)),color:clOk(getCL(p))?"#16a34a":"#dc2626",okLabel:"Idéal",koLabel:"Revoir",bg:clOk(getCL(p))?"#f0fdf4":"#fff7ed",border:clOk(getCL(p))?"#86efac":"#fed7aa"},
                  getTemp(p)&&{label:"Temp.",val:getTemp(p)+"°",ok:true,color:"#0284c7",okLabel:"Eau",koLabel:"",bg:"#e0f2fe",border:"#bae6fd"},
                ].filter(Boolean).map(m=>(
                  <div key={m.label} style={{borderRadius:14,padding:"12px 6px",textAlign:"center",background:m.bg,border:`1.5px solid ${m.border}`}}>
                    <div style={{fontSize:10,fontWeight:600,color:m.ok?"#166534":"#92400e",textTransform:"uppercase",letterSpacing:.4,marginBottom:5}}>{m.label}</div>
                    <div style={{fontSize:28,fontWeight:700,color:m.color,lineHeight:1}}>{m.val}</div>
                    <div style={{fontSize:10,fontWeight:600,marginTop:5,color:m.ok?m.color:"#dc2626"}}>{m.ok?`✓ ${m.okLabel}`:`⚠ ${m.koLabel}`}</div>
                  </div>
                ))}
              </div>
            )}

            {/* TAC + CYA */}
            {(p.alcalinite||p.stabilisant)&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {p.alcalinite&&<div style={{background:"#e0f2fe",borderRadius:10,padding:"10px 12px",border:"1px solid #bae6fd"}}>
                  <div style={{fontSize:9,fontWeight:600,color:"#0369a1",textTransform:"uppercase",marginBottom:3}}>Alcalinité (TAC)</div>
                  <div style={{fontSize:20,fontWeight:700,color:"#0284c7"}}>{p.alcalinite} <span style={{fontSize:10,fontWeight:400,color:"#64748b"}}>mg/L</span></div>
                </div>}
                {p.stabilisant&&<div style={{background:"#e0f2fe",borderRadius:10,padding:"10px 12px",border:"1px solid #bae6fd"}}>
                  <div style={{fontSize:9,fontWeight:600,color:"#0369a1",textTransform:"uppercase",marginBottom:3}}>Stabilisant (CYA)</div>
                  <div style={{fontSize:20,fontWeight:700,color:"#0284c7"}}>{p.stabilisant} <span style={{fontSize:10,fontWeight:400,color:"#64748b"}}>mg/L</span></div>
                </div>}
              </div>
            )}

            {/* Qualité eau */}
            {p.qualiteEau&&(
              <div style={{background:"#f8fafc",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10,border:"1px solid #e2e8f0"}}>
                <span style={{fontSize:18}}>{p.qualiteEau==="Cristalline"?"💎":p.qualiteEau==="Verte"?"🌿":"🌫️"}</span>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:"#64748b",textTransform:"uppercase",marginBottom:1}}>Qualité eau</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{p.qualiteEau}</div>
                </div>
              </div>
            )}

            {/* Produits apportés */}
            {(p.corrChlore||p.corrPH||p.corrAlgicide||p.corrAlcafix||p.corrSel||p.corrChloreChoc||p.corrPeroxyde||p.corrPhosphate||p.corrAutre)&&(
              <div style={{background:"#f5f3ff",borderRadius:12,padding:"12px 14px",marginBottom:12,border:"1px solid #e9d5ff"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#6d28d9",textTransform:"uppercase",letterSpacing:.7,marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 3h6v5l3 9a3 3 0 01-3 3H9a3 3 0 01-3-3l3-9V3z"/></svg>
                  Produits apportés
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {[["Chlore",p.corrChlore],["pH",p.corrPH],["Sel",p.corrSel],["Algicide",p.corrAlgicide],["Chlore choc",p.corrChloreChoc],["Peroxyde",p.corrPeroxyde],["Phosphate",p.corrPhosphate],["Alcafix",p.corrAlcafix],["Autre",p.corrAutre]]
                    .filter(([,v])=>v).map(([k,v])=>(
                    <span key={k} style={{fontSize:12,fontWeight:500,color:"#6d28d9",background:"#ede9fe",borderRadius:7,padding:"3px 9px",border:"1px solid #ddd6fe"}}>{k}: {v}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Compte-rendu */}
            {getResume(p)&&(
              <div style={{background:"#f8fafc",borderRadius:12,padding:"12px 14px",marginBottom:12,border:"1px solid #e2e8f0"}}>
                <div style={{fontSize:10,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:.7,marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Compte-rendu
                </div>
                <div style={{fontSize:13,color:"#334155",lineHeight:1.7}}>{getResume(p)}</div>
              </div>
            )}

            {/* Obs */}
            {(p.obs||p.commentaires)&&(
              <div style={{background:"#fffbeb",borderRadius:12,padding:"12px 14px",marginBottom:12,borderLeft:"3px solid #fbbf24"}}>
                <div style={{fontSize:10,fontWeight:600,color:"#92400e",textTransform:"uppercase",letterSpacing:.7,marginBottom:6}}>Observations</div>
                <div style={{fontSize:13,color:"#78350f",lineHeight:1.7}}>{p.obs||p.commentaires}</div>
              </div>
            )}

            {/* Produits livrés */}
            {getProduitsLivres(p).length>0&&(
              <div style={{background:"#f0fdf4",borderRadius:12,padding:"12px 14px",marginBottom:12,border:"1px solid #bbf7d0"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#15803d",textTransform:"uppercase",letterSpacing:.7,marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Produits livrés
                </div>
                <div style={{fontSize:13,color:"#065f46",lineHeight:1.6}}>{getProduitsLivres(p).join(", ")}</div>
              </div>
            )}

            {/* Photos */}
            {(p.photoArrivee||p.photoDepart||(p.photos||[]).some(Boolean))&&(
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Photos</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                  {[p.photoArrivee?{src:p.photoArrivee,lbl:"Arrivée"}:null,...((p.photos||[]).filter(Boolean).map((s,i)=>({src:s,lbl:`Photo ${i+2}`}))),p.photoDepart?{src:p.photoDepart,lbl:"Départ"}:null].filter(Boolean).map((ph,i)=>(
                    <div key={i} style={{position:"relative",borderRadius:10,overflow:"hidden"}}>
                      <PhotoImg src={ph.src} alt={ph.lbl} style={{width:"100%",height:110,objectFit:"cover",display:"block"}}/>
                      <span style={{position:"absolute",bottom:4,left:5,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.6)",borderRadius:4,padding:"1px 6px"}}>{ph.lbl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!getPH(p)&&!getCL(p)&&!getResume(p)&&!p.qualiteEau&&(
              <div style={{textAlign:"center",padding:"24px 0",color:"#94a3b8",fontSize:13}}>
                <div style={{fontSize:32,marginBottom:8}}>📝</div>
                Aucune mesure enregistrée.
              </div>
            )}

            {/* Boutons aperçu / télécharger */}
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button className="cv-btn-press" style={{flex:1,padding:"13px",background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:14,fontSize:13,color:"#0891b2",fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}
                onClick={()=>ouvrirRapport(p,client)}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Aperçu PDF
              </button>
              <button className="cv-btn-press" style={{flex:1,padding:"13px",background:"linear-gradient(135deg,#0891b2,#0e7490)",border:"none",borderRadius:14,fontSize:13,color:"#fff",fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:7,boxShadow:"0 4px 14px rgba(8,145,178,0.4)"}}
                onClick={()=>telechargerRapport(p,client)}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Télécharger
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── SOS MODAL ─────────────────────────────────────────────────────────────
  const SOSModal = () => !showSOS ? null : (
    <div onClick={()=>setShowSOS(false)} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.65)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:10003,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",animation:"cv-fadeIn 0.2s ease"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,padding:"0 22px",paddingBottom:"max(32px,env(safe-area-inset-bottom,32px))",animation:"cv-fadeUp 0.3s ease",overflow:"hidden"}}>
        {/* Bande rouge */}
        <div style={{height:4,background:"linear-gradient(90deg,#dc2626,#f87171)",margin:"0 -22px 20px",marginTop:0}}/>
        <div style={{display:"flex",justifyContent:"center",marginBottom:4}}><div style={{width:40,height:4,background:"#e2e8f0",borderRadius:2}}/></div>
        <div style={{textAlign:"center",padding:"16px 0 24px"}}>
          <div style={{width:68,height:68,background:"linear-gradient(135deg,#fee2e2,#fecaca)",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",border:"2px solid #fca5a5",boxShadow:"0 6px 20px rgba(220,38,38,0.2)"}}>
            <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div style={{fontSize:20,fontWeight:700,color:"#0f172a",marginBottom:6}}>Besoin d'aide urgent ?</div>
          <div style={{fontSize:13,color:"#64748b",lineHeight:1.5}}>Contactez directement votre technicien BRIBLUE pour toute urgence piscine</div>
        </div>
        <a href="tel:+33667186115" className="cv-btn-press" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"linear-gradient(135deg,#0891b2,#0e7490)",color:"#fff",borderRadius:16,padding:"17px",fontSize:16,fontWeight:700,textDecoration:"none",marginBottom:10,boxShadow:"0 6px 20px rgba(8,145,178,0.4)"}}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>
          06 67 18 61 15
        </a>
        <button onClick={()=>setShowSOS(false)} className="cv-btn-press" style={{width:"100%",padding:"14px",background:"#f1f5f9",border:"none",borderRadius:14,fontSize:14,color:"#64748b",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"background 0.15s"}}>
          Fermer
        </button>
      </div>
    </div>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="cv-root" style={{background:"#f0f6fb",minHeight:"100vh",maxWidth:480,margin:"0 auto"}}>
      {/* HEADER */}
      <div style={{background:"rgba(255,255,255,0.9)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",padding:"13px 16px 11px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(226,232,240,0.8)",position:"sticky",top:0,zIndex:100}}>
        <div style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,color:"#94a3b8"}}>
          <svg width={18} height={14} viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="0" y1="1" x2="22" y2="1"/><line x1="0" y1="8" x2="22" y2="8"/><line x1="0" y1="15" x2="22" y2="15"/></svg>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#0f172a",letterSpacing:"-0.2px"}}>Carnet d'entretien</div>
          <div style={{fontSize:10,color:"#94a3b8",letterSpacing:"0.3px",marginTop:1}}>Votre piscine, notre expertise</div>
        </div>
        <button style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,border:"none",background:"transparent",cursor:"pointer",color:"#64748b"}} onClick={onRefresh||undefined} title="Actualiser">
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={refreshing?{animation:"cv-spin .7s linear infinite"}:{}}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
        </button>
      </div>

      {/* CONTENT */}
      <div className="cv-scroll" style={{paddingBottom:72}}>

        {/* HERO — toujours visible sauf profil/produits */}
        {(activeTab==="accueil"||activeTab==="historique") && <Hero/>}

        {/* ACCUEIL */}
        {activeTab==="accueil" && <>
          <div className="cv-stagger-2"><DerniereIntervention/></div>
          {retardsCarnet?.[client.id] && <div className="cv-stagger-3"><VersementWidget/></div>}
          <div className="cv-stagger-4"><RapportsList list={passClient.slice(0,3)} showAll={false}/></div>
          <div className="cv-stagger-5"><RapportDetail/></div>
        </>}

        {/* HISTORIQUE */}
        {activeTab==="historique" && (
          <div className="cv-stagger-1"><RapportsList list={passClient} showAll={true}/></div>
        )}

        {/* PRODUITS */}
        {activeTab==="produits" && (
          <div className="cv-stagger-1" style={{paddingTop:12}}><ProduitsTab/></div>
        )}

        {/* PROFIL */}
        {activeTab==="profil" && (
          <div className="cv-stagger-1" style={{paddingTop:12}}><ProfilTab/></div>
        )}

        {/* FOOTER */}
        <div style={{textAlign:"center",padding:"20px 0 8px"}}>
          <div style={{fontSize:10,color:"#cbd5e1",fontWeight:500,letterSpacing:"0.3px"}}>  ·BRIBLUE· </div>
        </div>
      </div>

      <BottomNav/>
      <PassageSheet/>
      <SOSModal/>
    </div>
  );
}