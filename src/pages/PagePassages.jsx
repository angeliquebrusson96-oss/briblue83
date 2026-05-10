// @ts-nocheck
import React, { useState, useMemo } from "react";
import { DS, Ico, RAPPORT_STATUS } from "../utils/constants";
import { isControleType, getRapportStatus, getPH, getCL } from "../utils/helpers";
import { useIsMobile, Card, Avatar, Tag, IcoBubble } from "../components/ui";
import { showConfirm } from "../styles";
import { PassageDetailModal } from "./PageClients";

// Local IconFiche (duplicated from App.jsx)
function IconFiche({ size=18, color="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2"/>
      <polyline points="16 3 16 7 20 7" fill="none"/>
      <path d="M7 10l1.5 1.5L11 9"/>
      <line x1="13" y1="10.5" x2="17" y2="10.5"/>
      <path d="M7 15l1.5 1.5L11 14"/>
      <line x1="13" y1="15.5" x2="17" y2="15.5"/>
    </svg>
  );
}

// Stub — genererHTMLRapport is in App.jsx; will be wired when App is refactored
function ouvrirRapport(passage, client) {
  console.warn("[ouvrirRapport] stub — genererHTMLRapport not yet extracted", passage?.id);
}
async function envoyerEmail(passage, client, onSent) {
  console.warn("[envoyerEmail] stub — genererHTMLRapport not yet extracted", passage?.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE PASSAGES
// ─────────────────────────────────────────────────────────────────────────────
export function PagePassages({ clients, passages, onAdd, onDelete, onEdit, onUpdatePassageStatus, onAddClient, onValider, onChangeStatut }) {
  const [filter,setFilter]=useState("mois");
  const [detailPassage, setDetailPassage] = useState(null);
  const [accordionOpen, setAccordionOpen] = useState(null); // id du passage ouvert
  const isMobile = useIsMobile();
  const now=new Date();
  const todayStr = now.toISOString().split("T")[0];

  const STATUT_META = {
    a_faire:  { label:"À faire",  color:"#d97706", bg:"#fef3c7" },
    en_cours: { label:"En cours", color:"#0891b2", bg:"#e0f2fe" },
    validee:  { label:"Validée",  color:"#059669", bg:"#d1fae5" },
  };

  const filtered=useMemo(()=>{
    return passages.filter(p=>{
      const d=new Date(p.date);
      if(filter==="jour") return String(p.date).slice(0,10)===todayStr;
      if(filter==="semaine") return (now-d)/86400000<=7&&d<=now;
      if(filter==="mois") return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
      return true;
    }).sort((a,b)=>{
      // En cours en premier, puis à faire, puis validées
      const ordre = { en_cours:0, a_faire:1, validee:2 };
      const oa = ordre[a.statut]??1, ob = ordre[b.statut]??1;
      if(oa!==ob) return oa-ob;
      return new Date(b.date)-new Date(a.date);
    });
  },[passages,filter,todayStr]);

  const counts = useMemo(()=>({
    jour: passages.filter(p=>String(p.date).slice(0,10)===todayStr).length,
    semaine: passages.filter(p=>{const d=new Date(p.date);return (now-d)/86400000<=7&&d<=now;}).length,
    mois: passages.filter(p=>{const d=new Date(p.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).length,
    tout: passages.length,
  }),[passages,todayStr]);

  return (
    <div>
      {/* Header Rapports avec logo */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <IconFiche size={26} color="#0891b2"/>
        <span style={{fontWeight:800,fontSize:17,color:DS.dark}}>Rapports</span>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
        <div style={{display:"flex",gap:6,flex:1,background:DS.light,borderRadius:DS.radius,padding:4}}>
          {[["jour","Auj.",Ico.clock],["semaine","7j",Ico.clock],[" mois","Mois",Ico.calendar],["tout","Tout",Ico.clipboard]].map(([v,l,ico])=>{
            const key=v.trim(); const active=filter===key;
            return (
              <button key={key} onClick={()=>setFilter(key)} className="btn-hover" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 4px",borderRadius:DS.radiusSm,border:"none",cursor:"pointer",fontFamily:"inherit",background:active?DS.white:"transparent",color:active?DS.dark:DS.mid,boxShadow:active?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all .2s"}}>
                <span style={{fontWeight:800,fontSize:16,color:active?DS.blue:DS.mid}}>{counts[key]}</span>
                <span style={{fontSize:10,fontWeight:active?700:500}}>{l}</span>
              </button>
            );
          })}
        </div>
        <button onClick={onAdd} className="btn-hover" style={{flexShrink:0,padding:"9px 12px",background:DS.blue,border:"none",borderRadius:DS.radiusSm,cursor:"pointer",display:"flex",alignItems:"center",gap:7,fontFamily:"inherit",fontWeight:700,fontSize:13,color:"#fff"}}>
          <IconFiche size={16} color="#fff"/>
          Rapport
        </button>
        {onAddClient&&(
          <button onClick={onAddClient} className="btn-hover" style={{flexShrink:0,padding:"9px 12px",background:"linear-gradient(135deg,#7c3aed,#4f46e5)",border:"none",borderRadius:DS.radiusSm,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontFamily:"inherit",fontWeight:700,fontSize:13,color:"#fff",boxShadow:"0 3px 12px rgba(79,70,229,0.3)"}}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="3" x2="19" y2="9"/><line x1="16" y1="6" x2="22" y2="6"/></svg>
            + Client
          </button>
        )}
      </div>
      {filtered.length===0
        ? <div style={{textAlign:"center",color:DS.mid,padding:40,fontSize:13}}>Aucun passage sur cette période</div>
        : <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map((p,idx)=>{
            const c=clients.find(x=>x.id===p.clientId);
            const _ph=getPH(p), _cl=getCL(p);
            const phOk=_ph>=7&&_ph<=7.6, clOk=_cl>=0.5&&_cl<=3;
            const isCtrl = isControleType(p.type);
            const rapportStatus = getRapportStatus(p);
            const rapportMeta = RAPPORT_STATUS[rapportStatus];
            return (
              <Card key={p.id} className="fade-in" style={{animationDelay:`${idx*0.05}s`}}>
                <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <Avatar nom={c?.nom||"?"} size={42} photo={c?.photoPiscine}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:13,color:DS.dark}}>{c?.nom||p.clientId}</div>
                        <div style={{fontSize:11,color:DS.mid,marginTop:1,display:"flex",alignItems:"center",gap:4}}>
                          {new Date(p.date).toLocaleDateString("fr",{weekday:"short",day:"2-digit",month:"short"})}
                          {p.tech&&<><span>·</span>{Ico.user(10,DS.mid)}<span>{p.tech}</span></>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        {/* Badge statut */}
                        {(()=>{const sm=STATUT_META[p.statut]||(p.ok?STATUT_META.validee:STATUT_META.a_faire);return(<span style={{padding:"2px 8px",borderRadius:20,background:sm.bg,color:sm.color,fontSize:10,fontWeight:800}}>{sm.label}</span>);})()}
                        {p.ok?<IcoBubble ico={Ico.check(11,DS.green)} color={DS.green} size={24}/>:<IcoBubble ico={Ico.x(11,DS.red)} color={DS.red} size={24}/>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap",alignItems:"center"}}>
                      <Tag color={isCtrl?DS.teal:DS.blue} style={{fontSize:11}}>
                        <span style={{display:"flex",alignItems:"center",gap:4}}>
                          {isCtrl ? Ico.drop(11,DS.teal) : Ico.wrench(11,DS.blue)} {p.type}
                        </span>
                      </Tag>
                      {_ph&&<Tag color={phOk?DS.green:DS.red} style={{fontSize:11}}>pH {_ph}</Tag>}
                      {_cl&&<Tag color={clOk?DS.green:DS.red} style={{fontSize:11}}>Cl {_cl}</Tag>}
                      <Tag color={rapportMeta.color} bg={rapportMeta.bg} style={{fontSize:11}}>{rapportMeta.label}</Tag>
                    </div>
                    {(p.photoArrivee||p.photoDepart) && (
                      <div style={{display:"flex",gap:6,marginBottom:6}}>
                        {p.photoArrivee && (<div style={{position:"relative"}}><img src={p.photoArrivee} alt="Arrivée" style={{height:48,width:72,objectFit:"cover",borderRadius:7,border:"1px solid "+DS.border}}/><span style={{position:"absolute",bottom:2,left:3,fontSize:8,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.55)",borderRadius:3,padding:"1px 4px"}}>Arr.</span></div>)}
                        {p.photoDepart && (<div style={{position:"relative"}}><img src={p.photoDepart} alt="Départ" style={{height:48,width:72,objectFit:"cover",borderRadius:7,border:"1px solid "+DS.border}}/><span style={{position:"absolute",bottom:2,left:3,fontSize:8,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.55)",borderRadius:3,padding:"1px 4px"}}>Dép.</span></div>)}
                      </div>
                    )}

                    {/* ═══ ACTIONS : accordéon mobile / grille desktop ═══ */}
                    <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+DS.border}}>
                      {isMobile ? (
                        // ── MOBILE : menu radial en soleil ──
                        <>
                          <button
                            onClick={()=>setAccordionOpen(accordionOpen===p.id ? null : p.id)}
                            style={{width:"100%",padding:"12px 14px",borderRadius:14,border:"none",background:accordionOpen===p.id?"linear-gradient(135deg,#0c1f3f,#0369a1)":"linear-gradient(135deg,#0891b2,#0e7490)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"inherit",fontWeight:800,fontSize:14,color:"#fff",boxShadow:"0 4px 14px rgba(8,145,178,0.35)",WebkitTapHighlightColor:"transparent"}}
                          >
                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              {accordionOpen===p.id
                                ? <line x1="18" y1="6" x2="6" y2="18"/>
                                : <><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></>
                              }
                              {accordionOpen===p.id && <line x1="6" y1="6" x2="18" y2="18"/>}
                            </svg>
                            {accordionOpen===p.id ? "Fermer" : "Actions"}
                          </button>

                          {/* MENU "SOLEIL" — boutons en cercle autour d'un centre */}
                          {accordionOpen===p.id && (()=>{
                            const isVal = p.statut === "validee";
                            const actions = [
                              { ic: Ico.search(22,"#fff"),  bg:"linear-gradient(135deg,#64748b,#475569)", label:"Aperçu",   onClick:()=>setDetailPassage(p) },
                              { ic: Ico.pdf(22,"#fff"),     bg:"linear-gradient(135deg,#0891b2,#0e7490)", label:"PDF",      onClick:()=>ouvrirRapport(p,c) },
                              ...(c?.email ? [{ ic: Ico.send(22,"#fff"), bg:"linear-gradient(135deg,#059669,#0d9488)", label:"Email", onClick:()=>showConfirm(`Envoyer à ${c.email} ?`,()=>envoyerEmail(p,c,onUpdatePassageStatus)) }] : []),
                              ...(!isVal && onChangeStatut ? [
                                { ic: Ico.clock(22,"#fff"),  bg:"linear-gradient(135deg,#f59e0b,#d97706)", label:"À faire",  onClick:()=>onChangeStatut(p.id,"a_faire") },
                                { ic: Ico.wrench(22,"#fff"), bg:"linear-gradient(135deg,#0ea5e9,#0369a1)", label:"En cours", onClick:()=>onChangeStatut(p.id,"en_cours") },
                              ] : []),
                              ...(!isVal && onValider ? [{ ic: Ico.check(22,"#fff"), bg:"linear-gradient(135deg,#10b981,#059669)", label:"Valider", onClick:()=>showConfirm("Valider l'intervention ? Elle sera verrouillée.",()=>{ onValider(p.id); setAccordionOpen(null); }) }] : []),
                              ...(!isVal ? [{ ic: Ico.edit(22,"#fff"), bg:"linear-gradient(135deg,#7c3aed,#4f46e5)", label:"Modifier", onClick:()=>{ onEdit(p); setAccordionOpen(null); } }] : []),
                              ...(!isVal ? [{ ic: Ico.trash(22,"#fff"), bg:"linear-gradient(135deg,#ef4444,#dc2626)", label:"Suppr.", onClick:()=>showConfirm("Supprimer ce passage ?",()=>{ onDelete(p.id); setAccordionOpen(null); }) }] : []),
                            ];
                            const N = actions.length;
                            const BTN_SIZE = 70;
                            // Rayon ajusté pour ne pas sortir
                            const RADIUS = N <= 4 ? 90 : N <= 6 ? 105 : N <= 8 ? 120 : 130;
                            const PAD = BTN_SIZE / 2 + 16;
                            const SIZE = (RADIUS * 2) + (BTN_SIZE) + 32;

                            return (
                              <div style={{display:"flex",justifyContent:"center",alignItems:"center",width:"100%",margin:"24px 0 12px"}}>
                              <div className="fade-in" style={{
                                width:SIZE,
                                height:SIZE,
                                position:"relative",
                                maxWidth:"100%",
                              }}>
                                {/* Halo de fond */}
                                <div style={{
                                  position:"absolute",
                                  inset:PAD,
                                  borderRadius:"50%",
                                  background:"radial-gradient(circle, rgba(8,145,178,0.08) 0%, rgba(8,145,178,0) 70%)",
                                  pointerEvents:"none",
                                }}/>
                                {/* Cercle pointillé décoratif */}
                                <div style={{
                                  position:"absolute",
                                  top:"50%",left:"50%",
                                  width:RADIUS*2,
                                  height:RADIUS*2,
                                  marginLeft:-RADIUS,
                                  marginTop:-RADIUS,
                                  borderRadius:"50%",
                                  border:"1.5px dashed rgba(8,145,178,0.22)",
                                  pointerEvents:"none",
                                }}/>

                                {/* Centre — bouton fermer */}
                                <button
                                  onClick={()=>setAccordionOpen(null)}
                                  style={{
                                    position:"absolute",
                                    top:"50%",left:"50%",
                                    width:60,height:60,
                                    marginLeft:-30,marginTop:-30,
                                    borderRadius:"50%",
                                    background:"linear-gradient(135deg,#0c1f3f,#0369a1)",
                                    border:"3px solid rgba(255,255,255,0.9)",
                                    cursor:"pointer",
                                    display:"flex",alignItems:"center",justifyContent:"center",
                                    flexDirection:"column",gap:1,
                                    boxShadow:"0 8px 24px rgba(12,31,63,0.45), inset 0 2px 6px rgba(255,255,255,0.2)",
                                    zIndex:5,
                                    fontFamily:"inherit",
                                    WebkitTapHighlightColor:"transparent",
                                  }}
                                >
                                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                  <span style={{fontSize:7,fontWeight:900,color:"#7dd3fc",letterSpacing:0.5}}>FERMER</span>
                                </button>

                                {/* Boutons en cercle */}
                                {actions.map((act, i) => {
                                  const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
                                  const x = Math.cos(angle) * RADIUS;
                                  const y = Math.sin(angle) * RADIUS;
                                  return (
                                    <button
                                      key={i}
                                      onClick={(e)=>{ e.stopPropagation(); act.onClick(); }}
                                      style={{
                                        position:"absolute",
                                        top:`calc(50% + ${y}px)`,
                                        left:`calc(50% + ${x}px)`,
                                        width:BTN_SIZE,
                                        height:BTN_SIZE,
                                        marginLeft:-(BTN_SIZE/2),
                                        marginTop:-(BTN_SIZE/2),
                                        borderRadius:"50%",
                                        background:act.bg,
                                        border:"3px solid rgba(255,255,255,0.95)",
                                        cursor:"pointer",
                                        display:"flex",
                                        flexDirection:"column",
                                        alignItems:"center",
                                        justifyContent:"center",
                                        gap:1,
                                        boxShadow:"0 8px 22px rgba(0,0,0,0.22), inset 0 1px 3px rgba(255,255,255,0.25)",
                                        animation:`burst-${i} .4s cubic-bezier(.34,1.56,.64,1) both`,
                                        WebkitTapHighlightColor:"transparent",
                                        fontFamily:"inherit",
                                      }}
                                    >
                                      {act.ic}
                                      <span style={{fontSize:9,fontWeight:800,color:"#fff",lineHeight:1.1,marginTop:2,textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>{act.label}</span>
                                    </button>
                                  );
                                })}

                                <style>{actions.map((_,i)=>`@keyframes burst-${i} { 0% { opacity:0; transform: scale(0.3) translate(${-Math.cos((i/N)*2*Math.PI - Math.PI/2)*RADIUS*0.5}px, ${-Math.sin((i/N)*2*Math.PI - Math.PI/2)*RADIUS*0.5}px); } 100% { opacity:1; transform: scale(1) translate(0,0); } }`).join(" ")}</style>
                              </div>
                              </div>
                            );
                          })()}

                          {p.statut==="validee" && !accordionOpen && (
                            <div style={{marginTop:8,padding:"12px 14px",borderRadius:12,background:DS.greenSoft,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:12,color:DS.green,fontWeight:700}}>
                              {Ico.check(14,DS.green)} Intervention verrouillée
                            </div>
                          )}
                        </>
                      ) : (
                        // ── DESKTOP : grille de boutons ──
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:6}}>
                          <button onClick={()=>setDetailPassage(p)} className="btn-hover" style={{padding:"10px",borderRadius:10,background:DS.light,border:"1px solid "+DS.border,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.dark,fontFamily:"inherit",fontWeight:700}}>
                            {Ico.search(13,DS.mid)} Aperçu
                          </button>
                          <button onClick={()=>ouvrirRapport(p,c)} className="btn-hover" style={{padding:"10px",borderRadius:10,background:DS.blueSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.blue,fontFamily:"inherit",fontWeight:700}}>
                            {Ico.pdf(14,DS.blue)} Rapport PDF
                          </button>
                          {c?.email
                            ? <button onClick={()=>showConfirm(`Envoyer à ${c.email} ?`,()=>envoyerEmail(p,c,onUpdatePassageStatus))} className="btn-hover" style={{padding:"10px",borderRadius:10,background:DS.greenSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.green,fontFamily:"inherit",fontWeight:700}}>
                                {Ico.send(13,DS.green)} Email
                              </button>
                            : <div style={{borderRadius:10,background:DS.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:DS.mid}}>{Ico.mail(12,DS.mid)} Pas d'email</div>
                          }
                          {p.statut!=="validee" && onChangeStatut && (
                            <div style={{display:"flex",gap:4}}>
                              {["a_faire","en_cours"].map(s=>{
                                const sm=STATUT_META[s];
                                return(<button key={s} onClick={()=>onChangeStatut(p.id,s)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:`1.5px solid ${p.statut===s?sm.color:"transparent"}`,background:p.statut===s?sm.bg:DS.light,color:p.statut===s?sm.color:DS.mid,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{sm.label}</button>);
                              })}
                            </div>
                          )}
                          {p.statut!=="validee" && onValider && (
                            <button onClick={()=>showConfirm("Valider ?",()=>onValider(p.id))} className="btn-hover" style={{padding:"10px",borderRadius:10,background:DS.greenSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.green,fontFamily:"inherit",fontWeight:700}}>
                              {Ico.check(13,DS.green)} Valider
                            </button>
                          )}
                          {p.statut!=="validee" && (
                            <button onClick={()=>onEdit(p)} className="btn-hover" style={{padding:"10px",borderRadius:10,background:DS.light,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.mid,fontFamily:"inherit",fontWeight:700}}>
                              {Ico.edit(13,DS.mid)} Modifier
                            </button>
                          )}
                          {p.statut!=="validee" && (
                            <button onClick={()=>showConfirm("Supprimer ?",()=>onDelete(p.id))} className="btn-hover" style={{padding:"10px",borderRadius:10,background:DS.redSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.red,fontFamily:"inherit",fontWeight:700}}>
                              {Ico.trash(13,DS.red)} Supprimer
                            </button>
                          )}
                          {p.statut==="validee" && (
                            <div style={{padding:"10px",borderRadius:10,background:DS.greenSoft,display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.green,fontWeight:700}}>
                              {Ico.check(13,DS.green)} Verrouillée
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      }
      {detailPassage && <PassageDetailModal passage={detailPassage} client={clients.find(x=>x.id===detailPassage.clientId)} onClose={()=>setDetailPassage(null)}/>}
    </div>
  );
}
