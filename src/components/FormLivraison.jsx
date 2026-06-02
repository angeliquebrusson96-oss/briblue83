// @ts-nocheck
import React, { useState } from "react";
import { DS, Ico, PRODUITS_DEFAUT, STATUT_LIV } from "../utils/constants";
import { uid, TODAY } from "../utils/helpers";
import { useIsMobile, useFormDraft, DraftBanner, Avatar, Modal, FmField, FmSectionTitle, FmHeader, FmSteps } from "./ui";
import { toastWarn, toastSuccess, toastError, showConfirm } from "../styles";

export function genererHTMLLivraison(livraison, client) {
  const dateStr = new Date(livraison.date).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"});
  const produitsList = (livraison.produits||[]).length > 0
    ? (livraison.produits||[]).map(p=>`<li style="padding:4px 0;border-bottom:1px solid #f0f4f8;font-size:13px;color:#1e293b;">${p}</li>`).join("")
    : "<li style='color:#94a3b8;font-size:13px;'>Aucun produit listé</li>";
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Bon de livraison BRIBLUE</title>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#1e293b;}
  .wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(14,165,233,.1);overflow:hidden;}
  .header{background:linear-gradient(135deg,#0ea5e9,#0369a1);padding:28px 32px;color:#fff;}
  .header h1{margin:0 0 4px;font-size:22px;font-weight:900;}
  .header p{margin:0;opacity:.85;font-size:13px;}
  .body{padding:28px 32px;}
  .section{margin-bottom:22px;}
  .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#64748b;margin-bottom:10px;}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .info-box{background:#f8fafc;border-radius:10px;padding:12px 14px;border:1px solid #e2e8f0;}
  .info-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;}
  .info-value{font-size:13px;font-weight:700;color:#1e293b;}
  ul{margin:0;padding:0;list-style:none;}
  .montant{font-size:22px;font-weight:900;color:#0369a1;margin-top:4px;}
  .footer{background:#f0f9ff;padding:16px 32px;border-top:1px solid #e0f2fe;font-size:11px;color:#64748b;text-align:center;}
</style></head><body><div class="wrapper">
<div class="header"><h1>📦 Bon de livraison</h1><p>BRIBLUE — Entretien & Traitement de piscines</p></div>
<div class="body">
  <div class="section"><div class="section-title">Informations</div><div class="info-grid">
    <div class="info-box"><div class="info-label">Client</div><div class="info-value">${client?.nom||"—"}</div></div>
    <div class="info-box"><div class="info-label">Date</div><div class="info-value">${dateStr}</div></div>
    ${client?.adresse?`<div class="info-box" style="grid-column:1/-1"><div class="info-label">Adresse</div><div class="info-value">${client.adresse}</div></div>`:""}
  </div></div>
  <div class="section"><div class="section-title">Produits livrés</div><ul>${produitsList}</ul>
    ${livraison.description?`<div style="margin-top:10px;background:#f8fafc;border-radius:10px;padding:12px 14px;border:1px solid #e2e8f0;font-size:13px;color:#475569;">${livraison.description}</div>`:""}
  </div>
  ${livraison.montant?`<div class="section"><div class="section-title">Montant</div><div class="montant">${Number(livraison.montant).toLocaleString("fr")} €</div></div>`:""}
</div>
<div class="footer">Document généré le ${new Date().toLocaleDateString("fr")} · <strong>BRIBLUE</strong> · 06 67 18 61 15</div>
</div></body></html>`;
}

export async function envoyerEmailLivraison(livraison, client) {
  if (!client?.email) { toastWarn("Aucun email renseigné pour ce client."); return; }
  const dateStr = new Date(livraison.date).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"});
  const filename = `BonLivraison_BRIBLUE_${client?.nom?.replace(/\s/g,"_")||"client"}_${livraison.date}.html`;
  const html = genererHTMLLivraison(livraison, client);
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(html)));
  const corps = `Bonjour ${client?.nom||""},\n\nVotre bon de livraison du ${dateStr} est disponible.\n\nCordialement,\nDorian Briaire\nTechnicien de Piscine - BRI BLUE`;
  try {
    const res = await fetch("/api/send-email", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ from:`BRIBLUE <rapport-piscine@briblue83.com>`, to:[client.email], subject:`Bon de livraison BRIBLUE — ${dateStr}`, text:corps, attachments:[{filename,content:b64}] }) });
    const data = await res.json();
    if (res.ok) toastSuccess(`Email envoyé à ${client.email} !`);
    else toastError(`Erreur envoi : ${data?.message||JSON.stringify(data)}`);
  } catch(err) { toastError(`Erreur réseau : ${err.message}`); }
}

export function FormLivraison({ initial, clientId, clients=[], produitsStock=[], onSave, onClose }) {
  const isEdit = !!initial?.id;
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [clientSearch, setClientSearch] = useState("");
  const [f, setF] = useState(()=>initial || { id:uid(), clientId:clientId||"", date:TODAY, produits:[], description:"", montant:"", statut:"aFacturer", photos:[] });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const PLIV = produitsStock.length > 0 ? produitsStock : PRODUITS_DEFAUT;
  const toggleProduit = (p) => { const arr = f.produits.includes(p) ? f.produits.filter(x=>x!==p) : [...f.produits,p]; set("produits",arr); };
  const selectedClient = clients.find(c=>c.id===f.clientId);

  const { hasDraft, restoreDraft, discardDraft, clearDraft } = useFormDraft(
    `briblue_draft_livraison_${initial?.id||"new"}`, f, setF, step, setStep,
    () => !!(f.produits?.length || f.description?.trim() || f.montant)
  );

  const compressPhoto = (file) => new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); const r = new FileReader(); r.onload=()=>resolve(r.result); r.readAsDataURL(file); };
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1024; let {width, height} = img;
      if (width > MAX || height > MAX) { if(width>=height){height=Math.round(height*MAX/width);width=MAX;}else{width=Math.round(width*MAX/height);height=MAX;} }
      const c = document.createElement("canvas"); c.width=width; c.height=height;
      c.getContext("2d").drawImage(img,0,0,width,height);
      try { resolve(c.toDataURL("image/jpeg",0.72)); } catch { const r=new FileReader(); r.onload=()=>resolve(r.result); r.readAsDataURL(file); }
    };
    img.src = url;
  });

  const addPhotos = async (e) => {
    const files = Array.from(e.target.files||[]).slice(0, 10-(f.photos||[]).length);
    e.target.value = "";
    if(!files.length) return;
    const compressed = await Promise.all(files.map(compressPhoto));
    set("photos", [...(f.photos||[]), ...compressed].slice(0, 10));
  };

  const STEPS = ["Client", "Produits", "Résumé"];

  return (
    <Modal title="" onClose={onClose} wide noHeader>
      <div>
        <FmHeader title={isEdit?"Modifier la livraison":"Nouvelle livraison"} subtitle="Produits & détails" color="#059669" onClose={onClose}/>
        <FmSteps steps={STEPS} current={step} color="#059669"/>
        {hasDraft&&!isEdit&&<div style={{margin:"10px 20px 0"}}><DraftBanner onRestore={restoreDraft} onDiscard={discardDraft}/></div>}

        <div style={{padding:"16px 20px 20px",display:"flex",flexDirection:"column",gap:14}}>

          {/* ÉTAPE 1 — CLIENT & DATE */}
          {step===1&&(
            <div className="fm-in" style={{display:"flex",flexDirection:"column",gap:12}}>
              {clients.length>1&&(
                <>
                  <FmSectionTitle icon={<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>}>Client *</FmSectionTitle>
                  {/* Barre de recherche avec dropdown */}
                  <div style={{position:"relative"}}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",zIndex:1}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="search" value={clientSearch} onChange={e=>setClientSearch(e.target.value)}
                      placeholder={selectedClient?selectedClient.nom:"Rechercher un client…"}
                      style={{width:"100%",padding:"12px 36px 12px 36px",borderRadius:12,border:`1.5px solid ${clientSearch?"#0891b2":"#e2e8f0"}`,fontSize:15,fontFamily:"inherit",color:"#0f172a",boxSizing:"border-box",outline:"none",background:"#fff",transition:"all .2s"}}/>
                    {clientSearch
                      ? <button onClick={()=>setClientSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(148,163,184,.15)",border:"none",cursor:"pointer",padding:"3px 7px",borderRadius:7,color:"#64748b",fontSize:12,fontWeight:700}}>✕</button>
                      : selectedClient && <div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",width:20,height:20,borderRadius:10,background:"#059669",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                    }
                    {clientSearch.length>0&&(
                      <div style={{position:"absolute",top:"calc(100% + 5px)",left:0,right:0,zIndex:100,background:"rgba(255,255,255,0.97)",borderRadius:12,border:"1.5px solid #0891b244",boxShadow:"0 8px 28px rgba(8,145,178,0.15)",maxHeight:220,overflowY:"auto"}}>
                        {clients.filter(c=>c.nom.toLowerCase().includes(clientSearch.toLowerCase())).length===0
                          ? <div style={{padding:16,textAlign:"center",color:"#94a3b8",fontSize:13}}>Aucun client trouvé</div>
                          : clients.filter(c=>c.nom.toLowerCase().includes(clientSearch.toLowerCase())).map(c=>{
                              const sel=f.clientId===c.id;
                              return (
                                <button key={c.id} onMouseDown={e=>e.preventDefault()} onClick={()=>{set("clientId",c.id);setClientSearch("");}}
                                  style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",border:"none",borderBottom:"1px solid #f1f5f9",background:sel?"#e0f2fe":"transparent",cursor:"pointer",textAlign:"left",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>
                                  <Avatar nom={c.nom} size={32}/>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontWeight:sel?700:500,fontSize:13,color:sel?"#0891b2":"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</div>
                                    <div style={{fontSize:11,color:"#94a3b8"}}>{c.formule}</div>
                                  </div>
                                  {sel&&<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                </button>
                              );
                          })
                        }
                      </div>
                    )}
                  </div>
                </>
              )}
              <FmSectionTitle icon={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}>Date & Montant</FmSectionTitle>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <FmField label="Date *"><input type="date" value={f.date} onChange={e=>set("date",e.target.value)}/></FmField>
                <FmField label="Montant (€)"><input type="number" value={f.montant} onChange={e=>set("montant",e.target.value)} placeholder="0.00"/></FmField>
              </div>
              <FmSectionTitle>Statut</FmSectionTitle>
              <div style={{display:"flex",gap:6}}>
                {Object.entries(STATUT_LIV).map(([k,s])=>(
                  <button key={k} onClick={()=>set("statut",k)} style={{flex:1,padding:"10px 4px",borderRadius:10,border:`1.5px solid ${f.statut===k?s.color:"#e2e8f0"}`,background:f.statut===k?s.bg:"#fff",cursor:"pointer",fontSize:12,fontWeight:f.statut===k?700:400,color:f.statut===k?s.color:"#94a3b8",fontFamily:"inherit",transition:"all .15s"}}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 2 — PRODUITS */}
          {step===2&&(
            <div className="fm-in" style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <FmSectionTitle>{f.produits.length} sélectionné{f.produits.length!==1?"s":""}</FmSectionTitle>
                {f.produits.length>0&&<button onClick={()=>set("produits",[])} style={{fontSize:11,color:"#ef4444",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Effacer</button>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:6}}>
                {PLIV.map(p=>{
                  const sel=f.produits.includes(p);
                  return (
                    <button key={p} onClick={()=>toggleProduit(p)} style={{display:"flex",alignItems:"center",gap:7,padding:"10px 10px",borderRadius:10,cursor:"pointer",background:sel?"#f0fdf4":"#fff",border:`1.5px solid ${sel?"#22c55e":"#e2e8f0"}`,fontFamily:"inherit",textAlign:"left",transition:"all .15s"}}>
                      <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${sel?"#22c55e":"#e2e8f0"}`,background:sel?"#22c55e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {sel&&<svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span style={{fontSize:12,fontWeight:sel?600:400,color:sel?"#065f46":"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p}</span>
                    </button>
                  );
                })}
              </div>
              <FmField label="Notes / Quantités">
                <textarea value={f.description} onChange={e=>set("description",e.target.value)} placeholder="Ex : 2 sacs chlore lent, 1 bidon pH+..." style={{minHeight:60,resize:"vertical"}}/>
              </FmField>
              {/* Photos */}
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <FmSectionTitle icon={<><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>}>Photos {(f.photos||[]).length>0&&`(${(f.photos||[]).length}/10)`}</FmSectionTitle>
                  {(f.photos||[]).length<10&&<label style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,background:"#f0f9ff",border:"1px solid #bae6fd",cursor:"pointer",fontSize:11,fontWeight:600,color:"#0891b2"}}>{Ico.plus(10,"#0891b2")} Ajouter<input type="file" accept="image/*" multiple style={{display:"none"}} onChange={addPhotos}/></label>}
                </div>
                {(f.photos||[]).length===0
                  ? <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:14,borderRadius:12,border:"2px dashed #e2e8f0",background:"#f8fafc",cursor:"pointer"}}>{Ico.camera(22,"#94a3b8")}<span style={{fontSize:12,color:"#94a3b8"}}>Ajouter des photos</span><input type="file" accept="image/*" multiple style={{display:"none"}} onChange={addPhotos}/></label>
                  : <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>{(f.photos||[]).map((ph,i)=>(<div key={i} style={{position:"relative",borderRadius:8,overflow:"hidden"}}><img src={ph} alt="" style={{width:"100%",height:70,objectFit:"cover",display:"block"}}/><button onClick={()=>set("photos",(f.photos||[]).filter((_,j)=>j!==i))} style={{position:"absolute",top:3,right:3,width:20,height:20,borderRadius:10,background:"rgba(0,0,0,0.6)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.close(8,"#fff")}</button></div>))}</div>
                }
              </div>
            </div>
          )}

          {/* ÉTAPE 3 — RÉSUMÉ */}
          {step===3&&(
            <div className="fm-in" style={{display:"flex",flexDirection:"column",gap:12}}>
              <FmSectionTitle>Récapitulatif</FmSectionTitle>
              <div style={{background:"#f8fafc",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                {[["Client",selectedClient?.nom||"—"],["Date",f.date?new Date(f.date).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"}):"—"],["Produits",f.produits.length+" article"+(f.produits.length!==1?"s":"")],f.montant?["Montant",f.montant+" €"]:null,["Statut",STATUT_LIV[f.statut]?.label||"—"]].filter(Boolean).map(([l,v],i,a)=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",borderBottom:i<a.length-1?"1px solid #f1f5f9":"none",fontSize:13}}>
                    <span style={{color:"#64748b"}}>{l}</span>
                    <span style={{fontWeight:600,color:"#0f172a"}}>{v}</span>
                  </div>
                ))}
              </div>
              {selectedClient?.email&&(
                <button onClick={()=>showConfirm(`Envoyer le bon de livraison à ${selectedClient.email} ?`,()=>envoyerEmailLivraison({...f,id:isEdit?f.id:uid()},selectedClient))} style={{padding:"12px",borderRadius:12,background:"#f0f9ff",border:"1px solid #bae6fd",cursor:"pointer",fontWeight:600,fontSize:13,color:"#0891b2",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {Ico.send(13,"#0891b2")} Envoyer par email à {selectedClient.email}
                </button>
              )}
            </div>
          )}

          {/* NAVIGATION */}
          <div style={{display:"flex",flexDirection:"column",gap:8,paddingTop:4}}>
            {step<3?(
              <button className="fm-save-btn" style={{background:"linear-gradient(135deg,#059669,#047857)"}} onClick={()=>{ if(step===1&&!f.clientId&&clients.length>1){ toastWarn("Client requis"); return; } setStep(s=>s+1); }}>
                Continuer — {STEPS[step]}
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ):(
              <button className="fm-save-btn" style={{background:"linear-gradient(135deg,#059669,#047857)"}} onClick={()=>{ if(!f.clientId&&clients.length>1){ toastWarn("Client requis"); return; } if(!f.date){ toastWarn("Date requise"); return; } clearDraft(); onSave({...f,id:isEdit?f.id:uid()}); }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Enregistrer la livraison
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
