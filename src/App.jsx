// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { save, flushPendingNow, IS_IOS, reconcileOnBoot, invalidateDocCache, subscribeToRealtime, markPassageDeleted } from "./lib/storage";
import { extractPassagePhotos, migratePassagePhotosToStorage, migrateAllPassagesPhotos, migrateClientPhotoToStorage, retryPendingUploads, _getUploadQueue } from "./lib/photoStore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";

import { DS, Ico, IconFiche, CLIENTS_INIT, PASSAGES_INIT, PRODUITS_DEFAUT, PRODUITS_META_DEFAUT, MOIS, AC } from "./utils/constants";
import { migrateMois, alerteClient, getEntretienMois, getControleMois, isEntretienType, isControleType, TODAY, MOIS_NOW, YEAR_NOW, totalAnnuel, getMoisVal, daysUntil } from "./utils/helpers";
import { GlobalStyles, setupPWA, sendLocalNotification, playNotifSound, playChimeMorning, playAlertRdv, playSound, toastInfo, toastError, showConfirm, ToastContainer, ConfirmModal } from "./styles";
import { useIsMobile, useOnlineStatus, Modal, BtnPrimary, Card, Section, Avatar, Tag } from "./components/ui";
import { FormClient } from "./components/FormClient";
import { FormPassage, ouvrirContrat, envoyerContratSignature, envoyerContratPDF } from "./components/FormPassage";
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
import { PageParametres } from "./pages/PageParametres";

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
    <div style={{minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"max(24px, env(safe-area-inset-top, 24px)) 20px 24px",fontFamily:"'Inter', -apple-system, system-ui, sans-serif",background:"#f1f5f9",position:"relative",overflow:"hidden"}}>
      {/* Bande couleur top */}
      <div style={{position:"fixed",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,#0891b2,#06b6d4,#8b5cf6)"}}/>
      <div className="scale-in" style={{marginBottom:28,display:"flex",flexDirection:"column",alignItems:"center",gap:12,position:"relative"}}>
        {/* Logo principal — carré arrondi avec triple vague */}
        <div style={{width:84,height:84,borderRadius:24,background:"linear-gradient(145deg,#0891b2,#0369a1)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 32px rgba(8,145,178,0.35)"}}>
          {Ico.wave(44,"white")}
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontWeight:900,fontSize:32,color:"#0f172a",letterSpacing:-1.5}}>BRIBLUE</div>
          <div style={{color:"#64748b",fontSize:11,marginTop:3,fontWeight:500,letterSpacing:0.2}}>Création · Traitement de l'eau · Installation · Dépannage</div>
        </div>
      </div>
      <div className="fade-in" style={{width:"100%",maxWidth:400,borderRadius:18,padding:28,background:"#ffffff",boxShadow:"0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",border:"1px solid #e2e8f0",position:"relative"}}>
        <div style={{marginBottom:22}}>
          <div style={{fontWeight:700,fontSize:18,color:"#0f172a",letterSpacing:"-0.02em"}}>Connexion</div>
          <div style={{color:"#64748b",fontSize:13,marginTop:3,fontWeight:400}}>Accès réservé</div>
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

// ─────────────────────────────────────────────────────────────────────────────
// STOCK PRODUITS — redesign complet
// ─────────────────────────────────────────────────────────────────────────────
const STOCK_UNITES    = ["unité","flacon","sac","carton","L","kg","boîte"];
const STOCK_CATS = [
  { key:"tous",       label:"Tous",       color:"#64748b", bg:"#f1f5f9" },
  { key:"bas",        label:"⚠️ Bas",      color:"#dc2626", bg:"#fee2e2" },
  { key:"traitement", label:"Traitement", color:"#0891b2", bg:"#e0f2fe" },
  { key:"entretien",  label:"Entretien",  color:"#059669", bg:"#dcfce7" },
  { key:"matériel",   label:"Matériel",   color:"#7c3aed", bg:"#ede9fe" },
];
const CAT_COLORS = { traitement:"#0891b2", entretien:"#059669", matériel:"#7c3aed" };

