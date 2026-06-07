// @ts-nocheck
import React, { useState, useEffect } from "react";

// ─── COMPOSANTS UTILITAIRES ──────────────────────────────────────────────────

function Toggle({ value, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      style={{
        width:46, height:26, borderRadius:13, border:"none", cursor:disabled?"not-allowed":"pointer",
        background: value ? "linear-gradient(135deg,#0891b2,#0284c7)" : "#e2e8f0",
        position:"relative", flexShrink:0, transition:"background .25s",
        boxShadow: value ? "0 2px 8px rgba(8,145,178,0.4)" : "inset 0 1px 3px rgba(0,0,0,0.1)",
        opacity: disabled ? 0.5 : 1,
        WebkitTapHighlightColor:"transparent",
        outline:"none",
      }}
    >
      <div style={{
        width:20, height:20, borderRadius:"50%", background:"#fff",
        position:"absolute", top:3, left: value ? 23 : 3,
        transition:"left .22s cubic-bezier(.34,1.56,.64,1)",
        boxShadow:"0 2px 6px rgba(0,0,0,0.18)",
      }}/>
    </button>
  );
}

function SettingRow({ icon, label, sub, right, onClick, danger, first, last, noBorder }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        width:"100%", display:"flex", alignItems:"center", gap:12,
        padding:"13px 16px",
        background: "none", border:"none", cursor: onClick ? "pointer" : "default",
        fontFamily:"inherit", textAlign:"left",
        borderBottom: (!last && !noBorder) ? "1px solid #f1f5f9" : "none",
        WebkitTapHighlightColor:"transparent",
        transition:"background .1s",
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = "#f8fafc"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
    >
      {/* Icône */}
      {icon && (
        <div style={{
          width:34, height:34, borderRadius:10, flexShrink:0,
          background: danger ? "#fef2f2" : "#f0f9ff",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {icon}
        </div>
      )}
      {/* Texte */}
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:14, fontWeight:600, color: danger ? "#dc2626" : "#0f172a", lineHeight:1.3}}>
          {label}
        </div>
        {sub && (
          <div style={{fontSize:11, color:"#94a3b8", marginTop:2, lineHeight:1.4}}>{sub}</div>
        )}
      </div>
      {/* Droite */}
      {right && <div style={{flexShrink:0}}>{right}</div>}
      {/* Chevron si cliquable et pas de right */}
      {onClick && !right && (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      )}
    </button>
  );
}

