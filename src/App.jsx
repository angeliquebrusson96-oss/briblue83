

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── ICÔNES SVG PREMIUM ──────────────────────────────────────────────────────
const Ico = {
  home: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
  clients: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></svg>,
  clipboard: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  edit: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  close: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  save: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  search: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  back: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  next: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  check: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  alert: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  phone: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.15 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  mail: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  pin: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  user: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  note: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
  pdf: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/></svg>,
  send: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  sign: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
  calendar: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  drop: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>,
  chart: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  euro: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M17 8a6 6 0 100 8"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="9" x2="12" y2="9"/></svg>,
  pool: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M2 12c1.5 2 3 2 4.5 0S9 10 10.5 12s3 2 4.5 0 3-2 4.5 0"/><path d="M2 17c1.5 2 3 2 4.5 0S9 15 10.5 17s3 2 4.5 0 3-2 4.5 0"/><path d="M8 3v9M16 3v9M8 3h8"/></svg>,
  wrench: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  clock: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  star: (s=16,c="currentColor",fill="none") => <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  snow: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 7l-5-5-5 5"/><path d="M17 17l-5 5-5-5"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M7 7l-5 5 5 5"/><path d="M17 7l5 5-5 5"/></svg>,
  flower: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2a3 3 0 000 6M12 16a3 3 0 000 6M2 12a3 3 0 006 0M16 12a3 3 0 006 0M4.93 4.93a3 3 0 004.24 4.24M14.83 14.83a3 3 0 004.24 4.24M4.93 19.07a3 3 0 004.24-4.24M14.83 9.17a3 3 0 004.24-4.24"/></svg>,
  sun: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  leaf: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M11 20A7 7 0 014 13c0-7 7-11 7-11s7 4 7 11a7 7 0 01-7 7z"/><line x1="11" y1="20" x2="11" y2="13"/></svg>,
  wave: (s=28,c="white") => <svg width={s} height={s} viewBox="0 0 32 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M2 8c2.5 3 5 3 7.5 0S14 5 16.5 8s5 3 7.5 0"/><path d="M2 15c2.5 3 5 3 7.5 0S14 12 16.5 15s5 3 7.5 0"/></svg>,
  truck: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  camera: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  image: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  userPlus: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
};


// ─── DONNÉES PAR DÉFAUT ───────────────────────────────────────────────────────
const SAISONS_DEF = { hiver: 0, printemps: 2, ete: 4, automne: 2 };
const SAISONS_META = {
  hiver:     { label: "Hiver",     icon: "snow",    mois: [12,1,2],  color: "#60a5fa", bg: "#eff6ff" },
  printemps: { label: "Printemps", icon: "flower",  mois: [3,4,5],   color: "#34d399", bg: "#ecfdf5" },
  ete:       { label: "Été",       icon: "sun",     mois: [6,7,8],   color: "#f59e0b", bg: "#fffbeb" },
  automne:   { label: "Automne",   icon: "leaf",    mois: [9,10,11], color: "#f97316", bg: "#fff7ed" },
};
const MOIS = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MOIS_L = ["","Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const CLIENTS_INIT = [
  { id:"C001", nom:"Dupont Marie",  tel:"06 12 34 56 78", email:"marie@email.com",  adresse:"12 Rue des Pins, Hyères",    bassin:"Coque polyester", volume:45, formule:"Confort+", prix:1800, dateDebut:"2026-04-01", dateFin:"2027-03-31", saisons:{ hiver:4, printemps:4, ete:4, automne:4 } },
  { id:"C002", nom:"Martin Pierre", tel:"06 98 76 54 32", email:"pierre@email.com", adresse:"5 Av. de la Mer, Toulon",    bassin:"Béton",           volume:60, formule:"VAC+",     prix:1200, dateDebut:"2026-04-01", dateFin:"2026-09-30", saisons:{ hiver:0, printemps:2, ete:4, automne:2 } },
  { id:"C003", nom:"Garcia Sophie", tel:"06 11 22 33 44", email:"sophie@email.com", adresse:"8 Chemin du Lac, La Seyne", bassin:"Liner",           volume:35, formule:"VAC",      prix:850,  dateDebut:"2026-05-01", dateFin:"2026-09-30", saisons:{ hiver:0, printemps:2, ete:4, automne:2 } },
];
const PASSAGES_INIT = [
  { id:1, clientId:"C001", date:"2026-04-06", type:"Entretien", ph:7.2, chlore:1.5, actions:"Nettoyage, vérif. pompe", obs:"RAS",                      tech:"Dorian", ok:true },
  { id:2, clientId:"C002", date:"2026-04-06", type:"Entretien", ph:7.4, chlore:1.2, actions:"Nettoyage, ajust. pH",    obs:"Filtre à changer bientôt", tech:"Dorian", ok:true },
  { id:3, clientId:"C001", date:"2026-04-07", type:"SAV",       ph:7.1, chlore:1.8, actions:"Remplacement joint pompe",obs:"Garantie OK",               tech:"Dorian", ok:true },
];

const STATUT_LIV = {
  aFacturer: { label:"À facturer", color:"#ea580c", bg:"#ffedd5" },
  facture:   { label:"Facturé",    color:"#0284c7", bg:"#e0f2fe" },
  paye:      { label:"Payé",       color:"#059669", bg:"#d1fae5" },
};

// ─── RESPONSIVE HOOK ────────────────────────────────────────────────────────
function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(()=>{
    const h = ()=> setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return ()=> window.removeEventListener("resize", h);
  },[]);
  return m;
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
async function load(key, fallback) {
  try {
    const { data, error } = await supabase
      .from("app_data")
      .select("data")
      .eq("id", 1)
      .single();

    if (error || !data?.data) return fallback;

    const allData = data.data;
    return allData[key] ?? fallback;
  } catch {
    return fallback;
  }
}

async function save(key, val) {
  try {
    const { data, error } = await supabase
      .from("app_data")
      .select("data")
      .eq("id", 1)
      .single();

    const currentData = !error && data?.data ? data.data : {};

    const updatedData = {
      ...currentData,
      [key]: val
    };

    await supabase
      .from("app_data")
      .upsert({
        id: 1,
        data: updatedData
      });
  } catch {}
}
// ─── UTILS ────────────────────────────────────────────────────────────────────
function getSaison(m) {
  for (const [k,s] of Object.entries(SAISONS_META)) if (s.mois.includes(m)) return k;
  return "ete";
}
function passagesParMois(saisons) {
  const r = {};
  for (let m=1;m<=12;m++) r[m] = saisons?.[getSaison(m)] ?? 0;
  return r;
}
function totalAnnuel(saisons) {
  return Object.entries(SAISONS_META).reduce((a,[k,s])=> a + (saisons?.[k]??0)*s.mois.length, 0);
}
function daysUntil(d) {
  if (!d) return null;
  return Math.round((new Date(d) - new Date()) / 86400000);
}
function alerteClient(c, passages) {
  const j = daysUntil(c.dateFin);
  const eff = passages.filter(p=>p.clientId===c.id).length;
  const prev = totalAnnuel(c.saisons);
  if (j !== null && j >= 0 && j <= 30) return "rouge";
  if (j !== null && j > 30 && j <= 60) return "jaune";
  if (prev > 0 && eff / prev < 0.5 && (prev - eff) > 3) return "orange";
  return "ok";
}
function uid() { return Date.now() + Math.random().toString(36).slice(2); }
const TODAY = new Date().toISOString().split("T")[0];
const MOIS_NOW = new Date().getMonth() + 1;

// ─── DESIGN SYSTEM V2 — MODERNE ─────────────────────────────────────────────
const DS = {
  blue:"#0369a1", blueSoft:"#e0f2fe", blueGrad:"linear-gradient(135deg,#0284c7,#0ea5e9)",
  dark:"#0c1222", mid:"#64748b",
  light:"#f1f5f9", bg:"#f8fafc", border:"#e2e8f0", white:"#ffffff",
  green:"#059669", greenSoft:"#d1fae5", greenGrad:"linear-gradient(135deg,#059669,#34d399)",
  red:"#dc2626", redSoft:"#fee2e2",
  orange:"#ea580c", orangeSoft:"#ffedd5",
  yellow:"#d97706", yellowSoft:"#fef3c7",
  purple:"#7c3aed", purpleSoft:"#ede9fe", purpleGrad:"linear-gradient(135deg,#7c3aed,#a78bfa)",
  radius: 16, radiusSm: 12, radiusLg: 22,
  shadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 24px rgba(0,0,0,0.08)",
  shadowLg: "0 8px 40px rgba(0,0,0,0.12)",
  font: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};

const AC = {
  rouge:  { bg:DS.redSoft,    bd:"#fca5a5", tx:DS.red,    lbl:"URGENT"   },
  jaune:  { bg:DS.yellowSoft, bd:"#fcd34d", tx:DS.yellow, lbl:"Attention" },
  orange: { bg:DS.orangeSoft, bd:"#fdba74", tx:DS.orange, lbl:"Retard"   },
  ok:     { bg:DS.greenSoft,  bd:"#86efac", tx:DS.green,  lbl:"OK"       },
};

