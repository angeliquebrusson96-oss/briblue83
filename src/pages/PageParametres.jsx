// @ts-nocheck
import React, { useState, useEffect } from "react";
import { flushPendingNow } from "../lib/storage";
import { playChimeMorning, playAlertRdv, playNotifSound, sendLocalNotification } from "../styles";

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
// PAGE PARAMÈTRES
// ─────────────────────────────────────────────────────────────────────────────
export function PageParametres({
  modeExpert, onToggleExpert,
  clients = [], passages = [], rdvs = [],
  onLogout,
}) {
  const [syncMsg,    setSyncMsg]    = useState("");
  const [exportMsg,  setExportMsg]  = useState("");
  const [cacheMsg,   setCacheMsg]   = useState("");
  const [cacheSize,  setCacheSize]  = useState("…");

  // ── État notifications ──
  const ls = (k, def) => { try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch { return def; } };
  const setLs = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  const [notifEnabled, setNotifEnabledRaw] = useState(() => ls("briblue_notif_enabled", true));
  const [morningOn,    setMorningOnRaw]    = useState(() => ls("briblue_notif_morning",  true));
  const [rdvOn,        setRdvOnRaw]        = useState(() => ls("briblue_notif_rdv",      true));
  const [permission,   setPermission]      = useState(() => typeof Notification !== "undefined" ? Notification.permission : "default");
  const [testMsg,      setTestMsg]         = useState("");

  const setNotifEnabled = v => { setNotifEnabledRaw(v); setLs("briblue_notif_enabled", v); };
  const setMorningOn    = v => { setMorningOnRaw(v);    setLs("briblue_notif_morning",  v); };
  const setRdvOn        = v => { setRdvOnRaw(v);        setLs("briblue_notif_rdv",      v); };

  // Demander la permission navigateur
  const demanderPermission = async () => {
    if (!("Notification" in window)) { setTestMsg("❌ Notifications non supportées"); return; }
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === "granted") { setTestMsg("✅ Permission accordée !"); }
    else if (p === "denied") { setTestMsg("❌ Bloquées — autorisez dans les réglages du navigateur"); }
    setTimeout(() => setTestMsg(""), 4000);
  };

  // Tester le son
  const testerSon = (type = "morning") => {
    if (type === "morning")  { playChimeMorning(); setTestMsg("🎵 Carillon matinal"); }
    if (type === "rdv")      { playAlertRdv();     setTestMsg("🔔 Sonnerie RDV"); }
    if (type === "notif")    { playNotifSound();   setTestMsg("🔈 Son notification"); }
    setTimeout(() => setTestMsg(""), 2500);
    // Envoyer une notif test si permission ok
    if (permission === "granted" && type === "morning") {
      sendLocalNotification("☀️ BRIBLUE — Test", "Voici à quoi ressemble le briefing matinal.", { tag:"briblue-test" });
    }
    if (permission === "granted" && type === "rdv") {
      sendLocalNotification("📅 BRIBLUE — Test RDV", "Rappel : RDV dans 15 min — Test client", { tag:"briblue-test-rdv", requireInteraction:false });
    }
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

      {/* ── DONNÉES ── */}
      {/* ── NOTIFICATIONS ── */}
      <Bloc titre="Notifications" emoji="🔔">

        {/* Activer/Désactiver globalement */}
        <Ligne
          icone={<svg width={17} height={17} viewBox="0 0 24 24" fill="none"
            stroke={notifEnabled?"#0891b2":"#94a3b8"} strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>}
          label="Notifications activées"
          detail={notifEnabled ? "Les alertes sont actives" : "Toutes les notifications sont désactivées"}
          right={<Toggle on={notifEnabled} onToggle={setNotifEnabled}/>}
          onClick={() => setNotifEnabled(!notifEnabled)}
        />

        {/* Permission navigateur */}
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
            permission==="granted" ? "Le navigateur peut afficher des alertes"
            : permission==="denied" ? "Activez dans Réglages > Notifications > BRIBLUE"
            : "Cliquez pour autoriser les notifications du navigateur"
          }
          onClick={permission !== "granted" ? demanderPermission : undefined}
          right={testMsg && permission==="granted" ? <span style={{fontSize:10,color:"#0891b2",fontWeight:600}}>{testMsg}</span> : null}
        />

        {notifEnabled && (
          <>
            {/* Briefing matinal */}
            <Ligne
              icone={<span style={{fontSize:17}}>☀️</span>}
              label="Briefing matinal — 8h00"
              detail="Résumé des RDVs et passages du jour au réveil"
              right={<Toggle on={morningOn} onToggle={setMorningOn}/>}
              onClick={() => setMorningOn(!morningOn)}
            />

            {/* Rappels RDV */}
            <Ligne
              icone={<span style={{fontSize:17}}>📅</span>}
              label="Rappels rendez-vous"
              detail="Alerte 15 min et 5 min avant chaque RDV"
              right={<Toggle on={rdvOn} onToggle={setRdvOn}/>}
              onClick={() => setRdvOn(!rdvOn)}
              sep={false}
            />
          </>
        )}

        {/* Barre de test sons */}
        <div style={{
          padding:"10px 14px 12px",
          borderTop:"1px solid #f1f5f9",
          background:"#f8fafc",
        }}>
          <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>
            Tester les sons
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[
              { label:"☀️ Briefing", type:"morning" },
              { label:"📅 RDV",      type:"rdv"     },
              { label:"🔈 Notif",    type:"notif"   },
            ].map(({ label, type }) => (
              <button key={type} onClick={() => testerSon(type)} style={{
                padding:"6px 14px", borderRadius:20, border:"1.5px solid #e2e8f0",
                background:"#fff", cursor:"pointer", fontFamily:"inherit",
                fontSize:11, fontWeight:600, color:"#374151",
                WebkitTapHighlightColor:"transparent",
                transition:"background .1s",
              }}
              onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                {label}
              </button>
            ))}
          </div>
          {testMsg && (
            <div style={{marginTop:8,fontSize:11,fontWeight:600,color:"#0891b2"}}>{testMsg}</div>
          )}
        </div>
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
