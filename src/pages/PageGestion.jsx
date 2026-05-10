// @ts-nocheck
import React, { useState, useMemo, useCallback } from "react";
import { DS } from "../utils/constants";
import { useIsMobile, Avatar } from "../components/ui";

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

// ─── Mensualités d'un client ──────────────────────────────────────────────────
const VersementsClient = ({ client, versements, onToggleVersement, retardVisible, onToggleRetardCarnet }) => {
  const [open, setOpen] = useState(false);
  if (!client.prix || !client.dateDebut) return null;

  const montantMensuel = Math.round(client.prix / 12);
  const today = new Date();
  const debut = new Date(client.dateDebut);
  const fin = client.dateFin
    ? new Date(client.dateFin)
    : new Date(debut.getFullYear() + 1, debut.getMonth(), debut.getDate());

  const mensualites = [];
  let current = new Date(debut.getFullYear(), debut.getMonth(), 1);
  const finMois = new Date(fin.getFullYear(), fin.getMonth(), 1);
  const currentMois = new Date(today.getFullYear(), today.getMonth(), 1);

  while (current <= finMois && current <= currentMois) {
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    const key = `${client.id}_${year}_${String(month).padStart(2, "0")}`;
    const isPaid = versements?.[key] === true;
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
    const isOverdue = !isCurrentMonth && !isPaid;
    mensualites.push({ key, year, month, isPaid, isCurrentMonth, isOverdue });
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  const overdueCount = mensualites.filter(m => m.isOverdue).length;
  const unpaidCount = mensualites.filter(m => !m.isPaid).length;
  const totalDue = unpaidCount * montantMensuel;
  const hasRetard = overdueCount > 0;

  return (
    <div>
      {/* ─ En-tête cliquable ─ */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom: open ? 8 : 0}}
      >
        <span style={{fontSize:11,color:"#64748b"}}>{montantMensuel}€/mois · {mensualites.length} mois</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {totalDue > 0
            ? <span style={{fontSize:13,fontWeight:800,color:overdueCount>0?"#dc2626":"#0369a1"}}>{totalDue}€ dû</span>
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
                background:m.isPaid?"#f0fdf4":m.isOverdue?"#fef2f2":m.isCurrentMonth?"#fefce8":"#f8fafc",
                border:`1px solid ${m.isPaid?"#bbf7d0":m.isOverdue?"#fecaca":m.isCurrentMonth?"#fde047":"#e2e8f0"}`
              }}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:10,fontWeight:700,color:"#475569",minWidth:28,textTransform:"uppercase"}}>{MOIS_LONG[m.month].slice(0,3)}</span>
                  <span style={{fontSize:10,color:"#94a3b8"}}>{m.year}</span>
                  <span style={{fontSize:10,fontWeight:600,color:m.isPaid?"#15803d":m.isOverdue?"#dc2626":m.isCurrentMonth?"#a16207":"#94a3b8"}}>
                    {m.isPaid ? "Payé" : m.isOverdue ? "Retard" : m.isCurrentMonth ? "En cours" : "À venir"}
                  </span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:m.isPaid?"#15803d":m.isOverdue?"#dc2626":"#0f172a"}}>{montantMensuel}€</span>
                  <button
                    onClick={() => onToggleVersement(m.key, !m.isPaid)}
                    style={{width:24,height:24,borderRadius:6,border:`1.5px solid ${m.isPaid?"#16a34a":"#cbd5e1"}`,cursor:"pointer",background:m.isPaid?"#16a34a":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
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
}) {
  const [tab, setTab] = useState("mensualites");
  const isMobile = useIsMobile();

  const clientsAvecMensualites = useMemo(
    () => clients.filter(c => c.prix > 0 && c.dateDebut),
    [clients]
  );

  const clientsAvecLivraisons = useMemo(() => {
    const ids = new Set(livraisons.map(l => l.clientId));
    return clients.filter(c => ids.has(c.id));
  }, [clients, livraisons]);

  // Total mensualités en retard
  const totalMensualitesDu = useMemo(() => {
    const today = new Date();
    return clientsAvecMensualites.reduce((sum, c) => {
      const montantMensuel = Math.round(c.prix / 12);
      const debut = new Date(c.dateDebut);
      const fin = c.dateFin
        ? new Date(c.dateFin)
        : new Date(debut.getFullYear() + 1, debut.getMonth(), debut.getDate());
      let cur = new Date(debut.getFullYear(), debut.getMonth(), 1);
      const finMois = new Date(fin.getFullYear(), fin.getMonth(), 1);
      const curMois = new Date(today.getFullYear(), today.getMonth(), 1);
      while (cur <= finMois && cur <= curMois) {
        const y = cur.getFullYear(), m = cur.getMonth() + 1;
        const key = `${c.id}_${y}_${String(m).padStart(2, "0")}`;
        const isCurrentMonth = y === today.getFullYear() && m === today.getMonth() + 1;
        if (!versements?.[key] && !isCurrentMonth) sum += montantMensuel;
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      }
      return sum;
    }, 0);
  }, [clientsAvecMensualites, versements]);

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
      <div style={{display:"flex",gap:4,marginBottom:14,background:"rgba(255,255,255,0.45)",borderRadius:14,padding:4,border:"1px solid " + DS.border}}>
        {[
          { key:"mensualites", label:"Mensualités", count:clientsAvecMensualites.length },
          { key:"livraisons",  label:"Livraisons",  count:clientsAvecLivraisons.length  },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{flex:1,padding:"9px 8px",borderRadius:10,border:"none",cursor:"pointer",
              background:tab===t.key?"linear-gradient(135deg,#06b6d4,#0891b2)":"transparent",
              color:tab===t.key?"#fff":DS.mid,fontWeight:700,fontSize:12,fontFamily:"inherit",
              transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {t.label}
            <span style={{background:tab===t.key?"rgba(255,255,255,0.25)":"rgba(8,145,178,0.1)",color:tab===t.key?"#fff":DS.blue,borderRadius:20,padding:"1px 7px",fontSize:10,fontWeight:800}}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ─── Mensualités ─── */}
      {tab === "mensualites" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {clientsAvecMensualites.length === 0 && (
            <div style={{textAlign:"center",color:DS.mid,padding:40,fontSize:13}}>Aucun client avec contrat mensuel</div>
          )}
          {clientsAvecMensualites.map(c => (
            <div key={c.id} style={{background:"rgba(255,255,255,0.45)",borderRadius:DS.radius,border:"1px solid " + DS.border,padding:"12px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <Avatar nom={c.nom} size={32}/>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{c.nom}</div>
                  <div style={{fontSize:10,color:DS.mid}}>{c.formule} · {c.prix}€/an</div>
                </div>
              </div>
              <VersementsClient
                client={c}
                versements={versements}
                onToggleVersement={onToggleVersement}
                retardVisible={!!retardsCarnet[c.id]}
                onToggleRetardCarnet={onToggleRetardCarnet}
              />
            </div>
          ))}
        </div>
      )}

      {/* ─── Livraisons ─── */}
      {tab === "livraisons" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {clientsAvecLivraisons.length === 0 && (
            <div style={{textAlign:"center",color:DS.mid,padding:40,fontSize:13}}>Aucune livraison enregistrée</div>
          )}
          {clientsAvecLivraisons.map(c => {
            const nb = livraisons.filter(l => l.clientId === c.id).length;
            return (
              <div key={c.id} style={{background:"rgba(255,255,255,0.45)",borderRadius:DS.radius,border:"1px solid " + DS.border,padding:"12px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <Avatar nom={c.nom} size={32}/>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{c.nom}</div>
                    <div style={{fontSize:10,color:DS.mid}}>{nb} livraison{nb > 1 ? "s" : ""}</div>
                  </div>
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
    </div>
  );
}
