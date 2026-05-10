// @ts-nocheck
import React from "react";
import { Ico } from "../utils/constants";
import { useIsMobile } from "../components/ui";

export function PageDocuments({ clients, contrats, onOpenContrat }) {
  const isMobile = useIsMobile();
  const STATUT = {
    signe_complet: { label:"Signé ✓",      color:"#059669", bg:"#f0fdf4", border:"#86efac" },
    signe_client:  { label:"En attente",    color:"#4f46e5", bg:"#eef2ff", border:"#a5b4fc" },
    demande_envoyee:{ label:"Envoyé",       color:"#0891b2", bg:"#e0f2fe", border:"#7dd3fc" },
    reset:         { label:"Réinitialisé",  color:"#94a3b8", bg:"#f8fafc", border:"#e2e8f0" },
  };

  // Tous les contrats existants + archives
  const archives = contrats["__archives__"] || [];
  const actifs = Object.entries(contrats)
    .filter(([k]) => k !== "__archives__")
    .map(([contractId, ct]) => {
      const client = clients.find(c => c.id === ct.clientId);
      return { contractId, ct, client };
    })
    .filter(x => x.client && x.ct.statut && x.ct.statut !== "reset")
    .sort((a,b) => (b.ct.signedAt||b.ct.signedByPrestaAt||"").localeCompare(a.ct.signedAt||a.ct.signedByPrestaAt||""));

  const nbSigned = actifs.filter(x=>x.ct.statut==="signe_complet").length;

  return (
    <div className="fade-in">
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
        {[
          {label:"Signés",val:nbSigned,color:"#059669",bg:"#f0fdf4"},
          {label:"En attente",val:actifs.filter(x=>x.ct.statut==="signe_client").length,color:"#4f46e5",bg:"#eef2ff"},
          {label:"Total",val:actifs.length,color:"#0891b2",bg:"#e0f2fe"},
        ].map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:14,padding:"12px 8px",textAlign:"center",border:"1px solid "+s.color+"22"}}>
            <div style={{fontSize:24,fontWeight:900,color:s.color,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:10,color:s.color,fontWeight:700,marginTop:3,textTransform:"uppercase",letterSpacing:.4}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Liste contrats actifs */}
      {actifs.length===0
        ? <div style={{textAlign:"center",padding:48,color:"#94a3b8",fontSize:14}}>
            <div style={{fontSize:48,marginBottom:12}}>📄</div>
            Aucun contrat enregistré
          </div>
        : <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
            {actifs.map(({contractId,ct,client})=>{
              const s = STATUT[ct.statut] || STATUT.reset;
              const dateSign = ct.signedAt ? new Date(ct.signedAt).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"}) : null;
              const dateCosign = ct.signedByPrestaAt ? new Date(ct.signedByPrestaAt).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"}) : null;
              return (
                <div key={contractId} style={{background:"rgba(255,255,255,0.55)",borderRadius:16,border:"1.5px solid "+s.border,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
                  <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:44,height:44,borderRadius:12,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:20}}>
                      {ct.statut==="signe_complet"?"✅":ct.statut==="signe_client"?"✍️":"📄"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:800,fontSize:14,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{client.nom}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:2}}>
                        {client.formule} · {contractId}
                      </div>
                      {dateSign&&<div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>Signé le {dateSign}{dateCosign&&` · Co-signé le ${dateCosign}`}</div>}
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:s.color,background:s.bg,padding:"3px 10px",borderRadius:20,border:"1px solid "+s.border,flexShrink:0}}>{s.label}</span>
                  </div>
                  {/* Actions */}
                  <div style={{display:"flex",borderTop:"1px solid #f1f5f9"}}>
                    <button onClick={()=>onOpenContrat(client,ct)} style={{flex:1,padding:"9px",background:"rgba(255,255,255,0.45)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,fontWeight:700,color:"#0891b2",fontFamily:"inherit"}}>
                      {Ico.pdf(13,"#0891b2")} Voir contrat
                    </button>
                    {ct.signatureClient&&(
                      <div style={{width:1,background:"#f1f5f9"}}/>
                    )}
                    {ct.statut==="signe_client"&&(
                      <a href={`/sign-prestataire.html?clientId=${client.id}&contractId=${contractId}`} target="_blank" rel="noopener" style={{flex:1,padding:"9px",background:"#f5f3ff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,fontWeight:700,color:"#4f46e5",fontFamily:"inherit",textDecoration:"none"}}>
                        {Ico.sign(13,"#4f46e5")} Co-signer
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
      }

      {/* Archives */}
      {archives.length>0&&(
        <div>
          <div style={{fontSize:12,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>Archives ({archives.length})</div>
          {archives.map((ct,i)=>{
            const client = clients.find(c=>c.id===ct.clientId);
            return (
              <div key={i} style={{background:"rgba(255,255,255,0.35)",borderRadius:12,border:"1px solid #e2e8f0",padding:"12px 14px",marginBottom:6,display:"flex",alignItems:"center",gap:10,opacity:0.7}}>
                <span style={{fontSize:18}}>📁</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#475569"}}>{client?.nom||ct.clientId}</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>
                    Archivé le {ct.archivedAt?new Date(ct.archivedAt).toLocaleDateString("fr"):"—"} · {ct.archivedReason||""}
                  </div>
                </div>
                <button onClick={()=>onOpenContrat(client||{nom:ct.clientId,id:ct.clientId},ct)} style={{padding:"6px 10px",borderRadius:8,background:"rgba(255,255,255,0.5)",border:"1px solid #e2e8f0",cursor:"pointer",fontSize:11,fontWeight:700,color:"#64748b",fontFamily:"inherit"}}>
                  Voir
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
