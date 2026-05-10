// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from "react";
import { DS, Ico, MOIS, MOIS_L, RAPPORT_STATUS } from "../utils/constants";
import { TODAY, getRapportStatus, isEntretienType, isControleType, getPH, getCL, getTemp, getResumePassage, normalizeRapportStatus, migrateMois, totalAnnuel, calcMensualites } from "../utils/helpers";
import { useIsMobile, Modal, BtnPrimary, Card, Section, FmField, FmSectionTitle, FmHeader, FmSteps, DraftBanner, PhotoPicker, SunBurstActions, SunBurstFormNav, RapportStatusPicker, Tag, Avatar } from "./ui";
import { toastWarn, toastSuccess, toastInfo, showConfirm } from "../styles";

// ─── PRODUITS PAR DÉFAUT ────────────────────────────────────────────────────
const PRODUITS_DEFAUT = ["Chlore lent Galet","PH minus","Flocculant","Anti-calcaire","Anti-Algues","Anti-Phosphate","Éponge Magique","Filtre à cartouche","Tac+","Chlore granule","Hypochlorite","Anti-Algues moutarde","Sac de sel"];

const ETAT_LOCAL_OPTIONS = ["Nettoyage du sol","Trace d'eau au sol","Trace d'eau au mur","Fuite plomberie","Fuite moteur","Sur filtre ?"];

// ─── HELPERS LOCAUX ──────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function genererContratHTML(client, sigPrestataire="", sigClient="") {
  const mpm = migrateMois(client.moisParMois||client.saisons);
  const totalE = totalAnnuel(client.moisParMois||client.saisons,"entretien");
  const totalC = totalAnnuel(client.moisParMois||client.saisons,"controle");
  const total = totalE + totalC;
  const prixE = client.prixPassageE || 0;
  const prixC = client.prixPassageC || 0;
  const totalPrixE = totalE * prixE;
  const totalPrixC = totalC * prixC;
  const totalAnnuelPrix = totalPrixE + totalPrixC;
  const { m1, m11, estRond } = calcMensualites(totalAnnuelPrix);
  const dateContrat = client.dateDebut ? new Date(client.dateDebut).toLocaleDateString("fr") : "—";
  const dateFin = client.dateFin ? new Date(client.dateFin).toLocaleDateString("fr") : "—";
  let moisRows = "";
  for (let m=1;m<=12;m++) {
    const mv = mpm[m] || {entretien:0,controle:0};
    moisRows += `<tr><td>${MOIS_L[m]}</td><td class="center">${mv.entretien||"—"}</td><td class="center">${mv.controle||"—"}</td></tr>`;
  }
  moisRows += `<tr class="total-row"><td><strong>TOTAL DE PASSAGE</strong></td><td class="center"><strong>${totalE}</strong></td><td class="center"><strong>${totalC}</strong></td></tr>`;
  const sigPrestaHTML = sigPrestataire
    ? `<img src="${sigPrestataire}" style="max-height:70px;display:block;margin-top:8px;border-radius:6px;"/>`
    : `<canvas id="sigPresta" width="300" height="80" style="border:1.5px dashed #cbd5e1;border-radius:8px;cursor:crosshair;display:block;margin-top:8px;width:100%;touch-action:none;"></canvas><p style="font-size:10px;color:#94a3b8;margin-top:4px;">Signez dans le cadre ci-dessus</p>`;
  const sigClientHTML = sigClient
    ? `<img src="${sigClient}" style="max-height:70px;display:block;margin-top:8px;border-radius:6px;"/>`
    : `<canvas id="sigClient" width="300" height="80" style="border:1.5px dashed #cbd5e1;border-radius:8px;cursor:crosshair;display:block;margin-top:8px;width:100%;touch-action:none;"></canvas><p style="font-size:10px;color:#94a3b8;margin-top:4px;">Signez dans le cadre ci-dessus</p>`;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Contrat BRIBLUE — ${client.nom}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;font-size:12px;color:#1e293b;background:#fff}
