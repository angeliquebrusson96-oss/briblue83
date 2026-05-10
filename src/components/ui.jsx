// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { flushPendingNow } from "../lib/storage";
import { DS, Ico, RAPPORT_STATUS } from "../utils/constants";
import { normalizeRapportStatus } from "../utils/helpers";
import { resolvePhoto } from "../lib/photoStore";

// ─── HOOKS ────────────────────────────────────────────────────────────────────
export function useIsMobile() {
  const [m, setM] = useState(() => {
    try { return window.innerWidth < 768; } catch { return false; }
  });
  useEffect(()=>{
    const handleResize = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", handleResize, {passive:true});
    window.addEventListener("orientationchange", handleResize, {passive:true});
    window.addEventListener("load", handleResize, {once:true,passive:true});
    return ()=>{
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  },[]);
  return m;
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(()=>{
    const onOn = ()=>{ setOnline(true); flushPendingNow(); setPendingCount(0); };
    const onOff = ()=>setOnline(false);
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    const interval = setInterval(()=>{ setPendingCount(window.briblue?._debug?.()?.pending ? Object.keys(window.briblue._debug().pending).length : 0); }, 5000);
    return ()=>{ window.removeEventListener('online', onOn); window.removeEventListener('offline', onOff); clearInterval(interval); };
  },[]);
  return { online, pendingCount };
}

export function useFormDraft(draftKey, formState, setFormState, step, setStep, hasContentFn) {
  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (d?._savedAt && (Date.now() - d._savedAt) > 7*24*3600*1000) {
        localStorage.removeItem(draftKey);
        return null;
      }
      return d;
    } catch { return null; }
  };
  const [draft] = useState(loadDraft);
  const [hasDraft, setHasDraft] = useState(!!draft);
  const [draftRestored, setDraftRestored] = useState(false);
  const draftTimerRef = useRef(null);

  useEffect(() => {
    if (!draftRestored) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try {
        if (hasContentFn()) {
          localStorage.setItem(draftKey, JSON.stringify({...formState, _savedAt: Date.now(), _step: step}));
        }
      } catch {}
    }, 400);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [formState, step, draftRestored, draftKey]);

  useEffect(() => {
    const flush = () => {
      try {
        if (draftRestored && hasContentFn()) {
          localStorage.setItem(draftKey, JSON.stringify({...formState, _savedAt: Date.now(), _step: step}));
        }
      } catch {}
    };
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, [formState, step, draftRestored, draftKey]);

  const restoreDraft = () => {
    if (!draft) return;
    const { _savedAt, _step, ...rest } = draft;
    setFormState(prev => ({...prev, ...rest}));
    if (_step && setStep) setStep(_step);
    setHasDraft(false);
    setDraftRestored(true);
  };
  const discardDraft = () => {
    try { localStorage.removeItem(draftKey); } catch {}
    setHasDraft(false);
    setDraftRestored(true);
  };
  const clearDraft = () => {
    try { localStorage.removeItem(draftKey); } catch {}
  };
  return { hasDraft, restoreDraft, discardDraft, clearDraft };
}

