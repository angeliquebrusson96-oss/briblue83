// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { save, load, flushPendingNow, IS_IOS, reconcileOnBoot } from "./lib/storage";
import { extractPassagePhotos } from "./lib/photoStore";
import { signInAnonymously } from "firebase/auth";
import { auth } from "./lib/firebase";

import { DS, Ico, IconFiche, CLIENTS_INIT, PASSAGES_INIT, PRODUITS_DEFAUT, MOIS, AC } from "./utils/constants";
import { migrateMois, alerteClient, getEntretienMois, getControleMois, isEntretienType, isControleType, TODAY, MOIS_NOW, YEAR_NOW, totalAnnuel, getMoisVal, daysUntil } from "./utils/helpers";
import { GlobalStyles, setupPWA, sendLocalNotification, playNotifSound, toastInfo, toastError, showConfirm, ToastContainer, ConfirmModal } from "./styles";
import { useIsMobile, useOnlineStatus, Modal, BtnPrimary, Card, Section, Avatar, Tag } from "./components/ui";
import { FormClient } from "./components/FormClient";
import { FormPassage, ouvrirContrat } from "./components/FormPassage";
import { FormLivraison } from "./components/FormLivraison";
import { FormRdv } from "./components/FormRdv";
import { FicheClient } from "./components/FicheClient";
import { Dashboard } from "./pages/Dashboard";
import { PageClients } from "./pages/PageClients";
import { PagePassages } from "./pages/PagePassages";
import { PageRdv } from "./pages/PageRdv";
import { CarnetPublic } from "./pages/CarnetClient";
import { PageDocuments } from "./pages/PageDocuments";
import { PageGestion } from "./pages/PageGestion";

// Protection module-level contre double-load iOS
let _BB_BOOT_DONE = false;

