// @ts-nocheck
import React, { useState, useMemo } from "react";
import { DS } from "../utils/constants";
import { TODAY } from "../utils/helpers";
import { Modal } from "../components/ui";

// ─────────────────────────────────────────────────────────────────────────────
// PAGE SECRÉTAIRE — vue focalisée : planifier interventions et rapports
// ─────────────────────────────────────────────────────────────────────────────

const MOIS_L = ["", "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const JOURS_L = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Palette de la vue secrétaire
const P = {
  violet:      "#7c3aed",
  violetLight: "#f5f3ff",
  violetDeep:  "#4c1d95",
  cyan:        "#0891b2",
  cyanLight:   "#f0f9ff",
  orange:      "#f97316",
  orangeLight: "#fff7ed",
  ink:         "#0f172a",
  slate:       "#64748b",
  mute:        "#94a3b8",
  line:        "#eef2f6",
};

function daysDelta(iso) {
  const t = new Date(TODAY).getTime();
  const d = new Date(iso).getTime();
  return Math.round((d - t) / 86400000);
}

function dateBadgeLabel(iso) {
  const delta = daysDelta(iso);
  if (delta === 0) return "Aujourd'hui";
  if (delta === 1) return "Demain";
  if (delta > 1 && delta <= 6) return JOURS_L[new Date(iso).getDay()];
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")} ${MOIS_L[d.getMonth()+1]}`;
}

export function PageSecretaire({
  clients, rdvs, passages, livraisons, events, session,
  onAddRdv, onEditRdv, onAddRapport, onClientClick, onLogout,
  onAddClient, onEditPassage, onAddLivraison, onEditLivraison, onDeleteEvent,
}) {
  const [search, setSearch] = useState("");

  // Interventions à venir = RDV + passages planifiés (ok=false, date >= today)
  const interventions = useMemo(() => {
    const list = [];
    for (const r of (rdvs || [])) {
      if (r.date >= TODAY) list.push({ ...r, _kind: "rdv" });
    }
    for (const p of (passages || [])) {
      if (p.date >= TODAY && !p.ok) list.push({ ...p, _kind: "rapport" });
    }
    list.sort((a, b) => a.date.localeCompare(b.date) || (a.heure || "").localeCompare(b.heure || ""));
    return list;
  }, [rdvs, passages]);

  const aujourdhui = interventions.filter(i => i.date === TODAY);
  const semaine = useMemo(() => {
    const s = new Date(); s.setDate(s.getDate() + 7);
    const sStr = s.toISOString().slice(0, 10);
    return interventions.filter(i => i.date > TODAY && i.date <= sStr);
  }, [interventions]);
  const plusTard = useMemo(() => {
    const s = new Date(); s.setDate(s.getDate() + 7);
    const sStr = s.toISOString().slice(0, 10);
    return interventions.filter(i => i.date > sStr);
  }, [interventions]);

  const rapportsFaits7j = useMemo(() => {
    const y = new Date(); y.setDate(y.getDate() - 7);
    const yStr = y.toISOString().slice(0, 10);
    return (passages || []).filter(p => (p.date || "") >= yStr && p.ok).length;
  }, [passages]);

  const clientsFiltres = useMemo(() => {
    if (!search.trim()) return [];
    const s = search.toLowerCase().trim();
    return (clients || [])
      .filter(c => (c.nom || "").toLowerCase().includes(s)
                || (c.prenom || "").toLowerCase().includes(s)
                || (c.adresse || "").toLowerCase().includes(s))
      .slice(0, 8);
  }, [clients, search]);

  // Résout la cible d'un événement (RDV, passage, livraison) — null si supprimé.
  const rdvById = useMemo(() => new Map((rdvs || []).map(r => [r.id, r])), [rdvs]);
  const passageById = useMemo(() => new Map((passages || []).map(p => [p.id, p])), [passages]);
  const livById = useMemo(() => new Map((livraisons || []).map(l => [l.id, l])), [livraisons]);

  // Fallback pour les événements sans ref (formats de label historiques variés :
  // "Client", "Client — 2026-08-29", "Angélique a ajouté un RDV · Client — 29 août 09:00"…).
  // Stratégie robuste : on cherche le nom de client le plus long qui apparaît
  // dans le label, puis l'objet le plus pertinent pour ce client.
  const findByLabel = (type, label) => {
    if (!label) return null;
    const lower = label.toLowerCase();
    // Nom de client le plus spécifique (le plus long) contenu dans le label
    let client = null;
    for (const c of (clients || [])) {
      const nom = (c.nom || "").trim();
      if (nom.length > 2 && lower.includes(nom.toLowerCase())) {
        if (!client || nom.length > (client.nom || "").length) client = c;
      }
    }
    if (!client) return null;

    // Date ISO éventuellement présente dans le label
    const iso = (label.match(/(\d{4}-\d{2}-\d{2})/) || [])[1];

    const isRdvType     = /rdv/.test(type);
    const isLivType     = /livraison/.test(type);

    if (isRdvType) {
      const cands = (rdvs || []).filter(r => r.clientId === client.id);
      const exact = iso ? cands.find(r => r.date === iso) : null;
      const obj = exact || [...cands].sort((a,b)=>b.date.localeCompare(a.date))[0];
      return obj ? { kind:"rdv", obj } : null;
    }
    if (isLivType) {
      const cands = (livraisons || []).filter(l => l.clientId === client.id);
      const exact = iso ? cands.find(l => l.date === iso) : null;
      const obj = exact || [...cands].sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))[0];
      return obj ? { kind:"livraison", obj } : null;
    }
    // rapport / rapport_planifie / signature → passage
    const cands = (passages || []).filter(p => p.clientId === client.id);
    const exact = iso ? cands.find(p => p.date === iso) : null;
    const obj = exact || [...cands].sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))[0];
    return obj ? { kind:"passage", obj } : null;
  };

  const resolveTarget = (e) => {
    if (e.refKind && e.refId) {
      if (e.refKind === "rdv" && rdvById.has(e.refId))         return { kind:"rdv", obj: rdvById.get(e.refId) };
      if (e.refKind === "passage" && passageById.has(e.refId)) return { kind:"passage", obj: passageById.get(e.refId) };
      if (e.refKind === "livraison" && livById.has(e.refId))   return { kind:"livraison", obj: livById.get(e.refId) };
      return null; // ref explicite mais objet supprimé
    }
    return findByLabel(e.type, e.label);
  };

  const evtsRecents = useMemo(() => {
    return (events || [])
      .filter(e => {
        // Si l'événement porte une référence explicite à un objet, on ne le
        // garde que si l'objet existe encore.
        if (e.refKind && e.refId) {
          if (e.refKind === "rdv")       return rdvById.has(e.refId);
          if (e.refKind === "passage")   return passageById.has(e.refId);
          if (e.refKind === "livraison") return livById.has(e.refId);
        }
        return true;
      })
      .slice(0, 8);
  }, [events, rdvById, passageById, livById]);

  const openEvent = (e) => {
    const target = resolveTarget(e);
    if (!target) return;
    if (target.kind === "rdv" && onEditRdv) onEditRdv(target.obj);
    else if (target.kind === "passage" && onEditPassage) onEditPassage(target.obj);
    else if (target.kind === "livraison" && onEditLivraison) onEditLivraison(target.obj);
  };

  const InterventionCard = ({ item }) => {
    const cli = (clients || []).find(c => c.id === item.clientId);
    const isRapport = item._kind === "rapport";
    const bySec = item.createdByRole === "secretaire";
    const accent = isRapport ? P.cyan : P.violet;
    const accentSoft = isRapport ? P.cyanLight : P.violetLight;
    const label = dateBadgeLabel(item.date);
    const delta = daysDelta(item.date);

    return (
      <div style={{
        display: "flex", alignItems: "stretch", gap: 0,
        background: "#fff", borderRadius: 14, overflow: "hidden",
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        border: `1px solid ${P.line}`,
        marginBottom: 10,
      }}>
        {/* Barre latérale colorée */}
        <div style={{ width: 4, background: accent, flexShrink: 0 }} />

        {/* Bloc date */}
        <div style={{
          minWidth: 68, padding: "12px 8px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: accentSoft, flexShrink: 0,
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: .5 }}>
            {label}
          </div>
          {item.heure && (
            <div style={{ fontSize: 15, fontWeight: 900, color: P.ink, marginTop: 3, lineHeight: 1 }}>
              {item.heure}
            </div>
          )}
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, minWidth: 0, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 9, fontWeight: 800, color: accent,
              background: accentSoft, padding: "2px 7px", borderRadius: 6,
              textTransform: "uppercase", letterSpacing: .5,
            }}>
              {isRapport ? "Rapport" : "RDV"}
            </span>
            {item.type && (
              <span style={{ fontSize: 11, color: P.slate, fontWeight: 600 }}>
                {item.type}
              </span>
            )}
            {bySec && (
              <span style={{ fontSize: 9, fontWeight: 700, color: P.violet, background: P.violetLight, padding: "1px 6px", borderRadius: 6 }}>
                Vous
              </span>
            )}
          </div>
          <div onClick={() => cli && onClientClick?.(cli)}
            style={{
              fontSize: 14, fontWeight: 700, color: P.ink,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              cursor: cli ? "pointer" : "default",
            }}>
            {cli?.nom || "Client ?"}
          </div>
          {cli?.adresse && (
            <div style={{ fontSize: 11, color: P.mute, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {cli.adresse}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", flexDirection:"column", borderLeft: `1px solid ${P.line}`, flexShrink:0 }}>
          {/* Appeler client */}
          {cli?.tel && (
            <a href={`tel:${cli.tel}`} title={`Appeler ${cli.nom}`}
              style={{
                width: 40, height: 42, display:"flex", alignItems:"center", justifyContent:"center",
                textDecoration:"none", borderBottom: `1px solid ${P.line}`,
                WebkitTapHighlightColor:"transparent",
              }}
              onClick={e=>e.stopPropagation()}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.9.34 1.78.62 2.63a2 2 0 01-.45 2.11L8 9.91a16 16 0 006 6l1.45-1.29a2 2 0 012.11-.45c.85.28 1.73.49 2.63.62A2 2 0 0122 16.92z"/>
              </svg>
            </a>
          )}
          {/* Modifier */}
          <button onClick={() => isRapport ? onEditPassage?.(item) : onEditRdv?.(item)} title="Modifier"
            style={{
              width: 40, flex:1, minHeight:42, border: "none", background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
            }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={P.slate} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const Section = ({ titre, count, items, vide }) => {
    if (!items.length && !vide) return null;
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 4px 8px",
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: P.ink, letterSpacing: -.2 }}>
            {titre}
          </span>
          {count > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 800, color: P.violet,
              background: P.violetLight, padding: "3px 9px", borderRadius: 20,
            }}>{count}</span>
          )}
        </div>
        {items.length === 0 ? (
          <div style={{
            padding: "18px 14px", textAlign: "center", fontSize: 12, color: P.mute,
            background: "#fff", borderRadius: 14, border: `1px dashed ${P.line}`,
          }}>{vide}</div>
        ) : items.map(item => <InterventionCard key={item._kind + item.id} item={item} />)}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 0 40px", fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>

      {/* Hero */}
      <div style={{
        position: "relative", overflow: "hidden",
        borderRadius: 22, marginBottom: 18,
        background: `linear-gradient(135deg, ${P.violetDeep} 0%, ${P.violet} 55%, #a78bfa 100%)`,
        padding: "22px 22px 24px",
        boxShadow: `0 10px 28px rgba(76,29,149,0.28)`,
      }}>
        <div style={{ position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.20), transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -50, left: -40, width: 150, height: 150, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.25), transparent 70%)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.72)", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>
            Espace secrétariat
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: -.5, marginTop: 6 }}>
            Bonjour {session?.prenom || "Angélique"} <span style={{ fontWeight: 400 }}>👋</span>
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.78)", marginTop: 6, lineHeight: 1.5 }}>
            Planifiez les interventions de Dorian et suivez son activité en temps réel.
          </div>

          {/* Stats hero */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
            {[
              { label: "Aujourd'hui", val: aujourdhui.length },
              { label: "Cette sem.", val: semaine.length },
              { label: "Rapports 7j", val: rapportsFaits7j },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 8px",
                textAlign: "center", border: "1px solid rgba(255,255,255,0.14)",
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.72)", fontWeight: 600, marginTop: 4, textTransform: "uppercase", letterSpacing: .4 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <button onClick={() => onAddRdv?.()}
          style={{
            padding: "16px 14px", borderRadius: 16, border: "none",
            background: `linear-gradient(135deg, ${P.violet} 0%, ${P.violetDeep} 100%)`,
            color: "#fff", fontFamily: "inherit", cursor: "pointer",
            boxShadow: `0 6px 16px rgba(124,58,237,0.35)`,
            display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
            WebkitTapHighlightColor: "transparent",
          }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -.2 }}>Planifier un RDV</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>Rendez-vous ponctuel</div>
          </div>
        </button>
        <button onClick={() => onAddRapport?.()}
          style={{
            padding: "16px 14px", borderRadius: 16, border: "none",
            background: `linear-gradient(135deg, ${P.cyan} 0%, #0369a1 100%)`,
            color: "#fff", fontFamily: "inherit", cursor: "pointer",
            boxShadow: `0 6px 16px rgba(8,145,178,0.35)`,
            display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
            WebkitTapHighlightColor: "transparent",
          }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="18" rx="2" />
            <rect x="9" y="2" width="6" height="4" rx="1" />
            <path d="M8 12l2 2 4-4" />
          </svg>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -.2 }}>Planifier un rapport</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>Intervention à effectuer</div>
          </div>
        </button>
      </div>

      {/* Action secondaire : livraison */}
      {onAddLivraison && (
        <button onClick={onAddLivraison}
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 14, marginBottom: 18,
            background: "#fff", border: `1px solid ${P.line}`, cursor: "pointer",
            fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 1px 2px rgba(15,23,42,0.04)", WebkitTapHighlightColor: "transparent",
          }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: P.orangeLight,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={P.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.3"/><circle cx="18.5" cy="18.5" r="2.3"/>
            </svg>
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: P.ink }}>Enregistrer une livraison</div>
            <div style={{ fontSize: 10.5, color: P.mute, marginTop: 1 }}>Produits livrés à un client</div>
          </div>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Recherche client + Nouveau client */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={P.mute} strokeWidth="2.2" strokeLinecap="round"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un client…"
              style={{
                width: "100%", padding: "13px 14px 13px 40px", borderRadius: 14,
                border: `1px solid ${P.line}`, fontSize: 13.5, outline: "none",
                fontFamily: "inherit", background: "#fff", boxSizing: "border-box", color: P.ink,
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              }} />
          </div>
          {onAddClient && (
            <button onClick={onAddClient} title="Nouveau client"
              style={{
                flexShrink: 0, width: 48, height: 48, borderRadius: 14,
                background: "#fff", border: `1px solid ${P.line}`,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                WebkitTapHighlightColor: "transparent",
              }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={P.violet} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                <line x1="19" y1="3" x2="19" y2="9"/><line x1="16" y1="6" x2="22" y2="6"/>
              </svg>
            </button>
          )}
        </div>
        {clientsFiltres.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${P.line}`, overflow: "hidden" }}>
            {clientsFiltres.map(c => (
              <div key={c.id} onClick={() => { onClientClick?.(c); setSearch(""); }}
                style={{
                  padding: "11px 14px", borderBottom: `1px solid ${P.line}`, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  WebkitTapHighlightColor: "transparent",
                }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: P.ink }}>{c.nom}</div>
                  {c.adresse && <div style={{ fontSize: 11, color: P.mute, marginTop: 1 }}>{c.adresse}</div>}
                  {c.tel && <div style={{ fontSize: 11, color: P.violet, marginTop: 2, fontWeight: 600 }}>📞 {c.tel}</div>}
                </div>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interventions à venir */}
      <Section titre="Aujourd'hui"      count={aujourdhui.length} items={aujourdhui} vide="Journée libre pour Dorian." />
      <Section titre="Cette semaine"    count={semaine.length}    items={semaine}    vide="Rien de prévu d'ici 7 jours." />
      {plusTard.length > 0 && (
        <Section titre="Plus tard" count={plusTard.length} items={plusTard.slice(0, 10)} vide="" />
      )}

      {/* Activité récente du technicien */}
      <div style={{ marginTop: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: P.ink, letterSpacing: -.2, padding: "0 4px 8px" }}>
          Activité récente de Dorian
        </div>
        <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${P.line}`, overflow: "hidden" }}>
          {evtsRecents.length === 0 ? (
            <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 12, color: P.mute }}>
              Aucune activité récente
            </div>
          ) : evtsRecents.map(e => {
            const META = {
              rapport:               { icon: "📋", txt: "Rapport saisi par Dorian",         color: P.cyan   },
              livraison:             { icon: "📦", txt: "Livraison enregistrée par Dorian", color: P.orange },
              signature:             { icon: "✍️", txt: "Signature client",                  color: P.violet },
              rdv:                   { icon: "📅", txt: "RDV planifié",                      color: P.violet },
              rapport_planifie:      { icon: "🗓️", txt: "Rapport planifié",                  color: P.cyan   },
            }[e.type] || { icon: "🔔", txt: e.type, color: P.slate };
            const d = new Date(e.at);
            const target = resolveTarget(e);
            const clickable = !!target;
            const KIND_LABEL = { rdv:"le RDV", passage:"le rapport", livraison:"la livraison" };
            return (
              <div key={e.id}
                onClick={clickable ? () => openEvent(e) : undefined}
                title={clickable ? `Ouvrir ${KIND_LABEL[target.kind] || "l'élément"}` : undefined}
                style={{
                  display: "flex", gap: 12, padding: "12px 14px", borderBottom: `1px solid ${P.line}`, alignItems: "center",
                  cursor: clickable ? "pointer" : "default",
                  WebkitTapHighlightColor: "transparent",
                }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>{META.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: P.ink }}>
                    {META.txt}{e.label ? ` — ${e.label}` : ""}
                  </div>
                  <div style={{ fontSize: 10.5, color: P.mute, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{d.toLocaleDateString("fr", { day: "2-digit", month: "short" })} · {d.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}</span>
                    {clickable && (
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: P.violet, background: P.violetLight, padding: "1px 6px", borderRadius: 6 }}>
                        Modifier
                      </span>
                    )}
                  </div>
                </div>
                {/* Retirer l'entrée du journal (ne supprime pas l'objet lié) */}
                {onDeleteEvent && (
                  <button onClick={ev => { ev.stopPropagation(); onDeleteEvent(e.id); }}
                    title="Retirer de la liste"
                    style={{
                      width: 26, height: 26, borderRadius: 8, border: "none", background: "transparent",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, WebkitTapHighlightColor: "transparent",
                    }}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.6" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
                {clickable && (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Déconnexion */}
      <button onClick={onLogout}
        style={{
          marginTop: 28, width: "100%", padding: "13px", borderRadius: 12,
          border: `1px solid ${P.line}`, background: "#fff", color: "#be123c",
          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          WebkitTapHighlightColor: "transparent",
        }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#be123c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Se déconnecter
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL — Planifier un rapport (intervention à effectuer)
// Formulaire léger, adapté au workflow secrétaire.
// ─────────────────────────────────────────────────────────────────────────────
export function ModalPlanifierRapport({ clients, onSave, onClose, defaultDate }) {
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [date, setDate] = useState(defaultDate || TODAY);
  const [heure, setHeure] = useState("");
  const [type, setType] = useState("Entretien");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return (clients || []).slice(0, 20);
    const s = clientSearch.toLowerCase().trim();
    return (clients || [])
      .filter(c => (c.nom || "").toLowerCase().includes(s)
                || (c.adresse || "").toLowerCase().includes(s))
      .slice(0, 20);
  }, [clients, clientSearch]);

  const selectedClient = (clients || []).find(c => c.id === clientId);

  const handleSave = () => {
    setErr("");
    if (!clientId) { setErr("Veuillez sélectionner un client."); return; }
    if (!date) { setErr("Veuillez choisir une date."); return; }
    const p = {
      id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      clientId, date, heure, type,
      ok: false,
      statut: "aFaire",
      rapportStatut: "saisie",
      commentaires: notes,
      photos: [], photosDepart: [], produitsLivres: [],
      createdByRole: "secretaire",
      planifiePour: true,
    };
    onSave(p);
  };

  const TYPES = ["Entretien", "Contrôle", "Traitement", "Dépannage", "Installation", "Autre"];

  return (
    <Modal title="🗓️ Planifier un rapport" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Client */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 8 }}>
            Client
          </label>
          {selectedClient ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", borderRadius: 12, background: "#f0f9ff", border: "1px solid #bae6fd",
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>{selectedClient.nom}</div>
                {selectedClient.adresse && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{selectedClient.adresse}</div>}
              </div>
              <button onClick={() => { setClientId(""); setClientSearch(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#0891b2", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
                Changer
              </button>
            </div>
          ) : (
            <>
              <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                placeholder="Rechercher un client…" autoFocus
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 12,
                  border: "1px solid #e2e8f0", fontSize: 13.5, outline: "none",
                  fontFamily: "inherit", background: "#fff", boxSizing: "border-box", color: "#0f172a", marginBottom: 6,
                }} />
              <div style={{ maxHeight: 200, overflowY: "auto", WebkitOverflowScrolling: "touch", borderRadius: 12, border: "1px solid #eef2f6" }}>
                {filteredClients.length === 0 ? (
                  <div style={{ padding: "14px", textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
                    Aucun client trouvé
                  </div>
                ) : filteredClients.map(c => (
                  <div key={c.id} onClick={() => { setClientId(c.id); setErr(""); }}
                    style={{
                      padding: "10px 14px", borderBottom: "1px solid #f8fafc", cursor: "pointer",
                      WebkitTapHighlightColor: "transparent", background: "#fff",
                    }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{c.nom}</div>
                    {c.adresse && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{c.adresse}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Date + heure */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 8 }}>
              Date
            </label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{
                width: "100%", padding: "11px 14px", borderRadius: 12,
                border: "1px solid #e2e8f0", fontSize: 13.5, outline: "none",
                fontFamily: "inherit", background: "#fff", boxSizing: "border-box", color: "#0f172a",
              }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 8 }}>
              Heure (opt.)
            </label>
            <input type="time" value={heure} onChange={e => setHeure(e.target.value)}
              style={{
                width: "100%", padding: "11px 14px", borderRadius: 12,
                border: "1px solid #e2e8f0", fontSize: 13.5, outline: "none",
                fontFamily: "inherit", background: "#fff", boxSizing: "border-box", color: "#0f172a",
              }} />
          </div>
        </div>

        {/* Type */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 8 }}>
            Type d'intervention
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TYPES.map(t => {
              const active = type === t;
              return (
                <button key={t} onClick={() => setType(t)}
                  style={{
                    padding: "8px 14px", borderRadius: 22, fontSize: 12, fontWeight: active ? 800 : 600,
                    border: `1.5px solid ${active ? "#0891b2" : "#e2e8f0"}`,
                    background: active ? "#e0f2fe" : "#fff",
                    color: active ? "#0891b2" : "#64748b",
                    cursor: "pointer", fontFamily: "inherit",
                    WebkitTapHighlightColor: "transparent", transition: "all .12s",
                  }}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 8 }}>
            Notes pour Dorian (opt.)
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Ex : penser à vérifier le filtre, apporter du chlore choc…"
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 12,
              border: "1px solid #e2e8f0", fontSize: 13, outline: "none",
              fontFamily: "inherit", background: "#fff", boxSizing: "border-box", color: "#0f172a", resize: "vertical",
            }} />
        </div>

        {err && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, background: "#fef2f2",
            border: "1px solid #fecaca", fontSize: 12.5, color: "#dc2626", fontWeight: 600,
          }}>{err}</div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, paddingTop: 6 }}>
          <button onClick={onClose}
            style={{
              flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #e2e8f0",
              background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
            }}>
            Annuler
          </button>
          <button onClick={handleSave}
            style={{
              flex: 2, padding: "12px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #0891b2 0%, #0369a1 100%)", color: "#fff",
              fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 12px rgba(8,145,178,0.35)", WebkitTapHighlightColor: "transparent",
            }}>
            Programmer
          </button>
        </div>
      </div>
    </Modal>
  );
}