.page{max-width:780px;margin:0 auto;padding:32px}
h1{font-size:28px;font-weight:900;color:#0c1222;text-align:center;letter-spacing:2px;margin-bottom:4px}
.section{margin-bottom:20px}
.section-title{background:linear-gradient(135deg,#0c1222,#1a365d);color:#fff;padding:10px 18px;border-radius:10px 10px 0 0;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:1px}
table{width:100%;border-collapse:collapse;border:1px solid #e2e8f0}
table th{background:#f0f9ff;color:#0369a1;font-size:10px;text-transform:uppercase;letter-spacing:.5px;padding:8px 12px;text-align:left;border:1px solid #e2e8f0}
table td{padding:7px 12px;border:1px solid #e2e8f0;font-size:12px}
.center{text-align:center}
.total-row{background:#f0f9ff;font-weight:700}
.info-grid{display:grid;grid-template-columns:140px 1fr;border:1px solid #e2e8f0;border-radius:0 0 10px 10px;overflow:hidden}
.info-grid .label{background:#f8fafc;padding:8px 14px;font-weight:700;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0}
.info-grid .value{padding:8px 14px;font-weight:700;font-size:13px;color:#0c1222;border-bottom:1px solid #e2e8f0}
.recap{background:linear-gradient(135deg,#0c1222,#1a365d);color:#fff;border-radius:12px;padding:20px 24px;margin:20px 0}
.recap h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.7);margin-bottom:8px}
.recap .prix{font-size:24px;font-weight:900;margin-bottom:12px}
.mensualite{background:rgba(255,255,255,0.1);border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border:1px solid rgba(255,255,255,0.15)}
.mensualite .mlabel{font-size:11px;color:rgba(255,255,255,0.7);font-weight:600}
.mensualite .montant{font-size:20px;font-weight:900;color:#22d3ee}
.conditions{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-bottom:20px}
.conditions h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:10px}
.conditions li{margin-bottom:6px;font-size:11px;color:#475569;line-height:1.5}
.detail{border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:20px}
.detail h4{background:#f0f9ff;padding:10px 16px;font-size:11px;font-weight:800;color:#0369a1;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e2e8f0}
.detail ul{padding:12px 16px 12px 32px;font-size:11px;color:#475569;line-height:1.8}
.signatures{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:30px}
.sig-box{border:1px solid #e2e8f0;border-radius:12px;padding:16px;}
.sig-label{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.sig-date{font-size:11px;color:#64748b;margin-bottom:6px}
.btn-clear{background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;padding:6px 14px;border-radius:8px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;margin-top:6px}
.footer{margin-top:24px;text-align:center;font-size:10px;color:#94a3b8;padding-top:16px;border-top:1px solid #e2e8f0}
.no-print{margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap}
.btn-print{background:linear-gradient(135deg,#0c1222,#1a365d);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-weight:700;cursor:pointer;font-size:15px;font-family:inherit}
.btn-dl{background:linear-gradient(135deg,#0369a1,#0ea5e9);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-weight:700;cursor:pointer;font-size:15px;font-family:inherit}
@media print{.page{padding:16px}.no-print{display:none!important}canvas{border:1px solid #e2e8f0!important}.btn-clear{display:none!important}@page{margin:10mm}}
</style></head><body>
<div class="page">
<div class="no-print">
  <button onclick="window.print()" class="btn-print">🖨️ Imprimer / PDF</button>
  <button onclick="(function(){var a=document.createElement('a');a.href='data:text/html;charset=utf-8,'+encodeURIComponent(document.documentElement.outerHTML);a.download='Contrat_BRIBLUE_${client.nom.replace(/\s/g,'_')}.html';document.body.appendChild(a);a.click();document.body.removeChild(a);})()" class="btn-dl">💾 Enregistrer</button>
</div>
<div style="text-align:center;padding:0 0 14px"><span style="font-size:40px;font-weight:900;color:#0c1222;letter-spacing:-2px">Bri<span style="color:#0369a1">&#x2019;</span>blue</span></div>
<h1 style="margin-top:0">CONTRAT PISCINE</h1>
<div style="text-align:center;color:#0369a1;font-size:13px;font-weight:700;margin-bottom:20px;">Création · Traitement de l'eau · Installation · Dépannage</div>
<div class="section">
  <div class="section-title">Informations du contrat</div>
  <div class="info-grid">
    <div class="label">Client</div><div class="value">${client.nom}</div>
    <div class="label">Date du contrat</div><div class="value">${dateContrat}</div>
    <div class="label">Début</div><div class="value">${dateContrat}</div>
    <div class="label">Fin</div><div class="value">${dateFin}</div>
    <div class="label">Total passages</div><div class="value">${total} passages annuels</div>
  </div>
</div>
<div class="section">
  <div class="section-title">Planning des interventions</div>
  <table><thead><tr><th>Mois</th><th class="center">Nettoyage complet</th><th class="center">Contrôle de l'eau</th></tr></thead><tbody>${moisRows}</tbody></table>
</div>
<div class="section">
  <div class="section-title">Tarifs des prestations</div>
  <table><thead><tr><th>Type</th><th class="center">Passages</th><th class="center">Prix/passage</th><th class="center">Total</th></tr></thead>
  <tbody>
    <tr><td>Nettoyage complet</td><td class="center">${totalE}</td><td class="center">${prixE} €</td><td class="center"><strong>${totalPrixE} €</strong></td></tr>
    <tr><td>Contrôle de l'eau</td><td class="center">${totalC||"—"}</td><td class="center">${prixC||"—"} €</td><td class="center"><strong>${totalPrixC||"—"} €</strong></td></tr>
  </tbody></table>
</div>
<div class="recap">
  <h3>Récapitulatif financier</h3>
  <div class="prix">Prix annuel : ${totalAnnuelPrix.toLocaleString("fr")} €</div>
  ${estRond ? `
  <div class="mensualite">
    <div><div class="mlabel">Mensualité</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">12 × ${m11} €</div></div>
    <div class="montant">${m11} € / mois</div>
  </div>
  ` : `
  <div class="mensualite" style="flex-direction:column;gap:8px">
    <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
      <div><div class="mlabel">1ᵉʳ prélèvement (ajustement)</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">Absorbe le reste d'arrondi</div></div>
      <div class="montant" style="color:#fbbf24">${m1} €</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;width:100%;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px">
      <div><div class="mlabel">Mensualités 2 à 12</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">11 prélèvements identiques</div></div>
      <div class="montant">${m11} € / mois</div>
    </div>
  </div>
  `}
</div>
${client.notesTarifaires ? `
<div class="conditions" style="background:#f0f9ff;border-color:#bae6fd;">
  <h3 style="color:#0891b2;">📝 Notes tarifaires particulières</h3>
  <ul>
    ${client.notesTarifaires.split("\n").filter(l=>l.trim()).map(l=>`<li style="color:#0e7490;font-weight:600;">${l.trim()}</li>`).join("")}
  </ul>
</div>
` : ""}
<div class="conditions">
  <h3>Conditions &amp; Informations</h3>
  <ul>
    <li>Utilisation exclusive des produits de la société pour garantir la qualité du traitement.</li>
    <li><strong>Produits non inclus</strong> dans le forfait annuel.</li>
    <li>Intervention supplémentaire possible en cas d'aléas climatiques (fortes pluies / vent).</li>
    <li>Rapport d'entretien transmis par email après chaque passage.</li>
    <li>Kit d'entretien fourni et facturé séparément (brosse, épuisette, manche, tuyau).</li>
  </ul>
</div>
<div class="detail"><h4>Nettoyage complet du bassin</h4><ul><li>Passage épuisette si nécessaire</li><li>Nettoyage au balai aspirateur</li><li>Vérification et ajustement (chlore, pH)</li><li>Contrôle technique (filtre, pompe)</li><li>Livraison de produits si besoin</li></ul></div>
<div class="detail"><h4>Contrôle de l'eau</h4><ul><li>Nettoyage rapide surface à l'épuisette</li><li>Vérification et ajustement (chlore, pH)</li><li>Contrôle technique</li><li>Livraison de produits si besoin</li></ul></div>
<div class="signatures">
  <div class="sig-box">
    <div class="sig-label">Le prestataire — BRIBLUE</div>
    <div class="sig-date">Dorian Briaire · ${new Date().toLocaleDateString("fr")}</div>
    ${sigPrestaHTML}
    ${!sigPrestataire ? `<button class="btn-clear" onclick="clearSig('sigPresta')">Effacer</button>` : ""}
  </div>
  <div class="sig-box">
    <div class="sig-label">Le client — ${client.nom}</div>
    <div class="sig-date">Lu et approuvé · ${new Date().toLocaleDateString("fr")}</div>
    ${sigClientHTML}
    ${!sigClient ? `<button class="btn-clear" onclick="clearSig('sigClient')">Effacer</button>` : ""}
  </div>
</div>
<div class="footer">BRIBLUE · SIRET 84345436400053 · La Seyne-sur-Mer · 06 67 18 61 15</div>
</div>
<script>
function setupCanvas(id){const c=document.getElementById(id);if(!c)return;const ctx=c.getContext('2d');let drawing=false;function pos(e){const r=c.getBoundingClientRect();const s=e.touches?e.touches[0]:e;return{x:(s.clientX-r.left)*(c.width/r.width),y:(s.clientY-r.top)*(c.height/r.height)};}
c.addEventListener('mousedown',e=>{drawing=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.strokeStyle='#1b3a5c';ctx.lineWidth=2;ctx.lineCap='round';});
c.addEventListener('mousemove',e=>{if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();});
c.addEventListener('mouseup',()=>drawing=false);
c.addEventListener('touchstart',e=>{e.preventDefault();drawing=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.strokeStyle='#1b3a5c';ctx.lineWidth=2;ctx.lineCap='round';},{passive:false});
c.addEventListener('touchmove',e=>{e.preventDefault();if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();},{passive:false});
c.addEventListener('touchend',()=>drawing=false);}
function clearSig(id){const c=document.getElementById(id);if(c)c.getContext('2d').clearRect(0,0,c.width,c.height);}
setupCanvas('sigPresta');setupCanvas('sigClient');
</script>
</body></html>`;
}

export function ouvrirContrat(client, sigPrestataire="", sigClient="") {
  const html = genererContratHTML(client, sigPrestataire, sigClient);
  const blob = new Blob([html], {type:"text/html;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
}

export async function envoyerContratSignature(client) {
  if (!client?.email) { toastWarn("Aucun email renseigné pour ce client."); return; }
  const sigLink = `${window.location.origin}/sign.html?clientId=${client.id}&contractId=CT-${client.id}`;
  const dateStr = new Date().toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"});
  const htmlEmail = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:16px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
  <tr><td style="background:#0c1222;padding:20px 28px;border-radius:10px 10px 0 0;">
    <span style="font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:2px;">BRI BLUE</span>
  </td></tr>
  <tr><td style="background:#ffffff;padding:28px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:15px;color:#1e293b;margin:0 0 12px;">Bonjour <strong>${client.nom}</strong>,</p>
    <p style="font-size:14px;color:#475569;margin:0 0 20px;line-height:1.6;">Votre contrat d'entretien piscine BRIBLUE est prêt. Veuillez cliquer sur le lien ci-dessous pour le consulter et le signer :</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr><td style="background:#0369a1;border-radius:10px;padding:14px 24px;text-align:center;">
        <a href="${sigLink}" style="color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;display:block;">➡ Cliquez ici pour signer votre contrat</a>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#64748b;margin:0 0 8px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
    <p style="font-size:11px;color:#0369a1;word-break:break-all;margin:0;">${sigLink}</p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:14px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">
    <p style="margin:0;font-size:12px;color:#64748b;"><strong>Dorian Briaire</strong><br/>Technicien de Piscine - BRI BLUE</p>
  </td></tr>
</table>
</body></html>`;
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `BRIBLUE <rapport-piscine@briblue83.com>`,
        to: [client.email],
        subject: `Votre contrat BRIBLUE — À signer`,
        html: htmlEmail,
        text: `Bonjour ${client.nom},\n\nVotre contrat BRIBLUE est prêt à signer.\n\nLien de signature :\n${sigLink}\n\nCordialement,\nDorian Briaire\nTechnicien de Piscine - BRI BLUE`,
      }),
    });
    const data = await res.json();
    if (res.ok) { toastSuccess(`Contrat envoyé à ${client.email} !`); }
    else { toastError(`Erreur : ${data?.message || JSON.stringify(data)}`); }
  } catch(err) { toastError(`Erreur réseau : ${err.message}`); }
}

function genererHTMLRapport(passage, client) {
  const d = new Date(passage.date).toLocaleDateString("fr", {day:"2-digit",month:"long",year:"numeric"});
  const val = (v, u="") => (v !== "" && v !== null && v !== undefined) ? `<strong>${v}</strong>${u?" "+u:""}` : `<span class="empty">—</span>`;
  const liste = (arr) => arr?.length ? arr.join(", ") : "—";
  const ouinon = (v) => v===true?`<span class="badge ok">OUI</span>`:v===false?`<span class="badge no">NON</span>`:"—";
  const etoiles = (n) => n>0 ? `<span class="stars">${"★".repeat(n)}${"☆".repeat(5-n)}</span> <span class="star-num">${n}/5</span>` : "—";
  const sigTech = passage.signatureTech ? `<img src="${passage.signatureTech}" class="sig-img"/>` : `<div class="sig-empty">Non signée</div>`;
  const sigClient = passage.signatureClient ? `<img src="${passage.signatureClient}" class="sig-img"/>` : `<div class="sig-empty">Non signée</div>`;
  const hasPhotos = passage.photoArrivee || passage.photoDepart || (passage.photos||[]).some(Boolean);
  const allPhotos = [
    passage.photoArrivee ? {src:passage.photoArrivee, label:"À l'arrivée"} : null,
    ...((passage.photos||[]).map((p,i)=>p?{src:p,label:`Photo ${i+2}`}:null)),
    passage.photoDepart ? {src:passage.photoDepart, label:"Au départ"} : null,
  ].filter(Boolean);
  const sectionPhotos = hasPhotos ? `
<div class="section">
  <div class="section-title"><span class="sec-icon">📸</span> Photos d'intervention</div>
  <div class="section-body" style="display:grid;grid-template-columns:${allPhotos.length===1?"1fr":"1fr 1fr"};gap:16px">
    ${allPhotos.map(p=>`<div><div class="photo-label">${p.label}</div><img src="${p.src}" class="photo"/></div>`).join("")}
  </div>
</div>` : "";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<title>Rapport BRIBLUE — ${client?.nom||""} — ${d}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
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
<div class="no-print"><button onclick="window.print()" style="background:linear-gradient(135deg,#0c1222,#1a365d);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-weight:700;cursor:pointer;font-size:15px;font-family:inherit;box-shadow:0 4px 12px rgba(12,18,34,0.3);">🖨️ Imprimer / PDF</button></div>
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
<div class="section">
  <div class="section-title"><span class="sec-icon">🏊</span> Bassin &amp; Intervention</div>
  <div class="section-body grid">
    <div class="field"><div class="field-label">Type</div><div class="field-value">${passage.type||"—"}</div></div>
    <div class="field"><div class="field-label">Type bassin</div><div class="field-value">${client?.bassin||"—"}</div></div>
    <div class="field"><div class="field-label">Volume</div><div class="field-value">${client?.volume?client.volume+" m³":"—"}</div></div>
  </div>
</div>
<div class="section">
  <div class="section-title"><span class="sec-icon">💧</span> Analyses eau</div>
  <div class="section-body grid">
    <div class="field"><div class="field-label">Chlore libre</div><div class="field-value">${val(passage.chloreLibre,"ppm")}</div></div>
    <div class="field"><div class="field-label">pH</div><div class="field-value">${val(passage.ph)}</div></div>
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
    <div class="field"><div class="field-label">Alcafix</div><div class="field-value">${val(passage.corrAlcafix)}</div></div>
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
<div class="footer">Document généré le ${new Date().toLocaleDateString("fr")} · <strong>BRIBLUE</strong> · 06 67 18 61 15</div>
</div>
</body></html>`;
}

export function ouvrirRapport(passage, client) {
  const html = genererHTMLRapport(passage, client);
  const blob = new Blob([html], {type:"text/html;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
}

export async function envoyerEmail(passage, client, onSent) {
  if (!client?.email) { toastWarn("Aucun email renseigné pour ce client."); return; }
  const dateStr = new Date(passage.date).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"});
  const htmlRapport = genererHTMLRapport(passage, client);
  const htmlEmail = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;"><tr><td style="background:#0c1222;padding:20px 28px;border-radius:10px 10px 0 0;"><span style="font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:2px;">BRI BLUE</span></td></tr><tr><td style="background:#ffffff;padding:28px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;"><p style="font-size:15px;color:#1e293b;margin:0 0 12px;">Bonjour <strong>${client?.nom||""}</strong>,</p><p style="font-size:14px;color:#475569;margin:0 0 20px;line-height:1.6;">Votre rapport d'entretien piscine du <strong>${dateStr}</strong> est disponible.</p></td></tr><tr><td style="background:#f8fafc;padding:16px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;"><p style="margin:0;font-size:12px;color:#64748b;"><strong>Dorian Briaire</strong><br/>Technicien de Piscine — BRI BLUE</p></td></tr></table></body></html>`;
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `BRIBLUE <rapport-piscine@briblue83.com>`,
        to: [client.email],
        subject: `Rapport entretien piscine — ${dateStr}`,
        html: htmlEmail,
        text: `Bonjour ${client?.nom||""},\n\nVotre rapport d'entretien piscine du ${dateStr} est disponible.\n\nCordialement,\nDorian Briaire`,
        attachments: [{
          filename: `Rapport_BRIBLUE_${(client?.nom||"client").replace(/\s/g,"_")}_${passage.date}.html`,
          content: btoa(unescape(encodeURIComponent(htmlRapport))),
        }],
      }),
    });
    const data = await res.json();
    if (res.ok) {
      if (onSent) onSent({ ...passage, rapportStatut: "envoye", rapportEnvoyeAt: new Date().toISOString() });
      toastSuccess(`Fiche envoyée à ${client.email} !`);
    } else { toastError(`Erreur envoi : ${data?.message || JSON.stringify(data)}`); }
  } catch(err) { toastError(`Erreur réseau : ${err.message}`); }
}

// ─── COMPOSANTS LOCAUX ───────────────────────────────────────────────────────

function MultiCheck({ label, options, values, onChange }) {
  const toggle = (v) => { const arr = values.includes(v) ? values.filter(x=>x!==v) : [...values,v]; onChange(arr); };
  return (
    <div>
      {label && (
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <span style={{fontSize:15,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7}}>{label}</span>
          {values.length>0 && <span style={{background:DS.blue,color:"#fff",fontSize:15,fontWeight:800,borderRadius:10,padding:"1px 7px",minWidth:18,textAlign:"center"}}>{values.length}</span>}
        </div>
      )}
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {options.map(o=>{
          const sel=values.includes(o);
          return (
            <button key={o} onClick={()=>toggle(o)} className="btn-hover" style={{display:"inline-flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:20,border:`1.5px solid ${sel?DS.blue:DS.border}`,background:sel?DS.blueGrad:DS.white,cursor:"pointer",fontFamily:"inherit",fontWeight:sel?700:500,fontSize:15,color:sel?"#fff":DS.mid,boxShadow:sel?"0 2px 8px "+DS.blue+"33":"none",transition:"all .2s",WebkitTapHighlightColor:"transparent"}}>
              {sel
                ? <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={DS.border} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              }
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OuiNon({ label, value, onChange }) {
  return (
    <div>
      {label && <span style={{fontSize:15,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:7}}>{label}</span>}
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>onChange(true)} className="btn-hover" style={{flex:1,padding:"10px",borderRadius:10,border:`1.5px solid ${value===true?DS.green:DS.border}`,background:value===true?DS.greenSoft:DS.white,color:value===true?DS.green:DS.mid,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s",boxShadow:value===true?"0 2px 8px "+DS.green+"33":"none"}}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Oui
        </button>
        <button onClick={()=>onChange(false)} className="btn-hover" style={{flex:1,padding:"10px",borderRadius:10,border:`1.5px solid ${value===false?DS.red:DS.border}`,background:value===false?DS.redSoft:DS.white,color:value===false?DS.red:DS.mid,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s",boxShadow:value===false?"0 2px 8px "+DS.red+"33":"none"}}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Non
        </button>
      </div>
    </div>
  );
}

function StarRating({ value, onChange }) {
  const labels=["","Mauvais","Passable","Bien","Très bien","Excellent"];
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={()=>onChange(n)} style={{background:"none",border:"none",cursor:"pointer",padding:"2px",lineHeight:1,transition:"all .2s",transform:n<=value?"scale(1.15)":"scale(1)"}}>
            {Ico.star(28,n<=value?"#f59e0b":"#e2e8f0",n<=value?"#f59e0b":"none")}
          </button>
        ))}
      </div>
      {value>0 && (
        <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"#fffbeb",borderRadius:8,padding:"4px 10px",border:"1px solid #fcd34d"}}>
          <span style={{fontSize:15,fontWeight:800,color:"#d97706"}}>{value}/5</span>
          <span style={{fontSize:15,color:"#92400e",fontWeight:500}}>{labels[value]}</span>
        </div>
      )}
    </div>
  );
}

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
      {label && <span style={{fontSize:15,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>{label}</span>}
      <div style={{border:"1.5px solid "+DS.border,borderRadius:DS.radius,overflow:"hidden",background:DS.light,position:"relative"}}>
        <canvas ref={canvasRef} width={500} height={140} style={{display:"block",width:"100%",height:140,touchAction:"none",cursor:"crosshair"}}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
        {!hasSign && <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
          <span style={{color:DS.border,fontSize:15,display:"flex",alignItems:"center",gap:6}}>{Ico.sign(14,"#cbd5e1")} Signez ici</span>
        </div>}
      </div>
      {hasSign && <button onClick={clear} style={{marginTop:4,background:"none",border:"none",color:"#94a3b8",fontSize:15,cursor:"pointer",fontWeight:600}}>✕ Effacer</button>}
    </div>
  );
}

function MRow({label,unit,value,onChange,ideal,okFn,icon,color="#0891b2"}) {
  const hasVal = value!==""&&value!==null&&value!==undefined&&value!==false;
  const ok = hasVal&&okFn ? okFn(+value) : true;
  const statusColor = !hasVal?"#e2e8f0":ok?"#22c55e":"#ef4444";
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,background:hasVal?(ok?"#f0fdf4":"#fef2f2"):DS.white,border:`1px solid ${hasVal?(ok?"#bbf7d0":"#fecaca"):"#f1f5f9"}`,transition:"all .25s"}}>
      <div style={{width:34,height:34,borderRadius:10,background:color+"15",border:`1px solid ${color}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {icon}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:DS.dark,lineHeight:1.2}}>{label}{unit&&<span style={{fontSize:11,color:"#94a3b8",fontWeight:400}}> ({unit})</span>}</div>
        {ideal&&<div style={{fontSize:10,color:"#94a3b8",marginTop:2,fontWeight:500}}>idéal {ideal}</div>}
      </div>
      <input type="number" step="0.1" value={value===""||value===null||value===undefined?"":value} onChange={e=>onChange(e.target.value===""?"":+e.target.value)}
        style={{width:72,padding:"8px 10px",borderRadius:9,border:`2px solid ${statusColor}`,fontSize:15,fontWeight:800,boxSizing:"border-box",color:hasVal?(ok?"#16a34a":"#be123c"):DS.dark,background:"rgba(255,255,255,0.55)",textAlign:"center",outline:"none",fontFamily:"inherit",flexShrink:0,transition:"all .2s"}}/>
      <div style={{width:28,height:28,borderRadius:14,background:!hasVal?"#f1f5f9":ok?"#22c55e":"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .3s",boxShadow:hasVal?`0 2px 6px ${ok?"#22c55e":"#ef4444"}44`:"none"}}>
        {!hasVal
          ? <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          : ok
            ? <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        }
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────

export function FormPassage({ clients, defaultClientId, initial, onSave, onSaveLivraison, produitsStock=[], onClose }) {
  const EMPTY = {
    date:TODAY, clientId:defaultClientId||"", type:"Entretien complet", tech:"Dorian",
    chloreLibre:"", ph:"", alcalinite:"", stabilisant:"",
    tSel:"", tPhosphate:"", tStabilisant:"", tChlore:"", tPH:"",
    qualiteEau:"", etatFond:[], etatParois:[], etatLocal:[], etatBacTampon:[], etatVoletBac:[],
    corrChlore:"", corrPhosphate:"", corrPH:"", corrSel:"", corrAlgicide:"", corrPeroxyde:"", corrChloreChoc:"", corrAlcafix:"", corrAutre:"",
    devis:null, priseEchantillon:null, commentaires:"",
    livraisonProduits:null, produitsLivres:[], livraisonAutre:"",
    stabilisantHaut:false,
    ressenti:0, presenceClient:null,
    signatureTech:"", signatureClient:"",
    photoArrivee:"",
    photoDepart:"",
    photosDepart:[],
    photos:[],
    ok:false,
    rapportStatut:"saisie",
    // SAV / Devis
    descriptionSAV:"", equipementSAV:[], piecesSAV:"", urgenceDevis:"",
  };
  const isEdit = !!initial?.id;
  const isMobile = useIsMobile();

  // ═══════════════════════════════════════════════════════════════════
  // BROUILLON AUTO — sauvegarde chaque frappe en localStorage
  // Récupération auto si crash, fermeture onglet, perte de réseau…
  // ═══════════════════════════════════════════════════════════════════
  const DRAFT_KEY = isEdit ? `briblue_draft_rapport_${initial.id}` : "briblue_draft_rapport_new";
  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      // Brouillon expiré après 7 jours
      if (d?._savedAt && (Date.now() - d._savedAt) > 7*24*3600*1000) {
        localStorage.removeItem(DRAFT_KEY);
        return null;
      }
      return d;
    } catch { return null; }
  };
  const draft = loadDraft();
  const [hasDraft, setHasDraft] = useState(!!draft && !isEdit);
  const [draftRestored, setDraftRestored] = useState(false);

  const [f,setF]=useState(() => {
    if (isEdit) return {...EMPTY, ...initial, rapportStatut:getRapportStatus(initial)};
    return EMPTY;
  });
  const [step,setStep]=useState(1);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Sauvegarde manuelle brouillon
  const saveDraftManual = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({...f, _savedAt: Date.now(), _step: step}));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    } catch {}
  };

  // Sauvegarde du brouillon à chaque changement (debounced 400ms)
  const draftTimerRef = useRef(null);
  useEffect(() => {
    if (!draftRestored && !isEdit) return; // ne pas sauver avant restauration manuelle
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try {
        // Seulement si le formulaire a du contenu réel
        const hasContent = f.clientId || f.commentaires || f.tPH || f.tChlore ||
                          f.descriptionSAV || f.photos?.length || f.actions ||
                          f.produitsLivres?.length || f.corrChlore || f.corrPH;
        if (hasContent) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({...f, _savedAt: Date.now(), _step: step}));
        }
      } catch {}
    }, 400);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [f, step, draftRestored, isEdit, DRAFT_KEY]);

  // Flush le brouillon AVANT que la page se ferme (iOS + Desktop)
  useEffect(() => {
    const flush = () => {
      try {
        const hasContent = f.clientId || f.commentaires || f.tPH || f.tChlore ||
                          f.descriptionSAV || f.photos?.length;
        if (hasContent && (!isEdit || draftRestored)) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({...f, _savedAt: Date.now(), _step: step}));
        }
      } catch {}
    };
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, [f, step, draftRestored, isEdit, DRAFT_KEY]);

  const restoreDraft = () => {
    if (!draft) return;
    const { _savedAt, _step, ...rest } = draft;
    setF({...EMPTY, ...rest});
    if (_step) setStep(_step);
    setHasDraft(false);
    setDraftRestored(true);
    toastSuccess("Brouillon restauré");
  };
  const discardDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setHasDraft(false);
    setDraftRestored(true);
  };
  const clearDraftAfterSave = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  };

  useEffect(()=>{ const el=document.querySelector('[data-modal-body="1"]'); if(el) el.scrollTop=0; },[step]);
  const isSAV = f.type==="SAV";
  const isDevis = f.type==="Demande de devis";
  const isSansDonnees = f.type==="Passage sans données";
  const isSimplified = isSAV || isDevis;
  const STEPS = isSansDonnees ? 1 : isSimplified ? 3 : 6;
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const ph=Number(f.tPH)||Number(f.ph);
  const cl=Number(f.tChlore)||Number(f.chloreLibre);

  const doSave = () => {
    if(!f.clientId||!f.date){ toastWarn("Client et date requis"); return; }
    const isSAVsave = f.type==="SAV";
    const isDevissave = f.type==="Demande de devis";
    const isSansDonneesSave = f.type==="Passage sans données";
    const isSimplifiedSave = isSAVsave || isDevissave || isSansDonneesSave;
    const passage = {
      ...f,
      id: isEdit ? f.id : uid(),
      ph: isSimplifiedSave ? "" : (ph||f.tPH||f.ph||""),
      chlore: isSimplifiedSave ? "" : (cl||f.tChlore||f.chloreLibre||""),
      rapportStatut: normalizeRapportStatus(f.rapportStatut || (f.ok ? "cree" : "saisie")),
      actions: isSimplifiedSave
        ? [
            isSAVsave && f.descriptionSAV && `Panne: ${f.descriptionSAV}`,
            isSAVsave && f.equipementSAV?.length && `Équipements: ${f.equipementSAV.join(", ")}`,
            isSAVsave && f.piecesSAV && `Pièces: ${f.piecesSAV}`,
            isDevissave && f.descriptionSAV && `Devis: ${f.descriptionSAV}`,
            isDevissave && f.urgenceDevis && `Urgence: ${f.urgenceDevis}`,
          ].filter(Boolean).join(" | ") || ""
        : [
            f.corrChlore&&`Chlore: ${f.corrChlore}`,
            f.corrPH&&`pH: ${f.corrPH}`,
            f.corrAlgicide&&`Algicide: ${f.corrAlgicide}`,
            f.corrChloreChoc&&`Chlore choc: ${f.corrChloreChoc}`,
            f.corrAlcafix&&`Alcafix: ${f.corrAlcafix}`,
            f.corrAutre&&f.corrAutre,
          ].filter(Boolean).join(", ") || "",
      obs: isSimplifiedSave ? (f.descriptionSAV || f.commentaires || "") : f.commentaires,
    };
    onSave(passage);
    clearDraftAfterSave();
    setShowConfirmSave(false);
    // Auto-créer une livraison si produits livrés
    if (f.livraisonProduits && (f.produitsLivres?.length > 0 || f.livraisonAutre) && onSaveLivraison) {
      onSaveLivraison({
        id: uid(),
        clientId: f.clientId,
        date: f.date,
        produits: f.produitsLivres || [],
        description: f.livraisonAutre || "",
        montant: "",
        statut: "aFacturer",
      });
    }
  };

  const handleSave = () => {
    if(!f.clientId||!f.date){ toastWarn("Client et date requis"); return; }
    setShowConfirmSave(true);
  };

  const client = clients.find(c=>c.id===f.clientId);

  // Icônes SVG premium pour les étapes de la fiche entretien
  const STEP_ICONS = [
    // 1. Intervention — clé plate stylisée
    (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    // 2. Analyses eau — flacon avec bulles
    (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v5l3 9a3 3 0 01-3 3H9a3 3 0 01-3-3l3-9V3z"/><path d="M9 3h6"/><path d="M6.5 15h11"/><circle cx="10" cy="12" r="1" fill={c}/><circle cx="14" cy="13.5" r="0.8" fill={c}/></svg>,
    // 3. État bassin — piscine avec vagues
    (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 14c2.5 2.5 5 2.5 7.5 0s5-2.5 7.5 0 5 2.5 7.5 0" clipPath="url(#p)"/><defs><clipPath id="p"><rect x="2" y="6" width="20" height="12"/></clipPath></defs><line x1="7" y1="6" x2="7" y2="3"/><line x1="17" y1="6" x2="17" y2="3"/></svg>,
    // 4. Correctifs — éprouvette chimie
    (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2l10 0"/><path d="M7 2v5l-4.5 9a2.5 2.5 0 002.3 3.5h10.4a2.5 2.5 0 002.3-3.5L13 7V2"/><path d="M5 15h14"/></svg>,
    // 5. Clôture — checklist validée
    (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    // 6. Signatures — stylo plume
    (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg>,
  ];
  const STEP_INFO_FULL = [
    {ic:STEP_ICONS[0],l:isMobile?"Interv.":"Intervention",color:"#0891b2"},
    {ic:STEP_ICONS[1],l:isMobile?"Analyses":"Analyses eau",color:"#0891b2"},
    {ic:STEP_ICONS[2],l:isMobile?"Bassin":"État bassin",color:"#059669"},
    {ic:STEP_ICONS[3],l:"Correctifs",color:"#4f46e5"},
    {ic:STEP_ICONS[4],l:"Clôture",color:"#b45309"},
    {ic:STEP_ICONS[5],l:isMobile?"Sign.":"Signatures",color:"#059669"},
  ];
  const SAV_ICON = (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5"/></svg>;
  const DEVIS_ICON = (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>;
  const STEP_INFO_SAV = [
    {ic:STEP_ICONS[0],l:isMobile?"Interv.":"Intervention",color:"#0891b2"},
    {ic:SAV_ICON,l:isMobile?"Panne":"Détail panne",color:"#dc2626"},
    {ic:STEP_ICONS[5],l:isMobile?"Sign.":"Clôture",color:"#059669"},
  ];
  const STEP_INFO_DEVIS = [
    {ic:STEP_ICONS[0],l:isMobile?"Interv.":"Intervention",color:"#0891b2"},
    {ic:DEVIS_ICON,l:isMobile?"Devis":"Détail devis",color:"#7c3aed"},
    {ic:STEP_ICONS[5],l:isMobile?"Sign.":"Clôture",color:"#059669"},
  ];
  const STEP_INFO_SANS = [
    {ic:(c="currentColor",s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5"/></svg>,l:"Enregistrer",color:"#64748b"},
  ];
  const STEP_INFO = isSansDonnees ? STEP_INFO_SANS : isSAV ? STEP_INFO_SAV : isDevis ? STEP_INFO_DEVIS : STEP_INFO_FULL;

  const Stepper = () => {
    const pct = Math.round((step-1)/STEPS*100);
    return (
    <div style={{marginBottom:16}}>
      {/* Barre de progression globale */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:12,color:DS.mid,fontWeight:600}}>Progression</span>
        <span style={{fontSize:12,fontWeight:700,color:DS.dark}}>{step-1} / {STEPS} étapes — {pct}%</span>
      </div>
      <div style={{height:5,background:DS.light,borderRadius:99,marginBottom:16,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#059669,#0ea5e9)",borderRadius:99,transition:"width .4s cubic-bezier(.22,1,.36,1)"}}/>
      </div>

      {/* Ronds étapes */}
      <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:14,position:"relative"}}>
        {/* Ligne fond */}
        <div style={{position:"absolute",top:"50%",left:"4%",right:"4%",height:2,background:DS.light,transform:"translateY(-50%)",zIndex:0}}/>
        {/* Ligne progression */}
        <div style={{position:"absolute",top:"50%",left:"4%",height:2,width:`${Math.max(0,(step-1.5)/STEPS*92)}%`,background:"linear-gradient(90deg,#059669,#0ea5e9)",transform:"translateY(-50%)",transition:"width .4s",zIndex:1}}/>
        {STEP_INFO.map((s,i)=>{
          const done=i+1<step, active=i+1===step;
          return (
            <div key={i} style={{flex:1,display:"flex",justifyContent:"center",zIndex:2}}>
              <button onClick={()=>setStep(i+1)} title={s.l} style={{
                width:active?44:36, height:active?44:36,
                borderRadius:"50%", border:"none", cursor:"pointer",
                background:active?s.color:done?"#059669":DS.white,
                border:done||active?"none":`2px solid ${DS.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                flexShrink:0, position:"relative",
                transition:"all .3s cubic-bezier(.22,1,.36,1)",
                boxShadow:active?`0 4px 16px ${s.color}44`:done?"0 2px 8px rgba(5,150,105,0.25)":"none",
              }}>
                {done
                  ? <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : (typeof s.ic==="function" ? s.ic(active?"#fff":"#94a3b8", active?17:14) : <span style={{fontSize:active?14:11}}>{s.ic}</span>)
                }
                {active && <div style={{position:"absolute",inset:-4,borderRadius:"50%",border:`2px solid ${s.color}44`,pointerEvents:"none"}}/>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Labels sous les ronds */}
      <div style={{display:"flex",marginBottom:14}}>
        {STEP_INFO.map((s,i)=>{
          const done=i+1<step, active=i+1===step;
          const shortLabel = {Intervention:"Interv.",Analyses:"Analys.","Analyses eau":"Analyses","État bassin":"Bassin",Correctifs:"Correct.",Clôture:"Clôture",Signatures:"Signat."};
          const label = shortLabel[s.l] || s.l;
          return (
            <div key={i} style={{flex:1,textAlign:"center"}}>
              <span style={{fontSize:8,fontWeight:active?800:500,color:active?s.color:done?"#059669":DS.mid,letterSpacing:0,display:"block",lineHeight:1.2}}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Bandeau étape active */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderRadius:14,background:`${STEP_INFO[step-1].color}10`,border:`1.5px solid ${STEP_INFO[step-1].color}30`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:STEP_INFO[step-1].color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 3px 10px ${STEP_INFO[step-1].color}44`}}>
            {typeof STEP_INFO[step-1].ic==="function" ? STEP_INFO[step-1].ic("#fff",16) : <span style={{fontSize:15}}>{STEP_INFO[step-1].ic}</span>}
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:STEP_INFO[step-1].color,letterSpacing:-0.2}}>{STEP_INFO[step-1].l}</div>
            <div style={{fontSize:11,color:DS.mid,marginTop:1}}>Étape {step} sur {STEPS}</div>
          </div>
        </div>
        <div style={{fontSize:22,fontWeight:900,color:STEP_INFO[step-1].color,opacity:0.8}}>{pct}<span style={{fontSize:12,fontWeight:600}}>%</span></div>
      </div>
    </div>
  );};


  const clientSel = clients.find(c=>c.id===f.clientId);

  return (
    <Modal title={isEdit ? "Modifier le passage" : "Rapport"} onClose={onClose} wide>

            {/* ═══ BROUILLON DÉTECTÉ ═══ */}
      {hasDraft && (
        <div className="fade-in" style={{margin:"-4px 0 14px",padding:"14px 16px",borderRadius:16,background:"linear-gradient(135deg,rgba(245,158,11,0.18),rgba(217,119,6,0.12))",border:"1px solid rgba(245,158,11,0.35)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#f59e0b,#d97706)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 6px 20px rgba(245,158,11,0.35)"}}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-9-9c2.5 0 4.8 1 6.5 2.7"/><polyline points="21 3 21 9 15 9"/></svg>
          </div>
          <div style={{flex:1,minWidth:180}}>
            <div style={{fontSize:14,fontWeight:800,color:"#92400e"}}>Brouillon non sauvegardé</div>
            <div style={{fontSize:12,color:"#b45309",marginTop:2}}>Un rapport en cours a été retrouvé — reprendre là où vous vous étiez arrêté ?</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={discardDraft} style={{padding:"8px 12px",borderRadius:10,border:"1px solid rgba(180,83,9,0.3)",background:"rgba(255,255,255,0.5)",color:"#92400e",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)"}}>Ignorer</button>
            <button onClick={restoreDraft} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(245,158,11,0.4)"}}>Restaurer</button>
          </div>
        </div>
      )}
      {/* Bandeau client sélectionné */}
      {clientSel && (
        <div style={{margin:"-24px -28px 16px",marginTop:isMobile?"-18px":"-24px",marginLeft:isMobile?"-20px":"-28px",marginRight:isMobile?"-20px":"-28px",position:"relative",overflow:"hidden"}}>
          {/* Fond avec photo piscine si dispo */}
          {clientSel.photoPiscine
            ? <div style={{position:"absolute",inset:0,background:`url(${clientSel.photoPiscine}) center/cover`,filter:"brightness(0.35)"}}/>
            : <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#0c1222 0%,#0f2a4a 50%,#0369a1 100%)"}}/>
          }
          {/* Motif décoratif */}
          <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,borderRadius:70,background:"rgba(56,189,248,0.08)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",bottom:-20,left:-20,width:100,height:100,borderRadius:50,background:"rgba(14,165,233,0.06)",pointerEvents:"none"}}/>
          <div style={{position:"relative",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"nowrap"}}>
            {/* Icône pool compact */}
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(8,145,178,0.25)",border:"1px solid rgba(56,189,248,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {Ico.pool(16,"#38bdf8")}
            </div>
            {/* Nom + badges — prend tout l'espace disponible */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:900,fontSize:isMobile?14:16,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:-0.3,lineHeight:1.2}}>{clientSel.nom}</div>
              <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"nowrap",overflow:"hidden"}}>
                <span style={{background:"rgba(56,189,248,0.2)",color:"#7dd3fc",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:5,border:"1px solid rgba(56,189,248,0.3)",whiteSpace:"nowrap",flexShrink:0}}>{clientSel.formule}</span>
                {clientSel.bassin&&<span style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.65)",fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:5,whiteSpace:"nowrap",flexShrink:0}}>{clientSel.bassin}</span>}
              </div>
            </div>
            {/* Date à droite */}
            <div style={{flexShrink:0,textAlign:"center",background:"rgba(14,165,233,0.2)",border:"1px solid rgba(14,165,233,0.3)",borderRadius:8,padding:"5px 10px"}}>
              <div style={{fontSize:10,fontWeight:800,color:"#38bdf8",whiteSpace:"nowrap"}}>{new Date(f.date).toLocaleDateString("fr",{day:"2-digit",month:"short"})}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",marginTop:1}}>{new Date(f.date).toLocaleDateString("fr",{weekday:"short"})}</div>
            </div>
          </div>
        </div>
      )}
      <Stepper/>

      {step===1 && (
        <div className="fade-in">
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
            <input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={{padding:"12px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:14,fontFamily:"inherit",color:DS.dark}}/>
            <input placeholder="Technicien" value={f.tech} onChange={e=>set("tech",e.target.value)} style={{padding:"12px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:14,fontFamily:"inherit",color:DS.dark}}/>
          </div>
          <div style={{marginTop:16}}>
            <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:8}}>Client *</span>
            {isMobile ? (
              <select
                value={f.clientId}
                onChange={e=>set("clientId", e.target.value)}
                style={{width:"100%",padding:"14px 16px",borderRadius:DS.radiusSm,border:"none",background:"rgba(255,255,255,0.45)",boxShadow:DS.nmShadowSm,fontSize:15,color:DS.dark}}
              >
                <option value="">Choisir un client</option>
                {clients.map(c=>(
                  <option key={c.id} value={c.id}>{c.nom} — {c.formule}</option>
                ))}
              </select>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,maxHeight:220,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
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
            )}
          </div>
          <div style={{marginTop:16}}>
            <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:8}}>Type d'intervention</span>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {[
                {v:"Entretien complet",ico:Ico.wrench,col:"#0284c7",bg:"#e0f2fe"},
                {v:"Contrôle d'eau",ico:Ico.drop,col:"#0891b2",bg:"#e0f7fa"},
                {v:"Visite technique",ico:Ico.brush,col:"#4f46e5",bg:"#eef2ff"},
                {v:"Bassin en rattrapage",ico:Ico.chemicals,col:"#b45309",bg:"#fef3c7"},
                {v:"Fin de rattrapage",ico:Ico.check,col:"#059669",bg:"#d1fae5"},
                {v:"SAV",ico:(s,c)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5"/></svg>,col:"#dc2626",bg:"#fef2f2"},
                {v:"Demande de devis",ico:(s,c)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/><path d="M9 9h1"/></svg>,col:"#7c3aed",bg:"#f5f3ff"},
                {v:"Passage sans données",ico:(s,c)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5"/></svg>,col:"#64748b",bg:"#f1f5f9"},
              ].map(({v,ico,col,bg})=>{
                const sel=f.type===v;
                return (
                  <button key={v} onClick={()=>{set("type",v);setStep(1);}} className="btn-hover" style={{display:"flex",alignItems:"center",gap:11,padding:"11px 14px",borderRadius:12,border:`1.5px solid ${sel?col:DS.border}`,background:sel?bg:DS.white,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .2s",boxShadow:sel?`0 2px 10px ${col}22`:"none"}}>
                    <div style={{width:32,height:32,borderRadius:9,background:sel?col:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
                      {ico(15,sel?"#fff":DS.mid)}
                    </div>
                    <span style={{fontSize:13,fontWeight:sel?700:400,color:sel?col:DS.mid,flex:1}}>{v}</span>
                    {sel && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{borderTop:"1px solid "+DS.border,paddingTop:16,marginTop:16}}>
            {(() => {
              const filledPhotos = [
                f.photoArrivee ? {key:"pa", label:"Arrivée", val:f.photoArrivee} : null,
                ...((f.photos||[]).map((v,i)=>v?{key:`p${i}`,label:`Photo ${i+2}`,val:v,idx:i}:null)),
              ].filter(Boolean);
              const canAdd = filledPhotos.length < 10;

              const addPhotos = (e) => {
                const files = Array.from(e.target.files||[]).slice(0, 10 - filledPhotos.length);
                let newArrivee = f.photoArrivee||"";
                let newPhotos = [...(f.photos||[])];
                let readers = 0;
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (!newArrivee) { newArrivee = reader.result; }
                    else { newPhotos = [...newPhotos, reader.result]; }
                    readers++;
                    if (readers === files.length) {
                      set("photoArrivee", newArrivee);
                      set("photos", newPhotos.slice(0,9));
                    }
                  };
                  reader.readAsDataURL(file);
                });
                e.target.value="";
              };

              const removePhoto = (key, idx) => {
                if (key==="pa") set("photoArrivee","");
                else { const arr=[...(f.photos||[])]; arr.splice(idx,1); set("photos",arr); }
              };

              return (
                <div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7}}>
                      Photos arrivée {filledPhotos.length>0 && `(${filledPhotos.length}/10)`}
                    </span>
                    {canAdd && (
                      <label style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:8,background:DS.blueSoft,border:"1px solid "+DS.blue+"33",cursor:"pointer",fontSize:12,fontWeight:700,color:DS.blue}}>
                        {Ico.plus(12,DS.blue)} Ajouter
                        <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={addPhotos}/>
                      </label>
                    )}
                  </div>
                  {filledPhotos.length === 0
                    ? <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:20,borderRadius:12,border:"2px dashed "+DS.border,background:DS.light,cursor:"pointer"}}>
                        {Ico.camera(28,DS.mid)}
                        <span style={{fontSize:13,color:DS.mid,fontWeight:600}}>Appuyez pour ajouter des photos</span>
                        <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={addPhotos}/>
                      </label>
                    : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
                        {filledPhotos.map(p=>(
                          <div key={p.key} style={{position:"relative",borderRadius:10,overflow:"hidden",border:"1px solid "+DS.border}}>
                            <img src={p.val} alt={p.label} style={{width:"100%",height:90,objectFit:"cover",display:"block"}}/>
                            <span style={{position:"absolute",bottom:4,left:5,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.55)",borderRadius:4,padding:"1px 6px"}}>{p.label}</span>
                            <button onClick={()=>removePhoto(p.key,p.idx)} style={{position:"absolute",top:4,right:4,width:24,height:24,borderRadius:12,background:"rgba(0,0,0,0.65)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                              {Ico.close(10,"#fff")}
                            </button>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {isSansDonnees && step===1 && (
        <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{padding:"16px",background:"rgba(255,255,255,0.45)",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,display:"flex",alignItems:"flex-start",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5"/></svg>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#475569",marginBottom:3}}>Passage sans données</div>
              <div style={{fontSize:12,color:DS.mid}}>Ce passage sera enregistré avec la date et le type uniquement, sans mesures ni rapport.</div>
            </div>
          </div>
          <div>
            <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Type d'intervention</span>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {[
                {v:"Entretien complet",col:"#0284c7"},
                {v:"Contrôle d'eau",col:"#0891b2"},
                {v:"Visite technique",col:"#4f46e5"},
                {v:"Bassin en rattrapage",col:"#b45309"},
              ].map(({v,col})=>{
                const sel=f.commentaires===v||(f.commentaires===''&&v==="Entretien complet");
                return (
                  <button key={v} onClick={()=>set("commentaires",v)} className="btn-hover"
                    style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:12,border:`1.5px solid ${sel?col:DS.border}`,background:sel?col+"12":DS.white,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:sel?700:400,color:sel?col:DS.mid,transition:"all .2s"}}>
                    {v}
                    {sel&&<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:"auto"}}><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Note (optionnel)</span>
            <textarea value={f.obs||""} onChange={e=>set("obs",e.target.value)} placeholder="Ex: Passage effectué, client absent..."
              style={{width:"100%",padding:"11px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:80,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark}}/>
          </div>
        </div>
      )}

      {step===2 && isSimplified && (
        <div className="fade-in">
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>{isSAV?"Description de la panne":"Description des travaux demandés"}</span>
              <textarea value={f.descriptionSAV||""} onChange={e=>set("descriptionSAV",e.target.value)}
                placeholder={isSAV?"Décrivez le problème constaté, le symptôme, l'équipement concerné..":"Décrivez les travaux souhaités, les équipements à installer ou remplacer..."}
                style={{width:"100%",padding:"12px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:120,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark}}/>
            </div>
            {isSAV && (
              <div>
                <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Équipement concerné</span>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {["Pompe","Filtre","Volet","Robot","Électrolyseur","Régulateur pH","Chauffage","Autre"].map(eq=>{
                    const sel=(f.equipementSAV||[]).includes(eq);
                    return <button key={eq} onClick={()=>{ const arr=f.equipementSAV||[]; set("equipementSAV",sel?arr.filter(x=>x!==eq):[...arr,eq]); }} className="btn-hover" style={{padding:"10px 12px",borderRadius:10,border:"1.5px solid "+(sel?"#dc2626":DS.border),background:sel?"#fef2f2":DS.white,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:sel?700:400,color:sel?"#dc2626":DS.mid,textAlign:"left",transition:"all .2s"}}>{eq}</button>;
                  })}
                </div>
              </div>
            )}
            {isSAV && (
              <div>
                <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Pièces remplacées / utilisées</span>
                <textarea value={f.piecesSAV||""} onChange={e=>set("piecesSAV",e.target.value)}
                  placeholder="Ex: Joint pompe x2, filtre cartouche, ..."
                  style={{width:"100%",padding:"10px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:70,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark}}/>
              </div>
            )}
            {isDevis && (
              <div>
                <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Urgence</span>
                <div style={{display:"flex",gap:8}}>
                  {[{v:"Normale",col:"#059669",bg:"#d1fae5"},{v:"Rapide",col:"#b45309",bg:"#fef3c7"},{v:"Urgente",col:"#dc2626",bg:"#fef2f2"}].map(({v,col,bg})=>{
                    const sel=f.urgenceDevis===v;
                    return <button key={v} onClick={()=>set("urgenceDevis",v)} className="btn-hover" style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(sel?col:DS.border),background:sel?bg:DS.white,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:sel?700:500,color:sel?col:DS.mid,transition:"all .2s"}}>{v}</button>;
                  })}
                </div>
              </div>
            )}
            <div>
              <OuiNon label={isSAV?"Devis pour les pièces ?":"Visite de chiffrage nécessaire ?"} value={f.devis} onChange={v=>set("devis",v)}/>
            </div>
            <div>
              <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:4}}>Commentaires</span>
              <textarea value={f.commentaires||""} onChange={e=>set("commentaires",e.target.value)} placeholder="Informations complémentaires..."
                style={{width:"100%",padding:"11px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:80,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark}}/>
            </div>
          </div>
        </div>
      )}

      {step===2 && !isSimplified && (
        <div className="fade-in">
          {(()=>{
            const okCount = [
              f.chloreLibre!==undefined&&f.chloreLibre!==""&&+f.chloreLibre>=1&&+f.chloreLibre<=3,
              f.ph!==undefined&&f.ph!==""&&+f.ph>=7.2&&+f.ph<=7.8,
              f.alcalinite!==undefined&&f.alcalinite!==""&&+f.alcalinite>=80&&+f.alcalinite<=120,
              f.stabilisant!==undefined&&f.stabilisant!==""&&+f.stabilisant>=30&&+f.stabilisant<=50,
            ].filter(Boolean).length;
            const filledCount = [f.chloreLibre,f.ph,f.alcalinite,f.stabilisant].filter(v=>v!==""&&v!==null&&v!==undefined).length;
            return (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{borderRadius:DS.radius,overflow:"hidden",border:"1px solid "+DS.border,boxShadow:DS.shadow}}>
              <div style={{background:"linear-gradient(135deg,#0891b2,#06b6d4)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.phTest(16,"#fff")}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:"#fff",letterSpacing:.3}}>Test Bandelette</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.75)",marginTop:1}}>Analyse chimique de l'eau</div>
                  </div>
                </div>
                <div style={{background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"4px 12px",display:"flex",alignItems:"center",gap:5}}>
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{fontSize:11,fontWeight:800,color:"#fff"}}>{okCount}/{filledCount||4} OK</span>
                </div>
              </div>
              <div style={{background:DS.white,padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                <MRow label="Chlore libre" unit="ppm" value={f.chloreLibre} onChange={v=>set("chloreLibre",v)} ideal="1 – 3" okFn={v=>v>=1&&v<=3} color="#0891b2"
                  icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>}/>
                <MRow label="pH" value={f.ph} onChange={v=>set("ph",v)} ideal="7.2 – 7.8" okFn={v=>v>=7.2&&v<=7.8} color="#0891b2"
                  icon={<span style={{fontSize:13,fontWeight:900,color:"#0891b2",letterSpacing:-1}}>pH</span>}/>
                <MRow label="Alcalinité totale" unit="ppm" value={f.alcalinite} onChange={v=>set("alcalinite",v)} ideal="80 – 120" okFn={v=>v>=80&&v<=120} color="#0284c7"
                  icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round"><path d="M2 8c2.5 3 5 3 7.5 0S14 5 16.5 8s5 3 7.5 0"/><path d="M2 16c2.5 3 5 3 7.5 0S14 13 16.5 16s5 3 7.5 0"/></svg>}/>
                <div>
                  <MRow label="Stabilisant" unit="ppm" value={f.stabilisant} onChange={v=>set("stabilisant",v)} ideal="30 – 50" okFn={v=>v>=30&&v<=50} color="#0891b2"
                    icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}/>
                  <label style={{display:"flex",alignItems:"center",gap:8,marginTop:6,padding:"6px 10px",borderRadius:8,background:f.stabilisantHaut?"#fff7ed":"#f8fafc",border:"1px solid "+(f.stabilisantHaut?"#fcd34d":"#e2e8f0"),cursor:"pointer",width:"fit-content"}}>
                    <input type="checkbox" checked={!!f.stabilisantHaut} onChange={e=>set("stabilisantHaut",e.target.checked)} style={{width:16,height:16,accentColor:"#b45309"}}/>
                    <span style={{fontSize:12,fontWeight:700,color:f.stabilisantHaut?"#b45309":"#64748b"}}>⚠️ Stabilisant HAUT</span>
                  </label>
                </div>
              </div>
            </div>
            <div style={{borderRadius:DS.radius,overflow:"hidden",border:"1px solid "+DS.border,boxShadow:DS.shadow}}>
              <div style={{background:"linear-gradient(135deg,#4f46e5,#818cf8)",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.chart(16,"#fff")}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:"#fff",letterSpacing:.3}}>Mesures Électroniques</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.75)",marginTop:1}}>Relevés appareils de mesure</div>
                </div>
              </div>
              <div style={{background:DS.white,padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                <MRow label="Taux de sel" value={f.tSel} onChange={v=>set("tSel",v)} color="#4f46e5"
                  icon={<span style={{fontSize:16}}>🧂</span>}/>
                <MRow label="Taux de phosphate" value={f.tPhosphate} onChange={v=>set("tPhosphate",v)} color="#4f46e5"
                  icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v5l3 9a3 3 0 01-3 3H9a3 3 0 01-3-3l3-9V3z"/><path d="M6.5 15h11"/></svg>}/>
                <MRow label="Taux de chlore" value={f.tChlore} onChange={v=>set("tChlore",v)} ideal="1 – 1.5" okFn={v=>v>=0.5&&v<=3} color="#0891b2"
                  icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>}/>
                <MRow label="Taux de pH" value={f.tPH} onChange={v=>set("tPH",v)} ideal="7.2 – 7.4" okFn={v=>v>=7.0&&v<=7.6} color="#0891b2"
                  icon={<span style={{fontSize:13,fontWeight:900,color:"#4f46e5",letterSpacing:-1}}>pH</span>}/>
                <MRow label="Taux stabilisant" value={f.tStabilisant} onChange={v=>set("tStabilisant",v)} color="#4f46e5"
                  icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}/>
              </div>
            </div>
          </div>
            );
          })()}
        </div>
      )}

      {step===3 && !isSimplified && (
        <div className="fade-in">
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {/* Qualité eau — chips visuels colorés */}
              <div>
                <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:8}}>Qualité de l'eau</span>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:6}}>
                  {[
                    {v:"Cristalline",icon:"💎",color:"#0891b2",bg:"#e0f7fa"},
                    {v:"Trouble",icon:"🌫️",color:"#64748b",bg:"#f1f5f9"},
                    {v:"Laiteuse",icon:"🥛",color:"#94a3b8",bg:"#f8fafc"},
                    {v:"Verte",icon:"🌿",color:"#16a34a",bg:"#f0fdf4"},
                  ].map(({v,icon,color,bg})=>{
                    const sel=f.qualiteEau===v;
                    return (
                      <button key={v} onClick={()=>set("qualiteEau",v)} className="btn-hover" style={{padding:"12px 10px",borderRadius:12,border:`2px solid ${sel?color:DS.border}`,background:sel?bg:DS.white,cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all .2s",boxShadow:sel?`0 2px 10px ${color}33`:"none"}}>
                        <div style={{fontSize:22,marginBottom:3}}>{icon}</div>
                        <div style={{fontSize:11,fontWeight:sel?800:500,color:sel?color:DS.mid}}>{v}</div>
                        {sel && <div style={{width:8,height:8,borderRadius:4,background:color,margin:"4px auto 0"}}/>}
                      </button>
                    );
                  })}
                </div>
              </div>
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

      {/* ÉTAPE 4 — Correctifs avec Alcafix */}
      {step===4 && !isSimplified && (
        <div className="fade-in">
          <div style={{background:`linear-gradient(135deg,#7c3aed08,#7c3aed12)`,borderRadius:DS.radius,padding:18,border:"1px solid #7c3aed18",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:800,color:"#4f46e5",textTransform:"uppercase",letterSpacing:.8,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:26,height:26,borderRadius:8,background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.chemicals(13,"#fff")}</div>
              Produits apportés
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr",gap:10}}>
              {[
                {k:"corrChlore",l:"Chlore",ico:"🧪",col:"#0891b2"},
                {k:"corrPH",l:"pH",ico:"⚗️",col:"#4f46e5"},
                {k:"corrSel",l:"Sel",ico:"🧂",col:"#64748b"},
                {k:"corrAlgicide",l:"Algicide",ico:"🌿",col:"#16a34a"},
                {k:"corrPeroxyde",l:"Peroxyde",ico:"💧",col:"#0284c7"},
                {k:"corrChloreChoc",l:"Chlore Choc",ico:"⚡",col:"#b45309"},
                {k:"corrPhosphate",l:"Phosphate",ico:"🔬",col:"#be185d"},
                {k:"corrAlcafix",l:"Alcafix",ico:"🧫",col:"#059669"},
                {k:"corrAutre",l:"Autre",ico:"📦",col:"#94a3b8"},
              ].map(({k,l,ico,col})=>(
                <div key={k} style={{background:"rgba(255,255,255,0.55)",borderRadius:10,padding:"10px 12px",border:"1px solid "+DS.border}}>
                  <div style={{fontSize:10,fontWeight:700,color:col,marginBottom:5,display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:13}}>{ico}</span> {l}
                  </div>
                  <input value={f[k]||""} onChange={e=>set(k,e.target.value)}
                    placeholder={k==="corrSel"?"ex: 2 sacs":k==="corrChlore"?"ex: 200g":"ex: 500ml"}
                    style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1.5px solid "+DS.border,fontSize:13,outline:"none",boxSizing:"border-box",color:DS.dark,fontFamily:"inherit",transition:"all .2s",background:f[k]?col+"08":DS.white}}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{marginTop:8}}>
            <OuiNon label="Devis à faire ?" value={f.devis} onChange={v=>set("devis",v)}/>
          </div>
        </div>
      )}

      {(step===5 || (isSimplified && step===3)) && (
        <div className="fade-in">
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {!isSimplified && <OuiNon label="Prise d'échantillon ?" value={f.priseEchantillon} onChange={v=>set("priseEchantillon",v)}/>}
              {!isSimplified && <div>
                <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:4}}>Commentaires</span>
                <textarea value={f.commentaires} onChange={e=>set("commentaires",e.target.value)} placeholder="Anomalies, recommandations..."
                  style={{width:"100%",padding:"11px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:100,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark,transition:"all .2s"}}/>
              </div>}
              <OuiNon label="Livraison de produits ?" value={f.livraisonProduits} onChange={v=>set("livraisonProduits",v)}/>
              {f.livraisonProduits && (
                <>
                  <MultiCheck label="Produit(s) livré(s)" values={f.produitsLivres} onChange={v=>set("produitsLivres",v)} options={produitsStock&&produitsStock.length>0?produitsStock:PRODUITS_DEFAUT}/>
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
                {(()=>{
                  const filledDepart = [
                    f.photoDepart ? {key:"pd0", label:"Départ", val:f.photoDepart} : null,
                    ...((f.photosDepart||[]).map((v,i)=>v?{key:`pd${i+1}`,label:`Départ ${i+2}`,val:v,idx:i}:null)),
                  ].filter(Boolean);
                  const canAdd = filledDepart.length < 10;

                  const addDepart = (e) => {
                    const files = Array.from(e.target.files||[]).slice(0, 10 - filledDepart.length);
                    if(!files.length) return;
                    let newDepart = f.photoDepart||"";
                    let newExtras = [...(f.photosDepart||[])];
                    let done = 0;
                    files.forEach(file => {
                      const r = new FileReader();
                      r.onload = () => {
                        if (!newDepart) newDepart = r.result;
                        else newExtras = [...newExtras, r.result];
                        done++;
                        if (done === files.length) {
                          set("photoDepart", newDepart);
                          set("photosDepart", newExtras.slice(0,9));
                        }
                      };
                      r.readAsDataURL(file);
                    });
                    e.target.value="";
                  };

                  const removeDepart = (key, idx) => {
                    if (key==="pd0") {
                      // Promouvoir la première extra si dispo
                      const extras = [...(f.photosDepart||[])];
                      set("photoDepart", extras[0]||"");
                      set("photosDepart", extras.slice(1));
                    } else {
                      const arr = [...(f.photosDepart||[])]; arr.splice(idx,1); set("photosDepart",arr);
                    }
                  };

                  return (
                    <div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7}}>
                          Photos départ {filledDepart.length>0&&`(${filledDepart.length}/10)`}
                        </span>
                        {canAdd&&(
                          <label style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:DS.blueSoft,border:"1px solid "+DS.blue+"33",cursor:"pointer",fontSize:12,fontWeight:700,color:DS.blue}}>
                            {Ico.plus(12,DS.blue)} Ajouter
                            <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={addDepart}/>
                          </label>
                        )}
                      </div>
                      {filledDepart.length===0
                        ? <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:18,borderRadius:12,border:"2px dashed "+DS.border,background:DS.light,cursor:"pointer"}}>
                            {Ico.camera(26,DS.mid)}
                            <span style={{fontSize:13,color:DS.mid,fontWeight:600}}>Ajouter des photos au départ</span>
                            <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={addDepart}/>
                          </label>
                        : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
                            {filledDepart.map(p=>(
                              <div key={p.key} style={{position:"relative",borderRadius:10,overflow:"hidden",border:"1px solid "+DS.border}}>
                                <img src={p.val} alt={p.label} style={{width:"100%",height:90,objectFit:"cover",display:"block"}}/>
                                <span style={{position:"absolute",bottom:4,left:5,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.55)",borderRadius:4,padding:"1px 6px"}}>{p.label}</span>
                                <button onClick={()=>removeDepart(p.key,p.idx)} style={{position:"absolute",top:5,right:5,width:24,height:24,borderRadius:12,background:"rgba(0,0,0,0.65)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  {Ico.close(10,"#fff")}
                                </button>
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                  );
                })()}
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

      {step===6 && !isSimplified && (
        <div className="fade-in">
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>
            <SignaturePad label="Signature du technicien" value={f.signatureTech} onChange={v=>set("signatureTech",v)}/>
            <SignaturePad label="Signature du client / propriétaire" value={f.signatureClient} onChange={v=>set("signatureClient",v)}/>
          </div>
          {(f.photoArrivee||f.photoDepart||(f.photos||[]).some(Boolean)) && (
            <div style={{background:DS.light,borderRadius:DS.radiusSm,padding:14,border:"1px solid "+DS.border,marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>
                Photos jointes ({[f.photoArrivee,f.photoDepart,...(f.photos||[])].filter(Boolean).length}/5)
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
                {f.photoArrivee && (<div style={{position:"relative"}}><img src={f.photoArrivee} alt="Arrivée" style={{width:"100%",height:80,objectFit:"cover",borderRadius:8,border:"1px solid "+DS.border,display:"block"}}/><span style={{position:"absolute",bottom:4,left:5,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.6)",borderRadius:4,padding:"1px 6px"}}>Arrivée</span></div>)}
                {(f.photos||[]).map((ph,i)=>ph?(<div key={i} style={{position:"relative"}}><img src={ph} alt={`Photo ${i+2}`} style={{width:"100%",height:80,objectFit:"cover",borderRadius:8,border:"1px solid "+DS.border,display:"block"}}/><span style={{position:"absolute",bottom:4,left:5,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.6)",borderRadius:4,padding:"1px 6px"}}>Photo {i+2}</span></div>):null)}
                {f.photoDepart && (<div style={{position:"relative"}}><img src={f.photoDepart} alt="Départ" style={{width:"100%",height:80,objectFit:"cover",borderRadius:8,border:"1px solid "+DS.border,display:"block"}}/><span style={{position:"absolute",bottom:4,left:5,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.6)",borderRadius:4,padding:"1px 6px"}}>Départ</span></div>)}
              </div>
            </div>
          )}
          <div style={{background:`linear-gradient(135deg,#be185d08,#be185d12)`,borderRadius:DS.radius,padding:18,border:"1px solid #be185d18"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#be185d",textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Exporter le rapport</div>
            <div style={{marginBottom:12}}>
              <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Statut du rapport</span>
              <RapportStatusPicker value={f.rapportStatut} onChange={v=>set("rapportStatut",v)} />
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
              <button onClick={()=>ouvrirRapport(f,client)} className="btn-hover" style={{padding:"14px",borderRadius:DS.radiusSm,background:"rgba(255,255,255,0.45)",border:"1.5px solid "+DS.border,cursor:"pointer",fontWeight:700,fontSize:14,color:DS.dark,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {Ico.pdf(18,DS.dark)} Télécharger PDF
              </button>
              {client?.email ? (
                <button onClick={()=>showConfirm(`Envoyer le rapport par email à ${client.email} ?`,()=>envoyerEmail(f,client))} className="btn-hover" style={{padding:"14px",borderRadius:DS.radiusSm,background:DS.blueGrad,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 16px "+DS.blue+"44"}}>
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

      <SunBurstFormNav
        step={step} totalSteps={STEPS}
        onNext={()=>setStep(s=>s+1)}
        onPrev={()=>setStep(s=>s-1)}
        onSave={handleSave}
        onCancel={onClose}
        onSaveDraft={saveDraftManual}
        draftSaved={draftSaved}
        nextLabel={(STEP_INFO[step]||STEP_INFO[STEPS-1]).l}
        nextColor={(STEP_INFO[step]||STEP_INFO[STEPS-1]).color}
        saveLabel="Enregistrer le rapport"
      />

            {/* Modale confirmation enregistrement */}
      {showConfirmSave && (()=>{
        const clientSel = clients.find(c=>c.id===f.clientId);
        const dateStr = f.date ? new Date(f.date).toLocaleDateString("fr",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}) : "—";
        return (
          <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(12,18,34,0.72)",display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"}} onClick={()=>setShowConfirmSave(false)}>
            <div style={{background:"rgba(255,255,255,0.55)",borderRadius:"20px 20px 0 0",padding:"28px 22px 36px",width:"100%",maxWidth:480,boxShadow:"0 -8px 40px rgba(0,0,0,0.18)"}} onClick={e=>e.stopPropagation()}>
              <div style={{width:40,height:4,borderRadius:2,background:"#e2e8f0",margin:"0 auto 22px"}}/>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#059669,#34d399)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                </div>
                <div>
                  <div style={{fontSize:17,fontWeight:800,color:"#0c1222",lineHeight:1.2}}>Confirmer l'enregistrement</div>
                  <div style={{fontSize:13,color:"#64748b",marginTop:3}}>{isEdit ? "Modifier ce passage" : "Créer ce nouveau passage"}</div>
                </div>
              </div>
              <div style={{background:"rgba(255,255,255,0.45)",borderRadius:14,padding:"14px 16px",marginBottom:20,border:"1px solid #e2e8f0",display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>Client</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#0c1222"}}>{clientSel?.nom||"—"}</span>
                </div>
                <div style={{height:1,background:"rgba(255,255,255,0.4)"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>Date</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#0c1222"}}>{dateStr}</span>
                </div>
                <div style={{height:1,background:"rgba(255,255,255,0.4)"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>Type</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#0891b2"}}>{f.type||"—"}</span>
                </div>
                {f.tech&&<><div style={{height:1,background:"rgba(255,255,255,0.4)"}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>Technicien</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#0c1222"}}>{f.tech}</span>
                </div></>}
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setShowConfirmSave(false)} style={{flex:1,padding:"14px",borderRadius:12,background:"rgba(255,255,255,0.4)",border:"none",cursor:"pointer",fontWeight:700,fontSize:14,color:"#64748b",fontFamily:"inherit"}}>
                  Annuler
                </button>
                <button onClick={doSave} style={{flex:2,padding:"14px",borderRadius:12,background:"linear-gradient(135deg,#059669,#34d399)",border:"none",cursor:"pointer",fontWeight:800,fontSize:15,color:"#fff",fontFamily:"inherit",boxShadow:"0 4px 16px #05996944",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {isEdit ? "Modifier" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </Modal>
  );
}
