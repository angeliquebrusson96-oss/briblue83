// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { DS, Ico, MOIS_L } from "../utils/constants";
import { TODAY, getSaison, getEntretienMois, getControleMois, isEntretienType, isControleType, MOIS_NOW, YEAR_NOW } from "../utils/helpers";
import { Avatar, useIsMobile } from "../components/ui";
import { resolvePhoto } from "../lib/photoStore";

// ─────────────────────────────────────────────────────────────────────────────
// VDM BLAGUES — carrousel de citations pisciniste
// ─────────────────────────────────────────────────────────────────────────────
const VDM_BLAGUES = [
  "Aujourd'hui, un client m'appelle en panique : « L'eau de la piscine est devenue verte du jour au lendemain ! » Il m'a fallu 10 minutes pour comprendre qu'il avait balancé tout son gazon tondu dedans pour « faire naturel ». VDM",
  "Aujourd'hui, en nettoyant le filtre d'une piscine, j'ai sorti : 3 petites culottes, un dentier, un porte-monnaie avec 40€ dedans et une anguille. Je ne sais toujours pas pour l'anguille. VDM",
  "Aujourd'hui, j'explique depuis 20 minutes à un client comment ajouter du chlore. À la fin, il me dit : « Ah mais moi je mets du sel de cuisine, c'est pareil non ? » Non. Non c'est pas pareil. VDM",
  "Aujourd'hui, une cliente m'appelle pour me dire que sa piscine « sent bizarre ». J'arrive, je teste l'eau : pH 9,2, chlore à 0. Elle avait versé 5L de vinaigre blanc pour « désinfecter naturellement ». VDM",
  "Aujourd'hui, un client m'a demandé pourquoi l'eau de sa piscine avait tourné rose. Il avait mis ses filles jouer dans la piscine avec leurs nouvelles chaussures en tissu rose fluo. Toute la journée. VDM",
  "Aujourd'hui, un client m'appelle furieux : « Votre traitement choc ne marche pas ! » Il avait jeté le sachet entier avec l'emballage plastique. Le chlore était encore dedans. VDM",
  "Aujourd'hui, j'arrive chez un client dont la pompe est « en panne ». Elle était juste débranchée. Il m'a quand même facturé le déplacement. C'est moi le pisciniste mais c'est lui qui me facture. VDM",
  "Aujourd'hui, une cliente me demande de tester son eau car « elle pique les yeux ». pH parfait, chlore parfait. Je lui demande depuis quand. « Depuis que j'ai mis du shampoing dedans pour que ça mousse mieux. » VDM",
  "Aujourd'hui, un client me montre fièrement sa « installation de traitement UV ». C'est une lampe UV pour les ongles posée sur le bord de la piscine. Elle n'est même pas branchée. VDM",
  "Aujourd'hui, un client m'explique que son eau est propre parce qu'il y a mis un gros bouquet de lavande. L'eau est violette. Les algues, elles, s'en foutent de la lavande. VDM",
  "Aujourd'hui, en faisant l'analyse d'eau d'un client, je lui annonce que son taux de chlore est à zéro. Sa réponse : « Normal, j'ai mis du rosé à la place, c'est moins agressif pour la peau. » VDM",
  "Aujourd'hui, une cliente m'appelle : « Mon robot piscine ne revient plus à sa base. » Je demande où est la base. « Ben dans le salon, là où je le range. » VDM",
  "Aujourd'hui, j'explique à un client comment lire son testeur. Il me dit qu'il est daltonien. Il teste l'eau depuis 3 ans seul. Son pH n'a jamais dépassé 6,5. VDM",
  "Aujourd'hui, un client veut savoir si sa piscine peut attraper la grippe. Sa piscine est verte depuis août. Il pense que c'est « une infection saisonnière ». VDM",
  "Aujourd'hui, un client m'a demandé si je pouvais faire une remise parce qu'il a « une petite piscine ». 12 mètres sur 6. Il la considère petite parce qu'il a vu des photos de Monaco. VDM",
];

// Mélange Fisher-Yates — ordre différent à chaque rechargement
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const VDM_SHUFFLED = shuffleArray(VDM_BLAGUES);

// ─────────────────────────────────────────────────────────────────────────────
// SAISON THEMES
// ─────────────────────────────────────────────────────────────────────────────
const SAISON_THEMES = {
  hiver: {
    gradFrom: "#0c1f3f", gradMid: "#1a3a6b", gradTo: "#0e6fa8",
    accent: "#60a5fa", particles: "❄️", subLabel: "Les piscines hibernent, vous veillez.",
  },
  printemps: {
    gradFrom: "#064e3b", gradMid: "#065f46", gradTo: "#0891b2",
    accent: "#34d399", particles: "🌸", subLabel: "La saison redémarre, c'est le moment !",
  },
  ete: {
    gradFrom: "#0c4a6e", gradMid: "#0369a1", gradTo: "#0ea5e9",
    accent: "#fbbf24", particles: "☀️", subLabel: "Haute saison — les piscines vous attendent.",
  },
  automne: {
    gradFrom: "#431407", gradMid: "#7c2d12", gradTo: "#0891b2",
    accent: "#f59e0b", particles: "🍂", subLabel: "Les feuilles tombent, pas vos standards.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PLANNING HEBDOMADAIRE
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// CARTE CLIENTS — Leaflet + OpenStreetMap + géocodage data.gouv.fr
// ─────────────────────────────────────────────────────────────────────────────
const GEO_CACHE_KEY = "bb_geocache_v1";

function loadGeocacheFromLS() {
  try { return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || "{}"); } catch { return {}; }
}
function saveGeocacheToLS(cache) {
  try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache)); } catch { /* quota */ }
}

