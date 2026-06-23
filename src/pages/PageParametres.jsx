// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { flushPendingNow, forceRestoreFromFirebase, save } from "../lib/storage";
import { playChimeMorning, playAlertRdv, playNotifSound, playSound, SOUND_TYPES, sendLocalNotification } from "../styles";

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE — interrupteur simple
// ─────────────────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onToggle(!on); }}
      style={{
        width:50, height:28, borderRadius:14,
        background: on ? "#0891b2" : "#d1d5db",
        position:"relative", cursor:"pointer", flexShrink:0,
        transition:"background .2s",
        boxShadow: on ? "0 2px 10px rgba(8,145,178,0.4)" : "inset 0 1px 3px rgba(0,0,0,0.12)",
        WebkitTapHighlightColor:"transparent",
      }}
    >
      <div style={{
        width:22, height:22, borderRadius:"50%", background:"#fff",
        position:"absolute", top:3,
        left: on ? 25 : 3,
        transition:"left .2s cubic-bezier(.34,1.56,.64,1)",
        boxShadow:"0 2px 6px rgba(0,0,0,0.2)",
      }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGNE DE RÉGLAGE
// ─────────────────────────────────────────────────────────────────────────────
function Ligne({ icone, label, detail, right, onClick, danger, sep = true }) {
  return (
    <div
      onClick={onClick}
      style={{
        display:"flex", alignItems:"center", gap:13,
        padding:"14px 16px",
        cursor: onClick ? "pointer" : "default",
        borderBottom: sep ? "1px solid #f1f5f9" : "none",
        background:"transparent",
        transition:"background .12s",
        WebkitTapHighlightColor:"transparent",
        userSelect:"none",
      }}
      onTouchStart={e => { if (onClick) e.currentTarget.style.background = "#f8fafc"; }}
      onTouchEnd={e => { e.currentTarget.style.background = "transparent"; }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = "#f8fafc"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      {/* Icône colorée */}
      {icone && (
        <div style={{
          width:36, height:36, borderRadius:10, flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          background: danger ? "#fef2f2" : "#f0f9ff",
        }}>
          {icone}
        </div>
      )}

      {/* Texte */}
      <div style={{flex:1, minWidth:0}}>
        <div style={{
          fontSize:14, fontWeight:600,
          color: danger ? "#dc2626" : "#0f172a",
          lineHeight:1.3,
        }}>
          {label}
        </div>
        {detail && (
          <div style={{fontSize:11, color:"#94a3b8", marginTop:2, lineHeight:1.5}}>
            {detail}
          </div>
        )}
      </div>

      {/* Droite : toggle, badge ou chevron */}
      {right ? (
        <div style={{flexShrink:0}}>{right}</div>
      ) : onClick ? (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
          stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOC SECTION
// ─────────────────────────────────────────────────────────────────────────────
function Bloc({ titre, emoji, children }) {
  return (
    <div style={{marginBottom:22}}>
      {titre && (
        <div style={{
          display:"flex", alignItems:"center", gap:5,
          padding:"0 4px", marginBottom:7,
        }}>
          {emoji && <span style={{fontSize:12}}>{emoji}</span>}
          <span style={{
            fontSize:11, fontWeight:700, color:"#94a3b8",
            textTransform:"uppercase", letterSpacing:1,
          }}>
            {titre}
          </span>
        </div>
      )}
      <div style={{
        background:"#fff", borderRadius:16,
        border:"1px solid #e2e8f0",
        boxShadow:"0 1px 6px rgba(0,0,0,0.05)",
        overflow:"hidden",
      }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SÉLECTEUR DE SON — chips horizontales
// ─────────────────────────────────────────────────────────────────────────────
function SonSelector({ label, value, onChange }) {
  return (
    <div style={{padding:"4px 16px 10px",background:"#fafafa",borderTop:"1px solid #f1f5f9"}}>
      <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.5,marginBottom:7}}>{label}</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {SOUND_TYPES.map(s => {
          const active = value === s.key;
          return (
            <button key={s.key} onClick={() => onChange(s.key)}
              style={{
                padding:"5px 11px",borderRadius:20,fontFamily:"inherit",cursor:"pointer",
                fontSize:11,fontWeight:active?700:500,
                background:active?"#0891b2":"#fff",
                color:active?"#fff":"#374151",
                border:`1.5px solid ${active?"#0891b2":"#e2e8f0"}`,
                WebkitTapHighlightColor:"transparent",
                transition:"all .12s",
              }}>
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SÉLECTEUR DE RÉPÉTITIONS
// ─────────────────────────────────────────────────────────────────────────────
function RepeatSelector({ label, value, onChange, options = [1,2,3] }) {
  return (
    <div style={{padding:"4px 16px 10px",background:"#fafafa",borderTop:"1px solid #f1f5f9"}}>
      <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.5,marginBottom:7}}>{label}</div>
      <div style={{display:"flex",gap:6}}>
        {options.map(n => {
          const active = value === n;
          return (
            <button key={n} onClick={() => onChange(n)}
              style={{
                minWidth:42,padding:"5px 10px",borderRadius:10,fontFamily:"inherit",cursor:"pointer",
                fontSize:12,fontWeight:active?800:500,
                background:active?"linear-gradient(135deg,#0891b2,#0e7490)":"#fff",
                color:active?"#fff":"#374151",
                border:`1.5px solid ${active?"#0891b2":"#e2e8f0"}`,
                boxShadow:active?"0 2px 8px rgba(8,145,178,0.3)":"none",
                WebkitTapHighlightColor:"transparent",
                transition:"all .12s",
              }}>
              {n}×
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SÉLECTEUR DE DÉLAIS RDV — multi-choix
// ─────────────────────────────────────────────────────────────────────────────
const DELAYS_OPTIONS = [
  { val:5,  label:"5 min"  },
  { val:10, label:"10 min" },
  { val:15, label:"15 min" },
  { val:30, label:"30 min" },
  { val:60, label:"1 h"    },
];
function DelaiSelector({ value, onChange }) {
  const toggle = d => {
    if (value.includes(d)) onChange(value.filter(x => x !== d));
    else onChange([...value, d].sort((a,b)=>b-a)); // décroissant : 15, 5
  };
  return (
    <div style={{padding:"4px 16px 10px",background:"#fafafa",borderTop:"1px solid #f1f5f9"}}>
      <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.5,marginBottom:7}}>
        Délais avant le RDV
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {DELAYS_OPTIONS.map(({ val, label }) => {
          const active = value.includes(val);
          return (
            <button key={val} onClick={() => toggle(val)}
              style={{
                padding:"5px 12px",borderRadius:20,fontFamily:"inherit",cursor:"pointer",
                fontSize:11,fontWeight:active?700:500,
                background:active?"#7c3aed":"#fff",
                color:active?"#fff":"#374151",
                border:`1.5px solid ${active?"#7c3aed":"#e2e8f0"}`,
                WebkitTapHighlightColor:"transparent",
                transition:"all .12s",
              }}>
              {active && <span style={{marginRight:4}}>✓</span>}{label}
            </button>
          );
        })}
      </div>
      {value.length === 0 && (
        <div style={{fontSize:10,color:"#f97316",marginTop:5}}>⚠ Sélectionnez au moins un délai</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOUTON TEST
// ─────────────────────────────────────────────────────────────────────────────
function BoutonTest({ label, onClick }) {
  return (
    <div style={{padding:"6px 16px 10px",background:"#fafafa",borderTop:"1px solid #f1f5f9"}}>
      <button onClick={onClick}
        style={{
          padding:"7px 16px",borderRadius:20,border:"1.5px solid #e0f2fe",
          background:"#fff",cursor:"pointer",fontFamily:"inherit",
          fontSize:11,fontWeight:600,color:"#0891b2",
          display:"flex",alignItems:"center",gap:7,
          WebkitTapHighlightColor:"transparent",
          transition:"background .1s",
        }}
        onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
        onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        {label}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE PARAMÈTRES
// ─────────────────────────────────────────────────────────────────────────────
export function PageParametres({
  modeExpert, onToggleExpert,
  clients = [], passages = [], rdvs = [],
  onLogout, onOpenImportHTML,
}) {
  const [syncMsg,      setSyncMsg]      = useState("");
  const [exportMsg,    setExportMsg]    = useState("");
  const [cacheMsg,     setCacheMsg]     = useState("");
  const [cacheSize,    setCacheSize]    = useState("…");
  const [restoreMsg,   setRestoreMsg]   = useState("");
  const [restoring,    setRestoring]    = useState(false);

  // ── Helpers localStorage ──
  const ls    = (k, def) => { try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch { return def; } };
  const setLs = (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const mkSet = (key, setter) => v => { setter(v); setLs(key, v); };

  // ── État notifications ──
  const [notifEnabled,   setNotifEnabledRaw]   = useState(() => ls("briblue_notif_enabled",     true));
  const [morningOn,      setMorningOnRaw]       = useState(() => ls("briblue_notif_morning",     true));
  const [rdvOn,          setRdvOnRaw]           = useState(() => ls("briblue_notif_rdv",         true));
  const [permission,     setPermission]         = useState(() => typeof Notification !== "undefined" ? Notification.permission : "default");
  const [testMsg,        setTestMsg]            = useState("");

  // Nouveaux réglages fins
  const [volume,         setVolumeRaw]          = useState(() => ls("briblue_notif_volume",      0.7));   // 0.0–1.0
  const [morningHeure,   setMorningHeureRaw]    = useState(() => ls("briblue_notif_morning_h",   "08:00"));
  const [morningSon,     setMorningSonRaw]       = useState(() => ls("briblue_notif_son_morning", "chime"));
  const [morningRepeat,  setMorningRepeatRaw]   = useState(() => ls("briblue_notif_rep_morning", 1));
  const [rdvDelays,      setRdvDelaysRaw]       = useState(() => ls("briblue_notif_rdv_delays",  [15, 5]));  // minutes avant
  const [rdvSon,         setRdvSonRaw]          = useState(() => ls("briblue_notif_son_rdv",     "alert"));
  const [rdvRepeat,      setRdvRepeatRaw]       = useState(() => ls("briblue_notif_rep_rdv",     2));
  const [notifSon,       setNotifSonRaw]        = useState(() => ls("briblue_notif_son_notif",   "notif"));
  const [notifRepeat,    setNotifRepeatRaw]     = useState(() => ls("briblue_notif_rep_notif",   1));

  const setNotifEnabled  = mkSet("briblue_notif_enabled",     setNotifEnabledRaw);
  const setMorningOn     = mkSet("briblue_notif_morning",     setMorningOnRaw);
  const setRdvOn         = mkSet("briblue_notif_rdv",         setRdvOnRaw);
  const setVolume        = mkSet("briblue_notif_volume",      setVolumeRaw);
  const setMorningHeure  = mkSet("briblue_notif_morning_h",   setMorningHeureRaw);
  const setMorningSon    = mkSet("briblue_notif_son_morning", setMorningSonRaw);
  const setMorningRepeat = mkSet("briblue_notif_rep_morning", setMorningRepeatRaw);
  const setRdvDelays     = mkSet("briblue_notif_rdv_delays",  setRdvDelaysRaw);
  const setRdvSon        = mkSet("briblue_notif_son_rdv",     setRdvSonRaw);
  const setRdvRepeat     = mkSet("briblue_notif_rep_rdv",     setRdvRepeatRaw);
  const setNotifSon      = mkSet("briblue_notif_son_notif",   setNotifSonRaw);
  const setNotifRepeat   = mkSet("briblue_notif_rep_notif",   setNotifRepeatRaw);

  const testMsgTimerRef = useRef(null);
  const showTest = (msg) => {
    setTestMsg(msg);
    clearTimeout(testMsgTimerRef.current);
    testMsgTimerRef.current = setTimeout(() => setTestMsg(""), 3000);
  };

  // ── Demander la permission navigateur ──
  const demanderPermission = async () => {
    if (!("Notification" in window)) { showTest("❌ Notifications non supportées"); return; }
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === "granted") showTest("✅ Permission accordée !");
    else if (p === "denied") showTest("❌ Bloquées — autorisez dans les réglages");
  };

  // ── Tester un son directement ──
  const testerSon = (type, repeat = 1) => {
    playSound(type, repeat, volume);
    const label = SOUND_TYPES.find(s => s.key === type)?.label || type;
    showTest(`${label} × ${repeat}`);
  };

  // ── Tester une notification complète ──
  const testerNotif = (cat) => {
    if (cat === "morning") {
      playSound(morningSon, morningRepeat, volume);
      if (permission === "granted")
        sendLocalNotification("☀️ BRIBLUE — Test briefing", "Voici à quoi ressemble le briefing matinal.", { tag:"briblue-test" });
      showTest("☀️ Briefing envoyé");
    }
    if (cat === "rdv") {
      playSound(rdvSon, rdvRepeat, volume);
      if (permission === "granted")
        sendLocalNotification("📅 BRIBLUE — Test RDV", `Rappel ${rdvDelays[0]||15} min · Client test`, { tag:"briblue-test-rdv", requireInteraction:false });
      showTest("📅 Test RDV envoyé");
    }
    if (cat === "notif") {
      playSound(notifSon, notifRepeat, volume);
      if (permission === "granted")
        sendLocalNotification("🔔 BRIBLUE — Test notif", "Nouvelle tâche ou événement.", { tag:"briblue-test-notif" });
      showTest("🔔 Notif test envoyée");
    }
  };

  // ── Tester le son (rétrocompat) ──
  const testerSonLegacy = (type = "morning") => {
    if (type === "morning")  { playChimeMorning(volume); showTest("🎵 Carillon"); }
    if (type === "rdv")      { playAlertRdv(volume);     showTest("🔔 Alerte RDV"); }
    if (type === "notif")    { playNotifSound(volume);   showTest("🔈 Bip"); }
  };

  // ── Taille du cache local ──
  useEffect(() => {
    try {
      let bytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("briblue")) bytes += (localStorage.getItem(k) || "").length;
      }
      setCacheSize(bytes > 1024
        ? `${(bytes / 1024).toFixed(1)} Ko`
        : `${bytes} o`);
    } catch { setCacheSize("—"); }
  }, []);

  // ── Synchronisation Firebase ──
  const syncFirebase = async () => {
    setSyncMsg("⏳ Synchronisation en cours…");
    try {
      await flushPendingNow();
      setSyncMsg("✅ Synchronisé !");
    } catch {
      setSyncMsg("⚠️ Impossible de synchroniser (hors ligne ?)");
    }
    setTimeout(() => setSyncMsg(""), 3000);
  };

  // ── Récupération forcée depuis Firebase ──
  const restaurerDepuisFirebase = async () => {
    setRestoring(true);
    setRestoreMsg("⏳ Récupération en cours…");
    try {
      const { restored, details } = await forceRestoreFromFirebase();
      if (restored > 0) {
        const detail = Object.entries(details)
          .map(([k, n]) => `${n} ${k.includes("passage") ? "rapport" : k.includes("client") ? "client" : "entrée"}${n > 1 ? "s" : ""}`)
          .join(", ");
        setRestoreMsg(`✅ ${restored} donnée${restored > 1 ? "s" : ""} récupérée${restored > 1 ? "s" : ""} (${detail}) — rechargez l'app`);
      } else {
        setRestoreMsg("ℹ️ Aucune donnée supplémentaire trouvée sur Firebase");
      }
    } catch {
      setRestoreMsg("❌ Erreur de récupération (hors ligne ?)");
    }
    setRestoring(false);
    setTimeout(() => setRestoreMsg(""), 8000);
  };

  // ── Import rapports HTML → délégué à ModalImportHTML dans App.jsx ──
  const importerRapportsHTML_LEGACY = async (files) => {
    if (!files || files.length === 0) return;
    // L'import est maintenant géré par ModalImportHTML (App.jsx) via onOpenImportHTML.
    // Cette fonction est conservée comme fallback si onOpenImportHTML n'est pas fourni.
    if (onOpenImportHTML) { onOpenImportHTML(); return; }
    // Fallback minimal (ne devrait pas être atteint)
    alert(`${files.length} fichier(s) reçu(s) — veuillez utiliser le bouton Import HTML`);

    // SÉCURITÉ : toujours récupérer Firebase en premier pour ne jamais écraser des données plus récentes
    let existingPassages = [];
    try {
      await forceRestoreFromFirebase();
      const raw = localStorage.getItem("briblue_bb_passages_v2");
      existingPassages = raw ? JSON.parse(raw) : [];
    } catch { /* noop */ }
    if (existingPassages.length === 0 && passages.length > 0) existingPassages = [...passages];

    setImportMsg("⏳ Analyse des fichiers HTML…");

    const htmlParser = new DOMParser();
    let added = 0, enriched = 0, skipped = 0, notFound = 0;
    const resultPassages = [...existingPassages];

    // Convertit la date française "16 juin 2026" → "2026-06-16"
    const MOIS_FR = { janvier:"01",février:"02",mars:"03",avril:"04",mai:"05",juin:"06",
      juillet:"07",août:"08",septembre:"09",octobre:"10",novembre:"11",décembre:"12" };
    const parseDateFR = (s) => {
      if (!s) return "";
      const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (iso) return s;
      const m = s.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
      if (m) {
        const mo = MOIS_FR[m[2].toLowerCase()];
        if (mo) return `${m[3]}-${mo}-${m[1].padStart(2,"0")}`;
      }
      // "16/06/2026" ou "16-06-2026"
      const mslash = s.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
      if (mslash) return `${mslash[3]}-${mslash[2]}-${mslash[1]}`;
      return "";
    };

    // Extrait la valeur numérique brute d'un champ (retire unités, "ppm", etc.)
    const cleanVal = (s) => {
      if (!s || s === "—") return "";
      return s.replace(/<[^>]+>/g, "").trim();
    };

    for (const file of Array.from(files)) {
      try {
        const html = await file.text();
        const doc = htmlParser.parseFromString(html, "text/html");

        // ── 1. Nom client depuis .meta-item ──────────────────────────────
        let nomClient = "";
        let dateRapport = "";
        doc.querySelectorAll(".meta-item").forEach(el => {
          const text = el.textContent.trim();
          const strong = el.querySelector("strong")?.textContent?.trim() || "";
          if (text.startsWith("Client")) nomClient = strong;
          if (text.startsWith("Date"))   dateRapport = strong;
        });

        // Fallback : chercher dans le HTML texte brut
        if (!nomClient) {
          const fullText = doc.body?.textContent || "";
          const mClient = fullText.match(/Client\s*([A-ZÁÀÂÄÉÈÊËÏÎÔÙÛÜÇ][A-ZÁÀÂÄÉÈÊËÏÎÔÙÛÜÇa-záàâäéèêëïîôùûüç\s\-]+)/);
          if (mClient) nomClient = mClient[1].trim();
        }

        // ── 2. Trouver le client ─────────────────────────────────────────
        let client = null;
        if (nomClient) {
          const needle = nomClient.toLowerCase().trim();
          client = clients.find(c => {
            const full = `${c.prenom||""} ${c.nom||""}`.toLowerCase().trim();
            const nomOnly = (c.nom||"").toLowerCase().trim();
            return full === needle || nomOnly === needle ||
                   needle.includes(nomOnly) || nomOnly.includes(needle);
          });
        }
        if (!client) { notFound++; continue; }

        const dateISO = parseDateFR(dateRapport) || new Date().toISOString().slice(0,10);

        // ── 3. Extraire champs par section (évite conflit "pH" × 2) ─────
        const bySection = {}; // { sectionTitle: { label: value } }
        doc.querySelectorAll(".section").forEach(sec => {
          const title = sec.querySelector(".section-title")?.textContent?.replace(/[^\w\séàâäéèêëïîôùûüç]/gi,"").trim().toLowerCase() || "global";
          bySection[title] = {};
          sec.querySelectorAll(".field").forEach(f => {
            const lbl = f.querySelector(".field-label")?.textContent?.trim() || "";
            const val = cleanVal(f.querySelector(".field-value")?.textContent || "");
            if (lbl && val && val !== "—") bySection[title][lbl.toLowerCase()] = val;
          });
        });

        const eau      = bySection["analyses eau"] || bySection["analyses de leau"] || {};
        const etat     = bySection["tat du bassin"] || bySection["etat du bassin"] || {};
        const corr     = bySection["correctifs apports"] || bySection["correctifs apportés"] || {};
        const cloture  = bySection["clture"] || bySection["clôture"] || {};
        const bassin   = bySection["bassin  intervention"] || bySection["bassin intervention"] || {};

        // ── 4. Chercher si passage existant à enrichir ───────────────────
        const existIdx = resultPassages.findIndex(p =>
          p.clientId === client.id && p.date === dateISO
        );

        const passageData = {
          clientId: client.id,
          date: dateISO,
          type: bassin["type"] || "entretien",
          // Analyses eau
          ph:           eau["ph"] || "",
          chloreLibre:  eau["chlore libre"]?.replace(/\s*ppm/i,"").trim() || "",
          alcalinite:   eau["alcalinité"]?.replace(/\s*ppm/i,"").trim() || "",
          stabilisant:  eau["stabilisant"]?.replace(/\s*ppm/i,"").trim() || "",
          tChlore:      eau["taux chlore"] || "",
          tPH:          eau["taux ph"] || "",
          tSel:         eau["taux sel"] || "",
          tPhosphate:   eau["taux phosphate"] || "",
          // État bassin
          qualiteEau:   etat["qualité eau"] || "",
          etatFond:     etat["fond"] ? [etat["fond"]] : [],
          etatParois:   etat["parois"] ? [etat["parois"]] : [],
          etatLocal:    etat["local technique"] ? [etat["local technique"]] : [],
          etatBacTampon:etat["bac tampon"] ? [etat["bac tampon"]] : [],
          etatVoletBac: etat["volet / bac"] ? [etat["volet / bac"]] : [],
          // Correctifs
          corrChlore:       corr["chlore"] || "",
          corrPH:           corr["ph"] || "",
          corrSel:          corr["sel"] || "",
          corrAlgicide:     corr["algicide"] || "",
          corrPeroxyde:     corr["peroxyde"] || "",
          corrChloreChoc:   corr["chlore choc"] || "",
          corrPhosphate:    corr["phosphate"] || "",
          corrAlcafix:      corr["tac +"] || "",
          corrAutre:        corr["autre"] || "",
          // Clôture
          commentaires: cloture["commentaires"] || "",
          importedFromHTML: true,
          importedFile: file.name,
        };

        if (existIdx >= 0) {
          // Enrichir un passage existant sans écraser ses données déjà renseignées
          const existing = resultPassages[existIdx];
          const merged = { ...passageData, ...Object.fromEntries(
            Object.entries(existing).filter(([,v]) => v !== "" && v !== null && v !== undefined &&
              !(Array.isArray(v) && v.length === 0))
          )};
          resultPassages[existIdx] = merged;
          enriched++;
        } else {
          resultPassages.push({
            id: `html_import_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
            photos: [],
            produits: [],
            ...passageData,
          });
          added++;
        }
      } catch (e) {
        console.warn("[briblue] Erreur import HTML :", file.name, e);
      }
    }

    const total = added + enriched;
    if (total > 0) {
      try {
        await save("bb_passages_v2", resultPassages);
        await flushPendingNow();
        let msg = "✅";
        if (added > 0) msg += ` ${added} rapport${added>1?"s":""} ajouté${added>1?"s":""}`;
        if (enriched > 0) msg += `${added>0?" ·":""} ${enriched} enrichi${enriched>1?"s":""}`;
        if (skipped > 0) msg += ` · ${skipped} déjà présent${skipped>1?"s":""}`;
        if (notFound > 0) msg += ` · ${notFound} client${notFound>1?"s":""} non trouvé${notFound>1?"s":""}`;
        setImportMsg(msg + " — rechargez l'app");
      } catch {
        setImportMsg("⚠️ Import OK mais erreur de sauvegarde — réessayez");
      }
    } else if (notFound > 0) {
      setImportMsg(`❌ ${notFound} client${notFound>1?"s":""} non trouvé${notFound>1?"s":""} — vérifiez les noms dans l'app`);
    } else {
      setImportMsg("ℹ️ Aucune modification — tous les rapports sont déjà à jour");
    }

    setImporting(false);
    if (importInputRef.current) importInputRef.current.value = "";
    setTimeout(() => setImportMsg(""), 12000);
  };

  // ── Export JSON ──
  const exportJSON = () => {
    try {
      const payload = {
        exportDate: new Date().toISOString(),
        version: "2.1.0",
        clients,
        passages,
        rdvs,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `briblue-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportMsg("✅ Fichier téléchargé !");
    } catch {
      setExportMsg("⚠️ Erreur lors de l'export");
    }
    setTimeout(() => setExportMsg(""), 3000);
  };

  // ── Vider cache carte ──
  const viderCache = () => {
    try { localStorage.removeItem("bb_geocache_v1"); } catch { /* noop */ }
    setCacheMsg("✅ Cache carte vidé");
    setTimeout(() => setCacheMsg(""), 3000);
  };

  const passagesCeMois = passages.filter(p => {
    const d = new Date(p.date), n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  });
  const tauxOk = passages.length
    ? Math.round(passages.filter(p => p.ok).length / passages.length * 100)
    : 0;

  return (
    <div style={{maxWidth:560, margin:"0 auto", padding:"0 0 60px"}}>

      {/* ── BLOC RÉCUPÉRATION D'URGENCE ── */}
      <div style={{
        marginBottom:20,
        borderRadius:18,
        overflow:"hidden",
        border:"2px solid #fca5a5",
        background:"#fff5f5",
        boxShadow:"0 4px 20px rgba(220,38,38,0.10)",
      }}>
        {/* Header rouge */}
        <div style={{
          background:"linear-gradient(135deg,#dc2626,#ef4444)",
          padding:"12px 16px",
          display:"flex",alignItems:"center",gap:10,
        }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>Récupération de données</span>
        </div>

        <div style={{padding:"14px 16px"}}>
          <p style={{margin:"0 0 12px",fontSize:12,color:"#7f1d1d",lineHeight:1.6}}>
            Si des rapports ont disparu, ce bouton force la récupération depuis Firebase et fusionne les données manquantes avec le local.
            <br/><strong>Ne remplace rien</strong> — ajoute uniquement ce qui manque.
          </p>

          <button
            onClick={restaurerDepuisFirebase}
            disabled={restoring}
            style={{
              width:"100%",padding:"13px",borderRadius:12,
              background:restoring ? "#fca5a5" : "linear-gradient(135deg,#dc2626,#b91c1c)",
              border:"none",cursor:restoring?"not-allowed":"pointer",
              fontSize:13,fontWeight:800,color:"#fff",fontFamily:"inherit",
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              boxShadow:restoring?"none":"0 4px 14px rgba(220,38,38,0.35)",
              WebkitTapHighlightColor:"transparent",
            }}>
            {restoring ? (
              <><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"
                style={{animation:"spin .7s linear infinite"}}>
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg> Récupération…</>
            ) : (
              <><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
              </svg> Récupérer les données depuis Firebase</>
            )}
          </button>

          {restoreMsg && (
            <div style={{
              marginTop:10,padding:"10px 14px",borderRadius:10,
              background: restoreMsg.startsWith("✅") ? "#f0fdf4" : restoreMsg.startsWith("ℹ") ? "#f0f9ff" : "#fef2f2",
              border: `1px solid ${restoreMsg.startsWith("✅") ? "#86efac" : restoreMsg.startsWith("ℹ") ? "#bae6fd" : "#fca5a5"}`,
              fontSize:12,fontWeight:600,
              color: restoreMsg.startsWith("✅") ? "#15803d" : restoreMsg.startsWith("ℹ") ? "#0369a1" : "#dc2626",
              lineHeight:1.5,
            }}>
              {restoreMsg}
              {restoreMsg.startsWith("✅") && (
                <div style={{marginTop:6,fontSize:11,fontWeight:400,color:"#64748b"}}>
                  👉 Fermez et rouvrez l'application pour voir les données restaurées.
                </div>
              )}
            </div>
          )}

          <div style={{marginTop:10,padding:"8px 12px",borderRadius:8,background:"#fee2e2",fontSize:10,color:"#991b1b"}}>
            💡 <strong>Si vous avez l'app ouverte sur un autre appareil (téléphone, tablette)</strong> : ne la fermez pas — les données sont peut-être encore dans son cache local. Ouvrez-la et attendez qu'elle se synchronise.
          </div>
        </div>
      </div>

      {/* ── CARTE PROFIL ── */}
      <div style={{
        borderRadius:20, overflow:"hidden", marginBottom:24,
        background:"linear-gradient(145deg,#075985 0%,#0891b2 55%,#0e7490 100%)",
        boxShadow:"0 4px 20px rgba(8,145,178,0.3)", position:"relative",
      }}>
        {/* Cercle décoratif */}
        <div style={{position:"absolute",right:-40,top:-40,width:160,height:160,
          borderRadius:"50%",background:"rgba(255,255,255,0.06)",pointerEvents:"none"}}/>

        <div style={{position:"relative",padding:"22px 20px 20px",display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:60,height:60,borderRadius:18,background:"rgba(255,255,255,0.18)",
            border:"2px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:28,flexShrink:0}}>
            🏊
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:20,fontWeight:800,color:"#fff",letterSpacing:"-0.3px"}}>
              Dorian
              {modeExpert && (
                <span style={{
                  marginLeft:10,fontSize:10,fontWeight:700,color:"#fbbf24",
                  background:"rgba(251,191,36,0.18)",border:"1px solid rgba(251,191,36,0.4)",
                  borderRadius:20,padding:"2px 8px",verticalAlign:"middle",
                }}>⚡ EXPERT</span>
              )}
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:2}}>
              BRIBLUE · Technicien piscine
            </div>
            <div style={{display:"flex",gap:16,marginTop:10}}>
              {[
                [clients.length,     "clients"],
                [passages.length,    "passages"],
                [passagesCeMois.length,"ce mois"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div style={{fontSize:17,fontWeight:800,color:"#fff",lineHeight:1}}>{n}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODE EXPERT ── */}
      <Bloc titre="Mode" emoji="⚡">
        <Ligne
          icone={<svg width={18} height={18} viewBox="0 0 24 24" fill="none"
            stroke={modeExpert ? "#f59e0b" : "#0891b2"} strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>}
          label="Mode Expert"
          detail={modeExpert
            ? "Activé — statistiques, outils avancés et données techniques"
            : "Désactivé — interface simplifiée"}
          right={<Toggle on={modeExpert} onToggle={onToggleExpert}/>}
          onClick={() => onToggleExpert(!modeExpert)}
          sep={!!modeExpert}
        />

        {/* Fonctionnalités débloquées */}
        {modeExpert && (
          <div style={{margin:"0 12px 12px",padding:"12px 14px",
            borderRadius:12,background:"linear-gradient(135deg,#fffbeb,#fef9c3)",
            border:"1px solid #fde68a"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#92400e",marginBottom:8,
              textTransform:"uppercase",letterSpacing:.5}}>Fonctionnalités débloquées</div>
            {[
              "Statistiques avancées (KPIs)",
              "Export des données JSON",
              "Synchronisation manuelle Firebase",
              "Gestion du cache carte",
              "Taux de complétion des passages",
            ].map((f, i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                <svg width={10} height={10} viewBox="0 0 12 12" fill="none"
                  stroke="#059669" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="2 6 5 9 10 3"/>
                </svg>
                <span style={{fontSize:11,color:"#78350f"}}>{f}</span>
              </div>
            ))}
          </div>
        )}
      </Bloc>

      {/* ── STATS (mode expert uniquement) ── */}
      {modeExpert && (
        <Bloc titre="Statistiques" emoji="📊">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
            {[
              { label:"Ce mois",     val:passagesCeMois.length, color:"#0891b2" },
              { label:"Complétion",  val:`${tauxOk} %`,         color:"#059669" },
              { label:"Par client",  val:clients.length ? (passages.length / clients.length).toFixed(1) : "—", color:"#7c3aed" },
              { label:"Total",       val:passages.length,       color:"#d97706" },
            ].map(({ label, val, color }, i) => (
              <div key={i} style={{
                padding:"14px 16px",
                borderRight:  i % 2 === 0 ? "1px solid #f1f5f9" : "none",
                borderBottom: i < 2       ? "1px solid #f1f5f9" : "none",
              }}>
                <div style={{fontSize:24,fontWeight:800,color,lineHeight:1}}>{val}</div>
                <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,marginTop:3}}>{label}</div>
              </div>
            ))}
          </div>
        </Bloc>
      )}

      {/* ── NOTIFICATIONS ── */}
      <Bloc titre="Notifications" emoji="🔔">

        {/* ── Master toggle ── */}
        <Ligne
          icone={<svg width={17} height={17} viewBox="0 0 24 24" fill="none"
            stroke={notifEnabled?"#0891b2":"#94a3b8"} strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>}
          label="Notifications activées"
          detail={notifEnabled ? "Alertes sonores et visuelles actives" : "Toutes les notifications sont désactivées"}
          right={<Toggle on={notifEnabled} onToggle={setNotifEnabled}/>}
          onClick={() => setNotifEnabled(!notifEnabled)}
        />

        {/* ── Permission navigateur ── */}
        <Ligne
          icone={<svg width={17} height={17} viewBox="0 0 24 24" fill="none"
            stroke={permission==="granted"?"#059669":permission==="denied"?"#dc2626":"#d97706"}
            strokeWidth="2" strokeLinecap="round">
            {permission==="granted"
              ? <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
              : permission==="denied"
                ? <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>
                : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
            }
          </svg>}
          label={permission==="granted"?"Permission accordée ✅":permission==="denied"?"Permission refusée ❌":"Autoriser les notifications"}
          detail={
            permission==="granted" ? "Le navigateur peut afficher des alertes système"
            : permission==="denied" ? "Activez dans Réglages > Notifications > BRIBLUE"
            : "Appuyez pour autoriser les alertes navigateur"
          }
          onClick={permission !== "granted" ? demanderPermission : undefined}
        />

        {notifEnabled && (<>

          {/* ────────────────── VOLUME ────────────────── */}
          <div style={{padding:"12px 16px 10px",borderBottom:"1px solid #f1f5f9"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:36,height:36,borderRadius:10,flexShrink:0,
                background:"#f0f9ff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width={17} height={17} viewBox="0 0 24 24" fill="none"
                  stroke="#0891b2" strokeWidth="2" strokeLinecap="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  {volume > 0.5 && <path d="M19.07 4.93a10 10 0 010 14.14"/>}
                  {volume > 0    && <path d="M15.54 8.46a5 5 0 010 7.07"/>}
                </svg>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>Volume</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#0891b2"}}>{Math.round(volume*100)} %</span>
                </div>
                <div style={{position:"relative",height:28,display:"flex",alignItems:"center"}}>
                  {/* Piste colorée */}
                  <div style={{
                    position:"absolute",left:0,right:0,height:6,borderRadius:3,
                    background:`linear-gradient(90deg,#0891b2 ${volume*100}%,#e2e8f0 ${volume*100}%)`,
                  }}/>
                  <input type="range" min={0} max={1} step={0.05}
                    value={volume}
                    onChange={e => setVolume(parseFloat(e.target.value))}
                    style={{
                      width:"100%",appearance:"none",WebkitAppearance:"none",
                      background:"transparent",outline:"none",
                      cursor:"pointer",position:"relative",zIndex:1,margin:0,padding:0,
                    }}
                  />
                </div>
              </div>
              <button onClick={() => testerSon(notifSon, notifRepeat)}
                style={{flexShrink:0,width:34,height:34,borderRadius:9,border:"1.5px solid #e0f2fe",
                  background:"#f0f9ff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                  WebkitTapHighlightColor:"transparent"}}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2" strokeLinecap="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ────────────────── BRIEFING MATINAL ────────────────── */}
          <div style={{borderBottom:"1px solid #f1f5f9"}}>
            {/* Toggle + heure */}
            <div style={{padding:"12px 16px 8px",display:"flex",alignItems:"center",gap:13}}>
              <div style={{width:36,height:36,borderRadius:10,flexShrink:0,
                background:morningOn?"#fffbeb":"#f8fafc",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                ☀️
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>Briefing matinal</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Résumé RDVs + passages à l'heure choisie</div>
              </div>
              <input
                type="time"
                value={morningHeure}
                onChange={e => setMorningHeure(e.target.value)}
                disabled={!morningOn}
                style={{
                  fontSize:13,fontWeight:700,color:morningOn?"#0891b2":"#cbd5e1",
                  border:"1.5px solid",borderColor:morningOn?"#bae6fd":"#e2e8f0",
                  borderRadius:8,padding:"4px 8px",background:morningOn?"#f0f9ff":"#f8fafc",
                  outline:"none",fontFamily:"inherit",cursor:morningOn?"pointer":"not-allowed",
                  WebkitAppearance:"none",marginRight:6,
                }}
              />
              <Toggle on={morningOn} onToggle={setMorningOn}/>
            </div>

            {morningOn && (<>
              {/* Sélecteur de son */}
              <SonSelector
                label="Son du briefing"
                value={morningSon}
                onChange={setMorningSon}
              />
              {/* Répétitions */}
              <RepeatSelector
                label="Répétitions"
                value={morningRepeat}
                onChange={setMorningRepeat}
                options={[1,2,3]}
              />
              {/* Bouton test */}
              <BoutonTest
                label="Tester le briefing"
                onClick={() => testerNotif("morning")}
              />
            </>)}
          </div>

          {/* ────────────────── RAPPELS RDV ────────────────── */}
          <div style={{borderBottom:"1px solid #f1f5f9"}}>
            {/* Toggle */}
            <div style={{padding:"12px 16px 8px",display:"flex",alignItems:"center",gap:13}}>
              <div style={{width:36,height:36,borderRadius:10,flexShrink:0,
                background:rdvOn?"#f5f3ff":"#f8fafc",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                📅
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>Rappels rendez-vous</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Alerte X minutes avant chaque RDV</div>
              </div>
              <Toggle on={rdvOn} onToggle={setRdvOn}/>
            </div>

            {rdvOn && (<>
              {/* Délais */}
              <DelaiSelector
                value={rdvDelays}
                onChange={setRdvDelays}
              />
              {/* Son */}
              <SonSelector
                label="Son du rappel"
                value={rdvSon}
                onChange={setRdvSon}
              />
              {/* Répétitions */}
              <RepeatSelector
                label="Répétitions"
                value={rdvRepeat}
                onChange={setRdvRepeat}
                options={[1,2,3,5]}
              />
              {/* Bouton test */}
              <BoutonTest
                label="Tester le rappel RDV"
                onClick={() => testerNotif("rdv")}
              />
            </>)}
          </div>

          {/* ────────────────── NOTIFICATIONS GÉNÉRALES ────────────────── */}
          <div>
            <div style={{padding:"12px 16px 8px",display:"flex",alignItems:"center",gap:13}}>
              <div style={{width:36,height:36,borderRadius:10,flexShrink:0,
                background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                🔔
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>Notifications générales</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Nouvelles tâches, signatures de contrats…</div>
              </div>
            </div>
            <SonSelector
              label="Son"
              value={notifSon}
              onChange={setNotifSon}
            />
            <RepeatSelector
              label="Répétitions"
              value={notifRepeat}
              onChange={setNotifRepeat}
              options={[1,2,3]}
            />
            <BoutonTest
              label="Tester la notification"
              onClick={() => testerNotif("notif")}
            />
          </div>

        </>)}

        {/* Feedback test */}
        {testMsg && (
          <div style={{
            margin:"0 12px 12px",padding:"9px 14px",
            borderRadius:10,background:"#f0f9ff",border:"1px solid #bae6fd",
            fontSize:12,fontWeight:600,color:"#0891b2",
            display:"flex",alignItems:"center",gap:7,
          }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            {testMsg}
          </div>
        )}
      </Bloc>

      <Bloc titre="Données" emoji="💾">
        <Ligne
          icone={<svg width={17} height={17} viewBox="0 0 24 24" fill="none"
            stroke="#0891b2" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>}
          label="Exporter les données"
          detail={exportMsg || `${clients.length} clients · ${passages.length} passages`}
          onClick={exportJSON}
        />
        <Ligne
          icone={<svg width={17} height={17} viewBox="0 0 24 24" fill="none"
            stroke="#7c3aed" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>}
          label="Synchroniser Firebase"
          detail={syncMsg || "Forcer la sauvegarde en ligne maintenant"}
          onClick={syncFirebase}
        />
        <Ligne
          icone={<svg width={17} height={17} viewBox="0 0 24 24" fill="none"
            stroke="#059669" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>}
          label="Import intelligent — Rapports HTML"
          detail="Rapports manquants • données vides • photos — tout détecté automatiquement"
          onClick={() => onOpenImportHTML?.()}
          sep={modeExpert}
        />
        {modeExpert && (
          <Ligne
            icone={<svg width={17} height={17} viewBox="0 0 24 24" fill="none"
              stroke="#d97706" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>}
            label="Vider cache carte"
            detail={cacheMsg || "Forcer le re-géocodage des adresses"}
            onClick={viderCache}
            sep={false}
          />
        )}
      </Bloc>

      {/* ── APPLICATION ── */}
      <Bloc titre="Application" emoji="📱">
        <Ligne
          icone={<svg width={17} height={17} viewBox="0 0 24 24" fill="none"
            stroke="#0891b2" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>}
          label="Version"
          right={<span style={{fontSize:12,fontWeight:700,color:"#94a3b8"}}>2.1.0</span>}
        />
        <Ligne
          icone={<svg width={17} height={17} viewBox="0 0 24 24" fill="none"
            stroke="#059669" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>}
          label="Cache local"
          detail="Données stockées dans ce navigateur"
          right={<span style={{fontSize:12,fontWeight:700,color:"#94a3b8"}}>{cacheSize}</span>}
          sep={false}
        />
      </Bloc>

      {/* ── À PROPOS ── */}
      <Bloc titre="À propos" emoji="🌊">
        <div style={{padding:"16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <div style={{width:44,height:44,borderRadius:14,flexShrink:0,
              background:"linear-gradient(135deg,#0891b2,#0284c7)",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width={22} height={18} viewBox="0 0 32 24" fill="none"
                stroke="white" strokeLinecap="round">
                <path d="M1 18c3.5 4 7 4 10.5 0S18 14 21.5 18 28 22 31 18" strokeWidth="3"/>
                <path d="M3 10c3 3 6 3 9 0s6-3 9 0 5 3 8 0" strokeWidth="2" strokeOpacity=".6"/>
              </svg>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>BRIBLUE</div>
              <div style={{fontSize:11,color:"#64748b"}}>Création · Traitement · Installation · Dépannage</div>
            </div>
          </div>
          <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.8}}>
            SIRET 84345436400053 · La Seyne-sur-Mer<br/>
            Application de gestion pisciniste — usage interne
          </div>
        </div>
      </Bloc>

      {/* ── DÉCONNEXION ── */}
      <Bloc>
        <Ligne
          icone={<svg width={17} height={17} viewBox="0 0 24 24" fill="none"
            stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>}
          label="Se déconnecter"
          detail="Retour à l'écran de connexion"
          onClick={onLogout}
          danger
          sep={false}
        />
      </Bloc>

    </div>
  );
}