// ─── STYLES GLOBAUX INJECTÉS ─────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: ${DS.bg}; }
    input, select, textarea, button { font-family: inherit; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: ${DS.blue} !important; box-shadow: 0 0 0 3px ${DS.blue}22 !important; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideUp { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
    @keyframes scaleIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.6; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .fade-in { animation: fadeIn .4s ease-out both; }
    .slide-up { animation: slideUp .35s cubic-bezier(.22,1,.36,1) both; }
    .scale-in { animation: scaleIn .3s ease-out both; }
    .btn-hover { transition: all .2s ease; }
    .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .btn-hover:active { transform: translateY(0); }
    .card-hover { transition: all .2s ease; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
  `}</style>
);

// ─── COMPOSANTS DE BASE ───────────────────────────────────────────────────────
function Avatar({ nom, size=40 }) {
  const initials = (nom||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const colors = [
    "linear-gradient(135deg,#0284c7,#06b6d4)",
    "linear-gradient(135deg,#7c3aed,#a78bfa)",
    "linear-gradient(135deg,#059669,#34d399)",
    "linear-gradient(135deg,#ea580c,#f97316)",
    "linear-gradient(135deg,#0891b2,#22d3ee)",
    "linear-gradient(135deg,#be185d,#ec4899)"
  ];
  const bg = colors[nom?.charCodeAt(0)%colors.length] || colors[0];
  return (
    <div style={{width:size,height:size,borderRadius:size*0.3,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
      <span style={{color:"#fff",fontWeight:800,fontSize:size*0.35,letterSpacing:-0.5}}>{initials}</span>
    </div>
  );
}

function IcoBubble({ ico, color=DS.blue, bg, size=38 }) {
  const bgCol = bg || color+"15";
  return (
    <div style={{width:size,height:size,borderRadius:size*0.3,background:bgCol,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,backdropFilter:"blur(8px)"}}>
      {ico}
    </div>
  );
}

function Tag({ children, color=DS.blue, bg }) {
  const bgCol = bg || color+"14";
  return (
    <span style={{background:bgCol,color,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4,letterSpacing:-0.2}}>{children}</span>
  );
}

function Modal({ title, onClose, children, wide }) {
  const isMobile = useIsMobile();
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center"}} onClick={onClose}>
      <div className="slide-up" style={{background:DS.white,borderRadius:isMobile?"24px 24px 0 0":DS.radiusLg,width:"100%",maxWidth:wide?720:560,maxHeight:isMobile?"93vh":"88vh",overflowY:"auto",boxShadow:DS.shadowLg}} onClick={e=>e.stopPropagation()}>
        {isMobile && <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:36,height:4,borderRadius:2,background:DS.border}}/></div>}
        <div style={{padding:isMobile?"8px 20px 16px":"16px 28px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid "+DS.border}}>
          <span style={{color:DS.dark,fontWeight:800,fontSize:17,letterSpacing:-0.3}}>{title}</span>
          <button onClick={onClose} className="btn-hover" style={{width:34,height:34,borderRadius:17,background:DS.light,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.close(14,DS.mid)}</button>
        </div>
        <div style={{padding:isMobile?"18px 20px 32px":"24px 28px 28px"}}>{children}</div>
      </div>
    </div>
  );
}

function Section({ title, children, style={} }) {
  return (
    <div style={{marginBottom:22,...style}}>
      {title && <div style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>{title}</div>}
      {children}
    </div>
  );
}

function ProgressBar({ value, max, color=DS.blue, height=6 }) {
  const pct = max > 0 ? Math.min(100, value/max*100) : 0;
  return (
    <div style={{height,background:DS.light,borderRadius:99,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:pct>=100?DS.greenGrad:DS.blueGrad,borderRadius:99,transition:"width .5s cubic-bezier(.22,1,.36,1)"}}/>
    </div>
  );
}

function Card({ children, style={}, onClick, className="" }) {
  return (
    <div onClick={onClick} className={onClick?"card-hover":className} style={{background:DS.white,borderRadius:DS.radius,padding:"16px 18px",boxShadow:DS.shadow,border:"1px solid "+DS.border,cursor:onClick?"pointer":"default",transition:"all .2s",...style}}>{children}</div>
  );
}

function Input({ label, ...p }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label && <span style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.7}}>{label}</span>}
      <input style={{padding:"11px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:14,outline:"none",background:DS.white,boxSizing:"border-box",width:"100%",color:DS.dark,fontFamily:"inherit",transition:"all .2s",...(p.style||{})}} {...p}/>
    </div>
  );
}

function Select({ label, options, ...p }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label && <span style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.7}}>{label}</span>}
      <select style={{padding:"11px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:14,outline:"none",background:DS.white,color:DS.dark,fontFamily:"inherit",cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",paddingRight:36,transition:"all .2s"}} {...p}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── PHOTO PICKER ─────────────────────────────────────────────────────────────
function PhotoPicker({ label, value, onChange }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div>
      {label && (
        <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:8}}>
          {label}
        </span>
      )}
      {value ? (
        <div style={{position:"relative",borderRadius:DS.radius,overflow:"hidden",border:"2px solid "+DS.blue,background:"#000"}}>
          <img src={value} alt="photo" style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}}/>
          <button onClick={() => onChange("")} style={{position:"absolute",top:8,right:8,width:32,height:32,borderRadius:16,background:"rgba(0,0,0,0.6)",border:"2px solid rgba(255,255,255,0.4)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>{Ico.close(14,"#fff")}</button>
          <button onClick={() => cameraRef.current?.click()} style={{position:"absolute",bottom:8,right:8,padding:"6px 12px",borderRadius:10,background:"rgba(0,0,0,0.55)",border:"1px solid rgba(255,255,255,0.3)",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,color:"#fff",fontFamily:"inherit"}}>{Ico.camera(13,"#fff")} Reprendre</button>
        </div>
      ) : (
        <div style={{display:"flex",gap:10}}>
          <button onClick={() => cameraRef.current?.click()} className="btn-hover" style={{flex:1,padding:"16px 10px",borderRadius:DS.radius,border:"2px dashed "+DS.blue,background:DS.blueSoft,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,fontFamily:"inherit"}}>
            {Ico.camera(24,DS.blue)}
            <span style={{fontSize:13,fontWeight:700,color:DS.blue}}>Caméra</span>
            <span style={{fontSize:10,color:DS.mid}}>Photo directe</span>
          </button>
          <button onClick={() => galleryRef.current?.click()} className="btn-hover" style={{flex:1,padding:"16px 10px",borderRadius:DS.radius,border:"2px dashed "+DS.border,background:DS.light,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,fontFamily:"inherit"}}>
            {Ico.image(24,DS.mid)}
            <span style={{fontSize:13,fontWeight:700,color:DS.mid}}>Galerie</span>
            <span style={{fontSize:10,color:"#94a3b8"}}>Depuis l'album</span>
          </button>
        </div>
      )}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleFile}/>
      <input ref={galleryRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
    </div>
  );
}

// ─── BOUTON PRIMAIRE ─────────────────────────────────────────────────────────
function BtnPrimary({ children, onClick, bg=DS.dark, color="#fff", icon, style={} }) {
  return (
    <button onClick={onClick} className="btn-hover" style={{padding:"12px 20px",borderRadius:DS.radiusSm,background:bg,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,color,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 2px 8px rgba(0,0,0,0.15)",transition:"all .2s",...style}}>
      {icon}{children}
    </button>
  );
}

// ─── FORMULAIRE CLIENT ────────────────────────────────────────────────────────
function FormClient({ initial, clients, onSave, onClose }) {
  const isNew = !initial?.id;
  const isMobile = useIsMobile();
  const [f, setF] = useState(() => initial || {
    id: `C${String(clients.length+1).padStart(3,"0")}`,
    nom:"", tel:"", email:"", adresse:"", bassin:"Liner", volume:30,
    formule:"VAC", prix:0, dateDebut:TODAY,
    dateFin: `${new Date().getFullYear()+1}-03-31`,
    saisons: {...SAISONS_DEF},
  });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const setSaison = (k,v) => setF(p=>({...p,saisons:{...p.saisons,[k]:v}}));
  const total = totalAnnuel(f.saisons);

  return (
    <Modal title={isNew ? "Nouveau client" : `Modifier — ${f.nom}`} onClose={onClose} wide>
      <Section title="Informations">
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
          <div style={{gridColumn:"1/-1"}}><Input label="Nom complet *" value={f.nom} onChange={e=>set("nom",e.target.value)} placeholder="Dupont Marie"/></div>
          <Input label="Téléphone" value={f.tel} onChange={e=>set("tel",e.target.value)}/>
          <Input label="Email" type="email" value={f.email} onChange={e=>set("email",e.target.value)}/>
          <div style={{gridColumn:"1/-1"}}><Input label="Adresse" value={f.adresse} onChange={e=>set("adresse",e.target.value)}/></div>
          <Select label="Type bassin" value={f.bassin} onChange={e=>set("bassin",e.target.value)} options={["Liner","Béton","Coque polyester","Hors-sol","Autre"]}/>
          <Input label="Volume (m³)" type="number" value={f.volume} onChange={e=>set("volume",+e.target.value)}/>
        </div>
      </Section>
      <Section title="Contrat">
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr",gap:12}}>
          <Select label="Formule" value={f.formule} onChange={e=>set("formule",e.target.value)} options={["VAC","VAC+","Confort","Confort+"]}/>
          <Input label="Prix (€)" type="number" value={f.prix} onChange={e=>set("prix",+e.target.value)}/>
          {!isMobile&&<div/>}
          <Input label="Date début" type="date" value={f.dateDebut} onChange={e=>set("dateDebut",e.target.value)}/>
          <Input label="Date fin" type="date" value={f.dateFin} onChange={e=>set("dateFin",e.target.value)}/>
        </div>
      </Section>
      <Section title="Passages par saison">
        <div style={{background:DS.light,borderRadius:DS.radius,padding:18,border:"1px solid "+DS.border}}>
          {Object.entries(SAISONS_META).map(([key,s])=>{
            const val = f.saisons?.[key]??0;
            return (
              <div key={key} style={{marginBottom:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div>
                    <span style={{fontWeight:800,color:s.color,fontSize:13,display:"flex",alignItems:"center",gap:5}}>{Ico[s.icon]&&Ico[s.icon](15,s.color)} {s.label}</span>
                    <span style={{fontSize:11,color:DS.mid}}>{s.mois.map(m=>MOIS[m]).join(" · ")}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <Tag color={s.color}>{val}×/mois</Tag>
                    <Tag color={DS.mid}>{val*s.mois.length} saison</Tag>
                  </div>
                </div>
                <input type="range" min={0} max={8} value={val} onChange={e=>setSaison(key,+e.target.value)} style={{width:"100%",accentColor:s.color,cursor:"pointer"}}/>
              </div>
            );
          })}
          <div style={{background:DS.blueGrad,borderRadius:DS.radiusSm,padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
            <span style={{color:"rgba(255,255,255,0.85)",fontSize:12,fontWeight:700}}>Total annuel estimé</span>
            <span style={{color:"#fff",fontSize:22,fontWeight:900}}>{total} passages</span>
          </div>
        </div>
      </Section>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} className="btn-hover" style={{flex:1,padding:"12px",borderRadius:DS.radiusSm,background:DS.light,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{Ico.close(13,DS.mid)} Annuler</button>
        <BtnPrimary onClick={()=>{ if(!f.nom.trim()) return alert("Nom requis"); onSave(f); }} icon={Ico.save(15,"#fff")} style={{flex:2}}>Enregistrer</BtnPrimary>
      </div>
    </Modal>
  );
}

// ─── FORMULAIRE LIVRAISON ─────────────────────────────────────────────────────
function FormLivraison({ initial, clientId, clients=[], onSave, onClose }) {
  const isEdit = !!initial?.id;
  const [f, setF] = useState(()=>initial || { id:uid(), clientId:clientId||"", date:TODAY, produits:[], description:"", montant:"", statut:"aFacturer" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const PRODUITS_LIVRAISON = ["Chlore lent Galet","PH minus","Flocculant","Anti-calcaire","Anti-Algues","Anti-Phosphate","Éponge Magique","Filtre à cartouche","Tac+","Chlore granule","Hypochlorite","Anti-Algues moutarde","Sac de sel"];
  const toggleProduit = (p) => { const arr = f.produits.includes(p) ? f.produits.filter(x=>x!==p) : [...f.produits,p]; set("produits",arr); };

  return (
    <Modal title={isEdit?"Modifier la livraison":"Nouvelle livraison"} onClose={onClose}>
      {!isEdit && (
        <Section title="Client">
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {clients.map(c=>{
              const sel = f.clientId===c.id;
              return (
                <button key={c.id} onClick={()=>set("clientId",c.id)} className="card-hover" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:DS.radiusSm,border:"1.5px solid "+(sel?DS.blue:DS.border),background:sel?DS.blueSoft:DS.white,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
                  <Avatar nom={c.nom} size={34}/>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{c.nom}</div><div style={{fontSize:11,color:DS.mid}}>{c.formule} · {c.adresse}</div></div>
                  {sel && <div style={{width:20,height:20,borderRadius:10,background:DS.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.check(11,"#fff")}</div>}
                </button>
              );
            })}
          </div>
        </Section>
      )}
      <Section title="Date & montant">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Input label="Date" type="date" value={f.date} onChange={e=>set("date",e.target.value)}/>
          <Input label="Montant (€)" type="number" value={f.montant} onChange={e=>set("montant",e.target.value)} placeholder="0.00"/>
        </div>
      </Section>
      <Section title="Produits livrés">
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {PRODUITS_LIVRAISON.map(p=>(
            <label key={p} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,cursor:"pointer",background:f.produits.includes(p)?DS.blueSoft:DS.light,border:"1.5px solid "+(f.produits.includes(p)?DS.blue:DS.border),transition:"all .15s"}}>
              <input type="checkbox" checked={f.produits.includes(p)} onChange={()=>toggleProduit(p)} style={{accentColor:DS.blue,width:15,height:15}}/>
              <span style={{fontSize:13,fontWeight:f.produits.includes(p)?600:400,color:f.produits.includes(p)?DS.dark:DS.mid}}>{p}</span>
            </label>
          ))}
        </div>
      </Section>
      <Section title="Description / notes">
        <textarea value={f.description} onChange={e=>set("description",e.target.value)} placeholder="Quantités, marques, détails..." style={{width:"100%",padding:"10px 12px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:64,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark,outline:"none",transition:"all .2s"}}/>
      </Section>
      <Section title="Statut">
        <div style={{display:"flex",gap:8}}>
          {Object.entries(STATUT_LIV).map(([k,s])=>(
            <button key={k} onClick={()=>set("statut",k)} className="btn-hover" style={{flex:1,padding:"10px 6px",borderRadius:10,border:"1.5px solid "+(f.statut===k?s.color:DS.border),background:f.statut===k?s.bg:DS.white,cursor:"pointer",fontSize:12,fontWeight:700,color:f.statut===k?s.color:DS.mid,fontFamily:"inherit"}}>{s.label}</button>
          ))}
        </div>
      </Section>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} className="btn-hover" style={{flex:1,padding:"12px",borderRadius:DS.radiusSm,background:DS.light,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{Ico.close(13,DS.mid)} Annuler</button>
        <BtnPrimary onClick={()=>{ if(!f.clientId) return alert("Veuillez sélectionner un client"); if(!f.date) return alert("Date requise"); onSave({...f,id:isEdit?f.id:uid()}); }} icon={Ico.save(15,"#fff")} style={{flex:2}}>Enregistrer</BtnPrimary>
      </div>
    </Modal>
  );
}

// ─── FICHE CLIENT ─────────────────────────────────────────────────────────────
function FicheClient({ client, passages, livraisons=[], onSaveLivraison, onDeleteLivraison, onUpdateStatutLivraison, onEdit, onDelete, onClose, onAddPassage, onEditPassage }) {
  const [tab, setTab] = useState("infos");
  const [showFormLiv, setShowFormLiv] = useState(false);
  const [editLiv, setEditLiv] = useState(null);
  const isMobile = useIsMobile();
  const al = alerteClient(client, passages);
  const col = AC[al];
  const passC = passages.filter(p=>p.clientId===client.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const total = totalAnnuel(client.saisons);
  const eff = passC.length;
  const jours = daysUntil(client.dateFin);
  const pm = passagesParMois(client.saisons);

  return (
    <Modal title={client.nom} onClose={onClose} wide>
      <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:18}}>
        <Avatar nom={client.nom} size={56}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:17,color:DS.dark,letterSpacing:-0.3}}>{client.nom}</div>
          <div style={{fontSize:12,color:DS.mid,marginTop:2}}>{client.formule} · {client.bassin}</div>
          <Tag color={col.tx} style={{marginTop:6,display:"inline-flex"}}>
            {jours!==null&&jours>=0 ? `Expire dans ${jours}j` : jours!==null ? `Expiré depuis ${Math.abs(jours)}j` : col.lbl}
          </Tag>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
        {[{l:"Prévus",v:total,c:DS.blue,g:DS.blueGrad},{l:"Faits",v:eff,c:DS.green,g:DS.greenGrad},{l:"Reste",v:Math.max(0,total-eff),c:DS.orange,g:"linear-gradient(135deg,#ea580c,#f97316)"},{l:"Prix",v:`${client.prix?.toLocaleString("fr")}€`,c:"#7c3aed",g:DS.purpleGrad}].map(k=>(
          <div key={k.l} style={{background:DS.light,borderRadius:DS.radiusSm,padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:900,color:k.c,lineHeight:1}}>{k.v}</div>
            <div style={{fontSize:10,color:DS.mid,marginTop:3,fontWeight:600}}>{k.l}</div>
          </div>
        ))}
      </div>
      <ProgressBar value={eff} max={total}/>
      <div style={{fontSize:11,color:DS.mid,textAlign:"right",marginTop:4,marginBottom:16,fontWeight:600}}>{total>0?Math.round(eff/total*100):0}% avancement</div>

      <div style={{display:"flex",gap:2,marginBottom:16,background:DS.light,borderRadius:DS.radiusSm,padding:3}}>
        {[["infos","Infos"],["saisons","Saisons"],["passages","Passages"],["livraisons","Livraisons"]].map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"inherit",background:tab===id?DS.white:"transparent",color:tab===id?DS.dark:DS.mid,boxShadow:tab===id?DS.shadow:"none",transition:"all .2s"}}>{l}</button>
        ))}
      </div>

      {tab==="infos" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}} className="fade-in">
          {[
            {ico:Ico.phone(13,DS.blue),l:"Téléphone",v:client.tel,href:"tel:"+client.tel},
            {ico:Ico.mail(13,DS.blue),l:"Email",v:client.email,href:"mailto:"+client.email},
            {ico:Ico.pin(13,DS.blue),l:"Adresse",v:client.adresse,href:null},
            {ico:Ico.pool(13,DS.blue),l:"Bassin",v:`${client.bassin} — ${client.volume} m³`,href:null},
            {ico:Ico.clipboard(13,DS.blue),l:"Formule",v:client.formule,href:null},
            {ico:Ico.calendar(13,DS.blue),l:"Contrat",v:`Du ${new Date(client.dateDebut).toLocaleDateString("fr")} au ${new Date(client.dateFin).toLocaleDateString("fr")}`,href:null},
          ].filter(r=>r.v).map(r=>(
            <div key={r.l} style={{display:"flex",gap:12,padding:"11px 14px",background:DS.light,borderRadius:DS.radiusSm,alignItems:"center"}}>
              <IcoBubble ico={r.ico} color={DS.blue} size={32}/>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:DS.mid,fontWeight:600}}>{r.l}</div>
                {r.href ? <a href={r.href} style={{fontSize:13,color:DS.blue,fontWeight:700,textDecoration:"none"}}>{r.v}</a> : <span style={{fontSize:13,color:DS.dark,fontWeight:700}}>{r.v}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="saisons" && (
        <div className="fade-in">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {Object.entries(SAISONS_META).map(([key,s])=>{
              const nb = client.saisons?.[key]??0;
              return (
                <div key={key} style={{background:s.bg,borderRadius:DS.radius,padding:"14px 16px",border:`1px solid ${s.color}33`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:800,color:s.color,fontSize:13,display:"flex",alignItems:"center",gap:5}}>{Ico[s.icon]&&Ico[s.icon](15,s.color)} {s.label}</div>
                      <div style={{fontSize:10,color:DS.mid,marginTop:2}}>{s.mois.map(m=>MOIS[m]).join(" · ")}</div>
                    </div>
                    <div style={{fontSize:28,fontWeight:900,color:s.color}}>{nb}</div>
                  </div>
                  <div style={{fontSize:10,color:DS.mid,marginTop:6,fontWeight:600}}>{nb}/mois · {nb*s.mois.length} total</div>
                </div>
              );
            })}
          </div>
          <div style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Calendrier 2026</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[...Array(12)].map((_,i)=>{
              const m=i+1;
              const prev=pm[m]||0;
              const effM=passages.filter(p=>p.clientId===client.id&&new Date(p.date).getMonth()+1===m&&new Date(p.date).getFullYear()===2026).length;
              const rest=Math.max(0,prev-effM);
              const sc=SAISONS_META[getSaison(m)];
              const isCur=m===MOIS_NOW;
              return (
                <div key={m} style={{borderRadius:DS.radiusSm,overflow:"hidden",border:`2px solid ${isCur?sc.color:DS.border}`,background:DS.white}}>
                  <div style={{background:isCur?sc.color:DS.light,padding:"5px 8px",textAlign:"center"}}>
                    <div style={{fontWeight:700,fontSize:11,color:isCur?"#fff":DS.mid}}>{MOIS[m]}</div>
                  </div>
                  <div style={{padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontSize:20,fontWeight:900,color:prev>0?DS.blue:DS.border,lineHeight:1}}>{prev}</div>
                    {prev>0&&<div style={{fontSize:10,fontWeight:700,color:rest>0?DS.orange:DS.green,marginTop:3}}>{rest>0?`${rest} rest.`:"✓ ok"}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab==="passages" && (
        <div className="fade-in">
          <button onClick={onAddPassage} className="btn-hover" style={{width:"100%",marginBottom:12,padding:"11px",borderRadius:DS.radiusSm,background:DS.blueSoft,color:DS.blue,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"inherit"}}>
            {Ico.plus(13,DS.blue)} Saisir un passage
          </button>
          {passC.length===0
            ? <div style={{textAlign:"center",color:DS.mid,padding:30,fontSize:13}}>Aucun passage enregistré</div>
            : passC.map(p=>{
              const phOk=p.ph>=7.0&&p.ph<=7.6;
              const clOk=p.chlore>=0.5&&p.chlore<=3.0;
              return (
                <Card key={p.id} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{new Date(p.date).toLocaleDateString("fr",{day:"2-digit",month:"long"})}</div>
                      <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>
                        <Tag color={DS.blue}>{p.type}</Tag>
                        {p.ph&&<Tag color={phOk?DS.green:DS.red}>pH {p.ph}</Tag>}
                        {p.chlore&&<Tag color={clOk?DS.green:DS.red}>Cl {p.chlore}</Tag>}
                        {p.ok ? <Tag color={DS.green}>{Ico.check(10,DS.green)} Validé</Tag> : <Tag color={DS.red}>{Ico.x(10,DS.red)} En attente</Tag>}
                      </div>
                    </div>
                    {p.tech&&<span style={{fontSize:11,color:DS.mid,display:"flex",alignItems:"center",gap:3}}>{Ico.user(10,DS.mid)} {p.tech}</span>}
                  </div>
                  {(p.photoArrivee||p.photoDepart) && (
                    <div style={{display:"flex",gap:6,marginBottom:8}}>
                      {p.photoArrivee && (<div style={{flex:1,position:"relative"}}><img src={p.photoArrivee} alt="Arrivée" style={{width:"100%",height:60,objectFit:"cover",borderRadius:8,border:"1px solid "+DS.border}}/><span style={{position:"absolute",bottom:3,left:4,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.5)",borderRadius:4,padding:"1px 5px"}}>Arrivée</span></div>)}
                      {p.photoDepart && (<div style={{flex:1,position:"relative"}}><img src={p.photoDepart} alt="Départ" style={{width:"100%",height:60,objectFit:"cover",borderRadius:8,border:"1px solid "+DS.border}}/><span style={{position:"absolute",bottom:3,left:4,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.5)",borderRadius:4,padding:"1px 5px"}}>Départ</span></div>)}
                    </div>
                  )}
                  {p.actions&&<div style={{fontSize:12,color:DS.mid,marginBottom:4}}>{p.actions}</div>}
                  {p.obs&&<div style={{fontSize:11,color:DS.orange,display:"flex",alignItems:"center",gap:4,marginBottom:8}}>{Ico.note(11,DS.orange)} {p.obs}</div>}
                  <div style={{display:"flex",gap:6,paddingTop:8,borderTop:"1px solid "+DS.border}}>
                    <button onClick={()=>onEditPassage&&onEditPassage(p)} className="btn-hover" style={{flex:1,padding:"6px",borderRadius:8,background:DS.light,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontSize:11,color:DS.mid,fontFamily:"inherit",fontWeight:700}}>{Ico.edit(12,DS.mid)} Modifier</button>
                    <button onClick={(e)=>{e.stopPropagation();ouvrirRapport(p,client);}} className="btn-hover" style={{flex:1,padding:"6px",borderRadius:8,background:DS.blueSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontSize:11,color:DS.blue,fontFamily:"inherit",fontWeight:700}}>{Ico.pdf(12,DS.blue)} Rapport</button>
                    {client.email&&<button onClick={(e)=>{e.stopPropagation();envoyerEmail(p,client);}} className="btn-hover" style={{flex:1,padding:"6px",borderRadius:8,background:DS.greenSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontSize:11,color:DS.green,fontFamily:"inherit",fontWeight:700}}>{Ico.send(12,DS.green)} Email</button>}
                  </div>
                </Card>
              );
            })
          }
        </div>
      )}

      {tab==="livraisons" && (
        <div className="fade-in">
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
            {Object.entries(STATUT_LIV).map(([k,s])=>{
              const n = livraisons.filter(l=>l.statut===k).length;
              return (
                <div key={k} style={{background:s.bg,borderRadius:DS.radiusSm,padding:"10px 8px",textAlign:"center",border:"1px solid "+s.color+"33"}}>
                  <div style={{fontSize:20,fontWeight:900,color:s.color}}>{n}</div>
                  <div style={{fontSize:10,color:s.color,fontWeight:700,marginTop:2}}>{s.label}</div>
                </div>
              );
            })}
          </div>
          <button onClick={()=>{setEditLiv(null);setShowFormLiv(true);}} className="btn-hover" style={{width:"100%",marginBottom:12,padding:"11px",borderRadius:DS.radiusSm,background:DS.blueSoft,color:DS.blue,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"inherit"}}>
            {Ico.plus(13,DS.blue)} Ajouter une livraison
          </button>
          {livraisons.length===0
            ? <div style={{textAlign:"center",color:DS.mid,padding:24,fontSize:13}}>Aucune livraison enregistrée</div>
            : livraisons.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(l=>{
              const s = STATUT_LIV[l.statut]||STATUT_LIV.aFacturer;
              return (
                <Card key={l.id} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{new Date(l.date).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"})}</div>
                      {l.produits&&l.produits.length>0&&<div style={{fontSize:12,color:DS.mid,marginTop:3}}>{l.produits.join(", ")}</div>}
                      {l.description&&<div style={{fontSize:12,color:DS.mid,marginTop:2}}>{l.description}</div>}
                      {l.montant&&<div style={{fontSize:14,fontWeight:800,color:DS.dark,marginTop:4}}>{Number(l.montant).toLocaleString("fr")} €</div>}
                    </div>
                    <Tag color={s.color}>{s.label}</Tag>
                  </div>
                  <div style={{display:"flex",gap:6,marginBottom:8}}>
                    {Object.entries(STATUT_LIV).map(([k,sv])=>(
                      <button key={k} onClick={()=>onUpdateStatutLivraison(l.id,k)} style={{flex:1,padding:"6px 4px",borderRadius:8,border:"1.5px solid "+(l.statut===k?sv.color:DS.border),background:l.statut===k?sv.bg:DS.white,cursor:"pointer",fontSize:10,fontWeight:700,color:l.statut===k?sv.color:DS.mid,fontFamily:"inherit",transition:"all .15s"}}>{sv.label}</button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:6,paddingTop:8,borderTop:"1px solid "+DS.border}}>
                    <button onClick={()=>{setEditLiv(l);setShowFormLiv(true);}} className="btn-hover" style={{flex:1,padding:"6px",borderRadius:8,background:DS.light,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontSize:11,color:DS.mid,fontFamily:"inherit",fontWeight:700}}>{Ico.edit(12,DS.mid)} Modifier</button>
                    <button onClick={()=>{if(confirm("Supprimer cette livraison ?"))onDeleteLivraison(l.id);}} style={{width:32,borderRadius:8,background:DS.redSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.trash(12,DS.red)}</button>
                  </div>
                </Card>
              );
            })
          }
        </div>
      )}

      {showFormLiv && (
        <FormLivraison initial={editLiv} clientId={client.id} onSave={l=>{onSaveLivraison(l);setShowFormLiv(false);setEditLiv(null);}} onClose={()=>{setShowFormLiv(false);setEditLiv(null);}}/>
      )}

      <div style={{display:"flex",gap:8,marginTop:20,paddingTop:16,borderTop:"1px solid "+DS.border}}>
        <BtnPrimary onClick={onEdit} bg={DS.light} color={DS.dark} icon={Ico.edit(14,DS.dark)} style={{flex:1}}>Modifier</BtnPrimary>
        <button onClick={onDelete} className="btn-hover" style={{width:44,borderRadius:DS.radiusSm,background:DS.redSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.trash(15,DS.red)}</button>
      </div>
    </Modal>
  );
}

// ─── COMPOSANTS FORMULAIRE PASSAGE ───────────────────────────────────────────
const PRODUITS_LIVRAISON = ["Chlore lent Galet","PH minus","Flocculant","Anti-calcaire","Anti-Algues","Anti-Phosphate","Éponge Magique","Filtre à cartouche","Tac+","Chlore granule","Hypochlorite","Anti-Algues moutarde","Sac de sel"];
const ETAT_LOCAL_OPTIONS = ["Nettoyage du sol","Trace d'eau au sol","Trace d'eau au mur","Fuite plomberie","Fuite moteur","Sur filtre ?"];

function MultiCheck({ label, options, values, onChange }) {
  const toggle = (v) => { const arr = values.includes(v) ? values.filter(x=>x!==v) : [...values,v]; onChange(arr); };
  return (
    <div>
      {label && <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>{label}</span>}
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {options.map(o=>(
          <label key={o} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,cursor:"pointer",background:values.includes(o)?DS.blueSoft:DS.light,border:`1px solid ${values.includes(o)?DS.blue:DS.border}`,transition:"all .15s"}}>
            <input type="checkbox" checked={values.includes(o)} onChange={()=>toggle(o)} style={{accentColor:DS.blue,width:15,height:15}}/>
            <span style={{fontSize:13,fontWeight:values.includes(o)?700:400,color:values.includes(o)?DS.dark:DS.mid}}>{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function RadioGroup({ label, options, value, onChange }) {
  return (
    <div>
      {label && <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>{label}</span>}
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {options.map(o=>(
          <label key={o} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,cursor:"pointer",background:value===o?DS.blueSoft:DS.light,border:`1px solid ${value===o?DS.blue:DS.border}`,transition:"all .15s"}}>
            <input type="radio" checked={value===o} onChange={()=>onChange(o)} style={{accentColor:DS.blue,width:15,height:15}}/>
            <span style={{fontSize:13,fontWeight:value===o?700:400,color:value===o?DS.dark:DS.mid}}>{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function OuiNon({ label, value, onChange }) {
  return (
    <div>
      {label && <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>{label}</span>}
      <div style={{display:"flex",gap:8}}>
        {["Oui","Non"].map(v=>(
          <button key={v} onClick={()=>onChange(v==="Oui")} className="btn-hover" style={{flex:1,padding:"9px",borderRadius:9,border:`1.5px solid ${value===(v==="Oui")?DS.blue:DS.border}`,background:value===(v==="Oui")?DS.blue:DS.white,color:value===(v==="Oui")?"#fff":DS.mid,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .15s"}}>{v}</button>
        ))}
      </div>
    </div>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:4}}>
      {[1,2,3,4,5].map(n=>(
        <button key={n} onClick={()=>onChange(n)} style={{background:"none",border:"none",cursor:"pointer",fontSize:28,color:n<=value?"#f59e0b":"#e2e8f0",padding:"0 2px",lineHeight:1,transition:"all .15s",transform:n<=value?"scale(1.1)":"scale(1)"}}>★</button>
      ))}
      {value>0 && <span style={{fontSize:12,color:"#94a3b8",marginLeft:4,fontWeight:600}}>{value}/5</span>}
    </div>
  );
}

function NumField({ label, value, onChange, unit, ideal, okFn }) {
  const ok = okFn ? okFn(value) : true;
  return (
    <div>
      <div style={{fontSize:11,fontWeight:700,color:DS.mid,marginBottom:4}}>
        {label}
        {unit && <span style={{color:"#94a3b8",fontWeight:400}}> ({unit})</span>}
        {ideal && <span style={{color:"#94a3b8",fontWeight:400,fontSize:10}}> — idéal {ideal}</span>}
      </div>
      <input type="number" step="0.1" value={value||""} onChange={e=>onChange(e.target.value===""?"":+e.target.value)}
        style={{padding:"9px 12px",borderRadius:9,border:`2px solid ${value!==""&&value!==null&&value!==undefined?(ok?"#86efac":"#fca5a5"):"#e2e8f0"}`,fontSize:14,fontWeight:800,width:"100%",boxSizing:"border-box",color:value!==""&&value!==null&&value!==undefined?(ok?"#16a34a":"#dc2626"):"#1e293b",transition:"all .2s"}}/>
    </div>
  );
}

// ─── SIGNATURE PAD ────────────────────────────────────────────────────────────
function SignaturePad({ value, onChange, label }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasSign, setHasSign] = useState(!!value);

  useEffect(()=>{
    if(value && canvasRef.current) {
      const img = new Image();
      img.onload = ()=>{ const ctx=canvasRef.current?.getContext("2d"); ctx&&ctx.drawImage(img,0,0); };
      img.src = value;
    }
  },[]);

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const src = e.touches?.[0] || e;
    return { x:(src.clientX-r.left)*(canvas.width/r.width), y:(src.clientY-r.top)*(canvas.height/r.height) };
  };
  const start = (e) => { e.preventDefault(); drawing.current=true; const canvas=canvasRef.current; const ctx=canvas.getContext("2d"); const {x,y}=getPos(e,canvas); ctx.beginPath(); ctx.moveTo(x,y); ctx.strokeStyle="#1b3a5c"; ctx.lineWidth=2.5; ctx.lineCap="round"; ctx.lineJoin="round"; };
  const move = (e) => { e.preventDefault(); if(!drawing.current)return; const canvas=canvasRef.current; const ctx=canvas.getContext("2d"); const {x,y}=getPos(e,canvas); ctx.lineTo(x,y); ctx.stroke(); };
  const end = (e) => { e.preventDefault(); drawing.current=false; const data=canvasRef.current.toDataURL("image/png"); setHasSign(true); onChange(data); };
  const clear = () => { const canvas=canvasRef.current; canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height); setHasSign(false); onChange(""); };

  return (
    <div>
      {label && <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>{label}</span>}
      <div style={{border:"1.5px solid "+DS.border,borderRadius:DS.radius,overflow:"hidden",background:DS.light,position:"relative"}}>
        <canvas ref={canvasRef} width={500} height={140} style={{display:"block",width:"100%",height:140,touchAction:"none",cursor:"crosshair"}}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
        {!hasSign && <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
          <span style={{color:DS.border,fontSize:13,display:"flex",alignItems:"center",gap:6}}>{Ico.sign(14,"#cbd5e1")} Signez ici</span>
        </div>}
      </div>
      {hasSign && <button onClick={clear} style={{marginTop:4,background:"none",border:"none",color:"#94a3b8",fontSize:12,cursor:"pointer",fontWeight:600}}>✕ Effacer</button>}
    </div>
  );
}

// ─── RAPPORT HTML PREMIUM ─────────────────────────────────────────────────────
function genererHTMLRapport(passage, client) {
  const d = new Date(passage.date).toLocaleDateString("fr", {day:"2-digit",month:"long",year:"numeric"});
  const val = (v, u="") => (v !== "" && v !== null && v !== undefined) ? `<strong>${v}</strong>${u?" "+u:""}` : `<span class="empty">—</span>`;
  const liste = (arr) => arr?.length ? arr.join(", ") : "—";
  const ouinon = (v) => v===true?`<span class="badge ok">OUI</span>`:v===false?`<span class="badge no">NON</span>`:"—";
  const etoiles = (n) => n>0 ? `<span class="stars">${"★".repeat(n)}${"☆".repeat(5-n)}</span> <span class="star-num">${n}/5</span>` : "—";

  const sigTech = passage.signatureTech ? `<img src="${passage.signatureTech}" class="sig-img"/>` : `<div class="sig-empty">Non signée</div>`;
  const sigClient = passage.signatureClient ? `<img src="${passage.signatureClient}" class="sig-img"/>` : `<div class="sig-empty">Non signée</div>`;

  const hasPhotos = passage.photoArrivee || passage.photoDepart;
  const sectionPhotos = hasPhotos ? `
<div class="section">
  <div class="section-title"><span class="sec-icon">📸</span> Photos d'intervention</div>
  <div class="section-body" style="display:grid;grid-template-columns:${passage.photoArrivee && passage.photoDepart ? "1fr 1fr" : "1fr"};gap:16px">
    ${passage.photoArrivee ? `<div><div class="photo-label">À l'arrivée</div><img src="${passage.photoArrivee}" class="photo"/></div>` : ""}
    ${passage.photoDepart ? `<div><div class="photo-label">Au départ</div><img src="${passage.photoDepart}" class="photo"/></div>` : ""}
  </div>
</div>` : "";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<title>Rapport BRIBLUE — ${client?.nom||""} — ${d}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',system-ui,sans-serif;font-size:13px;color:#1e293b;background:#f8fafc;padding:0}
  .page{max-width:780px;margin:0 auto;padding:24px;background:#fff}
  .header{background:linear-gradient(135deg,#0c1222 0%,#1a365d 50%,#0369a1 100%);color:#fff;padding:28px 32px;border-radius:16px;margin-bottom:20px;position:relative;overflow:hidden}
  .header::after{content:'';position:absolute;top:-50%;right:-20%;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,0.05)}
  .header h1{font-size:22px;font-weight:900;margin-bottom:2px;letter-spacing:-0.5px;position:relative;z-index:1}
  .header-sub{font-size:12px;opacity:.7;position:relative;z-index:1;margin-top:4px}
  .header-meta{display:flex;gap:20px;margin-top:14px;position:relative;z-index:1}
  .header-meta .meta-item{background:rgba(255,255,255,0.12);border-radius:10px;padding:8px 14px;font-size:11px;font-weight:600;backdrop-filter:blur(4px)}
  .header-meta .meta-item strong{display:block;font-size:14px;font-weight:800;margin-top:2px}
  .section{margin-bottom:16px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;break-inside:avoid}
  .section-title{background:linear-gradient(135deg,#f0f9ff,#e0f2fe);color:#0369a1;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:.8px;padding:10px 18px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:8px}
  .sec-icon{font-size:14px}
  .section-body{padding:14px 18px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
  .field{padding:8px 12px;background:#f8fafc;border-radius:8px;border:1px solid #f1f5f9}
  .field-label{font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
  .field-value{font-size:13px;color:#1e293b;font-weight:500}
  .field-value strong{font-weight:800;color:#0c1222}
  .empty{color:#cbd5e1;font-weight:400}
  .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700}
  .badge.ok{background:#d1fae5;color:#059669}
  .badge.no{background:#fee2e2;color:#dc2626}
  .stars{color:#f59e0b;font-size:16px;letter-spacing:1px}
  .star-num{font-size:11px;color:#94a3b8;font-weight:600}
  .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  .sig-img{max-height:70px;border:1px solid #e2e8f0;border-radius:10px;display:block}
  .sig-empty{height:70px;border:2px dashed #e2e8f0;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:12px;font-weight:500}
  .sig-label{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
  .photo{width:100%;max-height:240px;object-fit:cover;border-radius:10px;border:1px solid #e2e8f0;display:block}
  .photo-label{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
  .footer{margin-top:24px;font-size:11px;color:#94a3b8;text-align:center;padding:16px 0;border-top:2px solid #f1f5f9}
  .footer strong{color:#64748b}
  .no-print{margin-bottom:16px;display:flex;gap:8px}
  .btn-print{background:linear-gradient(135deg,#0c1222,#1a365d);color:#fff;border:none;padding:12px 24px;border-radius:12px;font-weight:700;cursor:pointer;font-size:14px;font-family:inherit;box-shadow:0 4px 12px rgba(12,18,34,0.3)}
  .btn-close{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;padding:12px 24px;border-radius:12px;font-weight:700;cursor:pointer;font-size:14px;font-family:inherit}
  @media print{.page{padding:10px;box-shadow:none}.no-print{display:none!important}@page{margin:8mm}.header{border-radius:10px}}
</style></head><body>
<div class="page">

<div class="header">
  <h1>BRIBLUE</h1>
  <div class="header-sub">Rapport d'entretien piscine</div>
  <div class="header-meta">
    <div class="meta-item">Client<strong>${client?.nom||"—"}</strong></div>
    <div class="meta-item">Date<strong>${d}</strong></div>
    <div class="meta-item">Formule<strong>${client?.formule||"—"}</strong></div>
    <div class="meta-item">Technicien<strong>${passage.tech||"Dorian"}</strong></div>
  </div>
</div>

<div class="no-print">
  <button onclick="window.print()" class="btn-print">Enregistrer en PDF</button>
  <button onclick="window.close()" class="btn-close">Fermer</button>
</div>

<div class="section">
  <div class="section-title"><span class="sec-icon">🏊</span> Bassin & Intervention</div>
  <div class="section-body grid">
    <div class="field"><div class="field-label">Type</div><div class="field-value">${passage.type||"—"}</div></div>
    <div class="field"><div class="field-label">Statut</div><div class="field-value">${passage.ok?`<span class="badge ok">✓ Validé</span>`:`<span class="badge no">En attente</span>`}</div></div>
    <div class="field"><div class="field-label">Type bassin</div><div class="field-value">${client?.bassin||"—"}</div></div>
    <div class="field"><div class="field-label">Volume</div><div class="field-value">${client?.volume?client.volume+" m³":"—"}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title"><span class="sec-icon">💧</span> Analyses eau</div>
  <div class="section-body grid">
    <div class="field"><div class="field-label">Chlore libre</div><div class="field-value">${val(passage.chloreLibre,"ppm")}</div></div>
    <div class="field"><div class="field-label">pH bandelette</div><div class="field-value">${val(passage.ph)}</div></div>
    <div class="field"><div class="field-label">Alcalinité</div><div class="field-value">${val(passage.alcalinite,"ppm")}</div></div>
    <div class="field"><div class="field-label">Stabilisant</div><div class="field-value">${val(passage.stabilisant,"ppm")}</div></div>
    <div class="field"><div class="field-label">Taux chlore</div><div class="field-value">${val(passage.tChlore)}</div></div>
    <div class="field"><div class="field-label">Taux pH</div><div class="field-value">${val(passage.tPH)}</div></div>
    <div class="field"><div class="field-label">Taux sel</div><div class="field-value">${val(passage.tSel)}</div></div>
    <div class="field"><div class="field-label">Taux phosphate</div><div class="field-value">${val(passage.tPhosphate)}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title"><span class="sec-icon">🔍</span> État du bassin</div>
  <div class="section-body grid">
    <div class="field"><div class="field-label">Qualité eau</div><div class="field-value">${passage.qualiteEau||"—"}</div></div>
    <div class="field"><div class="field-label">Fond</div><div class="field-value">${liste(passage.etatFond)}</div></div>
    <div class="field"><div class="field-label">Parois</div><div class="field-value">${liste(passage.etatParois)}</div></div>
    <div class="field"><div class="field-label">Local technique</div><div class="field-value">${liste(passage.etatLocal)}</div></div>
    <div class="field"><div class="field-label">Bac tampon</div><div class="field-value">${liste(passage.etatBacTampon)}</div></div>
    <div class="field"><div class="field-label">Volet / bac</div><div class="field-value">${liste(passage.etatVoletBac)}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title"><span class="sec-icon">⚗️</span> Correctifs apportés</div>
  <div class="section-body grid">
    <div class="field"><div class="field-label">Chlore</div><div class="field-value">${val(passage.corrChlore)}</div></div>
    <div class="field"><div class="field-label">pH</div><div class="field-value">${val(passage.corrPH)}</div></div>
    <div class="field"><div class="field-label">Sel</div><div class="field-value">${val(passage.corrSel)}</div></div>
    <div class="field"><div class="field-label">Algicide</div><div class="field-value">${val(passage.corrAlgicide)}</div></div>
    <div class="field"><div class="field-label">Peroxyde</div><div class="field-value">${val(passage.corrPeroxyde)}</div></div>
    <div class="field"><div class="field-label">Chlore choc</div><div class="field-value">${val(passage.corrChloreChoc)}</div></div>
    <div class="field"><div class="field-label">Phosphate</div><div class="field-value">${val(passage.corrPhosphate)}</div></div>
    <div class="field"><div class="field-label">Autre</div><div class="field-value">${val(passage.corrAutre)}</div></div>
  </div>
</div>

${(passage.livraisonProduits&&(passage.produitsLivres||[]).length>0)?`
<div class="section">
  <div class="section-title"><span class="sec-icon">📦</span> Produits livrés</div>
  <div class="section-body">
    <div class="field" style="grid-column:1/-1"><div class="field-value">${liste(passage.produitsLivres)}${passage.livraisonAutre?" — "+passage.livraisonAutre:""}</div></div>
  </div>
</div>`:""}

<div class="section">
  <div class="section-title"><span class="sec-icon">✅</span> Clôture</div>
  <div class="section-body grid">
    <div class="field"><div class="field-label">Devis à faire</div><div class="field-value">${ouinon(passage.devis)}</div></div>
    <div class="field"><div class="field-label">Prise d'échantillon</div><div class="field-value">${ouinon(passage.priseEchantillon)}</div></div>
    <div class="field"><div class="field-label">Présence client</div><div class="field-value">${ouinon(passage.presenceClient)}</div></div>
    <div class="field"><div class="field-label">Ressenti</div><div class="field-value">${etoiles(passage.ressenti)}</div></div>
    ${passage.commentaires?`<div class="field" style="grid-column:1/-1"><div class="field-label">Commentaires</div><div class="field-value">${passage.commentaires}</div></div>`:""}
  </div>
</div>

${sectionPhotos}

<div class="section">
  <div class="section-title"><span class="sec-icon">✍️</span> Signatures</div>
  <div class="section-body sig-grid">
    <div><div class="sig-label">Technicien</div>${sigTech}</div>
    <div><div class="sig-label">Client / Propriétaire</div>${sigClient}</div>
  </div>
</div>

<div class="footer">Document généré le ${new Date().toLocaleDateString("fr")} · <strong>BRIBLUE</strong> · 06 67 18 61 15 · briblue83@hotmail.com</div>

</div>
</body></html>`;
}

function ouvrirRapport(passage, client) {
  const html = genererHTMLRapport(passage, client);
  const blob = new Blob([html], {type:"text/html;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
}

// ─── ENVOI EMAIL — Télécharge d'abord le PDF, puis ouvre mailto ──────────────
function envoyerEmail(passage, client) {
  // 1) Générer et télécharger le rapport HTML (que le technicien convertira en PDF via Imprimer)
  const html = genererHTMLRapport(passage, client);
  const blob = new Blob([html], {type:"text/html;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const dateStr = new Date(passage.date).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"});
  const filename = `Rapport_BRIBLUE_${client?.nom?.replace(/\s/g,"_")||"client"}_${passage.date}.html`;

  // Télécharger le fichier
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 3000);

  // 2) Ouvrir le client mail avec un message propre (sans les données en corps)
  const sujet = encodeURIComponent(`Rapport entretien piscine — ${dateStr}`);
  const corps = encodeURIComponent(
`Bonjour ${client?.nom||""},

Veuillez trouver ci-joint votre rapport d'entretien piscine du ${dateStr}.

N'hésitez pas à me contacter si vous avez des questions.

Cordialement,
Dorian — BRIBLUE
Entretien & Traitement de piscines
T. 06 67 18 61 15`
  );
  setTimeout(()=>{ window.location.href = `mailto:${client?.email||""}?subject=${sujet}&body=${corps}`; }, 800);

  // Notification
  alert(`Le rapport a été téléchargé.\n\nVotre messagerie va s'ouvrir.\nPensez à joindre le fichier "${filename}" en pièce jointe.`);
}

// ─── FORMULAIRE PASSAGE ───────────────────────────────────────────────────────
function FormPassage({ clients, defaultClientId, initial, onSave, onClose }) {
  const EMPTY = {
    date:TODAY, clientId:defaultClientId||"", type:"visite complète", tech:"Dorian",
    chloreLibre:"", ph:"", alcalinite:"", stabilisant:"",
    tSel:"", tPhosphate:"", tStabilisant:"", tChlore:"", tPH:"",
    qualiteEau:"", etatFond:[], etatParois:[], etatLocal:[], etatBacTampon:[], etatVoletBac:[],
    corrChlore:"", corrPhosphate:"", corrPH:"", corrSel:"", corrAlgicide:"", corrPeroxyde:"", corrChloreChoc:"", corrAutre:"",
    devis:null, priseEchantillon:null, commentaires:"",
    livraisonProduits:null, produitsLivres:[], livraisonAutre:"",
    ressenti:0, presenceClient:null,
    signatureTech:"", signatureClient:"",
    photoArrivee:"",
    photoDepart:"",
    ok:false,
  };
  const isEdit = !!initial?.id;
  const isMobile = useIsMobile();
  const [f,setF]=useState(isEdit ? {...EMPTY,...initial} : EMPTY);
  const [step,setStep]=useState(1);
  const STEPS=6;
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const ph=Number(f.tPH)||Number(f.ph);
  const cl=Number(f.tChlore)||Number(f.chloreLibre);

  const handleSave = () => {
    if(!f.clientId||!f.date) return alert("Client et date requis");
    onSave({
      ...f,
      id: isEdit ? f.id : uid(),
      ph:ph||f.tPH||f.ph||"",
      chlore:cl||f.tChlore||f.chloreLibre||"",
      actions:[
        f.corrChlore&&`Chlore: ${f.corrChlore}`,
        f.corrPH&&`pH: ${f.corrPH}`,
        f.corrAlgicide&&`Algicide: ${f.corrAlgicide}`,
        f.corrChloreChoc&&`Chlore choc: ${f.corrChloreChoc}`,
        f.corrAutre&&f.corrAutre,
      ].filter(Boolean).join(", ") || "",
      obs: f.commentaires,
    });
  };

  const client = clients.find(c=>c.id===f.clientId);

  const STEP_INFO = [
    {ic:"🔧",l:"Intervention",color:"#0369a1"},
    {ic:"💧",l:"Analyses eau",color:"#0891b2"},
    {ic:"🏊",l:"État bassin",color:"#059669"},
    {ic:"⚗️",l:"Correctifs",color:"#7c3aed"},
    {ic:"✅",l:"Clôture",color:"#ea580c"},
    {ic:"✍️",l:"Signatures",color:"#be185d"},
  ];

  // Stepper moderne style timeline
  const Stepper = () => (
    <div style={{marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",gap:0,position:"relative"}}>
        {STEP_INFO.map((s,i)=>{
          const done = i+1 < step;
          const active = i+1 === step;
          const col = active ? s.color : done ? DS.green : DS.border;
          return (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative",cursor:"pointer",zIndex:1}} onClick={()=>setStep(i+1)}>
              {/* Ligne connecteur */}
              {i>0 && <div style={{position:"absolute",top:18,right:"50%",width:"100%",height:3,background:done||active?`linear-gradient(90deg,${DS.green},${col})`:DS.border,zIndex:0}}/>}
              {/* Cercle */}
              <div style={{width:36,height:36,borderRadius:18,background:active?`linear-gradient(135deg,${s.color},${s.color}cc)`:done?DS.greenGrad:DS.white,border:active?"none":done?"none":`2px solid ${DS.border}`,display:"flex",alignItems:"center",justifyContent:"center",zIndex:2,boxShadow:active?`0 4px 16px ${s.color}44`:done?"0 2px 8px rgba(5,150,105,0.2)":"none",transition:"all .3s"}}>
                {done ? Ico.check(14,"#fff") : <span style={{fontSize:16,filter:active?"none":"grayscale(0.5) opacity(0.6)"}}>{s.ic}</span>}
              </div>
              {/* Label */}
              <span style={{fontSize:isMobile?8:10,fontWeight:active?800:done?700:500,color:active?s.color:done?DS.green:DS.mid,marginTop:6,textAlign:"center",lineHeight:1.2,letterSpacing:-0.2}}>
                {isMobile?s.l.split(" ")[0]:s.l}
              </span>
            </div>
          );
        })}
      </div>
      {/* Barre de progression globale */}
      <div style={{height:3,background:DS.border,borderRadius:99,marginTop:16,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${(step/STEPS)*100}%`,background:`linear-gradient(90deg,${STEP_INFO[0].color},${STEP_INFO[step-1].color})`,borderRadius:99,transition:"width .5s cubic-bezier(.22,1,.36,1)"}}/>
      </div>
    </div>
  );

  // Titre d'étape
  const StepHeader = ({icon, title, subtitle, color}) => (
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,padding:"16px 18px",background:`linear-gradient(135deg,${color}08,${color}15)`,borderRadius:DS.radius,border:`1px solid ${color}22`}}>
      <div style={{width:44,height:44,borderRadius:14,background:`linear-gradient(135deg,${color},${color}cc)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:`0 4px 16px ${color}33`,flexShrink:0}}>{icon}</div>
      <div>
        <div style={{fontWeight:900,fontSize:16,color:DS.dark,letterSpacing:-0.3}}>{title}</div>
        <div style={{fontSize:12,color:DS.mid,marginTop:1,fontWeight:500}}>{subtitle}</div>
      </div>
      <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
        <span style={{fontSize:22,fontWeight:900,color}}>{step}</span>
        <span style={{fontSize:13,color:DS.mid,fontWeight:600}}>/ {STEPS}</span>
      </div>
    </div>
  );

  return (
    <Modal title={isEdit ? "Modifier le passage" : "Fiche Entretien"} onClose={onClose} wide>
      <Stepper/>

      {/* ÉTAPE 1 */}
      {step===1 && (
        <div className="fade-in">
          <StepHeader icon="🔧" title="Intervention" subtitle="Client, date et type" color="#0369a1"/>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
            <Input label="Date *" type="date" value={f.date} onChange={e=>set("date",e.target.value)}/>
            <Input label="Technicien" value={f.tech} onChange={e=>set("tech",e.target.value)} placeholder="Prénom"/>
          </div>
          <div style={{marginTop:16}}>
            <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:8}}>Client *</span>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,maxHeight:220,overflowY:"auto"}}>
              {clients.map(c=>{
                const sel=f.clientId===c.id;
                return (
                  <button key={c.id} onClick={()=>set("clientId",c.id)} className="card-hover" style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:DS.radiusSm,border:`2px solid ${sel?DS.blue:DS.border}`,background:sel?DS.blueSoft:DS.white,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .2s",boxShadow:sel?"0 2px 12px "+DS.blue+"22":"none"}}>
                    <Avatar nom={c.nom} size={38}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{c.nom}</div>
                      <div style={{fontSize:11,color:DS.mid,marginTop:1}}>{c.formule} · {c.bassin} {c.volume}m³</div>
                    </div>
                    {sel && <div style={{width:22,height:22,borderRadius:11,background:DS.blueGrad,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 6px "+DS.blue+"44"}}>{Ico.check(12,"#fff")}</div>}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{marginTop:16}}>
            <RadioGroup label="Type d'intervention" value={f.type} onChange={v=>set("type",v)}
              options={["visite complète","visite technique","bassin en rattrapage","fin de rattrapage"]}/>
          </div>
          <div style={{borderTop:"1px solid "+DS.border,paddingTop:16,marginTop:16}}>
            <PhotoPicker label="Photo à l'arrivée" value={f.photoArrivee} onChange={v=>set("photoArrivee",v)}/>
          </div>
        </div>
      )}

      {/* ÉTAPE 2 */}
      {step===2 && (
        <div className="fade-in">
          <StepHeader icon="💧" title="Analyses eau" subtitle="Bandelette et mesures détaillées" color="#0891b2"/>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            <div style={{background:DS.light,borderRadius:DS.radius,padding:16,border:"1px solid "+DS.border}}>
              <div style={{fontSize:11,fontWeight:800,color:"#0891b2",textTransform:"uppercase",letterSpacing:.8,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,borderRadius:3,background:"#0891b2"}}/>Test bandelette
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <NumField label="Chlore libre" unit="ppm" value={f.chloreLibre} onChange={v=>set("chloreLibre",v)} ideal="1–3" okFn={v=>v>=1&&v<=3}/>
                <NumField label="pH" value={f.ph} onChange={v=>set("ph",v)} ideal="7.2–7.8" okFn={v=>v>=7.2&&v<=7.8}/>
                <NumField label="Alcalinité totale" unit="ppm" value={f.alcalinite} onChange={v=>set("alcalinite",v)} ideal="80–120" okFn={v=>v>=80&&v<=120}/>
                <NumField label="Stabilisant" unit="ppm" value={f.stabilisant} onChange={v=>set("stabilisant",v)} ideal="30–50" okFn={v=>v>=30&&v<=50}/>
              </div>
            </div>
            <div style={{background:DS.light,borderRadius:DS.radius,padding:16,border:"1px solid "+DS.border}}>
              <div style={{fontSize:11,fontWeight:800,color:"#7c3aed",textTransform:"uppercase",letterSpacing:.8,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,borderRadius:3,background:"#7c3aed"}}/>Mesures détaillées
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <NumField label="Taux de sel" value={f.tSel} onChange={v=>set("tSel",v)}/>
                <NumField label="Taux de phosphate" value={f.tPhosphate} onChange={v=>set("tPhosphate",v)}/>
                <NumField label="Taux stabilisant" value={f.tStabilisant} onChange={v=>set("tStabilisant",v)}/>
                <NumField label="Taux de chlore" value={f.tChlore} onChange={v=>set("tChlore",v)} ideal="1–1.5" okFn={v=>v>=0.5&&v<=3}/>
                <NumField label="Taux de pH" value={f.tPH} onChange={v=>set("tPH",v)} ideal="7.2–7.4" okFn={v=>v>=7.0&&v<=7.6}/>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 */}
      {step===3 && (
        <div className="fade-in">
          <StepHeader icon="🏊" title="État du bassin" subtitle="Eau, fond, parois, local" color="#059669"/>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <RadioGroup label="Qualité de l'eau" value={f.qualiteEau} onChange={v=>set("qualiteEau",v)} options={["Cristalline","Trouble","Laiteuse","Verte"]}/>
              <MultiCheck label="État du fond" values={f.etatFond} onChange={v=>set("etatFond",v)} options={["Sale","Très sale","Attaque d'algues"]}/>
              <MultiCheck label="État des parois" values={f.etatParois} onChange={v=>set("etatParois",v)} options={["Propre","Sale","Attaque d'algues"]}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <MultiCheck label="État du local" values={f.etatLocal} onChange={v=>set("etatLocal",v)} options={ETAT_LOCAL_OPTIONS}/>
              <MultiCheck label="État du bac tampon" values={f.etatBacTampon} onChange={v=>set("etatBacTampon",v)} options={["Propre","Sale","Passage de balai","Nettoyage au jet d'eau","Nettoyage au Karcher"]}/>
              <MultiCheck label="État du volet / bac" values={f.etatVoletBac} onChange={v=>set("etatVoletBac",v)} options={["Propre","Sale","Passage de balai","Nettoyage au jet d'eau","Nettoyage au karcher"]}/>
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 4 */}
      {step===4 && (
        <div className="fade-in">
          <StepHeader icon="⚗️" title="Correctifs" subtitle="Traitements et produits ajoutés" color="#7c3aed"/>
          <div style={{background:`linear-gradient(135deg,#7c3aed08,#7c3aed12)`,borderRadius:DS.radius,padding:18,border:"1px solid #7c3aed18"}}>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:12}}>
              <Input label="Chlore" value={f.corrChlore} onChange={e=>set("corrChlore",e.target.value)} placeholder="ex: 200g"/>
              <Input label="pH" value={f.corrPH} onChange={e=>set("corrPH",e.target.value)} placeholder="ex: pH- 100ml"/>
              <Input label="Sel" value={f.corrSel} onChange={e=>set("corrSel",e.target.value)} placeholder="ex: 2 sacs"/>
              <Input label="Algicide" value={f.corrAlgicide} onChange={e=>set("corrAlgicide",e.target.value)}/>
              <Input label="Peroxyde" value={f.corrPeroxyde} onChange={e=>set("corrPeroxyde",e.target.value)}/>
              <Input label="Chlore Choc" value={f.corrChloreChoc} onChange={e=>set("corrChloreChoc",e.target.value)}/>
              <Input label="Phosphate" value={f.corrPhosphate} onChange={e=>set("corrPhosphate",e.target.value)}/>
              <Input label="Autre" value={f.corrAutre} onChange={e=>set("corrAutre",e.target.value)}/>
            </div>
          </div>
          <div style={{marginTop:16}}>
            <OuiNon label="Devis à faire ?" value={f.devis} onChange={v=>set("devis",v)}/>
          </div>
        </div>
      )}

      {/* ÉTAPE 5 */}
      {step===5 && (
        <div className="fade-in">
          <StepHeader icon="✅" title="Clôture" subtitle="Commentaires, livraisons, validation" color="#ea580c"/>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <OuiNon label="Prise d'échantillon ?" value={f.priseEchantillon} onChange={v=>set("priseEchantillon",v)}/>
              <div>
                <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:4}}>Commentaires</span>
                <textarea value={f.commentaires} onChange={e=>set("commentaires",e.target.value)} placeholder="Anomalies, recommandations..."
                  style={{width:"100%",padding:"11px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:100,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark,transition:"all .2s"}}/>
              </div>
              <OuiNon label="Livraison de produits ?" value={f.livraisonProduits} onChange={v=>set("livraisonProduits",v)}/>
              {f.livraisonProduits && (
                <>
                  <MultiCheck label="Produit(s) livré(s)" values={f.produitsLivres} onChange={v=>set("produitsLivres",v)} options={PRODUITS_LIVRAISON}/>
                  <div>
                    <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:4}}>Autre (quantités, marques…)</span>
                    <textarea value={f.livraisonAutre} onChange={e=>set("livraisonAutre",e.target.value)}
                      style={{width:"100%",padding:"9px 12px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:56,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark}}/>
                  </div>
                </>
              )}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Ressenti de la prestation</span>
                <StarRating value={f.ressenti} onChange={v=>set("ressenti",v)}/>
              </div>
              <OuiNon label="Présence du locataire / propriétaire ?" value={f.presenceClient} onChange={v=>set("presenceClient",v)}/>
              <div style={{borderTop:"1px solid "+DS.border,paddingTop:14}}>
                <PhotoPicker label="Photo au départ" value={f.photoDepart} onChange={v=>set("photoDepart",v)}/>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:`linear-gradient(135deg,${DS.greenSoft},#bbf7d0)`,padding:"14px 16px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.green+"44",marginTop:4,transition:"all .2s"}}>
                <input type="checkbox" checked={f.ok} onChange={e=>set("ok",e.target.checked)} style={{width:20,height:20,accentColor:DS.green}}/>
                <span style={{fontWeight:800,color:"#16a34a",fontSize:14,display:"flex",alignItems:"center",gap:6}}>
                  {Ico.check(16,"#16a34a")} Passage validé et terminé
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 6 */}
      {step===6 && (
        <div className="fade-in">
          <StepHeader icon="✍️" title="Signatures & Export" subtitle="Finaliser et envoyer le rapport" color="#be185d"/>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>
            <SignaturePad label="Signature du technicien" value={f.signatureTech} onChange={v=>set("signatureTech",v)}/>
            <SignaturePad label="Signature du client / propriétaire" value={f.signatureClient} onChange={v=>set("signatureClient",v)}/>
          </div>
          {(f.photoArrivee||f.photoDepart) && (
            <div style={{background:DS.light,borderRadius:DS.radiusSm,padding:14,border:"1px solid "+DS.border,marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Photos jointes au rapport</div>
              <div style={{display:"grid",gridTemplateColumns:f.photoArrivee&&f.photoDepart?"1fr 1fr":"1fr",gap:10}}>
                {f.photoArrivee && (<div style={{position:"relative"}}><img src={f.photoArrivee} alt="Arrivée" style={{width:"100%",height:100,objectFit:"cover",borderRadius:10,border:"1px solid "+DS.border,display:"block"}}/><span style={{position:"absolute",bottom:5,left:6,fontSize:10,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.55)",borderRadius:5,padding:"2px 7px"}}>Arrivée</span></div>)}
                {f.photoDepart && (<div style={{position:"relative"}}><img src={f.photoDepart} alt="Départ" style={{width:"100%",height:100,objectFit:"cover",borderRadius:10,border:"1px solid "+DS.border,display:"block"}}/><span style={{position:"absolute",bottom:5,left:6,fontSize:10,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.55)",borderRadius:5,padding:"2px 7px"}}>Départ</span></div>)}
              </div>
            </div>
          )}
          <div style={{background:`linear-gradient(135deg,#be185d08,#be185d12)`,borderRadius:DS.radius,padding:18,border:"1px solid #be185d18"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#be185d",textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Exporter le rapport</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
              <button onClick={()=>ouvrirRapport(f,client)} className="btn-hover" style={{padding:"14px",borderRadius:DS.radiusSm,background:DS.white,border:"1.5px solid "+DS.border,cursor:"pointer",fontWeight:700,fontSize:14,color:DS.dark,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {Ico.pdf(18,DS.dark)} Télécharger PDF
              </button>
              {client?.email ? (
                <button onClick={()=>envoyerEmail(f,client)} className="btn-hover" style={{padding:"14px",borderRadius:DS.radiusSm,background:DS.blueGrad,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 16px "+DS.blue+"44"}}>
                  {Ico.send(16,"#fff")} Envoyer à {client.email}
                </button>
              ) : (
                <div style={{fontSize:12,color:DS.orange,textAlign:"center",padding:"14px",background:DS.orangeSoft,borderRadius:DS.radiusSm,display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontWeight:600}}>
                  {Ico.alert(13,DS.orange)} Aucun email renseigné
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{display:"flex",gap:10,marginTop:24,paddingTop:16,borderTop:"1px solid "+DS.border}}>
        <button onClick={step===1?onClose:()=>setStep(s=>s-1)} className="btn-hover" style={{flex:1,padding:"13px",borderRadius:DS.radiusSm,background:DS.light,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          {step===1?<>{Ico.close(13,DS.mid)} Annuler</>:<>{Ico.back(13,DS.mid)} Retour</>}
        </button>
        {step<STEPS
          ? <BtnPrimary onClick={()=>setStep(s=>s+1)} icon={null} style={{flex:2,padding:"13px"}}>Suivant {Ico.next(14,"#fff")}</BtnPrimary>
          : <BtnPrimary onClick={handleSave} icon={Ico.save(15,"#fff")} style={{flex:2,padding:"13px"}}>Enregistrer</BtnPrimary>
        }
      </div>
    </Modal>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ clients, passages, onClientClick, onAddPassage, onAddLivraison, onAddClient }) {
  const isMobile = useIsMobile();
  const moisCourant = MOIS_NOW;
  const saisonNow = getSaison(moisCourant);
  const sMeta = SAISONS_META[saisonNow];
  const alertes = clients.filter(c=>alerteClient(c,passages)!=="ok");

  const passagesMois = clients.map(c=>{
    const pm = passagesParMois(c.saisons);
    const prev = pm[moisCourant]||0;
    const eff = passages.filter(p=>p.clientId===c.id&&new Date(p.date).getMonth()+1===moisCourant&&new Date(p.date).getFullYear()===new Date().getFullYear()).length;
    return { client:c, prev, eff, rest:Math.max(0,prev-eff) };
  }).filter(x=>x.prev>0).sort((a,b)=>b.rest-a.rest);

  const totalPrev = clients.reduce((a,c)=>a+totalAnnuel(c.saisons),0);
  const totalEff = passages.length;

  return (
    <div>
      {/* Stats cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {[
          {ico:Ico.clients(18,"#fff"),    l:"Clients",     v:clients.length, g:"linear-gradient(135deg,#0284c7,#06b6d4)"},
          {ico:Ico.calendar(18,"#fff"),   l:"Prévus / an", v:totalPrev,      g:"linear-gradient(135deg,#7c3aed,#a78bfa)"},
          {ico:Ico.check(18,"#fff"),      l:"Effectués",   v:totalEff,       g:"linear-gradient(135deg,#059669,#34d399)"},
        ].map(k=>(
          <Card key={k.l} style={{padding:"16px 14px",border:"none",background:DS.white}}>
            <div style={{width:36,height:36,borderRadius:11,background:k.g,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10,boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>
              {k.ico}
            </div>
            <div style={{fontSize:24,fontWeight:900,color:DS.dark,lineHeight:1,letterSpacing:-1}}>{k.v}</div>
            <div style={{fontSize:11,color:DS.mid,marginTop:4,fontWeight:600}}>{k.l}</div>
          </Card>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        <BtnPrimary onClick={onAddPassage} bg={DS.dark} icon={Ico.clipboard(16,"#fff")} style={{width:"100%",boxShadow:"0 4px 16px rgba(12,18,34,0.3)"}}>Passage</BtnPrimary>
        <BtnPrimary onClick={()=>onAddLivraison()} bg={DS.blue} icon={Ico.truck(16,"#fff")} style={{width:"100%",boxShadow:"0 4px 16px "+DS.blue+"44"}}>Livraison</BtnPrimary>
        {!isMobile && <BtnPrimary onClick={onAddClient} bg="#7c3aed" icon={Ico.userPlus(16,"#fff")} style={{width:"100%",boxShadow:"0 4px 16px #7c3aed44"}}>Client</BtnPrimary>}
      </div>

      {/* Mini calendar + month progress */}
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <div style={{fontWeight:900,fontSize:17,color:DS.dark,letterSpacing:-0.3}}>{MOIS_L[moisCourant]}</div>
            <div style={{fontSize:12,color:DS.mid,marginTop:1}}>Passages du mois</div>
          </div>
          <Tag color={sMeta.color} bg={sMeta.bg}><span style={{display:"flex",alignItems:"center",gap:4}}>{Ico[sMeta.icon]&&Ico[sMeta.icon](12,sMeta.color)} {sMeta.label}</span></Tag>
        </div>

        {(()=>{
          const year=new Date().getFullYear();
          const firstDay=new Date(year,moisCourant-1,1).getDay();
          const nbDays=new Date(year,moisCourant,0).getDate();
          const today=new Date().getDate();
          const passageDays=new Set(passages.filter(p=>{ const d=new Date(p.date); return d.getMonth()+1===moisCourant&&d.getFullYear()===year; }).map(p=>new Date(p.date).getDate()));
          const offset=(firstDay+6)%7;
          const cells=[...Array(offset).fill(null),...Array.from({length:nbDays},(_,i)=>i+1)];
          return (
            <div style={{marginBottom:14}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
                {["L","M","M","J","V","S","D"].map((d,i)=>(<div key={i} style={{textAlign:"center",fontSize:9,fontWeight:800,color:DS.mid,padding:"2px 0"}}>{d}</div>))}
                {cells.map((day,i)=>{
                  if(!day) return <div key={i}/>;
                  const isToday=day===today, hasP=passageDays.has(day);
                  return (
                    <div key={i} style={{textAlign:"center",padding:"5px 2px",borderRadius:7,background:isToday?DS.dark:hasP?DS.blueSoft:"transparent",border:isToday?"none":hasP?"1.5px solid "+DS.blue:"1px solid transparent",position:"relative"}}>
                      <span style={{fontSize:10,fontWeight:isToday||hasP?800:400,color:isToday?"#fff":hasP?DS.blue:DS.mid}}>{day}</span>
                      {hasP&&!isToday&&<div style={{width:4,height:4,borderRadius:2,background:DS.blue,margin:"1px auto 0"}}/>}
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:12,fontSize:11,color:DS.mid,justifyContent:"flex-end",fontWeight:600}}>
                <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:4,background:DS.dark}}/> Aujourd'hui</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:4,background:DS.blue}}/> Passage</span>
              </div>
            </div>
          );
        })()}

        {passagesMois.length===0
          ? <div style={{color:DS.mid,fontSize:13,textAlign:"center",padding:"8px 0"}}>Aucun passage prévu ce mois</div>
          : passagesMois.map(({client,prev,eff,rest})=>(
            <div key={client.id} onClick={()=>onClientClick(client)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+DS.border,cursor:"pointer"}}>
              <Avatar nom={client.nom} size={36}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13,color:DS.dark,marginBottom:3}}>{client.nom}</div>
                <ProgressBar value={eff} max={prev}/>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                <span style={{fontSize:15,fontWeight:800,color:DS.green}}>{eff}</span>
                <span style={{color:DS.border}}>/</span>
                <span style={{fontSize:15,fontWeight:800,color:DS.dark}}>{prev}</span>
                {rest>0?<Tag color={DS.orange}>{rest}</Tag>:<IcoBubble ico={Ico.check(11,DS.green)} color={DS.green} size={22}/>}
              </div>
            </div>
          ))
        }
        <button onClick={onAddPassage} className="btn-hover" style={{width:"100%",marginTop:14,padding:"11px",borderRadius:DS.radiusSm,background:DS.blueSoft,color:DS.blue,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"inherit"}}>
          {Ico.plus(13,DS.blue)} Saisir un passage
        </button>
      </Card>

      {alertes.length > 0 && (
        <Card style={{border:"1px solid "+DS.red+"33"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <IcoBubble ico={Ico.alert(14,DS.red)} color={DS.red} size={30}/>
            <span style={{fontWeight:800,fontSize:14,color:DS.dark}}>Alertes ({alertes.length})</span>
          </div>
          {alertes.map(c=>{
            const al=alerteClient(c,passages); const col=AC[al]; const j=daysUntil(c.dateFin);
            return (
              <div key={c.id} onClick={()=>onClientClick(c)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+DS.border,cursor:"pointer"}}>
                <Avatar nom={c.nom} size={36}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{c.nom}</div>
                  <div style={{fontSize:11,color:DS.mid,marginTop:2}}>{al==="rouge"||al==="jaune"?`Expire dans ${j} jours`:"Passages en retard"}</div>
                </div>
                <Tag color={col.tx}>{col.lbl}</Tag>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

// ─── PAGE CLIENTS — AVEC BOUTON AJOUTER ──────────────────────────────────────
function PageClients({ clients, passages, onClientClick, onAdd }) {
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();
  const filtered = useMemo(()=>clients.filter(c=>c.nom.toLowerCase().includes(search.toLowerCase())||c.adresse?.toLowerCase().includes(search.toLowerCase())),[clients,search]);

  return (
    <div>
      {/* Barre de recherche + bouton ajouter */}
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <div style={{flex:1,position:"relative"}}>
          <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>{Ico.search(16,DS.mid)}</div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un client..."
            style={{width:"100%",padding:"11px 14px 11px 38px",borderRadius:DS.radius,border:"1.5px solid "+DS.border,fontSize:13,outline:"none",boxSizing:"border-box",background:DS.white,color:DS.dark,fontFamily:"inherit",transition:"all .2s"}}/>
        </div>
        <BtnPrimary onClick={onAdd} bg="#7c3aed" icon={Ico.userPlus(16,"#fff")} style={{flexShrink:0,boxShadow:"0 4px 12px #7c3aed44"}}>
          {!isMobile && "Ajouter"}
        </BtnPrimary>
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",color:DS.mid,padding:40}}>Aucun client trouvé</div>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map((c,idx)=>{
          const al=alerteClient(c,passages); const col=AC[al];
          const eff=passages.filter(p=>p.clientId===c.id).length;
          const tot=totalAnnuel(c.saisons);
          const moisPrev=passagesParMois(c.saisons)[MOIS_NOW]||0;
          const moisEff=passages.filter(p=>p.clientId===c.id&&new Date(p.date).getMonth()+1===MOIS_NOW).length;
          return (
            <Card key={c.id} onClick={()=>onClientClick(c)} className="fade-in" style={{animationDelay:`${idx*0.05}s`}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <Avatar nom={c.nom} size={44}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{fontWeight:800,fontSize:14,color:DS.dark,letterSpacing:-0.2}}>{c.nom}</div>
                    <Tag color={col.tx}>{col.lbl}</Tag>
                  </div>
                  <div style={{fontSize:12,color:DS.mid,marginTop:3,display:"flex",gap:10,flexWrap:"wrap"}}>
                    {c.tel&&<span style={{display:"flex",alignItems:"center",gap:3}}>{Ico.phone(11,DS.mid)} {c.tel}</span>}
                    {c.adresse&&<span style={{display:"flex",alignItems:"center",gap:3}}>{Ico.pin(11,DS.mid)} {c.adresse.split(",").pop()?.trim()}</span>}
                  </div>
                  <div style={{marginTop:8}}>
                    <ProgressBar value={eff} max={tot}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                      <span style={{fontSize:11,color:DS.mid,fontWeight:600}}>{eff}/{tot} passages</span>
                      {moisPrev>0&&<Tag color={moisEff>=moisPrev?DS.green:DS.orange}>Ce mois: {moisEff}/{moisPrev}</Tag>}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGE PASSAGES ────────────────────────────────────────────────────────────
function PagePassages({ clients, passages, onAdd, onDelete, onEdit }) {
  const [filter,setFilter]=useState("mois");
  const now=new Date();
  const filtered=useMemo(()=>{
    return passages.filter(p=>{
      const d=new Date(p.date);
      if(filter==="semaine") return (now-d)/86400000<=7&&d<=now;
      if(filter==="mois") return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
      return true;
    }).sort((a,b)=>new Date(b.date)-new Date(a.date));
  },[passages,filter]);

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[["semaine","Semaine"],["mois","Mois"],["tout","Tout"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} className="btn-hover" style={{padding:"7px 16px",borderRadius:20,border:filter===v?"none":"1px solid "+DS.border,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",background:filter===v?DS.blueGrad:DS.white,color:filter===v?"#fff":DS.mid,boxShadow:filter===v?"0 2px 8px "+DS.blue+"44":"none"}}>{l}</button>
        ))}
        <span style={{marginLeft:"auto",fontSize:12,color:DS.mid,alignSelf:"center",fontWeight:600}}>{filtered.length} passage{filtered.length!==1?"s":""}</span>
      </div>
      {filtered.length===0
        ? <div style={{textAlign:"center",color:DS.mid,padding:40,fontSize:13}}>Aucun passage sur cette période</div>
        : <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map((p,idx)=>{
            const c=clients.find(x=>x.id===p.clientId);
            const phOk=p.ph>=7&&p.ph<=7.6, clOk=p.chlore>=0.5&&p.chlore<=3;
            return (
              <Card key={p.id} className="fade-in" style={{animationDelay:`${idx*0.05}s`}}>
                <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <Avatar nom={c?.nom||"?"} size={42}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:13,color:DS.dark}}>{c?.nom||p.clientId}</div>
                        <div style={{fontSize:11,color:DS.mid,marginTop:1,display:"flex",alignItems:"center",gap:4}}>
                          {new Date(p.date).toLocaleDateString("fr",{weekday:"short",day:"2-digit",month:"short"})}
                          {p.tech&&<><span>·</span>{Ico.user(10,DS.mid)}<span>{p.tech}</span></>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        {p.ok?<IcoBubble ico={Ico.check(11,DS.green)} color={DS.green} size={24}/>:<IcoBubble ico={Ico.x(11,DS.red)} color={DS.red} size={24}/>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                      <Tag color={DS.blue}>{p.type}</Tag>
                      {p.ph&&<Tag color={phOk?DS.green:DS.red}>pH {p.ph}</Tag>}
                      {p.chlore&&<Tag color={clOk?DS.green:DS.red}>Cl {p.chlore}</Tag>}
                    </div>
                    {(p.photoArrivee||p.photoDepart) && (
                      <div style={{display:"flex",gap:6,marginBottom:6}}>
                        {p.photoArrivee && (<div style={{position:"relative"}}><img src={p.photoArrivee} alt="Arrivée" style={{height:48,width:72,objectFit:"cover",borderRadius:7,border:"1px solid "+DS.border}}/><span style={{position:"absolute",bottom:2,left:3,fontSize:8,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.55)",borderRadius:3,padding:"1px 4px"}}>Arr.</span></div>)}
                        {p.photoDepart && (<div style={{position:"relative"}}><img src={p.photoDepart} alt="Départ" style={{height:48,width:72,objectFit:"cover",borderRadius:7,border:"1px solid "+DS.border}}/><span style={{position:"absolute",bottom:2,left:3,fontSize:8,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.55)",borderRadius:3,padding:"1px 4px"}}>Dép.</span></div>)}
                      </div>
                    )}
                    {p.actions&&<div style={{fontSize:12,color:DS.mid,marginBottom:4}}>{p.actions}</div>}
                    {p.obs&&<div style={{fontSize:11,color:DS.orange,display:"flex",alignItems:"center",gap:4}}>{Ico.note(11,DS.orange)} {p.obs}</div>}
                    <div style={{display:"flex",gap:6,marginTop:10,paddingTop:10,borderTop:"1px solid "+DS.border}}>
                      <button onClick={()=>onEdit(p)} className="btn-hover" style={{flex:1,padding:"7px",borderRadius:10,background:DS.light,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.mid,fontFamily:"inherit",fontWeight:700}}>{Ico.edit(13,DS.mid)} Modifier</button>
                      <button onClick={()=>ouvrirRapport(p,c)} className="btn-hover" style={{flex:1,padding:"7px",borderRadius:10,background:DS.blueSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.blue,fontFamily:"inherit",fontWeight:700}}>{Ico.pdf(13,DS.blue)} Rapport</button>
                      {c?.email&&<button onClick={()=>envoyerEmail(p,c)} className="btn-hover" style={{flex:1,padding:"7px",borderRadius:10,background:DS.greenSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.green,fontFamily:"inherit",fontWeight:700}}>{Ico.send(13,DS.green)} Email</button>}
                      <button onClick={()=>{if(confirm("Supprimer ce passage ?"))onDelete(p.id)}} className="btn-hover" style={{width:34,height:34,borderRadius:10,background:DS.redSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.trash(13,DS.red)}</button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      }
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const AUTH = { email: "briblue83@hotmail.com", code: "2004" };

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const isMobile = useIsMobile();

  const handleLogin = () => {
    setErr("");
    if (!email.trim() || !code.trim()) { setErr("Veuillez remplir tous les champs."); return; }
    setLoading(true);
    setTimeout(() => {
      if (email.trim().toLowerCase() === AUTH.email && code === AUTH.code) { onLogin(); }
      else { setErr("Email ou code incorrect."); setLoading(false); }
    }, 600);
  };

  return (
    <div style={{minHeight:"100vh",background:DS.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"'Inter', -apple-system, system-ui, sans-serif",position:"relative",overflow:"hidden"}}>
      {/* Background gradient decoration */}
      <div style={{position:"absolute",top:"-30%",right:"-20%",width:"60vw",height:"60vw",borderRadius:"50%",background:"radial-gradient(circle, #0284c720 0%, transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-20%",left:"-15%",width:"50vw",height:"50vw",borderRadius:"50%",background:"radial-gradient(circle, #7c3aed15 0%, transparent 70%)",pointerEvents:"none"}}/>

      <div className="scale-in" style={{marginBottom:32,display:"flex",flexDirection:"column",alignItems:"center",gap:12,position:"relative"}}>
        <div style={{width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,#0c1222,#1e3a5f)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 12px 40px rgba(12,18,34,0.4)"}}>{Ico.wave(42,"white")}</div>
        <div style={{textAlign:"center"}}>
          <div style={{fontWeight:900,fontSize:28,color:DS.dark,letterSpacing:-1}}>BRIBLUE</div>
          <div style={{color:DS.mid,fontSize:13,marginTop:2,fontWeight:500}}>Entretien & Traitement de piscines</div>
        </div>
      </div>
      <div className="fade-in" style={{width:"100%",maxWidth:400,background:DS.white,borderRadius:DS.radiusLg,padding:28,boxShadow:DS.shadowMd,border:"1px solid "+DS.border,position:"relative"}}>
        <div style={{marginBottom:24}}>
          <div style={{fontWeight:800,fontSize:18,color:DS.dark}}>Connexion Technicien</div>
          <div style={{color:DS.mid,fontSize:13,marginTop:4}}>Accès réservé à l'équipe BRIBLUE</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Adresse email</label>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>{Ico.mail(15,"#9ca3af")}</div>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="briblue83@hotmail.com" onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{width:"100%",padding:"12px 14px 12px 38px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:14,outline:"none",boxSizing:"border-box",color:DS.dark,fontFamily:"inherit",background:DS.bg,transition:"all .2s"}}/>
            </div>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Code d'accès</label>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>{Ico.user(15,"#9ca3af")}</div>
              <input type={showCode?"text":"password"} value={code} onChange={e=>{setCode(e.target.value);setErr("");}} placeholder="••••" onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{width:"100%",padding:"12px 44px 12px 38px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:14,outline:"none",boxSizing:"border-box",color:DS.dark,fontFamily:"inherit",background:DS.bg,transition:"all .2s"}}/>
              <button onClick={()=>setShowCode(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:2}}>
                {showCode ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </div>
          {err && <div style={{background:DS.redSoft,color:DS.red,borderRadius:10,padding:"9px 12px",fontSize:13,display:"flex",alignItems:"center",gap:6,fontWeight:600}}>{Ico.alert(13,DS.red)} {err}</div>}
          <BtnPrimary onClick={handleLogin} style={{width:"100%",marginTop:4,padding:"14px",fontSize:15,background:loading?"#93c5fd":DS.dark,cursor:loading?"not-allowed":"pointer"}}>
            {loading ? <><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{animation:"pulse 1s infinite"}}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Connexion…</> : <>{Ico.next(16,"#fff")} Se connecter</>}
          </BtnPrimary>
        </div>
      </div>
      <div style={{marginTop:20,color:"#94a3b8",fontSize:11,textAlign:"center",fontWeight:500}}>BRIBLUE · SIRET 84345436400053 · La Seyne-sur-Mer</div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [passages, setPassages] = useState([]);
  const [livraisons, setLivraisons] = useState([]);
  const [ready, setReady] = useState(false);
  const [ficheClient, setFicheClient] = useState(null);
  const [showFormClient, setShowFormClient] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [showFormPassage, setShowFormPassage] = useState(false);
  const [defaultClientId, setDefaultClientId] = useState("");
  const [editPassage, setEditPassage] = useState(null);
  const [showModalAlertes, setShowModalAlertes] = useState(false);
  const [showModalMois, setShowModalMois] = useState(false);
  const [showFormLivraison, setShowFormLivraison] = useState(false);
  const [defaultLivraisonClientId, setDefaultLivraisonClientId] = useState("");
  const isMobile = useIsMobile();

  useEffect(()=>{ try { if(sessionStorage.getItem("bb_auth")==="1") setLoggedIn(true); } catch {} },[]);

  useEffect(()=>{
    if(!loggedIn) return;
    (async()=>{
      const c = await load("bb_clients_v2", CLIENTS_INIT);
      const p = await load("bb_passages_v2", PASSAGES_INIT);
      const l = await load("bb_livraisons_v1", []);
      setClients(c); setPassages(p); setLivraisons(l); setReady(true);
    })();
  },[loggedIn]);

  useEffect(()=>{ if(ready) save("bb_clients_v2", clients); },[clients,ready]);
  useEffect(()=>{ if(ready) save("bb_passages_v2", passages); },[passages,ready]);
  useEffect(()=>{ if(ready) save("bb_livraisons_v1", livraisons); },[livraisons,ready]);

  const handleLogin = useCallback(()=>{ try{sessionStorage.setItem("bb_auth","1");}catch{} setLoggedIn(true); },[]);
  const handleLogout = useCallback(()=>{ try{sessionStorage.removeItem("bb_auth");}catch{} setLoggedIn(false);setReady(false);setClients([]);setPassages([]);setLivraisons([]); },[]);

  const saveClient = useCallback(c=>{ setClients(prev=>prev.find(x=>x.id===c.id)?prev.map(x=>x.id===c.id?c:x):[...prev,c]); setShowFormClient(false);setEditClient(null);setFicheClient(c); },[]);
  const deleteClient = useCallback(id=>{ if(!confirm("Supprimer ce client ?"))return; setClients(prev=>prev.filter(x=>x.id!==id)); setPassages(prev=>prev.filter(x=>x.clientId!==id)); setFicheClient(null); },[]);
  const savePassage = useCallback(p=>{ setPassages(prev=>prev.find(x=>x.id===p.id)?prev.map(x=>x.id===p.id?p:x):[...prev,p]); setShowFormPassage(false);setEditPassage(null); },[]);
  const deletePassage = useCallback(id=>setPassages(prev=>prev.filter(x=>x.id!==id)),[]);
  const openAddPassageFromClient = useCallback(cid=>{ setEditPassage(null);setDefaultClientId(cid);setShowFormPassage(true); },[]);
  const openEditPassage = useCallback(p=>{ setEditPassage(p);setDefaultClientId(p.clientId);setShowFormPassage(true); },[]);
  const saveLivraison = useCallback(l=>{ setLivraisons(prev=>prev.find(x=>x.id===l.id)?prev.map(x=>x.id===l.id?l:x):[...prev,l]); },[]);
  const deleteLivraison = useCallback(id=>setLivraisons(prev=>prev.filter(x=>x.id!==id)),[]);
  const updateStatutLivraison = useCallback((id,statut)=>{ setLivraisons(prev=>prev.map(x=>x.id===id?{...x,statut}:x)); },[]);

  const openAddClient = useCallback(()=>{ setEditClient(null); setShowFormClient(true); },[]);

  const nbAlertes = useMemo(()=>clients.filter(c=>alerteClient(c,passages)!=="ok").length,[clients,passages]);
  const nbAFacturer = useMemo(()=>livraisons.filter(l=>l.statut==="aFacturer").length,[livraisons]);
  const nbMois = useMemo(()=>clients.reduce((a,c)=>{ const prev=passagesParMois(c.saisons)[MOIS_NOW]||0; const eff=passages.filter(p=>p.clientId===c.id&&new Date(p.date).getMonth()+1===MOIS_NOW).length; return a+Math.max(0,prev-eff); },0),[clients,passages]);

  if(!loggedIn) return <><GlobalStyles/><LoginScreen onLogin={handleLogin}/></>;

  if(!ready) return (
    <>
    <GlobalStyles/>
    <div style={{height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:DS.bg,gap:16,fontFamily:"'Inter', -apple-system, system-ui, sans-serif"}}>
      <div className="scale-in" style={{width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,#0c1222,#1e3a5f)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 12px 40px rgba(12,18,34,0.35)"}}>{Ico.wave(42,"white")}</div>
      <div style={{fontWeight:900,fontSize:24,color:DS.blue,letterSpacing:-0.5}}>BRIBLUE</div>
      <div style={{color:DS.mid,fontSize:13}}>Chargement…</div>
    </div>
    </>
  );

  const NAV = [
    { id:"dashboard", l:"Accueil", icon:(a)=><svg width={22} height={22} viewBox="0 0 24 24" fill={a?"#0369a1":"none"} stroke={a?"#0369a1":"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg> },
    { id:"clients",   l:"Clients", icon:(a)=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?"#0369a1":"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></svg> },
    { id:"interventions", l:"Passages", icon:(a)=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?"#0369a1":"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg> },
  ];

  const PAGE_LABELS = { dashboard:`Bonjour Dorian`, clients:"Clients", passages:"Passages", interventions:"Passages" };

  return (
    <>
    <GlobalStyles/>
    <div style={{minHeight:"100vh",background:DS.bg,fontFamily:"'Inter', -apple-system, system-ui, sans-serif",maxWidth:isMobile?640:960,margin:"0 auto",position:"relative"}}>
      {/* HEADER */}
      <div style={{background:DS.white,padding:isMobile?"12px 16px":"14px 28px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 0 "+DS.border,backdropFilter:"blur(12px)",backgroundColor:"rgba(255,255,255,0.92)"}}>
        <div style={{width:42,height:42,borderRadius:14,background:"linear-gradient(135deg,#0c1222,#1e3a5f)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 12px rgba(12,18,34,0.25)"}}>{Ico.wave(24,"white")}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:14,color:DS.dark,letterSpacing:-0.3}}>BRIBLUE</div>
          <div style={{color:"#94a3b8",fontSize:11,fontWeight:500}}>Dorian · Technicien</div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {nbAlertes>0&&(
            <button onClick={()=>setShowModalAlertes(true)} className="btn-hover" style={{position:"relative",width:38,height:38,borderRadius:12,background:DS.redSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {Ico.alert(16,DS.red)}
              <span style={{position:"absolute",top:-4,right:-4,width:18,height:18,borderRadius:9,background:DS.red,color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #fff"}}>{nbAlertes}</span>
            </button>
          )}
          {(nbMois+nbAFacturer)>0&&(
            <button onClick={()=>setShowModalMois(true)} className="btn-hover" style={{position:"relative",width:38,height:38,borderRadius:12,background:DS.blueSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {Ico.clipboard(16,DS.blue)}
              <span style={{position:"absolute",top:-4,right:-4,width:18,height:18,borderRadius:9,background:DS.blue,color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #fff"}}>{nbMois+nbAFacturer}</span>
            </button>
          )}
          <button onClick={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} className="btn-hover" style={{width:38,height:38,borderRadius:12,background:DS.blueGrad,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px "+DS.blue+"44"}}>
            {Ico.clipboard(17,"#fff")}
          </button>
          <button onClick={openAddClient} className="btn-hover" style={{width:38,height:38,borderRadius:12,background:DS.purpleGrad,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px #7c3aed44"}}>
            {Ico.userPlus(17,"#fff")}
          </button>
          <button onClick={handleLogout} className="btn-hover" style={{width:38,height:38,borderRadius:12,background:DS.light,border:"1px solid "+DS.border,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* TITRE */}
      <div style={{padding:isMobile?"16px 16px 4px":"20px 28px 8px"}}>
        <h2 style={{margin:0,fontSize:isMobile?20:24,fontWeight:900,color:DS.dark,letterSpacing:-0.5}}>{PAGE_LABELS[page]} {page==="dashboard"&&"👋"}</h2>
        {page==="dashboard"&&<p style={{margin:"2px 0 0",color:DS.mid,fontSize:12,fontWeight:500}}>{MOIS_L[MOIS_NOW]} · {clients.length} clients actifs</p>}
      </div>

      {/* CONTENU */}
      <div style={{padding:isMobile?"6px 16px 110px":"8px 28px 110px"}}>
        {page==="dashboard"&&<Dashboard clients={clients} passages={passages} onClientClick={setFicheClient} onAddPassage={()=>{setDefaultClientId("");setShowFormPassage(true);}} onAddLivraison={()=>{setDefaultLivraisonClientId("");setShowFormLivraison(true);}} onAddClient={openAddClient}/>}
        {page==="clients"&&<PageClients clients={clients} passages={passages} onClientClick={setFicheClient} onAdd={openAddClient}/>}
        {(page==="passages"||page==="interventions")&&<PagePassages clients={clients} passages={passages} onAdd={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} onDelete={deletePassage} onEdit={openEditPassage}/>}
      </div>

      {/* NAV BAS */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:isMobile?640:960,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(12px)",borderTop:"1px solid "+DS.border,display:"flex",alignItems:"flex-end",boxShadow:"0 -2px 16px rgba(0,0,0,0.05)",zIndex:50,paddingBottom:"env(safe-area-inset-bottom,4px)"}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setPage(n.id)} style={{flex:1,padding:"10px 4px 12px",border:"none",cursor:"pointer",background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .15s"}}>
            {n.icon(page===n.id)}
            <span style={{fontSize:10,fontWeight:page===n.id?800:500,color:page===n.id?DS.blue:"#94a3b8"}}>{n.l}</span>
            {page===n.id && <div style={{width:20,height:3,borderRadius:2,background:DS.blueGrad,marginTop:1}}/>}
          </button>
        ))}
      </div>

      {/* MODALS */}
      {ficheClient&&(()=>{
        const latest=clients.find(c=>c.id===ficheClient.id)||ficheClient;
        return <FicheClient client={latest} passages={passages} livraisons={livraisons.filter(l=>l.clientId===latest.id)} onSaveLivraison={saveLivraison} onDeleteLivraison={deleteLivraison} onUpdateStatutLivraison={updateStatutLivraison} onClose={()=>setFicheClient(null)} onEdit={()=>{setEditClient(latest);setShowFormClient(true);setFicheClient(null);}} onDelete={()=>deleteClient(latest.id)} onAddPassage={()=>openAddPassageFromClient(latest.id)} onEditPassage={openEditPassage}/>;
      })()}

      {showFormClient&&<FormClient initial={editClient} clients={clients} onSave={saveClient} onClose={()=>{setShowFormClient(false);setEditClient(null);}}/>}
      {showFormPassage&&<FormPassage clients={clients} defaultClientId={defaultClientId} initial={editPassage} onSave={p=>savePassage(p)} onClose={()=>{setShowFormPassage(false);setEditPassage(null);}}/>}
      {showFormLivraison&&<FormLivraison clientId={defaultLivraisonClientId} clients={clients} onSave={l=>{saveLivraison(l);setShowFormLivraison(false);}} onClose={()=>setShowFormLivraison(false)}/>}

      {showModalAlertes&&(
        <Modal title="Alertes" onClose={()=>setShowModalAlertes(false)}>
          {clients.filter(c=>alerteClient(c,passages)!=="ok").length===0
            ? <div style={{textAlign:"center",color:DS.mid,padding:24}}>Aucune alerte</div>
            : clients.filter(c=>alerteClient(c,passages)!=="ok").map(c=>{
              const al=alerteClient(c,passages);const col=AC[al];const j=daysUntil(c.dateFin);
              return (
                <Card key={c.id} style={{marginBottom:10,cursor:"pointer"}} onClick={()=>{setFicheClient(c);setShowModalAlertes(false);}}>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <IcoBubble ico={Ico.alert(15,col.tx)} color={col.tx} size={40}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:14,color:DS.dark}}>{c.nom}</div>
                      <div style={{fontSize:12,color:DS.mid,marginTop:2}}>{al==="rouge"||al==="jaune"?(j>=0?`Expire dans ${j}j`:`Expiré il y a ${Math.abs(j)}j`):"Passages en retard"}</div>
                    </div>
                    <Tag color={col.tx}>{col.lbl}</Tag>
                  </div>
                </Card>
              );
            })
          }
        </Modal>
      )}

      {showModalMois&&(
        <Modal title={`${MOIS_L[MOIS_NOW]} — à faire`} onClose={()=>setShowModalMois(false)}>
          {clients.map(c=>{
            const prev=passagesParMois(c.saisons)[MOIS_NOW]||0;
            const eff=passages.filter(p=>p.clientId===c.id&&new Date(p.date).getMonth()+1===MOIS_NOW).length;
            const rest=Math.max(0,prev-eff);
            if(prev===0)return null;
            return (
              <Card key={c.id} style={{marginBottom:10,cursor:"pointer"}} onClick={()=>{setFicheClient(c);setShowModalMois(false);}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <Avatar nom={c.nom} size={40}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:13,color:DS.dark}}>{c.nom}</div>
                    <div style={{marginTop:5}}><ProgressBar value={eff} max={prev}/></div>
                    <div style={{fontSize:11,color:DS.mid,marginTop:3,fontWeight:600}}>{eff}/{prev} passages</div>
                  </div>
                  {rest>0?<Tag color={DS.orange}>{rest} restant{rest>1?"s":""}</Tag>:<IcoBubble ico={Ico.check(11,DS.green)} color={DS.green} size={26}/>}
                </div>
              </Card>
            );
          }).filter(Boolean)}
        </Modal>
      )}
    </div>
    </>
  );
}