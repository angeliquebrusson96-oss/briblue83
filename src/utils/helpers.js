// @ts-nocheck
import { MOIS_PAR_MOIS_DEF, SAISONS_META, MOIS, MOIS_L } from "./constants";

// ─── MIGRATION ────────────────────────────────────────────────────────────────
// Migration: old saisons format OR moisParMois → normalized moisParMois (keys always integers)
export function migrateMois(data) {
  if (!data) return {...MOIS_PAR_MOIS_DEF};
  // Already mois-par-mois? (keys 1-12 as string or number)
  if (data["1"] || data[1]) {
    const r = {};
    for (let m=1;m<=12;m++) { const v=data[m]||data[String(m)]||{entretien:0,controle:0}; r[m]={entretien:v.entretien??0,controle:v.controle??0}; }
    return r;
  }
  // Old saisons format → convert
  const SM = {hiver:[12,1,2],printemps:[3,4,5],ete:[6,7,8],automne:[9,10,11]};
  const r = {};
  for (let m=1;m<=12;m++) r[m]={entretien:0,controle:0};
  for (const [k,mois] of Object.entries(SM)) {
    const v = data[k]; if (!v) continue;
    const e = typeof v === "number" ? v : v.entretien ?? 0;
    const c = typeof v === "number" ? 0 : v.controle ?? 0;
    for (const m of mois) { r[m] = {entretien:e, controle:c}; }
  }
  return r;
}

export function getMoisVal(mpm, m) { const d = migrateMois(mpm); return d[m] || d[String(m)] || {entretien:0,controle:0}; }

// Planning brut sans déduction automatique — retourne simplement le planning prévu par mois
export function getPlanningMois(mpm) {
  const plan = {};
  for (let m = 1; m <= 12; m++) {
    const v = getMoisVal(mpm, m);
    plan[m] = { e: v.entretien, c: v.controle };
  }
  return plan;
}

// ─── SAISON / MOIS HELPERS ───────────────────────────────────────────────────
export function getSaison(m) {
  for (const [k,s] of Object.entries(SAISONS_META)) if (s.mois.includes(m)) return k;
  return "ete";
}

export function getEntretienMois(mpm, m) { return getMoisVal(mpm, m).entretien; }
export function getControleMois(mpm, m) { return getMoisVal(mpm, m).controle; }

export function totalAnnuel(mpm, type="all") {
  let t=0;
  for (let m=1;m<=12;m++) {
    const v = getMoisVal(mpm, m);
    if (type==="entretien") t+=v.entretien;
    else if (type==="controle") t+=v.controle;
    else t+=v.entretien+v.controle;
  }
  return t;
}

export function daysUntil(d) {
  if (!d) return null;
  return Math.round((new Date(d) - new Date()) / 86400000);
}

export function isEntretienType(type) {
  const t = (type||"").toLowerCase();
  return t.includes("entretien") || t.includes("visite complète") || t.includes("visite technique") || t.includes("rattrapage");
}

export function isControleType(type) {
  const t = (type||"").toLowerCase();
  return t.includes("contrôle") || t.includes("controle");
}

// ─── DATE / TIME ──────────────────────────────────────────────────────────────
export const TODAY = new Date().toISOString().split("T")[0];
export const MOIS_NOW = new Date().getMonth() + 1;
export const YEAR_NOW = new Date().getFullYear();

// ─── PASSAGE FIELD HELPERS ───────────────────────────────────────────────────
export const getPH   = p => { const v = p.tPH || p.ph; return v && Number(v)>0 ? Number(v) : null; };
export const getCL   = p => { const v = p.tChlore || p.chloreLibre || p.chlore; return v && Number(v)>0 ? Number(v) : null; };
export const getTemp = p => { const v = p.temperature; return v && Number(v)>0 ? Number(v) : null; };

export const getResumePassage = p => {
  const parts = [];
  if (p.actions) parts.push(p.actions);
  else {
    const corr = [
      p.corrChlore   && "Chlore: "+p.corrChlore,
      p.corrPH       && "pH: "+p.corrPH,
      p.corrAlgicide && "Algicide: "+p.corrAlgicide,
      p.corrAlcafix  && "Alcafix: "+p.corrAlcafix,
      p.corrSel      && "Sel: "+p.corrSel,
      p.corrAutre    && p.corrAutre,
    ].filter(Boolean);
    if (corr.length) parts.push("Produits: "+corr.join(", "));
  }
  if (p.obs && p.obs !== p.actions) parts.push(p.obs);
  if (p.commentaires && p.commentaires !== p.obs) parts.push(p.commentaires);
  return parts.join(" · ") || null;
};

