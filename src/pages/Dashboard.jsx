// @ts-nocheck
import React, { useState } from "react";
import { DS, Ico, MOIS_L } from "../utils/constants";
import { TODAY, alerteClient, getSaison, getEntretienMois, getControleMois, isEntretienType, isControleType, MOIS_NOW, YEAR_NOW } from "../utils/helpers";
import { Avatar, useIsMobile } from "../components/ui";
import { CalendrierInteractif, AlertesBlock } from "../components/Calendrier";

// ─────────────────────────────────────────────────────────────────────────────
// VDM BLAGUES — carrousel de citations pisciniste
// ─────────────────────────────────────────────────────────────────────────────
const VDM_BLAGUES = [
  "Aujourd'hui, un client m'appelle en panique : « L'eau de la piscine est devenue verte du jour au lendemain ! » Il m'a fallu 10 minutes pour comprendre qu'il avait balancé tout son gazon tondu dedans pour « faire naturel ». VDM",
  "Aujourd'hui, en nettoyant le filtre d'une piscine, j'ai sorti : 3 petites culottes, un dentier, un porte-monnaie avec 40€ dedans et une anguille. Je ne sais toujours pas pour l'anguille. VDM",
  "Aujourd'hui, j'explique depuis 20 minutes à un client comment ajouter du chlore. À la fin, il me dit : « Ah mais moi je mets du sel de cuisine, c'est pareil non ? » Non. Non c'est pas pareil. VDM",
  "Aujourd'hui, une cliente m'appelle pour me dire que sa piscine « sent bizarre ». J'arrive, je teste l'eau : pH 9,2, chlore à 0. Elle avait versé 5L de vinaigre blanc pour « désinfecter naturellement ». VDM",
  "Aujourd'hui, un client m'a demandé pourquoi l'eau de sa piscine avait tourné rose. Il avait mis ses filles jouer dans la piscine avec leurs nouvelles chaussures en tissu rose fluo. Toute la journée. VDM",
  "Aujourd'hui, un client m'appelle furieux : « Votre traitement choc ne marche pas ! » Il avait jeté le sachet entier avec l'emballage plastique. Le chlore était encore dedans. VDM",
  "Aujourd'hui, j'arrive chez un client dont la pompe est « en panne ». Elle était juste débranchée. Il m'a quand même facturé le déplacement. C'est moi le pisciniste mais c'est lui qui me facture. VDM",
  "Aujourd'hui, une cliente me demande de tester son eau car « elle pique les yeux ». pH parfait, chlore parfait. Je lui demande depuis quand. « Depuis que j'ai mis du shampoing dedans pour que ça mousse mieux. » VDM",
  "Aujourd'hui, un client me montre fièrement sa « installation de traitement UV ». C'est une lampe UV pour les ongles posée sur le bord de la piscine. Elle n'est même pas branchée. VDM",
  "Aujourd'hui, un client m'explique que son eau est propre parce qu'il y a mis un gros bouquet de lavande. L'eau est violette. Les algues, elles, s'en foutent de la lavande. VDM",
  "Aujourd'hui, en faisant l'analyse d'eau d'un client, je lui annonce que son taux de chlore est à zéro. Sa réponse : « Normal, j'ai mis du rosé à la place, c'est moins agressif pour la peau. » VDM",
  "Aujourd'hui, une cliente m'appelle : « Mon robot piscine ne revient plus à sa base. » Je demande où est la base. « Ben dans le salon, là où je le range. » VDM",
  "Aujourd'hui, j'explique à un client comment lire son testeur. Il me dit qu'il est daltonien. Il teste l'eau depuis 3 ans seul. Son pH n'a jamais dépassé 6,5. VDM",
  "Aujourd'hui, un client veut savoir si sa piscine peut attraper la grippe. Sa piscine est verte depuis août. Il pense que c'est « une infection saisonnière ». VDM",
  "Aujourd'hui, un client m'a demandé si je pouvais faire une remise parce qu'il a « une petite piscine ». 12 mètres sur 6. Il la considère petite parce qu'il a vu des photos de Monaco. VDM",
];

