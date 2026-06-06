// @ts-nocheck
import React, { useState, useMemo } from "react";
import { DS, Ico, RAPPORT_STATUS, AC } from "../utils/constants";
import { alerteClient, daysUntil, isEntretienType, isControleType, totalAnnuel, getRapportStatus, YEAR_NOW, calculerPassagesPrevusContrat, isPassageDansContrat, isPassageEffectue } from "../utils/helpers";
import { useIsMobile, Avatar, Modal, Tag, BtnPrimary, PhotoImg } from "../components/ui";

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

  // Dégradés avatar selon l'initiale
  const avatarGrad = (nom) => {
    const g = [
      "linear-gradient(135deg,#0891b2,#06b6d4)","linear-gradient(135deg,#7c3aed,#a78bfa)",
      "linear-gradient(135deg,#059669,#34d399)","linear-gradient(135deg,#d97706,#fbbf24)",
      "linear-gradient(135deg,#dc2626,#f87171)","linear-gradient(135deg,#0369a1,#38bdf8)",
      "linear-gradient(135deg,#7e22ce,#c084fc)","linear-gradient(135deg,#be185d,#f472b6)",
    ];
    return g[(nom?.charCodeAt(0)||0) % g.length];
  };

  return (
    <div>
      {/* ═══ BARRE STATS / FILTRES ═══ */}
      <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",paddingBottom:2}}>
        {[
          { key:"all",      icon:"🏊", label:"Tous",          val:statsClients.total,     color:"#0891b2", grad:"linear-gradient(135deg,#0c1f3f,#0369a1)" },
          { key:"contrat",  icon:"📋", label:"Sous contrat",  val:statsClients.sousContrat,color:"#059669",grad:"linear-gradient(135deg,#064e3b,#059669)" },
          { key:"alertes",  icon:"⚠️", label:"Alertes",       val:statsClients.alertes,   color:"#d97706", grad:"linear-gradient(135deg,#78350f,#d97706)" },
          { key:"expires",  icon:"⏰", label:"Expirent < 30j",val:statsClients.expires,   color:"#dc2626", grad:"linear-gradient(135deg,#7f1d1d,#dc2626)" },
        ].map(f=>{
          const active = filterStat === f.key;
          return (
            <button key={f.key} onClick={()=>setFilterStat(active && f.key!=="all" ? "all" : f.key)}
              style={{flexShrink:0,display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderRadius:16,border:"none",cursor:"pointer",fontFamily:"inherit",transition:"all .2s",WebkitTapHighlightColor:"transparent",
                background:active ? f.grad : "rgba(255,255,255,0.55)",
                boxShadow:active ? "0 4px 16px rgba(0,0,0,0.2)" : "0 1px 4px rgba(0,0,0,0.06)",
                transform:active?"scale(1.04)":"scale(1)",
              }}>
              <span style={{fontSize:16,lineHeight:1}}>{f.icon}</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:18,fontWeight:900,color:active?"#fff":DS.dark,lineHeight:1}}>{f.val}</div>
                <div style={{fontSize:10,fontWeight:700,color:active?"rgba(255,255,255,0.75)":DS.mid,letterSpacing:.3,marginTop:1,whiteSpace:"nowrap"}}>{f.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ═══ BARRE RECHERCHE + AJOUT ═══ */}
      <div style={{display:"flex",gap:10,marginBottom:18,alignItems:"center"}}>
        <div style={{flex:1,position:"relative"}}>
          <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>
            {Ico.search(16,"#94a3b8")}
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un client…"
            style={{width:"100%",padding:"13px 16px 13px 44px",borderRadius:16,border:"1.5px solid rgba(8,145,178,0.15)",fontSize:14,outline:"none",boxSizing:"border-box",background:"rgba(255,255,255,0.8)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",color:DS.dark,fontFamily:"inherit",boxShadow:"0 2px 12px rgba(8,145,178,0.08)",transition:"border .2s"}}/>
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:18,lineHeight:1,padding:4}}>×</button>}
        </div>
        <button onClick={onAdd}
          style={{height:46,borderRadius:16,background:"linear-gradient(135deg,#0891b2,#06b6d4)",border:"none",cursor:"pointer",fontWeight:800,fontSize:13,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",gap:7,padding:"0 20px",boxShadow:"0 4px 16px rgba(8,145,178,0.4)",flexShrink:0,WebkitTapHighlightColor:"transparent",whiteSpace:"nowrap"}}>
          {Ico.userPlus(15,"#fff")}
          {!isMobile&&"Nouveau client"}
        </button>
      </div>

      {/* ═══ RÉSULTATS ═══ */}
      {filterStat!=="all"&&filtered.length>0&&(
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,padding:"6px 12px",borderRadius:10,background:"rgba(8,145,178,0.06)",border:"1px solid rgba(8,145,178,0.12)"}}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          <span style={{fontSize:12,fontWeight:600,color:"#0891b2",flex:1}}>{filtered.length} client{filtered.length>1?"s":""} affiché{filtered.length>1?"s":""}</span>
          <button onClick={()=>setFilterStat("all")} style={{fontSize:11,fontWeight:700,color:"#0891b2",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>Tout voir</button>
        </div>
      )}

      {filtered.length===0&&(
        <div style={{textAlign:"center",padding:"60px 20px",color:DS.mid}}>
          <div style={{fontSize:48,marginBottom:12}}>🔍</div>
          <div style={{fontSize:15,fontWeight:700,color:"#374151",marginBottom:4}}>Aucun client trouvé</div>
          <div style={{fontSize:13}}>Essayez un autre terme de recherche</div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {filtered.map((c,idx)=>{
          const al  = alerteClient(c,passages);
          const col = AC[al];
          const mpm = c.moisParMois||c.saisons||{};
          const tE  = totalAnnuel(mpm,"entretien");
          const tC  = totalAnnuel(mpm,"controle");
          const tot = calculerPassagesPrevusContrat(c);
          const passEff = passages.filter(p=>p.clientId===c.id&&isPassageDansContrat(p,c)&&isPassageEffectue(p));
          const eE  = passEff.filter(p=>isEntretienType(p.type)).length;
          const eC  = passEff.filter(p=>isControleType(p.type)).length;
          const eff = eE+eC;
          const pct = tot>0?Math.round(eff/tot*100):0;
          const rest= Math.max(0,tot-eff);
          const jours = daysUntil(c.dateFin);

          const statusBar = pct>=100?"#10b981":pct>=60?"#0891b2":pct>=30?"#f59e0b":"#ef4444";
          const meta        = getStatutMeta(c.id);
          const isOpen      = openPicker===c.id;

          return (
            <div key={c.id} onClick={()=>onClientClick(c)} className="fade-in"
              style={{animationDelay:`${idx*0.04}s`,borderRadius:20,overflow:isOpen?"visible":"hidden",
                boxShadow:"0 4px 24px rgba(0,0,0,0.09)",border:"1px solid rgba(255,255,255,0.8)",
                cursor:"pointer",display:"flex",flexDirection:"column",position:"relative",
                zIndex:isOpen?999:1,background:"#fff",transition:"box-shadow .2s, transform .15s",
              }}
              onMouseEnter={e=>{ if(!isMobile){e.currentTarget.style.boxShadow="0 8px 32px rgba(8,145,178,0.18)";e.currentTarget.style.transform="translateY(-2px)";} }}
              onMouseLeave={e=>{ if(!isMobile){e.currentTarget.style.boxShadow="0 4px 24px rgba(0,0,0,0.09)";e.currentTarget.style.transform="translateY(0)";} }}>

              {/* ── HEADER : photo ou dégradé ── */}
              <div style={{height:110,position:"relative",flexShrink:0,overflow:"hidden",borderRadius:"20px 20px 0 0"}}>
                {c.photoPiscine
                  ? <>
                      <img src={c.photoPiscine} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0.55) 100%)"}}/>
                    </>
                  : <div style={{width:"100%",height:"100%",background:avatarGrad(c.nom),display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                      <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.1)"}}/>
                      <div style={{position:"absolute",left:-10,bottom:-10,width:70,height:70,borderRadius:"50%",background:"rgba(255,255,255,0.08)"}}/>
                      <span style={{fontSize:36,fontWeight:900,color:"rgba(255,255,255,0.9)",letterSpacing:-1,zIndex:1}}>
                        {c.nom?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                      </span>
                    </div>
                }
                {/* Badge alerte */}
                <div style={{position:"absolute",top:10,left:12}}>
                  <span style={{fontSize:10,fontWeight:800,color:col.tx,background:col.bg,padding:"3px 9px",borderRadius:20,border:"1.5px solid "+col.tx+"44",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)"}}>{col.lbl}</span>
                </div>
                {/* Jours restants */}
                {jours!==null&&(
                  <div style={{position:"absolute",top:10,right:12}}>
                    <span style={{fontSize:10,fontWeight:800,color:jours<=30?"#fff":"#fff",background:jours<=30?"rgba(239,68,68,0.85)":"rgba(0,0,0,0.45)",padding:"3px 9px",borderRadius:20,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)"}}>
                      {jours>=0?jours+"j":"Expiré"}
                    </span>
                  </div>
                )}
                {/* Nom sur la photo */}
                <div style={{position:"absolute",bottom:10,left:14,right:14}}>
                  <div style={{fontSize:16,fontWeight:900,color:"#fff",letterSpacing:-0.3,textShadow:"0 1px 4px rgba(0,0,0,0.5)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.8)",fontWeight:600,marginTop:1,display:"flex",gap:6,alignItems:"center"}}>
                    <span>{c.formule}</span>
                    {c.bassin&&<><span style={{opacity:.5}}>·</span><span>{c.bassin}{c.volume?" "+c.volume+"m³":""}</span></>}
                  </div>
                </div>
              </div>

              {/* ── CORPS ── */}
              <div style={{padding:"14px 14px 12px",flex:1,display:"flex",flexDirection:"column",gap:10}}>

                {/* Adresse */}
                {c.adresse&&(
                  <div style={{display:"flex",alignItems:"center",gap:6,color:"#64748b"}}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span style={{fontSize:11,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.adresse}</span>
                  </div>
                )}

                {/* Progression passages */}
                {tot>0&&(
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#374151"}}>Passages {eff}/{tot}</span>
                      <span style={{fontSize:12,fontWeight:900,color:statusBar}}>{pct}%</span>
                    </div>
                    <div style={{height:6,background:"#f1f5f9",borderRadius:99,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:pct>=100?"linear-gradient(90deg,#10b981,#34d399)":pct>=60?"linear-gradient(90deg,#0891b2,#38bdf8)":pct>=30?"linear-gradient(90deg,#f59e0b,#fbbf24)":"linear-gradient(90deg,#ef4444,#f87171)",borderRadius:99,transition:"width .5s ease"}}/>
                    </div>
                    <div style={{display:"flex",gap:8,marginTop:6}}>
                      {tE>0&&<span style={{fontSize:10,fontWeight:700,color:eE>=tE?"#059669":"#0891b2",background:eE>=tE?"#f0fdf4":"#e0f2fe",padding:"2px 8px",borderRadius:8}}>🔧 {eE}/{tE}</span>}
                      {tC>0&&<span style={{fontSize:10,fontWeight:700,color:eC>=tC?"#059669":"#0369a1",background:eC>=tC?"#f0fdf4":"#e0f2fe",padding:"2px 8px",borderRadius:8}}>💧 {eC}/{tC}</span>}
                      {rest>0&&<span style={{fontSize:10,fontWeight:700,color:"#b45309",background:"#fef3c7",padding:"2px 8px",borderRadius:8}}>{rest} restant{rest>1?"s":""}</span>}
                    </div>
                  </div>
                )}

                {/* Badge statut contrat — picker */}
                {(()=>{
                  return (
                    <div style={{position:"relative",marginTop:"auto"}}>
                      <button onClick={e=>{e.stopPropagation();setOpenPicker(isOpen?null:c.id);}}
                        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderRadius:10,background:meta.bg,border:"1.5px solid "+meta.border,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:7,height:7,borderRadius:4,background:meta.color,flexShrink:0}}/>
                          <span style={{fontSize:11,fontWeight:700,color:meta.color}}>{meta.label}</span>
                        </div>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2.5" strokeLinecap="round" style={{transition:"transform .2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                      {isOpen&&(
                        <div onClick={e=>e.stopPropagation()} style={{position:"absolute",bottom:"calc(100% + 6px)",left:0,right:0,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.16)",border:"1px solid #e2e8f0",zIndex:100,overflow:"hidden"}}>
                          {CONTRAT_STATUTS.map((s,si)=>(
                            <button key={s.key} onClick={()=>setStatut(c.id,s.key)}
                              style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:meta.key===s.key?s.bg:"#fff",border:"none",borderBottom:si<CONTRAT_STATUTS.length-1?"1px solid #f8fafc":"none",cursor:"pointer",fontFamily:"inherit",transition:"background .1s"}}>
                              <div style={{width:8,height:8,borderRadius:4,background:s.color,flexShrink:0}}/>
                              <span style={{fontSize:11,fontWeight:meta.key===s.key?700:500,color:meta.key===s.key?s.color:"#374151",flex:1,textAlign:"left"}}>{s.label}</span>
                              {meta.key===s.key&&<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
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