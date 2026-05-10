// @ts-nocheck
import React, { useState, useMemo } from "react";
import { DS, Ico, RAPPORT_STATUS } from "../utils/constants";
import { alerteClient, daysUntil, isEntretienType, isControleType, totalAnnuel, getRapportStatus, YEAR_NOW, calculerPassagesPrevusContrat, isPassageDansContrat, isPassageEffectue } from "../utils/helpers";
import { useIsMobile, Avatar, Modal, Tag, BtnPrimary, PhotoImg } from "../components/ui";

// ─── Alert color map (mirrors App.jsx AC) ────────────────────────────────────
const AC = {
  rouge:  { bg:"#fee2e2", bd:"#fda4af", tx:"#dc2626", lbl:"URGENT"    },
  jaune:  { bg:"#fef9c3", bd:"#fcd34d", tx:"#ca8a04", lbl:"Attention" },
  orange: { bg:"#ffedd5", bd:"#fcd34d", tx:"#ea580c", lbl:"Retard"    },
  aFaire: { bg:"#eff6ff", bd:"#bfdbfe", tx:"#2563eb", lbl:"À faire"   },
  ok:     { bg:"#f0fdf4", bd:"#bbf7d0", tx:"#16a34a", lbl:"OK"        },
};

// ─── Component to render block icons ────────────────────────────────────────
const BlockIcon = ({name, size=14, color="currentColor"}) => {
  const s = {width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:color,strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"};
  switch(name) {
    case "wrench":    return <svg {...s}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
    case "water":     return <svg {...s}><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>;
    case "pool":      return <svg {...s}><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 14c2.5 2.5 5 2.5 7.5 0s5-2.5 7.5 0 5 2.5 7.5 0"/></svg>;
    case "flask":     return <svg {...s}><path d="M9 3h6v5l3 9a3 3 0 01-3 3H9a3 3 0 01-3-3l3-9V3z"/><path d="M9 3h6"/><path d="M6.5 15h11"/></svg>;
    case "check":     return <svg {...s}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
    case "camera":    return <svg {...s}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
    case "pen":       return <svg {...s}><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>;
    default: return null;
  }
};

const Block = ({title, iconName, color=DS.blue, children}) => (
  <div style={{borderRadius:16,overflow:"hidden",border:"1px solid rgba(255,255,255,0.5)",marginBottom:12,background:"rgba(255,255,255,0.45)",backdropFilter:"blur(16px) saturate(180%)",WebkitBackdropFilter:"blur(16px) saturate(180%)"}}>
    <div style={{background:`linear-gradient(135deg, ${color}18, ${color}08)`,borderBottom:"1px solid "+color+"22",padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:24,height:24,borderRadius:8,background:color+"22",display:"flex",alignItems:"center",justifyContent:"center",color}}>
        <BlockIcon name={iconName} size={13} color={color}/>
      </div>
      <span style={{fontSize:12,fontWeight:800,color,textTransform:"uppercase",letterSpacing:.7}}>{title}</span>
    </div>
    <div style={{padding:"12px 14px"}}>{children}</div>
  </div>
);


// MODAL APERÇU PASSAGE (used internally by PagePassages too)
// ─────────────────────────────────────────────────────────────────────────────
const Row = ({label, value, color}) => {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"6px 0",borderBottom:"1px solid "+DS.light,gap:12}}>
      <span style={{fontSize:13,color:DS.mid,fontWeight:500,flexShrink:0}}>{label}</span>
      <span style={{fontSize:13,fontWeight:600,color:color||DS.dark,textAlign:"right",wordBreak:"break-word",whiteSpace:"pre-wrap",lineHeight:1.5}}>{value}</span>
    </div>
  );
};