// Lecture localStorage synchrone (zéro réseau)
function readLS(key, fallback) {
  try { const s = localStorage.getItem("briblue_" + key); if (s !== null) return JSON.parse(s); } catch { /* noop */ }
  return fallback;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
const AUTH = { email: "briblue83@hotmail.com", code: "2004" };

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleLogin = () => {
    setErr("");
    if (!email.trim() || !code.trim()) { setErr("Veuillez remplir tous les champs."); return; }
    setLoading(true);
    setTimeout(() => {
      if (email.trim().toLowerCase() === AUTH.email && code === AUTH.code) { onLogin(); }
      else { setErr("Email ou code incorrect."); setLoading(false); }
    }, 600);
  };

  return (
    <div style={{minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"max(24px, env(safe-area-inset-top, 24px)) 20px 24px",fontFamily:"'Inter', -apple-system, system-ui, sans-serif",position:"relative",overflow:"hidden"}}>
      <div className="scale-in" style={{marginBottom:32,display:"flex",flexDirection:"column",alignItems:"center",gap:14,position:"relative"}}>
        <div style={{width:90,height:90,borderRadius:28,background:"linear-gradient(135deg,#22d3ee 0%, #0891b2 50%, #6366f1 100%)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 20px 50px rgba(6,182,212,0.4), inset 0 2px 0 rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.3)"}}>{Ico.wave(46,"white")}</div>
        <div style={{textAlign:"center"}}>
          <div style={{fontWeight:900,fontSize:34,color:DS.dark,letterSpacing:-1.5,background:"linear-gradient(135deg,#0b1220,#0891b2)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>BRIBLUE</div>
          <div style={{color:DS.mid,fontSize:12,marginTop:4,fontWeight:600,letterSpacing:0.3}}>Création · Traitement de l'eau · Installation · Dépannage</div>
        </div>
      </div>
      <div className="fade-in glass-strong" style={{width:"100%",maxWidth:420,borderRadius:DS.radiusLg,padding:32,boxShadow:"0 30px 80px rgba(6,182,212,0.22), 0 10px 30px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",position:"relative"}}>
        <div style={{marginBottom:26}}>
          <div style={{fontWeight:800,fontSize:20,color:DS.dark,letterSpacing:"-0.02em"}}>Connexion </div>
          <div style={{color:DS.mid,fontSize:13,marginTop:4,fontWeight:500}}>Accès réservé </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:8}}>Adresse email</label>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",zIndex:2}}>{Ico.mail(16,"#64748b")}</div>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="Email" autoComplete="off" onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{width:"100%",padding:"14px 14px 14px 42px",borderRadius:14,fontSize:14,outline:"none",boxSizing:"border-box",color:DS.dark,fontFamily:"inherit"}}/>
            </div>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:8}}>Code d'accès</label>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",zIndex:2}}>{Ico.user(16,"#64748b")}</div>
              <input type={showCode?"text":"password"} value={code} onChange={e=>{setCode(e.target.value);setErr("");}} placeholder="••••" onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{width:"100%",padding:"14px 48px 14px 42px",borderRadius:14,fontSize:14,outline:"none",boxSizing:"border-box",color:DS.dark,fontFamily:"inherit"}}/>
              <button onClick={()=>setShowCode(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:4,zIndex:2}}>
                {showCode ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </div>
          {err && <div style={{background:DS.redSoft,color:DS.red,borderRadius:12,padding:"11px 14px",fontSize:13,display:"flex",alignItems:"center",gap:8,fontWeight:600,border:"1px solid rgba(225,29,72,0.25)"}}>{Ico.alert(14,DS.red)} {err}</div>}
          <button onClick={handleLogin} disabled={loading} className="btn-hover" style={{width:"100%",marginTop:6,padding:"15px",fontSize:15,fontWeight:700,color:"#fff",background:loading?"linear-gradient(135deg,#94a3b8,#64748b)":"linear-gradient(135deg,#06b6d4 0%,#0891b2 50%,#6366f1 100%)",border:"none",borderRadius:14,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 10px 30px rgba(6,182,212,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",letterSpacing:"0.01em"}}>
            {loading ? <><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{animation:"pulse 1s infinite"}}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Connexion…</> : <>{Ico.next(16,"#fff")} Se connecter</>}
          </button>
        </div>
      </div>
      <div style={{marginTop:22,color:"#64748b",fontSize:11,textAlign:"center",fontWeight:600,letterSpacing:0.3}}>BRIBLUE </div>
    </div>
  );
}

function ModalStock({ stock, onClose, onUpdateStock, onAddProduit, onDeleteProduit }) {
  const [newProduit, setNewProduit] = useState("");
  const produitsListe = Object.keys(stock);
  return (
    <Modal title="Stock produits" onClose={onClose} wide>
      <Section title="Ajouter un produit personnalisé">
        <div style={{display:"flex",gap:8,flexWrap:"wrap",width:"100%"}}>
          <input value={newProduit} onChange={e=>setNewProduit(e.target.value)} placeholder="Nom du produit..."
            onKeyDown={e=>e.key==="Enter"&&newProduit.trim()&&(onAddProduit(newProduit.trim()),setNewProduit(""))}
            style={{flex:"1 1 140px",minWidth:0,width:"100%",padding:"11px 14px",borderRadius:DS.radiusSm,border:"none",fontSize:14,outline:"none",fontFamily:"inherit",color:DS.dark,boxSizing:"border-box",boxShadow:"inset 3px 3px 6px rgba(6,182,212,0.15), inset -2px -2px 5px rgba(255,255,255,0.8)"}}/>
          <BtnPrimary onClick={()=>{if(newProduit.trim()){onAddProduit(newProduit.trim());setNewProduit("");}}} icon={Ico.plus(14,"#fff")} bg={DS.blue} style={{flexShrink:0,whiteSpace:"nowrap"}}>Ajouter</BtnPrimary>
        </div>
      </Section>
      <Section title="Quantités en stock">
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {produitsListe.map(p=>{
            const qty = stock[p] ?? 0;
            const low = qty <= 2;
            return (
              <div key={p} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:DS.radiusSm,background:"rgba(255,255,255,0.45)",border:"none",boxShadow:low?"inset 2px 2px 5px rgba(239,68,68,0.15), inset -1px -1px 3px rgba(255,255,255,0.7)":"inset 2px 2px 5px rgba(6,182,212,0.15), inset -1px -1px 3px rgba(255,255,255,0.7)"}}>
                <div style={{flex:1}}>
                  <span style={{fontSize:13,fontWeight:600,color:DS.dark}}>{p}</span>
                  {low&&<span style={{marginLeft:8,fontSize:10,fontWeight:700,color:DS.red}}>⚠️ Stock bas</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <button onClick={()=>onUpdateStock(p, Math.max(0, qty-1))} style={{width:28,height:28,borderRadius:8,border:"none",background:"rgba(255,255,255,0.45)",boxShadow:"3px 3px 6px rgba(6,182,212,0.15), -2px -2px 4px rgba(255,255,255,0.8)",cursor:"pointer",fontSize:16,fontWeight:700,color:DS.mid,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                  <span style={{fontSize:16,fontWeight:900,color:low?DS.red:DS.dark,minWidth:28,textAlign:"center"}}>{qty}</span>
                  <button onClick={()=>onUpdateStock(p, qty+1)} style={{width:28,height:28,borderRadius:8,border:"none",background:"rgba(255,255,255,0.45)",boxShadow:"3px 3px 6px rgba(6,182,212,0.15), -2px -2px 4px rgba(255,255,255,0.8)",cursor:"pointer",fontSize:16,fontWeight:700,color:DS.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                </div>
                {!PRODUITS_DEFAUT.includes(p) && (
                  <button onClick={()=>showConfirm(`Supprimer "${p}" du stock ?`,()=>onDeleteProduit(p))} style={{width:28,height:28,borderRadius:8,background:DS.redSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.trash(12,DS.red)}</button>
                )}
              </div>
            );
          })}
        </div>
      </Section>
      <div style={{padding:"12px 16px",background:"#0891b2",borderRadius:DS.radiusSm,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:"rgba(255,255,255,0.7)",fontSize:12,fontWeight:600}}>Produits en stock bas (≤2)</span>
        <span style={{color:"#fda4af",fontSize:16,fontWeight:900}}>{Object.values(stock).filter(q=>q<=2).length}</span>
      </div>
    </Modal>
  );
}

function ModalImportConnecteam({ clients, onImport, onClose }) {
  const [status, setStatus] = useState("idle");
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [selected, setSelected] = useState([]);

  const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  const mapRow = (row, clientId) => {
    const date = row[4] ? new Date(row[4]).toISOString().split("T")[0] : new Date(row[2]).toISOString().split("T")[0];
    const photos = [row[8],row[9],row[10],row[11],row[12],row[13],row[14],row[15]].filter(v=>v&&v!=="Image"&&v!=="None");
    const photosDepart = [row[39],row[40],row[41],row[42],row[43],row[44],row[45],row[46]].filter(v=>v&&v!=="Image"&&v!=="None");
    const mapType = (t) => {
      if (!t) return "Entretien complet";
      const tl = String(t).toLowerCase();
      if (tl.includes("complet") || tl.includes("nettoyage")) return "Entretien complet";
      if (tl.includes("contrôle") || tl.includes("controle") || tl.includes("visite")) return "Contrôle de l'eau";
      if (tl.includes("sav") || tl.includes("dépann")) return "SAV";
      if (tl.includes("hivern")) return "Hivernage";
      if (tl.includes("remise")) return "Remise en service";
      return "Entretien complet";
    };
    const mapOuiNon = (v) => { if (!v) return null; const s=String(v).toLowerCase(); if(s==="oui"||s==="yes"||s==="true") return true; if(s==="non"||s==="no"||s==="false") return false; return null; };
    const fixNum = (v) => { if(v===null||v===undefined||v==="") return ""; const s=String(v).trim().replace(",","."); if(s.toLowerCase()==="haut") return "Haut"; const n=parseFloat(s); return isNaN(n)?s:String(n); };
    return {
      id: uid(), clientId, date, tech: row[7] || "Dorian", type: mapType(row[16]),
      tSel: fixNum(row[17]), tPhosphate: fixNum(row[18]), tStabilisant: fixNum(row[19]), tChlore: fixNum(row[20]), tPH: fixNum(row[21]),
      qualiteEau: row[22]||"", etatFond: row[23] ? [row[23]] : [], etatParois: row[24] ? [row[24]] : [],
      etatLocal: row[25] ? [row[25]] : [], etatBacTampon: row[26] ? [row[26]] : [], etatVoletBac: row[27] ? [row[27]] : [],
      corrChlore: row[28]||"", corrPhosphate: row[29]||"", corrPH: row[30]||"", corrSel: row[31]||"",
      corrAlgicide: row[32]||"", corrPeroxyde: row[33]||"", corrChloreChoc: row[34]||"", corrAutre: row[35]||"",
      devis: mapOuiNon(row[36]), priseEchantillon: mapOuiNon(row[37]), commentaires: row[38]||"",
      photoArrivee: photos[0]||"", photos: photos.slice(1), photoDepart: photosDepart[0]||"", photosDepart: photosDepart.slice(1),
      livraisonProduits: mapOuiNon(row[54]),
      produitsLivres: row[55] ? String(row[55]).split(",").map(s=>s.trim()).filter(Boolean) : [],
      livraisonAutre: row[56]||"", ressenti: Number(row[57])||0,
      signatureTech: row[58]&&row[58]!=="Image"?row[58]:"",
      chloreLibre:"", ph:"", alcalinite:"", stabilisant:"",
      stabilisantHaut: String(row[19]||"").toLowerCase()==="haut", presenceClient: null,
      ok: true, rapportStatut: "cree",
    };
  };

  const parseFile = (file) => {
    setStatus("parsing");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const XLSX = window.XLSX;
        if (!XLSX) { setErrors(["SheetJS non chargé — rechargez la page"]); setStatus("idle"); return; }
        const wb = XLSX.read(e.target.result, {type:"array", cellDates:true});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:null});
        if (data.length < 2) { setErrors(["Fichier vide"]); setStatus("idle"); return; }
        const dataRows = data.slice(1).filter(r => r.some(v=>v));
        const parsed = dataRows.map((row, i) => {
          const nomConnecteam = String(row[6] || row[5] || "").trim().toLowerCase();
          const matched = clients.find(c => {
            const nc = c.nom.toLowerCase();
            return nc === nomConnecteam || nc.includes(nomConnecteam) || nomConnecteam.includes(nc) ||
              nc.replace(/[^a-z]/g,"").includes(nomConnecteam.replace(/[^a-z]/g,"").slice(0,6));
          });
          return { row, nomConnecteam: String(row[6]||row[5]||"").trim(), matched, idx: i };
        });
        setRows(parsed);
        setSelected(parsed.map((_,i)=>i));
        setStatus("preview");
      } catch(err) { setErrors([String(err)]); setStatus("idle"); }
    };
    reader.readAsArrayBuffer(file);
  };

  const doImport = () => {
    setStatus("importing");
    const newClients = []; const newPassages = []; const clientMap = {};
    selected.forEach(i => {
      const {row, nomConnecteam, matched} = rows[i];
      let clientId;
      if (matched) { clientId = matched.id; }
      else {
        if (clientMap[nomConnecteam]) { clientId = clientMap[nomConnecteam]; }
        else {
          const newC = { id: uid(), nom: String(row[6]||row[5]||"Inconnu").trim(), tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"VAC", prix:0, prixPassageE:0, prixPassageC:0, dateDebut: new Date().toISOString().split("T")[0], dateFin: `${new Date().getFullYear()+1}-03-31`, photoPiscine:"", notesTarifaires:"", moisParMois: Object.fromEntries([1,2,3,4,5,6,7,8,9,10,11,12].map(m=>[m,{entretien:0,controle:0}])) };
          newClients.push(newC); clientMap[nomConnecteam] = newC.id; clientId = newC.id;
        }
      }
      newPassages.push(mapRow(row, clientId));
    });
    onImport(newClients, newPassages);
    setStatus("done");
  };

  const unmatchedCount = rows.filter((_,i)=>selected.includes(i)&&!rows[i].matched).length;
  return (
    <Modal title="📥 Import Connecteam" onClose={onClose} wide>
      {status==="idle"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{padding:"20px",borderRadius:12,border:"2px dashed "+DS.border,background:DS.light,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>📊</div>
            <div style={{fontWeight:700,fontSize:15,color:DS.dark,marginBottom:4}}>Fichier Excel Connecteam</div>
            <div style={{fontSize:13,color:DS.mid,marginBottom:16}}>Glisse le fichier ou clique pour sélectionner</div>
            <label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:10,background:DS.blue,color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700}}>
              📂 Choisir le fichier .xlsx
              <input type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={e=>e.target.files[0]&&parseFile(e.target.files[0])}/>
            </label>
          </div>
          {errors.map((e,i)=><div key={i} style={{padding:"10px 14px",background:DS.redSoft,borderRadius:8,color:DS.red,fontSize:13}}>{e}</div>)}
        </div>
      )}
      {status==="parsing"&&(<div style={{textAlign:"center",padding:40}}><div style={{fontSize:32,marginBottom:12}}>⏳</div><div style={{fontWeight:700,color:DS.dark}}>Lecture en cours…</div></div>)}
      {status==="preview"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:10,background:DS.blueSoft,border:"1px solid "+DS.border}}>
            <span style={{fontWeight:700,fontSize:14,color:DS.blue}}>{rows.length} passages trouvés</span>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setSelected(rows.map((_,i)=>i))} style={{fontSize:12,fontWeight:700,color:DS.blue,background:"none",border:"none",cursor:"pointer"}}>Tout sélect.</button>
              <button onClick={()=>setSelected([])} style={{fontSize:12,fontWeight:700,color:DS.mid,background:"none",border:"none",cursor:"pointer"}}>Tout désél.</button>
            </div>
          </div>
          {unmatchedCount>0&&(<div style={{padding:"10px 14px",background:"#fef3c7",borderRadius:8,border:"1px solid #fcd34d",fontSize:13,color:"#92400e"}}>⚠️ <strong>{unmatchedCount} client(s) non trouvé(s)</strong> — seront créés automatiquement</div>)}
          <div style={{maxHeight:360,overflowY:"auto",WebkitOverflowScrolling:"touch",display:"flex",flexDirection:"column",gap:4}}>
            {rows.map((r,i)=>{
              const sel = selected.includes(i);
              return (
                <label key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,cursor:"pointer",background:sel?DS.white:DS.light,border:"1.5px solid "+(sel?DS.border:"transparent")}}>
                  <input type="checkbox" checked={sel} onChange={()=>setSelected(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i])} style={{accentColor:DS.blue,width:14,height:14,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{fontWeight:700,fontSize:13,color:DS.dark}}>{r.nomConnecteam||"—"}</span>
                      {r.matched ? <span style={{fontSize:10,fontWeight:700,color:DS.green,background:DS.greenSoft,padding:"1px 6px",borderRadius:4}}>✓ {r.matched.nom}</span>
                        : <span style={{fontSize:10,fontWeight:700,color:"#b45309",background:"#fef3c7",padding:"1px 6px",borderRadius:4}}>+ Nouveau client</span>}
                    </div>
                    <div style={{fontSize:11,color:DS.mid}}>{r.row[4]?new Date(r.row[4]).toLocaleDateString("fr"):"—"} · {r.row[16]||"Type ?"}</div>
                  </div>
                </label>
              );
            })}
          </div>
          <div style={{display:"flex",gap:10,paddingTop:8,borderTop:"1px solid "+DS.border}}>
            <button onClick={()=>setStatus("idle")} style={{flex:1,padding:"11px",borderRadius:DS.radiusSm,background:DS.light,border:"1px solid "+DS.border,cursor:"pointer",fontWeight:700,fontSize:13,color:DS.mid,fontFamily:"inherit"}}>← Retour</button>
            <button onClick={doImport} disabled={selected.length===0} style={{flex:2,padding:"11px",borderRadius:DS.radiusSm,background:selected.length>0?DS.blue:"#9ca3af",border:"none",cursor:selected.length>0?"pointer":"default",fontWeight:700,fontSize:13,color:"#fff",fontFamily:"inherit"}}>Importer {selected.length} passage{selected.length!==1?"s":""}</button>
          </div>
        </div>
      )}
      {status==="importing"&&(<div style={{textAlign:"center",padding:40}}><div style={{fontSize:32,marginBottom:12}}>💾</div><div style={{fontWeight:700,color:DS.dark}}>Import en cours…</div></div>)}
      {status==="done"&&(
        <div style={{textAlign:"center",padding:32,display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
          <div style={{fontSize:48}}>✅</div>
          <div style={{fontWeight:800,fontSize:16,color:DS.green}}>Import terminé !</div>
          <div style={{fontSize:13,color:DS.mid}}>{selected.length} passages importés</div>
          <button onClick={onClose} style={{marginTop:8,padding:"11px 24px",borderRadius:DS.radiusSm,background:DS.blue,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,color:"#fff",fontFamily:"inherit"}}>Fermer</button>
        </div>
      )}
    </Modal>
  );
}