// ─── CLIENT ALERTE ───────────────────────────────────────────────────────────
export function alerteClient(c, passages) {
  const j = daysUntil(c.dateFin);
  const cs = c.dateDebut ? c.dateDebut.slice(0,10) : null;
  const ce = c.dateFin ? c.dateFin.slice(0,10) : null;
  const today = TODAY;

  // Contrat pas encore commencé → ok
  if (cs && today < cs) return "ok";
  // Fin de contrat proche
  if (j !== null && j >= 0 && j <= 30) return "rouge";
  if (j !== null && j > 30 && j <= 60) return "jaune";

  const now = new Date();
  const moisCur = now.getMonth() + 1;
  const yearCur = now.getFullYear();
  const mpm = c.moisParMois || c.saisons || {};

  // Passages dans la plage du contrat
  const passContrat = passages.filter(p => {
    if (p.clientId !== c.id) return false;
    if (cs && ce) { const d = String(p.date).slice(0,10); return d >= cs && d <= ce; }
    return new Date(p.date).getFullYear() === yearCur;
  });

  // Planning brut (sans déduction automatique)
  const mpmPlan = getPlanningMois(mpm);

  // Ne vérifier que les mois qui sont DANS la plage du contrat ET passés
  let retard = false;
  for (let m = 1; m < moisCur; m++) {
    const effPlan = (mpmPlan[m]?.e||0) + (mpmPlan[m]?.c||0);
    if (effPlan === 0) continue;
    const moisStr = `${yearCur}-${String(m).padStart(2,'0')}-01`;
    if (cs && moisStr < cs.slice(0,8)+'01') continue;
    if (ce && moisStr > ce) continue;
    const done = passContrat.filter(p => {
      const d = new Date(p.date);
      return d.getMonth()+1 === m && d.getFullYear() === yearCur;
    }).length;
    if (done < effPlan) { retard = true; break; }
  }
  if (retard) return "orange";

  // Mois EN COURS dans la plage du contrat
  const effCurPlan = (mpmPlan[moisCur]?.e||0) + (mpmPlan[moisCur]?.c||0);
  if (effCurPlan > 0) {
    const moisCurStr = `${yearCur}-${String(moisCur).padStart(2,'0')}-01`;
    const inRange = (!cs || moisCurStr >= cs.slice(0,8)+'01') && (!ce || moisCurStr <= ce);
    if (inRange) {
      const doneCur = passContrat.filter(p => {
        const d = new Date(p.date);
        return d.getMonth()+1 === moisCur && d.getFullYear() === yearCur;
      }).length;
      if (doneCur < effCurPlan) return "aFaire";
    }
  }

  return "ok";
}

// ─── UID ──────────────────────────────────────────────────────────────────────
export function uid() { return crypto.randomUUID(); }

// ─── MENSUALITÉS ─────────────────────────────────────────────────────────────
/**
 * calcMensualites(prixAnnuel)
 * Si prixAnnuel / 12 n'est pas un entier :
 *   - mois 1 = arrondi au centime supérieur pour absorber le reste
 *   - mois 2-12 = Math.floor(prixAnnuel / 12 * 100) / 100
 * Garantit que la somme des 12 mensualités == prixAnnuel exactement.
 *
 * Retourne { m1, m11, estRond, total }
 */
export function calcMensualites(prixAnnuel) {
  if (!prixAnnuel || prixAnnuel <= 0) return { m1: 0, m11: 0, estRond: true, total: 0 };
  const base = Math.floor(prixAnnuel / 12 * 100) / 100;
  const somme11 = Math.round(base * 11 * 100) / 100;
  const m1 = Math.round((prixAnnuel - somme11) * 100) / 100;
  const estRond = m1 === base;
  return { m1, m11: base, estRond, total: prixAnnuel };
}

// ─── RAPPORT STATUS ──────────────────────────────────────────────────────────
export function normalizeRapportStatus(s) {
  if (!s) return "cree";
  const m = { created:"cree", sent:"envoye", read:"lu", validated:"valide" };
  return m[s] || s;
}

export function getRapportStatus(p) {
  return normalizeRapportStatus(p.rapportStatut || p.rapportStatus);
}

// ─── CARNET CODE ─────────────────────────────────────────────────────────────
export function generateCarnetCode(clientId) {
  const hash = clientId.split("").reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0)|0,0);
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const prefix = letters[(Math.abs(hash)%24)] + letters[(Math.abs(hash>>4)%24)];
  const num = String(Math.abs(hash)%9000+1000);
  return prefix+"-"+num;
}

// ─── ICS EXPORT ──────────────────────────────────────────────────────────────
export function exportRdvToICS(rdv, client) {
  const dt = rdv.date.replace(/-/g, "");
  const heure = (rdv.heure || "09:00").replace(":", "");
  const duree = parseInt(rdv.duree, 10) || 60;
  const startMinutes = parseInt(heure.slice(0, 2), 10) * 60 + parseInt(heure.slice(2), 10);
  const endMinutes = startMinutes + duree;
  const endH = Math.floor(endMinutes / 60);
  const endM = endMinutes % 60;
  const endTime = String(endH).padStart(2, "0") + String(endM).padStart(2, "0");

  const desc = [
    rdv.description || "",
    client ? "Client: " + (client.nom || "") : "",
    client && client.adresse ? "Adresse: " + client.adresse : "",
  ].filter(Boolean).join("\\n");

  const summary = "BRIBLUE - " + (rdv.type || "Rendez-vous") + (client ? " - " + (client.nom || "") : "");
  const locationLine = client && client.adresse ? "LOCATION:" + client.adresse : "";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BRIBLUE//CRM//FR",
    "BEGIN:VEVENT",
    "DTSTART:" + dt + "T" + heure + "00",
    "DTEND:" + dt + "T" + endTime + "00",
    "SUMMARY:" + summary,
    "DESCRIPTION:" + desc,
    locationLine,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:RDV BRIBLUE dans 30 min",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `BRIBLUE_RDV_${dt}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
