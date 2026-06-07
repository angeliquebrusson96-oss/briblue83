// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from "react";
import { DS, MOIS_PAR_MOIS_DEF, MOIS, SAISONS_META } from "../utils/constants";
import { migrateMois, getMoisVal, getSaison, totalAnnuel, calcMensualites, TODAY } from "../utils/helpers";
import { useFormDraft, DraftBanner, Modal, PhotoPicker, FmField, FmSectionTitle, FmHeader, FmSteps } from "./ui";
import { toastWarn, toastSuccess, toastError } from "../styles";
import { migrateClientPhotoToStorage } from "../lib/photoStore";

// ─── AUTOCOMPLETE ADRESSE ─────────────────────────────────────────────────────
// Utilise l'API officielle française (gratuite, sans clé, ~100ms)
// https://api-adresse.data.gouv.fr
function AddressAutocomplete({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const [focusedIdx, setFocusedIdx]   = useState(-1);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);
  const inputRef    = useRef(null);

  const fetchSuggestions = useCallback(async (q) => {
    setLoading(true);
    try {
      const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=6&autocomplete=1`;
      const res  = await fetch(url, { signal: AbortSignal.timeout(4000) });
      const json = await res.json();
      setSuggestions(json.features || []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    setFocusedIdx(-1);
    clearTimeout(debounceRef.current);
    if (v.trim().length < 3) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 280);
  };

  const handleSelect = (feat) => {
    onChange(feat.properties.label);
    setSuggestions([]);
    setOpen(false);
    setFocusedIdx(-1);
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusedIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[focusedIdx]);
    } else if (e.key === "Escape") {
      setOpen(false); setFocusedIdx(-1);
    }
  };

  // Fermer si clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false); setFocusedIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Highlight du texte saisi dans la suggestion
  const highlight = (text, query) => {
    if (!query?.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.trim().toLowerCase().slice(0,10));
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong style={{color:"#0891b2",fontWeight:800}}>{text.slice(idx, idx + query.length)}</strong>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div ref={wrapRef} style={{position:"relative"}}>
      <div style={{position:"relative"}}>
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Ex : 12 rue de la Paix, Toulon"
          autoComplete="off"
        />
        {/* Icône loupe ou spinner */}
        <div style={{
          position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
          pointerEvents:"none",display:"flex",alignItems:"center",gap:4
        }}>
          {loading
            ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin .7s linear infinite"}}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
            : value?.length >= 3
              ? <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              : null
          }
        </div>
      </div>

      {/* Dropdown suggestions */}
      {open && suggestions.length > 0 && (
        <div style={{
          position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:9999,
          background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,
          boxShadow:"0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          overflow:"hidden",maxHeight:300,overflowY:"auto",
        }}>
          {suggestions.map((feat, i) => {
            const p = feat.properties;
            const isActive = focusedIdx === i;
            return (
              <button
                key={p.id || i}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(feat); }}
                onMouseEnter={() => setFocusedIdx(i)}
                style={{
                  display:"flex",alignItems:"center",gap:10,width:"100%",
                  padding:"10px 14px",border:"none",cursor:"pointer",fontFamily:"inherit",
                  textAlign:"left",transition:"background .1s",
                  background:isActive?"#f0f9ff":"#fff",
                  borderBottom:i < suggestions.length-1?"1px solid #f8fafc":"none",
                }}>
                {/* Icône pin */}
                <div style={{
                  width:28,height:28,borderRadius:8,flexShrink:0,
                  background:isActive?"#0891b2":"#f1f5f9",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"background .1s",
                }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                    stroke={isActive?"#fff":"#64748b"} strokeWidth="2.2" strokeLinecap="round">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#0f172a",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {highlight(p.name || p.label, value)}
                  </div>
                  <div style={{fontSize:11,color:"#64748b",marginTop:1}}>
                    {p.postcode} {p.city}
                    {p.context && <span style={{color:"#94a3b8"}}> · {p.context.split(",").pop()?.trim()}</span>}
                  </div>
                </div>
                {/* Badge type */}
                {p.type === "housenumber" && (
                  <span style={{fontSize:9,fontWeight:700,color:"#059669",
                    background:"#f0fdf4",border:"1px solid #bbf7d0",
                    borderRadius:5,padding:"1px 5px",flexShrink:0,whiteSpace:"nowrap"}}>
                    Précis
                  </span>
                )}
              </button>
            );
          })}
          {/* Mention légale API */}
          <div style={{padding:"6px 14px",background:"#f8fafc",
            fontSize:9,color:"#cbd5e1",borderTop:"1px solid #f1f5f9",
            display:"flex",alignItems:"center",gap:4}}>
            <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Adresses France — data.gouv.fr
          </div>
        </div>
      )}
    </div>
  );
}

// ── Extraction nom de famille / prénom depuis l'ancien format "Mme DUPONT Marie"
function extractNomFamille(c) {
  if (c.nomFamille) return c.nomFamille;
  return (c.nom || "").replace(/^(M\.|Mme|Mlle)\s*/i, "").trim().split(/\s+/)[0] || "";
}
function extractPrenom(c) {
  if (c.prenom) return c.prenom;
  const stripped = (c.nom || "").replace(/^(M\.|Mme|Mlle)\s*/i, "").trim();
  return stripped.split(/\s+/).slice(1).join(" ") || "";
}

export function FormClient({ initial, clients, onSave, onClose }) {
  const isNew = !initial?.id;
  const [step, setStep] = useState(1);
  const [f, setF] = useState(() => {
    if (initial) {
      // Édition : décompose le nom stocké en nomFamille + prenom
      const nomFamille = extractNomFamille(initial);
      const prenom     = extractPrenom(initial);
      return {
        ...initial,
        nom:            nomFamille,   // champ "Nom de famille" dans le formulaire
        prenom,                       // champ "Prénom"
        nomFamille,                   // stocké séparément
        moisParMois:    migrateMois(initial.moisParMois||initial.saisons),
        photoPiscine:   initial.photoPiscine||"",
        prixPassageE:   initial.prixPassageE||0,
        prixPassageC:   initial.prixPassageC||0,
        notesTarifaires:initial.notesTarifaires||"",
      };
    }
    // Nouveau client
    const maxNum = clients.reduce((max, c) => {
      const n = parseInt((c.id || "").replace(/^C/, ""), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const nextId = `C${String(maxNum + 1).padStart(3, "0")}`;
    return { id:nextId, civilite:"", nom:"", prenom:"", nomFamille:"", tel:"", email:"", adresse:"", bassin:"Liner", volume:30, formule:"VAC", prix:0, prixPassageE:0, prixPassageC:0, dateDebut:TODAY, photoPiscine:"", notesTarifaires:"", dateFin:`${new Date().getFullYear()+1}-03-31`, moisParMois:{...MOIS_PAR_MOIS_DEF}, envoyerContrat:false };
  });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const setMoisVal = (m,type,v) => setF(p=>({...p,moisParMois:{...p.moisParMois,[m]:{...p.moisParMois[m],[type]:Math.max(0,v)}}}));
  const totalE = totalAnnuel(f.moisParMois,"entretien");
  const totalC = totalAnnuel(f.moisParMois,"controle");
  const prixCalc = totalE*(f.prixPassageE||0)+totalC*(f.prixPassageC||0);

  // Nom d'affichage complet = Civilité + Prénom + NOM DE FAMILLE
  const nomAffiche = [f.civilite, (f.prenom||"").trim(), (f.nom||"").trim()].filter(Boolean).join(" ") || "…";

  // ── Upload photo IMMÉDIAT dès la sélection ────────────────────────────────────
  // Lance l'upload vers Firebase Storage pendant que l'utilisateur remplit le reste
  // du formulaire, sans attendre le save final. Garantit url https:// avant la soumission.
  const [photoUploading, setPhotoUploading] = useState(false);
  const handlePhotoChange = useCallback(async (v) => {
    set("photoPiscine", v);
    if (!v || v.startsWith("https://") || v.startsWith("fsp:")) return;
    setPhotoUploading(true);
    try {
      const migrated = await migrateClientPhotoToStorage({ id: f.id, photoPiscine: v });
      if (migrated?.photoPiscine) {
        set("photoPiscine", migrated.photoPiscine);
        const isCloud = migrated.photoPiscine.startsWith("https://") || migrated.photoPiscine.startsWith("fsp:");
        if (isCloud) toastSuccess("✅ Photo synchronisée — visible sur tous les appareils");
      } else {
        // Pas de réseau ou tout a échoué → reste en idb: (local seulement)
        toastError("⚠️ Photo sauvée localement uniquement (pas de réseau ?)");
      }
    } catch(e) {
      toastError("❌ Erreur lors de l'envoi de la photo");
    } finally {
      setPhotoUploading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.id]);

  const { hasDraft, restoreDraft, discardDraft, clearDraft } = useFormDraft(
    `briblue_draft_client_${initial?.id||"new"}`, f, setF, null, null,
    () => !!(f.nom?.trim() || f.prenom?.trim() || f.tel || f.email)
  );

  const STEPS = ["Infos", "Contrat", "Planning", "Tarif"];

  const handleSave = () => {
    if (!f.nom.trim()) { toastWarn("Nom de famille requis"); return; }
    const nomFamille = f.nom.trim().toUpperCase();
    const nomComplet = [f.civilite, (f.prenom||"").trim(), nomFamille].filter(Boolean).join(" ");
    clearDraft();
    onSave({ ...f, nom: nomComplet, nomFamille, prenom: (f.prenom||"").trim(), prix: prixCalc });
  };

  return (
    <Modal title="" onClose={onClose} wide noHeader>
      <div>
        <FmHeader title={isNew?"Nouveau client":`Modifier — ${nomAffiche}`} subtitle="Informations et contrat" color="#7c3aed" onClose={onClose}/>
        <FmSteps steps={STEPS} current={step} color="#7c3aed"/>
        {hasDraft&&!initial?.id&&<div style={{margin:"10px 20px 0"}}><DraftBanner onRestore={restoreDraft} onDiscard={discardDraft}/></div>}

        <div style={{padding:"16px 20px 20px",display:"flex",flexDirection:"column",gap:16}}>

          {/* ÉTAPE 1 — INFOS */}
          {step===1&&(
            <div className="fm-in" style={{display:"flex",flexDirection:"column",gap:12}}>
              <FmSectionTitle icon={<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>}>Identité</FmSectionTitle>

              {/* Civilité */}
              <FmField label="Civilité">
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[
                    {val:"M.",   label:"M.",    sub:"Monsieur"},
                    {val:"Mme",  label:"Mme",   sub:"Madame"},
                    {val:"Mlle", label:"Mlle",  sub:"Mademoiselle"},
                  ].map(({val,label,sub})=>{
                    const active = f.civilite===val;
                    return (
                      <button key={val} type="button"
                        onClick={()=>set("civilite", active?"":val)}
                        style={{
                          display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                          padding:"8px 18px",borderRadius:12,cursor:"pointer",fontFamily:"inherit",
                          border:`2px solid ${active?"#7c3aed":"#e2e8f0"}`,
                          background:active?"linear-gradient(135deg,#7c3aed,#a78bfa)":"rgba(255,255,255,0.6)",
                          transition:"all .15s",WebkitTapHighlightColor:"transparent",
                        }}>
                        <span style={{fontSize:15,fontWeight:900,color:active?"#fff":"#374151"}}>{label}</span>
                        <span style={{fontSize:9,fontWeight:600,color:active?"rgba(255,255,255,0.75)":"#94a3b8",letterSpacing:.3}}>{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </FmField>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <FmField label="Nom de famille *">
                  <input
                    value={f.nom}
                    onChange={e => set("nom", e.target.value.toUpperCase())}
                    placeholder="Ex : DUPONT"
                    style={{textTransform:"uppercase",fontWeight:700}}
                  />
                </FmField>
                <FmField label="Prénom">
                  <input
                    value={f.prenom||""}
                    onChange={e => set("prenom", e.target.value)}
                    placeholder="Ex : Marie"
                  />
                </FmField>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <FmField label="Téléphone"><input value={f.tel} onChange={e=>set("tel",e.target.value)} type="tel" placeholder="06 ..."/></FmField>
                <FmField label="Email"><input value={f.email} onChange={e=>set("email",e.target.value)} type="email" placeholder="@"/></FmField>
              </div>
              <FmField label="Adresse">
                <AddressAutocomplete value={f.adresse} onChange={v=>set("adresse",v)}/>
              </FmField>

              <FmSectionTitle icon={<><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 12h20"/></>}>Piscine</FmSectionTitle>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <FmField label="Type de bassin">
                  <select value={f.bassin} onChange={e=>set("bassin",e.target.value)}>
                    {["Liner","Béton","Coque polyester","PVC armé","Hors-sol","Autre"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </FmField>
                <FmField label="Volume (m³)"><input value={f.volume} onChange={e=>set("volume",+e.target.value)} type="number" placeholder="30"/></FmField>
              </div>
              <FmSectionTitle icon={<><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>}>
                Photo de la piscine
                {photoUploading && <span style={{marginLeft:8,fontSize:10,fontWeight:600,color:"#0891b2",display:"inline-flex",alignItems:"center",gap:4}}>
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin .7s linear infinite"}}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  Envoi en cours…
                </span>}
                {f.photoPiscine?.startsWith("https://") && <span style={{marginLeft:8,fontSize:10,fontWeight:700,color:"#059669"}}>✓ Synchronisée</span>}
              </FmSectionTitle>
              <PhotoPicker value={f.photoPiscine||""} onChange={handlePhotoChange} compact/>
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
                {[["Client", nomAffiche],["Formule",f.formule],["Bassin",`${f.bassin}${f.volume?" · "+f.volume+"m³":""}`],["Période",`${f.dateDebut||"—"} → ${f.dateFin||"—"}`],["Total passages",`${totalE} entretiens + ${totalC} contrôles`]].map(([l,v])=>(
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
              <>
                {/* Toggle : envoyer le contrat après création */}
                {isNew&&(
                  <button type="button" onClick={()=>set("envoyerContrat",!f.envoyerContrat)}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderRadius:14,border:`2px solid ${f.envoyerContrat?"#059669":"#e2e8f0"}`,background:f.envoyerContrat?"#f0fdf4":"rgba(255,255,255,0.5)",cursor:"pointer",fontFamily:"inherit",textAlign:"left",WebkitTapHighlightColor:"transparent",transition:"all .2s"}}>
                    <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${f.envoyerContrat?"#059669":"#cbd5e1"}`,background:f.envoyerContrat?"#059669":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                      {f.envoyerContrat&&<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:f.envoyerContrat?"#15803d":"#374151"}}>Envoyer le contrat pour signature</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:1}}>Le client recevra un email avec le lien de signature</div>
                    </div>
                  </button>
                )}
                <button className="fm-save-btn"
                  disabled={photoUploading}
                  style={{background:photoUploading?"linear-gradient(135deg,#94a3b8,#64748b)":f.envoyerContrat?"linear-gradient(135deg,#059669,#34d399)":"linear-gradient(135deg,#7c3aed,#6d28d9)",cursor:photoUploading?"not-allowed":"pointer"}}
                  onClick={handleSave}>
                  {photoUploading
                    ? <><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin .7s linear infinite"}}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Envoi photo en cours…</>
                    : f.envoyerContrat
                      ? <><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Créer et envoyer le contrat</>
                      : <><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Enregistrer le client</>
                  }
                </button>
              </>
            )}
            {step>1&&<button className="fm-cancel-btn" onClick={()=>setStep(s=>s-1)}>← Retour</button>}
            {step===1&&<button className="fm-cancel-btn" onClick={onClose}>Annuler</button>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
