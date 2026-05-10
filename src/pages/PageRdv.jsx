// @ts-nocheck
import React, { useState, useMemo } from "react";
import { DS, Ico, MOIS } from "../utils/constants";
import { TODAY } from "../utils/helpers";
import { exportRdvToICS } from "../utils/helpers";
import { Card, Tag, BtnPrimary } from "../components/ui";
import { showConfirm } from "../styles";

export function PageRdv({ clients, rdvs, onAdd, onEdit, onDelete }) {
  const [filter,setFilter]=useState("avenir");
  const filtered=useMemo(()=>{
    let list = [...rdvs];
    if(filter==="avenir") list = list.filter(r=>r.date>=TODAY);
    else if(filter==="passe") list = list.filter(r=>r.date<TODAY);
    return list.sort((a,b)=>filter==="passe"?b.date.localeCompare(a.date):a.date.localeCompare(b.date));
  },[rdvs,filter]);

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[["avenir","À venir"],["passe","Passés"],["tout","Tous"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} className="btn-hover" style={{padding:"7px 16px",borderRadius:20,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",background:filter===v?DS.blue:DS.white,color:filter===v?"#fff":DS.mid,border:filter===v?"none":"1px solid "+DS.border}}>{l}</button>
        ))}
        <span style={{marginLeft:"auto",fontSize:12,color:DS.mid,alignSelf:"center",fontWeight:600}}>{filtered.length} RDV</span>
      </div>
      <BtnPrimary onClick={onAdd} bg={DS.blue} icon={Ico.plus(13,"#fff")} style={{width:"100%",marginBottom:14,borderRadius:DS.radiusSm}}>Nouveau rendez-vous</BtnPrimary>
      {filtered.length===0
        ? <div style={{textAlign:"center",color:DS.mid,padding:40,fontSize:13}}>Aucun rendez-vous</div>
        : <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map((r,idx)=>{
            const c = clients.find(x=>x.id===r.clientId);
            const d = new Date(r.date);
            const isToday = r.date===TODAY;
            const isPast = r.date<TODAY;
            return (
              <Card key={r.id} className="fade-in" style={{animationDelay:`${idx*0.04}s`,opacity:isPast?0.6:1}}>
                <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{width:52,textAlign:"center",flexShrink:0,padding:"6px 0"}}>
                    <div style={{fontSize:10,fontWeight:700,color:isToday?DS.purple:DS.mid,textTransform:"uppercase"}}>{d.toLocaleDateString("fr",{weekday:"short"})}</div>
                    <div style={{fontSize:22,fontWeight:900,color:isToday?DS.purple:DS.dark,lineHeight:1}}>{d.getDate()}</div>
                    <div style={{fontSize:10,color:DS.mid}}>{MOIS[d.getMonth()+1]}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:14,color:DS.dark}}>{r.type}</div>
                        <div style={{fontSize:12,color:DS.mid,marginTop:2}}>
                          {r.heure&&<span style={{fontWeight:600}}>{r.heure}</span>}
                          {r.duree&&<span> · {r.duree} min</span>}
                        </div>
                      </div>
                      {isToday&&<Tag color={DS.purple}>Aujourd'hui</Tag>}
                    </div>
                    {c&&<div style={{fontSize:12,color:DS.blue,fontWeight:600,marginTop:4,display:"flex",alignItems:"center",gap:4}}>{Ico.user(11,DS.blue)} {c.nom}</div>}
                    {r.description&&<div style={{fontSize:12,color:DS.mid,marginTop:2}}>{r.description}</div>}
                    <div style={{display:"flex",gap:6,marginTop:10,paddingTop:8,borderTop:"1px solid "+DS.border}}>
                      <button onClick={()=>onEdit(r)} className="btn-hover" style={{flex:1,padding:"7px",borderRadius:10,background:DS.light,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.mid,fontFamily:"inherit",fontWeight:700}}>{Ico.edit(13,DS.mid)} Modifier</button>
                      <button onClick={()=>exportRdvToICS(r,c)} className="btn-hover" style={{flex:1,padding:"7px",borderRadius:10,background:DS.purpleSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.purple,fontFamily:"inherit",fontWeight:700}}>{Ico.download(13,DS.purple)} Calendrier</button>
                      <button onClick={()=>showConfirm("Supprimer ce RDV ?",()=>onDelete(r.id))} className="btn-hover" style={{width:34,height:34,borderRadius:10,background:DS.redSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.trash(13,DS.red)}</button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      }
    </div>
  );
}