// ─── DRAFT BANNER ─────────────────────────────────────────────────────────────
export function DraftBanner({ onRestore, onDiscard }) {
  return (
    <div className="fade-in" style={{margin:"-4px 0 14px",padding:"14px 16px",borderRadius:16,background:"linear-gradient(135deg,rgba(245,158,11,0.18),rgba(217,119,6,0.12))",border:"1px solid rgba(245,158,11,0.35)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#f59e0b,#d97706)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 6px 20px rgba(245,158,11,0.35)"}}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-9-9c2.5 0 4.8 1 6.5 2.7"/><polyline points="21 3 21 9 15 9"/></svg>
      </div>
      <div style={{flex:1,minWidth:180}}>
        <div style={{fontSize:14,fontWeight:800,color:"#92400e"}}>Brouillon non sauvegardé</div>
        <div style={{fontSize:12,color:"#b45309",marginTop:2}}>Une saisie en cours a été retrouvée — la reprendre ?</div>
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={onDiscard} style={{padding:"8px 12px",borderRadius:10,border:"1px solid rgba(180,83,9,0.3)",background:"rgba(255,255,255,0.5)",color:"#92400e",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)"}}>Ignorer</button>
        <button onClick={onRestore} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(245,158,11,0.4)"}}>Restaurer</button>
      </div>
    </div>
  );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
export function Avatar({ nom, size=40, photo }) {
  if (photo) return <img src={photo} alt={nom} style={{width:size,height:size,borderRadius:size*0.3,objectFit:"cover",flexShrink:0,border:"2px solid "+DS.border}}/>;
  const initials = (nom||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const colors = [
    "linear-gradient(135deg,#0284c7,#06b6d4)",
    "linear-gradient(135deg,#4f46e5,#818cf8)",
    "linear-gradient(135deg,#059669,#34d399)",
    "linear-gradient(135deg,#0891b2,#06b6d4)",
    "linear-gradient(135deg,#0891b2,#22d3ee)",
    "linear-gradient(135deg,#db2777,#f472b6)"
  ];
  const bg = colors[nom?.charCodeAt(0)%colors.length] || colors[0];
  return (
    <div style={{width:size,height:size,borderRadius:size*0.3,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
      <span style={{color:"#fff",fontWeight:800,fontSize:size*0.35,letterSpacing:-0.5}}>{initials}</span>
    </div>
  );
}

// ─── PHOTO IMG ────────────────────────────────────────────────────────────────
// Résout les références "idb:..." depuis IndexedDB avant d'afficher l'image.
export function PhotoImg({ src, alt="", style={} }) {
  const [resolved, setResolved] = useState(() => (src?.startsWith("idb:") ? "" : src || ""));
  useEffect(() => {
    if (!src) { setResolved(""); return; }
    if (!src.startsWith("idb:")) { setResolved(src); return; }
    let cancelled = false;
    resolvePhoto(src).then(v => { if (!cancelled) setResolved(v); });
    return () => { cancelled = true; };
  }, [src]);
  if (!resolved) return null;
  return <img src={resolved} alt={alt} style={style} />;
}

// ─── ICO BUBBLE ──────────────────────────────────────────────────────────────
export function IcoBubble({ ico, color=DS.blue, bg, size=38 }) {
  const bgCol = bg || color+"15";
  return (
    <div style={{width:size,height:size,borderRadius:size*0.3,background:bgCol,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      {ico}
    </div>
  );
}

// ─── TAG ──────────────────────────────────────────────────────────────────────
export function Tag({ children, color=DS.blue, bg, style={} }) {
  const bgCol = bg || color+"14";
  return (
    <span style={{background:bgCol,color,borderRadius:20,padding:"3px 10px",fontSize:15,fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4,letterSpacing:-0.2,...style}}>{children}</span>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, wide, noHeader }) {
  const isMobile = useIsMobile();
  useEffect(()=>{
    const prev = document.body.style.overflow;
    const prevPos = document.body.style.position;
    const prevTop = document.body.style.top;
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return ()=>{
      document.body.style.overflow = prev;
      document.body.style.position = prevPos;
      document.body.style.top = prevTop;
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  },[]);
  const maxH = isMobile ? "min(92dvh,92vh)" : "min(88dvh,88vh)";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(11,18,32,0.45)",zIndex:200,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?"0":"12px",backdropFilter:"blur(14px) saturate(140%)",WebkitBackdropFilter:"blur(14px) saturate(140%)"}}>
      <div className={isMobile?"slide-up":"scale-in"}
        style={{
          background:"rgba(255,255,255,0.72)",
          backdropFilter:"blur(28px) saturate(200%)",
          WebkitBackdropFilter:"blur(28px) saturate(200%)",
          borderRadius:isMobile?"28px 28px 0 0":DS.radiusLg,
          width:"100%",maxWidth:isMobile?"100%":wide?720:560,
          maxHeight:maxH,
          display:"flex",flexDirection:"column",
          boxShadow:"0 30px 80px rgba(6,182,212,0.22), 0 10px 30px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
          border:"1px solid rgba(255,255,255,0.55)",
          overflowY:"hidden",
          paddingBottom:"env(safe-area-inset-bottom,0px)",
          overscrollBehavior:"contain",
          WebkitOverflowScrolling:"touch",
        }}>
        {isMobile && <div style={{flexShrink:0,display:"flex",justifyContent:"center",paddingTop:10,paddingBottom:2}}>
          <div style={{width:42,height:5,borderRadius:3,background:"linear-gradient(90deg,#22d3ee,#0891b2)",opacity:0.6}}/>
        </div>}
        {!noHeader && <div style={{flexShrink:0,padding:isMobile?"8px 18px 12px":"14px 24px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid rgba(255,255,255,0.45)"}}>
          <span style={{color:DS.dark,fontWeight:800,fontSize:17,letterSpacing:"-0.01em"}}>{title}</span>
          <button onClick={onClose} style={{width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(220,38,38,0.35)",flexShrink:0}}>
            {Ico.close(18,"#fff")}
          </button>
        </div>}
        <div data-modal-body="1" style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:noHeader?"0":isMobile?"14px 18px 24px":"20px 24px 24px",overscrollBehavior:"contain"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── SECTION ──────────────────────────────────────────────────────────────────
export function Section({ title, children, style={} }) {
  return (
    <div style={{marginBottom:22,...style}}>
      {title && <div style={{fontSize:15,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>{title}</div>}
      {children}
    </div>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color=DS.blue, height=6 }) {
  const pct = max > 0 ? Math.min(100, value/max*100) : 0;
  return (
    <div style={{height,background:"#dde8f0",borderRadius:99,overflow:"hidden",boxShadow:"inset 2px 2px 4px rgba(6,182,212,0.15)"}}>
      <div style={{height:"100%",width:`${pct}%`,background:pct>=100?"linear-gradient(135deg,#10b981,#34d399)":"linear-gradient(135deg,#22d3ee 0%,#0891b2 100%)",borderRadius:99,transition:"width .5s cubic-bezier(.22,1,.36,1)"}}/>
    </div>
  );
}

// ─── CARD ────────────────────────────────────────────────────────────────────
export function Card({ children, style={}, onClick, className="", id }) {
  return (
    <div id={id} onClick={onClick} className={onClick?"card-hover":className} style={{background:"rgba(255,255,255,0.45)",borderRadius:18,padding:"16px 18px",boxShadow:"5px 5px 12px rgba(6,182,212,0.15), -4px -4px 9px rgba(255,255,255,0.9)",border:"none",cursor:onClick?"pointer":"default",transition:"all .2s",...style}}>{children}</div>
  );
}

// ─── INPUT ───────────────────────────────────────────────────────────────────
export function Input({ label, ...p }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label && <span style={{fontSize:13,fontWeight:600,color:DS.mid,textTransform:"uppercase",letterSpacing:.7}}>{label}</span>}
      <input style={{padding:"11px 14px",borderRadius:DS.radiusSm,border:"none",fontSize:15,outline:"none",background:"rgba(255,255,255,0.45)",boxSizing:"border-box",width:"100%",color:DS.dark,fontFamily:"inherit",transition:"all .2s",boxShadow:"inset 3px 3px 6px rgba(6,182,212,0.15), inset -2px -2px 5px rgba(255,255,255,0.8)",...(p.style||{})}} {...p}/>
    </div>
  );
}

// ─── SELECT ──────────────────────────────────────────────────────────────────
export function Select({ label, options, ...p }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label && <span style={{fontSize:13,fontWeight:600,color:DS.mid,textTransform:"uppercase",letterSpacing:.7}}>{label}</span>}
      <select style={{padding:"11px 14px",borderRadius:DS.radiusSm,border:"none",fontSize:15,outline:"none",background:"rgba(255,255,255,0.45)",color:DS.dark,fontFamily:"inherit",cursor:"pointer",appearance:"none",boxShadow:"inset 3px 3px 6px rgba(6,182,212,0.15), inset -2px -2px 5px rgba(255,255,255,0.8)",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",paddingRight:36}} {...p}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── PHOTO PICKER ─────────────────────────────────────────────────────────────
export function PhotoPicker({ label, value, onChange, compact }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1024;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      onChange(canvas.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // fallback: raw reader si canvas échoue
      const reader = new FileReader();
      reader.onload = () => onChange(reader.result);
      reader.readAsDataURL(file);
    };
    img.src = objectUrl;
  };

  return (
    <div>
      {label && (
        <span style={{fontSize:15,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:8}}>
          {label}
        </span>
      )}
      {value ? (
        <div style={{position:"relative",borderRadius:DS.radius,overflow:"hidden",border:"2px solid "+DS.blue,background:"#000"}}>
          <PhotoImg src={value} alt="photo" style={{width:"100%",maxHeight:compact?120:220,objectFit:"cover",display:"block"}}/>
          <button onClick={() => onChange("")} style={{position:"absolute",top:8,right:8,width:32,height:32,borderRadius:16,background:"rgba(0,0,0,0.6)",border:"2px solid rgba(255,255,255,0.4)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>{Ico.close(14,"#fff")}</button>
          <button onClick={() => cameraRef.current?.click()} style={{position:"absolute",bottom:8,right:8,padding:"6px 12px",borderRadius:10,background:"rgba(0,0,0,0.55)",border:"1px solid rgba(255,255,255,0.3)",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:15,fontWeight:600,color:"#fff",fontFamily:"inherit"}}>{Ico.camera(13,"#fff")} Reprendre</button>
        </div>
      ) : (
        <div style={{display:"flex",gap:10}}>
          <button onClick={() => cameraRef.current?.click()} className="btn-hover" style={{flex:1,padding:"16px 10px",borderRadius:DS.radius,border:"none",background:"rgba(255,255,255,0.45)",boxShadow:DS.nmShadow,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,fontFamily:"inherit"}}>
            {Ico.camera(24,DS.blue)}
            <span style={{fontSize:15,fontWeight:700,color:DS.blue}}>Caméra</span>
            <span style={{fontSize:15,color:DS.mid}}>Photo directe</span>
          </button>
          <button onClick={() => galleryRef.current?.click()} className="btn-hover" style={{flex:1,padding:"16px 10px",borderRadius:DS.radius,border:"none",background:"rgba(255,255,255,0.45)",boxShadow:DS.nmShadow,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,fontFamily:"inherit"}}>
            {Ico.image(24,DS.mid)}
            <span style={{fontSize:15,fontWeight:700,color:DS.mid}}>Galerie</span>
            <span style={{fontSize:15,color:"#94a3b8"}}>Depuis l'album</span>
          </button>
        </div>
      )}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleFile}/>
      <input ref={galleryRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
    </div>
  );
}

// ─── BTN PRIMARY ─────────────────────────────────────────────────────────────
export function BtnPrimary({ children, onClick, bg="linear-gradient(135deg,#22d3ee 0%,#0891b2 100%)", color="#fff", icon, style={} }) {
  return (
    <button onClick={onClick} className="btn-hover" style={{padding:"13px 22px",borderRadius:14,background:bg,border:"1px solid rgba(255,255,255,0.25)",cursor:"pointer",fontWeight:700,fontSize:15,color,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 10px 30px rgba(6,182,212,0.30), inset 0 1px 0 rgba(255,255,255,0.35)",transition:"all .22s cubic-bezier(.22,1,.36,1)",letterSpacing:"0.01em",...style}}>
      {icon}{children}
    </button>
  );
}

// ─── SUN BURST ACTIONS ───────────────────────────────────────────────────────
export function SunBurstActions({ actions, centerLabel = "FERMER", onClose, size = "auto" }) {
  const N = actions.length;
  if (N === 0) return null;
  const BTN_SIZE = 70;
  const RADIUS = N <= 4 ? 90 : N <= 6 ? 105 : N <= 8 ? 120 : 130;
  const PAD = BTN_SIZE / 2 + 16;
  const SIZE = (RADIUS * 2) + (BTN_SIZE) + 32;

  return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",width:"100%",margin:"24px 0 12px"}}>
    <div className="fade-in" style={{width:SIZE,height:SIZE,position:"relative",maxWidth:"100%"}}>
      <div style={{position:"absolute",inset:PAD,borderRadius:"50%",background:"radial-gradient(circle, rgba(8,145,178,0.10) 0%, rgba(8,145,178,0) 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"50%",left:"50%",width:RADIUS*2,height:RADIUS*2,marginLeft:-RADIUS,marginTop:-RADIUS,borderRadius:"50%",border:"1.5px dashed rgba(8,145,178,0.22)",pointerEvents:"none"}}/>
      <button onClick={onClose} style={{position:"absolute",top:"50%",left:"50%",width:60,height:60,marginLeft:-30,marginTop:-30,borderRadius:"50%",background:"linear-gradient(135deg,#0c1f3f,#0369a1)",border:"3px solid rgba(255,255,255,0.9)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,boxShadow:"0 8px 24px rgba(12,31,63,0.45), inset 0 2px 6px rgba(255,255,255,0.2)",zIndex:5,fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <span style={{fontSize:7,fontWeight:900,color:"#7dd3fc",letterSpacing:0.5}}>{centerLabel}</span>
      </button>
      {actions.map((act, i) => {
        const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * RADIUS;
        const y = Math.sin(angle) * RADIUS;
        return (
          <button key={i} onClick={(e)=>{ e.stopPropagation(); act.onClick(); }} style={{position:"absolute",top:`calc(50% + ${y}px)`,left:`calc(50% + ${x}px)`,width:BTN_SIZE,height:BTN_SIZE,marginLeft:-(BTN_SIZE/2),marginTop:-(BTN_SIZE/2),borderRadius:"50%",background:act.bg,border:"3px solid rgba(255,255,255,0.95)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,boxShadow:"0 8px 22px rgba(0,0,0,0.22), inset 0 1px 3px rgba(255,255,255,0.25)",animation:`burstX-${i}-${N} .4s cubic-bezier(.34,1.56,.64,1) both`,WebkitTapHighlightColor:"transparent",fontFamily:"inherit"}}>
            {act.ic}
            <span style={{fontSize:9,fontWeight:800,color:"#fff",lineHeight:1.1,marginTop:2,textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>{act.label}</span>
          </button>
        );
      })}
      <style>{actions.map((_,i)=>{
        const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
        const dx = -Math.cos(angle) * RADIUS * 0.5;
        const dy = -Math.sin(angle) * RADIUS * 0.5;
        return `@keyframes burstX-${i}-${N} { 0% { opacity:0; transform: scale(0.3) translate(${dx}px, ${dy}px); } 100% { opacity:1; transform: scale(1) translate(0,0); } }`;
      }).join(" ")}</style>
    </div>
    </div>
  );
}

// ─── SUN BURST FORM NAV ───────────────────────────────────────────────────────
export function SunBurstFormNav({
  step, totalSteps, onNext, onPrev, onSave, onCancel,
  onSaveDraft, draftSaved,
  nextLabel, nextColor = "#0891b2",
  saveLabel = "Enregistrer",
  showStepIndicator = true,
  showDraft = true,
}) {
  return (
    <div style={{marginTop:32,paddingTop:20,borderTop:"1px solid rgba(8,145,178,0.15)"}}>
      {showStepIndicator && totalSteps > 1 && (
        <div style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#475569",letterSpacing:1.2,textTransform:"uppercase",marginBottom:14}}>
          Étape {step} sur {totalSteps}
        </div>
      )}
      {step < totalSteps && onNext && (
        <button onClick={onNext} style={{width:"100%",minHeight:56,padding:"16px 20px",borderRadius:14,background:`linear-gradient(135deg, ${nextColor}, ${nextColor}cc)`,border:"none",cursor:"pointer",fontWeight:800,fontSize:15,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:`0 8px 24px ${nextColor}55`,WebkitTapHighlightColor:"transparent",letterSpacing:0.3,marginBottom:12}}>
          <span>Suivant{nextLabel ? ` : ${nextLabel}` : ""}</span>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      )}
      <button onClick={onSave} style={{width:"100%",minHeight:56,padding:"16px 20px",borderRadius:14,background:"linear-gradient(135deg,#059669,#10b981)",border:"none",cursor:"pointer",fontWeight:800,fontSize:15,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 8px 24px rgba(5,150,105,0.45)",WebkitTapHighlightColor:"transparent",letterSpacing:0.3,marginBottom:12}}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        {saveLabel}
      </button>
      <div style={{display:"flex",gap:10}}>
        {showDraft && onSaveDraft && (
          <button onClick={onSaveDraft} style={{flex:1,minHeight:48,padding:"12px 14px",borderRadius:12,background:draftSaved?"linear-gradient(135deg,#059669,#0d9488)":"rgba(245,158,11,0.12)",border:`1.5px solid ${draftSaved?"#059669":"rgba(245,158,11,0.4)"}`,cursor:"pointer",fontWeight:700,fontSize:13,color:draftSaved?"#fff":"#92400e",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:7,transition:"all .3s",WebkitTapHighlightColor:"transparent"}}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            {draftSaved ? "✓ Sauvegardé" : "Brouillon"}
          </button>
        )}
        <button onClick={step===1 || !onPrev ? onCancel : onPrev} style={{flex:1,minHeight:48,padding:"12px 14px",borderRadius:12,background:"rgba(255,255,255,0.7)",border:"1.5px solid rgba(8,145,178,0.18)",cursor:"pointer",fontWeight:700,fontSize:13,color:"#475569",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:7,WebkitTapHighlightColor:"transparent"}}>
          {(step===1 || !onPrev)
            ? <><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Annuler</>
            : <><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Retour</>
          }
        </button>
      </div>
    </div>
  );
}

// ─── RAPPORT STATUS PICKER ────────────────────────────────────────────────────
export function RapportStatusPicker({ value, onChange, compact=false }) {
  const current = normalizeRapportStatus(value);
  const meta = RAPPORT_STATUS[current] || RAPPORT_STATUS["cree"];
  return (
    <select value={current} onChange={e=>onChange?.(e.target.value)}
      style={{padding:compact?"7px 10px":"11px 14px",borderRadius:compact?10:DS.radiusSm,border:"1.5px solid "+meta.color+"33",background:meta.bg,color:meta.color,fontSize:compact?12:14,fontWeight:800,fontFamily:"inherit",cursor:"pointer",outline:"none",appearance:"none",minWidth:compact?138:"100%"}}>
      {Object.entries(RAPPORT_STATUS).map(([k,s])=>(
        <option key={k} value={k}>{s.label}</option>
      ))}
    </select>
  );
}

// ─── FORM HELPERS ─────────────────────────────────────────────────────────────
export function FmField({ label, children, style }) {
  return (
    <div className="fm-field" style={style}>
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

export function FmSectionTitle({ icon, children }) {
  return (
    <div className="fm-section-title">
      {icon && <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round">{icon}</svg>}
      {children}
    </div>
  );
}

export function FmHeader({ title, subtitle, color="#0891b2", onClose }) {
  return (
    <div style={{background:`linear-gradient(135deg,${color},${color}dd)`,padding:"20px 20px 18px",borderRadius:"18px 18px 0 0",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.08)",pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",position:"relative"}}>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:"#fff",letterSpacing:"-0.3px"}}>{title}</div>
          {subtitle&&<div style={{fontSize:12,color:"rgba(255,255,255,0.7)",marginTop:3}}>{subtitle}</div>}
        </div>
        <button onClick={onClose} style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.18)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"white"}}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}

export function FmSteps({ steps, current, color="#0891b2" }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:0,padding:"14px 20px 0"}}>
      {steps.map((s,i)=>{
        const done=i<current-1, active=i===current-1;
        return (
          <React.Fragment key={i}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1}}>
              <div style={{width:28,height:28,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",background:done?"#dcfce7":active?color:"#f1f5f9",border:`2px solid ${done?"#22c55e":active?color:"#e2e8f0"}`,transition:"all 0.25s"}}>
                {done
                  ? <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span style={{fontSize:11,fontWeight:700,color:active?"#fff":"#94a3b8"}}>{i+1}</span>
                }
              </div>
              <span style={{fontSize:10,fontWeight:active?600:400,color:active?color:done?"#16a34a":"#94a3b8",textAlign:"center",letterSpacing:"0.2px"}}>{s}</span>
            </div>
            {i<steps.length-1&&<div style={{height:2,flex:1,background:i<current-1?"#bbf7d0":"#f1f5f9",borderRadius:1,marginBottom:18,transition:"background 0.3s"}}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}