export default function App() {
  const [carnetCode] = useState(()=>{ try { const p = new URLSearchParams(window.location.search); return p.get("carnet")||""; } catch { return ""; } });
  const [loggedIn, setLoggedIn] = useState(false);
  const { online } = useOnlineStatus();
  const [page, setPage] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [passages, setPassages] = useState([]);
  const [livraisons, setLivraisons] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [stock, setStock] = useState({});
  const [showStock, setShowStock] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [contrats, setContrats] = useState({});
  const [versements, setVersements] = useState({});
  const [retardsCarnet, setRetardsCarnet] = useState({});
  const [ready, setReady] = useState(false);
  const [ficheClient, setFicheClient] = useState(null);
  const [showFormClient, setShowFormClient] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [showFormPassage, setShowFormPassage] = useState(false);
  const [defaultClientId, setDefaultClientId] = useState("");
  const [editPassage, setEditPassage] = useState(null);
  const [showFormLivraison, setShowFormLivraison] = useState(false);
  const [defaultLivraisonClientId, setDefaultLivraisonClientId] = useState("");
  const [showFormRdv, setShowFormRdv] = useState(false);
  const [editRdv, setEditRdv] = useState(null);
  const [showModalAlertes, setShowModalAlertes] = useState(false);
  const [dismissedAlertes, setDismissedAlertes] = useState(()=>{ try{ return JSON.parse(localStorage.getItem("briblue_dismissed_alertes")||"[]"); }catch{return [];} });
  const dismissAlerte = (clientId) => { setDismissedAlertes(prev=>{ const next=[...new Set([...prev,clientId])]; try{ localStorage.setItem("briblue_dismissed_alertes", JSON.stringify(next)); }catch{ /* noop */ } return next; }); };
  const prevTaskCount = useRef(0);
  const isMobile = useIsMobile();

  useEffect(()=>{
    setupPWA();
    try { if(sessionStorage.getItem("bb_auth")==="1") setLoggedIn(true); } catch { /* noop */ }
    // S'assurer d'avoir un utilisateur Firebase pour les uploads Storage
    if (!auth.currentUser) signInAnonymously(auth).catch(()=>{});
  },[]);

  useEffect(()=>{
    const onVis = () => { if (document.visibilityState === 'hidden') { try { flushPendingNow(); } catch { /* noop */ } } };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', ()=>{ try { flushPendingNow(); } catch { /* noop */ }});
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const applyLocalData = useCallback(() => {
    const clientsData   = readLS("bb_clients_v2",   CLIENTS_INIT);
    const passagesData  = readLS("bb_passages_v2",  PASSAGES_INIT);
    const livraisonsData = readLS("bb_livraisons_v1", []);
    const rdvsData      = readLS("bb_rdvs_v1",      []);
    const stockData     = readLS("bb_stock_v1",     {});
    const contratsData  = readLS("bb_contrats_v1",  {});
    const versementsData = readLS("bb_versements_v1", {});
    const retardsCarnetData = readLS("bb_retards_carnet_v1", {});
    const sWithDefaults = {...Object.fromEntries(PRODUITS_DEFAUT.map(nom=>[nom,0])), ...stockData};
    const cMigrated = clientsData.map(cl => ({...cl, moisParMois: migrateMois(cl.moisParMois||cl.saisons), photoPiscine: cl.photoPiscine||"", prixPassageE: cl.prixPassageE||0, prixPassageC: cl.prixPassageC||0}));
    setClients(cMigrated); setPassages(passagesData); setLivraisons(livraisonsData);
    setRdvs(rdvsData); setStock(sWithDefaults); setContrats(contratsData); setVersements(versementsData); setRetardsCarnet(retardsCarnetData);
  }, []);

  useEffect(()=>{
    if(!loggedIn || _BB_BOOT_DONE) return;
    _BB_BOOT_DONE = true;

    // Affichage immédiat depuis localStorage (0 ms réseau)
    applyLocalData();
    setReady(true);

    // Réconciliation Firebase en arrière-plan
    reconcileOnBoot().then(() => applyLocalData()).catch(() => {});
  },[loggedIn, applyLocalData]);

  const saveClients   = useCallback((data) => save("bb_clients_v2",    data), []);
  const savePassages  = useCallback((data) => save("bb_passages_v2",   data), []);
  const saveLivraisonsList = useCallback((data) => save("bb_livraisons_v1", data), []);
  const saveRdvsList  = useCallback((data) => save("bb_rdvs_v1",       data), []);
  const saveStock     = useCallback((data) => save("bb_stock_v1",      data), []);
  const saveContrats  = useCallback((data) => save("bb_contrats_v1",   data), []);
  const saveVersements = useCallback((data) => save("bb_versements_v1", data), []);
  const saveRetardsCarnet = useCallback((data) => save("bb_retards_carnet_v1", data), []);

  useEffect(()=>{
    if(!ready) return;
    const interval = setInterval(async()=>{
      const ct = await load("bb_contrats_v1", {});
      setContrats(prev => {
        const keys = Object.keys(ct);
        const newSig = keys.map(k=>ct[k]).find(c =>
          (c.statut === "signe_client" || c.statut === "signe_complet") &&
          (!prev[keys.find(k=>ct[k]===c)] || prev[keys.find(k=>ct[k]===c)]?.statut !== c.statut)
        );
        if (newSig) {
          playNotifSound();
          const cli = clients.find(cl => cl.id === newSig.clientId);
          const nomCli = cli?.nom || newSig.clientId;
          const isComplet = newSig.statut === "signe_complet";
          toastInfo(isComplet ? `✅ Contrat co-signé par ${nomCli} !` : `📝 ${nomCli} a signé son contrat — votre signature est requise.`);
          sendLocalNotification(
            isComplet ? "✅ Contrat co-signé !" : "📝 Signature requise",
            isComplet ? `${nomCli} a co-signé le contrat.` : `${nomCli} a signé — votre tour !`,
            { tag: "briblue-contrat-" + newSig.clientId, requireInteraction: !isComplet }
          );
        }
        return ct;
      });
    }, 10000);
    return ()=>clearInterval(interval);
  },[ready, clients]);

  useEffect(()=>{
    if(!ready) return;
    const currentTasks = clients.reduce((a,c)=>{
      const prevE=getEntretienMois(c.moisParMois||c.saisons,MOIS_NOW);const prevC=getControleMois(c.moisParMois||c.saisons,MOIS_NOW);
      const effE=passages.filter(p=>p.clientId===c.id&&new Date(p.date).getMonth()+1===MOIS_NOW&&new Date(p.date).getFullYear()===YEAR_NOW&&isEntretienType(p.type)).length;
      const effC=passages.filter(p=>p.clientId===c.id&&new Date(p.date).getMonth()+1===MOIS_NOW&&new Date(p.date).getFullYear()===YEAR_NOW&&isControleType(p.type)).length;
      return a+Math.max(0,prevE-effE)+Math.max(0,prevC-effC);
    },0);
    if(prevTaskCount.current>0 && currentTasks>prevTaskCount.current) {
      playNotifSound();
      const diff = currentTasks - prevTaskCount.current;
      sendLocalNotification("🔧 Nouvelles tâches BRIBLUE", `${diff} nouveau${diff>1?"x":""} passage${diff>1?"s":""} à effectuer ce mois.`, { tag: "briblue-taches", silent: false });
    }
    prevTaskCount.current=currentTasks;
  },[clients,passages,ready]);

  const handleLogin = useCallback(()=>{
    try{sessionStorage.setItem("bb_auth","1");}catch{ /* noop */ }
    // Connexion anonyme Firebase pour autoriser les uploads Firebase Storage
    if (!auth.currentUser) signInAnonymously(auth).catch(()=>{});
    setLoggedIn(true);
  },[]);
  const handleLogout = useCallback(()=>{ try{sessionStorage.removeItem("bb_auth");}catch{ /* noop */ } setLoggedIn(false);setReady(false);setClients([]);setPassages([]);setLivraisons([]);setRdvs([]); },[]);

  const saveClient = useCallback(c=>{
    setClients(prev=>{ const next=prev.find(x=>x.id===c.id)?prev.map(x=>x.id===c.id?c:x):[...prev,c]; saveClients(next); return next; });
    const existing = clients.find(x=>x.id===c.id);
    if (existing) {
      const contractId = `CT-${c.id}`;
      setContrats(prev=>{
        if (!prev[contractId]) return prev;
        const old = prev[contractId];
        // Ne jamais effacer les signatures si le contrat est déjà signé (partiellement ou totalement)
        if (old.statut === "signe_client" || old.statut === "signe_complet") {
          return prev;
        }
        const next = {...prev, [contractId]: { clientId: c.id, statut: "reset", signatureClient: "", signaturePrestataire: "", signedAt: null }, "__archives__": (prev["__archives__"]||[])};
        saveContrats(next);
        return next;
      });
    }
    setShowFormClient(false);setEditClient(null);setFicheClient(c);
  },[saveClients, clients, saveContrats]);

  const deleteClient = useCallback(id=>{ showConfirm("Supprimer ce client et tous ses passages ?", ()=>{ setClients(prev=>{ const next=prev.filter(x=>x.id!==id); saveClients(next); return next; }); setPassages(prev=>{ const next=prev.filter(x=>x.clientId!==id); savePassages(next); return next; }); setFicheClient(null); }); },[saveClients,savePassages]);

  const savePassage = useCallback(async p=>{
    const existing = passages.find(x=>x.id===p.id);
    if(existing?.statut==="validee" && p.statut!=="validee"){ toastError("Cette intervention est validée et ne peut plus être modifiée."); return; }
    const raw = passages.find(x=>x.id===p.id) ? passages.map(x=>x.id===p.id?p:x) : [...passages, p];
    // Migrer TOUTES les photos base64 restantes vers IDB avant la sauvegarde.
    // Cela protège aussi les anciens passages qui n'avaient pas encore été migrés.
    const next = await Promise.all(raw.map(extractPassagePhotos));
    setPassages(next);
    await savePassages(next);
    setShowFormPassage(false);setEditPassage(null);
  },[savePassages, passages]);

  const updatePassageRapportStatus = useCallback(async (passageMaj) => {
    const next = passages.map(x => x.id === passageMaj.id ? { ...x, ...passageMaj } : x);
    setPassages(next);
    await savePassages(next);
  }, [savePassages, passages]);

  const deletePassage = useCallback(async id=>{
    const p = passages.find(x=>x.id===id);
    if(p?.statut==="validee"){ toastError("Impossible de supprimer une intervention validée."); return; }
    const next = passages.filter(x=>x.id!==id);
    setPassages(next);
    await savePassages(next);
  },[savePassages, passages]);

  const validerPassage = useCallback(async id=>{
    const next = passages.map(x=>x.id===id?{...x,statut:"validee",ok:true,valideAt:new Date().toISOString()}:x);
    setPassages(next); await savePassages(next);
  },[savePassages, passages]);

  const updateStatutPassage = useCallback(async (id, statut)=>{
    const next = passages.map(x=>x.id===id?{...x,statut}:x);
    setPassages(next); await savePassages(next);
  },[savePassages, passages]);

  const openAddPassageFromClient = useCallback(cid=>{ setEditPassage(null);setDefaultClientId(cid);setShowFormPassage(true); },[]);
  const openEditPassage = useCallback(p=>{ setEditPassage(p);setDefaultClientId(p.clientId);setShowFormPassage(true); },[]);

  const saveLivraison = useCallback(l=>{
    setLivraisons(prev=>{ const next=prev.find(x=>x.id===l.id)?prev.map(x=>x.id===l.id?l:x):[...prev,l]; saveLivraisonsList(next); return next; });
    if (l.produits?.length > 0) {
      setStock(prev => { const next = {...prev}; l.produits.forEach(p => { if(next[p] !== undefined) next[p] = Math.max(0, (next[p]||0) - 1); }); saveStock(next); return next; });
    }
  },[saveLivraisonsList, saveStock]);

  const deleteLivraison = useCallback(id=>{ setLivraisons(prev=>{ const next=prev.filter(x=>x.id!==id); saveLivraisonsList(next); return next; }); },[saveLivraisonsList]);
  const updateStatutLivraison = useCallback((id,statut)=>{ setLivraisons(prev=>{ const next=prev.map(x=>x.id===id?{...x,statut}:x); saveLivraisonsList(next); return next; }); },[saveLivraisonsList]);
  const updateStock = useCallback((produit, qty) => { setStock(prev=>{ const next={...prev,[produit]:qty}; saveStock(next); return next; }); },[saveStock]);
  const addProduitStock = useCallback((nom) => { setStock(prev=>{ const next={...prev,[nom]:prev[nom]??0}; saveStock(next); return next; }); },[saveStock]);
  const deleteProduitStock = useCallback((nom) => { setStock(prev=>{ const n={...prev}; delete n[nom]; saveStock(n); return n; }); },[saveStock]);
  const nbStockBas = useMemo(()=>Object.values(stock).filter(q=>q<=2).length,[stock]);

  const handleImport = useCallback((newClients, newPassages) => {
    setClients(prev => { const next = [...prev, ...newClients]; saveClients(next); return next; });
    setPassages(prev => { const next = [...prev, ...newPassages]; savePassages(next); return next; });
    setShowImport(false);
  }, [saveClients, savePassages]);

  const saveRdv = useCallback(r=>{ setRdvs(prev=>{ const next=prev.find(x=>x.id===r.id)?prev.map(x=>x.id===r.id?r:x):[...prev,r]; saveRdvsList(next); return next; }); setShowFormRdv(false);setEditRdv(null); },[saveRdvsList]);
  const deleteRdv = useCallback(id=>{ setRdvs(prev=>{ const next=prev.filter(x=>x.id!==id); saveRdvsList(next); return next; }); },[saveRdvsList]);
  const openAddClient = useCallback(()=>{ setEditClient(null); setShowFormClient(true); },[]);

  const handleToggleRetardCarnet = useCallback((key, visible) => {
    setRetardsCarnet(prev => {
      const next = { ...prev };
      if (visible) next[key] = true; else delete next[key];
      saveRetardsCarnet(next);
      return next;
    });
  }, [saveRetardsCarnet]);

  const handleToggleVersement = useCallback((key, paid) => {
    setVersements(prev => {
      const next = { ...prev };
      if (paid) next[key] = true; else delete next[key];
      saveVersements(next);
      return next;
    });
  }, [saveVersements]);

  const nbAlertes = useMemo(()=>clients.filter(c=>alerteClient(c,passages)!=="ok"&&!dismissedAlertes.includes(c.id)).length,[clients,passages,dismissedAlertes]);

  const iosIndicator = IS_IOS ? (
    <div style={{position:"fixed",bottom:4,right:4,zIndex:99999,fontSize:9,color:"rgba(8,145,178,0.5)",fontWeight:700,pointerEvents:"none"}}>iOS ✓</div>
  ) : null;

  if(carnetCode) return <><GlobalStyles/><CarnetPublic code={carnetCode} allClients={clients.length?clients:CLIENTS_INIT} allPassages={passages.length?passages:PASSAGES_INIT}/></>;

  if(!loggedIn) return <><GlobalStyles/>{iosIndicator}<ToastContainer/><ConfirmModal/><LoginScreen onLogin={handleLogin}/></>;

  if(!ready) return (
    <><GlobalStyles/>
    <div style={{height:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.45)",gap:16,fontFamily:"'Inter', -apple-system, system-ui, sans-serif"}}>
      <div className="scale-in" style={{width:80,height:80,borderRadius:24,background:"#0891b2",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 12px 40px rgba(12,18,34,0.35)"}}>{Ico.wave(42,"white")}</div>
      <div style={{fontWeight:900,fontSize:24,color:DS.blue,letterSpacing:-0.5}}>BRIBLUE</div>
      <div style={{color:DS.mid,fontSize:13}}>Chargement…</div>
    </div></>
  );

  const NAV = [
    { id:"dashboard",     l:"Accueil",      icon:(a)=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?DS.blue:"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V14h6v7"/></svg> },
    { id:"clients",       l:"Clients",      icon:(a)=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?DS.blue:"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></svg> },
    { id:"interventions", l:"Rapports",     icon:(a)=><IconFiche size={22} color={a?DS.blue:"#94a3b8"}/> },
    { id:"rdv",           l:"Rendez-vous",  icon:(a)=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?"#818cf8":"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="15" r="2.5" fill={a?"#818cf8":"none"}/></svg> },
    { id:"documents",     l:"Documents",    icon:(a)=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?"#059669":"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg> },
    { id:"gestion",       l:"Gestion",      icon:(a)=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?"#7c3aed":"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/><line x1="14" y1="15" x2="18" y2="15"/></svg> },
  ];

  const PAGE_LABELS = { dashboard:`Bonjour Dorian 👋`, clients:"Clients", passages:"Rapports", interventions:"Rapports", rdv:"Rendez-vous", documents:"Documents", gestion:"Gestion" };

  return (
    <>
    <GlobalStyles/>
    <ToastContainer/>
    <ConfirmModal/>
    <div style={{minHeight:"100dvh",background:"rgba(255,255,255,0.45)",fontFamily:"'Inter', -apple-system, system-ui, sans-serif",maxWidth:isMobile?640:1280,margin:"0 auto",position:"relative",display:"flex",flexDirection:"column",overflowX:"hidden",width:"100%"}}>
      {/* HEADER — paddingTop englobe la safe area (Dynamic Island / encoche iPhone) */}
      <div style={{background:"rgba(255,255,255,0.45)",paddingTop:isMobile?"max(10px, env(safe-area-inset-top, 0px))":"10px",paddingBottom:"10px",paddingLeft:isMobile?"14px":"28px",paddingRight:isMobile?"14px":"28px",display:"flex",alignItems:"center",gap:isMobile?8:14,position:"sticky",top:0,zIndex:50,boxShadow:"0 4px 16px rgba(6,182,212,0.15)",width:"100%",boxSizing:"border-box"}}>
        <button onClick={()=>setPage("dashboard")} style={{background:"rgba(255,255,255,0.45)",border:"none",padding:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:isMobile?44:42,height:isMobile?44:42,borderRadius:14,flexShrink:0,boxShadow:DS.nmShadow}}>
          {Ico.wave(isMobile?22:20,"#0891b2")}
        </button>
        <div style={{width:9,height:9,borderRadius:"50%",background:online?"#34d399":"#f87171",boxShadow:online?"0 0 0 3px rgba(52,211,153,0.25)":"0 0 0 3px rgba(248,113,113,0.25)",flexShrink:0}}/>
        <div style={{flex:1}}/>
        <div style={{display:"flex",gap:isMobile?6:10,alignItems:"center",flexShrink:0}}>
          {!isMobile&&(
            <button onClick={()=>setShowImport(true)} style={{display:"flex",alignItems:"center",gap:7,padding:"0 16px",height:40,borderRadius:20,background:"rgba(255,255,255,0.45)",border:"none",cursor:"pointer",flexShrink:0,fontFamily:"inherit",boxShadow:DS.nmShadow}}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              <span style={{fontSize:12,fontWeight:600,color:"#64748b"}}>Import</span>
            </button>
          )}
          <button onClick={()=>setShowStock(true)} title="Stock" style={{position:"relative",width:isMobile?40:undefined,height:isMobile?40:40,padding:isMobile?0:"0 14px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,borderRadius:isMobile?12:20,background:"linear-gradient(135deg,#059669,#10b981)",border:"none",cursor:"pointer",flexShrink:0,fontFamily:"inherit",boxShadow:"3px 3px 10px rgba(5,150,105,0.4),-2px -2px 6px rgba(255,255,255,0.6)"}}>
            <svg width={isMobile?18:15} height={isMobile?18:15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V21H3V8"/><path d="M23 3H1v5h22V3z"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            {!isMobile&&<span style={{fontSize:12,fontWeight:700,color:"#fff"}}>Stock</span>}
            {nbStockBas>0&&<span style={{position:"absolute",top:-5,right:-5,minWidth:17,height:17,borderRadius:9,background:"#ef4444",color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",boxShadow:"0 2px 6px rgba(239,68,68,0.5)"}}>{nbStockBas}</span>}
          </button>
          <button onClick={()=>{setDefaultLivraisonClientId("");setShowFormLivraison(true);}} title="Livraison" style={{width:isMobile?40:undefined,height:isMobile?40:40,padding:isMobile?0:"0 14px",display:"flex",alignItems:"center",justifyContent:"center",gap:6,borderRadius:isMobile?12:20,background:"linear-gradient(135deg,#f59e0b,#f97316)",border:"none",cursor:"pointer",flexShrink:0,fontFamily:"inherit",boxShadow:"3px 3px 10px rgba(245,158,11,0.4),-2px -2px 6px rgba(255,255,255,0.6)"}}>
            <svg width={isMobile?18:15} height={isMobile?18:15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            {!isMobile&&<span style={{fontSize:12,fontWeight:700,color:"#fff"}}>Livraison</span>}
          </button>
          {isMobile&&(
            <button onClick={openAddClient} title="Nouveau client" style={{width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:12,background:"linear-gradient(135deg,#7c3aed,#4f46e5)",border:"none",cursor:"pointer",flexShrink:0,boxShadow:"3px 3px 10px rgba(79,70,229,0.4),-2px -2px 6px rgba(255,255,255,0.6)"}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="3" x2="19" y2="9"/><line x1="16" y1="6" x2="22" y2="6"/></svg>
            </button>
          )}
          <button onClick={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} style={{width:isMobile?40:undefined,height:isMobile?40:40,padding:isMobile?0:"0 18px",display:"flex",alignItems:"center",justifyContent:"center",gap:7,borderRadius:isMobile?12:20,background:"linear-gradient(135deg,#06b6d4,#0891b2)",border:"none",cursor:"pointer",flexShrink:0,fontFamily:"inherit",boxShadow:"3px 3px 10px rgba(8,145,178,0.4),-2px -2px 6px rgba(255,255,255,0.6)"}}>
            <svg width={isMobile?18:15} height={isMobile?18:15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
            {!isMobile&&<span style={{fontSize:12,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>Rapport</span>}
          </button>
          <button onClick={handleLogout} title="Déconnexion" style={{width:isMobile?40:40,height:isMobile?40:40,borderRadius:12,background:"linear-gradient(135deg,#be123c,#e11d48)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"3px 3px 10px rgba(190,18,60,0.35),-2px -2px 6px rgba(255,255,255,0.6)"}}>
            <svg width={isMobile?17:15} height={isMobile?17:15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL */}
      {isMobile ? (
        <>
          {page!=="dashboard"&&(<div style={{padding:"16px 16px 4px"}}><h2 style={{margin:0,fontSize:22,fontWeight:900,color:DS.dark,letterSpacing:-0.5}}>{PAGE_LABELS[page]}</h2></div>)}
          <div style={{padding:"6px 16px calc(90px + env(safe-area-inset-bottom,0px))",overflowX:"hidden"}}>
            {page==="dashboard"&&<Dashboard clients={clients} passages={passages} rdvs={rdvs} onClientClick={setFicheClient} onAddPassage={()=>{setDefaultClientId("");setShowFormPassage(true);}} onAddLivraison={()=>{setDefaultLivraisonClientId("");setShowFormLivraison(true);}} onAddClient={openAddClient} onAddRdv={()=>{setEditRdv(null);setShowFormRdv(true);}} onEditPassage={openEditPassage} onEditRdv={r=>{setEditRdv(r);setShowFormRdv(true);}}/>}
            {page==="clients"&&<PageClients clients={clients} passages={passages} contrats={contrats} onUpdateContrat={(contractId,data)=>setContrats(prev=>{ const next={...prev,[contractId]:{...prev[contractId],...data}}; saveContrats(next); return next; })} onClientClick={setFicheClient} onAdd={openAddClient}/>}
            {(page==="passages"||page==="interventions")&&<PagePassages clients={clients} passages={passages} onAdd={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} onDelete={deletePassage} onEdit={openEditPassage} onUpdatePassageStatus={updatePassageRapportStatus} onAddClient={openAddClient} onValider={validerPassage} onChangeStatut={updateStatutPassage}/>}
            {page==="rdv"&&<PageRdv clients={clients} rdvs={rdvs} onAdd={()=>{setEditRdv(null);setShowFormRdv(true);}} onEdit={r=>{setEditRdv(r);setShowFormRdv(true);}} onDelete={deleteRdv}/>}
            {page==="documents"&&<PageDocuments clients={clients} contrats={contrats} onOpenContrat={(client,contrat)=>ouvrirContrat(client,contrat?.signaturePrestataire||"",contrat?.signatureClient||"")}/>}
            {page==="gestion"&&<PageGestion clients={clients} versements={versements} onToggleVersement={handleToggleVersement} livraisons={livraisons} onUpdateStatutLivraison={updateStatutLivraison} retardsCarnet={retardsCarnet} onToggleRetardCarnet={handleToggleRetardCarnet}/>}
          </div>
        </>
      ) : (
        <div style={{display:"flex",flex:1,minHeight:0}}>
          <div style={{width:220,flexShrink:0,background:"rgba(255,255,255,0.45)",borderRight:"1px solid "+DS.border,display:"flex",flexDirection:"column",padding:"24px 12px",gap:4,position:"sticky",top:62,height:"calc(100vh - 62px)",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
            <div style={{padding:"12px 14px",borderRadius:16,background:"rgba(255,255,255,0.45)",boxShadow:DS.nmShadowSm,marginBottom:16}}>
              <div style={{fontSize:9,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Aperçu</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:DS.mid}}>Clients</span><span style={{fontSize:13,fontWeight:800,color:DS.dark}}>{clients.length}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:DS.mid}}>Ce mois</span><span style={{fontSize:13,fontWeight:800,color:DS.blue}}>{passages.filter(p=>new Date(p.date).getMonth()+1===MOIS_NOW&&new Date(p.date).getFullYear()===YEAR_NOW).length} pass.</span></div>
                {nbAlertes>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:DS.mid}}>Alertes</span><span style={{fontSize:13,fontWeight:800,color:"#ef4444"}}>{nbAlertes}</span></div>}
              </div>
            </div>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:14,border:"none",cursor:"pointer",background:page===n.id?"#eef2f7":"transparent",textAlign:"left",fontFamily:"inherit",transition:"all .2s",width:"100%",boxShadow:page===n.id?DS.nmShadowSm:"none"}}>
                {n.icon(page===n.id)}
                <span style={{fontSize:13,fontWeight:page===n.id?700:500,color:page===n.id?DS.blue:DS.mid}}>{n.l}</span>
                {page===n.id&&<div style={{marginLeft:"auto",width:4,height:16,borderRadius:2,background:DS.blue}}/>}
              </button>
            ))}
            <div style={{marginTop:"auto",display:"flex",flexDirection:"column",gap:8,paddingTop:16,borderTop:"1px solid "+DS.border}}>
              <button onClick={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:14,border:"none",background:"rgba(255,255,255,0.45)",cursor:"pointer",fontFamily:"inherit",width:"100%",boxShadow:DS.nmShadowSm}}>
                {Ico.clipboard(14,DS.blue)}<span style={{fontSize:12,fontWeight:600,color:DS.mid}}>Nouveau passage</span>
              </button>
              <button onClick={openAddClient} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:14,border:"none",background:"rgba(255,255,255,0.45)",cursor:"pointer",fontFamily:"inherit",width:"100%",boxShadow:DS.nmShadowSm}}>
                {Ico.userPlus(14,DS.purple)}<span style={{fontSize:12,fontWeight:600,color:DS.purple}}>Nouveau client</span>
              </button>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",minWidth:0}}>
            <div style={{padding:"20px 32px 80px",maxWidth:860,margin:"0 auto"}}>
              {page!=="dashboard"&&(<div style={{marginBottom:16}}><h2 style={{margin:0,fontSize:26,fontWeight:900,color:DS.dark,letterSpacing:-0.5}}>{PAGE_LABELS[page]}</h2></div>)}
              {page==="dashboard"&&<Dashboard clients={clients} passages={passages} rdvs={rdvs} onClientClick={setFicheClient} onAddPassage={()=>{setDefaultClientId("");setShowFormPassage(true);}} onAddLivraison={()=>{setDefaultLivraisonClientId("");setShowFormLivraison(true);}} onAddClient={openAddClient} onAddRdv={()=>{setEditRdv(null);setShowFormRdv(true);}} onEditPassage={openEditPassage} onEditRdv={r=>{setEditRdv(r);setShowFormRdv(true);}}/>}
              {page==="clients"&&<PageClients clients={clients} passages={passages} contrats={contrats} versements={versements} onUpdateContrat={(contractId,data)=>setContrats(prev=>{ const next={...prev,[contractId]:{...prev[contractId],...data}}; saveContrats(next); return next; })} onToggleVersement={handleToggleVersement} onClientClick={setFicheClient} onAdd={openAddClient}/>}
              {(page==="passages"||page==="interventions")&&<PagePassages clients={clients} passages={passages} onAdd={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} onDelete={deletePassage} onEdit={openEditPassage} onUpdatePassageStatus={updatePassageRapportStatus} onAddClient={openAddClient} onValider={validerPassage} onChangeStatut={updateStatutPassage}/>}
              {page==="rdv"&&<PageRdv clients={clients} rdvs={rdvs} onAdd={()=>{setEditRdv(null);setShowFormRdv(true);}} onEdit={r=>{setEditRdv(r);setShowFormRdv(true);}} onDelete={deleteRdv}/>}
              {page==="documents"&&<PageDocuments clients={clients} contrats={contrats} onOpenContrat={(client,contrat)=>ouvrirContrat(client,contrat?.signaturePrestataire||"",contrat?.signatureClient||"")}/>}
              {page==="gestion"&&<PageGestion clients={clients} versements={versements} onToggleVersement={handleToggleVersement} livraisons={livraisons} onUpdateStatutLivraison={updateStatutLivraison} retardsCarnet={retardsCarnet} onToggleRetardCarnet={handleToggleRetardCarnet}/>}
            </div>
          </div>
        </div>
      )}

      {/* NAV BAS mobile */}
      {isMobile && (
        <>
          <style>{`
            @keyframes navPop { 0%{transform:scale(.7) translateY(8px);opacity:0} 55%{transform:scale(1.15) translateY(-3px);opacity:1} 80%{transform:scale(0.97) translateY(0);opacity:1} 100%{transform:scale(1) translateY(0);opacity:1} }
            @keyframes navSlideIn { from{opacity:0;transform:translateX(-50%) scaleX(0.4)} to{opacity:1;transform:translateX(-50%) scaleX(1)} }
            @keyframes navBubble { 0%{transform:translateX(-50%) scale(0.5);opacity:0} 65%{transform:translateX(-50%) scale(1.06);opacity:1} 100%{transform:translateX(-50%) scale(1);opacity:1} }
            .nav-icon-active{animation:navPop .35s cubic-bezier(.34,1.56,.64,1) forwards}
            .nav-pill-active{animation:navSlideIn .28s cubic-bezier(.22,1,.36,1) forwards}
            .nav-bubble{animation:navBubble .32s cubic-bezier(.34,1.56,.64,1) forwards}
          `}</style>
          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:640,background:"rgba(228,237,246,0.96)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",display:"flex",alignItems:"flex-end",borderTopLeftRadius:22,borderTopRightRadius:22,boxShadow:"0 -2px 0 rgba(255,255,255,0.8), 0 -16px 40px rgba(100,160,200,0.25)",zIndex:50,paddingBottom:"env(safe-area-inset-bottom,0px)",borderTop:"1.5px solid rgba(255,255,255,0.85)",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)",pointerEvents:"none"}}/>
            {NAV.map(n=>{
              const active = page===n.id;
              const accentColor = n.id==="rdv" ? "#818cf8" : DS.blue;
              const gradFrom = n.id==="rdv" ? "#818cf8" : "#06b6d4";
              const gradTo = n.id==="rdv" ? "#4f46e5" : "#0891b2";
              return (
                <button key={n.id} onClick={()=>setPage(n.id)} style={{flex:1,paddingTop:8,paddingBottom:14,border:"none",cursor:"pointer",background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:2,WebkitTapHighlightColor:"transparent",outline:"none",position:"relative",minWidth:0}}>
                  {active && <div className="nav-pill-active" style={{position:"absolute",top:0,left:"50%",width:28,height:3,background:`linear-gradient(90deg,${gradFrom},${gradTo})`,borderRadius:"0 0 8px 8px",boxShadow:`0 2px 10px ${accentColor}99`}}/>}
                  {active && <div className="nav-bubble" style={{position:"absolute",top:5,left:"50%",width:50,height:38,borderRadius:14,background:`linear-gradient(150deg,${accentColor}28,${accentColor}12)`,pointerEvents:"none"}}/>}
                  <div key={active?"a":"i"} className={active?"nav-icon-active":""} style={{width:44,height:32,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:1,filter:active?`drop-shadow(0 3px 8px ${accentColor}80)`:"none",transition:"filter .25s"}}>{n.icon(active)}</div>
                  <span style={{fontSize:active?10:9,fontWeight:active?800:500,color:active?accentColor:"#96afc0",letterSpacing:active?.3:.1,transition:"all .2s",lineHeight:1,position:"relative",zIndex:1}}>{n.l}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* MODALS */}
      {ficheClient&&(()=>{
        const latest=clients.find(c=>c.id===ficheClient.id)||ficheClient;
        return <FicheClient client={latest} passages={passages} livraisons={livraisons.filter(l=>l.clientId===latest.id)} rdvs={rdvs} produitsStock={Object.keys(stock)} contrats={contrats} onUpdateContrat={(contractId,data)=>setContrats(prev=>{ const next={...prev,[contractId]:{...prev[contractId],...data}}; saveContrats(next); return next; })} onUpdateClient={c=>{ setClients(prev=>{ const next=prev.map(x=>x.id===c.id?c:x); saveClients(next); return next; }); setFicheClient(c); }} onSaveLivraison={saveLivraison} onDeleteLivraison={deleteLivraison} onUpdateStatutLivraison={updateStatutLivraison} onClose={()=>setFicheClient(null)} onEdit={()=>{setEditClient(latest);setShowFormClient(true);setFicheClient(null);}} onDelete={()=>deleteClient(latest.id)} onDeletePassage={deletePassage} onAddPassage={()=>openAddPassageFromClient(latest.id)} onEditPassage={openEditPassage} onUpdatePassageStatus={updatePassageRapportStatus} onAddRdv={()=>{setEditRdv({clientId:latest.id});setShowFormRdv(true);}} onEditRdv={r=>{setEditRdv(r);setShowFormRdv(true);}} onDeleteRdv={deleteRdv}/>;
      })()}

      {showFormClient&&<FormClient initial={editClient} clients={clients} onSave={saveClient} onClose={()=>{setShowFormClient(false);setEditClient(null);}}/>}
      {showFormPassage&&<FormPassage clients={clients} defaultClientId={defaultClientId} initial={editPassage} onSave={p=>savePassage(p)} onSaveLivraison={saveLivraison} produitsStock={Object.keys(stock)} onClose={()=>{setShowFormPassage(false);setEditPassage(null);}}/>}
      {showFormLivraison&&<FormLivraison clientId={defaultLivraisonClientId} clients={clients} produitsStock={Object.keys(stock)} onSave={l=>{saveLivraison(l);setShowFormLivraison(false);}} onClose={()=>setShowFormLivraison(false)}/>}
      {showFormRdv&&<FormRdv initial={editRdv} clients={clients} onSave={saveRdv} onClose={()=>{setShowFormRdv(false);setEditRdv(null);}}/>}
      {showImport&&<ModalImportConnecteam clients={clients} onImport={handleImport} onClose={()=>setShowImport(false)}/>}
      {showStock&&<ModalStock stock={stock} onClose={()=>setShowStock(false)} onUpdateStock={updateStock} onAddProduit={addProduitStock} onDeleteProduit={deleteProduitStock}/>}

      {showModalAlertes&&(()=>{
        const alertes = clients.filter(c=>alerteClient(c,passages)!=="ok"&&!dismissedAlertes.includes(c.id));
        return (
          <Modal title={`Alertes (${alertes.length})`} onClose={()=>setShowModalAlertes(false)}>
            {dismissedAlertes.length>0&&(
              <button onClick={()=>{ setDismissedAlertes([]); try{localStorage.removeItem("briblue_dismissed_alertes");}catch{ /* noop */ } }} style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,padding:"7px 14px",borderRadius:8,background:"rgba(255,255,255,0.4)",border:"1.5px solid #e2e8f0",cursor:"pointer",fontSize:12,fontWeight:700,color:"#64748b",fontFamily:"inherit"}}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                Restaurer {dismissedAlertes.length} alerte{dismissedAlertes.length>1?"s":""} masquée{dismissedAlertes.length>1?"s":""}
              </button>
            )}
            {alertes.length===0
              ? <div style={{textAlign:"center",color:DS.mid,padding:32,fontSize:13}}>{dismissedAlertes.length>0?"Toutes les alertes sont masquées":"Aucune alerte en cours"}</div>
              : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {alertes.map(c=>{
                  const al=alerteClient(c,passages); const col=AC[al]||AC.ok; const j=daysUntil(c.dateFin);
                  const mpm=c.moisParMois||c.saisons||{};
                  const tE=totalAnnuel(mpm,"entretien"), tC=totalAnnuel(mpm,"controle"), tot=tE+tC;
                  const cs=c.dateDebut?c.dateDebut.slice(0,10):null; const ce=c.dateFin?c.dateFin.slice(0,10):null;
                  const inC=(p)=>{const ds=String(p.date).slice(0,10);return cs&&ce?ds>=cs&&ds<=ce:new Date(p.date).getFullYear()===YEAR_NOW;};
                  const eE=passages.filter(p=>p.clientId===c.id&&inC(p)&&isEntretienType(p.type)).length;
                  const eC=passages.filter(p=>p.clientId===c.id&&inC(p)&&isControleType(p.type)).length;
                  const eff=eE+eC;
                  const pct=tot>0?Math.round(eff/tot*100):0;
                  const moisEnRetard = [];
                  for(let m=1; m<=MOIS_NOW; m++) {
                    const mv = getMoisVal(mpm, m);
                    const passM = passages.filter(p=>p.clientId===c.id && new Date(p.date).getMonth()+1===m && new Date(p.date).getFullYear()===YEAR_NOW);
                    const doneE = passM.filter(p=>isEntretienType(p.type)).length;
                    const doneC = passM.filter(p=>isControleType(p.type)).length;
                    const restE = Math.max(0, mv.entretien - doneE);
                    const restC = Math.max(0, mv.controle - doneC);
                    if(restE > 0 || restC > 0) moisEnRetard.push({m, restE, restC});
                  }
                  return (
                    <div key={c.id} style={{background:col.bg,borderRadius:DS.radius,border:"1.5px solid "+col.bd,overflow:"hidden",position:"relative"}}>
                      <button onClick={(e)=>{e.stopPropagation();dismissAlerte(c.id);}} title="Masquer" style={{position:"absolute",top:8,right:8,zIndex:2,width:26,height:26,borderRadius:8,background:"rgba(0,0,0,0.08)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} className="btn-hover">
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                      <div onClick={()=>{setShowModalAlertes(false);setFicheClient(c);}} className="card-hover" style={{cursor:"pointer"}}>
                        <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",paddingRight:40}}>
                          <Avatar nom={c.nom} size={42} photo={c.photoPiscine}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:800,fontSize:14,color:DS.dark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</div>
                            <div style={{fontSize:12,color:col.tx,fontWeight:600,marginTop:3}}>
                              {al==="rouge"?`⚠️ Contrat expire dans ${j} jour${j>1?"s":""}`
                               :al==="jaune"?`🕐 Contrat expire dans ${j} jours`
                               :`📋 Passages en retard — ${eff}/${tot} (${pct}%)`}
                            </div>
                            <div style={{display:"flex",gap:8,marginTop:5,flexWrap:"wrap"}}>
                              {tE>0&&<span style={{fontSize:11,fontWeight:700,color:eE>=tE?DS.green:DS.blue,background:eE>=tE?DS.greenSoft:DS.blueSoft,padding:"2px 7px",borderRadius:6}}>🔧 Entretiens {eE}/{tE}</span>}
                              {tC>0&&<span style={{fontSize:11,fontWeight:700,color:eC>=tC?DS.green:DS.teal,background:eC>=tC?DS.greenSoft:DS.tealSoft,padding:"2px 7px",borderRadius:6}}>💧 Contrôles {eC}/{tC}</span>}
                            </div>
                          </div>
                          <Tag color={col.tx} bg={col.bg}>{col.lbl}</Tag>
                        </div>
                        {moisEnRetard.length>0 && (
                          <div style={{borderTop:"1px solid "+col.bd,padding:"10px 16px",background:"rgba(0,0,0,0.03)"}}>
                            <div style={{fontSize:10,fontWeight:800,color:col.tx,textTransform:"uppercase",letterSpacing:.8,marginBottom:7}}>Mois en retard</div>
                            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                              {moisEnRetard.map(({m,restE,restC})=>(
                                <div key={m} style={{background:"rgba(255,255,255,0.45)",border:"1.5px solid "+col.bd,borderRadius:8,padding:"5px 9px",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                                  <span style={{fontSize:11,fontWeight:800,color:DS.dark}}>{MOIS[m]}</span>
                                  <div style={{display:"flex",gap:5}}>
                                    {restE>0&&<span style={{fontSize:10,fontWeight:700,color:DS.blue}}>🔧 {restE}</span>}
                                    {restC>0&&<span style={{fontSize:10,fontWeight:700,color:DS.teal}}>💧 {restC}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </Modal>
        );
      })()}
    </div>
    </>
  );
}