export function PassageDetailModal({ passage, client, onClose }) {
  const isMobile = useIsMobile();
  if (!passage) return null;

  const val = (v, u="") => (v!==""&&v!==null&&v!==undefined) ? `${v}${u?" "+u:""}` : "—";
  const ouiNon = (v) => v===true ? "Oui" : v===false ? "Non" : "—";
  const liste = (arr) => Array.isArray(arr)&&arr.length ? arr.join(", ") : (arr||"—");
  const etoiles = (n) => n>0 ? "★".repeat(n)+"☆".repeat(5-n)+" "+n+"/5" : "—";

  const isControleType_ = (type) => {
    const t = (type||"").toLowerCase();
    return t.includes("contrôle") || t.includes("controle");
  };

  const photos = [
    passage.photoArrivee ? {src:passage.photoArrivee, label:"Arrivée"} : null,
    ...((passage.photos||[]).filter(Boolean).map((src,i)=>({src, label:`Arrivée ${i+2}`}))),
    passage.photoDepart ? {src:passage.photoDepart, label:"Départ"} : null,
    ...((passage.photosDepart||[]).filter(Boolean).map((src,i)=>({src, label:`Départ ${i+2}`}))),
  ].filter(Boolean);

  const rapportStatus = getRapportStatus(passage);
  const rapportMeta = RAPPORT_STATUS[rapportStatus] || RAPPORT_STATUS.cree;
  const isCtrl = isControleType_(passage.type);

  return (
    <Modal title="Aperçu du passage" onClose={onClose} wide>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0e7490,#06b6d4)",borderRadius:DS.radiusSm,padding:"14px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:12,background:isCtrl?"rgba(6,182,212,0.25)":"rgba(14,165,233,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {isCtrl ? Ico.drop(22,"#67e8f9") : Ico.wrench(22,"#7dd3fc")}
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:900,fontSize:16,color:"#fff",letterSpacing:-0.3}}>{client?.nom||passage.clientId}</div>
          <div style={{display:"flex",gap:8,marginTop:5,flexWrap:"wrap"}}>
            <span style={{background:"rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.9)",fontSize:12,fontWeight:600,padding:"2px 10px",borderRadius:20}}>{new Date(passage.date).toLocaleDateString("fr",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</span>
            <span style={{background:rapportMeta.bg,color:rapportMeta.color,fontSize:12,fontWeight:700,padding:"2px 10px",borderRadius:20}}>{rapportMeta.label}</span>
          </div>
        </div>
      </div>

      {/* Intervention */}
      <Block title="Intervention" iconName="wrench" color={DS.blue}>
        <Row label="Type" value={passage.type||"—"}/>
        <Row label="Technicien" value={passage.tech||"—"}/>
        {passage.actions&&<Row label="Actions" value={passage.actions}/>}
        {passage.obs&&<Row label="Observations" value={passage.obs} color={DS.orange}/>}
      </Block>

      {/* Analyses */}
      {(passage.chloreLibre||passage.ph||passage.alcalinite||passage.stabilisant||passage.tChlore||passage.tPH||passage.tSel||passage.tPhosphate||passage.tStabilisant) && (
        <Block title="Analyses eau" iconName="water" color={DS.teal}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:0}}>
            {passage.tChlore!==""&&passage.tChlore!==null&&passage.tChlore!==undefined&&<Row label="Chlore (appareil)" value={val(passage.tChlore,"ppm")} color={+passage.tChlore>=0.5&&+passage.tChlore<=3?DS.green:DS.red}/>}
            {passage.tPH!==""&&passage.tPH!==null&&passage.tPH!==undefined&&<Row label="pH (appareil)" value={val(passage.tPH)} color={+passage.tPH>=7.0&&+passage.tPH<=7.6?DS.green:DS.red}/>}
            {passage.tSel!==""&&passage.tSel!==null&&passage.tSel!==undefined&&<Row label="Sel" value={val(passage.tSel,"g/L")}/>}
            {passage.tPhosphate!==""&&passage.tPhosphate!==null&&passage.tPhosphate!==undefined&&<Row label="Phosphate" value={val(passage.tPhosphate,"ppm")}/>}
            {passage.tStabilisant!==""&&passage.tStabilisant!==null&&passage.tStabilisant!==undefined&&<Row label="Stabilisant" value={val(passage.tStabilisant,"ppm")}/>}
            {passage.chloreLibre!==""&&passage.chloreLibre!==null&&passage.chloreLibre!==undefined&&<Row label="Chlore libre" value={val(passage.chloreLibre,"ppm")}/>}
            {passage.ph!==""&&passage.ph!==null&&passage.ph!==undefined&&<Row label="pH bandelette" value={val(passage.ph)}/>}
            {passage.alcalinite!==""&&passage.alcalinite!==null&&passage.alcalinite!==undefined&&<Row label="Alcalinité" value={val(passage.alcalinite,"ppm")}/>}
            {passage.stabilisant!==""&&passage.stabilisant!==null&&passage.stabilisant!==undefined&&<Row label="Stabilisant (band.)" value={val(passage.stabilisant,"ppm")}/>}
          </div>
          {passage.stabilisantHaut&&<div style={{marginTop:8,background:DS.orangeSoft,borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:700,color:DS.orange}}>⚠️ Stabilisant HAUT signalé</div>}
        </Block>
      )}

      {/* État bassin */}
      {(passage.qualiteEau||(passage.etatFond||[]).length||(passage.etatParois||[]).length) && (
        <Block title="État bassin" iconName="pool" color={DS.green}>
          {passage.qualiteEau&&<Row label="Qualité eau" value={passage.qualiteEau}/>}
          {(passage.etatFond||[]).length>0&&<Row label="Fond" value={liste(passage.etatFond)}/>}
          {(passage.etatParois||[]).length>0&&<Row label="Parois" value={liste(passage.etatParois)}/>}
          {(passage.etatLocal||[]).length>0&&<Row label="Local" value={liste(passage.etatLocal)}/>}
        </Block>
      )}

      {/* Correctifs */}
      {(passage.corrChlore||passage.corrPH||passage.corrSel||passage.corrAlgicide||passage.corrAlcafix||passage.corrAutre) && (
        <Block title="Correctifs apportés" iconName="flask" color={DS.purple}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:0}}>
            {passage.corrChlore&&<Row label="Chlore" value={passage.corrChlore}/>}
            {passage.corrPH&&<Row label="pH" value={passage.corrPH}/>}
            {passage.corrSel&&<Row label="Sel" value={passage.corrSel}/>}
            {passage.corrAlgicide&&<Row label="Algicide" value={passage.corrAlgicide}/>}
            {passage.corrPeroxyde&&<Row label="Peroxyde" value={passage.corrPeroxyde}/>}
            {passage.corrChloreChoc&&<Row label="Chlore choc" value={passage.corrChloreChoc}/>}
            {passage.corrPhosphate&&<Row label="Phosphate" value={passage.corrPhosphate}/>}
            {passage.corrAlcafix&&<Row label="Alcafix" value={passage.corrAlcafix}/>}
            {passage.corrAutre&&<Row label="Autre" value={passage.corrAutre}/>}
          </div>
        </Block>
      )}

      {/* Clôture */}
      <Block title="Clôture" iconName="check" color={DS.orange}>
        <Row label="Devis à faire" value={ouiNon(passage.devis)}/>
        <Row label="Prise d'échantillon" value={ouiNon(passage.priseEchantillon)}/>
        <Row label="Présence client" value={ouiNon(passage.presenceClient)}/>
        <Row label="Ressenti" value={etoiles(passage.ressenti)}/>
        {passage.livraisonProduits&&<Row label="Livraison produits" value={ouiNon(passage.livraisonProduits)}/>}
        {(passage.produitsLivres||[]).length>0&&<Row label="Produits livrés" value={liste(passage.produitsLivres)}/>}
        {passage.commentaires&&<div style={{marginTop:8,padding:"10px 12px",background:DS.light,borderRadius:8,fontSize:13,color:DS.dark,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{passage.commentaires}</div>}
      </Block>

      {/* Photos */}
      {photos.length>0&&(
        <Block title={`Photos (${photos.length})`} iconName="camera" color={DS.mid}>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:8}}>
            {photos.map((ph,i)=>(
              <div key={i} style={{position:"relative",borderRadius:10,overflow:"hidden",border:"1px solid "+DS.border}}>
                <PhotoImg src={ph.src} alt={ph.label} style={{width:"100%",height:isMobile?90:110,objectFit:"cover",display:"block"}}/>
                <span style={{position:"absolute",bottom:4,left:5,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.6)",borderRadius:4,padding:"1px 6px"}}>{ph.label}</span>
              </div>
            ))}
          </div>
        </Block>
      )}

      {/* Signatures */}
      {(passage.signatureTech||passage.signatureClient)&&(
        <Block title="Signatures" iconName="pen" color={DS.mid}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
            {passage.signatureTech&&<div><div style={{fontSize:10,fontWeight:700,color:DS.mid,marginBottom:6}}>TECHNICIEN</div><PhotoImg src={passage.signatureTech} style={{width:"100%",maxHeight:60,objectFit:"contain",borderRadius:8,border:"1px solid "+DS.border,background:"#fafafa"}}/></div>}
            {passage.signatureClient&&<div><div style={{fontSize:10,fontWeight:700,color:DS.mid,marginBottom:6}}>CLIENT</div><PhotoImg src={passage.signatureClient} style={{width:"100%",maxHeight:60,objectFit:"contain",borderRadius:8,border:"1px solid "+DS.border,background:"#fafafa"}}/></div>}
          </div>
        </Block>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE CLIENTS
// ─────────────────────────────────────────────────────────────────────────────

export function PageClients({ clients, passages, contrats={}, onUpdateContrat, onClientClick, onAdd }) {
  const [search, setSearch] = useState("");
  const [openPicker, setOpenPicker] = useState(null); // clientId du picker ouvert
  const [filterStat, setFilterStat] = useState("all"); // all | contrat | alertes | expires
  const isMobile = useIsMobile();

  const filtered = useMemo(()=>{
    let list = clients.filter(c=>c.nom.toLowerCase().includes(search.toLowerCase())||c.adresse?.toLowerCase().includes(search.toLowerCase()));
    if (filterStat === "contrat") list = list.filter(c=>{ const j=daysUntil(c.dateFin); return j!==null && j>=0; });
    if (filterStat === "alertes") list = list.filter(c=>alerteClient(c,passages)!=="ok");
    if (filterStat === "expires") list = list.filter(c=>{ const j=daysUntil(c.dateFin); return j!==null && j<30; });
    return list;
  },[clients,search,filterStat,passages]);
  const alertCount = clients.filter(c=>alerteClient(c,passages)!=="ok").length;

  const CONTRAT_STATUTS = [
    { key:"aucun",          label:"Aucun contrat",       color:"#9ca3af", bg:"#f9fafb", border:"#e5e7eb" },
    { key:"cree",           label:"📄 Contrat créé",     color:"#0891b2", bg:"#e0f2fe", border:"#7dd3fc" },
    { key:"demande_envoyee",label:"Contrat envoyé",      color:"#0891b2", bg:"#f0f9ff", border:"#bae6fd" },
    { key:"signe_client",   label:"En attente co-sign.", color:"#4f46e5", bg:"#eef2ff", border:"#a5b4fc" },
    { key:"signe_complet",  label:"Contrat signé",       color:"#059669", bg:"#f0fdf4", border:"#86efac" },
    { key:"renouveler",     label:"À renouveler",        color:"#b45309", bg:"#fef3c7", border:"#fcd34d" },
    { key:"suspendu",       label:"⏸ Suspendu",          color:"#dc2626", bg:"#fff1f2", border:"#fda4af" },
  ];

  const getContrat = (clientId) =>
    contrats["CT-"+clientId]
    || Object.values(contrats).find(c=>c.clientId===clientId)
    || null;

  const getStatutMeta = (clientId) => {
    const ct = getContrat(clientId);
    const key = ct?.statut || "aucun";
    return CONTRAT_STATUTS.find(s=>s.key===key) || CONTRAT_STATUTS[0];
  };

  const setStatut = (clientId, key) => {
    const contractId = "CT-"+clientId;
    if (onUpdateContrat) onUpdateContrat(contractId, { clientId, statut: key === "prepare" ? "cree" : key });
    setOpenPicker(null);
  };

  // Calcul des statistiques
  const statsClients = useMemo(()=>{
    const sousContrat = clients.filter(c=>{
      const j = daysUntil(c.dateFin);
      return j !== null && j >= 0;
    }).length;
    const expires = clients.filter(c=>{
      const j = daysUntil(c.dateFin);
      return j !== null && j < 30;
    }).length;
    return { total: clients.length, sousContrat, alertes: alertCount, expires };
  }, [clients, alertCount]);

  return (
    <div>
      {/* ═══ STATS HEADER — design soleil moderne ═══ */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {/* Total clients */}
        <div onClick={()=>setFilterStat("all")} style={{cursor:"pointer",transform:filterStat==="all"?"scale(1.04)":"scale(1)",transition:"transform .2s",background:"linear-gradient(135deg,#0c1f3f 0%,#0369a1 100%)",borderRadius:18,padding:"14px 16px",position:"relative",overflow:"hidden",boxShadow:"0 8px 24px rgba(12,31,63,0.25)"}}>
          <div style={{position:"absolute",top:-15,right:-15,width:80,height:80,borderRadius:"50%",background:"rgba(56,189,248,0.15)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:10,position:"relative"}}>
            <div style={{width:42,height:42,borderRadius:12,background:"rgba(56,189,248,0.25)",border:"1.5px solid rgba(56,189,248,0.4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {Ico.clients(18,"#7dd3fc")}
            </div>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:"#fff",lineHeight:1}}>{statsClients.total}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>Clients</div>
            </div>
          </div>
        </div>

        {/* Sous contrat */}
        <div onClick={()=>setFilterStat(filterStat==="contrat"?"all":"contrat")} style={{cursor:"pointer",transform:filterStat==="contrat"?"scale(1.04)":"scale(1)",transition:"transform .2s",background:"linear-gradient(135deg,#059669,#10b981)",borderRadius:18,padding:"14px 16px",position:"relative",overflow:"hidden",boxShadow:"0 8px 24px rgba(5,150,105,0.25)"}}>
          <div style={{position:"absolute",top:-15,right:-15,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.12)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:10,position:"relative"}}>
            <div style={{width:42,height:42,borderRadius:12,background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {Ico.contract(18,"#fff")}
            </div>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:"#fff",lineHeight:1}}>{statsClients.sousContrat}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.85)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>Sous contrat</div>
            </div>
          </div>
        </div>

        {/* Alertes */}
        <div onClick={()=>setFilterStat(filterStat==="alertes"?"all":"alertes")} style={{cursor:"pointer",transform:filterStat==="alertes"?"scale(1.04)":"scale(1)",transition:"transform .2s",background:statsClients.alertes>0?"linear-gradient(135deg,#dc2626,#ef4444)":"linear-gradient(135deg,#94a3b8,#64748b)",borderRadius:18,padding:"14px 16px",position:"relative",overflow:"hidden",boxShadow:`0 8px 24px ${statsClients.alertes>0?"rgba(220,38,38,0.25)":"rgba(100,116,139,0.18)"}`}}>
          <div style={{position:"absolute",top:-15,right:-15,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.12)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:10,position:"relative"}}>
            <div style={{width:42,height:42,borderRadius:12,background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {Ico.alert(18,"#fff")}
            </div>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:"#fff",lineHeight:1}}>{statsClients.alertes}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.85)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>{statsClients.alertes>1?"Alertes":"Alerte"}</div>
            </div>
          </div>
        </div>

        {/* Expirent < 30j */}
        <div onClick={()=>setFilterStat(filterStat==="expires"?"all":"expires")} style={{cursor:"pointer",transform:filterStat==="expires"?"scale(1.04)":"scale(1)",transition:"transform .2s",background:statsClients.expires>0?"linear-gradient(135deg,#d97706,#f59e0b)":"linear-gradient(135deg,#94a3b8,#64748b)",borderRadius:18,padding:"14px 16px",position:"relative",overflow:"hidden",boxShadow:`0 8px 24px ${statsClients.expires>0?"rgba(217,119,6,0.25)":"rgba(100,116,139,0.18)"}`}}>
          <div style={{position:"absolute",top:-15,right:-15,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.12)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:10,position:"relative"}}>
            <div style={{width:42,height:42,borderRadius:12,background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {Ico.clock(18,"#fff")}
            </div>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:"#fff",lineHeight:1}}>{statsClients.expires}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.85)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>Bientôt fin</div>
            </div>
          </div>
        </div>
      </div>
      {/* Badge filtre actif */}
      {filterStat !== "all" && (
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"8px 12px",borderRadius:12,background:"linear-gradient(135deg, rgba(8,145,178,0.1), rgba(8,145,178,0.05))",border:"1px solid rgba(8,145,178,0.2)"}}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.4" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          <span style={{fontSize:12,fontWeight:700,color:"#0891b2",flex:1}}>
            Filtre actif : {filterStat === "contrat" ? "Sous contrat" : filterStat === "alertes" ? "Avec alertes" : "Bientôt fin"} — {filtered.length} client{filtered.length>1?"s":""}
          </span>
          <button onClick={()=>setFilterStat("all")} style={{padding:"4px 10px",borderRadius:8,background:"rgba(255,255,255,0.7)",border:"1px solid rgba(8,145,178,0.25)",cursor:"pointer",fontSize:11,fontWeight:700,color:"#0891b2",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Effacer
          </button>
        </div>
      )}

      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <div style={{flex:1,position:"relative"}}>
          <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>{Ico.search(16,"#94a3b8")}</div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
            style={{width:"100%",padding:"11px 14px 11px 40px",borderRadius:DS.radius,border:"none",fontSize:13,outline:"none",boxSizing:"border-box",background:"rgba(255,255,255,0.45)",boxShadow:"inset 3px 3px 6px rgba(6,182,212,0.15), inset -2px -2px 5px rgba(255,255,255,0.8)",color:DS.dark,fontFamily:"inherit"}}/>
        </div>
        <BtnPrimary onClick={onAdd} bg={DS.blueGrad} icon={Ico.userPlus(14,"#fff")} style={{flexShrink:0,padding:"10px 16px",fontSize:13,borderRadius:14,boxShadow:"4px 4px 12px rgba(8,145,178,0.3)"}}>
          {!isMobile && "Nouveau"}
        </BtnPrimary>
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",color:DS.mid,padding:40,fontSize:13}}>Aucun client trouvé</div>}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10}}>
        {filtered.map((c,idx)=>{
          const al=alerteClient(c,passages); const col=AC[al];
          const mpm=c.moisParMois||c.saisons||{};
          const tE=totalAnnuel(mpm,"entretien"), tC=totalAnnuel(mpm,"controle");
          const tot=calculerPassagesPrevusContrat(c);
          const passEff=passages.filter(p=>p.clientId===c.id&&isPassageDansContrat(p,c)&&isPassageEffectue(p));
          const eE=passEff.filter(p=>isEntretienType(p.type)).length;
          const eC=passEff.filter(p=>isControleType(p.type)).length;
          const eff=eE+eC;
          const pct=tot>0?Math.round(eff/tot*100):0;
          const rest=Math.max(0,tot-eff);
          const accentColor=al==="rouge"?DS.red:al==="jaune"?"#d97706":al==="orange"?"#d97706":DS.green;
          return (
            <div key={c.id} onClick={()=>onClientClick(c)} className="fade-in card-hover"
              style={{animationDelay:`${idx*0.03}s`,background:"rgba(255,255,255,0.45)",borderRadius:DS.radius,
                overflow:openPicker===c.id?"visible":"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                border:"1px solid "+DS.border,borderTop:"2px solid "+accentColor,
                cursor:"pointer",display:"flex",flexDirection:"column",position:"relative",zIndex:openPicker===c.id?999:1}}>
              {c.photoPiscine&&(
                <div style={{height:72,position:"relative",flexShrink:0,overflow:"hidden"}}>
                  <img src={c.photoPiscine} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.35))"}}/>
                </div>
              )}
              <div style={{padding:"12px",flex:1,display:"flex",flexDirection:"column",gap:7}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                  <Avatar nom={c.nom} size={34}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:DS.dark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</div>
                    <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                      <span style={{background:"rgba(255,255,255,0.4)",color:DS.mid,padding:"1px 7px",borderRadius:20,fontWeight:600,fontSize:10,border:"1px solid "+DS.border}}>{c.formule}</span>
                      {c.bassin&&<span style={{background:DS.light,color:DS.mid,padding:"1px 6px",borderRadius:20,fontWeight:500,fontSize:10}}>{c.bassin}</span>}
                    </div>
                  </div>
                  <Tag color={col.tx} bg={col.bg} style={{fontSize:9,fontWeight:700,flexShrink:0,padding:"2px 6px"}}>{col.lbl}</Tag>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:3}}>
                  <div style={{textAlign:"center",padding:"4px 2px",borderRadius:6,background:"rgba(255,255,255,0.45)",border:"1px solid "+DS.border}}>
                    <div style={{fontSize:13,fontWeight:800,color:DS.blue}}>{eE}<span style={{fontSize:9,color:DS.mid}}>/{tE}</span></div>
                    <div style={{fontSize:9,color:DS.mid}}>Entret.</div>
                  </div>
                  <div style={{textAlign:"center",padding:"4px 2px",borderRadius:6,background:"rgba(255,255,255,0.45)",border:"1px solid "+DS.border}}>
                    <div style={{fontSize:13,fontWeight:800,color:DS.teal}}>{eC}<span style={{fontSize:9,color:DS.mid}}>/{tC}</span></div>
                    <div style={{fontSize:9,color:DS.mid}}>Contrôl.</div>
                  </div>
                  <div style={{textAlign:"center",padding:"4px 2px",borderRadius:6,background:"rgba(255,255,255,0.45)",border:"1px solid "+DS.border}}>
                    <div style={{fontSize:13,fontWeight:800,color:rest>0?"#b45309":DS.green}}>{pct}<span style={{fontSize:9,color:DS.mid}}>%</span></div>
                    <div style={{fontSize:9,color:DS.mid}}>{rest>0?rest+" rest.":"À jour"}</div>
                  </div>
                </div>
                {tot>0&&<div style={{height:3,background:DS.light,borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:pct>=100?"#059669":pct>=50?"#0891b2":"#f59e0b",borderRadius:99}}/>
                </div>}
                {/* Badge statut contrat — cliquable */}
                {(()=>{
                  const meta = getStatutMeta(c.id);
                  const isOpen = openPicker===c.id;
                  return (
                    <div style={{position:"relative"}}>
                      <button onClick={e=>{e.stopPropagation();setOpenPicker(isOpen?null:c.id);}}
                        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 8px",borderRadius:6,background:meta.bg,border:"1px solid "+meta.border,cursor:"pointer",fontFamily:"inherit"}}>
                        <span style={{fontSize:10,fontWeight:700,color:meta.color}}>{meta.label}</span>
                        <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      {isOpen&&(
                        <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"rgba(255,255,255,0.45)",borderRadius:8,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",border:"1px solid "+DS.border,zIndex:100,overflow:"auto",maxHeight:220}}>
                          {CONTRAT_STATUTS.map(s=>(
                            <button key={s.key} onClick={()=>setStatut(c.id,s.key)}
                              style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"7px 10px",background:meta.key===s.key?s.bg:DS.white,border:"none",cursor:"pointer",fontFamily:"inherit",borderBottom:"1px solid "+DS.light}}>
                              <span style={{fontSize:11,fontWeight:meta.key===s.key?700:500,color:meta.key===s.key?s.color:DS.dark}}>{s.label}</span>
                              {meta.key===s.key&&<svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:"auto"}}><polyline points="20 6 9 17 4 12"/></svg>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────