function Section({ title, children, icon }) {
  return (
    <div style={{marginBottom:20}}>
      {title && (
        <div style={{
          display:"flex", alignItems:"center", gap:6,
          padding:"0 4px", marginBottom:6,
        }}>
          {icon && <span style={{fontSize:13}}>{icon}</span>}
          <span style={{fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:.8}}>
            {title}
          </span>
        </div>
      )}
      <div style={{
        background:"#fff", borderRadius:16,
        border:"1px solid #e2e8f0",
        boxShadow:"0 2px 8px rgba(0,0,0,0.04)",
        overflow:"hidden",
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── PAGE PARAMÈTRES ─────────────────────────────────────────────────────────

export function PageParametres({
  modeExpert, onToggleExpert,
  clients = [], passages = [], rdvs = [],
  onLogout,
}) {
  const [syncInfo,    setSyncInfo]    = useState(null);
  const [cacheSize,   setCacheSize]   = useState(null);
  const [exportDone,  setExportDone]  = useState(false);
  const [cleared,     setCleared]     = useState(false);

  // ── Stats app ──
  const appVersion = "2.1.0";
  const nbPassages = passages.length;
  const nbClients  = clients.length;
  const nbRdvs     = rdvs.length;

  // ── Sync Firebase ──
  const forcerSync = async () => {
    setSyncInfo("⏳ Synchronisation…");
    try {
      const { flushPendingNow } = await import("../lib/storage");
      await flushPendingNow();
      setSyncInfo("✅ Synchronisé avec Firebase");
    } catch {
      setSyncInfo("⚠️ Erreur de synchronisation");
    }
    setTimeout(() => setSyncInfo(null), 3000);
  };

  // ── Export JSON ──
  const exporterDonnees = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: appVersion,
      clients,
      passages,
      rdvs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `briblue-export-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2500);
  };

  // ── Vider cache géocodage ──
  const viderCacheGeo = () => {
    try { localStorage.removeItem("bb_geocache_v1"); }
    catch { /* noop */ }
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  // ── Taille cache ──
  useEffect(() => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("briblue")) {
          total += (localStorage.getItem(key) || "").length;
        }
      }
      setCacheSize((total / 1024).toFixed(1) + " Ko");
    } catch { setCacheSize("—"); }
  }, []);

  // ── Expert : stat rapide ──
  const passagesCeMois = passages.filter(p => {
    const d = new Date(p.date);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  });
  const tauxOk = passages.length > 0
    ? Math.round(passages.filter(p => p.ok).length / passages.length * 100)
    : 0;

  return (
    <div style={{maxWidth:600, margin:"0 auto", padding:"0 0 40px"}}>

      {/* ── HERO PROFIL ── */}
      <div style={{
        margin:"0 0 24px",
        borderRadius:20, overflow:"hidden",
        background:"linear-gradient(145deg,#075985,#0891b2,#0e7490)",
        boxShadow:"0 4px 20px rgba(8,145,178,0.25)",
        position:"relative",
      }}>
        <div style={{
          position:"absolute", right:-30, top:-30, width:150, height:150,
          borderRadius:"50%", background:"rgba(255,255,255,0.06)",
          pointerEvents:"none",
        }}/>
        <div style={{position:"relative", padding:"24px 20px 22px", display:"flex", alignItems:"center", gap:16}}>
          <div style={{
            width:58, height:58, borderRadius:18,
            background:"rgba(255,255,255,0.18)",
            border:"2px solid rgba(255,255,255,0.3)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:26, flexShrink:0,
          }}>
            🏊
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-0.3px"}}>Dorian</div>
            <div style={{fontSize:12, color:"rgba(255,255,255,0.65)", marginTop:2}}>BRIBLUE · Technicien piscine</div>
            <div style={{display:"flex", gap:12, marginTop:8}}>
              {[
                [nbClients,    "clients"],
                [nbPassages,   "passages"],
                [nbRdvs,       "RDV"],
              ].map(([n, l]) => (
                <div key={l} style={{textAlign:"center"}}>
                  <div style={{fontSize:16, fontWeight:800, color:"#fff", lineHeight:1}}>{n}</div>
                  <div style={{fontSize:9, color:"rgba(255,255,255,0.55)", fontWeight:600, textTransform:"uppercase", letterSpacing:.5}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          {modeExpert && (
            <div style={{
              position:"absolute", top:16, right:16,
              background:"rgba(251,191,36,0.2)", border:"1px solid rgba(251,191,36,0.5)",
              borderRadius:20, padding:"3px 10px",
              fontSize:10, fontWeight:700, color:"#fbbf24",
              display:"flex", alignItems:"center", gap:4,
            }}>
              ⚡ EXPERT
            </div>
          )}
        </div>
      </div>

      {/* ── MODE EXPERT ── */}
      <Section title="Mode" icon="⚡">
        <div style={{padding:"4px 0"}}>
          <SettingRow
            icon={<svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={modeExpert?"#f59e0b":"#0891b2"} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>}
            label="Mode Expert"
            sub={modeExpert
              ? "Activé — statistiques avancées, outils techniques et données brutes visibles"
              : "Désactivé — interface simplifiée pour un usage quotidien fluide"}
            right={<Toggle value={modeExpert} onChange={onToggleExpert}/>}
            noBorder
          />
        </div>

        {/* Détails expert (affiché quand activé) */}
        {modeExpert && (
          <div style={{
            margin:"0 12px 12px",
            padding:"12px 14px",
            borderRadius:12,
            background:"linear-gradient(135deg,#fffbeb,#fef3c7)",
            border:"1px solid #fde68a",
          }}>
            <div style={{fontSize:11, fontWeight:700, color:"#92400e", marginBottom:8, textTransform:"uppercase", letterSpacing:.5}}>
              ⚡ Fonctionnalités débloquées
            </div>
            {[
              "Statistiques avancées et KPIs détaillés",
              "Export des données en JSON",
              "Synchronisation manuelle Firebase",
              "Taux de complétion des passages",
              "Gestion du cache et diagnostic",
              "IDs techniques visibles",
            ].map((f, i) => (
              <div key={i} style={{display:"flex", alignItems:"center", gap:7, marginBottom:4}}>
                <svg width={10} height={10} viewBox="0 0 12 12" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="2 6 5 9 10 3"/>
                </svg>
                <span style={{fontSize:11, color:"#78350f"}}>{f}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── STATS EXPERT ── */}
      {modeExpert && (
        <Section title="Statistiques" icon="📊">
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:0}}>
            {[
              { label:"Passages ce mois", val:passagesCeMois.length, color:"#0891b2", bg:"#e0f2fe" },
              { label:"Taux de complétion", val:`${tauxOk} %`, color:"#059669", bg:"#f0fdf4" },
              { label:"Moy. passages/client", val:nbClients > 0 ? (nbPassages/nbClients).toFixed(1) : "—", color:"#7c3aed", bg:"#f5f3ff" },
              { label:"Total interventions", val:nbPassages, color:"#d97706", bg:"#fffbeb" },
            ].map(({ label, val, color, bg }, i) => (
              <div key={i} style={{
                padding:"14px 16px",
                borderRight: i % 2 === 0 ? "1px solid #f1f5f9" : "none",
                borderBottom: i < 2 ? "1px solid #f1f5f9" : "none",
              }}>
                <div style={{fontSize:22, fontWeight:800, color}}>{val}</div>
                <div style={{fontSize:10, color:"#94a3b8", fontWeight:600, marginTop:2}}>{label}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── DONNÉES ── */}
      <Section title="Données" icon="💾">
        <SettingRow
          icon={<svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
          label="Exporter les données"
          sub={exportDone ? "✅ Téléchargement en cours…" : `${nbClients} clients · ${nbPassages} passages · ${nbRdvs} RDV`}
          onClick={exporterDonnees}
        />
        <SettingRow
          icon={<svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>}
          label="Synchroniser avec Firebase"
          sub={syncInfo || "Forcer la sauvegarde en ligne maintenant"}
          onClick={forcerSync}
        />
        {modeExpert && (
          <SettingRow
            icon={<svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>}
            label="Vider le cache géocodage"
            sub={cleared ? "✅ Cache supprimé" : "Forcer le re-géocodage des adresses sur la carte"}
            onClick={viderCacheGeo}
            last
          />
        )}
      </Section>

      {/* ── APPLICATION ── */}
      <Section title="Application" icon="📱">
        <SettingRow
          icon={<svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          label="Version"
          sub="BRIBLUE App"
          right={<span style={{fontSize:12, fontWeight:700, color:"#94a3b8"}}>{appVersion}</span>}
        />
        <SettingRow
          icon={<svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
          label="Cache local"
          sub="Données stockées dans ce navigateur"
          right={<span style={{fontSize:12, fontWeight:700, color:"#94a3b8"}}>{cacheSize || "…"}</span>}
        />
        {modeExpert && (
          <SettingRow
            icon={<svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>}
            label="Technologies"
            sub="React 19 · Vite · Firebase · Leaflet"
            last
          />
        )}
      </Section>

      {/* ── CREDITS ── */}
      <Section title="À propos" icon="🏊">
        <div style={{padding:"16px"}}>
          <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:12}}>
            <div style={{
              width:44, height:44, borderRadius:14,
              background:"linear-gradient(135deg,#0891b2,#0284c7)",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0,
            }}>
              <svg width={22} height={20} viewBox="0 0 32 28" fill="none" stroke="white" strokeLinecap="round">
                <path d="M1 22c3.5 4.5 7 4.5 10.5 0S18 17.5 21.5 22 28 26.5 31 22" strokeWidth="3.2"/>
                <path d="M3 14c3 3.5 6 3.5 9 0s6-3.5 9 0 5 3.5 8 0" strokeWidth="2.2" strokeOpacity="0.68"/>
              </svg>
            </div>
            <div>
              <div style={{fontSize:15, fontWeight:800, color:"#0f172a"}}>BRIBLUE</div>
              <div style={{fontSize:11, color:"#64748b"}}>Création · Traitement · Installation · Dépannage</div>
            </div>
          </div>
          <div style={{fontSize:11, color:"#94a3b8", lineHeight:1.7}}>
            SIRET 84345436400053 · La Seyne-sur-Mer<br/>
            Application de gestion pisciniste — usage interne
          </div>
        </div>
      </Section>

      {/* ── DÉCONNEXION ── */}
      <Section>
        <SettingRow
          icon={<svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
          label="Se déconnecter"
          sub="Retour à l'écran de connexion"
          onClick={onLogout}
          danger
          noBorder
        />
      </Section>

    </div>
  );
}
