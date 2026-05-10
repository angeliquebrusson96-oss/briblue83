// @ts-nocheck
import React, { useState } from "react";
import { DS, Ico, MOIS_L, SAISONS_META } from "../utils/constants";
import { isEntretienType, isControleType, getEntretienMois, getControleMois, MOIS_NOW, YEAR_NOW } from "../utils/helpers";
import { Card, Avatar, Tag, IcoBubble } from "./ui";

// ─── alerteClient helpers (local copy for AlertesBlock) ────────────────────────
function daysUntil(d) {
  if (!d) return null;
  return Math.round((new Date(d) - new Date()) / 86400000);
}

const AC = {
  rouge:  { bg:"#fee2e2", bd:"#fda4af", tx:"#dc2626", lbl:"URGENT"    },
  jaune:  { bg:"#fef9c3", bd:"#fcd34d", tx:"#ca8a04", lbl:"Attention" },
  orange: { bg:"#ffedd5", bd:"#fcd34d", tx:"#ea580c", lbl:"Retard"    },
  aFaire: { bg:"#eff6ff", bd:"#bfdbfe", tx:"#2563eb", lbl:"À faire"   },
  ok:     { bg:"#f0fdf4", bd:"#bbf7d0", tx:"#16a34a", lbl:"OK"        },
};

