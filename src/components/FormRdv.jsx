// @ts-nocheck
import React, { useState } from "react";
import { uid, TODAY } from "../utils/helpers";
import { useFormDraft, DraftBanner, Avatar, Modal, FmField, FmSectionTitle, FmHeader } from "./ui";
import { toastWarn } from "../styles";

export function FormRdv({ initial, clients, onSave, onClose }) {
  const isEdit = !!initial?.id;
  const [f, setF] = useState(()=> initial || { id:uid(), clientId:"", date:TODAY, heure:"09:00", duree:"60", type:"Rendez-vous client", description:"", rappel:false });
  const set = (k,v) => setF(p=>({...p,[k]:v}));

  const { hasDraft, restoreDraft, discardDraft, clearDraft } = useFormDraft(
    `briblue_draft_rdv_${initial?.id||"new"}`, f, setF, null, null,
    () => !!(f.clientId || f.description?.trim() || (f.type && f.type !== "Rendez-vous client"))
  );

  const TYPES_RDV = [
    {v:"Rendez-vous client", ico:"🤝", color:"#0891b2"},
    {v:"Mise en route", ico:"▶️", color:"#16a34a"},
    {v:"Hivernage", ico:"❄️", color:"#0284c7"},
    {v:"Devis / Visite technique", ico:"📋", color:"#7c3aed"},
    {v:"Réparation / SAV", ico:"🔧", color:"#d97706"},
    {v:"Autre", ico:"📌", color:"#64748b"},
  ];
  const selectedType = TYPES_RDV.find(t=>t.v===f.type)||TYPES_RDV[0];
  const selectedClient = clients.find(c=>c.id===f.clientId);

  return (
    <Modal title="" onClose={onClose} noHeader>
      <div>
        <FmHeader title={isEdit?"Modifier le RDV":"Nouveau rendez-vous"} subtitle={f.type||"Planifier une intervention"} color="#7c3aed" onClose={onClose}/>
        {hasDraft&&!isEdit&&<div style={{margin:"10px 20px 0"}}><DraftBanner onRestore={restoreDraft} onDiscard={discardDraft}/></div>}

        <div style={{padding:"16px 20px 20px",display:"flex",flexDirection:"column",gap:14}}>

          {/* TYPE */}
          <div>
            <FmSectionTitle icon={<><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}>Type de rendez-vous</FmSectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {TYPES_RDV.map(({v,ico,color})=>{
                const sel=f.type===v;
                return (
                  <button key={v} onClick={()=>set("type",v)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${sel?color:"#e2e8f0"}`,background:sel?color+"12":"#fff",cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .15s"}}>
                    <span style={{fontSize:16,flexShrink:0}}>{ico}</span>
                    <span style={{fontSize:12,fontWeight:sel?700:400,color:sel?color:"#64748b",lineHeight:1.3}}>{v}</span>
                    {sel&&<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{marginLeft:"auto",flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DATE & HEURE */}
          <div>
            <FmSectionTitle icon={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}>Date & heure</FmSectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              <FmField label="Date *" style={{gridColumn:"span 1"}}><input type="date" value={f.date} onChange={e=>set("date",e.target.value)}/></FmField>
              <FmField label="Heure"><input type="time" value={f.heure} onChange={e=>set("heure",e.target.value)}/></FmField>
              <FmField label="Durée (min)"><input type="number" value={f.duree} onChange={e=>set("duree",e.target.value)} placeholder="60"/></FmField>
            </div>
          </div>

          {/* CLIENT */}
          <div>
            <FmSectionTitle icon={<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>}>Client (optionnel)</FmSectionTitle>
            <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:160,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
              <button className={`fm-client-row${f.clientId===""?" sel":""}`} onClick={()=>set("clientId","")} style={{justifyContent:"center",fontSize:13,color:f.clientId===""?"#0891b2":"#94a3b8",fontFamily:"inherit",fontWeight:f.clientId===""?600:400}}>— Aucun client —</button>
              {clients.map(c=>{
                const sel=f.clientId===c.id;
                return (
                  <button key={c.id} className={`fm-client-row${sel?" sel":""}`} onClick={()=>set("clientId",c.id)}>
                    <Avatar nom={c.nom} size={32}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:sel?700:500,color:sel?"#0891b2":"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</div>
                      <div style={{fontSize:11,color:"#94a3b8"}}>{c.adresse?.split(",").pop()?.trim()||c.formule}</div>
                    </div>
                    {sel&&<div style={{width:20,height:20,borderRadius:"50%",background:"#0891b2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <FmSectionTitle icon={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>}>Notes</FmSectionTitle>
            <FmField>
              <textarea value={f.description} onChange={e=>set("description",e.target.value)} placeholder="Détails, adresse, instructions particulières…" style={{minHeight:72,resize:"vertical"}}/>
            </FmField>
          </div>

          {/* Récap rapide */}
          {(f.date||selectedClient)&&(
            <div style={{background:"#f0f9ff",borderRadius:12,padding:"12px 14px",border:"1px solid #bae6fd",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:selectedType.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{selectedType.ico}</div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{f.type}</div>
                <div style={{fontSize:11,color:"#64748b",marginTop:1}}>
                  {f.date&&new Date(f.date).toLocaleDateString("fr",{weekday:"long",day:"2-digit",month:"long"})}{f.heure&&` · ${f.heure}`}{f.duree&&` · ${f.duree} min`}
                  {selectedClient&&<> · {selectedClient.nom}</>}
                </div>
              </div>
            </div>
          )}

          {/* SAVE */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button className="fm-save-btn" style={{background:`linear-gradient(135deg,${selectedType.color},${selectedType.color}cc)`}} onClick={()=>{ if(!f.date){ toastWarn("Date requise"); return; } clearDraft(); onSave({...f,id:isEdit?f.id:uid()}); }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              {isEdit?"Modifier le RDV":"Créer le rendez-vous"}
            </button>
            <button className="fm-cancel-btn" onClick={onClose}>Annuler</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