// Mélange Fisher-Yates — ordre différent à chaque rechargement
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const VDM_SHUFFLED = shuffleArray(VDM_BLAGUES);

// ─────────────────────────────────────────────────────────────────────────────
// SAISON THEMES
// ─────────────────────────────────────────────────────────────────────────────
const SAISON_THEMES = {
  hiver: {
    gradFrom: "#0c1f3f", gradMid: "#1a3a6b", gradTo: "#0e6fa8",
    accent: "#60a5fa", particles: "❄️", subLabel: "Les piscines hibernent, vous veillez.",
  },
  printemps: {
    gradFrom: "#064e3b", gradMid: "#065f46", gradTo: "#0891b2",
    accent: "#34d399", particles: "🌸", subLabel: "La saison redémarre, c'est le moment !",
  },
  ete: {
    gradFrom: "#0c4a6e", gradMid: "#0369a1", gradTo: "#0ea5e9",
    accent: "#fbbf24", particles: "☀️", subLabel: "Haute saison — les piscines vous attendent.",
  },
  automne: {
    gradFrom: "#431407", gradMid: "#7c2d12", gradTo: "#0891b2",
    accent: "#f59e0b", particles: "🍂", subLabel: "Les feuilles tombent, pas vos standards.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD HERO
// ─────────────────────────────────────────────────────────────────────────────
export function DashboardHero({ clients, passages, rdvs, saisonNow, isMobile, onAddPassage, onAddLivraison, onAddClient, onAddRdv }) {
  const heure = new Date().getHours();
  const salut = heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";
  const dateStr = new Date().toLocaleDateString("fr", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });

  const totalClients = clients.length;
  const passAujourd = passages.filter(p => p.date === TODAY).length;
  const rapportsEnvoyer = passages.filter(p => p.rapportStatut !== "envoye" && p.ok).length;
  const alertes = clients.filter(c => alerteClient(c, passages) !== "ok").length;

  const rdvsFuturs = rdvs.filter(r => r.date >= TODAY).sort((a,b) => a.date.localeCompare(b.date));
  const rdvsToday = rdvsFuturs.filter(r => r.date === TODAY);


  return (
    <div>

      {/* ── HERO ── */}
      <div className="db-s1" style={{borderRadius:20,overflow:"hidden",marginBottom:12,position:"relative",boxShadow:"0 8px 32px rgba(8,145,178,0.28)"}}>
        {/* Fond */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(145deg,#0c6a8c 0%,#0891b2 45%,#0d9ab5 75%,#075e78 100%)"}}/>
        {/* Orbes */}
        <div style={{position:"absolute",right:-50,top:-50,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(56,189,248,0.25) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",left:-30,bottom:-40,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(14,116,144,0.4) 0%,transparent 70%)",pointerEvents:"none"}}/>
        {/* Vague */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:32,overflow:"hidden",opacity:0.12,pointerEvents:"none"}}>
          <div style={{display:"flex",width:"200%",height:"100%",animation:"db-wave 8s linear infinite"}}>
            {[0,1].map(k=>(
              <svg key={k} viewBox="0 0 400 32" style={{width:"50%",height:"100%"}} preserveAspectRatio="none">
                <path d="M0 16 C60 4 120 28 180 16 S300 4 360 16 S400 28 400 16 L400 32 L0 32Z" fill="white"/>
              </svg>
            ))}
          </div>
        </div>

        <div style={{position:"relative",zIndex:2,padding:"18px 18px 22px"}}>
          {/* Ligne top: logo + date + cloche */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,0.25)"}}>
                <svg width={18} height={13} viewBox="0 0 32 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M2 8c2.5 3 5 3 7.5 0S14 5 16.5 8s5 3 7.5 0"/>
                  <path d="M2 16c2.5 3 5 3 7.5 0S14 13 16.5 16s5 3 7.5 0"/>
                </svg>
              </div>
              <span style={{fontSize:14,fontWeight:800,color:"#fff",letterSpacing:.5}}>BRIBLUE</span>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",fontWeight:500,textTransform:"capitalize"}}>{dateStr}</div>
            </div>
          </div>

          {/* Salutation */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:22,fontWeight:800,color:"#fff",lineHeight:1.2,letterSpacing:"-0.5px"}}>
              {salut} Thomas ☀️
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",marginTop:3,fontWeight:400}}>
              {rdvsToday.length > 0 ? `${rdvsToday.length} rendez-vous aujourd'hui` : "Bonne journée sur le terrain"}
            </div>
          </div>

          {/* Stats grid 2x2 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {val:totalClients, label:"Clients", icon:<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>, color:"#38bdf8", bg:"rgba(56,189,248,0.15)"},
              {val:passAujourd, label:"Interventions du jour", icon:<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></>, color:"#4ade80", bg:"rgba(74,222,128,0.15)"},
              {val:rapportsEnvoyer, label:"Rapports à envoyer", icon:<><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></>, color:"#fbbf24", bg:"rgba(251,191,36,0.15)"},
              {val:alertes, label:"Alertes à traiter", icon:<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>, color:"#f87171", bg:"rgba(248,113,113,0.15)"},
            ].map(s=>(
              <div key={s.label} className="db-stat-shimmer" style={{background:s.bg,borderRadius:14,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",position:"relative",overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:28,fontWeight:800,color:"#fff",lineHeight:1,letterSpacing:"-1px"}}>{s.val}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.7)",marginTop:3,fontWeight:500,lineHeight:1.3}}>{s.label}</div>
                  </div>
                  <div style={{width:30,height:30,borderRadius:8,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round">{s.icon}</svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ACTIONS RAPIDES ── */}
      <div className="db-s2" style={{marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:8,paddingLeft:2}}>Actions rapides</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {[
            {label:"Nouvelle\nintervention", icon:<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="10" y1="15" x2="14" y2="15"/></>, color:"#0891b2", bg:"linear-gradient(135deg,#e0f2fe,#f0f9ff)", border:"#bae6fd", onClick:onAddPassage},
            {label:"Nouveau\nclient", icon:<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></>, color:"#7c3aed", bg:"linear-gradient(135deg,#ede9fe,#f5f3ff)", border:"#ddd6fe", onClick:onAddClient},
            {label:"Livraison\nproduits", icon:<><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></>, color:"#059669", bg:"linear-gradient(135deg,#d1fae5,#f0fdf4)", border:"#a7f3d0", onClick:onAddLivraison},
            {label:"Nouveau\nRDV", icon:<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></>, color:"#7c3aed", bg:"linear-gradient(135deg,#ede9fe,#f5f3ff)", border:"#ddd6fe", onClick:onAddRdv},
          ].map(a=>(
            <button key={a.label} className="db-btn" onClick={a.onClick} style={{background:a.bg,border:`1px solid ${a.border}`,borderRadius:14,padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:7,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
              <div style={{width:34,height:34,borderRadius:10,background:"white",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="2" strokeLinecap="round">{a.icon}</svg>
              </div>
              <div style={{fontSize:10,fontWeight:600,color:"#475569",textAlign:"center",lineHeight:1.3,whiteSpace:"pre-line"}}>{a.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function Dashboard({ clients, passages, rdvs=[], onClientClick, onAddPassage, onAddLivraison, onAddClient, onAddRdv, onEditPassage, onEditRdv }) {
  const isMobile = useIsMobile();
  const moisCourant = MOIS_NOW;
  const saisonNow = getSaison(moisCourant);
  const [showAllTaches, setShowAllTaches] = useState(false);

  // Stats passages du mois
  const tachesMois = clients.map(c=>{
    const prevE = getEntretienMois(c.moisParMois||c.saisons, moisCourant);
    const prevC = getControleMois(c.moisParMois||c.saisons, moisCourant);
    const cs = c.dateDebut ? c.dateDebut.slice(0,10) : null;
    const ce = c.dateFin ? c.dateFin.slice(0,10) : null;
    const inContrat = (p) => { const ds=String(p.date).slice(0,10); return cs&&ce ? ds>=cs&&ds<=ce : new Date(p.date).getFullYear()===YEAR_NOW; };
    const effE = passages.filter(p=>p.clientId===c.id&&new Date(p.date).getMonth()+1===moisCourant&&inContrat(p)&&isEntretienType(p.type)).length;
    const effC = passages.filter(p=>p.clientId===c.id&&new Date(p.date).getMonth()+1===moisCourant&&inContrat(p)&&isControleType(p.type)).length;
    const restE = Math.max(0,prevE-effE);
    const restC = Math.max(0,prevC-effC);
    return { client:c, prevE, prevC, effE, effC, restE, restC, total:restE+restC };
  }).filter(x=>(x.prevE+x.prevC)>0).sort((a,b)=>b.total-a.total);

  const totalTaches = tachesMois.reduce((a,t)=>a+t.total,0);
  const tachesRestantes = tachesMois.filter(t=>t.total>0);
  const tachesOk = tachesMois.filter(t=>t.total===0);
  const PREVIEW = 3;

  // RDVs
  const rdvsFuturs = rdvs.filter(r=>r.date>=TODAY).sort((a,b)=>a.date===b.date?(a.heure||"").localeCompare(b.heure||""):a.date.localeCompare(b.date));
  const rdvsToday = rdvsFuturs.filter(r=>r.date===TODAY);
  const rdvsProchains = rdvsFuturs.filter(r=>r.date>TODAY).slice(0,5);

  // Progress global
  const totalPrevus = tachesMois.reduce((a,t)=>a+t.prevE+t.prevC,0);
  const totalDone = tachesMois.reduce((a,t)=>a+t.effE+t.effC,0);
  const pctGlobal = totalPrevus>0?Math.round(totalDone/totalPrevus*100):100;

  return (
    <div>
      {/* HERO */}
      <DashboardHero clients={clients} passages={passages} rdvs={rdvs} saisonNow={saisonNow} isMobile={isMobile} onAddPassage={onAddPassage} onAddLivraison={onAddLivraison} onAddClient={onAddClient} onAddRdv={onAddRdv}/>

      {/* ── PASSAGES DU MOIS ── */}
      <div className="db-s3" style={{marginBottom:14,borderRadius:18,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #e2e8f0",background:"#fff"}}>
        {/* Header */}
        <div style={{padding:"14px 16px 12px",background:"linear-gradient(135deg,#f0f9ff,#fff)",borderBottom:"1px solid #f1f5f9"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:"#0f172a",letterSpacing:"-0.3px"}}>
                {MOIS_L[moisCourant]} {YEAR_NOW}
              </div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>
                {totalTaches>0
                  ? <><span style={{background:"#fef9c3",color:"#92400e",padding:"2px 9px",borderRadius:20,fontWeight:700,fontSize:11,border:"1px solid #fde68a"}}>{totalTaches}</span><span style={{marginLeft:6,color:"#64748b"}}>passage{totalTaches>1?"s":""} restant{totalTaches>1?"s":""}</span></>
                  : <span style={{color:"#16a34a",fontWeight:600}}>✅ Tous les passages effectués</span>
                }
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:22,fontWeight:800,color:pctGlobal>=100?"#16a34a":"#0891b2",lineHeight:1}}>{pctGlobal}%</div>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:500}}>avancement</div>
            </div>
          </div>
          {/* Barre progression */}
          <div style={{height:6,background:"#e2e8f0",borderRadius:99,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pctGlobal}%`,borderRadius:99,transition:"width .6s ease",
              background:pctGlobal>=100?"linear-gradient(90deg,#22c55e,#4ade80)":"linear-gradient(90deg,#0891b2,#38bdf8)"
            }}/>
          </div>
        </div>

        {/* Liste tâches restantes */}
        {tachesRestantes.length>0 && (
          <>
            {tachesRestantes.slice(0,showAllTaches?999:PREVIEW).map(({client,restE,restC,effE,prevE,effC,prevC},i)=>{
              const pct2 = (prevE+prevC)>0?Math.round((effE+effC)/(prevE+prevC)*100):0;
              return (
                <div key={client.id} className="db-rdv-row" onClick={()=>onClientClick(client)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",
                    borderBottom:i<Math.min(tachesRestantes.length,showAllTaches?999:PREVIEW)-1?"1px solid #f8fafc":"none",
                    cursor:"pointer",background:"#fff"}}>
                  <Avatar nom={client.nom} size={36} photo={client.photoPiscine}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{client.nom}</div>
                    <div style={{display:"flex",gap:8,marginTop:3,alignItems:"center"}}>
                      {prevE>0&&<span style={{fontSize:11,fontWeight:600,color:restE>0?"#d97706":"#16a34a",background:restE>0?"#fef3c7":"#dcfce7",padding:"1px 6px",borderRadius:5}}>🔧 {effE}/{prevE}</span>}
                      {prevC>0&&<span style={{fontSize:11,fontWeight:600,color:restC>0?"#0891b2":"#16a34a",background:restC>0?"#e0f2fe":"#dcfce7",padding:"1px 6px",borderRadius:5}}>💧 {effC}/{prevC}</span>}
                      <div style={{flex:1,height:3,background:"#f1f5f9",borderRadius:99,overflow:"hidden",maxWidth:50}}>
                        <div style={{height:"100%",width:`${pct2}%`,background:pct2>=100?"#22c55e":"#f59e0b",borderRadius:99}}/>
                      </div>
                    </div>
                  </div>
                  <div style={{background:"#fff7ed",color:"#c2410c",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20,border:"1px solid #fed7aa",flexShrink:0}}>
                    {restE+restC} rest.
                  </div>
                </div>
              );
            })}
            {!showAllTaches&&tachesRestantes.length>PREVIEW&&(
              <button onClick={()=>setShowAllTaches(true)} style={{width:"100%",padding:"11px",border:"none",borderTop:"1px solid #f1f5f9",background:"#fafafa",cursor:"pointer",fontSize:12,fontWeight:600,color:"#0891b2",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Voir {tachesRestantes.length-PREVIEW} autres clients
              </button>
            )}
            {showAllTaches&&tachesRestantes.length>PREVIEW&&(
              <button onClick={()=>setShowAllTaches(false)} style={{width:"100%",padding:"10px",border:"none",borderTop:"1px solid #f1f5f9",background:"#fafafa",cursor:"pointer",fontSize:12,fontWeight:600,color:"#94a3b8",fontFamily:"inherit"}}>Réduire</button>
            )}
          </>
        )}
        {tachesRestantes.length===0&&tachesOk.length>0&&(
          <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:10,background:"#f0fdf4"}}>
            <div style={{width:32,height:32,background:"#dcfce7",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span style={{fontSize:13,fontWeight:600,color:"#15803d"}}>Tous les {tachesOk.length} clients sont à jour 🎉</span>
          </div>
        )}
      </div>

      {/* ── PROCHAINES INTERVENTIONS ── */}
      {rdvsToday.length>0 && (
        <div className="db-s4" style={{marginBottom:14,borderRadius:18,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #e2e8f0",background:"#fff"}}>
          <div style={{padding:"13px 16px 10px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:8,background:"#fef3c7",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>Aujourd'hui</span>
            <span style={{marginLeft:"auto",fontSize:11,fontWeight:600,background:"#fef9c3",color:"#92400e",padding:"2px 8px",borderRadius:20,border:"1px solid #fde68a"}}>{rdvsToday.length} RDV</span>
          </div>
          {rdvsToday.map((r,i)=>{
            const c = clients.find(x=>x.id===r.clientId);
            return (
              <div key={r.id} className="db-rdv-row" style={{display:"flex",gap:12,alignItems:"center",padding:"12px 16px",borderBottom:i<rdvsToday.length-1?"1px solid #f8fafc":"none",cursor:"pointer",background:"#fff"}}>
                <div style={{width:48,textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#0891b2",lineHeight:1}}>{r.heure||"--:--"}</div>
                </div>
                <div style={{width:1,height:36,background:"#e2e8f0",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,color:"#0f172a"}}>{r.type}</div>
                  {c&&<div style={{fontSize:11,color:"#64748b",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}{c.adresse?` · ${c.adresse.split(",").pop()?.trim()}`:""}</div>}
                </div>
                <span style={{fontSize:11,fontWeight:600,color:"#0891b2",background:"#e0f2fe",padding:"3px 8px",borderRadius:8,flexShrink:0}}>{r.duree||60} min</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PROCHAINS RDV ── */}
      {rdvsProchains.length>0 && (
        <div className="db-s5" style={{marginBottom:14,borderRadius:18,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #e2e8f0",background:"#fff"}}>
          <div style={{padding:"13px 16px 10px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:8,background:"#e0f2fe",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>Prochaines interventions</span>
          </div>
          {rdvsProchains.map((r,i)=>{
            const c = clients.find(x=>x.id===r.clientId);
            const d = new Date(r.date);
            const isNext = i===0;
            return (
              <div key={r.id} className="db-rdv-row" style={{display:"flex",gap:12,alignItems:"center",padding:"12px 16px",borderBottom:i<rdvsProchains.length-1?"1px solid #f8fafc":"none",cursor:"pointer",background:isNext?"#fafeff":"#fff"}}>
                {/* Date bloc */}
                <div style={{textAlign:"center",minWidth:46,background:isNext?"#0891b2":"#f0f9ff",borderRadius:12,padding:"7px 4px",flexShrink:0,border:isNext?"none":"1px solid #e0f2fe"}}>
                  <div style={{fontSize:9,fontWeight:700,color:isNext?"rgba(255,255,255,0.8)":"#64748b",textTransform:"uppercase",letterSpacing:.5}}>{d.toLocaleDateString("fr",{weekday:"short"})}</div>
                  <div style={{fontSize:20,fontWeight:800,color:isNext?"#fff":"#0891b2",lineHeight:1.1}}>{d.getDate()}</div>
                  <div style={{fontSize:9,color:isNext?"rgba(255,255,255,0.7)":"#64748b"}}>{d.toLocaleDateString("fr",{month:"short"})}</div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,color:"#0f172a"}}>{r.heure&&<span style={{color:"#0891b2",marginRight:4}}>{r.heure}</span>}{r.type}</div>
                  {c&&<div style={{fontSize:11,color:"#64748b",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</div>}
                  {r.description&&<div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{r.description}</div>}
                </div>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MINI CALENDRIER ── */}
      <div className="db-s6">
        <CalendrierInteractif passages={passages} rdvs={rdvs} clients={clients} onClientClick={onClientClick} onEditPassage={onEditPassage} onEditRdv={onEditRdv}/>
      </div>

      {/* ── ALERTES ── */}
      {(()=>{
        const alertes = clients.filter(c=>alerteClient(c,passages)!=="ok");
        if (alertes.length===0) return null;
        return <AlertesBlock alertes={alertes} passages={passages} onClientClick={onClientClick}/>;
      })()}

    </div>
  );
}