function ModalStock({ stock, stockMeta={}, onClose, onUpdateStock, onUpdateMeta, onAddProduit, onDeleteProduit }) {
  const isMobile = useIsMobile();
  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState("tous");
  const [editingQty,  setEditingQty]  = useState(null);
  const [qtyDraft,    setQtyDraft]    = useState("");
  const [expandedProd,setExpandedProd]= useState(null);
  const [newNom,      setNewNom]      = useState("");
  const [newUnite,    setNewUnite]    = useState("flacon");
  const [newCat,      setNewCat]      = useState("traitement");
  const [showAddForm, setShowAddForm] = useState(false);
  const qtyInputRef = useRef(null);

  const getMeta = (nom) => ({
    unite: "unité", seuil: 2, categorie: "traitement",
    ...(PRODUITS_META_DEFAUT[nom] || {}),
    ...(stockMeta[nom] || {}),
  });
  const setMeta = (nom, patch) => onUpdateMeta(nom, { ...getMeta(nom), ...patch });

  const produits = Object.keys(stock);
  const basCount = produits.filter(p => (stock[p]??0) <= getMeta(p).seuil).length;

  const filtered = [...produits]
    .filter(p => {
      if (search && !p.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter === "bas")    return (stock[p]??0) <= getMeta(p).seuil;
      if (catFilter !== "tous")   return getMeta(p).categorie === catFilter;
      return true;
    })
    .sort((a, b) => {
      const aLow = (stock[a]??0) <= getMeta(a).seuil;
      const bLow = (stock[b]??0) <= getMeta(b).seuil;
      if (aLow !== bLow) return aLow ? -1 : 1;
      return a.localeCompare(b, "fr");
    });

  const startQtyEdit = (nom) => {
    setEditingQty(nom);
    setQtyDraft(String(stock[nom] ?? 0));
    setTimeout(() => qtyInputRef.current?.focus(), 30);
  };
  const saveQty = (nom) => {
    const n = parseInt(qtyDraft, 10);
    if (!isNaN(n) && n >= 0) onUpdateStock(nom, n);
    setEditingQty(null);
  };

  const handleAdd = () => {
    if (!newNom.trim()) return;
    onAddProduit(newNom.trim());
    onUpdateMeta(newNom.trim(), { unite: newUnite, seuil: 2, categorie: newCat });
    setNewNom(""); setShowAddForm(false);
  };

  // ── Contenu partagé desktop + mobile ──────────────────────────────────────
  const inner = (
    <>
      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
        <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#0891b2,#0e7490)",
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:17,fontWeight:800,color:"#0f172a"}}>Stock produits</div>
          <div style={{fontSize:11,color:"#64748b",marginTop:1}}>
            {produits.length} produit{produits.length>1?"s":""}
            {basCount > 0 && <span style={{marginLeft:8,color:"#dc2626",fontWeight:700}}>· ⚠️ {basCount} en rupture</span>}
          </div>
        </div>
        <button onClick={()=>setShowAddForm(s=>!s)}
          style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",
            borderRadius:20,background:"linear-gradient(135deg,#0891b2,#0e7490)",
            border:"none",cursor:"pointer",color:"#fff",fontSize:12,fontWeight:700,
            fontFamily:"inherit",boxShadow:"0 2px 8px rgba(8,145,178,0.3)",
            WebkitTapHighlightColor:"transparent"}}>
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajouter
        </button>
      </div>

      {/* ── Formulaire ajout ── */}
      {showAddForm && (
        <div style={{marginBottom:12,padding:"12px 14px",borderRadius:14,
          background:"#f0f9ff",border:"1.5px solid #bae6fd"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#0891b2",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>
            Nouveau produit
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <input value={newNom} onChange={e=>setNewNom(e.target.value)}
              placeholder="Nom du produit…" autoFocus
              onKeyDown={e=>e.key==="Enter"&&handleAdd()}
              style={{padding:"9px 12px",borderRadius:9,border:"1.5px solid #e2e8f0",
                fontSize:13,outline:"none",fontFamily:"inherit",color:"#0f172a",background:"#fff"}}/>
            <div style={{display:"flex",gap:8}}>
              <select value={newUnite} onChange={e=>setNewUnite(e.target.value)}
                style={{flex:1,padding:"8px 10px",borderRadius:9,border:"1.5px solid #e2e8f0",
                  fontSize:12,fontFamily:"inherit",background:"#fff",color:"#374151",outline:"none"}}>
                {STOCK_UNITES.map(u=><option key={u}>{u}</option>)}
              </select>
              <select value={newCat} onChange={e=>setNewCat(e.target.value)}
                style={{flex:1,padding:"8px 10px",borderRadius:9,border:"1.5px solid #e2e8f0",
                  fontSize:12,fontFamily:"inherit",background:"#fff",color:"#374151",outline:"none"}}>
                {STOCK_CATS.filter(c=>c.key!=="tous"&&c.key!=="bas").map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowAddForm(false)}
                style={{padding:"7px 14px",borderRadius:20,border:"1.5px solid #e2e8f0",
                  background:"#fff",cursor:"pointer",fontSize:12,color:"#64748b",fontFamily:"inherit"}}>
                Annuler
              </button>
              <button onClick={handleAdd} disabled={!newNom.trim()}
                style={{padding:"7px 16px",borderRadius:20,border:"none",
                  background:newNom.trim()?"#0891b2":"#e2e8f0",color:newNom.trim()?"#fff":"#94a3b8",
                  cursor:newNom.trim()?"pointer":"default",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recherche ── */}
      <div style={{position:"relative",marginBottom:10}}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
          style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Rechercher un produit…"
          style={{width:"100%",padding:"9px 12px 9px 33px",borderRadius:10,
            border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",
            fontFamily:"inherit",background:"#fafafa",boxSizing:"border-box",color:"#0f172a"}}/>
        {search && (
          <button onClick={()=>setSearch("")}
            style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
              background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:14,lineHeight:1}}>✕</button>
        )}
      </div>

      {/* ── Filtres catégorie ── */}
      <div style={{display:"flex",gap:6,flexWrap:"nowrap",overflowX:"auto",scrollbarWidth:"none",marginBottom:14,paddingBottom:2}}>
        {STOCK_CATS.map(c => {
          const active = catFilter === c.key;
          const count  = c.key==="tous" ? produits.length
            : c.key==="bas" ? basCount
            : produits.filter(p=>getMeta(p).categorie===c.key).length;
          return (
            <button key={c.key} onClick={()=>setCatFilter(c.key)}
              style={{
                flexShrink:0,padding:"5px 12px",borderRadius:20,
                border:`1.5px solid ${active?c.color:"#e2e8f0"}`,
                background:active?c.bg:"#fff",
                color:active?c.color:"#64748b",
                fontSize:11,fontWeight:active?700:500,
                cursor:"pointer",fontFamily:"inherit",
                WebkitTapHighlightColor:"transparent",
                transition:"all .12s",
              }}>
              {c.label} {count > 0 && <span style={{marginLeft:3,opacity:.7}}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* ── Liste produits ── */}
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {filtered.length === 0 && (
          <div style={{textAlign:"center",padding:"32px 20px",color:"#94a3b8",fontSize:13}}>
            {search ? `Aucun résultat pour "${search}"` : "Aucun produit dans cette catégorie"}
          </div>
        )}
        {filtered.map(nom => {
          const qty    = stock[nom] ?? 0;
          const meta   = getMeta(nom);
          const isLow  = qty <= meta.seuil;
          const pct    = meta.seuil > 0 ? Math.min(100, (qty / (meta.seuil * 3)) * 100) : 100;
          const catC   = CAT_COLORS[meta.categorie] || "#64748b";
          const isExp  = expandedProd === nom;

          return (
            <div key={nom} style={{
              borderRadius:14,
              border:`1.5px solid ${isLow?"#fca5a5":isExp?"#bae6fd":"#e2e8f0"}`,
              background:isLow?"#fff5f5":isExp?"#f0f9ff":"#fff",
              overflow:"hidden",
              transition:"border-color .15s",
            }}>
              {/* ── Ligne principale ── */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px"}}>

                {/* Dot catégorie */}
                <div style={{width:10,height:10,borderRadius:"50%",
                  background:catC,flexShrink:0,
                  boxShadow:`0 0 0 2px ${catC}33`}}/>

                {/* Nom */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#0f172a",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {nom}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                    {/* Mini barre stock */}
                    <div style={{width:44,height:4,background:"#e2e8f0",borderRadius:2,overflow:"hidden",flexShrink:0}}>
                      <div style={{
                        height:"100%",width:`${pct}%`,borderRadius:2,
                        background:isLow?"#ef4444":qty<meta.seuil*2?"#f59e0b":"#22c55e",
                        transition:"width .3s",
                      }}/>
                    </div>
                    <span style={{fontSize:9,color:isLow?"#dc2626":"#94a3b8",fontWeight:isLow?700:400}}>
                      {isLow?"⚠️ stock bas":meta.unite}
                    </span>
                  </div>
                </div>

                {/* Stepper quantité */}
                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                  <button onClick={()=>onUpdateStock(nom, Math.max(0, qty-1))}
                    style={{width:30,height:30,borderRadius:9,border:"1.5px solid #e2e8f0",
                      background:"#fff",cursor:"pointer",fontSize:18,fontWeight:700,
                      color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",
                      WebkitTapHighlightColor:"transparent"}}>−</button>

                  {editingQty === nom ? (
                    <input ref={qtyInputRef} value={qtyDraft}
                      onChange={e=>setQtyDraft(e.target.value.replace(/[^0-9]/g,""))}
                      onBlur={()=>saveQty(nom)}
                      onKeyDown={e=>{if(e.key==="Enter")saveQty(nom);if(e.key==="Escape")setEditingQty(null);}}
                      style={{width:40,textAlign:"center",border:"1.5px solid #0891b2",
                        borderRadius:8,padding:"4px",fontSize:15,fontWeight:900,
                        color:"#0891b2",outline:"none",fontFamily:"inherit",background:"#f0f9ff"}}/>
                  ) : (
                    <span onClick={()=>startQtyEdit(nom)}
                      style={{
                        minWidth:36,textAlign:"center",fontSize:17,fontWeight:900,
                        color:isLow?"#dc2626":"#0f172a",cursor:"text",
                        padding:"2px 4px",borderRadius:6,
                        border:"1.5px solid transparent",
                        transition:"border-color .15s",
                      }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor="#bae6fd"}
                      onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}>
                      {qty}
                    </span>
                  )}

                  <button onClick={()=>onUpdateStock(nom, qty+1)}
                    style={{width:30,height:30,borderRadius:9,border:"1.5px solid #bae6fd",
                      background:"#f0f9ff",cursor:"pointer",fontSize:18,fontWeight:700,
                      color:"#0891b2",display:"flex",alignItems:"center",justifyContent:"center",
                      WebkitTapHighlightColor:"transparent"}}>+</button>
                </div>

                {/* Bouton expand */}
                <button onClick={()=>setExpandedProd(isExp?null:nom)}
                  style={{width:28,height:28,borderRadius:8,border:"1.5px solid #e2e8f0",
                    background:"#fafafa",cursor:"pointer",display:"flex",alignItems:"center",
                    justifyContent:"center",flexShrink:0,WebkitTapHighlightColor:"transparent"}}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                    stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
                    style={{transform:isExp?"rotate(180deg)":"none",transition:"transform .2s"}}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>

              {/* ── Panneau étendu ── */}
              {isExp && (
                <div style={{borderTop:"1px solid #e2e8f0",padding:"12px 14px",
                  background:"#f8fafc",display:"flex",flexDirection:"column",gap:10}}>

                  {/* Unité */}
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:11,color:"#64748b",fontWeight:600,width:64,flexShrink:0}}>Unité</span>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {STOCK_UNITES.map(u=>(
                        <button key={u} onClick={()=>setMeta(nom,{unite:u})}
                          style={{padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:meta.unite===u?700:400,
                            border:`1.5px solid ${meta.unite===u?"#0891b2":"#e2e8f0"}`,
                            background:meta.unite===u?"#e0f2fe":"#fff",
                            color:meta.unite===u?"#0891b2":"#64748b",
                            cursor:"pointer",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Catégorie */}
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:11,color:"#64748b",fontWeight:600,width:64,flexShrink:0}}>Catégorie</span>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {STOCK_CATS.filter(c=>c.key!=="tous"&&c.key!=="bas").map(c=>(
                        <button key={c.key} onClick={()=>setMeta(nom,{categorie:c.key})}
                          style={{padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:meta.categorie===c.key?700:400,
                            border:`1.5px solid ${meta.categorie===c.key?c.color:"#e2e8f0"}`,
                            background:meta.categorie===c.key?c.bg:"#fff",
                            color:meta.categorie===c.key?c.color:"#64748b",
                            cursor:"pointer",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seuil d'alerte */}
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:11,color:"#64748b",fontWeight:600,width:64,flexShrink:0}}>Alerte ≤</span>
                    <div style={{display:"flex",gap:5}}>
                      {[0,1,2,3,5,10].map(v=>(
                        <button key={v} onClick={()=>setMeta(nom,{seuil:v})}
                          style={{width:32,height:28,borderRadius:8,fontSize:11,fontWeight:meta.seuil===v?800:400,
                            border:`1.5px solid ${meta.seuil===v?"#dc2626":"#e2e8f0"}`,
                            background:meta.seuil===v?"#fee2e2":"#fff",
                            color:meta.seuil===v?"#dc2626":"#64748b",
                            cursor:"pointer",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Supprimer */}
                  {!PRODUITS_DEFAUT.includes(nom) && (
                    <div style={{display:"flex",justifyContent:"flex-end",paddingTop:4}}>
                      <button onClick={()=>showConfirm(`Supprimer "${nom}" du stock ?`,()=>onDeleteProduit(nom))}
                        style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",
                          borderRadius:20,border:"1.5px solid #fca5a5",background:"#fff5f5",
                          color:"#dc2626",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit",
                          WebkitTapHighlightColor:"transparent"}}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                        </svg>
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  // ── Mobile : plein écran overlay ───────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        position:"fixed", inset:0, zIndex:300,
        background:"#f8fafc",
        display:"flex", flexDirection:"column",
        overflowY:"auto",
        WebkitOverflowScrolling:"touch",
        paddingTop:"max(env(safe-area-inset-top,0px),0px)",
        paddingBottom:"max(env(safe-area-inset-bottom,0px),16px)",
      }}>
        {/* Barre nav mobile */}
        <div style={{
          position:"sticky", top:0, zIndex:10,
          background:"#fff",
          borderBottom:"1px solid #e2e8f0",
          display:"flex", alignItems:"center", gap:10,
          padding:"12px 16px",
          boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <button onClick={onClose}
            style={{width:36,height:36,borderRadius:10,border:"1.5px solid #e2e8f0",
              background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",
              justifyContent:"center",flexShrink:0,WebkitTapHighlightColor:"transparent"}}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>Stock produits</div>
            <div style={{fontSize:10,color:"#64748b"}}>
              {Object.keys(stock).length} produits
              {(() => { const b = Object.keys(stock).filter(p=>(stock[p]??0)<=getMeta(p).seuil).length; return b>0?<span style={{color:"#dc2626",fontWeight:700}}> · ⚠️ {b}</span>:null; })()}
            </div>
          </div>
        </div>
        {/* Corps scrollable */}
        <div style={{padding:"14px 16px"}}>
          {inner}
        </div>
      </div>
    );
  }

  // ── Desktop : modal classique ────────────────────────────────────────────────
  return (
    <Modal title="Stock produits" onClose={onClose} wide>
      {inner}
    </Modal>
  );
}

// ─── MODAL IMPORT HTML INTELLIGENT ───────────────────────────────────────────
// Parse un ou plusieurs rapports HTML BRIBLUE et détecte automatiquement :
//   • rapports manquants → à créer
//   • rapports existants avec données vides → à enrichir
//   • photos / signatures manquantes → à ajouter
// Affiche un récap détaillé avant import, avec sélection par item.
function ModalImportHTML({ clients, passages, onImport, onClose }) {
  const [status, setStatus]     = useState("idle"); // idle|analyzing|preview|importing|done
  const [items, setItems]       = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [result, setResult]     = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  // ── Parser un rapport HTML BRIBLUE ──────────────────────────────────────
  const parseHTML = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Header : client, date, technicien
    let nomClient = "", dateStr = "", tech = "";
    doc.querySelectorAll(".meta-item").forEach(el => {
      const txt = el.textContent.trim();
      const val = el.querySelector("strong")?.textContent?.trim() || "";
      if (/client/i.test(txt) && !/date/i.test(txt)) nomClient = val;
      else if (/date/i.test(txt))     dateStr = val;
      else if (/technicien/i.test(txt)) tech  = val;
    });
    // Fallback texte brut
    if (!nomClient) {
      const raw = doc.body?.textContent || "";
      const m = raw.match(/Client\s+([A-ZÁÀÂÄÉÈÊËÏÎÔÙÛÜÇ][^\n\r\t]{1,40})/);
      if (m) nomClient = m[1].trim();
    }

    // Date FR "16 juin 2025" → "2025-06-16"
    const MOIS = {janvier:"01",février:"02",mars:"03",avril:"04",mai:"05",juin:"06",
      juillet:"07",août:"08",septembre:"09",octobre:"10",novembre:"11",décembre:"12"};
    const parseDateFR = (s) => {
      if (!s) return "";
      const m1 = s.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
      if (m1) { const mo = MOIS[m1[2].toLowerCase()]; if (mo) return `${m1[3]}-${mo}-${m1[1].padStart(2,"0")}`; }
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const m3 = s.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/); if (m3) return `${m3[3]}-${m3[2]}-${m3[1]}`;
      return "";
    };

    // Sections → champs par catégorie
    const secs = {};
    doc.querySelectorAll(".section").forEach(sec => {
      const t = (sec.querySelector(".section-title")?.textContent || "").toLowerCase();
      let key = "unknown";
      if (/analys|eau/.test(t))           key = "eau";
      else if (/bassin|intervention/.test(t)) key = "bassin";
      else if (/[eé]tat/.test(t))         key = "etat";
      else if (/correctif/.test(t))       key = "corr";
      else if (/cl[oô]ture/.test(t))      key = "cloture";
      else if (/produit|livr/.test(t))    key = "produits";
      else if (/signature/.test(t))       key = "signatures";
      if (!secs[key]) secs[key] = {};
      sec.querySelectorAll(".field").forEach(f => {
        const lbl = (f.querySelector(".field-label")?.textContent || "").trim().toLowerCase();
        const ve  = f.querySelector(".field-value");
        if (!lbl || !ve || ve.querySelector(".empty")) return;
        const badge = ve.querySelector(".badge");
        if (badge) { secs[key][lbl] = badge.classList.contains("ok") ? "OUI" : "NON"; return; }
        const stars = ve.querySelector(".stars");
        if (stars) { secs[key][lbl] = String((stars.textContent.match(/★/g)||[]).length); return; }
        const val = ve.textContent.trim();
        if (val && val !== "—") secs[key][lbl] = val;
      });
    });

    const eau  = secs.eau     || {};
    const bas  = secs.bassin  || {};
    const eta  = secs.etat    || {};
    const cor  = secs.corr    || {};
    const cl   = secs.cloture || {};
    const prod = secs.produits|| {};
    const clean = v => v ? v.replace(/\s*(ppm|m³|%)/gi,"").trim() : "";
    const list  = v => v ? v.split(/[,;]/).map(s=>s.trim()).filter(Boolean) : [];
    const bool  = v => v==="OUI" ? true : v==="NON" ? false : null;

    // Photos : distinguer arrivée / départ via label si possible
    let photoArrivee = "", photoDepart = "", photosRest = [];
    doc.querySelectorAll(".photo").forEach(img => {
      const src = img.getAttribute("src");
      if (!src || !/^(data:|https?)/.test(src)) return;
      // Chercher le label du parent immédiat ou frère précédent
      const lbl = (img.previousElementSibling?.textContent || "").toLowerCase() +
                  (img.closest("div")?.querySelector(".photo-label")?.textContent || "").toLowerCase();
      if (/d[eé]part/.test(lbl))       { if (!photoDepart) photoDepart = src; }
      else if (/arriv/.test(lbl))      { if (!photoArrivee) photoArrivee = src; }
      else                             { photosRest.push(src); }
    });
    // Fallback : ordre d'apparition
    const allPhotoSrcs = Array.from(doc.querySelectorAll(".photo"))
      .map(i=>i.getAttribute("src")).filter(s=>s&&/^(data:|https?)/.test(s));
    if (!photoArrivee && allPhotoSrcs.length > 0) {
      photoArrivee = allPhotoSrcs[0];
      photosRest = allPhotoSrcs.slice(1);
      if (!photoDepart && photosRest.length > 0) {
        photoDepart = photosRest[photosRest.length-1];
        photosRest = photosRest.slice(0,-1);
      }
    }
    const sigSrcs = Array.from(doc.querySelectorAll(".sig-img"))
      .map(i=>i.getAttribute("src")).filter(s=>s&&/^(data:|https?)/.test(s));

    // Produits livrés
    const produitsStr = prod["produits livrés"] || prod["produits"] || "";
    const produitsLivres = list(produitsStr);

    return {
      clientNom: nomClient,  date: parseDateFR(dateStr),  tech,
      type:         bas["type"] || "",
      ph:           clean(eau["ph"]),         chloreLibre:  clean(eau["chlore libre"]),
      alcalinite:   clean(eau["alcalinité"]), stabilisant:  clean(eau["stabilisant"]),
      tChlore:      clean(eau["taux chlore"]),tPH:          clean(eau["taux ph"]),
      tSel:         clean(eau["taux sel"]),   tPhosphate:   clean(eau["taux phosphate"]),
      qualiteEau:   eta["qualité eau"] || "",
      etatFond:     list(eta["fond"]),        etatParois:   list(eta["parois"]),
      etatLocal:    list(eta["local technique"]),
      etatBacTampon:list(eta["bac tampon"]),  etatVoletBac: list(eta["volet / bac"]),
      corrChlore:   cor["chlore"] || "",      corrPH:       cor["ph"] || "",
      corrSel:      cor["sel"] || "",         corrAlgicide: cor["algicide"] || "",
      corrPeroxyde: cor["peroxyde"] || "",    corrChloreChoc:cor["chlore choc"] || "",
      corrPhosphate:cor["phosphate"] || "",   corrAlcafix:  cor["tac +"] || "",
      corrAutre:    cor["autre"] || "",
      devis:            bool(cl["devis à faire"]),
      priseEchantillon: bool(cl["prise d'échantillon"]),
      presenceClient:   bool(cl["présence client"]),
      ressenti: cl["ressenti"] ? (parseInt(cl["ressenti"])||0) : 0,
      commentaires: cl["commentaires"] || "",
      livraisonProduits: produitsLivres.length > 0 ? true : null,
      produitsLivres,
      photoArrivee,  photos: photosRest,  photoDepart,  photosDepart: [],
      signatureTech:   sigSrcs[0] || "",
      signatureClient: sigSrcs[1] || "",
    };
  };

  // ── Analyse un lot de fichiers ───────────────────────────────────────────
  const DATA_LABELS = [
    ["ph","pH"],["chloreLibre","Chlore libre"],["alcalinite","Alcalinité"],
    ["stabilisant","Stabilisant"],["tChlore","Taux chlore"],["tPH","Taux pH"],
    ["tSel","Taux sel"],["tPhosphate","Taux phosphate"],
    ["qualiteEau","Qualité eau"],["corrChlore","Corr. chlore"],
    ["corrPH","Corr. pH"],["corrSel","Corr. sel"],["corrAlgicide","Algicide"],
    ["corrPeroxyde","Peroxyde"],["corrChloreChoc","Chlore choc"],
    ["corrPhosphate","Corr. phosphate"],["corrAlcafix","TAC+"],
    ["corrAutre","Autre correctif"],["commentaires","Commentaires"],["type","Type"],
  ];

  const matchClient = (nom) => {
    if (!nom) return null;
    const needle = nom.toLowerCase().trim();
    const slug = s => s.replace(/[^a-z]/g,"");
    return clients.find(c => {
      const n = (c.nom||"").toLowerCase().trim();
      return n === needle || n.includes(needle) || needle.includes(n) ||
        (slug(n).length >= 4 && slug(n).slice(0,6) === slug(needle).slice(0,6));
    });
  };

  const analyseFiles = async (files) => {
    setStatus("analyzing");
    const analyzed = [];
    for (const file of Array.from(files)) {
      try {
        const html = await file.text();
        const parsed = parseHTML(html);
        if (!parsed.date || !parsed.clientNom) {
          analyzed.push({ status:"error", fileName:file.name, reason:"Nom client ou date non détecté" }); continue;
        }
        const client = matchClient(parsed.clientNom);
        if (!client) {
          analyzed.push({ status:"no_client", fileName:file.name, clientNom:parsed.clientNom, date:parsed.date }); continue;
        }
        const existing = passages.find(p => p.clientId===client.id && p.date===parsed.date);
        const photoCount = [parsed.photoArrivee,...(parsed.photos||[]),parsed.photoDepart].filter(Boolean).length;

        if (!existing) {
          analyzed.push({ status:"new", fileName:file.name, client, parsed, photoCount }); continue;
        }
        // Quels champs manquent dans le passage existant ?
        const missingData = DATA_LABELS.filter(([f]) => {
          const nv = parsed[f]; const ev = existing[f];
          if (!nv || nv==="" || (Array.isArray(nv)&&!nv.length)) return false;
          return !ev || ev==="" || (Array.isArray(ev)&&!ev.length);
        }).map(([,l]) => l);

        const hasPhotoHTML = !!(parsed.photoArrivee||(parsed.photos||[]).length||parsed.photoDepart);
        const hasPhotoApp  = !!(existing.photoArrivee||(existing.photos||[]).length||existing.photoDepart);
        const missingPhotos = hasPhotoHTML && !hasPhotoApp;
        const hasSigHTML = !!parsed.signatureTech;
        const hasSigApp  = !!existing.signatureTech;
        const missingSig = hasSigHTML && !hasSigApp;

        if (!missingData.length && !missingPhotos && !missingSig) {
          analyzed.push({ status:"uptodate", fileName:file.name, client, date:parsed.date }); continue;
        }
        analyzed.push({ status:"enrich", fileName:file.name, client, date:parsed.date,
          existing, parsed, missingData, missingPhotos, missingSig, photoCount });
      } catch(e) {
        analyzed.push({ status:"error", fileName:file.name, reason:String(e) });
      }
    }
    setItems(analyzed);
    setSelected(new Set(
      analyzed.map((it,i) => ["new","enrich"].includes(it.status) ? i : null).filter(n=>n!==null)
    ));
    setStatus("preview");
  };

  // ── Import des items sélectionnés ────────────────────────────────────────
  const doImport = () => {
    setStatus("importing");
    const uid = () => Math.random().toString(36).slice(2)+Date.now().toString(36);
    const ALL_FIELDS = ["ph","chloreLibre","alcalinite","stabilisant","tChlore","tPH","tSel","tPhosphate",
      "qualiteEau","etatFond","etatParois","etatLocal","etatBacTampon","etatVoletBac",
      "corrChlore","corrPH","corrSel","corrAlgicide","corrPeroxyde","corrChloreChoc",
      "corrPhosphate","corrAlcafix","corrAutre","devis","priseEchantillon","presenceClient",
      "ressenti","commentaires","type","livraisonProduits","produitsLivres"];
    const updated = [...passages];
    let added=0, enriched=0, photosAdded=0;
    for (const i of [...selected]) {
      const it = items[i];
      if (it.status === "new") {
        updated.push({ id:uid(), ok:true, rapportStatut:"cree",
          photos:[], photosDepart:[], ...it.parsed, clientId:it.client.id, importedFromHTML:true });
        added++;
        if (it.photoCount>0) photosAdded += it.photoCount;
      } else if (it.status === "enrich") {
        const idx = updated.findIndex(p => p.id === it.existing.id);
        if (idx<0) continue;
        const ex = updated[idx];
        const patch = {};
        for (const f of ALL_FIELDS) {
          const nv=it.parsed[f]; const ev=ex[f];
          if (!nv||nv===""|| (Array.isArray(nv)&&!nv.length)) continue;
          if (!ev||ev===""|| (Array.isArray(ev)&&!ev.length)) patch[f]=nv;
        }
        if (it.missingPhotos) {
          if (it.parsed.photoArrivee) patch.photoArrivee=it.parsed.photoArrivee;
          if ((it.parsed.photos||[]).length) patch.photos=it.parsed.photos;
          if (it.parsed.photoDepart) patch.photoDepart=it.parsed.photoDepart;
          photosAdded+=it.photoCount;
        }
        if (it.missingSig) {
          if (it.parsed.signatureTech)   patch.signatureTech=it.parsed.signatureTech;
          if (it.parsed.signatureClient) patch.signatureClient=it.parsed.signatureClient;
        }
        updated[idx]={...ex,...patch};
        enriched++;
      }
    }
    onImport(updated);
    setResult({ added, enriched, photosAdded });
    setStatus("done");
  };

  const handleFiles = (files) => {
    const f = Array.from(files||[]).filter(x => /\.html?$/i.test(x.name));
    if (f.length) analyseFiles(f);
  };
  const toggleSel = (i) => setSelected(prev => {
    const s=new Set(prev); s.has(i)?s.delete(i):s.add(i); return s;
  });
  const actionable = items.map((_,i)=>i).filter(i=>["new","enrich"].includes(items[i]?.status));
  const allSel = actionable.length>0 && actionable.every(i=>selected.has(i));
  const selCount = [...selected].filter(i=>["new","enrich"].includes(items[i]?.status)).length;
  const chip = (bg,col,txt) => (
    <span style={{fontSize:10,fontWeight:800,color:col,background:bg,borderRadius:20,padding:"2px 8px"}}>{txt}</span>
  );
  const tag = (label,bg="#dbeafe",col="#1e40af") => (
    <span style={{fontSize:10,fontWeight:700,color:col,background:bg,borderRadius:4,
      padding:"1px 6px",display:"inline-block",marginRight:3,marginBottom:2}}>{label}</span>
  );

  return (
    <Modal title="📥 Import intelligent — Rapports HTML" onClose={onClose} wide>

      {/* IDLE : zone de drop */}
      {status==="idle" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div
            onDragOver={e=>{e.preventDefault();setDragging(true);}}
            onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files);}}
            onClick={()=>fileRef.current?.click()}
            style={{padding:36,borderRadius:14,border:`2px dashed ${dragging?"#0369a1":"#cbd5e1"}`,
              background:dragging?"#f0f9ff":"#f8fafc",textAlign:"center",cursor:"pointer",transition:"all .2s"}}
          >
            <div style={{fontSize:44,marginBottom:12}}>📄</div>
            <div style={{fontWeight:800,fontSize:16,color:"#0f172a",marginBottom:4}}>Glisse tes rapports ici</div>
            <div style={{fontSize:13,color:"#64748b",marginBottom:18}}>
              ou clique pour sélectionner — <strong>plusieurs .html</strong> simultanément
            </div>
            <div style={{display:"inline-flex",alignItems:"center",gap:7,padding:"10px 22px",
              borderRadius:10,background:"linear-gradient(135deg,#0369a1,#0891b2)",color:"#fff",fontWeight:700,fontSize:14}}>
              📂 Choisir les fichiers
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".html,.htm" multiple style={{display:"none"}}
            onChange={e=>handleFiles(e.target.files)}/>
          <div style={{textAlign:"center",fontSize:12,color:"#94a3b8",lineHeight:1.7}}>
            Détection automatique : rapports manquants • données vides • photos non importées
          </div>
        </div>
      )}

      {/* ANALYZING */}
      {status==="analyzing" && (
        <div style={{textAlign:"center",padding:52,display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <div style={{fontSize:44}}>🔍</div>
          <div style={{fontWeight:800,fontSize:16,color:"#0f172a"}}>Analyse en cours…</div>
          <div style={{fontSize:13,color:"#64748b"}}>Lecture des sections, mesures, photos…</div>
        </div>
      )}

      {/* PREVIEW */}
      {status==="preview" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Barre résumé */}
          <div style={{display:"flex",gap:7,flexWrap:"wrap",padding:"10px 14px",borderRadius:10,
            background:"#f8fafc",border:"1px solid #e2e8f0",alignItems:"center"}}>
            {items.filter(it=>it.status==="new").length>0 &&
              chip("#d1fae5","#065f46",`🆕 ${items.filter(it=>it.status==="new").length} nouveau${items.filter(it=>it.status==="new").length>1?"x":""}`)}
            {items.filter(it=>it.status==="enrich").length>0 &&
              chip("#dbeafe","#1e40af",`✏️ ${items.filter(it=>it.status==="enrich").length} à compléter`)}
            {items.filter(it=>it.status==="uptodate").length>0 &&
              chip("#f0fdf4","#166534",`✅ ${items.filter(it=>it.status==="uptodate").length} à jour`)}
            {items.filter(it=>["error","no_client"].includes(it.status)).length>0 &&
              chip("#fee2e2","#991b1b",`⚠️ ${items.filter(it=>["error","no_client"].includes(it.status)).length} erreur${items.filter(it=>["error","no_client"].includes(it.status)).length>1?"s":""}`)}
            <div style={{flex:1}}/>
            {actionable.length>0 && (
              <button onClick={()=>setSelected(allSel ? new Set() : new Set(actionable))}
                style={{fontSize:11,fontWeight:700,color:"#0369a1",background:"none",border:"none",cursor:"pointer"}}>
                {allSel?"Tout désél.":"Tout sélect."}
              </button>
            )}
          </div>

          <div style={{maxHeight:430,overflowY:"auto",WebkitOverflowScrolling:"touch",
            display:"flex",flexDirection:"column",gap:6}}>

            {/* Rapports manquants */}
            {items.some(it=>it.status==="new") && (
              <div style={{border:"1px solid #a7f3d0",borderRadius:10,overflow:"hidden"}}>
                <div style={{background:"#d1fae5",padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
                  <span>🆕</span>
                  <span style={{fontWeight:800,fontSize:12,color:"#065f46"}}>Rapports manquants — à créer</span>
                </div>
                {items.map((it,i) => it.status!=="new" ? null : (
                  <label key={i} onClick={()=>toggleSel(i)}
                    style={{display:"flex",gap:10,alignItems:"flex-start",padding:"9px 14px",cursor:"pointer",
                      background:selected.has(i)?"#f0fdf4":"#fff",borderBottom:"1px solid #f1f5f9",transition:"background .1s"}}>
                    <input type="checkbox" checked={selected.has(i)} readOnly
                      style={{accentColor:"#059669",width:15,height:15,flexShrink:0,marginTop:2}}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:13,color:"#0f172a"}}>{it.client.nom}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:2}}>
                        {it.date?new Date(it.date).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"}):"date ?"}
                        {it.parsed.type&&<> · <span style={{color:"#0369a1"}}>{it.parsed.type}</span></>}
                        {it.parsed.tech&&<> · {it.parsed.tech}</>}
                      </div>
                      {(it.photoCount>0||it.parsed.signatureTech) && (
                        <div style={{marginTop:5}}>
                          {it.photoCount>0 && tag(`📸 ${it.photoCount} photo${it.photoCount>1?"s":""}`, "#fef3c7","#92400e")}
                          {it.parsed.signatureTech && tag("✍️ Signatures","#ede9fe","#6d28d9")}
                          {Object.entries({ph:it.parsed.ph,chloreLibre:it.parsed.chloreLibre}).filter(([,v])=>v).map(([k,v])=>(
                            <span key={k} style={{fontSize:10,color:"#64748b",marginRight:6}}>{k==="ph"?"pH":k==="chloreLibre"?"Cl":""}:{v}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Rapports à enrichir */}
            {items.some(it=>it.status==="enrich") && (
              <div style={{border:"1px solid #bfdbfe",borderRadius:10,overflow:"hidden"}}>
                <div style={{background:"#dbeafe",padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
                  <span>✏️</span>
                  <span style={{fontWeight:800,fontSize:12,color:"#1e40af"}}>Données ou photos manquantes — à compléter</span>
                </div>
                {items.map((it,i) => it.status!=="enrich" ? null : (
                  <label key={i} onClick={()=>toggleSel(i)}
                    style={{display:"flex",gap:10,alignItems:"flex-start",padding:"9px 14px",cursor:"pointer",
                      background:selected.has(i)?"#eff6ff":"#fff",borderBottom:"1px solid #f1f5f9",transition:"background .1s"}}>
                    <input type="checkbox" checked={selected.has(i)} readOnly
                      style={{accentColor:"#1d4ed8",width:15,height:15,flexShrink:0,marginTop:2}}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:13,color:"#0f172a"}}>{it.client.nom}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:2}}>
                        {it.date?new Date(it.date).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"}):""}
                      </div>
                      <div style={{marginTop:5,lineHeight:1.8}}>
                        {it.missingPhotos && tag(`📸 ${it.photoCount} photo${it.photoCount>1?"s":""}`, "#fef3c7","#92400e")}
                        {it.missingSig   && tag("✍️ Signatures","#ede9fe","#6d28d9")}
                        {it.missingData.slice(0,7).map(l => tag(l))}
                        {it.missingData.length>7 && tag(`+${it.missingData.length-7}…`,"#f1f5f9","#64748b")}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Déjà à jour */}
            {items.some(it=>it.status==="uptodate") && (
              <div style={{padding:"10px 14px",borderRadius:10,background:"#f0fdf4",
                border:"1px solid #bbf7d0",fontSize:12,color:"#166534"}}>
                ✅ <strong>{items.filter(it=>it.status==="uptodate").length}</strong> rapport{items.filter(it=>it.status==="uptodate").length>1?"s":""} déjà complets — rien à faire
              </div>
            )}

            {/* Erreurs */}
            {items.filter(it=>["error","no_client"].includes(it.status)).map((it,i) => (
              <div key={i} style={{padding:"10px 14px",borderRadius:10,background:"#fef2f2",
                border:"1px solid #fecaca",fontSize:12,color:"#991b1b"}}>
                ⚠️ <strong>{it.fileName}</strong> —{" "}
                {it.status==="no_client"
                  ? <>Client "<strong>{it.clientNom}</strong>" introuvable dans l'app</>
                  : it.reason}
              </div>
            ))}
          </div>

          {/* Boutons */}
          <div style={{display:"flex",gap:10,paddingTop:10,borderTop:"1px solid #e2e8f0"}}>
            <button onClick={()=>setStatus("idle")}
              style={{flex:1,padding:"11px",borderRadius:8,background:"#f8fafc",
                border:"1px solid #e2e8f0",cursor:"pointer",fontWeight:700,fontSize:13,color:"#64748b",fontFamily:"inherit"}}>
              ← Retour
            </button>
            {actionable.length > 0 ? (
              <button onClick={doImport} disabled={selCount===0}
                style={{flex:2,padding:"11px",borderRadius:8,border:"none",fontFamily:"inherit",fontWeight:800,fontSize:14,color:"#fff",
                  background:selCount>0?"linear-gradient(135deg,#0369a1,#0891b2)":"#9ca3af",
                  cursor:selCount>0?"pointer":"default"}}>
                Importer {selCount} rapport{selCount>1?"s":""}
              </button>
            ) : (
              <button onClick={onClose}
                style={{flex:2,padding:"11px",borderRadius:8,background:"#f0fdf4",
                  border:"1px solid #bbf7d0",cursor:"pointer",fontWeight:700,fontSize:13,color:"#166534",fontFamily:"inherit"}}>
                Tout est à jour ✅
              </button>
            )}
          </div>
        </div>
      )}

      {/* IMPORTING */}
      {status==="importing" && (
        <div style={{textAlign:"center",padding:52,display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <div style={{fontSize:44}}>💾</div>
          <div style={{fontWeight:800,fontSize:16,color:"#0f172a"}}>Import en cours…</div>
        </div>
      )}

      {/* DONE */}
      {status==="done" && result && (
        <div style={{textAlign:"center",padding:44,display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
          <div style={{fontSize:56}}>✅</div>
          <div style={{fontWeight:900,fontSize:18,color:"#0f172a"}}>Import réussi !</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,fontSize:14,color:"#475569",textAlign:"center"}}>
            {result.added>0     && <div>🆕 <strong>{result.added}</strong> rapport{result.added>1?"s":""} créé{result.added>1?"s":""}</div>}
            {result.enriched>0  && <div>✏️ <strong>{result.enriched}</strong> rapport{result.enriched>1?"s":""} complété{result.enriched>1?"s":""}</div>}
            {result.photosAdded>0 && <div>📸 <strong>{result.photosAdded}</strong> photo{result.photosAdded>1?"s":""} ajoutée{result.photosAdded>1?"s":""}</div>}
          </div>
          <button onClick={onClose}
            style={{marginTop:10,padding:"13px 30px",borderRadius:10,
              background:"linear-gradient(135deg,#0369a1,#0891b2)",border:"none",
              cursor:"pointer",fontWeight:800,fontSize:15,color:"#fff",fontFamily:"inherit"}}>
            Fermer
          </button>
        </div>
      )}
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
  const [modeExpert, setModeExpert] = useState(() => readLS("expert_mode", false));

  const toggleExpert = (val) => {
    setModeExpert(val);
    try { localStorage.setItem("briblue_expert_mode", JSON.stringify(val)); } catch { /* noop */ }
  };
  const [clients, setClients] = useState([]);
  const [passages, setPassages] = useState([]);
  const [livraisons, setLivraisons] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [stock, setStock] = useState({});
  const [stockMeta, setStockMeta] = useState({});
  const [showStock, setShowStock] = useState(false);
  const [showImport, setShowImport]     = useState(false);
  const [showImportHTML, setShowImportHTML] = useState(false);
  const [contrats, setContrats] = useState({});
  const [versements, setVersements] = useState({});
  const [retardsCarnet, setRetardsCarnet] = useState({});
  const [notes, setNotes] = useState([]);
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
  const clientsRef = useRef(clients); // ref toujours à jour pour les callbacks onSnapshot
  useEffect(() => { clientsRef.current = clients; }, [clients]);
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
    const stockMetaData = readLS("bb_stock_meta_v1", {});
    const contratsData  = readLS("bb_contrats_v1",  {});
    const versementsData = readLS("bb_versements_v1", {});
    const retardsCarnetData = readLS("bb_retards_carnet_v1", {});
    const notesData     = readLS("bb_notes_v1",     []);
    const sWithDefaults = {...Object.fromEntries(PRODUITS_DEFAUT.map(nom=>[nom,0])), ...stockData};
    const cMigrated = clientsData.map(cl => ({...cl, moisParMois: migrateMois(cl.moisParMois||cl.saisons), photoPiscine: cl.photoPiscine||"", prixPassageE: cl.prixPassageE||0, prixPassageC: cl.prixPassageC||0}));
    setClients(cMigrated); setPassages(passagesData); setLivraisons(livraisonsData);
    setRdvs(rdvsData); setStock(sWithDefaults); setStockMeta(stockMetaData); setContrats(contratsData); setVersements(versementsData); setRetardsCarnet(retardsCarnetData);
    setNotes(notesData);
  }, []);

  // ─── SAVE CALLBACKS (déclarés avant runPhotoMigration qui en dépend) ────────────
  const saveClients   = useCallback((data) => save("bb_clients_v2",    data), []);
  const savePassages  = useCallback((data) => save("bb_passages_v2",   data), []);
  const saveLivraisonsList = useCallback((data) => save("bb_livraisons_v1", data), []);
  const saveRdvsList  = useCallback((data) => save("bb_rdvs_v1",       data), []);
  const saveStock     = useCallback((data) => save("bb_stock_v1",      data), []);
  const saveStockMeta = useCallback((data) => save("bb_stock_meta_v1", data), []);
  const saveContrats  = useCallback((data) => save("bb_contrats_v1",   data), []);
  const saveVersements = useCallback((data) => save("bb_versements_v1", data), []);
  const saveRetardsCarnet = useCallback((data) => save("bb_retards_carnet_v1", data), []);
  const saveNotes     = useCallback((data) => save("bb_notes_v1",      data), []);

  // ─── MIGRATION PHOTOS passages + clients ─────────────────────────────────────
  // Pousse les clés idb: locales vers Firebase Storage → URL https:// multi-appareils
  const runPhotoMigration = useCallback(async () => {
    if (!navigator.onLine) return;

    // 0. Retry des uploads en attente (clés IDB qui avaient échoué lors de sessions précédentes)
    const retried = await retryPendingUploads().catch(() => ({}));
    if (Object.keys(retried).length > 0) {
      // Remplacer les idb:key par les https:// dans les passages
      setPassages(prev => {
        let changed = false;
        const updated = prev.map(p => {
          let np = p;
          const SINGLE = ["photoArrivee","photoDepart"];
          const ARRAYS = ["photos","photosDepart"];
          for (const f of SINGLE) {
            if (np[f]?.startsWith("idb:") && retried[np[f].slice(4)]) {
              np = { ...np, [f]: retried[np[f].slice(4)] }; changed = true;
            }
          }
          for (const f of ARRAYS) {
            if (!Array.isArray(np[f])) continue;
            const arr = np[f].map(v => (v?.startsWith("idb:") && retried[v.slice(4)]) ? retried[v.slice(4)] : v);
            if (arr.some((v, i) => v !== np[f][i])) { np = { ...np, [f]: arr }; changed = true; }
          }
          return np;
        });
        if (changed) savePassages(updated);
        return changed ? updated : prev;
      });
    }

    // 1. Passages — migrer les clés idb: restantes vers Firebase Storage
    const current = readLS("bb_passages_v2", PASSAGES_INIT);
    if (current.some(p =>
      ["photoArrivee","photoDepart"].some(f => p[f]?.startsWith("idb:")) ||
      ["photos","photosDepart"].some(f => Array.isArray(p[f]) && p[f].some(v => v?.startsWith("idb:")))
    )) {
      const updated = await migrateAllPassagesPhotos(current);
      if (updated !== current) {
        setPassages(updated);
        await savePassages(updated);
      }
    }

    // 2. Photos piscine clients (idb: → Firebase Storage ou Firestore)
    // ⚠️  NE JAMAIS écraser la liste entière depuis readLS() : elle peut être
    //     périmée si un client vient d'être ajouté avec le debounce Firestore en cours.
    //     On utilise clientsRef.current (toujours à jour) et setClients(prev=>) pour
    //     ne modifier QUE les clients migrés sans toucher aux autres.
    const toMigrate = clientsRef.current.filter(cl =>
      cl.photoPiscine &&
      !cl.photoPiscine.startsWith("https://") &&
      !cl.photoPiscine.startsWith("fsp:")
    );
    for (const cl of toMigrate) {
      if (!navigator.onLine) break;
      const migrated = await migrateClientPhotoToStorage(cl).catch(() => null);
      if (migrated) {
        // Mise à jour atomique : ne modifie que CE client, préserve tous les autres
        setClients(prev => {
          const next = prev.map(x => x.id === migrated.id ? migrated : x);
          saveClients(next);
          return next;
        });
      }
    }
  }, [savePassages, saveClients]);

  useEffect(()=>{
    if(!loggedIn || _BB_BOOT_DONE) return;
    _BB_BOOT_DONE = true;

    // Affichage immédiat depuis localStorage (0 ms réseau)
    applyLocalData();
    setReady(true);

    // Réconciliation Firebase en arrière-plan, puis migration photos
    reconcileOnBoot().then(() => {
      applyLocalData();
      runPhotoMigration().catch(() => {});
    }).catch(() => {});
  },[loggedIn, applyLocalData, runPhotoMigration]);

  // ─── FIX #5 : re-synchronisation complète au retour en ligne ────────────────
  // reconcileOnBoot est relancé pour récupérer les données Firebase manquantes
  // (ex: FOULON créé offline, contrat KATIA signé via l'API)
  useEffect(() => {
    if (!ready) return;
    const onOnline = async () => {
      // Invalider le cache Firestore pour forcer un nouveau fetch
      invalidateDocCache();
      // Re-reconcilier : met à jour localStorage + état React avec les données Firebase
      reconcileOnBoot().then(() => {
        applyLocalData();
      }).catch(() => {});
      // Migration photos en arrière-plan
      runPhotoMigration().catch(() => {});
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [ready, runPhotoMigration, applyLocalData]);

  // ─── MIGRATION PHOTOS au démarrage (sans condition auth) ────────────────────
  // Les uploads passent par /api/upload-photo (Admin SDK) — pas besoin d'auth Firebase.
  useEffect(() => {
    if (!ready) return;
    if (navigator.onLine) runPhotoMigration().catch(() => {});
  }, [ready, runPhotoMigration]);

  // ─── TEMPS RÉEL : onSnapshot sur tous les documents Firestore ─────────────
  // Toute modification (ajout, modif, suppression) sur cet appareil OU un autre
  // met à jour le state React instantanément, sans rechargement.
  useEffect(() => {
    if (!ready) return;
    const unsub = subscribeToRealtime({
      clients: (data) => {
        if (!Array.isArray(data)) return;
        setClients(data.map(cl => ({
          ...cl,
          moisParMois: migrateMois(cl.moisParMois || cl.saisons),
          photoPiscine: cl.photoPiscine || "",
          prixPassageE: cl.prixPassageE || 0,
          prixPassageC: cl.prixPassageC || 0,
        })));
      },
      passages:   (data) => { if (Array.isArray(data)) setPassages(data); },
      rdvs:       (data) => { if (Array.isArray(data)) setRdvs(data); },
      livraisons: (data) => { if (Array.isArray(data)) setLivraisons(data); },
      contrats: (data) => {
        if (!data || typeof data !== "object") return;
        setContrats(prev => {
          // Détecter les nouvelles signatures et notifier
          const keys = Object.keys(data);
          const newSig = keys
            .map(k => data[k])
            .find(ct =>
              (ct.statut === "signe_client" || ct.statut === "signe_complet") &&
              (!prev[keys.find(k => data[k] === ct)] ||
               prev[keys.find(k => data[k] === ct)]?.statut !== ct.statut)
            );
          if (newSig) {
            playNotifSound();
            const cli = clientsRef.current.find(cl => cl.id === newSig.clientId);
            const nomCli = cli?.nom || newSig.clientId;
            const isComplet = newSig.statut === "signe_complet";
            toastInfo(isComplet
              ? `✅ Contrat co-signé par ${nomCli} !`
              : `📝 ${nomCli} a signé son contrat — votre signature est requise.`
            );
            sendLocalNotification(
              isComplet ? "✅ Contrat co-signé !" : "📝 Signature requise",
              isComplet ? `${nomCli} a co-signé le contrat.` : `${nomCli} a signé — votre tour !`,
              { tag: "briblue-contrat-" + newSig.clientId, requireInteraction: !isComplet }
            );
            // ── Envoi automatique du contrat PDF quand les deux parties ont signé ──
            if (isComplet && !newSig.pdfSentAt && cli?.email) {
              const ctKey = keys.find(k => data[k] === newSig);
              // Délai court pour laisser le state React se stabiliser
              setTimeout(async () => {
                const ok = await envoyerContratPDF(cli, newSig).catch(() => false);
                if (ok && ctKey) {
                  setContrats(prev => {
                    const next = { ...prev, [ctKey]: { ...prev[ctKey], pdfSentAt: new Date().toISOString() } };
                    saveContrats(next);
                    return next;
                  });
                }
              }, 2000);
            }
          }
          return data;
        });
      },
      stock:      (data) => {
        if (data && typeof data === "object") {
          setStock({ ...Object.fromEntries(PRODUITS_DEFAUT.map(n => [n, 0])), ...data });
        }
      },
      meta: (data) => {
        if (Array.isArray(data.notes))                       setNotes(data.notes);
        if (data.versements && typeof data.versements === "object") setVersements(data.versements);
        if (data.retards    && typeof data.retards    === "object") setRetardsCarnet(data.retards);
      },
    });
    return unsub; // désabonnement au démontage
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling contrats supprimé — remplacé par onSnapshot dans subscribeToRealtime

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

  // ── SCHEDULER NOTIFICATIONS ──────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;

    // Lecture des préférences enrichies
    const lsj = (k, def) => { try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch { return def; } };
    const notifOn    = lsj("briblue_notif_enabled",     true);
    const morningOn  = lsj("briblue_notif_morning",     true);
    const rdvOn      = lsj("briblue_notif_rdv",         true);
    const vol        = lsj("briblue_notif_volume",      0.7);
    const morningH   = lsj("briblue_notif_morning_h",   "08:00");
    const morningSon = lsj("briblue_notif_son_morning", "chime");
    const morningRep = lsj("briblue_notif_rep_morning", 1);
    const rdvDelays  = lsj("briblue_notif_rdv_delays",  [15, 5]);
    const rdvSon     = lsj("briblue_notif_son_rdv",     "alert");
    const rdvRep     = lsj("briblue_notif_rep_rdv",     2);

    if (!notifOn) return;

    const timers = [];
    const now = new Date();
    const todayStr = [now.getFullYear(), String(now.getMonth()+1).padStart(2,"0"), String(now.getDate()).padStart(2,"0")].join("-");

    // ── Briefing matinal à l’heure configurée ──
    if (morningOn) {
      const lastBriefing = localStorage.getItem("briblue_last_briefing");
      const sendBriefing = () => {
        const rdvsAujourd = rdvs.filter(r => r.date === todayStr);
        const passagesAujourd = passages.filter(p => p.date === todayStr && !p.ok);
        const msgs = [];
        if (rdvsAujourd.length)     msgs.push(`${rdvsAujourd.length} RDV`);
        if (passagesAujourd.length) msgs.push(`${passagesAujourd.length} passage${passagesAujourd.length>1?"s":""} à effectuer`);
        const body = msgs.length ? msgs.join(" · ") : "Aucun événement prévu — bonne journée !";
        playSound(morningSon, morningRep, vol);
        sendLocalNotification("☀️ Bonjour Dorian ! — BRIBLUE", body, { tag:"briblue-morning", requireInteraction:false });
        localStorage.setItem("briblue_last_briefing", todayStr);
      };

      if (lastBriefing !== todayStr) {
        const [bh, bm] = morningH.split(":").map(Number);
        const brief = new Date(); brief.setHours(bh, bm || 0, 0, 0);
        const delay = brief - now;
        if (delay > 0) {
          timers.push(setTimeout(sendBriefing, delay));
        } else {
          sendBriefing(); // heure déjà passée, envoyer une seule fois
        }
      }
    }

    // ── Rappels RDV pour chaque délai configuré ──
    if (rdvOn && Array.isArray(rdvDelays) && rdvDelays.length > 0) {
      rdvs.filter(r => r.date === todayStr && r.heure).forEach(rdv => {
        const [h, m] = rdv.heure.split(":").map(Number);
        const rdvTime = new Date(); rdvTime.setHours(h, m, 0, 0);

        rdvDelays.forEach(minutesBefore => {
          const delay = new Date(rdvTime.getTime() - minutesBefore * 60 * 1000) - now;
          if (delay > 0 && delay < 12 * 3600 * 1000) {
            const client = clients.find(c => c.id === rdv.clientId);
            const label = minutesBefore >= 60 ? `${Math.round(minutesBefore/60)} h` : `${minutesBefore} min`;
            timers.push(setTimeout(() => {
              playSound(rdvSon, rdvRep, vol);
              sendLocalNotification(
                minutesBefore <= 5 ? `⚠️ RDV dans ${label} !` : `📅 RDV dans ${label}`,
                `${rdv.heure} · ${rdv.type}${client ? " — " + client.nom : ""}`,
                {
                  tag:`briblue-rdv-${rdv.id}-${minutesBefore}`,
                  requireInteraction: minutesBefore <= 5,
                  vibrate: minutesBefore <= 5 ? [200,100,200] : undefined,
                }
              );
            }, delay));
          }
        });
      });
    }

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, rdvs.map(r=>r.id+r.heure+r.date).join(",")]);

  const handleLogin = useCallback(()=>{
    try{sessionStorage.setItem("bb_auth","1");}catch{ /* noop */ }
    // Connexion anonyme Firebase pour autoriser les uploads Firebase Storage
    if (!auth.currentUser) signInAnonymously(auth).catch(()=>{});
    setLoggedIn(true);
  },[]);
  const handleLogout = useCallback(()=>{ try{sessionStorage.removeItem("bb_auth");}catch{ /* noop */ } setLoggedIn(false);setReady(false);setClients([]);setPassages([]);setLivraisons([]);setRdvs([]); },[]);

  const saveClient = useCallback(async c=>{
    const { envoyerContrat, ...clientDataRaw } = c;

    // ── Upload photo piscine AVANT la sauvegarde (synchrone) ──────────────────
    // Priorité : Firebase Storage → URL https:// accessible sur tous les appareils.
    // Si pas de réseau ou upload échoué → on garde idb: (fonctionnel en local).
    let clientData = clientDataRaw;
    const photoNeedsMigration = clientData.photoPiscine &&
      !clientData.photoPiscine.startsWith("https://") &&
      !clientData.photoPiscine.startsWith("blob:");
    if (photoNeedsMigration && navigator.onLine) {
      const migrated = await migrateClientPhotoToStorage(clientData).catch(() => null);
      if (migrated) clientData = migrated; // ← photoPiscine = "https://..."
    }

    const isNew = !clients.find(x=>x.id===clientData.id);
    setClients(prev=>{ const next=prev.find(x=>x.id===clientData.id)?prev.map(x=>x.id===clientData.id?clientData:x):[...prev,clientData]; saveClients(next); return next; });
    if (!isNew) {
      const contractId = `CT-${clientData.id}`;
      setContrats(prev=>{
        if (!prev[contractId]) return prev;
        const old = prev[contractId];
        if (old.statut === "signe_client" || old.statut === "signe_complet") return prev;
        const next = {...prev, [contractId]: { clientId: clientData.id, statut: "reset", signatureClient: "", signaturePrestataire: "", signedAt: null }, "__archives__": (prev["__archives__"]||[])};
        saveContrats(next);
        return next;
      });
    }
    setShowFormClient(false);setEditClient(null);setFicheClient(clientData);
    if (envoyerContrat && isNew) {
      setTimeout(() => envoyerContratSignature(clientData), 500);
    }
  },[saveClients, clients, saveContrats]);

  const deleteClient = useCallback(id=>{ showConfirm("Supprimer ce client et tous ses passages ?", ()=>{ setClients(prev=>{ const next=prev.filter(x=>x.id!==id); saveClients(next); return next; }); setPassages(prev=>{ const next=prev.filter(x=>x.clientId!==id); savePassages(next); return next; }); setFicheClient(null); }); },[saveClients,savePassages]);

  // Supprimer un contrat (retire l'entrée du registre des contrats)
  const deleteContrat = useCallback((clientId) => {
    showConfirm("Supprimer ce contrat ? Les signatures seront effacées.", () => {
      setContrats(prev => {
        const next = {...prev};
        delete next[`CT-${clientId}`];
        saveContrats(next);
        return next;
      });
    });
  }, [saveContrats]);

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
    // Arrière-plan : migrer les photos idb: vers Firebase Storage (non-bloquant)
    const saved = next.find(x => x.id === p.id);
    if (saved) {
      migratePassagePhotosToStorage(saved).then(migrated => {
        if (!migrated) return;
        setPassages(prev => {
          const updated = prev.map(x => x.id === migrated.id ? migrated : x);
          savePassages(updated);
          return updated;
        });
      }).catch(() => {});
    }
  },[savePassages, passages]);

  const updatePassageRapportStatus = useCallback(async (passageMaj) => {
    const next = passages.map(x => x.id === passageMaj.id ? { ...x, ...passageMaj } : x);
    setPassages(next);
    await savePassages(next);
  }, [savePassages, passages]);

  const deletePassage = useCallback(async id=>{
    const p = passages.find(x=>x.id===id);
    if(p?.statut==="validee"){ toastError("Impossible de supprimer une intervention validée."); return; }
    // Marquer l'ID comme supprimé AVANT de sauvegarder : empêche le retour
    // via merge, reconcileOnBoot ou snapshot Firebase au rechargement.
    markPassageDeleted(id);
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
  const updateStockMeta = useCallback((nom, meta) => { setStockMeta(prev=>{ const next={...prev,[nom]:meta}; saveStockMeta(next); return next; }); },[saveStockMeta]);
  const nbStockBas = useMemo(()=>Object.values(stock).filter(q=>q<=2).length,[stock]);

  const handleImportHTML = useCallback((updatedPassages) => {
    setPassages(updatedPassages);
    savePassages(updatedPassages);
  }, [savePassages]);

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
    { id:"gestion",       l:"Gestion",      icon:(a)=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?"#7c3aed":"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/><line x1="14" y1="15" x2="18" y2="15"/></svg> },
    { id:"parametres",    l:"Paramètres",   icon:(a)=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?"#0f172a":"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> },
  ];

  const PAGE_LABELS = { dashboard:`Bonjour Dorian 👋`, clients:"Clients", passages:"Rapports", interventions:"Rapports", rdv:"Rendez-vous", gestion:"Gestion", parametres:"Paramètres" };

  return (
    <>
    <GlobalStyles/>
    <ToastContainer/>
    <ConfirmModal/>
    <div style={{minHeight:"100dvh",background:"#f1f5f9",fontFamily:"'Inter', -apple-system, system-ui, sans-serif",maxWidth:isMobile?640:1280,margin:"0 auto",position:"relative",display:"flex",flexDirection:"column",overflowX:"hidden",width:"100%"}}>
      {/* ── BANDE COULEUR TOP (signature BRIBLUE) ── */}
      <div style={{height:4,background:"linear-gradient(90deg,#0891b2 0%,#06b6d4 45%,#8b5cf6 100%)",flexShrink:0,position:"sticky",top:0,zIndex:51}}/>
      {/* HEADER */}
      <div style={{background:"#ffffff",paddingTop:isMobile?"max(10px, env(safe-area-inset-top, 0px))":"10px",paddingBottom:"10px",paddingLeft:isMobile?"14px":"28px",paddingRight:isMobile?"14px":"28px",display:"flex",alignItems:"center",gap:isMobile?8:12,position:"sticky",top:4,zIndex:50,borderBottom:"1px solid #e2e8f0",width:"100%",boxSizing:"border-box"}}>
        {/* Logo */}
        <button onClick={()=>setPage("dashboard")} style={{background:"linear-gradient(135deg,#0891b2,#0369a1)",border:"none",padding:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:isMobile?40:38,height:isMobile?40:38,borderRadius:12,flexShrink:0,boxShadow:"0 2px 8px rgba(8,145,178,0.35)"}}>
          {Ico.wave(isMobile?20:18,"white")}
        </button>
        {/* Indicateur online */}
        <div style={{width:8,height:8,borderRadius:"50%",background:online?"#22c55e":"#f87171",boxShadow:online?"0 0 0 2px rgba(34,197,94,0.2)":"0 0 0 2px rgba(248,113,113,0.2)",flexShrink:0}}/>
        <div style={{flex:1}}/>
        {/* ── BOUTONS D'ACTION RAPIDE ── */}
        <div style={{display:"flex",gap:isMobile?4:6,alignItems:"center",flexShrink:0}}>

          {/* Stock */}
          <button onClick={()=>setShowStock(true)} title="Stock produits"
            style={{position:"relative",display:"flex",alignItems:"center",gap:5,
              justifyContent:"center",
              padding:isMobile?"0":"0 11px",
              width:isMobile?36:undefined,
              height:36,borderRadius:10,
              background:"#f0fdf4",border:"1px solid #bbf7d0",
              cursor:"pointer",flexShrink:0,fontFamily:"inherit",
              WebkitTapHighlightColor:"transparent",transition:"all .15s"}}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V21H3V8"/><path d="M23 3H1v5h22V3z"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            {!isMobile&&<span style={{fontSize:11,fontWeight:700,color:"#059669"}}>Stock</span>}
            {nbStockBas>0&&<span style={{position:"absolute",top:-4,right:-4,minWidth:14,height:14,borderRadius:7,background:"#ef4444",color:"#fff",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px"}}>{nbStockBas}</span>}
          </button>

          {/* Livraison */}
          <button onClick={()=>{setDefaultLivraisonClientId("");setShowFormLivraison(true);}} title="Nouvelle livraison"
            style={{display:"flex",alignItems:"center",gap:5,
              justifyContent:"center",
              padding:isMobile?"0":"0 11px",
              width:isMobile?36:undefined,
              height:36,borderRadius:10,
              background:"#fff7ed",border:"1px solid #fed7aa",
              cursor:"pointer",flexShrink:0,fontFamily:"inherit",
              WebkitTapHighlightColor:"transparent",transition:"all .15s"}}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            {!isMobile&&<span style={{fontSize:11,fontWeight:700,color:"#f97316"}}>Livraison</span>}
          </button>

          {/* Nouveau client — desktop uniquement dans le header */}
          {!isMobile&&(
            <button onClick={openAddClient} title="Nouveau client"
              style={{display:"flex",alignItems:"center",gap:5,padding:"0 11px",height:36,borderRadius:10,
                background:"#f5f3ff",border:"1px solid #ddd6fe",
                cursor:"pointer",flexShrink:0,WebkitTapHighlightColor:"transparent",transition:"all .15s"}}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="3" x2="19" y2="9"/><line x1="16" y1="6" x2="22" y2="6"/></svg>
              <span style={{fontSize:11,fontWeight:700,color:"#7c3aed"}}>Client</span>
            </button>
          )}

          {/* Nouveau rapport — action principale */}
          <button onClick={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} title="Nouveau rapport"
            style={{display:"flex",alignItems:"center",gap:isMobile?0:6,
              justifyContent:"center",
              padding:isMobile?"0":"0 14px",
              width:isMobile?40:undefined,
              height:36,borderRadius:10,
              background:"linear-gradient(135deg,#0891b2,#0369a1)",border:"none",
              cursor:"pointer",flexShrink:0,fontFamily:"inherit",
              WebkitTapHighlightColor:"transparent",
              boxShadow:"0 2px 8px rgba(8,145,178,0.35)",transition:"all .15s"}}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
            {!isMobile&&<span style={{fontSize:11,fontWeight:800,color:"#fff"}}>Rapport</span>}
          </button>

          {/* Déconnexion */}
          <button onClick={handleLogout} title="Déconnexion"
            style={{width:36,height:36,borderRadius:10,
              background:"#fff1f2",border:"1px solid #fecdd3",
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              flexShrink:0,WebkitTapHighlightColor:"transparent",transition:"all .15s"}}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#be123c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL */}
      {isMobile ? (
        <>
          {page!=="dashboard"&&(<div style={{padding:"16px 16px 4px"}}><h2 style={{margin:0,fontSize:21,fontWeight:800,color:"#0f172a",letterSpacing:-0.5}}>{PAGE_LABELS[page]}</h2></div>)}
          <div style={{padding:"6px 14px calc(80px + env(safe-area-inset-bottom,0px))",overflowX:"hidden"}}>
            {page==="dashboard"&&<Dashboard clients={clients} passages={passages} rdvs={rdvs} onClientClick={setFicheClient} onAddPassage={(opts)=>{setEditPassage(opts?.date||opts?.type?{date:opts?.date,type:opts?.type}:null);setDefaultClientId(opts?.clientId||"");setShowFormPassage(true);}} onAddLivraison={()=>{setDefaultLivraisonClientId("");setShowFormLivraison(true);}} onAddClient={openAddClient} onAddRdv={(opts)=>{setEditRdv(opts?.date?{date:opts.date}:null);setShowFormRdv(true);}} onEditPassage={openEditPassage} onEditRdv={r=>{setEditRdv(r);setShowFormRdv(true);}} notes={notes} onNotesChange={n=>{setNotes(n);saveNotes(n);}}/>}
            {page==="clients"&&<PageClients clients={clients} passages={passages} contrats={contrats} versements={versements} onUpdateContrat={(contractId,data)=>setContrats(prev=>{ const next={...prev,[contractId]:{...prev[contractId],...data}}; saveContrats(next); return next; })} onToggleVersement={handleToggleVersement} onClientClick={setFicheClient} onAdd={openAddClient}/>}
            {(page==="passages"||page==="interventions")&&<PagePassages clients={clients} passages={passages} onAdd={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} onDelete={deletePassage} onEdit={openEditPassage} onUpdatePassageStatus={updatePassageRapportStatus} onAddClient={openAddClient} onValider={validerPassage} onChangeStatut={updateStatutPassage} onClientClick={setFicheClient}/>}
            {page==="rdv"&&<PageRdv clients={clients} rdvs={rdvs} onAdd={()=>{setEditRdv(null);setShowFormRdv(true);}} onEdit={r=>{setEditRdv(r);setShowFormRdv(true);}} onDelete={deleteRdv}/>}
            {page==="gestion"&&<PageGestion clients={clients} versements={versements} onToggleVersement={handleToggleVersement} livraisons={livraisons} onUpdateStatutLivraison={updateStatutLivraison} retardsCarnet={retardsCarnet} onToggleRetardCarnet={handleToggleRetardCarnet} contrats={contrats} onOpenContrat={(client,contrat)=>ouvrirContrat(client,contrat?.signaturePrestataire||"",contrat?.signatureClient||"")}/>}
            {page==="parametres"&&<PageParametres modeExpert={modeExpert} onToggleExpert={toggleExpert} clients={clients} passages={passages} rdvs={rdvs} onLogout={handleLogout} onOpenImportHTML={()=>setShowImportHTML(true)}/>}
          </div>
        </>
      ) : (
        <div style={{display:"flex",flex:1,minHeight:0}}>
          <div style={{width:220,flexShrink:0,background:"#ffffff",borderRight:"1px solid #e2e8f0",display:"flex",flexDirection:"column",padding:"20px 10px",gap:2,position:"sticky",top:48,height:"calc(100vh - 48px)",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
            <div style={{padding:"10px 12px",borderRadius:12,background:"#f8fafc",border:"1px solid #e2e8f0",marginBottom:14}}>
              <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Aperçu</div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:DS.mid}}>Clients</span><span style={{fontSize:13,fontWeight:800,color:DS.dark}}>{clients.length}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:DS.mid}}>Ce mois</span><span style={{fontSize:13,fontWeight:800,color:DS.blue}}>{passages.filter(p=>new Date(p.date).getMonth()+1===MOIS_NOW&&new Date(p.date).getFullYear()===YEAR_NOW).length} pass.</span></div>
                {nbAlertes>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:DS.mid}}>Alertes</span><span style={{fontSize:13,fontWeight:800,color:"#ef4444"}}>{nbAlertes}</span></div>}
              </div>
            </div>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",cursor:"pointer",background:page===n.id?"#e0f2fe":"transparent",textAlign:"left",fontFamily:"inherit",transition:"background .15s",width:"100%"}}>
                {n.icon(page===n.id)}
                <span style={{fontSize:13,fontWeight:page===n.id?700:500,color:page===n.id?DS.blue:"#475569"}}>{n.l}</span>
                {page===n.id&&<div style={{marginLeft:"auto",width:3,height:14,borderRadius:2,background:DS.blue}}/>}
              </button>
            ))}
            <div style={{marginTop:"auto",display:"flex",flexDirection:"column",gap:6,paddingTop:14,borderTop:"1px solid #e2e8f0"}}>
              <button onClick={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",fontFamily:"inherit",width:"100%"}}>
                {Ico.clipboard(13,DS.blue)}<span style={{fontSize:12,fontWeight:600,color:"#475569"}}>Nouveau passage</span>
              </button>
              <button onClick={openAddClient} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",fontFamily:"inherit",width:"100%"}}>
                {Ico.userPlus(13,DS.purple)}<span style={{fontSize:12,fontWeight:600,color:DS.purple}}>Nouveau client</span>
              </button>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",minWidth:0}}>
            <div style={{padding:"20px 28px 80px",maxWidth:860,margin:"0 auto"}}>
              {page!=="dashboard"&&(<div style={{marginBottom:16}}><h2 style={{margin:0,fontSize:24,fontWeight:800,color:"#0f172a",letterSpacing:-0.5}}>{PAGE_LABELS[page]}</h2></div>)}
              {page==="dashboard"&&<Dashboard clients={clients} passages={passages} rdvs={rdvs} onClientClick={setFicheClient} onAddPassage={()=>{setDefaultClientId("");setShowFormPassage(true);}} onAddLivraison={()=>{setDefaultLivraisonClientId("");setShowFormLivraison(true);}} onAddClient={openAddClient} onAddRdv={(opts)=>{setEditRdv(opts?.date?{date:opts.date}:null);setShowFormRdv(true);}} onEditPassage={openEditPassage} onEditRdv={r=>{setEditRdv(r);setShowFormRdv(true);}} notes={notes} onNotesChange={n=>{setNotes(n);saveNotes(n);}}/>}
              {page==="clients"&&<PageClients clients={clients} passages={passages} contrats={contrats} versements={versements} onUpdateContrat={(contractId,data)=>setContrats(prev=>{ const next={...prev,[contractId]:{...prev[contractId],...data}}; saveContrats(next); return next; })} onToggleVersement={handleToggleVersement} onClientClick={setFicheClient} onAdd={openAddClient}/>}
              {(page==="passages"||page==="interventions")&&<PagePassages clients={clients} passages={passages} onAdd={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} onDelete={deletePassage} onEdit={openEditPassage} onUpdatePassageStatus={updatePassageRapportStatus} onAddClient={openAddClient} onValider={validerPassage} onChangeStatut={updateStatutPassage} onClientClick={setFicheClient}/>}
              {page==="rdv"&&<PageRdv clients={clients} rdvs={rdvs} onAdd={()=>{setEditRdv(null);setShowFormRdv(true);}} onEdit={r=>{setEditRdv(r);setShowFormRdv(true);}} onDelete={deleteRdv}/>}
              {page==="gestion"&&<PageGestion clients={clients} versements={versements} onToggleVersement={handleToggleVersement} livraisons={livraisons} onUpdateStatutLivraison={updateStatutLivraison} retardsCarnet={retardsCarnet} onToggleRetardCarnet={handleToggleRetardCarnet} contrats={contrats} onOpenContrat={(client,contrat)=>ouvrirContrat(client,contrat?.signaturePrestataire||"",contrat?.signatureClient||"")}/>}
              {page==="parametres"&&<PageParametres modeExpert={modeExpert} onToggleExpert={toggleExpert} clients={clients} passages={passages} rdvs={rdvs} onLogout={handleLogout} onOpenImportHTML={()=>setShowImportHTML(true)}/>}
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
          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:640,background:"#ffffff",display:"flex",alignItems:"flex-end",zIndex:50,paddingBottom:"env(safe-area-inset-bottom,0px)",borderTop:"1px solid #e2e8f0"}}>
            {NAV.map(n=>{
              const active = page===n.id;
              const accentColor = n.id==="rdv" ? "#818cf8" : DS.blue;
              const gradFrom = n.id==="rdv" ? "#818cf8" : "#06b6d4";
              const gradTo = n.id==="rdv" ? "#4f46e5" : "#0891b2";
              return (
                <button key={n.id} onClick={()=>setPage(n.id)} style={{flex:1,paddingTop:8,paddingBottom:12,border:"none",cursor:"pointer",background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:2,WebkitTapHighlightColor:"transparent",outline:"none",position:"relative",minWidth:0}}>
                  {active && <div className="nav-pill-active" style={{position:"absolute",top:0,left:"50%",width:32,height:3,background:`linear-gradient(90deg,${gradFrom},${gradTo})`,borderRadius:"0 0 6px 6px"}}/>}
                  <div style={{width:40,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,background:active?"#e0f2fe":"transparent",transition:"background .15s"}}>{n.icon(active)}</div>
                  <span style={{fontSize:10,fontWeight:active?700:400,color:active?accentColor:"#94a3b8",transition:"all .15s",lineHeight:1}}>{n.l}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* MODALS */}
      {ficheClient&&(()=>{
        const latest=clients.find(c=>c.id===ficheClient.id)||ficheClient;
        return <FicheClient client={latest} passages={passages} livraisons={livraisons.filter(l=>l.clientId===latest.id)} rdvs={rdvs} produitsStock={Object.keys(stock)} contrats={contrats} versements={versements} onToggleVersement={handleToggleVersement} onUpdateContrat={(contractId,data)=>setContrats(prev=>{ const next={...prev,[contractId]:{...prev[contractId],...data}}; saveContrats(next); return next; })} onDeleteContrat={()=>deleteContrat(latest.id)} onUpdateClient={c=>{ setClients(prev=>{ const next=prev.map(x=>x.id===c.id?c:x); saveClients(next); return next; }); setFicheClient(c); }} onSaveLivraison={saveLivraison} onDeleteLivraison={deleteLivraison} onUpdateStatutLivraison={updateStatutLivraison} onClose={()=>setFicheClient(null)} onEdit={()=>{setEditClient(latest);setShowFormClient(true);setFicheClient(null);}} onDelete={()=>deleteClient(latest.id)} onDeletePassage={deletePassage} onAddPassage={()=>openAddPassageFromClient(latest.id)} onEditPassage={openEditPassage} onUpdatePassageStatus={updatePassageRapportStatus} onAddRdv={()=>{setEditRdv({clientId:latest.id});setShowFormRdv(true);}} onEditRdv={r=>{setEditRdv(r);setShowFormRdv(true);}} onDeleteRdv={deleteRdv}/>;
      })()}

      {showFormClient&&<FormClient initial={editClient} clients={clients} onSave={saveClient} onClose={()=>{setShowFormClient(false);setEditClient(null);}}/>}
      {showFormPassage&&<FormPassage clients={clients} defaultClientId={defaultClientId} initial={editPassage} onSave={p=>savePassage(p)} onSaveLivraison={saveLivraison} produitsStock={Object.keys(stock)} onClose={()=>{setShowFormPassage(false);setEditPassage(null);}}/>}
      {showFormLivraison&&<FormLivraison clientId={defaultLivraisonClientId} clients={clients} produitsStock={Object.keys(stock)} onSave={l=>{saveLivraison(l);setShowFormLivraison(false);}} onClose={()=>setShowFormLivraison(false)}/>}
      {showFormRdv&&<FormRdv initial={editRdv} clients={clients} onSave={saveRdv} onClose={()=>{setShowFormRdv(false);setEditRdv(null);}}/>}
      {showImport&&<ModalImportConnecteam clients={clients} onImport={handleImport} onClose={()=>setShowImport(false)}/>}
      {showImportHTML&&<ModalImportHTML clients={clients} passages={passages} onImport={handleImportHTML} onClose={()=>setShowImportHTML(false)}/>}
      {showStock&&<ModalStock stock={stock} stockMeta={stockMeta} onClose={()=>setShowStock(false)} onUpdateStock={updateStock} onUpdateMeta={updateStockMeta} onAddProduit={addProduitStock} onDeleteProduit={deleteProduitStock}/>}

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