// @ts-nocheck
import React, { useState } from "react";
import { DS, MOIS_PAR_MOIS_DEF, MOIS, SAISONS_META } from "../utils/constants";
import { migrateMois, getMoisVal, getSaison, totalAnnuel, calcMensualites, TODAY } from "../utils/helpers";
import { useIsMobile, useFormDraft, DraftBanner, Modal, PhotoPicker, FmField, FmSectionTitle, FmHeader, FmSteps } from "./ui";
import { toastWarn } from "../styles";

export function FormClient({ initial, clients, onSave, onClose }) {
  const isNew = !initial?.id;
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [f, setF] = useState(() => {
    if (initial) return { ...initial, moisParMois: migrateMois(initial.moisParMois||initial.saisons), photoPiscine: initial.photoPiscine||"", prixPassageE: initial.prixPassageE||0, prixPassageC: initial.prixPassageC||0, notesTarifaires: initial.notesTarifaires||"" };
    return { id:`C${String(clients.length+1).padStart(3,"0")}`, nom:"", tel:"", email:"", adresse:"", bassin:"Liner", volume:30, formule:"VAC", prix:0, prixPassageE:0, prixPassageC:0, dateDebut:TODAY, photoPiscine:"", notesTarifaires:"", dateFin:`${new Date().getFullYear()+1}-03-31`, moisParMois:{...MOIS_PAR_MOIS_DEF} };
  });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const setMoisVal = (m,type,v) => setF(p=>({...p,moisParMois:{...p.moisParMois,[m]:{...p.moisParMois[m],[type]:Math.max(0,v)}}}));
  const totalE = totalAnnuel(f.moisParMois,"entretien");
  const totalC = totalAnnuel(f.moisParMois,"controle");
  const prixCalc = totalE*(f.prixPassageE||0)+totalC*(f.prixPassageC||0);

  const { hasDraft, restoreDraft, discardDraft, clearDraft } = useFormDraft(
    `briblue_draft_client_${initial?.id||"new"}`, f, setF, null, null,
    () => !!(f.nom?.trim() || f.tel || f.email)
  );

  const STEPS = ["Infos", "Contrat", "Planning", "Tarif"];

  const handleSave = () => {
    if(!f.nom.trim()){ toastWarn("Nom du client requis"); return; }
    clearDraft(); onSave({...f, prix:prixCalc});
  };

  return (
    <Modal title="" onClose={onClose} wide noHeader>
      <div>
        <FmHeader title={isNew?"Nouveau client":`Modifier — ${f.nom||"..."}`} subtitle="Informations et contrat" color="#7c3aed" onClose={onClose}/>
        <FmSteps steps={STEPS} current={step} color="#7c3aed"/>
        {hasDraft&&!initial?.id&&<div style={{margin:"10px 20px 0"}}><DraftBanner onRestore={restoreDraft} onDiscard={discardDraft}/></div>}

        <div style={{padding:"16px 20px 20px",display:"flex",flexDirection:"column",gap:16}}>

          {/* ÉTAPE 1 — INFOS */}
          {step===1&&(
            <div className="fm-in" style={{display:"flex",flexDirection:"column",gap:12}}>
              <FmSectionTitle icon={<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>}>Identité</FmSectionTitle>
              <FmField label="Nom complet *">
                <input value={f.nom} onChange={e=>set("nom",e.target.value)} placeholder="Ex : Mme Dupont"/>
              </FmField>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <FmField label="Téléphone"><input value={f.tel} onChange={e=>set("tel",e.target.value)} type="tel" placeholder="06 ..."/></FmField>
                <FmField label="Email"><input value={f.email} onChange={e=>set("email",e.target.value)} type="email" placeholder="@"/></FmField>
              </div>
              <FmField label="Adresse"><input value={f.adresse} onChange={e=>set("adresse",e.target.value)} placeholder="Rue, Ville"/></FmField>

              <FmSectionTitle icon={<><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 12h20"/></>}>Piscine</FmSectionTitle>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <FmField label="Type de bassin">
                  <select value={f.bassin} onChange={e=>set("bassin",e.target.value)}>
                    {["Liner","Béton","Coque polyester","PVC armé","Hors-sol","Autre"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </FmField>
                <FmField label="Volume (m³)"><input value={f.volume} onChange={e=>set("volume",+e.target.value)} type="number" placeholder="30"/></FmField>
              </div>
              <FmSectionTitle icon={<><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>}>Photo de la piscine</FmSectionTitle>
              <PhotoPicker value={f.photoPiscine||""} onChange={v=>set("photoPiscine",v)} compact/>
            </div>
          )}

          {/* ÉTAPE 2 — CONTRAT */}
          {step===2&&(
            <div className="fm-in" style={{display:"flex",flexDirection:"column",gap:12}}>
              <FmSectionTitle icon={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>}>Formule</FmSectionTitle>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {["VAC","VAC+","Confort","Confort+"].map(v=>(
                  <button key={v} className={`fm-choice${f.formule===v?" active":""}`} onClick={()=>set("formule",v)} style={{justifyContent:"center",fontWeight:f.formule===v?700:400,color:f.formule===v?"#0891b2":"#64748b",fontSize:14}}>
                    {f.formule===v&&<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    {v}
                  </button>
                ))}
              </div>
              <FmSectionTitle icon={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}>Durée du contrat</FmSectionTitle>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <FmField label="Date de début"><input type="date" value={f.dateDebut} onChange={e=>set("dateDebut",e.target.value)}/></FmField>
                <FmField label="Date de fin"><input type="date" value={f.dateFin} onChange={e=>set("dateFin",e.target.value)}/></FmField>
              </div>
              <FmSectionTitle icon={<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>}>Tarification</FmSectionTitle>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <FmField label="Prix entretien (€/passage)"><input type="number" value={f.prixPassageE||""} onChange={e=>set("prixPassageE",+e.target.value||0)} placeholder="0"/></FmField>
                <FmField label="Prix contrôle (€/passage)"><input type="number" value={f.prixPassageC||""} onChange={e=>set("prixPassageC",+e.target.value||0)} placeholder="0"/></FmField>
              </div>
              <FmField label="Notes tarifaires (optionnel)">
                <textarea value={f.notesTarifaires||""} onChange={e=>set("notesTarifaires",e.target.value)} placeholder="Ex: Produits inclus, remise accordée…" style={{minHeight:60,resize:"vertical"}}/>
              </FmField>
            </div>
          )}

          {/* ÉTAPE 3 — PLANNING */}
          {step===3&&(
            <div className="fm-in" style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>
                  🔧 {totalE} entretiens · 💧 {totalC} contrôles · <span style={{color:"#0891b2"}}>{totalE+totalC} total</span>
                </div>
                <button onClick={()=>setF(p=>({...p,moisParMois:Object.fromEntries([1,2,3,4,5,6,7,8,9,10,11,12].map(m=>[m,{entretien:0,controle:0}]))}))} style={{fontSize:11,color:"#ef4444",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Réinitialiser</button>
              </div>
              <div style={{borderRadius:14,overflow:"hidden",border:"1px solid #e2e8f0"}}>
                {[...Array(12)].map((_,i)=>{
                  const m=i+1; const mv=getMoisVal(f.moisParMois,m); const sc=SAISONS_META[getSaison(m)];
                  return (
                    <div key={m} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:i<11?"1px solid #f8fafc":"none",background:i%2===0?"#fff":"#fafafa"}}>
                      <div style={{width:4,height:28,borderRadius:2,background:sc.color,flexShrink:0}}/>
                      <span style={{fontSize:13,fontWeight:600,color:"#0f172a",width:28}}>{MOIS[m]}</span>
                      <div style={{flex:1,display:"flex",alignItems:"center",gap:16}}>
                        {/* Entretien */}
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:12,color:"#0891b2"}}>🔧</span>
                          <button className="fm-num-btn" onClick={()=>setMoisVal(m,"entretien",mv.entretien-1)} style={{background:"#f1f5f9",color:"#64748b"}}>−</button>
                          <span style={{fontSize:15,fontWeight:700,color:"#0891b2",minWidth:18,textAlign:"center"}}>{mv.entretien}</span>
                          <button className="fm-num-btn" onClick={()=>setMoisVal(m,"entretien",mv.entretien+1)} style={{background:"#e0f2fe",color:"#0891b2"}}>+</button>
                        </div>
                        {/* Contrôle */}
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:12,color:"#0891b2"}}>💧</span>
                          <button className="fm-num-btn" onClick={()=>setMoisVal(m,"controle",mv.controle-1)} style={{background:"#f1f5f9",color:"#64748b"}}>−</button>
                          <span style={{fontSize:15,fontWeight:700,color:"#0284c7",minWidth:18,textAlign:"center"}}>{mv.controle}</span>
                          <button className="fm-num-btn" onClick={()=>setMoisVal(m,"controle",mv.controle+1)} style={{background:"#e0f2fe",color:"#0891b2"}}>+</button>
                        </div>
                      </div>
                      <span style={{fontSize:13,fontWeight:700,color:mv.entretien+mv.controle>0?"#0f172a":"#e2e8f0",minWidth:20,textAlign:"right"}}>{mv.entretien+mv.controle||"—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ÉTAPE 4 — RÉCAP TARIF */}
          {step===4&&(
            <div className="fm-in" style={{display:"flex",flexDirection:"column",gap:12}}>
              <FmSectionTitle>Récapitulatif</FmSectionTitle>
              {/* Info card */}
              <div style={{background:"#f8fafc",borderRadius:14,padding:"14px 16px",border:"1px solid #e2e8f0"}}>
                {[["Client",f.nom||"—"],["Formule",f.formule],["Bassin",`${f.bassin}${f.volume?" · "+f.volume+"m³":""}`],["Période",`${f.dateDebut||"—"} → ${f.dateFin||"—"}`],["Total passages",`${totalE} entretiens + ${totalC} contrôles`]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                    <span style={{color:"#64748b"}}>{l}</span>
                    <span style={{fontWeight:600,color:"#0f172a"}}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Prix */}
              <div style={{background:"linear-gradient(135deg,#0891b2,#0e7490)",borderRadius:16,padding:"18px 20px",color:"#fff"}}>
                <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.65)",textTransform:"uppercase",letterSpacing:0.6,marginBottom:8}}>Tarification annuelle</div>
                {totalE>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
                  <span style={{color:"rgba(255,255,255,0.75)"}}>🔧 {totalE} × {f.prixPassageE||0} €</span>
                  <span style={{fontWeight:600}}>{totalE*(f.prixPassageE||0)} €</span>
                </div>}
                {totalC>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
                  <span style={{color:"rgba(255,255,255,0.75)"}}>💧 {totalC} × {f.prixPassageC||0} €</span>
                  <span style={{fontWeight:600}}>{totalC*(f.prixPassageC||0)} €</span>
                </div>}
                <div style={{borderTop:"1px solid rgba(255,255,255,0.2)",paddingTop:10,marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.8)"}}>Total annuel</span>
                  <span style={{fontSize:26,fontWeight:800,color:"#fff"}}>{prixCalc.toLocaleString("fr")} €</span>
                </div>
                {prixCalc>0&&(()=>{
                  const {m1,m11,estRond}=calcMensualites(prixCalc);
                  return <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",textAlign:"right",marginTop:4}}>{estRond?`12 × ${m11} €/mois`:`1er mois: ${m1} € · puis 11 × ${m11} €`}</div>;
                })()}
              </div>
            </div>
          )}

          {/* NAVIGATION */}
          <div style={{display:"flex",flexDirection:"column",gap:8,paddingTop:4}}>
            {step<4?(
              <button className="fm-save-btn" style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)"}} onClick={()=>setStep(s=>s+1)}>
                Continuer — {STEPS[step]}
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ):(
              <button className="fm-save-btn" style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)"}} onClick={handleSave}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Enregistrer le client
              </button>
            )}
            {step>1&&<button className="fm-cancel-btn" onClick={()=>setStep(s=>s-1)}>← Retour</button>}
            {step===1&&<button className="fm-cancel-btn" onClick={onClose}>Annuler</button>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