// ─────────────────────────────────────────────────────────────────────────────
// CALENDRIER INTERACTIF
// ─────────────────────────────────────────────────────────────────────────────
export function CalendrierInteractif({ passages, rdvs, clients, onClientClick, onEditPassage, onEditRdv }) {
  const [calMonth, setCalMonth] = useState(MOIS_NOW);
  const [calYear, setCalYear] = useState(YEAR_NOW);
  const [selectedDay, setSelectedDay] = useState(null);

  const prevMonth = () => {
    if (calMonth===1) { setCalMonth(12); setCalYear(y=>y-1); }
    else setCalMonth(m=>m-1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (calMonth===12) { setCalMonth(1); setCalYear(y=>y+1); }
    else setCalMonth(m=>m+1);
    setSelectedDay(null);
  };
  const goToday = () => { setCalMonth(MOIS_NOW); setCalYear(YEAR_NOW); setSelectedDay(null); };

  const firstDay=new Date(calYear,calMonth-1,1).getDay();
  const nbDays=new Date(calYear,calMonth,0).getDate();
  const todayDate=new Date();
  const isCurrentMonth=calMonth===todayDate.getMonth()+1&&calYear===todayDate.getFullYear();
  const today=isCurrentMonth?todayDate.getDate():null;

  const passageDays=new Set(passages.filter(p=>{ const d=new Date(p.date); return d.getMonth()+1===calMonth&&d.getFullYear()===calYear; }).map(p=>new Date(p.date).getDate()));
  const rdvDays=new Set(rdvs.filter(r=>{const d=new Date(r.date);return d.getMonth()+1===calMonth&&d.getFullYear()===calYear;}).map(r=>new Date(r.date).getDate()));

  // Jours avec passages non prévus (extra) — on compare passages du mois vs planning
  const extraDays = new Set();
  if (calYear === YEAR_NOW) {
    clients.forEach(c => {
      const prevE = getEntretienMois(c.moisParMois||c.saisons||{}, calMonth);
      const prevC = getControleMois(c.moisParMois||c.saisons||{}, calMonth);
      const passM = passages.filter(p => p.clientId===c.id && new Date(p.date).getMonth()+1===calMonth && new Date(p.date).getFullYear()===calYear);
      const doneE = passM.filter(p=>isEntretienType(p.type)).length;
      const doneC = passM.filter(p=>isControleType(p.type)).length;
      if (doneE > prevE || doneC > prevC) {
        // Mark the extra passage days
        passM.slice(prevE+prevC).forEach(p => extraDays.add(new Date(p.date).getDate()));
      }
    });
  }

  const offset=(firstDay+6)%7;
  const cells=[...Array(offset).fill(null),...Array.from({length:nbDays},(_,i)=>i+1)];

  const selDateStr = selectedDay ? `${calYear}-${String(calMonth).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}` : null;
  const dayPassages = selDateStr ? passages.filter(p=>p.date===selDateStr) : [];
  const dayRdvs = selDateStr ? rdvs.filter(r=>r.date===selDateStr) : [];

  return (
    <Card style={{marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <button onClick={prevMonth} className="btn-hover" style={{width:34,height:34,borderRadius:10,background:DS.light,border:"1px solid "+DS.border,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.back(14,DS.mid)}</button>
        <div style={{textAlign:"center",flex:1}}>
          <button onClick={goToday} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>
            <div style={{fontSize:15,fontWeight:900,color:DS.dark,letterSpacing:-0.3}}>{MOIS_L[calMonth]}</div>
            <div style={{fontSize:11,fontWeight:600,color:DS.mid}}>{calYear}{!isCurrentMonth?" · Retour aujourd'hui":""}</div>
          </button>
        </div>
        <button onClick={nextMonth} className="btn-hover" style={{width:34,height:34,borderRadius:10,background:DS.light,border:"1px solid "+DS.border,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.next(14,DS.mid)}</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {["L","M","M","J","V","S","D"].map((d,i)=>(<div key={i} style={{textAlign:"center",fontSize:9,fontWeight:800,color:DS.mid,padding:"2px 0"}}>{d}</div>))}
        {cells.map((day,i)=>{
          if(!day) return <div key={i}/>;
          const isToday=day===today, hasP=passageDays.has(day), hasR=rdvDays.has(day), isSel=day===selectedDay;
          const isExtra=extraDays.has(day);
          return (
            <div key={i} onClick={()=>setSelectedDay(day===selectedDay?null:day)}
              style={{textAlign:"center",padding:"5px 2px",borderRadius:7,
                background:isSel?DS.blue:isToday?DS.dark:hasP?DS.blueSoft:hasR?DS.purpleSoft:"transparent",
                border:isSel?"2px solid "+DS.blue:isToday?"none":hasP?"1.5px solid "+DS.blue:hasR?"1.5px solid "+DS.purple:"1px solid transparent",
                position:"relative",cursor:"pointer",transition:"all .15s"}}>
              <span style={{fontSize:10,fontWeight:isToday||hasP||hasR||isSel?800:400,color:isSel||isToday?"#fff":hasP?DS.blue:hasR?DS.purple:DS.mid}}>{day}</span>
              <div style={{display:"flex",justifyContent:"center",gap:2,marginTop:1}}>
                {hasP&&!isToday&&!isSel&&<div style={{width:4,height:4,borderRadius:2,background:DS.blue}}/>}
                {hasR&&!isToday&&!isSel&&<div style={{width:4,height:4,borderRadius:2,background:DS.purple}}/>}
                {isExtra&&!isToday&&!isSel&&<span style={{fontSize:8,lineHeight:1}}>⭐</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{display:"flex",gap:12,fontSize:11,color:DS.mid,justifyContent:"flex-end",fontWeight:600,marginTop:4,flexWrap:"wrap"}}>
        <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:4,background:DS.dark}}/> Aujourd'hui</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:4,background:DS.blue}}/> Passage</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:4,background:DS.purple}}/> RDV</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}>⭐ Non prévu</span>
      </div>

      {selectedDay && (dayPassages.length>0||dayRdvs.length>0) && (
        <div className="fade-in" style={{marginTop:12,padding:"14px",background:DS.light,borderRadius:DS.radiusSm,border:"1px solid "+DS.border}}>
          <div style={{fontWeight:800,fontSize:13,color:DS.dark,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
            {Ico.calendar(14,DS.blue)} {selectedDay} {MOIS_L[calMonth]} {calYear}
          </div>

          {dayPassages.length>0 && (
            <div style={{marginBottom:dayRdvs.length>0?10:0}}>
              <div style={{fontSize:10,fontWeight:800,color:DS.blue,textTransform:"uppercase",letterSpacing:.8,marginBottom:6}}>Passages ({dayPassages.length})</div>
              {dayPassages.map(p=>{
                const c=clients.find(x=>x.id===p.clientId);
                const isCtrl=isControleType(p.type);
                return (
                  <div key={p.id} onClick={()=>onEditPassage&&onEditPassage(p)} className="card-hover" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"rgba(255,255,255,0.45)",borderRadius:8,marginBottom:4,border:"1.5px solid "+DS.blue+"33",cursor:"pointer"}}>
                    <Avatar nom={c?.nom||"?"} size={30} photo={c?.photoPiscine}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:12,color:DS.dark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c?.nom||p.clientId}</div>
                      <div style={{fontSize:11,color:DS.mid,marginTop:1}}>{isCtrl?"💧":"🔧"} {p.type}{p.tech?" · "+p.tech:""}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {p.ok?<div style={{width:20,height:20,borderRadius:10,background:DS.greenSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.check(10,DS.green)}</div>
                           :<div style={{width:20,height:20,borderRadius:10,background:DS.redSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.x(10,DS.red)}</div>}
                      <div style={{width:20,height:20,borderRadius:10,background:DS.blueSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.edit(10,DS.blue)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {dayRdvs.length>0 && (
            <div>
              <div style={{fontSize:10,fontWeight:800,color:DS.purple,textTransform:"uppercase",letterSpacing:.8,marginBottom:6}}>RDV ({dayRdvs.length})</div>
              {dayRdvs.map(r=>{
                const c=clients.find(x=>x.id===r.clientId);
                return (
                  <div key={r.id} onClick={()=>onEditRdv&&onEditRdv(r)} className="card-hover" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"rgba(255,255,255,0.45)",borderRadius:8,marginBottom:4,border:"none",cursor:"pointer"}}>
                    <div style={{width:30,textAlign:"center",flexShrink:0}}>
                      <div style={{fontSize:13,fontWeight:900,color:DS.purple}}>{r.heure||"--:--"}</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:12,color:DS.dark}}>{r.type}</div>
                      {c&&<div style={{fontSize:11,color:DS.mid,marginTop:1}}>{c.nom}</div>}
                      {r.description&&<div style={{fontSize:11,color:DS.mid}}>{r.description}</div>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <Tag color={DS.purple} style={{fontSize:10}}>{r.duree||60}min</Tag>
                      <div style={{width:20,height:20,borderRadius:10,background:DS.purpleSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.edit(10,DS.purple)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedDay && dayPassages.length===0 && dayRdvs.length===0 && (
        <div className="fade-in" style={{marginTop:12,padding:"16px",background:DS.light,borderRadius:DS.radiusSm,textAlign:"center",color:DS.mid,fontSize:12,fontWeight:500}}>
          Aucun événement le {selectedDay} {MOIS_L[calMonth]}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERTES COLLAPSIBLE
// ─────────────────────────────────────────────────────────────────────────────
export function AlertesBlock({ alertes, passages, onClientClick }) {
  const [open, setOpen] = useState(false);
  const preview = alertes.slice(0, 2);
  return (
    <div style={{borderRadius:DS.radius,border:"1px solid "+DS.red+"33",background:DS.white,overflow:"hidden",boxShadow:DS.shadow,marginBottom:0}}>
      {/* Header cliquable */}
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",cursor:"pointer",background:DS.redSoft}}>
        <IcoBubble ico={Ico.alert(14,DS.red)} color={DS.red} size={30}/>
        <span style={{flex:1,fontWeight:800,fontSize:15,color:DS.red}}>⚠️ {alertes.length} Alerte{alertes.length>1?"s":""}</span>
        <div style={{width:28,height:28,borderRadius:8,background:DS.red+"18",display:"flex",alignItems:"center",justifyContent:"center",transition:"transform .2s",transform:open?"rotate(45deg)":"none"}}>
          {open
            ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={DS.red} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={DS.red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          }
        </div>
      </div>
      {/* Aperçu 2 lignes quand fermé */}
      {!open && (
        <div style={{padding:"8px 16px 10px"}}>
          {preview.map(c=>{
            const al=alerteClientSimple(c,passages); const col=AC[al];
            return (
              <div key={c.id} onClick={()=>onClientClick(c)} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid "+DS.border,cursor:"pointer"}}>
                <Avatar nom={c.nom} size={28} photo={c.photoPiscine}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:DS.dark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</div>
                </div>
                <Tag color={col.tx}>{col.lbl}</Tag>
              </div>
            );
          })}
          {alertes.length > 2 && (
            <div onClick={()=>setOpen(true)} style={{textAlign:"center",paddingTop:8,fontSize:12,fontWeight:700,color:DS.red,cursor:"pointer"}}>
              + {alertes.length-2} autre{alertes.length-2>1?"s":""} — Voir tout
            </div>
          )}
        </div>
      )}
      {/* Liste complète quand ouvert */}
      {open && (
        <div style={{padding:"4px 16px 12px"}}>
          {alertes.map(c=>{
            const al=alerteClientSimple(c,passages); const col=AC[al]; const j=daysUntil(c.dateFin);
            return (
              <div key={c.id} onClick={()=>onClientClick(c)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+DS.border,cursor:"pointer"}}>
                <Avatar nom={c.nom} size={36} photo={c.photoPiscine}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:DS.dark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</div>
                  <div style={{fontSize:12,color:DS.mid,marginTop:2}}>{al==="rouge"||al==="jaune"?`Expire dans ${j} jours`:"Passages en retard"}</div>
                </div>
                <Tag color={col.tx}>{col.lbl}</Tag>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Simple local alerteClient just for the label display in AlertesBlock
// (full logic lives in helpers.js as alerteClient; Dashboard passes pre-filtered list)
function alerteClientSimple(c, passages) {
  const j = daysUntil(c.dateFin);
  if (j !== null && j >= 0 && j <= 30) return "rouge";
  if (j !== null && j > 30 && j <= 60) return "jaune";
  return "orange";
}
