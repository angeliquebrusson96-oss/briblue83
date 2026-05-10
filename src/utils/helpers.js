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

// ─── CALCUL PASSAGES / CONTRAT ────────────────────────────────────────────────

export const toNumber = (v, fallback = 0) => {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
};
export const dateOnly = (value) => {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
const _firstDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const _addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const _mergePlanObjects = (...plans) => {
  const merged = {};
  plans.filter(Boolean).forEach((plan) => {
    if (typeof plan !== "object" || Array.isArray(plan)) return;
    Object.entries(plan).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (typeof value === "object" && !Array.isArray(value) && typeof merged[key] === "object" && !Array.isArray(merged[key])) {
        merged[key] = { ...merged[key], ...value };
      } else { merged[key] = value; }
    });
  });
  return merged;
};
const _getMonthlyPlanObject = (client = {}) => _mergePlanObjects(
  client.moisParMois, client.passagesParMois, client.planningMensuel, client.planningPassages,
  client.planMensuel, client.saisons, client.planning?.moisParMois, client.planning?.passagesParMois,
  client.planning?.planningMensuel, client.contrat?.moisParMois, client.contrat?.passagesParMois,
  client.contrat?.planningMensuel, client.contrat?.planningPassages, client.contrat?.planMensuel,
  client.contrat?.saisons, client.contrat?.planning?.moisParMois, client.contrat?.planning?.passagesParMois,
  client.contrat?.planning?.planningMensuel
);
const _getMonthPlanEntry = (plan = {}, monthNumber) => {
  const monthNames = { 1:["janvier"],2:["fevrier","février"],3:["mars"],4:["avril"],5:["mai"],6:["juin"],7:["juillet"],8:["aout","août"],9:["septembre"],10:["octobre"],11:["novembre"],12:["decembre","décembre"] };
  const names = monthNames[monthNumber] || [];
  return plan[monthNumber]
    ?? plan[String(monthNumber)]
    ?? plan[String(monthNumber).padStart(2,"0")]
    ?? names.map(n=>plan[n]??plan[n.toUpperCase()]??plan[n.charAt(0).toUpperCase()+n.slice(1)]).find(v=>v!==undefined)
    ?? {};
};
export const getPlanForMonth = (client = {}, monthNumber) => {
  const plan = _getMonthlyPlanObject(client);
  const m = _getMonthPlanEntry(plan, monthNumber);
  if (typeof m === "number" || typeof m === "string") return { entretien: toNumber(m), controle: 0 };
  return {
    entretien: toNumber(m.entretien ?? m.passages ?? m.prevus ?? m.prévus ?? m.nb ?? m.nombre ?? m.total ?? 0),
    controle: toNumber(m.controle ?? m.contrôle ?? m.controles ?? m.contrôles ?? 0),
  };
};
const _hasMonthlyPlan = (client = {}) => Object.keys(_getMonthlyPlanObject(client) || {}).length > 0;
const _getPassagesAnnuelsSaisis = (client = {}) => {
  const value = client.passagesAnnuels ?? client.nbPassagesAnnuels ?? client.nombrePassagesAnnuels
    ?? client.nombrePassagesAnnuel ?? client.totalPassagesAnnuels ?? client.totalPassagesAnnuel
    ?? client.passagesContrat ?? client.nbPassagesContrat ?? client.nombrePassagesContrat
    ?? client.passagesPrevusContrat ?? client.passagesPrévusContrat ?? client.passagesPrevus
    ?? client.nbPassagesPrevus ?? client.nbPassages ?? client.nombrePassages
    ?? client.contrat?.passagesAnnuels ?? client.contrat?.nbPassagesAnnuels
    ?? client.contrat?.nombrePassagesAnnuels ?? client.contrat?.passagesPrevus
    ?? client.contrat?.nbPassages ?? client.contrat?.nombrePassages;
  return toNumber(value, 0);
};
export function calculerPassagesPrevusContrat(client = {}) {
  const debut = dateOnly(client.dateDebut || client.contrat?.dateDebut || client.contrat?.debut);
  const fin = dateOnly(client.dateFin || client.contrat?.dateFin || client.contrat?.fin);
  if (debut && fin && _hasMonthlyPlan(client)) {
    let cursor = _firstDayOfMonth(debut);
    const endMonth = _firstDayOfMonth(fin);
    const includeEndMonth = fin.getDate() > debut.getDate();
    const stop = includeEndMonth ? _addMonths(endMonth, 1) : endMonth;
    let total = 0, guard = 0;
    while (cursor < stop && guard < 60) {
      const m = getPlanForMonth(client, cursor.getMonth() + 1);
      total += m.entretien + m.controle;
      cursor = _addMonths(cursor, 1);
      guard++;
    }
    return total;
  }
  const totalSaisi = _getPassagesAnnuelsSaisis(client);
  if (totalSaisi > 0) return totalSaisi;
  if (_hasMonthlyPlan(client)) {
    return Array.from({ length: 12 }, (_, i) => { const m = getPlanForMonth(client, i+1); return m.entretien + m.controle; }).reduce((a,b)=>a+b,0);
  }
  return 0;
}
export function isPassageEffectue(p = {}) {
  const status = String(p.statut ?? p.status ?? p.etat ?? p.état ?? "").toLowerCase();
  const type = String(p.type ?? p.categorie ?? "").toLowerCase();
  // Passages explicitement annulés, planifiés ou RDV ne comptent pas
  if (/annul|prévu|prevu|planif|rdv|rendez|a venir|à venir/.test(status)) return false;
  if (/rdv|rendez|prévu|prevu|planif/.test(type)) return false;
  if (p.annule || p.annulé || p.cancelled || p.planifie || p.planifié || p.rdvSeulement || p.isRdvOnly) return false;
  // ok=false ne signifie que "rapport non finalisé", pas que la visite n'a pas eu lieu
  // On ne filtre plus sur ok ici — seul le statut annulé/planifié exclut une visite
  return true;
}
export function isPassageDansContrat(p = {}, client = {}) {
  if (!p.date) return true;
  const d = String(p.date).slice(0, 10);
  const debut = client.dateDebut ? String(client.dateDebut).slice(0, 10) : null;
  const fin = client.dateFin ? String(client.dateFin).slice(0, 10) : null;
  if (debut && d < debut) return false;
  if (fin && d > fin) return false;
  return true;
}
