// @ts-nocheck
import React, { useState, useMemo, useCallback } from "react";
import { DS, Ico } from "../utils/constants";
import { calcMensualites, finMoisExclu, getNMoisContrat, getMensualiteDue, getStatutPaiement } from "../utils/helpers";
import { Avatar } from "../components/ui";

const MOIS_LONG = ["","Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

// ─── Toggle switch ────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, colorOn = "#dc2626", colorOff = "#e2e8f0" }) => (
  <button
    onClick={() => onChange(!value)}
    style={{width:36,height:20,borderRadius:10,background:value?colorOn:colorOff,border:"none",cursor:"pointer",position:"relative",transition:"background .15s",flexShrink:0}}
  >
    <div style={{width:16,height:16,borderRadius:8,background:"#fff",position:"absolute",top:2,left:value?18:2,transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
  </button>
);

// ─── Toggle Liste / Kanban ────────────────────────────────────────────────────
const ViewSwitch = ({ view, onChange }) => (
  <div style={{display:"flex",gap:3,background:"rgba(0,0,0,0.04)",borderRadius:10,padding:3,flexShrink:0}}>
    {[
      { key:"liste",  icon:<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></> },
      { key:"kanban", icon:<><rect x="3" y="3" width="6" height="18" rx="1"/><rect x="10.5" y="3" width="6" height="11" rx="1"/><rect x="18" y="3" width="3" height="7" rx="1"/></> },
    ].map(v => (
      <button key={v.key} onClick={() => onChange(v.key)} title={v.key === "liste" ? "Vue liste" : "Vue Kanban"}
        style={{width:30,height:26,borderRadius:7,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
          background:view===v.key?"#fff":"transparent",boxShadow:view===v.key?"0 1px 3px rgba(0,0,0,0.15)":"none"}}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={view===v.key?"#0891b2":"#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{v.icon}</svg>
      </button>
    ))}
  </div>
);

// ─── Colonnes Kanban génériques (scroll horizontal, clic carte = action) ──────
const KanbanBoard = ({ columns }) => (
  <div style={{display:"flex",gap:10,overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:6,scrollSnapType:"x proximity"}}>
    {columns.map(col => (
      <div key={col.key} style={{flex:"0 0 250px",scrollSnapAlign:"start"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,padding:"0 2px"}}>
          <span style={{width:8,height:8,borderRadius:4,background:col.color,flexShrink:0}}/>
          <span style={{fontSize:12,fontWeight:800,color:"#374151"}}>{col.label}</span>
          <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",background:"#f1f5f9",borderRadius:20,padding:"1px 7px"}}>{col.items.length}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,minHeight:40}}>
          {col.items.length===0
            ? <div style={{fontSize:11,color:"#cbd5e1",padding:"14px 0",textAlign:"center",border:"1.5px dashed #e2e8f0",borderRadius:12}}>Vide</div>
            : col.items.map(col.render)
          }
        </div>
      </div>
    ))}
  </div>
);

// ─── Mensualités d'un client ──────────────────────────────────────────────────
const VersementsClient = ({ client, versements, onToggleVersement, retardVisible, onToggleRetardCarnet }) => {
  const [open, setOpen] = useState(false);
  if (!client.prix || !client.dateDebut) return null;

  // Mensualités exactes au centime — durée réelle du contrat (12, 6, 3 mois ou autre)
  const nMoisContrat = getNMoisContrat(client);
  const { m1: mensualite1, m11: mensualiteBase } = calcMensualites(client.prix, nMoisContrat);
  const fmtEur = (v) => v % 1 === 0 ? `${v}€` : `${v.toFixed(2).replace(".", ",")}€`;

  const today = new Date();
  const debut = new Date(client.dateDebut);
  const debutYear  = debut.getFullYear();
  const debutMonth = debut.getMonth() + 1;
  const fin = client.dateFin
    ? new Date(client.dateFin)
    : new Date(debut.getFullYear() + 1, debut.getMonth(), debut.getDate());

  // Montant du mois : mois 1 du contrat = mensualite1, autres = mensualiteBase
  const getMontantMois = (year, month) =>
    (year === debutYear && month === debutMonth) ? mensualite1 : mensualiteBase;

  const mensualites = [];
  let current = new Date(debut.getFullYear(), debut.getMonth(), 1);
  // Borne exclusive : fin + 1 jour → premier jour du mois suivant la fin
  // Corrige le bug "13 mois pour 12" quand dateFin = dateDebut + 1 an jour pour jour
  const finMoisBorne = finMoisExclu(client.dateFin)
    || new Date(debut.getFullYear() + 1, debut.getMonth(), 1);
  const currentMois = new Date(today.getFullYear(), today.getMonth(), 1);

  // Parcourt TOUTE la durée du contrat (passé + présent + futur)
  // pour permettre de cocher les mensualités payées en avance
  while (current < finMoisBorne) {
    const year  = current.getFullYear();
    const month = current.getMonth() + 1;
    const key   = `${client.id}_${year}_${String(month).padStart(2, "0")}`;
    const isPaid = versements?.[key] === true;
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
    const isFuture = current > currentMois;
    const isOverdue = !isCurrentMonth && !isFuture && !isPaid;
    const montant = getMontantMois(year, month);
    mensualites.push({ key, year, month, isPaid, isCurrentMonth, isFuture, isOverdue, montant });
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  const overdueCount = mensualites.filter(m => m.isOverdue).length;
  // Dû maintenant = mois passés + courant non payés (hors futurs)
  const totalDue    = mensualites.filter(m => !m.isPaid && !m.isFuture).reduce((s, m) => s + m.montant, 0);
  // Payé en avance = mois futurs déjà cochés
  const totalAvance = mensualites.filter(m =>  m.isPaid &&  m.isFuture).reduce((s, m) => s + m.montant, 0);
  const hasRetard = overdueCount > 0;

  return (
    <div>
      {/* ─ En-tête cliquable ─ */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom: open ? 8 : 0}}
      >
        <span style={{fontSize:11,color:"#64748b"}}>{fmtEur(mensualiteBase)}/mois · {mensualites.length} mois</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {totalDue > 0
            ? <span style={{fontSize:13,fontWeight:800,color:overdueCount>0?"#dc2626":"#0369a1"}}>{fmtEur(totalDue)} dû</span>
            : totalAvance > 0
              ? <span style={{fontSize:11,fontWeight:700,color:"#059669"}}>✓ À jour · <span style={{color:"#0891b2"}}>+{fmtEur(totalAvance)} avance</span></span>
              : <span style={{fontSize:11,fontWeight:700,color:"#16a34a"}}>✓ À jour</span>
          }
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
            style={{transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s",flexShrink:0}}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {open && (
        <>
          {hasRetard && (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderRadius:8,background:retardVisible?"#fef2f2":"#f8fafc",border:`1px solid ${retardVisible?"#fecaca":"#e2e8f0"}`,marginBottom:8}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:retardVisible?"#dc2626":"#475569"}}>
                  {retardVisible ? "Retard visible dans le carnet client" : "Retard masqué au client"}
                </div>
                <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>Le client verra ce qu'il vous doit</div>
              </div>
              <Toggle value={retardVisible} onChange={v => onToggleRetardCarnet(client.id, v)} />
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {mensualites.map((m) => (
              <div key={m.key} style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"6px 10px",borderRadius:7,
                background: m.isPaid && m.isFuture ? "#eff6ff"
                  : m.isPaid              ? "#f0fdf4"
                  : m.isOverdue           ? "#fef2f2"
                  : m.isCurrentMonth      ? "#fefce8"
                  : "#f8fafc",
                border:`1px solid ${
                  m.isPaid && m.isFuture ? "#bfdbfe"
                  : m.isPaid              ? "#bbf7d0"
                  : m.isOverdue           ? "#fecaca"
                  : m.isCurrentMonth      ? "#fde047"
                  : "#e2e8f0"}`,
                opacity: m.isFuture && !m.isPaid ? 0.7 : 1,
              }}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:10,fontWeight:700,color:"#475569",minWidth:28,textTransform:"uppercase"}}>{MOIS_LONG[m.month].slice(0,3)}</span>
                  <span style={{fontSize:10,color:"#94a3b8"}}>{m.year}</span>
                  <span style={{fontSize:10,fontWeight:600,color:
                    m.isPaid && m.isFuture ? "#0369a1"
                    : m.isPaid              ? "#15803d"
                    : m.isOverdue           ? "#dc2626"
                    : m.isCurrentMonth      ? "#a16207"
                    : "#94a3b8"
                  }}>
                    {m.isPaid && m.isFuture ? "✓ Avance"
                      : m.isPaid       ? "Payé"
                      : m.isOverdue    ? "Retard"
                      : m.isCurrentMonth ? "En cours"
                      : "À venir"}
                  </span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:
                    m.isPaid && m.isFuture ? "#0369a1"
                    : m.isPaid    ? "#15803d"
                    : m.isOverdue ? "#dc2626"
                    : "#0f172a"
                  }}>{fmtEur(m.montant)}</span>
                  <button
                    onClick={() => onToggleVersement(m.key, !m.isPaid)}
                    title={m.isFuture && !m.isPaid ? "Marquer comme payé en avance" : undefined}
                    style={{
                      width:24,height:24,borderRadius:6,cursor:"pointer",
                      border:`1.5px solid ${m.isPaid && m.isFuture ? "#3b82f6" : m.isPaid ? "#16a34a" : "#cbd5e1"}`,
                      background: m.isPaid && m.isFuture ? "#3b82f6" : m.isPaid ? "#16a34a" : "transparent",
                      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"
                    }}>
                    {m.isPaid
                      ? <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <div style={{width:7,height:7,borderRadius:4,border:"2px solid #cbd5e1"}}/>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Livraisons d'un client ───────────────────────────────────────────────────
const LivraisonsClient = ({ client, livraisons, onUpdateStatut, retardVisible, onToggleRetardCarnet }) => {
  const [open, setOpen] = useState(false);
  const clientLivraisons = livraisons
    .filter(l => l.clientId === client.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (clientLivraisons.length === 0) return null;

  const impayees = clientLivraisons.filter(l => l.statut !== "payee" && l.statut !== "annulee");
  const totalImpaye = impayees.reduce((s, l) => s + (l.montant || l.prixTotal || l.total || 0), 0);

  return (
    <div>
      {/* ─ En-tête cliquable ─ */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom: open ? 8 : 0}}
      >
        <span style={{fontSize:11,color:"#64748b"}}>{clientLivraisons.length} livraison{clientLivraisons.length > 1 ? "s" : ""}</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {impayees.length > 0
            ? <span style={{fontSize:13,fontWeight:800,color:"#b45309"}}>{totalImpaye > 0 ? totalImpaye + "€ dû" : impayees.length + " impayée" + (impayees.length > 1 ? "s" : "")}</span>
            : <span style={{fontSize:11,fontWeight:700,color:"#16a34a"}}>✓ À jour</span>
          }
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
            style={{transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s",flexShrink:0}}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {open && (
        <>
          {impayees.length > 0 && (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderRadius:8,background:retardVisible?"#fff7ed":"#f8fafc",border:`1px solid ${retardVisible?"#fed7aa":"#e2e8f0"}`,marginBottom:8}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:retardVisible?"#ea580c":"#475569"}}>
                  {retardVisible ? "Livraisons visibles dans le carnet" : "Livraisons masquées au client"}
                </div>
                <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{impayees.length} livraison{impayees.length > 1 ? "s" : ""} non réglée{impayees.length > 1 ? "s" : ""}</div>
              </div>
              <Toggle value={retardVisible} onChange={v => onToggleRetardCarnet(`liv_${client.id}`, v)} colorOn="#ea580c" />
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {clientLivraisons.map(l => {
          const isPaid = l.statut === "payee";
          const isCancelled = l.statut === "annulee";
          const montant = l.montant || l.prixTotal || l.total || 0;
          const date = l.date ? new Date(l.date).toLocaleDateString("fr", {day:"2-digit",month:"short",year:"numeric"}) : "—";
          const produitsList = l.produits?.length > 0
            ? l.produits.slice(0, 3).join(", ") + (l.produits.length > 3 ? "…" : "")
            : "—";
          return (
            <div key={l.id} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"7px 10px",borderRadius:7,
              background:isPaid?"#f0fdf4":isCancelled?"#f8fafc":"#fffbeb",
              border:`1px solid ${isPaid?"#bbf7d0":isCancelled?"#e2e8f0":"#fde68a"}`
            }}>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontSize:11,fontWeight:600,color:"#0f172a"}}>{date}</div>
                <div style={{fontSize:10,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{produitsList}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:8}}>
                {montant > 0 && <span style={{fontSize:12,fontWeight:700,color:isPaid?"#15803d":"#b45309"}}>{montant}€</span>}
                <span style={{fontSize:10,fontWeight:700,
                  color:isPaid?"#15803d":isCancelled?"#94a3b8":"#b45309",
                  background:isPaid?"#dcfce7":isCancelled?"#f1f5f9":"#fef3c7",
                  padding:"2px 7px",borderRadius:20}}>
                  {isPaid ? "Payée" : isCancelled ? "Annulée" : "En attente"}
                </span>
                {!isCancelled && (
                  <button
                    onClick={() => onUpdateStatut(l.id, isPaid ? "livree" : "payee")}
                    style={{width:24,height:24,borderRadius:6,border:`1.5px solid ${isPaid?"#16a34a":"#cbd5e1"}`,cursor:"pointer",background:isPaid?"#16a34a":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                    {isPaid
                      ? <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <div style={{width:7,height:7,borderRadius:4,border:"2px solid #cbd5e1"}}/>
                    }
                  </button>
                )}
              </div>
            </div>
          );
        })}
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE GESTION
// ─────────────────────────────────────────────────────────────────────────────
export function PageGestion({
  clients,
  versements = {},
  onToggleVersement,
  livraisons = [],
  onUpdateStatutLivraison,
  retardsCarnet = {},
  onToggleRetardCarnet,
  contrats = {},
  onOpenContrat,
  onClientClick,
}) {
  const [tab, setTab] = useState("mensualites");
  const [view, setView] = useState("liste");

  // Seuls les clients avec un contrat SIGNÉ (signe_complet) sont comptabilisés.
  // Un contrat en attente (signe_client) ou non signé ne génère pas encore de mensualités.
  const getContratStatut = useCallback((clientId) => {
    const ct = contrats[`CT-${clientId}`]
      || Object.values(contrats).find(c => c?.clientId === clientId);
    return ct?.statut || "aucun";
  }, [contrats]);

  // Clients à jour vs en retard, retard en premier pour repérer le problème
  // en un coup d'œil sans avoir à tout dérouler.
  const clientsAvecMensualites = useMemo(
    () => clients
      .filter(c => c.prix > 0 && c.dateDebut && getContratStatut(c.id) === "signe_complet")
      .map(c => ({ c, due: getMensualiteDue(c, versements) }))
      .sort((a, b) => b.due - a.due)
      .map(x => x.c),
    [clients, getContratStatut, versements]
  );

  const clientsAvecLivraisons = useMemo(() => {
    const ids = new Set(livraisons.map(l => l.clientId));
    const impayeMontant = (clientId) => livraisons
      .filter(l => l.clientId === clientId && l.statut !== "payee" && l.statut !== "annulee")
      .reduce((s, l) => s + (l.montant || l.prixTotal || l.total || 0), 0);
    return clients
      .filter(c => ids.has(c.id))
      .map(c => ({ c, due: impayeMontant(c.id) }))
      .sort((a, b) => b.due - a.due)
      .map(x => x.c);
  }, [clients, livraisons]);

  // Total mensualités en retard — au centime près
  const totalMensualitesDu = useMemo(
    () => Math.round(clientsAvecMensualites.reduce((sum, c) => sum + getMensualiteDue(c, versements), 0) * 100) / 100,
    [clientsAvecMensualites, versements]
  );

  // Total livraisons impayées
  const totalLivraisonsDu = useMemo(
    () => livraisons
      .filter(l => l.statut !== "payee" && l.statut !== "annulee")
      .reduce((sum, l) => sum + (l.montant || l.prixTotal || l.total || 0), 0),
    [livraisons]
  );

  return (
    <div>
      {/* ─── Summary cards ─── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:16}}>
        <div style={{background:"linear-gradient(135deg,#0c1f3f,#0369a1)",borderRadius:18,padding:"14px 16px",position:"relative",overflow:"hidden",boxShadow:"0 8px 24px rgba(12,31,63,0.25)"}}>
          <div style={{position:"absolute",top:-15,right:-15,width:80,height:80,borderRadius:"50%",background:"rgba(56,189,248,0.15)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:10,position:"relative"}}>
            <div style={{width:42,height:42,borderRadius:12,background:"rgba(56,189,248,0.25)",border:"1.5px solid rgba(56,189,248,0.4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:"#fff",lineHeight:1}}>{totalMensualitesDu > 0 ? totalMensualitesDu + "€" : "✓"}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>Mensualités {totalMensualitesDu > 0 ? "dues" : "à jour"}</div>
            </div>
          </div>
        </div>

        <div style={{background:totalLivraisonsDu>0?"linear-gradient(135deg,#d97706,#f59e0b)":"linear-gradient(135deg,#059669,#10b981)",borderRadius:18,padding:"14px 16px",position:"relative",overflow:"hidden",boxShadow:`0 8px 24px ${totalLivraisonsDu>0?"rgba(217,119,6,0.25)":"rgba(5,150,105,0.25)"}`}}>
          <div style={{position:"absolute",top:-15,right:-15,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.12)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:10,position:"relative"}}>
            <div style={{width:42,height:42,borderRadius:12,background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:"#fff",lineHeight:1}}>{totalLivraisonsDu > 0 ? totalLivraisonsDu + "€" : "✓"}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.85)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>Livraisons {totalLivraisonsDu > 0 ? "dues" : "à jour"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div style={{display:"flex",gap:4,marginBottom:14,background:"rgba(255,255,255,0.45)",borderRadius:14,padding:4,border:"1px solid "+DS.border,overflowX:"auto",scrollbarWidth:"none"}}>
        {[
          { key:"mensualites", label:"Mensualités", count:clientsAvecMensualites.length },
          { key:"livraisons",  label:"Livraisons",  count:clientsAvecLivraisons.length  },
          { key:"documents",   label:"Contrats",    count:Object.values(contrats).filter(c=>c?.statut&&c.statut!=="reset").length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{flex:1,padding:"9px 8px",borderRadius:10,border:"none",cursor:"pointer",flexShrink:0,
              background:tab===t.key?"linear-gradient(135deg,#06b6d4,#0891b2)":"transparent",
              color:tab===t.key?"#fff":DS.mid,fontWeight:700,fontSize:12,fontFamily:"inherit",
              transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6,WebkitTapHighlightColor:"transparent"}}>
            {t.label}
            {t.count>0&&<span style={{background:tab===t.key?"rgba(255,255,255,0.25)":"rgba(8,145,178,0.1)",color:tab===t.key?"#fff":DS.blue,borderRadius:20,padding:"1px 7px",fontSize:10,fontWeight:800}}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ─── Sélecteur vue liste / Kanban ─── */}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <ViewSwitch view={view} onChange={setView}/>
      </div>

      {/* ─── Mensualités — vue Kanban (par statut de paiement) ─── */}
      {tab === "mensualites" && view === "kanban" && (
        <KanbanBoard columns={[
          { key:"retard", label:"En retard", color:"#dc2626",
            items: clientsAvecMensualites.filter(c => getStatutPaiement(c, versements) === "retard"),
            render: c => (
              <div key={c.id} onClick={onClientClick ? () => onClientClick(c) : undefined}
                style={{background:"#fff",borderRadius:12,border:"1px solid #fecaca",padding:"10px 12px",cursor:onClientClick?"pointer":"default",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <Avatar nom={c.nom} size={26}/>
                  <span style={{fontSize:12,fontWeight:700,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</span>
                </div>
                <div style={{fontSize:13,fontWeight:800,color:"#dc2626"}}>{getMensualiteDue(c, versements)}€ dû</div>
              </div>
            ) },
          { key:"attente", label:"Mois en cours", color:"#d97706",
            items: clientsAvecMensualites.filter(c => getStatutPaiement(c, versements) === "attente"),
            render: c => (
              <div key={c.id} onClick={onClientClick ? () => onClientClick(c) : undefined}
                style={{background:"#fff",borderRadius:12,border:"1px solid #fde68a",padding:"10px 12px",cursor:onClientClick?"pointer":"default",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <Avatar nom={c.nom} size={26}/>
                  <span style={{fontSize:12,fontWeight:700,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</span>
                </div>
                <div style={{fontSize:11,color:"#94a3b8"}}>{c.prix}€/an</div>
              </div>
            ) },
          { key:"jour", label:"À jour", color:"#22c55e",
            items: clientsAvecMensualites.filter(c => getStatutPaiement(c, versements) === "jour"),
            render: c => (
              <div key={c.id} onClick={onClientClick ? () => onClientClick(c) : undefined}
                style={{background:"#fff",borderRadius:12,border:"1px solid #bbf7d0",padding:"10px 12px",cursor:onClientClick?"pointer":"default",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <Avatar nom={c.nom} size={26}/>
                  <span style={{fontSize:12,fontWeight:700,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</span>
                </div>
                <div style={{fontSize:11,color:"#94a3b8"}}>{c.prix}€/an</div>
              </div>
            ) },
        ]}/>
      )}

      {/* ─── Mensualités — vue liste ─── */}
      {tab === "mensualites" && view === "liste" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {clientsAvecMensualites.length === 0 && (
            <div style={{textAlign:"center",color:DS.mid,padding:40,fontSize:13}}>Aucun client avec contrat mensuel</div>
          )}
          {clientsAvecMensualites.map(c => {
            const due = getMensualiteDue(c, versements);
            return (
            <div key={c.id} style={{background:"rgba(255,255,255,0.45)",borderRadius:DS.radius,border:"1px solid " + DS.border,borderLeft:`4px solid ${due>0?"#dc2626":"#22c55e"}`,padding:"12px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
              <div
                onClick={onClientClick ? () => onClientClick(c) : undefined}
                style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,cursor:onClientClick?"pointer":"default",borderRadius:8}}>
                <Avatar nom={c.nom} size={32}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{c.nom}</div>
                  <div style={{fontSize:10,color:DS.mid}}>{c.formule} · {c.prix}€/an</div>
                </div>
                {onClientClick && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>}
              </div>
              <VersementsClient
                client={c}
                versements={versements}
                onToggleVersement={onToggleVersement}
                retardVisible={!!retardsCarnet[c.id]}
                onToggleRetardCarnet={onToggleRetardCarnet}
              />
            </div>
            );
          })}
        </div>
      )}

      {/* ─── Livraisons — vue Kanban (par livraison, statut) ─── */}
      {tab === "livraisons" && view === "kanban" && (()=>{
        const withClient = livraisons.map(l => ({ l, client: clients.find(c => c.id === l.clientId) })).filter(x => x.client);
        const renderLiv = ({ l, client }) => (
          <div key={l.id} onClick={onClientClick ? () => onClientClick(client) : undefined}
            style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:"10px 12px",cursor:onClientClick?"pointer":"default",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#0f172a",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{client.nom}</div>
            <div style={{fontSize:10,color:"#94a3b8",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(l.produits||[]).slice(0,2).join(", ")||l.description||"—"}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:10,color:"#94a3b8"}}>{l.date?new Date(l.date).toLocaleDateString("fr",{day:"2-digit",month:"short"}):"—"}</span>
              {(l.montant||l.prixTotal||l.total)>0 && <span style={{fontSize:12,fontWeight:800,color:"#0f172a"}}>{l.montant||l.prixTotal||l.total}€</span>}
            </div>
          </div>
        );
        return (
          <KanbanBoard columns={[
            { key:"attente", label:"En attente", color:"#d97706",
              items: withClient.filter(x => x.l.statut !== "payee" && x.l.statut !== "annulee"), render: renderLiv },
            { key:"payee", label:"Payée", color:"#22c55e",
              items: withClient.filter(x => x.l.statut === "payee"), render: renderLiv },
            { key:"annulee", label:"Annulée", color:"#94a3b8",
              items: withClient.filter(x => x.l.statut === "annulee"), render: renderLiv },
          ]}/>
        );
      })()}

      {/* ─── Livraisons — vue liste ─── */}
      {tab === "livraisons" && view === "liste" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {clientsAvecLivraisons.length === 0 && (
            <div style={{textAlign:"center",color:DS.mid,padding:40,fontSize:13}}>Aucune livraison enregistrée</div>
          )}
          {clientsAvecLivraisons.map(c => {
            const nb = livraisons.filter(l => l.clientId === c.id).length;
            const due = livraisons
              .filter(l => l.clientId === c.id && l.statut !== "payee" && l.statut !== "annulee")
              .reduce((s, l) => s + (l.montant || l.prixTotal || l.total || 0), 0);
            return (
              <div key={c.id} style={{background:"rgba(255,255,255,0.45)",borderRadius:DS.radius,border:"1px solid " + DS.border,borderLeft:`4px solid ${due>0?"#ea580c":"#22c55e"}`,padding:"12px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                <div
                  onClick={onClientClick ? () => onClientClick(c) : undefined}
                  style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,cursor:onClientClick?"pointer":"default",borderRadius:8}}>
                  <Avatar nom={c.nom} size={32}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{c.nom}</div>
                    <div style={{fontSize:10,color:DS.mid}}>{nb} livraison{nb > 1 ? "s" : ""}</div>
                  </div>
                  {onClientClick && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>}
                </div>
                <LivraisonsClient
                  client={c}
                  livraisons={livraisons}
                  onUpdateStatut={onUpdateStatutLivraison}
                  retardVisible={!!retardsCarnet[`liv_${c.id}`]}
                  onToggleRetardCarnet={onToggleRetardCarnet}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Documents / Contrats ─── */}
      {tab === "documents" && (()=>{
        const STATUT = {
          signe_complet:   { label:"Signé ✓",   color:"#059669", bg:"#f0fdf4", border:"#86efac" },
          signe_client:    { label:"En attente", color:"#4f46e5", bg:"#eef2ff", border:"#a5b4fc" },
          demande_envoyee: { label:"Envoyé",     color:"#0891b2", bg:"#e0f2fe", border:"#7dd3fc" },
          reset:           { label:"Réinit.",    color:"#94a3b8", bg:"#f8fafc", border:"#e2e8f0" },
        };
        const actifs = Object.entries(contrats)
          .filter(([k]) => k !== "__archives__")
          .map(([contractId, ct]) => ({ contractId, ct, client: clients.find(c=>c.id===ct.clientId) }))
          .filter(x => x.client && x.ct.statut && x.ct.statut !== "reset")
          .sort((a,b) => (b.ct.signedAt||b.ct.signedByPrestaAt||"").localeCompare(a.ct.signedAt||a.ct.signedByPrestaAt||""));
        const nbSigned = actifs.filter(x=>x.ct.statut==="signe_complet").length;
        return (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
              {[{label:"Signés",val:nbSigned,color:"#059669",bg:"#f0fdf4"},{label:"En attente",val:actifs.filter(x=>x.ct.statut==="signe_client").length,color:"#4f46e5",bg:"#eef2ff"},{label:"Total",val:actifs.length,color:"#0891b2",bg:"#e0f2fe"}].map(s=>(
                <div key={s.label} style={{background:s.bg,borderRadius:12,padding:"10px 8px",textAlign:"center",border:"1px solid "+s.color+"22"}}>
                  <div style={{fontSize:22,fontWeight:900,color:s.color,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:10,color:s.color,fontWeight:700,marginTop:3,textTransform:"uppercase",letterSpacing:.4}}>{s.label}</div>
                </div>
              ))}
            </div>
            {actifs.length===0
              ? <div style={{textAlign:"center",padding:40,color:DS.mid,fontSize:13}}>
                  <div style={{fontSize:40,marginBottom:10}}>📄</div>
                  Aucun contrat enregistré
                </div>
              : view === "kanban"
              ? (()=>{
                  const renderCt = ({ contractId, ct, client }) => {
                    const s = STATUT[ct.statut] || STATUT.reset;
                    return (
                      <div key={contractId} onClick={onClientClick ? () => onClientClick(client) : undefined}
                        style={{background:"#fff",borderRadius:12,border:"1px solid "+s.border,padding:"10px 12px",cursor:onClientClick?"pointer":"default",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{client.nom}</div>
                        <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{client.formule}</div>
                      </div>
                    );
                  };
                  return (
                    <KanbanBoard columns={[
                      { key:"signe_complet", label:"Signé", color:"#059669",
                        items: actifs.filter(x=>x.ct.statut==="signe_complet"), render: renderCt },
                      { key:"signe_client", label:"En attente signature", color:"#4f46e5",
                        items: actifs.filter(x=>x.ct.statut==="signe_client"), render: renderCt },
                      { key:"demande_envoyee", label:"Envoyé", color:"#0891b2",
                        items: actifs.filter(x=>x.ct.statut==="demande_envoyee"), render: renderCt },
                    ]}/>
                  );
                })()
              : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {actifs.map(({contractId,ct,client})=>{
                    const s = STATUT[ct.statut]||STATUT.reset;
                    const dateSign = ct.signedAt ? new Date(ct.signedAt).toLocaleDateString("fr",{day:"2-digit",month:"short",year:"2-digit"}) : null;
                    return (
                      <div key={contractId} style={{background:"rgba(255,255,255,0.55)",borderRadius:14,border:"1.5px solid "+s.border,overflow:"hidden"}}>
                        <div
                          onClick={onClientClick ? () => onClientClick(client) : undefined}
                          style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:onClientClick?"pointer":"default"}}>
                          <div style={{width:40,height:40,borderRadius:11,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>
                            {ct.statut==="signe_complet"?"✅":ct.statut==="signe_client"?"✍️":"📄"}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:700,fontSize:13,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{client.nom}</div>
                            <div style={{fontSize:10,color:DS.mid,marginTop:1}}>{client.formule}{dateSign?" · Signé le "+dateSign:""}</div>
                          </div>
                          <span style={{fontSize:11,fontWeight:700,color:s.color,background:s.bg,padding:"3px 10px",borderRadius:20,border:"1px solid "+s.border,flexShrink:0}}>{s.label}</span>
                        </div>
                        <div style={{display:"flex",borderTop:"1px solid #f1f5f9"}}>
                          <button onClick={()=>onOpenContrat&&onOpenContrat(client,ct)}
                            style={{flex:1,padding:"9px",background:"rgba(255,255,255,0.45)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,fontWeight:700,color:"#0891b2",fontFamily:"inherit"}}>
                            {Ico.pdf(13,"#0891b2")} Voir PDF signé
                          </button>
                          {ct.statut==="signe_client"&&(
                            <><div style={{width:1,background:"#f1f5f9"}}/><a href={`/sign-prestataire.html?clientId=${client.id}&contractId=${contractId}`} target="_blank" rel="noopener"
                              style={{flex:1,padding:"9px",background:"#f5f3ff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,fontWeight:700,color:"#4f46e5",textDecoration:"none"}}>
                              ✍️ Co-signer
                            </a></>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        );
      })()}
    </div>
  );
}
