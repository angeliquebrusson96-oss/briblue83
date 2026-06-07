// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { DS, Ico, MOIS_L } from "../utils/constants";
import { TODAY, getSaison, getEntretienMois, getControleMois, isEntretienType, isControleType, MOIS_NOW, YEAR_NOW } from "../utils/helpers";
import { Avatar, useIsMobile } from "../components/ui";
import { CalendrierInteractif } from "../components/Calendrier";

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
// PLANNING HEBDOMADAIRE
// ─────────────────────────────────────────────────────────────────────────────
function PlanningHebdo({ clients, passages, rdvs, onAddRdv, onAddPassage, onEditRdv, onClientClick, isMobile }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [menuDay, setMenuDay] = useState(null); // date string du jour dont le menu est ouvert
  const scrollRef = useRef(null);

  // Ferme le menu au clic extérieur
  useEffect(() => {
    if (!menuDay) return;
    const close = () => setMenuDay(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("touchstart", close); };
  }, [menuDay]);

  // Lundi de la semaine courante + décalage
  const getMonday = (offset) => {
    const d = new Date();
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const monday = getMonday(weekOffset);
  const days = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const todayStr = new Date().toISOString().split("T")[0];

  // Scroll auto vers aujourd'hui sur mobile
  useEffect(() => {
    if (!isMobile || !scrollRef.current || weekOffset !== 0) return;
    const idx = days.findIndex(d => d.toISOString().split("T")[0] === todayStr);
    if (idx >= 0) scrollRef.current.scrollLeft = Math.max(0, idx * 116 - 8);
  }, [weekOffset, isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  const weekLabel = (() => {
    const last = new Date(monday);
    last.setDate(monday.getDate() + 5);
    const f = d => d.toLocaleDateString("fr", { day:"2-digit", month:"short" });
    return `${f(monday)} — ${f(last)} ${monday.getFullYear()}`;
  })();

  const getEventsForDay = (date) => {
    const ds = date.toISOString().split("T")[0];
    const r = (rdvs||[]).filter(r => r.date === ds).map(r => ({...r, _kind:"rdv"}));
    const p = (passages||[]).filter(p => p.date === ds).map(p => ({...p, _kind:"passage"}));
    return [...r, ...p].sort((a, b) => (a.heure||"").localeCompare(b.heure||""));
  };

  return (
    <div className="db-s2" style={{marginBottom:14,borderRadius:18,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #e2e8f0",background:"#fff"}}>
      {/* ── En-tête ── */}
      <div style={{padding:"11px 14px 9px",background:"linear-gradient(135deg,#f0f9ff,#fff)",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:"#e0f2fe",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>Planning semaine</div>
            <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{weekLabel}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <button onClick={()=>setWeekOffset(w=>w-1)}
            style={{width:28,height:28,borderRadius:7,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          {weekOffset !== 0 && (
            <button onClick={()=>setWeekOffset(0)}
              style={{height:28,padding:"0 8px",borderRadius:7,border:"1px solid #bae6fd",background:"#e0f2fe",cursor:"pointer",fontSize:10,fontWeight:700,color:"#0891b2",fontFamily:"inherit"}}>
              Auj.
            </button>
          )}
          <button onClick={()=>setWeekOffset(w=>w+1)}
            style={{width:28,height:28,borderRadius:7,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* ── Grille jours ── */}
      <div ref={scrollRef} style={{
        display:"flex",gap:5,
        overflowX:isMobile?"auto":"hidden",
        WebkitOverflowScrolling:"touch",
        scrollbarWidth:"none",
        padding:"8px",
      }}>
        {days.map((day) => {
          const ds = day.toISOString().split("T")[0];
          const isToday  = ds === todayStr;
          const isPast   = ds < todayStr;
          const events   = getEventsForDay(day);
          const dayName  = day.toLocaleDateString("fr", { weekday:"short" });
          const dayNum   = day.getDate();
          const monthStr = day.toLocaleDateString("fr", { month:"short" });

          return (
            <div key={ds} style={{
              minWidth:isMobile?108:undefined,flex:isMobile?"0 0 108px":1,
              borderRadius:10,
              background:isToday?"#f0f9ff":"#fafafa",
              border:`1.5px solid ${isToday?"#0891b2":"#e2e8f0"}`,
              display:"flex",flexDirection:"column",overflow:"hidden",
            }}>
              {/* Trait top si aujourd'hui */}
              {isToday && <div style={{height:3,background:"linear-gradient(90deg,#0891b2,#06b6d4)"}}/>}

              {/* En-tête du jour */}
              <div style={{
                padding:"5px 3px 3px",textAlign:"center",
                borderBottom:`1px solid ${isToday?"#bae6fd":"#f1f5f9"}`,
                background:isToday?"rgba(8,145,178,0.05)":"transparent",
              }}>
                <div style={{fontSize:8,fontWeight:700,color:isToday?"#0891b2":isPast?"#94a3b8":"#64748b",textTransform:"uppercase",letterSpacing:.3}}>
                  {dayName}
                </div>
                <div style={{fontSize:19,fontWeight:900,lineHeight:1.1,color:isToday?"#0891b2":isPast?"#cbd5e1":"#0f172a"}}>
                  {dayNum}
                </div>
                <div style={{fontSize:8,color:"#94a3b8",lineHeight:1}}>{monthStr}</div>
              </div>

              {/* Événements */}
              <div style={{padding:"4px",display:"flex",flexDirection:"column",gap:3,flex:1}}>
                {events.map((ev, j) => {
                  const client = (clients||[]).find(c => c.id === ev.clientId);
                  const nom = (() => {
                    if (!client?.nom) return "?";
                    const parts = client.nom.replace(/^(M\.|Mme|Mlle)\s*/i,"").trim().split(/\s+/);
                    return (parts[parts.length-1]||parts[0]).slice(0,10);
                  })();
                  const isPassage = ev._kind === "passage";
                  const isCtrl = isControleType(ev.type);
                  const isSav = /sav|dépann/i.test(ev.type||"");

                  const [color, bg, bord] = isPassage
                    ? isCtrl  ? ["#0e7490","#e0f2fe","#7dd3fc"]
                    : isSav   ? ["#ea580c","#fff7ed","#fdba74"]
                    : ["#059669","#f0fdf4","#86efac"]
                    : ["#7c3aed","#f5f3ff","#c4b5fd"];

                  const emoji = isPassage ? (isCtrl?"💧":isSav?"🔧":"✓") : "📅";

                  return (
                    <button key={ev.id||j}
                      onClick={()=> isPassage && client ? onClientClick(client) : (!isPassage && onEditRdv && onEditRdv(ev))}
                      style={{
                        width:"100%",padding:"3px 4px",borderRadius:6,
                        background:bg,border:`1px solid ${bord}`,
                        cursor:"pointer",fontFamily:"inherit",textAlign:"left",
                        WebkitTapHighlightColor:"transparent",
                        opacity:isPast&&!isPassage?.6:1,
                      }}>
                      <div style={{fontSize:8,color:"#64748b",marginBottom:1,display:"flex",alignItems:"center",gap:2,lineHeight:1}}>
                        <span>{emoji}</span>
                        {ev.heure&&<span>{ev.heure.slice(0,5)}</span>}
                      </div>
                      <div style={{fontSize:10,fontWeight:700,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.2}}>{nom}</div>
                      <div style={{fontSize:8,color,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(ev.type||"RDV").slice(0,13)}</div>
                    </button>
                  );
                })}

                {/* Bouton + avec menu type */}
                <div style={{position:"relative"}}>
                  <button
                    onMouseDown={e=>{ e.stopPropagation(); setMenuDay(menuDay===ds?null:ds); }}
                    onTouchStart={e=>{ e.stopPropagation(); setMenuDay(menuDay===ds?null:ds); }}
                    style={{
                      width:"100%",minHeight:22,padding:"2px",borderRadius:6,
                      background:menuDay===ds?"#e0f2fe":"transparent",
                      border:`1.5px dashed ${menuDay===ds?"#0891b2":"#e2e8f0"}`,
                      cursor:"pointer",color:menuDay===ds?"#0891b2":"#d1d5db",
                      fontSize:15,fontWeight:700,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontFamily:"inherit",lineHeight:1,transition:"all .15s",
                    }}>
                    +
                  </button>

                  {menuDay === ds && (
                    <div onMouseDown={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()}
                      style={{
                        position:"absolute",bottom:"calc(100% + 4px)",left:0,right:0,
                        zIndex:500,background:"#fff",borderRadius:10,
                        boxShadow:"0 8px 24px rgba(0,0,0,0.15)",
                        border:"1px solid #e2e8f0",overflow:"hidden",
                        minWidth:130,
                      }}>
                      {[
                        {label:"📅 RDV",          color:"#7c3aed", action:()=>{ onAddRdv&&onAddRdv({date:ds}); setMenuDay(null); }},
                        {label:"🔧 Entretien",     color:"#059669", action:()=>{ onAddPassage&&onAddPassage({date:ds,type:"Entretien complet"}); setMenuDay(null); }},
                        {label:"💧 Contrôle eau",  color:"#0891b2", action:()=>{ onAddPassage&&onAddPassage({date:ds,type:"Contrôle de l'eau"}); setMenuDay(null); }},
                        {label:"🔧 SAV",           color:"#ea580c", action:()=>{ onAddPassage&&onAddPassage({date:ds,type:"SAV"}); setMenuDay(null); }},
                        {label:"❄️ Hivernage",     color:"#60a5fa", action:()=>{ onAddPassage&&onAddPassage({date:ds,type:"Hivernage"}); setMenuDay(null); }},
                        {label:"🌱 Remise en svc", color:"#16a34a", action:()=>{ onAddPassage&&onAddPassage({date:ds,type:"Remise en service"}); setMenuDay(null); }},
                      ].map(item=>(
                        <button key={item.label}
                          onClick={item.action}
                          style={{
                            width:"100%",padding:"8px 10px",border:"none",
                            background:"#fff",cursor:"pointer",fontFamily:"inherit",
                            textAlign:"left",fontSize:11,fontWeight:600,
                            color:item.color,
                            borderBottom:"1px solid #f8fafc",
                            transition:"background .1s",
                          }}
                          onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                          onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div style={{padding:"4px 12px 8px",display:"flex",gap:10,flexWrap:"wrap"}}>
        {[["#059669","#f0fdf4","✓ Entretien"],["#0e7490","#e0f2fe","💧 Contrôle"],["#ea580c","#fff7ed","🔧 SAV"],["#7c3aed","#f5f3ff","📅 RDV"]].map(([c,bg,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:8,height:8,borderRadius:2,background:bg,border:`1px solid ${c}44`}}/>
            <span style={{fontSize:9,color:"#94a3b8",fontWeight:500}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD HERO
// ─────────────────────────────────────────────────────────────────────────────
export function DashboardHero({ clients, passages, rdvs, saisonNow, isMobile, onAddPassage, onAddLivraison, onAddClient, onAddRdv, notes, onNotesChange }) { // eslint-disable-line no-unused-vars
  const heure = new Date().getHours();
  const salut = heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";
  const dateStr = new Date().toLocaleDateString("fr", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });

  const totalClients = clients.length;
  const passAujourd = passages.filter(p => p.date === TODAY).length;
  const rapportsEnvoyer = passages.filter(p => p.rapportStatut !== "envoye" && p.ok).length;
  const passMois = passages.filter(p => new Date(p.date).getMonth()+1 === new Date().getMonth()+1 && new Date(p.date).getFullYear() === new Date().getFullYear()).length;

  const rdvsFuturs = rdvs.filter(r => r.date >= TODAY).sort((a,b) => a.date.localeCompare(b.date));
  const rdvsToday = rdvsFuturs.filter(r => r.date === TODAY);


  return (
    <div>

      {/* ── HERO ── */}
      <div className="db-s1" style={{borderRadius:18,overflow:"hidden",marginBottom:12,position:"relative",boxShadow:"0 4px 20px rgba(8,145,178,0.2)"}}>
        {/* Fond */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(145deg,#075985 0%,#0891b2 50%,#0e7490 100%)"}}/>
        {/* Vague décorative discrète */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:28,overflow:"hidden",opacity:0.08,pointerEvents:"none"}}>
          <div style={{display:"flex",width:"200%",height:"100%",animation:"db-wave 10s linear infinite"}}>
            {[0,1].map(k=>(
              <svg key={k} viewBox="0 0 400 28" style={{width:"50%",height:"100%"}} preserveAspectRatio="none">
                <path d="M0 14 C60 2 120 26 180 14 S300 2 360 14 S400 26 400 14 L400 28 L0 28Z" fill="white"/>
              </svg>
            ))}
          </div>
        </div>

        <div style={{position:"relative",zIndex:2,padding:"18px 18px 22px"}}>
          {/* Ligne top: logo + date */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,0.2)"}}>
                {/* Triple vague — nouveau logo */}
                <svg width={18} height={16} viewBox="0 0 32 28" fill="none" stroke="white" strokeLinecap="round">
                  <path d="M1 22c3.5 4.5 7 4.5 10.5 0S18 17.5 21.5 22 28 26.5 31 22" strokeWidth="3.2"/>
                  <path d="M3 14c3 3.5 6 3.5 9 0s6-3.5 9 0 5 3.5 8 0" strokeWidth="2.2" strokeOpacity="0.68"/>
                  <path d="M7 7c2.5 2.5 5 2.5 7.5 0s5-2.5 7.5 0" strokeWidth="1.6" strokeOpacity="0.4"/>
                </svg>
              </div>
              <span style={{fontSize:13,fontWeight:800,color:"rgba(255,255,255,0.95)",letterSpacing:.3}}>BRIBLUE</span>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.65)",fontWeight:400,textTransform:"capitalize"}}>{dateStr}</div>
            </div>
          </div>

          {/* Salutation */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:22,fontWeight:800,color:"#fff",lineHeight:1.2,letterSpacing:"-0.4px"}}>
              {salut} Dorian 👋
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:3,fontWeight:400}}>
              {rdvsToday.length > 0 ? `${rdvsToday.length} rendez-vous aujourd'hui` : "Que cette journée se passe comme tu le souhaites !"}
            </div>
          </div>

        </div>
      </div>

      {/* ── NOTES DRAG & DROP ── */}
      <StickyNotes notes={notes} onNotesChange={onNotesChange}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STICKY NOTES — drag & drop + sauvegarde Firebase via onNotesChange
// ─────────────────────────────────────────────────────────────────────────────
const NOTE_COLORS = ["#fef9c3","#dcfce7","#dbeafe","#fce7f3","#ede9fe","#ffedd5","#fff","#fef2f2"];

// Composant contrôlé : l'état réel vit dans App.jsx → Firebase
function StickyNotes({ notes = [], onNotesChange }) {
  const dragIdx     = useRef(null);
  const dragOverIdx = useRef(null);
  const [dragOver, setDragOver] = useState(-1);

  // Appelle le callback parent (qui déclenche save → Firebase)
  const update = (fn) => onNotesChange(typeof fn === "function" ? fn(notes) : fn);

  const addNote = () => {
    const col = NOTE_COLORS[Math.floor(Math.random()*NOTE_COLORS.length)];
    update(p => [...p, {id:Date.now().toString(), text:"", color:col}]);
  };
  const delNote   = (id)         => update(p => p.filter(n=>n.id!==id));
  const editText  = (id, text)   => update(p => p.map(n=>n.id===id?{...n,text}:n));
  const editColor = (id, color)  => update(p => p.map(n=>n.id===id?{...n,color}:n));

  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragOver  = (e,i) => { e.preventDefault(); dragOverIdx.current=i; setDragOver(i); };
  const onDrop      = () => {
    const from=dragIdx.current, to=dragOverIdx.current;
    if (from!==null && to!==null && from!==to) {
      update(p => {
        const a=[...p];
        const [el]=a.splice(from,1);
        a.splice(to,0,el);
        return a;
      });
    }
    dragIdx.current=null; dragOverIdx.current=null; setDragOver(-1);
  };

  return (
    <div className="db-s2" style={{marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:12,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".6px"}}>
          📝 Notes
        </span>
        <button onClick={addNote}
          style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,background:"#f0f9ff",border:"1px solid #bae6fd",cursor:"pointer",fontSize:12,fontWeight:700,color:"#0891b2",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Note
        </button>
      </div>

      {notes.length===0 && (
        <button onClick={addNote}
          style={{width:"100%",padding:20,borderRadius:16,border:"2px dashed #e2e8f0",background:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:13,color:"#94a3b8",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          📝 Ajouter une note
        </button>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {notes.map((note, i) => (
          <div key={note.id}
            draggable
            onDragStart={()=>onDragStart(i)}
            onDragOver={e=>onDragOver(e,i)}
            onDrop={onDrop}
            onDragEnd={()=>{dragIdx.current=null;dragOverIdx.current=null;setDragOver(-1);}}
            style={{
              borderRadius:16,
              background:note.color||"#fef9c3",
              border:`2px solid ${dragOver===i&&dragIdx.current!==i?"#0891b2":"rgba(0,0,0,0.07)"}`,
              boxShadow:"0 2px 10px rgba(0,0,0,0.07)",
              opacity:dragIdx.current===i?0.45:1,
              transition:"opacity .2s, border .15s",
            }}>
            {/* Barre de contrôle */}
            <div style={{display:"flex",alignItems:"center",padding:"7px 10px 4px",gap:6,userSelect:"none"}}>
              {/* Poignée drag */}
              <div style={{cursor:"grab",color:"#94a3b8",fontSize:15,lineHeight:1,flexShrink:0,touchAction:"none"}}>⠿</div>
              {/* Palette couleurs */}
              <div style={{display:"flex",gap:4,flex:1,flexWrap:"wrap"}}>
                {NOTE_COLORS.map(c=>(
                  <button key={c} onClick={()=>editColor(note.id,c)}
                    style={{width:14,height:14,borderRadius:7,background:c,border:note.color===c?"2.5px solid #0891b2":"1.5px solid rgba(0,0,0,0.12)",cursor:"pointer",padding:0,flexShrink:0,transition:"transform .15s",transform:note.color===c?"scale(1.25)":"scale(1)"}}/>
                ))}
              </div>
              {/* Supprimer */}
              <button onClick={()=>delNote(note.id)}
                style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:15,lineHeight:1,padding:"0 2px",flexShrink:0,WebkitTapHighlightColor:"transparent"}}>✕</button>
            </div>
            {/* Zone texte */}
            <textarea
              value={note.text}
              onChange={e=>editText(note.id,e.target.value)}
              placeholder="📝 Écris ta note ici…"
              style={{
                width:"100%",padding:"2px 12px 12px",background:"transparent",border:"none",
                outline:"none",resize:"none",fontFamily:"inherit",fontSize:13,
                color:"#374151",lineHeight:1.7,minHeight:60,boxSizing:"border-box",
                WebkitTapHighlightColor:"transparent",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function Dashboard({ clients, passages, rdvs=[], onClientClick, onAddPassage, onAddLivraison, onAddClient, onAddRdv, onEditPassage, onEditRdv, notes=[], onNotesChange }) {
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
      <DashboardHero clients={clients} passages={passages} rdvs={rdvs} saisonNow={saisonNow} isMobile={isMobile} onAddPassage={onAddPassage} onAddLivraison={onAddLivraison} onAddClient={onAddClient} onAddRdv={onAddRdv} notes={notes} onNotesChange={onNotesChange}/>

      {/* ── PLANNING SEMAINE ── */}
      <PlanningHebdo clients={clients} passages={passages} rdvs={rdvs} onAddRdv={onAddRdv} onAddPassage={onAddPassage} onEditRdv={onEditRdv} onClientClick={onClientClick} isMobile={isMobile}/>

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


    </div>
  );
}