async function geocodeAddress(address) {
  if (!address?.trim()) return null;
  const cache = loadGeocacheFromLS();
  if (cache[address]) return cache[address];
  try {
    const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`);
    const data = await res.json();
    if (data.features?.length > 0) {
      const [lon, lat] = data.features[0].geometry.coordinates;
      const result = { lat, lon };
      cache[address] = result;
      saveGeocacheToLS(cache);
      return result;
    }
  } catch { /* offline ou erreur */ }
  return null;
}

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(window.L); return; }
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (document.getElementById("leaflet-js")) {
      // Script en cours de chargement
      document.getElementById("leaflet-js").addEventListener("load", () => resolve(window.L));
      return;
    }
    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Couleurs d'avatar par initiale (cohérent avec le composant Avatar)
const AVATAR_COLORS = [
  "#0284c7","#4f46e5","#059669","#0891b2","#0891b2","#db2777"
];
function avatarColor(nom) {
  return AVATAR_COLORS[(nom?.charCodeAt(0)||0) % AVATAR_COLORS.length];
}

function CarteClients({ clients, onClientClick }) {
  const mapRef        = useRef(null);
  const mapInstance   = useRef(null);
  const markers       = useRef([]);
  const [status, setStatus] = useState("init"); // "init"|"loading"|"ready"|"error"
  const [located, setLocated] = useState(0);

  const clientsWithAddr = clients.filter(c => c.adresse?.trim());

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setStatus("loading");
      setLocated(0);
      try {
        const L = await loadLeaflet();
        if (cancelled || !mapRef.current) return;

        // Initialiser la carte une seule fois
        if (!mapInstance.current) {
          mapInstance.current = L.map(mapRef.current, {
            center: [43.12, 5.93], // région Toulon par défaut
            zoom: 11,
            zoomControl: true,
          });
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:'© <a href="https://openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
            maxZoom: 19,
          }).addTo(mapInstance.current);

          // CSS tooltip survol personnalisé (injecté une seule fois)
          if (!document.getElementById("bb-map-css")) {
            const s = document.createElement("style");
            s.id = "bb-map-css";
            s.textContent = `.leaflet-tooltip.bb-tip{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important}.leaflet-tooltip.bb-tip::before{display:none!important}`;
            document.head.appendChild(s);
          }
        }

        // Supprimer anciens marqueurs
        markers.current.forEach(m => m.remove());
        markers.current = [];

        const bounds = [];
        let count = 0;

        for (const client of clientsWithAddr) {
          if (cancelled) break;
          const pos = await geocodeAddress(client.adresse);
          if (!pos || cancelled) continue;

          const initials = (client.nom||"?").replace(/^(M\.|Mme|Mlle)\s*/i,"").trim()
            .split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
          const color = avatarColor(client.nom);

          // Résolution de la photo piscine (idb:, fsp:, https:, data: — toutes gérées)
          let photoUrl = null;
          if (client.photoPiscine) {
            try { photoUrl = await resolvePhoto(client.photoPiscine); } catch { /* pas de photo */ }
          }

          // Nom de famille uniquement — utilise nomFamille si disponible (nouveau format),
          // sinon extrait le 1er mot après suppression de la civilité (ancien format)
          const shortName = (
            client.nomFamille ||
            (client.nom || "?").replace(/^(M\.|Mme|Mlle)\s*/i, "").trim().split(/\s+/)[0] ||
            "?"
          ).slice(0, 12).toUpperCase();

          // Contenu intérieur du cercle
          const circleInner = photoUrl
            ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
            : `<span style="color:#fff;font-weight:900;font-size:13px;font-family:Inter,system-ui,sans-serif;">${initials}</span>`;

          // Icône : étiquette nom arrondie au-dessus + cercle photo
          const iconHtml = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;user-select:none;">
              <div style="
                background:rgba(15,23,42,0.72);color:#fff;
                font-size:9px;font-weight:800;letter-spacing:.4px;
                padding:2px 8px;border-radius:20px;
                white-space:nowrap;max-width:100px;overflow:hidden;text-overflow:ellipsis;
                font-family:Inter,system-ui,sans-serif;
                backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
                box-shadow:0 2px 8px rgba(0,0,0,0.28);
              ">${shortName}</div>
              <div style="
                width:44px;height:44px;border-radius:50%;
                background:${color};border:3px solid #fff;
                box-shadow:0 4px 14px rgba(0,0,0,0.32);
                overflow:hidden;display:flex;align-items:center;justify-content:center;
              ">${circleInner}</div>
            </div>`;

          // Anchor : centre du cercle = 55px depuis gauche, 43px depuis haut (label≈18+gap3+demi-cercle22)
          const icon = L.divIcon({
            className: "",
            html: iconHtml,
            iconSize: [110, 68],
            iconAnchor: [55, 43],
            popupAnchor: [0, -52],
          });

          // Tooltip survol (photo + résumé, sans clic)
          const tooltipHtml = `
            <div style="background:#fff;border-radius:14px;overflow:hidden;
              box-shadow:0 8px 28px rgba(0,0,0,0.2);border:1px solid #e2e8f0;
              min-width:160px;font-family:Inter,system-ui,sans-serif;">
              ${photoUrl
                ? `<div style="height:80px;overflow:hidden;background:#e0f2fe;">
                    <img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>`
                : `<div style="height:36px;background:${color};display:flex;align-items:center;justify-content:center;">
                    <span style="color:#fff;font-weight:900;font-size:18px;">${initials}</span></div>`
              }
              <div style="padding:8px 11px 9px">
                <div style="font-weight:800;font-size:12px;color:#0f172a;margin-bottom:2px">${client.nom}</div>
                ${client.formule ? `<div style="font-size:10px;color:#0891b2;font-weight:600;margin-bottom:2px">${client.formule}</div>` : ""}
                <div style="font-size:9px;color:#94a3b8">${client.adresse.split(",").slice(-1)[0]?.trim() || client.adresse}</div>
                <div style="margin-top:6px;font-size:9px;color:#0891b2;font-weight:600">Cliquer pour ouvrir la fiche →</div>
              </div>
            </div>`;

          const marker = L.marker([pos.lat, pos.lon], { icon })
            .addTo(mapInstance.current)
            .bindTooltip(tooltipHtml, { permanent:false, direction:"top", className:"bb-tip", offset:[0,-56], opacity:1 })
            .on("click", () => {
              if (onClientClick) onClientClick(client);
            });

          markers.current.push(marker);
          bounds.push([pos.lat, pos.lon]);
          count++;
          if (!cancelled) setLocated(count);
        }

        if (!cancelled && bounds.length > 0 && mapInstance.current) {
          if (bounds.length === 1) {
            mapInstance.current.setView(bounds[0], 14);
          } else {
            mapInstance.current.fitBounds(bounds, { padding:[40,40], maxZoom:14 });
          }
        }
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    run();
    return () => { cancelled = true; };
  }, [clients.map(c=>c.id+c.adresse).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nettoyage complet au démontage
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const clientsSansAdresse = clients.filter(c => !c.adresse?.trim());

  return (
    <div className="db-s6" style={{borderRadius:18,overflow:"hidden",border:"1px solid #e2e8f0",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",background:"#fff",marginBottom:14}}>
      {/* Header */}
      <div style={{padding:"11px 14px 9px",background:"linear-gradient(135deg,#f0f9ff,#fff)",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:"#e0f2fe",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>Carte clients</div>
            <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>
              {status==="loading" ? `${located}/${clientsWithAddr.length} localisés…`
                : status==="ready"   ? `${located} client${located>1?"s":""} sur la carte`
                : status==="error"   ? "Erreur de chargement"
                : "Chargement…"}
            </div>
          </div>
        </div>
        {status==="loading"&&(
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin .7s linear infinite",flexShrink:0}}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
        )}
      </div>

      {/* Carte Leaflet */}
      <div ref={mapRef} style={{height:340,width:"100%",background:"#e8f4f8"}}/>

      {/* Clients sans adresse */}
      {clientsSansAdresse.length > 0 && (
        <div style={{padding:"7px 12px",background:"#fffbeb",borderTop:"1px solid #fde68a",display:"flex",alignItems:"center",gap:6}}>
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
          <span style={{fontSize:10,color:"#92400e",fontWeight:600}}>
            {clientsSansAdresse.length} client{clientsSansAdresse.length>1?"s":""} sans adresse : {clientsSansAdresse.slice(0,3).map(c=>c.nom.split(" ").pop()).join(", ")}{clientsSansAdresse.length>3?"…":""}
          </span>
        </div>
      )}
    </div>
  );
}

const PLANNING_ACTIONS = [
  {label:"Rendez-vous", emoji:"📅", color:"#7c3aed", bg:"#f5f3ff", bord:"#c4b5fd", type:null, isRdv:true},
  {label:"Rapport",     emoji:"📋", color:"#0891b2", bg:"#e0f2fe", bord:"#7dd3fc", type:null},
];

function PlanningHebdo({ clients, passages, rdvs, onAddRdv, onAddPassage, onEditRdv, onClientClick, isMobile }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [menuDay, setMenuDay] = useState(null);
  const [menuPos, setMenuPos] = useState(null); // desktop uniquement
  const scrollRef = useRef(null);

  const closeMenu = () => { setMenuDay(null); setMenuPos(null); };

  // Ferme le menu desktop au clic extérieur (phase de capture pour attraper avant les enfants)
  useEffect(() => {
    if (!menuDay || isMobile) return;
    const close = (e) => {
      // Ne pas fermer si on clique sur le menu lui-même
      if (e.target.closest?.("[data-planning-menu]")) return;
      closeMenu();
    };
    // Délai minimal pour éviter que le clic qui a ouvert ne referme immédiatement
    const t = setTimeout(() => document.addEventListener("click", close, true), 50);
    return () => { clearTimeout(t); document.removeEventListener("click", close, true); };
  }, [menuDay, isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlus = (e, ds) => {
    // Empêche le clic de remonter vers la nav ou d'autres handlers
    e.preventDefault();
    e.stopPropagation();
    if (menuDay === ds) { closeMenu(); return; }
    if (isMobile) {
      setMenuDay(ds);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuH = 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow > menuH ? rect.bottom + 4 : rect.top - menuH - 4;
      setMenuPos({ top, left: Math.min(rect.left, window.innerWidth - 160) });
      setMenuDay(ds);
    }
  };

  const doAction = (action) => {
    if (action.isRdv) { onAddRdv&&onAddRdv({date:menuDay}); }
    else              { onAddPassage&&onAddPassage({date:menuDay,type:action.type}); }
    closeMenu();
  };

  // ── Date locale en "YYYY-MM-DD" (pas toISOString qui décale en UTC) ──
  const localDs = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const j = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${j}`;
  };

  // Lundi de la semaine contenant aujourd'hui + décalage
  const getMonday = (offset) => {
    const d = new Date();
    const dow = d.getDay(); // 0=dim, 1=lun … 6=sam
    const monday = new Date(d);
    monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const monday = getMonday(weekOffset);
  // 7 jours lundi → dimanche
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  // Utilise la date locale, pas UTC, pour éviter le décalage fuseau horaire
  const todayStr = localDs(new Date());

  // Scroll : centre le jour actuel en lisant sa position réelle dans le DOM
  useEffect(() => {
    if (!scrollRef.current) return;
    // Cherche la colonne marquée data-today="true"
    const todayEl = scrollRef.current.querySelector("[data-today='true']");
    if (!todayEl) return;
    const containerW = scrollRef.current.offsetWidth;
    const colLeft    = todayEl.offsetLeft;
    const colW       = todayEl.offsetWidth;
    scrollRef.current.scrollLeft = Math.max(0, colLeft - containerW / 2 + colW / 2);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset, isMobile]);

  const weekLabel = (() => {
    const last = new Date(monday);
    last.setDate(monday.getDate() + 6);
    const fmt = d => d.toLocaleDateString("fr", { day:"2-digit", month:"short" });
    return `${fmt(monday)} — ${fmt(last)} ${monday.getFullYear()}`;
  })();

  const getEventsForDay = (date) => {
    const ds = localDs(date); // date locale, pas UTC
    const r = (rdvs||[]).filter(r => r.date === ds).map(r => ({...r, _kind:"rdv"}));
    const p = (passages||[]).filter(p => p.date === ds).map(p => ({...p, _kind:"passage"}));
    return [...r, ...p].sort((a, b) => (a.heure||"").localeCompare(b.heure||""));
  };

  return (
    <>
    <div className="db-s2" style={{marginBottom:14,borderRadius:18,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #e2e8f0",background:"#fff"}}>
      {/* ── En-tête ── */}
      <div style={{padding:"11px 14px 9px",background:"linear-gradient(135deg,#f0f9ff,#fff)",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:"#e0f2fe",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>Planning semaine</div>
            <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{weekLabel}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <button onClick={()=>setWeekOffset(w=>w-1)}
            style={{width:28,height:28,borderRadius:7,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          {weekOffset !== 0 && (
            <button onClick={()=>setWeekOffset(0)}
              style={{height:28,padding:"0 8px",borderRadius:7,border:"1px solid #bae6fd",background:"#e0f2fe",cursor:"pointer",fontSize:10,fontWeight:700,color:"#0891b2",fontFamily:"inherit"}}>
              Auj.
            </button>
          )}
          <button onClick={()=>setWeekOffset(w=>w+1)}
            style={{width:28,height:28,borderRadius:7,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* ── Grille jours — 7 jours lun→dim, scroll centré sur aujourd'hui ── */}
      <div ref={scrollRef} style={{
        display:"flex",gap:5,
        overflowX:"auto",
        WebkitOverflowScrolling:"touch",
        scrollbarWidth:"none",
        msOverflowStyle:"none",
        padding:"8px",
      }}>
        {days.map((day) => {
          const ds = localDs(day); // date locale
          const isToday  = ds === todayStr;
          const isPast   = ds < todayStr;
          const events   = getEventsForDay(day);
          const dayName  = day.toLocaleDateString("fr", { weekday:"short" });
          const dayNum   = day.getDate();
          const monthStr = day.toLocaleDateString("fr", { month:"short" });

          return (
            <div key={ds} data-today={isToday?"true":"false"} style={{
              minWidth:isMobile?105:100,flex:"0 0 auto",
              width:isMobile?105:"calc(14.28% - 5px)",
              borderRadius:12,
              background:isToday?"#f0f9ff":"#fafafa",
              border:`${isToday?"2px":"1.5px"} solid ${isToday?"#0891b2":"#e2e8f0"}`,
              boxShadow:isToday?"0 0 0 3px rgba(8,145,178,0.13), 0 6px 22px rgba(8,145,178,0.22)":"none",
              display:"flex",flexDirection:"column",overflow:"hidden",
              position:"relative",
              zIndex:isToday?2:1,
            }}>

              {/* ── EN-TÊTE DU JOUR ── */}
              <div style={{
                padding:"7px 3px 6px",textAlign:"center",
                borderBottom:`1px solid ${isToday?"#0284c7":"#f1f5f9"}`,
                background:isToday
                  ?"linear-gradient(160deg,#0891b2 0%,#0284c7 60%,#075985 100%)"
                  :"transparent",
              }}>
                {/* Nom du jour */}
                <div style={{fontSize:8,fontWeight:800,textTransform:"uppercase",letterSpacing:.6,
                  color:isToday?"rgba(255,255,255,0.85)":isPast?"#94a3b8":"#64748b"}}>
                  {dayName}
                </div>
                {/* Numéro du jour */}
                <div style={{fontSize:isToday?24:19,fontWeight:900,lineHeight:1.05,
                  color:isToday?"#fff":isPast?"#cbd5e1":"#0f172a"}}>
                  {dayNum}
                </div>
                {/* Mois */}
                <div style={{fontSize:8,lineHeight:1,
                  color:isToday?"rgba(255,255,255,0.7)":"#94a3b8"}}>
                  {monthStr}
                </div>
                {/* Badge AUJOURD'HUI */}
                {isToday && (
                  <div style={{marginTop:4,display:"inline-flex",alignItems:"center",gap:3,
                    background:"rgba(255,255,255,0.22)",borderRadius:20,padding:"2px 7px",
                    border:"1px solid rgba(255,255,255,0.35)"}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:"#7dd3fc",flexShrink:0}}/>
                    <span style={{fontSize:7,fontWeight:800,color:"#fff",letterSpacing:.6,
                      textTransform:"uppercase"}}>Auj.</span>
                  </div>
                )}
              </div>

              {/* Événements */}
              <div style={{padding:"4px",display:"flex",flexDirection:"column",gap:3,flex:1}}>
                {events.map((ev, j) => {
                  const client = (clients||[]).find(c => c.id === ev.clientId);
                  const nom = (() => {
                    if (!client?.nom) return "?";
                    const parts = client.nom.replace(/^(M\.|Mme|Mlle)\s*/i,"").trim().split(/\s+/);
                    return (parts[parts.length-1]||parts[0]).slice(0,10);
                  })();
                  const isPassage = ev._kind === "passage";
                  const isCtrl = isControleType(ev.type);
                  const isSav = /sav|dépann/i.test(ev.type||"");

                  const [color, bg, bord] = isPassage
                    ? isCtrl  ? ["#0e7490","#e0f2fe","#7dd3fc"]
                    : isSav   ? ["#ea580c","#fff7ed","#fdba74"]
                    : ["#059669","#f0fdf4","#86efac"]
                    : ["#7c3aed","#f5f3ff","#c4b5fd"];

                  const emoji = isPassage ? (isCtrl?"💧":isSav?"🔧":"✓") : "📅";

                  return (
                    <button key={ev.id||j}
                      onClick={()=> isPassage && client ? onClientClick(client) : (!isPassage && onEditRdv && onEditRdv(ev))}
                      style={{
                        width:"100%",padding:"3px 4px",borderRadius:6,
                        background:bg,border:`1px solid ${bord}`,
                        cursor:"pointer",fontFamily:"inherit",textAlign:"left",
                        WebkitTapHighlightColor:"transparent",
                        opacity:isPast&&!isPassage?.6:1,
                      }}>
                      <div style={{fontSize:8,color:"#64748b",marginBottom:1,display:"flex",alignItems:"center",gap:2,lineHeight:1}}>
                        <span>{emoji}</span>
                        {ev.heure&&<span>{ev.heure.slice(0,5)}</span>}
                      </div>
                      <div style={{fontSize:10,fontWeight:700,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.2}}>{nom}</div>
                      <div style={{fontSize:8,color,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(ev.type||"RDV").slice(0,13)}</div>
                    </button>
                  );
                })}

                {/* Bouton + — onClick uniquement (évite double déclenchement touchstart+mousedown) */}
                <button
                  onClick={e=>handlePlus(e,ds)}
                  style={{
                    width:"100%",minHeight:22,padding:"2px",borderRadius:6,
                    background:menuDay===ds?"#e0f2fe":"transparent",
                    border:`1.5px dashed ${menuDay===ds?"#0891b2":"#e2e8f0"}`,
                    cursor:"pointer",color:menuDay===ds?"#0891b2":"#d1d5db",
                    fontSize:15,fontWeight:700,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontFamily:"inherit",lineHeight:1,transition:"all .15s",
                  }}>
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Carrousel mobile — s'affiche quand un jour est sélectionné ── */}
      {isMobile && menuDay && (
        <div onClick={e=>e.stopPropagation()} style={{borderTop:"1px solid #e2e8f0",background:"#f8fafc",animation:"fadeIn .18s ease"}}>
          {/* En-tête avec date + fermer */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px 4px"}}>
            <span style={{fontSize:11,fontWeight:700,color:"#0891b2"}}>
              + {new Date(menuDay).toLocaleDateString("fr",{weekday:"long",day:"2-digit",month:"long"})}
            </span>
            <button onClick={closeMenu}
              style={{width:22,height:22,borderRadius:11,background:"#e2e8f0",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          {/* Chips horizontales scrollables */}
          <div style={{display:"flex",gap:8,overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",padding:"6px 12px 12px"}}>
            {PLANNING_ACTIONS.map(action=>(
              <button key={action.label}
                onClick={()=>doAction(action)}
                style={{
                  flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                  padding:"10px 14px",borderRadius:14,
                  background:action.bg,border:`1.5px solid ${action.bord}`,
                  cursor:"pointer",fontFamily:"inherit",
                  WebkitTapHighlightColor:"transparent",
                  boxShadow:`0 2px 8px ${action.color}22`,
                  transition:"transform .1s",
                  minWidth:72,
                }}
                onTouchStart={e=>e.currentTarget.style.transform="scale(0.94)"}
                onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
                <span style={{fontSize:22,lineHeight:1}}>{action.emoji}</span>
                <span style={{fontSize:10,fontWeight:700,color:action.color,whiteSpace:"nowrap"}}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Légende */}
      {(!isMobile || !menuDay) && (
        <div style={{padding:"4px 12px 8px",display:"flex",gap:10,flexWrap:"wrap"}}>
          {[["#059669","#f0fdf4","✓ Entretien"],["#0e7490","#e0f2fe","💧 Contrôle"],["#ea580c","#fff7ed","🔧 SAV"],["#7c3aed","#f5f3ff","📅 RDV"]].map(([c,bg,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:8,height:8,borderRadius:2,background:bg,border:`1px solid ${c}44`}}/>
              <span style={{fontSize:9,color:"#94a3b8",fontWeight:500}}>{l}</span>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* ── Menu desktop — dropdown fixe ── */}
    {!isMobile && menuDay && menuPos && (
      <div data-planning-menu onClick={e=>e.stopPropagation()}
        style={{
          position:"fixed",top:menuPos.top,left:menuPos.left,
          zIndex:99999,background:"#fff",borderRadius:12,
          boxShadow:"0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
          border:"1px solid #e2e8f0",overflow:"hidden",minWidth:160,
        }}>
        <div style={{padding:"7px 12px 5px",fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid #f1f5f9"}}>
          {new Date(menuDay).toLocaleDateString("fr",{weekday:"long",day:"2-digit",month:"short"})}
        </div>
        {PLANNING_ACTIONS.map((action,i,arr)=>(
          <button key={action.label}
            onClick={()=>doAction(action)}
            style={{
              width:"100%",padding:"9px 12px",border:"none",
              background:"#fff",cursor:"pointer",fontFamily:"inherit",
              textAlign:"left",fontSize:12,fontWeight:600,color:action.color,
              borderBottom:i<arr.length-1?"1px solid #f8fafc":"none",
              transition:"background .1s",display:"flex",alignItems:"center",gap:7,
            }}
            onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
            onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
            <span>{action.emoji}</span><span>{action.label}</span>
          </button>
        ))}
      </div>
    )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD HERO
// ─────────────────────────────────────────────────────────────────────────────
export function DashboardHero({ clients, passages, rdvs, saisonNow, isMobile, onAddPassage, onAddLivraison, onAddClient, onAddRdv, notes, onNotesChange }) { // eslint-disable-line no-unused-vars
  const heure = new Date().getHours();
  const salut = heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";
  const dateStr = new Date().toLocaleDateString("fr", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });

  const totalClients = clients.length;
  const passAujourd = passages.filter(p => p.date === TODAY).length;
  const rapportsEnvoyer = passages.filter(p => p.rapportStatut !== "envoye" && p.ok).length;
  const passMois = passages.filter(p => new Date(p.date).getMonth()+1 === new Date().getMonth()+1 && new Date(p.date).getFullYear() === new Date().getFullYear()).length;

  const rdvsFuturs = rdvs.filter(r => r.date >= TODAY).sort((a,b) => a.date.localeCompare(b.date));
  const rdvsToday = rdvsFuturs.filter(r => r.date === TODAY);


  return (
    <div>

      {/* ── HERO ── */}
      <div className="db-s1" style={{borderRadius:18,overflow:"hidden",marginBottom:12,position:"relative",boxShadow:"0 4px 20px rgba(8,145,178,0.2)"}}>
        {/* Fond */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(145deg,#075985 0%,#0891b2 50%,#0e7490 100%)"}}/>
        {/* Vague décorative discrète */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:28,overflow:"hidden",opacity:0.08,pointerEvents:"none"}}>
          <div style={{display:"flex",width:"200%",height:"100%",animation:"db-wave 10s linear infinite"}}>
            {[0,1].map(k=>(
              <svg key={k} viewBox="0 0 400 28" style={{width:"50%",height:"100%"}} preserveAspectRatio="none">
                <path d="M0 14 C60 2 120 26 180 14 S300 2 360 14 S400 26 400 14 L400 28 L0 28Z" fill="white"/>
              </svg>
            ))}
          </div>
        </div>

        <div style={{position:"relative",zIndex:2,padding:"18px 18px 22px"}}>
          {/* Ligne top: logo + date */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,0.2)"}}>
                {/* Triple vague — nouveau logo */}
                <svg width={18} height={16} viewBox="0 0 32 28" fill="none" stroke="white" strokeLinecap="round">
                  <path d="M1 22c3.5 4.5 7 4.5 10.5 0S18 17.5 21.5 22 28 26.5 31 22" strokeWidth="3.2"/>
                  <path d="M3 14c3 3.5 6 3.5 9 0s6-3.5 9 0 5 3.5 8 0" strokeWidth="2.2" strokeOpacity="0.68"/>
                  <path d="M7 7c2.5 2.5 5 2.5 7.5 0s5-2.5 7.5 0" strokeWidth="1.6" strokeOpacity="0.4"/>
                </svg>
              </div>
              <span style={{fontSize:13,fontWeight:800,color:"rgba(255,255,255,0.95)",letterSpacing:.3}}>BRIBLUE</span>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.65)",fontWeight:400,textTransform:"capitalize"}}>{dateStr}</div>
            </div>
          </div>

          {/* Salutation */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:22,fontWeight:800,color:"#fff",lineHeight:1.2,letterSpacing:"-0.4px"}}>
              {salut} Dorian 👋
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:3,fontWeight:400}}>
              {rdvsToday.length > 0 ? `${rdvsToday.length} rendez-vous aujourd'hui` : "Que cette journée se passe comme tu le souhaites !"}
            </div>
          </div>

        </div>
      </div>

      {/* ── NOTES DRAG & DROP ── */}
      <StickyNotes notes={notes} onNotesChange={onNotesChange}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STICKY NOTES — simple, beau, intuitif
// ─────────────────────────────────────────────────────────────────────────────
// Palette : chaque entrée = { bg (fond), accent (bordure + couleur vive) }
const NOTE_PALETTE = [
  { bg:"#fffbeb", accent:"#f59e0b" }, // Ambre
  { bg:"#f0fdf4", accent:"#22c55e" }, // Vert
  { bg:"#eff6ff", accent:"#3b82f6" }, // Bleu
  { bg:"#fdf4ff", accent:"#a855f7" }, // Violet
  { bg:"#fff1f2", accent:"#f43f5e" }, // Rose
  { bg:"#fff7ed", accent:"#f97316" }, // Orange
  { bg:"#f8fafc", accent:"#64748b" }, // Ardoise
  { bg:"#ecfdf5", accent:"#059669" }, // Émeraude
];

// Rétrocompat : ancien champ "color" (bg seul) → palette la plus proche
const LEGACY_MAP = {
  "#fef9c3":{ bg:"#fffbeb", accent:"#f59e0b" },
  "#dcfce7":{ bg:"#f0fdf4", accent:"#22c55e" },
  "#dbeafe":{ bg:"#eff6ff", accent:"#3b82f6" },
  "#fce7f3":{ bg:"#fdf4ff", accent:"#ec4899" },
  "#ede9fe":{ bg:"#fdf4ff", accent:"#a855f7" },
  "#ffedd5":{ bg:"#fff7ed", accent:"#f97316" },
  "#fff"   :{ bg:"#f8fafc", accent:"#64748b" },
  "#fef2f2":{ bg:"#fff1f2", accent:"#f43f5e" },
};
function notePalette(note) {
  if (note.accent && note.bg) return { bg: note.bg, accent: note.accent };
  return LEGACY_MAP[note.color] || NOTE_PALETTE[0];
}

function noteTimeAgo(ts) {
  if (!ts) return null;
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)    return "à l'instant";
  if (s < 3600)  return `${Math.floor(s/60)} min`;
  if (s < 86400) return `${Math.floor(s/3600)} h`;
  return `${Math.floor(s/86400)} j`;
}

// Composant contrôlé : l'état réel vit dans App.jsx → Firebase
function StickyNotes({ notes = [], onNotesChange }) {
  const [activeId, setActiveId] = useState(null);
  const dragIdx     = useRef(null);
  const dragOverIdx = useRef(null);
  const [dragOver,  setDragOver] = useState(-1);

  const update = fn => onNotesChange(typeof fn === "function" ? fn(notes) : fn);

  const addNote = () => {
    const pal = NOTE_PALETTE[Math.floor(Math.random() * NOTE_PALETTE.length)];
    const n = { id: Date.now().toString(), text: "", bg: pal.bg, accent: pal.accent, pinned: false, updatedAt: Date.now() };
    update(p => [n, ...p]);
    setTimeout(() => setActiveId(n.id), 50);
  };

  const del      = id          => update(p => p.filter(n => n.id !== id));
  const setText  = (id, text)  => update(p => p.map(n => n.id === id ? { ...n, text, updatedAt: Date.now() } : n));
  const setPal   = (id, pal)   => update(p => p.map(n => n.id === id ? { ...n, bg: pal.bg, accent: pal.accent } : n));
  const togglePin= id          => update(p => p.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));

  const onDragStart = i    => { dragIdx.current = i; };
  const onDragOver  = (e,i)=> { e.preventDefault(); dragOverIdx.current = i; setDragOver(i); };
  const onDrop      = ()   => {
    const from = dragIdx.current, to = dragOverIdx.current;
    if (from !== null && to !== null && from !== to)
      update(p => { const a=[...p]; const [el]=a.splice(from,1); a.splice(to,0,el); return a; });
    dragIdx.current = null; dragOverIdx.current = null; setDragOver(-1);
  };

  const sorted = [...notes].sort((a,b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.updatedAt||0) - (a.updatedAt||0);
  });

  return (
    <div className="db-s2" style={{marginBottom:14}}>

      {/* ── En-tête ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>Notes</span>
          {notes.length > 0 && (
            <span style={{fontSize:11,fontWeight:600,color:"#94a3b8",background:"#f1f5f9",borderRadius:20,padding:"1px 8px"}}>
              {notes.length}
            </span>
          )}
        </div>
        <button onClick={addNote} style={{
          display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:20,
          background:"linear-gradient(135deg,#0891b2,#0e7490)",border:"none",
          cursor:"pointer",fontSize:12,fontWeight:700,color:"#fff",fontFamily:"inherit",
          boxShadow:"0 2px 12px rgba(8,145,178,0.28)",WebkitTapHighlightColor:"transparent",
        }}>
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvelle note
        </button>
      </div>

      {/* ── État vide ── */}
      {notes.length === 0 && (
        <button onClick={addNote} style={{
          width:"100%",padding:"28px 20px",borderRadius:18,
          border:"2px dashed #e2e8f0",background:"transparent",cursor:"pointer",
          fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:10,
          WebkitTapHighlightColor:"transparent",
        }}>
          <span style={{fontSize:36,lineHeight:1}}>📝</span>
          <span style={{fontSize:13,color:"#94a3b8",fontWeight:500}}>Aucune note — appuyez pour créer</span>
        </button>
      )}

      {/* ── Cartes ── */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {sorted.map((note, i) => {
          const { bg, accent } = notePalette(note);
          const isActive = activeId === note.id;
          const ts = noteTimeAgo(note.updatedAt);
          const lineCount = (note.text||"").split("\n").length;

          return (
            <div key={note.id}
              draggable={!isActive}
              onDragStart={() => onDragStart(i)}
              onDragOver={e => onDragOver(e, i)}
              onDrop={onDrop}
              onDragEnd={() => { dragIdx.current=null; dragOverIdx.current=null; setDragOver(-1); }}
              style={{
                borderRadius:16,overflow:"hidden",
                background:bg,
                border:`1.5px solid ${dragOver===i&&dragIdx.current!==i ? "#0891b2" : accent+"44"}`,
                boxShadow: isActive
                  ? `0 0 0 2.5px ${accent}55, 0 8px 28px ${accent}22`
                  : note.pinned
                    ? `0 4px 18px ${accent}28`
                    : "0 2px 8px rgba(0,0,0,0.06)",
                opacity: dragIdx.current === i ? 0.4 : 1,
                transition:"box-shadow .2s, border .15s",
              }}>

              {/* Barre accent couleur */}
              <div style={{height:4,background:`linear-gradient(90deg,${accent},${accent}88)`}}/>

              {/* Zone texte — cliquable pour éditer */}
              <div style={{position:"relative"}}>
                <textarea
                  value={note.text||""}
                  onChange={e => setText(note.id, e.target.value)}
                  onFocus={() => setActiveId(note.id)}
                  onBlur={() => setActiveId(null)}
                  placeholder="Écris ta note ici…"
                  rows={isActive ? Math.max(4, lineCount+1) : Math.max(2, lineCount)}
                  style={{
                    width:"100%",padding:"13px 14px 8px",
                    background:"transparent",border:"none",outline:"none",resize:"none",
                    fontFamily:"inherit",fontSize:13.5,color:"#1e293b",lineHeight:1.8,
                    boxSizing:"border-box",WebkitTapHighlightColor:"transparent",
                    cursor:"text",
                  }}
                />
                {/* Badge épingle */}
                {note.pinned && (
                  <span style={{
                    position:"absolute",top:10,right:10,
                    fontSize:14,opacity:.7,pointerEvents:"none",
                  }}>📌</span>
                )}
              </div>

              {/* ── Pied de carte ── */}
              <div style={{
                display:"flex",alignItems:"center",
                padding:"4px 10px 10px",gap:6,
              }}>
                {/* Poignée drag */}
                <div style={{
                  cursor:"grab",color:`${accent}88`,fontSize:14,lineHeight:1,
                  flexShrink:0,touchAction:"none",userSelect:"none",paddingRight:2,
                }}>⠿</div>

                {/* Palette couleurs (ronds vifs) */}
                <div style={{display:"flex",gap:5,flex:1,alignItems:"center"}}>
                  {NOTE_PALETTE.map((pal, pi) => (
                    <button key={pi}
                      onClick={() => setPal(note.id, pal)}
                      title={`Couleur ${pi+1}`}
                      style={{
                        width:16,height:16,borderRadius:"50%",
                        background:pal.accent,border:"none",
                        cursor:"pointer",padding:0,flexShrink:0,
                        outline:note.accent===pal.accent ? `3px solid ${pal.accent}` : "none",
                        outlineOffset:2,
                        transform:note.accent===pal.accent?"scale(1.25)":"scale(1)",
                        transition:"transform .15s, outline .15s",
                      }}
                    />
                  ))}
                </div>

                {/* Épingle */}
                <button onClick={() => togglePin(note.id)}
                  title={note.pinned?"Désépingler":"Épingler"}
                  style={{
                    background:"none",border:"none",cursor:"pointer",
                    fontSize:15,lineHeight:1,padding:"0 2px",
                    opacity:note.pinned?1:0.25,transition:"opacity .2s",
                    WebkitTapHighlightColor:"transparent",
                  }}>
                  📌
                </button>

                {/* Horodatage */}
                {ts && (
                  <span style={{fontSize:9,color:`${accent}99`,fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>
                    {ts}
                  </span>
                )}

                {/* Supprimer */}
                <button onClick={() => del(note.id)}
                  style={{
                    background:"none",border:"none",cursor:"pointer",
                    color:"#cbd5e1",fontSize:16,lineHeight:1,
                    padding:"0 2px",flexShrink:0,
                    WebkitTapHighlightColor:"transparent",
                    transition:"color .15s",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                  onMouseLeave={e=>e.currentTarget.style.color="#cbd5e1"}
                >✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function Dashboard({ clients, passages, rdvs=[], onClientClick, onAddPassage, onAddLivraison, onAddClient, onAddRdv, onEditPassage, onEditRdv, notes=[], onNotesChange }) {
  const isMobile = useIsMobile();
  const moisCourant = MOIS_NOW;
  const saisonNow = getSaison(moisCourant);
  const [showAllTaches, setShowAllTaches] = useState(false);

  // Stats passages du mois
  const tachesMois = clients.map(c=>{
    const prevE = getEntretienMois(c.moisParMois||c.saisons, moisCourant);
    const prevC = getControleMois(c.moisParMois||c.saisons, moisCourant);
    const cs = c.dateDebut ? c.dateDebut.slice(0,10) : null;
    const ce = c.dateFin ? c.dateFin.slice(0,10) : null;
    const inContrat = (p) => { const ds=String(p.date).slice(0,10); return cs&&ce ? ds>=cs&&ds<=ce : new Date(p.date).getFullYear()===YEAR_NOW; };
    const effE = passages.filter(p=>p.clientId===c.id&&new Date(p.date).getMonth()+1===moisCourant&&inContrat(p)&&isEntretienType(p.type)).length;
    const effC = passages.filter(p=>p.clientId===c.id&&new Date(p.date).getMonth()+1===moisCourant&&inContrat(p)&&isControleType(p.type)).length;
    const restE = Math.max(0,prevE-effE);
    const restC = Math.max(0,prevC-effC);
    return { client:c, prevE, prevC, effE, effC, restE, restC, total:restE+restC };
  }).filter(x=>(x.prevE+x.prevC)>0).sort((a,b)=>b.total-a.total);

  const totalTaches = tachesMois.reduce((a,t)=>a+t.total,0);
  const tachesRestantes = tachesMois.filter(t=>t.total>0);
  const tachesOk = tachesMois.filter(t=>t.total===0);
  const PREVIEW = 3;

  // RDVs
  const rdvsFuturs = rdvs.filter(r=>r.date>=TODAY).sort((a,b)=>a.date===b.date?(a.heure||"").localeCompare(b.heure||""):a.date.localeCompare(b.date));
  const rdvsToday = rdvsFuturs.filter(r=>r.date===TODAY);
  const rdvsProchains = rdvsFuturs.filter(r=>r.date>TODAY).slice(0,5);

  // Progress global
  const totalPrevus = tachesMois.reduce((a,t)=>a+t.prevE+t.prevC,0);
  const totalDone = tachesMois.reduce((a,t)=>a+t.effE+t.effC,0);
  const pctGlobal = totalPrevus>0?Math.round(totalDone/totalPrevus*100):100;

  return (
    <div>
      {/* HERO */}
      <DashboardHero clients={clients} passages={passages} rdvs={rdvs} saisonNow={saisonNow} isMobile={isMobile} onAddPassage={onAddPassage} onAddLivraison={onAddLivraison} onAddClient={onAddClient} onAddRdv={onAddRdv} notes={notes} onNotesChange={onNotesChange}/>

      {/* ── PLANNING SEMAINE ── */}
      <PlanningHebdo clients={clients} passages={passages} rdvs={rdvs} onAddRdv={onAddRdv} onAddPassage={onAddPassage} onEditRdv={onEditRdv} onClientClick={onClientClick} isMobile={isMobile}/>

      {/* ── PASSAGES DU MOIS ── */}
      <div className="db-s3" style={{marginBottom:14,borderRadius:18,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #e2e8f0",background:"#fff"}}>
        {/* Header */}
        <div style={{padding:"14px 16px 12px",background:"linear-gradient(135deg,#f0f9ff,#fff)",borderBottom:"1px solid #f1f5f9"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:"#0f172a",letterSpacing:"-0.3px"}}>
                {MOIS_L[moisCourant]} {YEAR_NOW}
              </div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>
                {totalTaches>0
                  ? <><span style={{background:"#fef9c3",color:"#92400e",padding:"2px 9px",borderRadius:20,fontWeight:700,fontSize:11,border:"1px solid #fde68a"}}>{totalTaches}</span><span style={{marginLeft:6,color:"#64748b"}}>passage{totalTaches>1?"s":""} restant{totalTaches>1?"s":""}</span></>
                  : <span style={{color:"#16a34a",fontWeight:600}}>✅ Tous les passages effectués</span>
                }
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:22,fontWeight:800,color:pctGlobal>=100?"#16a34a":"#0891b2",lineHeight:1}}>{pctGlobal}%</div>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:500}}>avancement</div>
            </div>
          </div>
          {/* Barre progression */}
          <div style={{height:6,background:"#e2e8f0",borderRadius:99,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pctGlobal}%`,borderRadius:99,transition:"width .6s ease",
              background:pctGlobal>=100?"linear-gradient(90deg,#22c55e,#4ade80)":"linear-gradient(90deg,#0891b2,#38bdf8)"
            }}/>
          </div>
        </div>

        {/* Liste tâches restantes */}
        {tachesRestantes.length>0 && (
          <>
            {tachesRestantes.slice(0,showAllTaches?999:PREVIEW).map(({client,restE,restC,effE,prevE,effC,prevC},i)=>{
              const pct2 = (prevE+prevC)>0?Math.round((effE+effC)/(prevE+prevC)*100):0;
              return (
                <div key={client.id} className="db-rdv-row" onClick={()=>onClientClick(client)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",
                    borderBottom:i<Math.min(tachesRestantes.length,showAllTaches?999:PREVIEW)-1?"1px solid #f8fafc":"none",
                    cursor:"pointer",background:"#fff"}}>
                  <Avatar nom={client.nom} size={36} photo={client.photoPiscine}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{client.nom}</div>
                    <div style={{display:"flex",gap:8,marginTop:3,alignItems:"center"}}>
                      {prevE>0&&<span style={{fontSize:11,fontWeight:600,color:restE>0?"#d97706":"#16a34a",background:restE>0?"#fef3c7":"#dcfce7",padding:"1px 6px",borderRadius:5}}>🔧 {effE}/{prevE}</span>}
                      {prevC>0&&<span style={{fontSize:11,fontWeight:600,color:restC>0?"#0891b2":"#16a34a",background:restC>0?"#e0f2fe":"#dcfce7",padding:"1px 6px",borderRadius:5}}>💧 {effC}/{prevC}</span>}
                      <div style={{flex:1,height:3,background:"#f1f5f9",borderRadius:99,overflow:"hidden",maxWidth:50}}>
                        <div style={{height:"100%",width:`${pct2}%`,background:pct2>=100?"#22c55e":"#f59e0b",borderRadius:99}}/>
                      </div>
                    </div>
                  </div>
                  <div style={{background:"#fff7ed",color:"#c2410c",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20,border:"1px solid #fed7aa",flexShrink:0}}>
                    {restE+restC} rest.
                  </div>
                </div>
              );
            })}
            {!showAllTaches&&tachesRestantes.length>PREVIEW&&(
              <button onClick={()=>setShowAllTaches(true)} style={{width:"100%",padding:"11px",border:"none",borderTop:"1px solid #f1f5f9",background:"#fafafa",cursor:"pointer",fontSize:12,fontWeight:600,color:"#0891b2",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Voir {tachesRestantes.length-PREVIEW} autres clients
              </button>
            )}
            {showAllTaches&&tachesRestantes.length>PREVIEW&&(
              <button onClick={()=>setShowAllTaches(false)} style={{width:"100%",padding:"10px",border:"none",borderTop:"1px solid #f1f5f9",background:"#fafafa",cursor:"pointer",fontSize:12,fontWeight:600,color:"#94a3b8",fontFamily:"inherit"}}>Réduire</button>
            )}
          </>
        )}
        {tachesRestantes.length===0&&tachesOk.length>0&&(
          <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:10,background:"#f0fdf4"}}>
            <div style={{width:32,height:32,background:"#dcfce7",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span style={{fontSize:13,fontWeight:600,color:"#15803d"}}>Tous les {tachesOk.length} clients sont à jour 🎉</span>
          </div>
        )}
      </div>

      {/* ── PROCHAINES INTERVENTIONS ── */}
      {rdvsToday.length>0 && (
        <div className="db-s4" style={{marginBottom:14,borderRadius:18,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #e2e8f0",background:"#fff"}}>
          <div style={{padding:"13px 16px 10px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:8,background:"#fef3c7",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>Aujourd'hui</span>
            <span style={{marginLeft:"auto",fontSize:11,fontWeight:600,background:"#fef9c3",color:"#92400e",padding:"2px 8px",borderRadius:20,border:"1px solid #fde68a"}}>{rdvsToday.length} RDV</span>
          </div>
          {rdvsToday.map((r,i)=>{
            const c = clients.find(x=>x.id===r.clientId);
            return (
              <div key={r.id} className="db-rdv-row" style={{display:"flex",gap:12,alignItems:"center",padding:"12px 16px",borderBottom:i<rdvsToday.length-1?"1px solid #f8fafc":"none",cursor:"pointer",background:"#fff"}}>
                <div style={{width:48,textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#0891b2",lineHeight:1}}>{r.heure||"--:--"}</div>
                </div>
                <div style={{width:1,height:36,background:"#e2e8f0",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,color:"#0f172a"}}>{r.type}</div>
                  {c&&<div style={{fontSize:11,color:"#64748b",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}{c.adresse?` · ${c.adresse.split(",").pop()?.trim()}`:""}</div>}
                </div>
                <span style={{fontSize:11,fontWeight:600,color:"#0891b2",background:"#e0f2fe",padding:"3px 8px",borderRadius:8,flexShrink:0}}>{r.duree||60} min</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PROCHAINS RDV ── */}
      {rdvsProchains.length>0 && (
        <div className="db-s5" style={{marginBottom:14,borderRadius:18,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #e2e8f0",background:"#fff"}}>
          <div style={{padding:"13px 16px 10px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:8,background:"#e0f2fe",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>Prochaines interventions</span>
          </div>
          {rdvsProchains.map((r,i)=>{
            const c = clients.find(x=>x.id===r.clientId);
            const d = new Date(r.date);
            const isNext = i===0;
            return (
              <div key={r.id} className="db-rdv-row" style={{display:"flex",gap:12,alignItems:"center",padding:"12px 16px",borderBottom:i<rdvsProchains.length-1?"1px solid #f8fafc":"none",cursor:"pointer",background:isNext?"#fafeff":"#fff"}}>
                {/* Date bloc */}
                <div style={{textAlign:"center",minWidth:46,background:isNext?"#0891b2":"#f0f9ff",borderRadius:12,padding:"7px 4px",flexShrink:0,border:isNext?"none":"1px solid #e0f2fe"}}>
                  <div style={{fontSize:9,fontWeight:700,color:isNext?"rgba(255,255,255,0.8)":"#64748b",textTransform:"uppercase",letterSpacing:.5}}>{d.toLocaleDateString("fr",{weekday:"short"})}</div>
                  <div style={{fontSize:20,fontWeight:800,color:isNext?"#fff":"#0891b2",lineHeight:1.1}}>{d.getDate()}</div>
                  <div style={{fontSize:9,color:isNext?"rgba(255,255,255,0.7)":"#64748b"}}>{d.toLocaleDateString("fr",{month:"short"})}</div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,color:"#0f172a"}}>{r.heure&&<span style={{color:"#0891b2",marginRight:4}}>{r.heure}</span>}{r.type}</div>
                  {c&&<div style={{fontSize:11,color:"#64748b",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</div>}
                  {r.description&&<div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{r.description}</div>}
                </div>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CARTE CLIENTS ── */}
      <CarteClients clients={clients} onClientClick={onClientClick}/>


    </div>
  );
}
