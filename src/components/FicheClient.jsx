// @ts-nocheck
import React, { useState } from "react";
import { DS, Ico, RAPPORT_STATUS, SAISONS_META, STATUT_LIV, MOIS, MOIS_L } from "../utils/constants";
import {
  alerteClient, AC, totalAnnuel, isEntretienType, isControleType, daysUntil,
  getMoisVal, getPlanningMois, getSaison, calcMensualites, getPH, getCL, getTemp,
  getResumePassage, getRapportStatus, generateCarnetCode, exportRdvToICS,
  TODAY, MOIS_NOW, YEAR_NOW
} from "../utils/helpers";
import { useIsMobile, Modal, RapportStatusPicker, Avatar } from "./ui";
import { showConfirm, toastSuccess } from "../styles";
import { FormLivraison, envoyerEmailLivraison } from "./FormLivraison";

// Forward-declared imports (defined in FormPassage to avoid circular deps)
// ouvrirRapport, envoyerEmail, ouvrirContrat, envoyerContratSignature
// These are passed in as props or imported lazily. For now import from FormPassage.
import { ouvrirRapport, envoyerEmail, ouvrirContrat, envoyerContratSignature } from "./FormPassage";
import { CarnetPublicInline } from "../pages/CarnetClient";

// ─── PASSAGE DETAIL MODAL ────────────────────────────────────────────────────
export function PassageDetailModal({ passage, client, onClose }) {
  const isMobile = useIsMobile();
  if (!passage) return null;

  const val = (v, u="") => (v!==""&&v!==null&&v!==undefined) ? `${v}${u?" "+u:""}` : "—";
  const ouiNon = (v) => v===true ? "Oui" : v===false ? "Non" : "—";
  const liste = (arr) => Array.isArray(arr)&&arr.length ? arr.join(", ") : (arr||"—");
  const etoiles = (n) => n>0 ? "★".repeat(n)+"☆".repeat(5-n)+" "+n+"/5" : "—";

  const photos = [
    passage.photoArrivee ? {src:passage.photoArrivee, label:"Arrivée"} : null,
    ...((passage.photos||[]).filter(Boolean).map((src,i)=>({src, label:`Arrivée ${i+2}`}))),
    passage.photoDepart ? {src:passage.photoDepart, label:"Départ"} : null,
    ...((passage.photosDepart||[]).filter(Boolean).map((src,i)=>({src, label:`Départ ${i+2}`}))),
  ].filter(Boolean);

  const rapportStatus = getRapportStatus(passage);
  const rapportMeta = RAPPORT_STATUS[rapportStatus] || RAPPORT_STATUS.cree;
  const isCtrl = isControleType(passage.type);

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

  const Row = ({label, value, color}) => (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"6px 0",borderBottom:"1px solid "+DS.light,gap:12}}>
      <span style={{fontSize:13,color:DS.mid,fontWeight:500,flexShrink:0}}>{label}</span>
      <span style={{fontSize:13,fontWeight:600,color:color||DS.dark,textAlign:"right",wordBreak:"break-word",whiteSpace:"pre-wrap",lineHeight:1.5}}>{value}</span>
    </div>
  );

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
                <img src={ph.src} alt={ph.label} style={{width:"100%",height:isMobile?90:110,objectFit:"cover",display:"block"}}/>
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
            {passage.signatureTech&&<div><div style={{fontSize:10,fontWeight:700,color:DS.mid,marginBottom:6}}>TECHNICIEN</div><img src={passage.signatureTech} style={{width:"100%",maxHeight:60,objectFit:"contain",borderRadius:8,border:"1px solid "+DS.border,background:"#fafafa"}}/></div>}
            {passage.signatureClient&&<div><div style={{fontSize:10,fontWeight:700,color:DS.mid,marginBottom:6}}>CLIENT</div><img src={passage.signatureClient} style={{width:"100%",maxHeight:60,objectFit:"contain",borderRadius:8,border:"1px solid "+DS.border,background:"#fafafa"}}/></div>}
          </div>
        </Block>
      )}
    </Modal>
  );
}

// ─── FICHE CLIENT ─────────────────────────────────────────────────────────────
export function FicheClient({ client, passages, livraisons=[], rdvs=[], produitsStock=[], contrats={}, onUpdateContrat, onUpdateClient, onSaveLivraison, onDeleteLivraison, onUpdateStatutLivraison, onEdit, onDelete, onDeletePassage, onClose, onAddPassage, onEditPassage, onUpdatePassageStatus, onAddRdv, onEditRdv, onDeleteRdv }) {
  const [tab, setTab] = useState("historique");
  const [detailPassageFiche, setDetailPassageFiche] = useState(null);
  const [showFormLiv, setShowFormLiv] = useState(false);
  const [editLiv, setEditLiv] = useState(null);
  const [selectedMois, setSelectedMois] = useState(null);
  const [showCarnetPreview, setShowCarnetPreview] = useState(false);
  const [expandedEv, setExpandedEv] = useState(null);
  const isMobile = useIsMobile();
  const al = alerteClient(client, passages);
  const col = AC[al];
  const rdvClient = rdvs.filter(r=>r.clientId===client.id).sort((a,b)=>a.date.localeCompare(b.date));
  const contractStart = client.dateDebut ? client.dateDebut.slice(0,10) : null;
  const contractEnd = client.dateFin ? client.dateFin.slice(0,10) : null;
  const inContract = (p) => {
    if(contractStart && contractEnd){ const d=String(p.date).slice(0,10); return d>=contractStart && d<=contractEnd; }
    return new Date(p.date).getFullYear()===YEAR_NOW;
  };
  const passC = passages.filter(p=>p.clientId===client.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const passContrat = passC.filter(inContract);
  const contratClient = Object.values(contrats).find(c=>c.clientId===client.id) || null;
  const totalE = totalAnnuel(client.moisParMois||client.saisons,"entretien");
  const totalC = totalAnnuel(client.moisParMois||client.saisons,"controle");
  const total = totalE + totalC;
  const effE = passContrat.filter(p=>isEntretienType(p.type)).length;
  const effC = passContrat.filter(p=>isControleType(p.type)).length;
  const eff = passContrat.length;
  const jours = daysUntil(client.dateFin);
  const rest = Math.max(0,total-eff);
  const moisNow = new Date().getMonth()+1;
  const yearNow = new Date().getFullYear();
  const passagesCeMois = passContrat.filter(p=>new Date(p.date).getMonth()+1===moisNow&&new Date(p.date).getFullYear()===yearNow).length;
  const prevuCeMois = (getMoisVal(client.moisParMois||client.saisons||{},moisNow).entretien||0)+(getMoisVal(client.moisParMois||client.saisons||{},moisNow).controle||0);
  const restantsCeMois = Math.max(0, prevuCeMois - passagesCeMois);
  const pct = total>0?Math.round(eff/total*100):0;
  const mensualite = (()=>{const {m11}=calcMensualites(client.prix||0);return m11;})();

  const TabIcon = ({name, size=16, color="currentColor"}) => {
    const s = {width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:color,strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"};
    switch(name) {
      case "historique": return <svg {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
      case "passages":   return <svg {...s}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
      case "saisons":    return <svg {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
      case "infos":      return <svg {...s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
      case "rdvs":       return <svg {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="15" r="1.5" fill={color}/></svg>;
      case "livraisons": return <svg {...s}><path d="M16 16V7a1 1 0 00-1-1H4a1 1 0 00-1 1v9h13z"/><path d="M16 10h3l3 3v3h-6"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>;
      case "carnet":     return <svg {...s}><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>;
      default: return null;
    }
  };
  const TABS = [
    {id:"historique", label:"Historique"},
    {id:"passages",   label:"Passages"},
    {id:"saisons",    label:"Planning"},
    {id:"infos",      label:"Infos"},
    {id:"rdvs",       label:"RDV"},
    {id:"livraisons", label:"Livraisons"},
    {id:"carnet",     label:"Carnet"},
  ];

  return (
    <>
    <Modal title="" onClose={onClose} wide>
      <div style={{margin:isMobile?"-18px -20px 0":"-24px -28px 0"}}>

        <div style={{background:"linear-gradient(135deg, rgba(34,211,238,0.25) 0%, rgba(6,182,212,0.35) 40%, rgba(99,102,241,0.28) 100%)",backdropFilter:"blur(30px) saturate(180%)",WebkitBackdropFilter:"blur(30px) saturate(180%)",padding:"22px 20px 0",position:"relative",overflow:"hidden",borderBottom:"1px solid rgba(255,255,255,0.3)"}}>
          <div style={{position:"absolute",right:-60,top:-60,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle, rgba(34,211,238,0.35) 0%, transparent 70%)",filter:"blur(20px)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",left:-40,bottom:-40,width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)",filter:"blur(16px)",pointerEvents:"none"}}/>

          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10,position:"relative"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:isMobile?20:26,fontWeight:900,color:"#0b1220",lineHeight:1.15,letterSpacing:-0.5}}>{client.nom}</div>
              <div style={{fontSize:12,color:"rgba(11,18,32,0.65)",marginTop:4,fontWeight:600}}>
                {[client.formule,client.bassin,client.volume?client.volume+"m³":null].filter(Boolean).join(" · ")}
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,0.75)",color:col.tx,fontSize:11,fontWeight:800,padding:"5px 12px",borderRadius:20,flexShrink:0,border:"1px solid "+col.tx+"55",whiteSpace:"nowrap",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>{col.lbl}</div>
          </div>

          {jours!==null&&(
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.55)",borderRadius:20,padding:"5px 12px",marginBottom:16,backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.4)"}}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={jours<=30?"#d97706":"#0891b2"} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style={{fontSize:11,fontWeight:800,color:jours<=30?"#92400e":"#0e4f6f"}}>{jours>=0?jours+" j restants":"Contrat expiré"}</span>
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:0,paddingBottom:18,position:"relative"}}>
            {[
              {label:"Entretiens",val:`${effE}/${totalE}`,ok:effE>=totalE,sub:"effectués"},
              {label:"Contrôles", val:`${effC}/${totalC}`,ok:effC>=totalC,sub:"effectués"},
              {label:"Restants",  val:rest,ok:rest===0,sub:"contrat",highlight:rest>0},
              {label:"Ce mois",   val:restantsCeMois,ok:restantsCeMois===0,sub:"à planifier",highlight:restantsCeMois>0},
              {label:"Mensualité",val:mensualite+"€",ok:true,sub:"/mois"},
            ].map(({label,val,ok,sub,highlight},i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.6)",borderRadius:14,padding:"11px 6px",textAlign:"center",border:"1px solid rgba(255,255,255,0.5)",backdropFilter:"blur(14px) saturate(180%)",WebkitBackdropFilter:"blur(14px) saturate(180%)",boxShadow:"0 4px 14px rgba(6,182,212,0.10)"}}>
                <div style={{fontSize:9,color:"#475569",fontWeight:800,textTransform:"uppercase",letterSpacing:.4,marginBottom:4}}>{label}</div>
                <div style={{fontSize:i===2?22:17,fontWeight:900,color:highlight?"#d97706":(ok?"#059669":"#0891b2"),lineHeight:1,letterSpacing:-0.5}}>{val}</div>
                <div style={{fontSize:9,color:"#64748b",marginTop:3,fontWeight:600}}>{sub}</div>
              </div>
            ))}
          </div>

          <div style={{height:4,background:"rgba(255,255,255,0.35)",margin:"0 0 0",position:"relative"}}>
            <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,#06b6d4,#10b981)",transition:"width 1s ease",borderRadius:"0 99px 99px 0",boxShadow:"0 0 12px rgba(6,182,212,0.5)"}}/>
          </div>
        </div>

        <div style={{background:"rgba(255,255,255,0.6)",backdropFilter:"blur(20px) saturate(180%)",WebkitBackdropFilter:"blur(20px) saturate(180%)",display:"flex",borderBottom:"1px solid rgba(255,255,255,0.4)",overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",padding:"0 4px"}}>
          {TABS.map(({id,label})=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{flexShrink:0,padding:"12px 14px",border:"none",cursor:"pointer",fontWeight:tab===id?800:600,fontSize:12.5,fontFamily:"inherit",background:"transparent",color:tab===id?"#0891b2":"#64748b",borderBottom:tab===id?"2.5px solid #06b6d4":"2.5px solid transparent",transition:"all .18s",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6,WebkitTapHighlightColor:"transparent",letterSpacing:"0.01em"}}>
              <TabIcon name={id} size={15} color={tab===id?"#0891b2":"#64748b"}/>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{paddingTop:16}}>

      {/* -- HISTORIQUE -- */}
      {tab==="historique" && (()=>{
        const passClient2 = passages.filter(p=>p.clientId===client.id);
        const livClient   = (livraisons||[]).filter(l=>l.clientId===client.id);
        const rdvClient2  = (rdvs||[]).filter(r=>r.clientId===client.id);

        const TYPE_CFG = {
          passage_e: { icon:"🔧", color:"#0891b2", bg:"#eff6ff" },
          passage_c: { icon:"💧", color:"#0e7490", bg:"#ecfdf5" },
          livraison: { icon:"📦", color:"#f59e0b", bg:"#fffbeb" },
          rdv:       { icon:"📅", color:"#818cf8", bg:"#f5f3ff" },
          contrat:   { icon:"📄", color:"#0891b2", bg:"#e0f2fe" },
        };

        const events = [
          ...(client.dateDebut?[{
            id:"contrat", date:client.dateDebut, kind:"contrat",
            title:"Début de contrat", sub:client.formule+(client.prix?" · "+client.prix+"€/an":""),
            badge:"Contrat", badgeColor:"#0891b2",
          }]:[]),
          ...passClient2.map(p=>({
            id:p.id, date:p.date, kind:isControleType(p.type)?"passage_c":"passage_e",
            title:p.type||"Passage",
            sub:p.tech?"par "+p.tech:"",
            badge:p.ok?"Effectué":"En cours",
            badgeColor:p.ok?"#059669":"#f59e0b",
            ph:getPH(p), chlore:getCL(p),
            photo:p.photoArrivee||p.photoDepart||(p.photos||[])[0]||"",
            resume:getResumePassage(p),
            _p:p,
          })),
          ...livClient.map(l=>({
            id:l.id, date:l.date, kind:"livraison",
            title:"Livraison produits",
            sub:(l.produits||[]).slice(0,3).join(", ")+(l.produits?.length>3?" +"+(l.produits.length-3):""),
            badge:l.statut==="paye"?"Payé":l.statut==="facture"?"Facturé":"À facturer",
            badgeColor:l.statut==="paye"?"#059669":"#f59e0b",
            montant:l.montant, _l:l,
          })),
          ...rdvClient2.map(r=>({
            id:r.id, date:r.date, kind:"rdv",
            title:r.type||"RDV",
            sub:[r.heure,r.duree?r.duree+" min":null].filter(Boolean).join(" · "),
            badge:r.date>=TODAY?"À venir":"Passé",
            badgeColor:r.date>=TODAY?"#818cf8":"#94a3b8",
            _r:r,
          })),
        ].sort((a,b)=>b.date.localeCompare(a.date));

        if(!events.length) return <div className="fade-in" style={{textAlign:"center",padding:"48px 0",color:"#94a3b8",fontSize:14}}>Aucun historique</div>;

        const grouped={};
        events.forEach(ev=>{ const d=new Date(ev.date); const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; if(!grouped[k]) grouped[k]=[]; grouped[k].push(ev); });

        return (
          <div className="fade-in">
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
              {[
                {label:"Passages",val:passClient2.length,color:"#0891b2",bg:"#eff6ff"},
                {label:"Livraisons",val:livClient.length,color:"#f59e0b",bg:"#fffbeb"},
                {label:"RDV",val:rdvClient2.length,color:"#818cf8",bg:"#f5f3ff"},
              ].map(s=>(
                <div key={s.label} style={{background:s.bg,borderRadius:12,padding:"10px 8px",textAlign:"center",border:"1px solid "+s.color+"22"}}>
                  <div style={{fontSize:22,fontWeight:900,color:s.color,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:10,color:s.color,fontWeight:700,marginTop:3,textTransform:"uppercase",letterSpacing:.4}}>{s.label}</div>
                </div>
              ))}
            </div>

            {Object.keys(grouped).sort((a,b)=>b.localeCompare(a)).map(key=>{
              const [yr,mo]=key.split("-");
              return (
                <div key={key} style={{marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,paddingBottom:6,borderBottom:"2px solid rgba(6,182,212,0.15)"}}>
                    <span style={{fontSize:13,fontWeight:800,color:"#0f172a",letterSpacing:-0.3}}>{MOIS_L[parseInt(mo)]} {yr}</span>
                    <span style={{fontSize:11,color:"#94a3b8",fontWeight:600,background:"#f8fafc",padding:"2px 8px",borderRadius:20}}>{grouped[key].length} év.</span>
                  </div>

                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {grouped[key].map((ev,i)=>{
                      const cfg = TYPE_CFG[ev.kind]||TYPE_CFG.passage_e;
                      const isExp = expandedEv===ev.id;
                      const d = new Date(ev.date);
                      const phOk = ev.ph>=7&&ev.ph<=7.6;
                      const clOk = ev.chlore>=0.5&&ev.chlore<=3;

                      return (
                        <div key={ev.id||i}
                          style={{background:"rgba(255,255,255,0.6)",borderRadius:14,border:"1px solid "+(isExp?cfg.color+"44":"rgba(255,255,255,0.5)"),overflow:"hidden",transition:"all .2s",boxShadow:isExp?"0 4px 16px "+cfg.color+"18":"0 1px 4px rgba(0,0,0,0.04)"}}>

                          <div onClick={()=>setExpandedEv(isExp?null:ev.id)}
                            style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",cursor:"pointer"}}>

                            <div style={{width:38,height:38,borderRadius:11,background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0,border:"1px solid "+cfg.color+"22"}}>
                              {cfg.icon}
                            </div>

                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</div>
                              <div style={{fontSize:11,color:"#64748b",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                                <span>{d.toLocaleDateString("fr",{day:"2-digit",month:"short"})}</span>
                                {ev.sub&&<><span style={{color:"#cbd5e1"}}>·</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{ev.sub}</span></>}
                              </div>
                            </div>

                            {(ev.ph||ev.chlore)&&(
                              <div style={{display:"flex",gap:4,flexShrink:0}}>
                                {ev.ph&&<div style={{background:phOk?"#dcfce7":"#fef3c7",borderRadius:6,padding:"2px 6px",textAlign:"center"}}>
                                  <div style={{fontSize:8,fontWeight:700,color:phOk?"#166534":"#92400e"}}>pH</div>
                                  <div style={{fontSize:12,fontWeight:900,color:phOk?"#16a34a":"#d97706",lineHeight:1}}>{ev.ph}</div>
                                </div>}
                                {ev.chlore&&<div style={{background:clOk?"#dcfce7":"#fef3c7",borderRadius:6,padding:"2px 6px",textAlign:"center"}}>
                                  <div style={{fontSize:8,fontWeight:700,color:clOk?"#166534":"#92400e"}}>Cl</div>
                                  <div style={{fontSize:12,fontWeight:900,color:clOk?"#16a34a":"#d97706",lineHeight:1}}>{ev.chlore}</div>
                                </div>}
                              </div>
                            )}

                            <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                              <span style={{fontSize:10,fontWeight:700,color:ev.badgeColor,background:ev.badgeColor+"18",padding:"2px 7px",borderRadius:10,whiteSpace:"nowrap"}}>{ev.badge}</span>
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" style={{transition:"transform .2s",transform:isExp?"rotate(90deg)":"rotate(0deg)"}}><polyline points="9 18 15 12 9 6"/></svg>
                            </div>
                          </div>

                          {isExp&&(
                            <div style={{borderTop:"1px solid "+cfg.color+"22",padding:"12px 14px",background:cfg.bg+"44"}}>
                              {ev.photo&&(
                                <div style={{marginBottom:10}}>
                                  <img src={ev.photo} alt="" style={{width:"100%",maxHeight:120,objectFit:"cover",borderRadius:10,border:"1px solid "+DS.border}}/>
                                </div>
                              )}
                              {ev.resume&&(
                                <div style={{fontSize:13,color:"#334155",lineHeight:1.6,marginBottom:10,padding:"8px 10px",background:"rgba(255,255,255,0.6)",borderRadius:8}}>{ev.resume}</div>
                              )}
                              {ev.montant&&(
                                <div style={{fontSize:15,fontWeight:900,color:cfg.color,marginBottom:10}}>{Number(ev.montant).toLocaleString("fr")} €</div>
                              )}
                              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                                {ev._p&&<>
                                  <button onClick={e=>{e.stopPropagation();setDetailPassageFiche(ev._p);}} style={{flex:1,padding:"7px 10px",borderRadius:8,background:"rgba(255,255,255,0.7)",border:"1px solid "+DS.border,cursor:"pointer",fontSize:12,fontWeight:700,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                                    {Ico.search(11,DS.mid)} Aperçu
                                  </button>
                                  <button onClick={e=>{e.stopPropagation();ouvrirRapport(ev._p,client);}} style={{flex:1,padding:"7px 10px",borderRadius:8,background:DS.blueSoft,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,color:DS.blue,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                                    {Ico.pdf(11,DS.blue)} PDF
                                  </button>
                                  {client.email&&<button onClick={e=>{e.stopPropagation();showConfirm(`Envoyer le rapport par email à ${client.email} ?`,()=>envoyerEmail(ev._p,client,onUpdatePassageStatus));}} style={{flex:1,padding:"7px 10px",borderRadius:8,background:DS.greenSoft,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,color:DS.green,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                                    {Ico.send(11,DS.green)} Email
                                  </button>}
                                  <button onClick={e=>{e.stopPropagation();onEditPassage&&onEditPassage(ev._p);}} style={{padding:"7px 10px",borderRadius:8,background:"rgba(255,255,255,0.7)",border:"1px solid "+DS.border,cursor:"pointer",fontSize:12,fontWeight:700,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                                    {Ico.edit(11,DS.mid)}
                                  </button>
                                </>}
                                {ev._l&&<>
                                  <button onClick={e=>{e.stopPropagation();setEditLiv(ev._l);setShowFormLiv(true);}} style={{flex:1,padding:"7px 10px",borderRadius:8,background:"rgba(255,255,255,0.7)",border:"1px solid "+DS.border,cursor:"pointer",fontSize:12,fontWeight:700,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                                    {Ico.edit(11,DS.mid)} Modifier
                                  </button>
                                  {client.email&&<button onClick={e=>{e.stopPropagation();showConfirm(`Envoyer le bon de livraison par email à ${client.email} ?`,()=>envoyerEmailLivraison(ev._l,client));}} style={{flex:1,padding:"7px 10px",borderRadius:8,background:DS.greenSoft,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,color:DS.green,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                                    {Ico.send(11,DS.green)} Email
                                  </button>}
                                </>}
                                {ev._r&&<>
                                  <button onClick={e=>{e.stopPropagation();onEditRdv&&onEditRdv(ev._r);}} style={{flex:1,padding:"7px 10px",borderRadius:8,background:"rgba(255,255,255,0.7)",border:"1px solid "+DS.border,cursor:"pointer",fontSize:12,fontWeight:700,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                                    {Ico.edit(11,DS.mid)} Modifier
                                  </button>
                                  <button onClick={e=>{e.stopPropagation();exportRdvToICS(ev._r,client);}} style={{flex:1,padding:"7px 10px",borderRadius:8,background:DS.purpleSoft,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,color:DS.purple,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                                    {Ico.download(11,DS.purple)} Calendrier
                                  </button>
                                </>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* -- PASSAGES / RAPPORTS -- */}
      {tab==="passages" && (
        <div className="fade-in">
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <button onClick={onAddPassage} style={{flex:1,height:44,borderRadius:12,background:"linear-gradient(135deg,#0284c7,#0891b2)",border:"none",cursor:"pointer",fontWeight:700,fontSize:13,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"0 2px 8px rgba(8,145,178,0.35)",WebkitTapHighlightColor:"transparent"}}>
              {Ico.plus(13,"#fff")} Nouveau passage
            </button>
            {passC.length>0&&onDeletePassage&&(
              <button onClick={()=>showConfirm(`Supprimer TOUS les ${passC.length} passages ?`,()=>passC.forEach(p=>onDeletePassage(p.id)))}
                style={{height:44,width:44,borderRadius:12,background:DS.redSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {Ico.trash(14,DS.red)}
              </button>
            )}
          </div>
          {passC.length===0
            ? <div style={{textAlign:"center",color:DS.mid,padding:32,fontSize:14}}>Aucun passage enregistré</div>
            : passC.map(p=>{
              const phOk=p.ph>=7.0&&p.ph<=7.6;
              const clOk=p.chlore>=0.5&&p.chlore<=3.0;
              const isCtrl=isControleType(p.type);
              const rapportStatus=getRapportStatus(p);
              const rapportMeta=RAPPORT_STATUS[rapportStatus] || RAPPORT_STATUS.cree;
              return (
                <div key={p.id} style={{background:"rgba(255,255,255,0.55)",borderRadius:14,border:"1px solid #f1f5f9",marginBottom:8,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px 8px"}}>
                    <div style={{width:36,height:36,borderRadius:10,background:isCtrl?"#ecfdf5":"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>
                      {isCtrl?"💧":"🔧"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:800,color:"#0f172a"}}>{p.type||"Entretien"}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:1}}>
                        {new Date(p.date).toLocaleDateString("fr",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}
                        {p.tech&&<span style={{marginLeft:6,color:"#94a3b8"}}>· {p.tech}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,flexShrink:0}}>
                      {p.ph&&<div style={{background:phOk?"#dcfce7":"#fef2f2",borderRadius:6,padding:"3px 7px",textAlign:"center"}}>
                        <div style={{fontSize:8,color:phOk?"#166534":"#b91c1c",fontWeight:700}}>pH</div>
                        <div style={{fontSize:13,fontWeight:900,color:phOk?"#166534":"#b91c1c",lineHeight:1}}>{p.ph}</div>
                      </div>}
                      {p.chlore&&<div style={{background:clOk?"#dcfce7":"#fef2f2",borderRadius:6,padding:"3px 7px",textAlign:"center"}}>
                        <div style={{fontSize:8,color:clOk?"#166534":"#b91c1c",fontWeight:700}}>Cl</div>
                        <div style={{fontSize:13,fontWeight:900,color:clOk?"#166534":"#b91c1c",lineHeight:1}}>{p.chlore}</div>
                      </div>}
                    </div>
                  </div>

                  {(p.photoArrivee||p.photoDepart)&&(
                    <div style={{display:"flex",gap:4,padding:"0 14px 8px"}}>
                      {p.photoArrivee&&<div style={{flex:1,position:"relative"}}><img src={p.photoArrivee} alt="" style={{width:"100%",height:52,objectFit:"cover",borderRadius:8}}/><span style={{position:"absolute",bottom:2,left:4,fontSize:8,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.5)",borderRadius:3,padding:"1px 4px"}}>Arrivée</span></div>}
                      {p.photoDepart&&<div style={{flex:1,position:"relative"}}><img src={p.photoDepart} alt="" style={{width:"100%",height:52,objectFit:"cover",borderRadius:8}}/><span style={{position:"absolute",bottom:2,left:4,fontSize:8,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.5)",borderRadius:3,padding:"1px 4px"}}>Départ</span></div>}
                    </div>
                  )}

                  <div style={{padding:"0 14px 8px"}} onClick={e=>e.stopPropagation()}>
                    <RapportStatusPicker compact value={rapportStatus} onChange={(next)=>onUpdatePassageStatus?.({...p,rapportStatut:next,rapportEnvoyeAt:next==="envoye"?(p.rapportEnvoyeAt||new Date().toISOString()):null})}/>
                  </div>

                  <div style={{display:"flex",borderTop:"1px solid #f8fafc"}}>
                    {[
                      {label:"Aperçu",  ico:Ico.search(12,DS.mid),  bg:"#f8fafc", color:DS.dark,   onClick:()=>setDetailPassageFiche(p)},
                      {label:"Modifier",ico:Ico.edit(12,DS.mid),    bg:"#f8fafc", color:DS.mid,    onClick:()=>onEditPassage&&onEditPassage(p)},
                      {label:"Rapport", ico:Ico.pdf(12,DS.blue),    bg:"#eff6ff", color:DS.blue,   onClick:()=>ouvrirRapport(p,client)},
                      ...(client.email?[{label:"Email",ico:Ico.send(12,DS.green),bg:"#f0fdf4",color:DS.green,onClick:()=>showConfirm(`Envoyer le rapport par email à ${client.email} ?`,()=>envoyerEmail(p,client,onUpdatePassageStatus))}]:[]),
                      ...(onDeletePassage?[{label:"",ico:Ico.trash(12,DS.red),bg:"#fef2f2",color:DS.red,onClick:()=>showConfirm("Supprimer ce passage ?",()=>onDeletePassage(p.id))}]:[]),
                    ].map((btn,i,arr)=>(
                      <button key={i} onClick={e=>{e.stopPropagation();btn.onClick();}}
                        style={{flex:btn.label?"1":null,width:btn.label?null:40,padding:"9px 4px",background:btn.bg,border:"none",borderRight:i<arr.length-1?"1px solid #f1f5f9":"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontSize:11,fontWeight:700,color:btn.color,fontFamily:"inherit",WebkitTapHighlightColor:"transparent",transition:"opacity .1s",minHeight:38}}>
                        {btn.ico}{btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {/* -- PLANNING (SAISONS) -- */}
      {tab==="saisons" && <div className="fade-in">
        {(()=>{
          const mpmRaw = client.moisParMois || client.saisons || {};
          const mpmPlan = getPlanningMois(mpmRaw);
          const manuelMap = client.passagesManuel || {};
          const label = contractStart && contractEnd
            ? `${new Date(contractStart).toLocaleDateString("fr",{day:"2-digit",month:"short",year:"numeric"})} → ${new Date(contractEnd).toLocaleDateString("fr",{day:"2-digit",month:"short",year:"numeric"})}`
            : "Année en cours";
          return <>
          <div style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>📅 {label}</div>
          <div style={{border:"1px solid "+DS.border,borderRadius:12,overflow:"hidden"}}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map((m,i)=>{
            const planE=mpmPlan[m].e, planC=mpmPlan[m].c, planT=planE+planC;
            const passM=passC.filter(p=>{
              const d=new Date(p.date), dMois=d.getMonth()+1;
              if(dMois!==m) return false;
              if(contractStart&&contractEnd){ const ds=String(p.date).slice(0,10); return ds>=contractStart&&ds<=contractEnd; }
              return d.getFullYear()===YEAR_NOW;
            });
            const mKey=`${contractStart?contractStart.slice(0,4):YEAR_NOW}-${String(m).padStart(2,"0")}`;
            const doneManuel=manuelMap[mKey]||0;
            const doneT=passM.length+doneManuel;
            const rest2=Math.max(0,planT-doneT);
            const sc=SAISONS_META[getSaison(m)]||SAISONS_META.ete;
            const cur=m===MOIS_NOW;
            const isSelMois=selectedMois===m;
            return <div key={m}>
              <div onClick={()=>passM.length>0?setSelectedMois(isSelMois?null:m):null}
                style={{display:"flex",alignItems:"center",padding:"9px 12px",borderBottom:(!isSelMois&&i<11)?"1px solid "+DS.border:"none",background:cur?sc.bg+"88":isSelMois?sc.bg:i%2===0?"#fff":"#fafafa",cursor:passM.length>0?"pointer":"default"}}>
                <div style={{width:3,height:20,borderRadius:2,background:sc.color,marginRight:8,flexShrink:0}}/>
                <div style={{width:34,fontWeight:cur?800:600,fontSize:13,color:cur?sc.color:DS.mid}}>{MOIS[m]}</div>
                <div style={{flex:1,display:"flex",gap:6,alignItems:"center"}}>
                  {planT>0?<span style={{fontSize:13,fontWeight:700,color:doneT>=planT?DS.green:DS.blue}}>{doneT}/{planT}</span>:<span style={{fontSize:13,color:"#d1d5db"}}>—</span>}
                  {doneManuel>0&&<span style={{fontSize:9,fontWeight:700,color:"#7c3aed",background:"#f5f3ff",padding:"1px 5px",borderRadius:4}}>{doneManuel}m</span>}
                  {doneT>planT&&planT>0&&<span style={{fontSize:9,fontWeight:700,color:DS.blue,background:DS.blueSoft,padding:"1px 5px",borderRadius:4}}>+{doneT-planT}</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {planT>0&&<div style={{fontSize:11,fontWeight:700,color:rest2>0?DS.orange:DS.green,background:rest2>0?DS.orangeSoft:DS.greenSoft,padding:"2px 8px",borderRadius:6,minWidth:46,textAlign:"center"}}>{rest2>0?rest2+" rest.":"✓"}</div>}
                  {planT>0&&onUpdateClient&&(
                    <div style={{display:"flex",alignItems:"center",gap:2}}>
                      {doneManuel>0&&<button onClick={e=>{e.stopPropagation();const nm={...manuelMap};if(doneManuel<=1)delete nm[mKey];else nm[mKey]=doneManuel-1;onUpdateClient({...client,passagesManuel:nm});}} style={{width:24,height:24,borderRadius:6,border:"1.5px solid #c4b5fd",background:"#f5f3ff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>}
                      {doneManuel>0&&<span style={{fontSize:11,fontWeight:800,color:"#7c3aed",minWidth:14,textAlign:"center"}}>{doneManuel}</span>}
                      <button onClick={e=>{e.stopPropagation();onUpdateClient({...client,passagesManuel:{...manuelMap,[mKey]:(doneManuel||0)+1}});}} style={{width:24,height:24,borderRadius:6,border:"1.5px solid "+(doneManuel>0?"#c4b5fd":DS.border),background:doneManuel>0?"#f5f3ff":"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={doneManuel>0?"#7c3aed":DS.mid} strokeWidth="3" strokeLinecap:"round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {isSelMois&&passM.length>0&&(
                <div style={{background:"rgba(255,255,255,0.45)",padding:"8px 12px",borderBottom:i<11?"1px solid "+DS.border:"none",display:"flex",flexDirection:"column",gap:6}}>
                  {passM.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(p=>{
                    const phOk=p.ph>=7&&p.ph<=7.6;const clOk=p.chlore>=0.5&&p.chlore<=3;
                    return (
                      <div key={p.id} style={{background:"rgba(255,255,255,0.55)",borderRadius:10,padding:"9px 11px",border:"1px solid #f1f5f9"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <div style={{fontSize:12,fontWeight:700,color:DS.dark}}>{new Date(p.date).toLocaleDateString("fr",{day:"2-digit",month:"long"})} {p.tech&&<span style={{color:DS.mid,fontWeight:500}}>· {p.tech}</span>}</div>
                          <div style={{display:"flex",gap:4}}>
                            {getPH(p)&&<span style={{fontSize:10,fontWeight:700,color:phOk?DS.green:DS.red,background:phOk?DS.greenSoft:DS.redSoft,padding:"1px 5px",borderRadius:4}}>pH {getPH(p)}</span>}
                            {getCL(p)&&<span style={{fontSize:10,fontWeight:700,color:clOk?DS.green:DS.red,background:clOk?DS.greenSoft:DS.redSoft,padding:"1px 5px",borderRadius:4}}>Cl {getCL(p)}</span>}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:4}}>
                          <button onClick={e=>{e.stopPropagation();setDetailPassageFiche(p);}} style={{flex:1,padding:"5px",borderRadius:7,background:"rgba(255,255,255,0.4)",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>{Ico.search(10,DS.mid)} Aperçu</button>
                          <button onClick={e=>{e.stopPropagation();onEditPassage&&onEditPassage(p);}} style={{flex:1,padding:"5px",borderRadius:7,background:"rgba(255,255,255,0.4)",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>{Ico.edit(10,DS.mid)} Modifier</button>
                          <button onClick={e=>{e.stopPropagation();ouvrirRapport(p,client);}} style={{flex:1,padding:"5px",borderRadius:7,background:DS.blueSoft,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,color:DS.blue,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>{Ico.pdf(10,DS.blue)} Rapport</button>
                          {onDeletePassage&&<button onClick={e=>{e.stopPropagation();showConfirm("Supprimer ?",()=>onDeletePassage(p.id));}} style={{padding:"5px 7px",borderRadius:7,background:DS.redSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.trash(10,DS.red)}</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>;
          })}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:8,padding:"8px 14px",background:"linear-gradient(135deg,#0891b2,#0e7490)",borderRadius:10,boxShadow:"0 2px 8px rgba(8,145,178,0.25)"}}>
            <span style={{color:"rgba(255,255,255,0.7)",fontSize:12,fontWeight:600}}>Total annuel</span>
            <span style={{color:"#fff",fontSize:12,fontWeight:800}}>🔧 {totalE} · 💧 {totalC} · {total} passages</span>
          </div>
          </>;
        })()}
      </div>}

      {/* -- INFOS -- */}
      {tab==="infos" && (
        <div className="fade-in">
          {(client.tel||client.email)&&(
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {client.tel&&<a href={"tel:"+client.tel} style={{flex:1,height:44,borderRadius:12,background:"rgba(219,234,254,0.5)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:13,fontWeight:700,color:DS.blue,textDecoration:"none",WebkitTapHighlightColor:"transparent"}}>
                {Ico.phone(14,DS.blue)} Appeler
              </a>}
              {client.email&&<a href={"mailto:"+client.email} style={{flex:1,height:44,borderRadius:12,background:"#f0fdf4",border:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:13,fontWeight:700,color:DS.green,textDecoration:"none",WebkitTapHighlightColor:"transparent"}}>
                {Ico.mail(14,DS.green)} Email
              </a>}
            </div>
          )}
          <div style={{background:"rgba(255,255,255,0.55)",borderRadius:14,border:"1px solid #f1f5f9",overflow:"hidden",marginBottom:16}}>
          {[
            {ico:Ico.phone(15,DS.blue),l:"Téléphone",v:client.tel,href:client.tel?"tel:"+client.tel:null},
            {ico:Ico.mail(15,DS.blue),l:"Email",v:client.email,href:client.email?"mailto:"+client.email:null},
            {ico:Ico.pin(15,DS.blue),l:"Adresse",v:client.adresse},
            {ico:Ico.pool(15,DS.blue),l:"Bassin",v:[client.bassin,client.volume?client.volume+" m³":null].filter(Boolean).join(" — ")},
            {ico:Ico.euro(15,DS.blue),l:"Tarif annuel",v:client.prix?client.prix+"€/an":null},
            {ico:Ico.calendar(15,DS.blue),l:"Début contrat",v:client.dateDebut?new Date(client.dateDebut).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"}):null},
            {ico:Ico.calendar(15,jours!==null&&jours<=30?DS.orange:DS.blue),l:"Fin contrat",v:client.dateFin?new Date(client.dateFin).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"}):null},
          ].filter(r=>r.v).map((r,i,arr)=>(
            <div key={r.l} style={{display:"flex",gap:12,padding:"13px 16px",alignItems:"center",borderBottom:i<arr.length-1?"1px solid #f8fafc":"none"}}>
              <div style={{width:34,height:34,borderRadius:9,background:"rgba(224,242,254,0.5)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{r.ico}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:2}}>{r.l}</div>
                {r.href?<a href={r.href} style={{fontSize:13,color:DS.blue,fontWeight:700,textDecoration:"none"}}>{r.v}</a>:<div style={{fontSize:13,color:"#0f172a",fontWeight:600}}>{r.v}</div>}
              </div>
            </div>
          ))}
          </div>

          {(()=>{
            const ct=contratClient;
            if(!ct) return null;
            const cfg={
              signe_complet:{bg:"#f0fdf4",border:"#6ee7b7",color:DS.green,label:"Contrat co-signé",sub:"Signé le "+new Date(ct.signedAt||0).toLocaleDateString("fr")},
              signe_client: {bg:"#eff6ff",border:"#93c5fd",color:DS.blue,label:"Client signé",sub:"En attente de votre signature"},
              signe:        {bg:"#f0fdf4",border:"#6ee7b7",color:DS.green,label:"Contrat signé",sub:""},
            }[ct.statut]||{bg:"#fff7ed",border:"#fed7aa",color:DS.orange,label:"En attente de signature",sub:""};
            return <div style={{background:cfg.bg,border:"1px solid "+cfg.border,borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:800,color:cfg.color}}>{cfg.label}</div>
                {cfg.sub&&<div style={{fontSize:10,color:DS.mid,marginTop:1}}>{cfg.sub}</div>}
              </div>
            </div>;
          })()}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:8}}>
            <button onClick={()=>{ouvrirContrat(client,contratClient?.signaturePrestataire||"",contratClient?.signatureClient||"");if(!contratClient?.statut&&onUpdateContrat)onUpdateContrat("CT-"+client.id,{clientId:client.id,statut:"cree"});}}
              style={{height:44,borderRadius:12,background:"linear-gradient(135deg,#0284c7,#0ea5e9)",border:"none",cursor:"pointer",fontWeight:700,fontSize:12,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5,boxShadow:"0 2px 8px rgba(2,132,199,0.25)",WebkitTapHighlightColor:"transparent"}}>
              {Ico.contract(12,"#fff")} Contrat
            </button>
            <button onClick={()=>envoyerContratSignature(client)}
              style={{height:44,borderRadius:12,background:contratClient?.statut==="signe_complet"?DS.greenSoft:contratClient?.statut==="signe_client"?DS.blueSoft:"linear-gradient(135deg,#059669,#34d399)",border:"none",cursor:"pointer",fontWeight:700,fontSize:12,color:contratClient?.statut==="signe_complet"?DS.green:contratClient?.statut==="signe_client"?DS.blue:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5,WebkitTapHighlightColor:"transparent"}}>
              {Ico.sign(12,contratClient?.statut==="signe_complet"?DS.green:contratClient?.statut==="signe_client"?DS.blue:"#fff")}
              {contratClient?.statut==="signe_complet"?"Signé":contratClient?.statut==="signe_client"?"Attente":"Envoyer"}
            </button>
            <button onClick={onEdit}
              style={{height:44,borderRadius:12,background:"rgba(255,255,255,0.4)",border:"none",cursor:"pointer",fontWeight:700,fontSize:12,color:DS.dark,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5,WebkitTapHighlightColor:"transparent"}}>
              {Ico.edit(12,DS.dark)} Modifier
            </button>
            <button onClick={onDelete}
              style={{width:44,height:44,borderRadius:12,background:DS.redSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent"}}>
              {Ico.trash(14,DS.red)}
            </button>
          </div>
        </div>
      )}

      {/* -- RDV -- */}
      {tab==="rdvs" && (
        <div className="fade-in">
          <button onClick={onAddRdv} style={{width:"100%",height:44,marginBottom:12,borderRadius:12,background:"linear-gradient(135deg,#6d28d9,#7c3aed)",border:"none",cursor:"pointer",fontWeight:700,fontSize:13,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"inherit",boxShadow:"0 2px 8px rgba(109,40,217,0.3)",WebkitTapHighlightColor:"transparent"}}>
            {Ico.plus(13,"#fff")} Nouveau RDV
          </button>
          {rdvClient.length===0
            ? <div style={{textAlign:"center",color:DS.mid,padding:32,fontSize:14}}>Aucun rendez-vous</div>
            : rdvClient.map(r=>{
              const d=new Date(r.date);
              const isToday=r.date===TODAY;
              const isPast=r.date<TODAY;
              return (
                <div key={r.id} style={{background:isPast?"#fafafa":"#fff",borderRadius:12,border:"1.5px solid "+(isToday?"#7c3aed":"#f1f5f9"),padding:"12px 14px",marginBottom:8,opacity:isPast?0.65:1,boxShadow:isToday?"0 0 0 3px #ede9fe":undefined}}>
                  <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{width:42,textAlign:"center",flexShrink:0,background:isToday?DS.purpleSoft:"#f8fafc",borderRadius:9,padding:"5px 3px"}}>
                      <div style={{fontSize:8,fontWeight:700,color:isToday?DS.purple:DS.mid,textTransform:"uppercase"}}>{d.toLocaleDateString("fr",{weekday:"short"})}</div>
                      <div style={{fontSize:18,fontWeight:900,color:isToday?DS.purple:DS.dark,lineHeight:1}}>{d.getDate()}</div>
                      <div style={{fontSize:8,color:DS.mid}}>{MOIS[d.getMonth()+1]}</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:800,fontSize:13,color:DS.dark}}>{r.type}</div>
                      <div style={{fontSize:12,color:DS.mid,marginTop:2,display:"flex",gap:6}}>
                        {r.heure&&<span style={{fontWeight:600,color:DS.purple}}>{r.heure}</span>}
                        {r.duree&&<span>{r.duree} min</span>}
                      </div>
                      {r.description&&<div style={{fontSize:11,color:DS.mid,marginTop:3}}>{r.description}</div>}
                    </div>
                    {isToday&&<span style={{fontSize:9,fontWeight:800,color:DS.purple,background:DS.purpleSoft,padding:"2px 7px",borderRadius:8}}>Aujourd'hui</span>}
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:10,paddingTop:8,borderTop:"1px solid #f8fafc"}}>
                    <button onClick={()=>onEditRdv&&onEditRdv(r)} style={{flex:1,padding:"7px",borderRadius:8,background:"rgba(255,255,255,0.45)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontSize:11,fontWeight:700,color:DS.mid,fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>{Ico.edit(11,DS.mid)} Modifier</button>
                    <button onClick={()=>exportRdvToICS(r,client)} style={{flex:1,padding:"7px",borderRadius:8,background:DS.purpleSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontSize:11,fontWeight:700,color:DS.purple,fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>{Ico.download(11,DS.purple)} Calendrier</button>
                    <button onClick={()=>showConfirm("Supprimer ce RDV ?",()=>onDeleteRdv&&onDeleteRdv(r.id))} style={{width:34,borderRadius:8,background:DS.redSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent"}}>{Ico.trash(11,DS.red)}</button>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {tab==="livraisons" && (
        <div className="fade-in">
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>
            {Object.entries(STATUT_LIV).map(([k,s])=>{
              const n=livraisons.filter(l=>l.statut===k).length;
              return (<div key={k} style={{background:s.bg,borderRadius:10,padding:"8px 6px",textAlign:"center",border:"1px solid "+s.color+"33"}}>
                <div style={{fontSize:18,fontWeight:900,color:s.color}}>{n}</div>
                <div style={{fontSize:10,color:s.color,fontWeight:700,marginTop:1}}>{s.label}</div>
              </div>);
            })}
          </div>
          <button onClick={()=>{setEditLiv(null);setShowFormLiv(true);}} style={{width:"100%",height:44,marginBottom:12,borderRadius:12,background:"linear-gradient(135deg,#0284c7,#0891b2)",border:"none",cursor:"pointer",fontWeight:700,fontSize:13,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"inherit",boxShadow:"0 2px 8px rgba(8,145,178,0.3)",WebkitTapHighlightColor:"transparent"}}>
            {Ico.plus(13,"#fff")} Nouvelle livraison
          </button>
          {livraisons.length===0
            ? <div style={{textAlign:"center",color:DS.mid,padding:24,fontSize:14}}>Aucune livraison</div>
            : livraisons.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(l=>{
              const s=STATUT_LIV[l.statut]||STATUT_LIV.aFacturer;
              return (
                <div key={l.id} style={{background:"rgba(255,255,255,0.55)",borderRadius:12,border:"1px solid #f1f5f9",marginBottom:8,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                  <div style={{padding:"12px 14px 8px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{new Date(l.date).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"})}</div>
                      {l.produits&&l.produits.length>0&&<div style={{fontSize:11,color:DS.mid,marginTop:2}}>{l.produits.join(", ")}</div>}
                      {l.description&&<div style={{fontSize:11,color:DS.mid,marginTop:1}}>{l.description}</div>}
                      {l.montant&&<div style={{fontSize:15,fontWeight:900,color:DS.dark,marginTop:4}}>{Number(l.montant).toLocaleString("fr")} €</div>}
                    </div>
                    <span style={{fontSize:10,fontWeight:700,color:s.color,background:s.bg,padding:"2px 8px",borderRadius:8,flexShrink:0,border:"1px solid "+s.color+"44"}}>{s.label}</span>
                  </div>
                  <div style={{display:"flex",gap:4,padding:"0 14px 8px"}}>
                    {Object.entries(STATUT_LIV).map(([k,sv])=>(
                      <button key={k} onClick={()=>onUpdateStatutLivraison(l.id,k)} style={{flex:1,padding:"5px 2px",borderRadius:7,border:"1.5px solid "+(l.statut===k?sv.color:DS.border),background:l.statut===k?sv.bg:"#fff",cursor:"pointer",fontSize:10,fontWeight:700,color:l.statut===k?sv.color:DS.mid,fontFamily:"inherit"}}>{sv.label}</button>
                    ))}
                  </div>
                  <div style={{display:"flex",borderTop:"1px solid #f8fafc"}}>
                    <button onClick={()=>{setEditLiv(l);setShowFormLiv(true);}} style={{flex:1,padding:"8px",background:"rgba(255,255,255,0.45)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontSize:11,fontWeight:700,color:DS.mid,fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>{Ico.edit(11,DS.mid)} Modifier</button>
                    {client.email
                      ?<button onClick={()=>showConfirm(`Envoyer le bon de livraison par email à ${client.email} ?`,()=>envoyerEmailLivraison(l,client))} style={{flex:1,padding:"8px",background:"#f0fdf4",border:"none",borderLeft:"1px solid #f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontSize:11,fontWeight:700,color:DS.green,fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>{Ico.send(11,DS.green)} Email</button>
                      :<div style={{flex:1}}/>
                    }
                    <button onClick={()=>showConfirm("Supprimer ?",()=>onDeleteLivraison(l.id))} style={{width:38,padding:"8px",background:"#fef2f2",border:"none",borderLeft:"1px solid #f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent"}}>{Ico.trash(11,DS.red)}</button>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {showFormLiv && (
        <FormLivraison initial={editLiv} clientId={client.id} clients={[client]} produitsStock={produitsStock} onSave={l=>{onSaveLivraison(l);setShowFormLiv(false);setEditLiv(null);}} onClose={()=>{setShowFormLiv(false);setEditLiv(null);}}/>
      )}
      {detailPassageFiche && <PassageDetailModal passage={detailPassageFiche} client={client} onClose={()=>setDetailPassageFiche(null)}/>}

      {/* -- CARNET -- */}
      {tab==="carnet" && (()=>{
        const code=generateCarnetCode(client.id);
        const carnetUrl=window.location.origin+window.location.pathname+"?carnet="+code;
        const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(carnetUrl)}`;
        const lastPass = passC.find(p=>p.ok);
        return (
          <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:14}}>

            <button onClick={()=>setShowCarnetPreview(true)}
              style={{width:"100%",height:52,borderRadius:16,background:"linear-gradient(135deg,#0891b2,#0e7490)",border:"none",cursor:"pointer",fontWeight:800,fontSize:14,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 4px 16px rgba(8,145,178,0.35)",WebkitTapHighlightColor:"transparent"}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Aperçu — Vue client
            </button>

            <div style={{background:"linear-gradient(145deg,#0c1f3f,#0e3460,#0a5a8a)",borderRadius:20,padding:"24px 20px",position:"relative",overflow:"hidden",boxShadow:"0 8px 32px rgba(8,145,178,0.25)"}}>
              <div style={{position:"absolute",right:-30,top:-30,width:140,height:140,borderRadius:"50%",background:"rgba(8,145,178,0.12)",pointerEvents:"none"}}/>
              <div style={{position:"absolute",left:-20,bottom:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.03)",pointerEvents:"none"}}/>

              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:18,position:"relative"}}>
                <svg width={16} height={12} viewBox="0 0 32 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M2 8c2.5 3 5 3 7.5 0S14 5 16.5 8s5 3 7.5 0"/>
                  <path d="M2 16c2.5 3 5 3 7.5 0S14 13 16.5 16s5 3 7.5 0"/>
                </svg>
                <span style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,0.5)",letterSpacing:1,textTransform:"uppercase"}}>Carnet numérique</span>
              </div>

              <div style={{display:"flex",gap:18,alignItems:"center",position:"relative"}}>
                <div style={{width:96,height:96,borderRadius:14,overflow:"hidden",flexShrink:0,background:"rgba(255,255,255,0.55)",padding:4,boxShadow:"0 4px 16px rgba(0,0,0,0.3)"}}>
                  <img src={qrUrl} alt="QR" width={88} height={88} style={{display:"block",borderRadius:8}} onError={e=>{e.target.style.display="none";}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:16,fontWeight:900,color:"#fff",marginBottom:4,lineHeight:1.2}}>{client.nom}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Code d'accès</div>
                  <div style={{fontSize:26,fontWeight:900,color:"#7dd3fc",letterSpacing:4,fontFamily:"'Courier New',monospace",background:"rgba(125,211,252,0.08)",borderRadius:8,padding:"4px 10px",display:"inline-block"}}>{code}</div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:18,position:"relative"}}>
                <button onClick={()=>{try{navigator.clipboard.writeText(carnetUrl);toastSuccess("Lien copié !");}catch{}}}
                  style={{padding:"10px 8px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:10,fontSize:12,fontWeight:700,color:"#e2e8f0",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,WebkitTapHighlightColor:"transparent"}}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  Copier le lien
                </button>
                <button onClick={()=>{const w=window.open("","_blank");w.document.write(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#f8fafc;gap:16px;padding:32px"><div style="font-size:22px;font-weight:900;color:#1e3a5f">Carnet BRIBLUE</div><div style="font-size:14px;color:#64748b">${client.nom}</div><img src="${qrUrl}" width="200" height="200"/><div style="font-size:32px;font-weight:900;letter-spacing:6px;color:#0891b2">${code}</div><div style="font-size:11px;color:#94a3b8;text-align:center">Scannez le QR code ou rendez-vous sur<br/>${carnetUrl}</div><script>window.print();<\/script></body></html>`);w.document.close();}}
                  style={{padding:"10px 8px",background:"rgba(8,145,178,0.2)",border:"1px solid rgba(8,145,178,0.35)",borderRadius:10,fontSize:12,fontWeight:700,color:"#7dd3fc",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,WebkitTapHighlightColor:"transparent"}}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Imprimer QR
                </button>
              </div>
            </div>

            {lastPass && (
              <div style={{background:"rgba(255,255,255,0.55)",borderRadius:16,border:"1px solid #f1f5f9",padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
                <div style={{fontSize:10,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>Dernière intervention</div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#0891b2,#0e7490)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>
                    {isControleType(lastPass.type)?"💧":"🔧"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{lastPass.type||"Entretien"}</div>
                    <div style={{fontSize:12,color:"#64748b",marginTop:2}}>
                      {new Date(lastPass.date).toLocaleDateString("fr",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
                      {lastPass.tech&&<span style={{color:"#94a3b8"}}> · {lastPass.tech}</span>}
                    </div>
                  </div>
                  {(lastPass.ph||lastPass.chlore)&&(
                    <div style={{display:"flex",gap:5,flexShrink:0}}>
                      {lastPass.ph&&<div style={{background:lastPass.ph>=7&&lastPass.ph<=7.6?"#dcfce7":"#fef2f2",borderRadius:8,padding:"4px 8px",textAlign:"center"}}>
                        <div style={{fontSize:8,color:lastPass.ph>=7&&lastPass.ph<=7.6?"#166534":"#b91c1c",fontWeight:700}}>pH</div>
                        <div style={{fontSize:14,fontWeight:900,color:lastPass.ph>=7&&lastPass.ph<=7.6?"#166534":"#b91c1c",lineHeight:1}}>{lastPass.ph}</div>
                      </div>}
                      {lastPass.chlore&&<div style={{background:lastPass.chlore>=0.5&&lastPass.chlore<=3?"#dcfce7":"#fef2f2",borderRadius:8,padding:"4px 8px",textAlign:"center"}}>
                        <div style={{fontSize:8,color:lastPass.chlore>=0.5&&lastPass.chlore<=3?"#166534":"#b91c1c",fontWeight:700}}>Cl</div>
                        <div style={{fontSize:14,fontWeight:900,color:lastPass.chlore>=0.5&&lastPass.chlore<=3?"#166534":"#b91c1c",lineHeight:1}}>{lastPass.chlore}</div>
                      </div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{background:"#f0fdf4",borderRadius:14,padding:"12px 14px",border:"1px solid #bbf7d0"}}>
                <div style={{fontSize:11,fontWeight:800,color:"#166534",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Visible client
                </div>
                {["Interventions réalisées","pH · chlore · température","Date et type d'entretien","Nom du technicien"].map(t=>(
                  <div key={t} style={{fontSize:11,color:"#166534",marginBottom:4,display:"flex",gap:5,alignItems:"flex-start"}}>
                    <span style={{color:"#22c55e",flexShrink:0,marginTop:1}}>•</span>{t}
                  </div>
                ))}
              </div>
              <div style={{background:"#fff7ed",borderRadius:14,padding:"12px 14px",border:"1px solid #fed7aa"}}>
                <div style={{fontSize:11,fontWeight:800,color:"#9a3412",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  Caché
                </div>
                {["Prix et tarifs","Notes privées","Autres clients","Données contrat"].map(t=>(
                  <div key={t} style={{fontSize:11,color:"#9a3412",marginBottom:4,display:"flex",gap:5,alignItems:"flex-start"}}>
                    <span style={{color:"#f97316",flexShrink:0,marginTop:1}}>•</span>{t}
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:"rgba(255,255,255,0.45)",borderRadius:12,padding:"10px 14px",border:"1px solid #e2e8f0"}}>
              <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>Lien du carnet</div>
              <div style={{fontSize:11,color:"#0891b2",fontWeight:600,wordBreak:"break-all",lineHeight:1.5}}>{carnetUrl}</div>
            </div>
          </div>
        );
      })()}

      </div>
    </Modal>

    {showCarnetPreview&&(
      <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(255,255,255,0.5)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(12,31,63,0.96)",backdropFilter:"blur(8px)",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <svg width={16} height={11} viewBox="0 0 32 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M2 8c2.5 3 5 3 7.5 0S14 5 16.5 8s5 3 7.5 0"/>
              <path d="M2 16c2.5 3 5 3 7.5 0S14 13 16.5 16s5 3 7.5 0"/>
            </svg>
            <span style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.7)"}}>Vue client · {client.nom}</span>
          </div>
          <button onClick={()=>setShowCarnetPreview(false)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:10,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",cursor:"pointer",fontSize:12,fontWeight:700,color:"#fff",fontFamily:"inherit"}}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Fermer
          </button>
        </div>
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          <CarnetPublicInline client={client} passages={passages}/>
        </div>
      </div>
    )}
    </>
  );
}
