// @ts-nocheck
import React, { useState, useEffect } from "react";

// ─── NOTIFICATION SOUND ───────────────────────────────────────────────────────
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  }
  return _audioCtx;
}

export function playNotifSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(()=>{});
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

// ─── PWA SETUP ────────────────────────────────────────────────────────────────
export function setupPWA() {
  if (!document.querySelector('meta[name="theme-color"]')) {
    const m=document.createElement("meta"); m.name="theme-color"; m.content="#0891b2"; document.head.appendChild(m);
  }
  if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
    [
      ["apple-mobile-web-app-capable","yes"],
      ["apple-mobile-web-app-status-bar-style","default"],
      ["apple-mobile-web-app-title","BRIBLUE"],
      ["mobile-web-app-capable","yes"],
      ["format-detection","telephone=no"],
    ].forEach(([n,c])=>{ const m=document.createElement("meta"); m.name=n; m.content=c; document.head.appendChild(m); });
  }
  const vp = document.querySelector('meta[name="viewport"]');
  if (!vp) {
    const m=document.createElement("meta"); m.name="viewport";
    m.content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover";
    document.head.appendChild(m);
  }
  if (!document.querySelector('link[rel="manifest"]')) {
    const svgIcon192 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="40" fill="#0c1222"/><path d="M30 70c15 18 30 18 45 0s30-18 45 0 30 18 45 0" fill="none" stroke="white" stroke-width="8" stroke-linecap="round"/><path d="M30 100c15 18 30 18 45 0s30-18 45 0 30 18 45 0" fill="none" stroke="white" stroke-width="8" stroke-linecap="round"/></svg>`;
    const svgIcon512 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="100" fill="#0c1222"/><path d="M80 190c40 48 80 48 120 0s80-48 120 0 80 48 120 0" fill="none" stroke="white" stroke-width="20" stroke-linecap="round"/><path d="M80 270c40 48 80 48 120 0s80-48 120 0 80 48 120 0" fill="none" stroke="white" stroke-width="20" stroke-linecap="round"/></svg>`;
    const manifest = {
      name:"BRIBLUE CRM", short_name:"BRIBLUE",
      description:"Gestion entretien piscines",
      start_url: window.location.origin + window.location.pathname,
      display:"standalone",
      background_color:"#eef2f7",
      theme_color:"#0891b2",
      orientation:"portrait-primary",
      lang:"fr",
      icons:[
        {src:"data:image/svg+xml,"+encodeURIComponent(svgIcon192),sizes:"192x192",type:"image/svg+xml",purpose:"any maskable"},
        {src:"data:image/svg+xml,"+encodeURIComponent(svgIcon512),sizes:"512x512",type:"image/svg+xml",purpose:"any maskable"},
      ],
      shortcuts:[
        {name:"Nouveau rapport",short_name:"Rapport",description:"Créer un rapport",url:window.location.href+"?action=rapport",icons:[{src:"data:image/svg+xml,"+encodeURIComponent(svgIcon192),sizes:"192x192"}]},
      ],
    };
    try {
      const blob = new Blob([JSON.stringify(manifest)],{type:"application/json"});
      const link=document.createElement("link"); link.rel="manifest"; link.href=URL.createObjectURL(blob); document.head.appendChild(link);
    } catch {}
  }
  if ('serviceWorker' in navigator) {
    const swCode = `
const CACHE = 'briblue-v3-glass';
const STATIC = [];

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebaseio.com') ||
      url.includes('identitytoolkit.googleapis.com') ||
      url.includes('googleapis.com') ||
      url.includes('gstatic.com')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || new Response('Offline', {status: 503})))
  );
});

self.addEventListener('push', e => {
  if (!e.data) return;
  let data = {};
  try { data = e.data.json(); } catch { data = {title: 'BRIBLUE', body: e.data.text()}; }
  const opts = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'briblue-notif',
    data: data.url ? {url: data.url} : {},
    requireInteraction: !!data.requireInteraction,
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  };
  e.waitUntil(self.registration.showNotification(data.title || 'BRIBLUE CRM', opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(cs => {
      for (const c of cs) {
        if ('focus' in c) { c.focus(); if (url !== '/') c.navigate(url); return; }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
    `;
    try {
      const swBlob = new Blob([swCode],{type:'application/javascript'});
      const swUrl = URL.createObjectURL(swBlob);
      navigator.serviceWorker.register(swUrl, {scope: '/'})
        .then(reg => {
          setTimeout(() => {
            if ('Notification' in window && Notification.permission === 'default') {
              Notification.requestPermission().catch(()=>{});
            }
          }, 3000);
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({type:'SKIP_WAITING'});
              }
            });
          });
        })
        .catch(() => {});
    } catch {}
  }
}

// ─── LOCAL NOTIFICATION ───────────────────────────────────────────────────────
export function sendLocalNotification(title, body, options={}) {
  if (!('Notification' in window)) return;
  const fire = () => {
    try {
      new Notification(title, {
        body,
        icon: options.icon || undefined,
        tag: options.tag || 'briblue',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        ...options,
      });
    } catch {
      navigator.serviceWorker?.ready?.then(reg => {
        reg.showNotification(title, {body, tag: options.tag||'briblue', ...options});
      }).catch(()=>{});
    }
  };
  if (Notification.permission === 'granted') { fire(); }
  else if (Notification.permission === 'default') {
    Notification.requestPermission().then(p => { if (p === 'granted') fire(); }).catch(()=>{});
  }
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
export const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Nunito:wght@400;500;600;700;800;900&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }

    body {
      font-family: 'Inter', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #e0f2fe 0%, #cffafe 35%, #e0e7ff 70%, #f0f9ff 100%);
      background-size: 400% 400%;
      animation: gradientShift 20s ease infinite;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      min-height: 100vh;
      min-height: 100dvh;
      color: #0b1220;
      position: relative;
    }
    /* Blobs décoratifs : désactivés sur mobile (trop lourds sur iPhone) */
    body::before, body::after {
      content: '';
      position: fixed;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.55;
      pointer-events: none;
      z-index: 0;
      will-change: transform;
    }
    body::before {
      width: 520px; height: 520px;
      background: radial-gradient(circle, #22d3ee 0%, transparent 70%);
      top: -180px; left: -180px;
      animation: blobFloat1 22s ease-in-out infinite;
    }
    body::after {
      width: 460px; height: 460px;
      background: radial-gradient(circle, #a855f7 0%, transparent 70%);
      bottom: -150px; right: -150px;
      animation: blobFloat2 26s ease-in-out infinite;
    }
    /* Sur écrans tactiles (mobiles/tablettes) : supprimer les blobs et ralentir l'animation du fond */
    @media (pointer: coarse) {
      body { animation: none; }
      body::before, body::after { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      body, body::before, body::after { animation: none !important; }
      .fade-in, .slide-up, .scale-in, .fm-in { animation: none !important; }
    }
    #root, .root-wrap { position: relative; z-index: 1; }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes gradientShift {
      0%,100% { background-position: 0% 50%; }
      50%     { background-position: 100% 50%; }
    }
    @keyframes blobFloat1 {
      0%,100% { transform: translate(0,0) scale(1); }
      33%     { transform: translate(120px, 80px) scale(1.15); }
      66%     { transform: translate(60px, 160px) scale(0.9); }
    }
    @keyframes blobFloat2 {
      0%,100% { transform: translate(0,0) scale(1); }
      33%     { transform: translate(-100px, -80px) scale(1.1); }
      66%     { transform: translate(-50px, -140px) scale(0.95); }
    }

    button, a, input, select, textarea { touch-action: manipulation; }
    input, select, textarea, button { font-family: inherit; }

    input, select, textarea {
      background: rgba(255,255,255,0.55) !important;
      color: #0b1220 !important;
      -webkit-text-fill-color: #0b1220 !important;
      color-scheme: light;
      border: 1px solid rgba(255,255,255,0.5) !important;
      backdrop-filter: blur(12px) saturate(140%);
      -webkit-backdrop-filter: blur(12px) saturate(140%);
      transition: all .2s ease;
    }
    input::placeholder, textarea::placeholder { color: #64748b !important; -webkit-text-fill-color: #64748b !important; }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #06b6d4 !important;
      background: rgba(255,255,255,0.75) !important;
      box-shadow: 0 0 0 4px rgba(6,182,212,0.18), 0 8px 24px rgba(6,182,212,0.15) !important;
    }
    input[type="date"], input[type="time"] { -webkit-appearance: none; appearance: none; }
    select { -webkit-appearance: none; appearance: none; }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: rgba(255,255,255,0.2); border-radius: 99px; }
    ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #22d3ee, #0891b2); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #06b6d4, #0e7490); }

    @supports (-webkit-overflow-scrolling: touch) {
      .sticky-header { position: -webkit-sticky; position: sticky; }
    }

    @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeInFast { from { opacity:0; } to { opacity:1; } }
    @keyframes slideUp { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
    @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.55; } }
    @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
    @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
    @keyframes glassShine {
      0%   { transform: translateX(-120%) skewX(-15deg); }
      100% { transform: translateX(220%)  skewX(-15deg); }
    }
    .fade-in   { animation: fadeIn .4s cubic-bezier(.22,1,.36,1) both; }
    .slide-up  { animation: slideUp .42s cubic-bezier(.22,1,.36,1) both; }
    .scale-in  { animation: scaleIn .32s cubic-bezier(.22,1,.36,1) both; }

    .btn-hover {
      transition: all .22s cubic-bezier(.22,1,.36,1);
      position: relative;
      overflow: hidden;
    }
    .btn-hover::after {
      content: '';
      position: absolute; top:0; left:0; width:40%; height:100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      transform: translateX(-120%) skewX(-15deg);
      pointer-events: none;
    }
    .btn-hover:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 40px rgba(6,182,212,0.22), 0 4px 12px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.8) !important;
    }
    .btn-hover:hover::after { animation: glassShine 0.75s ease; }
    .btn-hover:active { transform: scale(0.97); }

    .card-hover { transition: all .25s cubic-bezier(.22,1,.36,1); }
    .card-hover:hover {
      transform: translateY(-3px);
      box-shadow: 0 20px 50px rgba(6,182,212,0.18), 0 6px 16px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.8) !important;
    }
    .card-hover:active { transform: translateY(0); }

    .nm-card {
      background: rgba(255,255,255,0.55);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-radius: 22px;
      border: 1px solid rgba(255,255,255,0.55);
      box-shadow:
        0 8px 32px rgba(6,182,212,0.10),
        0 2px 8px rgba(15,23,42,0.06),
        inset 0 1px 0 rgba(255,255,255,0.7);
    }
    .nm-inset {
      background: rgba(255,255,255,0.45);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: inset 0 2px 6px rgba(15,23,42,0.06), inset 0 0 0 1px rgba(255,255,255,0.4);
      border-radius: 14px;
      border: none;
    }

    @media (min-width: 768px) {
      .sidebar-nav-active {
        background: linear-gradient(135deg, rgba(6,182,212,0.22), rgba(99,102,241,0.18)) !important;
        box-shadow: 0 4px 14px rgba(6,182,212,0.15), inset 0 1px 0 rgba(255,255,255,0.6) !important;
        color: #0891b2 !important;
      }
    }
    .page-content { animation: fadeInFast .3s ease both; }

    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      .safe-bottom { padding-bottom: calc(80px + env(safe-area-inset-bottom)); }
    }

    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
      .nm-card, .nm-inset, .blur-bg {
        background: rgba(255,255,255,0.9) !important;
      }
      input, select, textarea { background: rgba(255,255,255,0.95) !important; }
    }

    h1, h2, h3, h4 { font-family: 'Inter', system-ui, sans-serif; letter-spacing: -0.02em; }

    .glass {
      background: rgba(255,255,255,0.55);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255,255,255,0.55);
    }
    .glass-strong {
      background: rgba(255,255,255,0.72);
      backdrop-filter: blur(28px) saturate(200%);
      -webkit-backdrop-filter: blur(28px) saturate(200%);
      border: 1px solid rgba(255,255,255,0.65);
    }

    @keyframes fm-fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .fm-in { animation: fm-fadeUp 0.3s ease both; }
    .fm-field label { display:block; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
    .fm-field input, .fm-field select, .fm-field textarea {
      width:100%; padding:12px 14px; border-radius:12px;
      border:1.5px solid #e2e8f0; font-size:14px; color:#0f172a;
      font-family:'Inter',system-ui,sans-serif; outline:none;
      background:#fff; transition:border-color 0.15s, box-shadow 0.15s;
      -webkit-appearance:none; box-sizing:border-box;
    }
    .fm-field input:focus, .fm-field select:focus, .fm-field textarea:focus {
      border-color:#0891b2; box-shadow:0 0 0 3px rgba(8,145,178,0.1);
    }
    .fm-choice { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:12px; border:1.5px solid #e2e8f0; cursor:pointer; transition:all 0.15s; background:#fff; width:100%; text-align:left; font-family:inherit; }
    .fm-choice.active { border-color:#0891b2; background:#f0f9ff; }
    .fm-choice:active { transform:scale(0.98); }
    .fm-save-btn { width:100%; padding:15px; border-radius:14px; border:none; cursor:pointer; font-family:inherit; font-size:15px; font-weight:700; color:#fff; box-shadow:0 4px 14px rgba(8,145,178,0.35); transition:transform 0.13s,box-shadow 0.13s; display:flex; align-items:center; justify-content:center; gap:8px; }
    .fm-save-btn:active { transform:scale(0.98); box-shadow:0 2px 8px rgba(8,145,178,0.25); }
    .fm-cancel-btn { width:100%; padding:13px; border-radius:14px; border:1.5px solid #e2e8f0; cursor:pointer; font-family:inherit; font-size:14px; font-weight:500; color:#64748b; background:#f8fafc; transition:background 0.15s; }
    .fm-cancel-btn:active { background:#e2e8f0; }
    .fm-section-title { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
    .fm-section-title::after { content:''; flex:1; height:1px; background:#f1f5f9; }
    .fm-client-row { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:12px; border:1.5px solid #e2e8f0; cursor:pointer; transition:all 0.15s; background:#fff; width:100%; text-align:left; font-family:inherit; }
    .fm-client-row.sel { border-color:#0891b2; background:#f0f9ff; }
    .fm-client-row:active { transform:scale(0.99); }
    .fm-num-btn { width:32px; height:32px; border-radius:8px; border:none; cursor:pointer; font-size:16px; font-weight:600; display:flex; align-items:center; justify-content:center; transition:all 0.12s; flex-shrink:0; }
    .fm-num-btn:active { transform:scale(0.9); }
    .db-btn { transition: transform 0.13s, box-shadow 0.13s; cursor:pointer; }
    .db-btn:active { transform:scale(0.95) !important; }
    .db-card { transition: box-shadow 0.15s, transform 0.15s; }
    .db-rdv-row { transition: background 0.15s; cursor:pointer; }
    .db-rdv-row:active { background: #f0f9ff !important; }
    @keyframes db-fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes db-wave { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes db-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    .db-s1 { animation: db-fadeUp 0.45s ease both 0.05s; }
    .db-s2 { animation: db-fadeUp 0.45s ease both 0.12s; }
    .db-s3 { animation: db-fadeUp 0.45s ease both 0.19s; }
    .db-s4 { animation: db-fadeUp 0.45s ease both 0.26s; }
    .db-s5 { animation: db-fadeUp 0.45s ease both 0.33s; }
    .db-s6 { animation: db-fadeUp 0.45s ease both 0.40s; }
    .db-stat-shimmer { background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%); background-size:200% 100%; animation: db-shimmer 2.5s infinite; }

    @keyframes cv-spin { to { transform: rotate(360deg); } }
    @keyframes cv-fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes cv-fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes cv-progress { from { width:0%; } to { width: var(--pw); } }
    .cv-card-hover { transition: transform 0.15s ease, box-shadow 0.15s ease; }
    .cv-card-hover:active { transform: scale(0.985); }
    .cv-btn-press:active { transform: scale(0.96); }
    .cv-glass { background: rgba(255,255,255,0.12); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2); }
    .cv-param-cell { transition: background 0.2s; }
    .cv-param-cell:active { background: #f0f9ff !important; }
    .cv-rapport-row { transition: background 0.15s, transform 0.12s; cursor:pointer; }
    .cv-rapport-row:active { background: #f0f9ff !important; transform: scale(0.99); }
    .cv-scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; scroll-behavior:smooth; }
    .cv-scroll::-webkit-scrollbar { display:none; }
    .cv-stagger-1 { animation: cv-fadeUp 0.4s ease both 0.05s; }
    .cv-stagger-2 { animation: cv-fadeUp 0.4s ease both 0.12s; }
    .cv-stagger-3 { animation: cv-fadeUp 0.4s ease both 0.19s; }
    .cv-stagger-4 { animation: cv-fadeUp 0.4s ease both 0.26s; }
    .cv-stagger-5 { animation: cv-fadeUp 0.4s ease both 0.33s; }
  `}</style>
);

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
const toastListeners = [];
export function subscribeToast(fn) { toastListeners.push(fn); return ()=>{ const i=toastListeners.indexOf(fn); if(i>=0) toastListeners.splice(i,1); }; }
export function showToast(msg, type="info") { toastListeners.forEach(fn=>fn({msg, type, id:Date.now()+Math.random()})); }
export function toastSuccess(msg) { showToast(msg,"success"); }
export function toastError(msg)   { showToast(msg,"error"); }
export function toastInfo(msg)    { showToast(msg,"info"); }
export function toastWarn(msg)    { showToast(msg,"warn"); }

// ─── CONFIRM SYSTEM ──────────────────────────────────────────────────────────
const confirmListeners = [];
export function subscribeConfirm(fn) { confirmListeners.push(fn); return ()=>{ const i=confirmListeners.indexOf(fn); if(i>=0) confirmListeners.splice(i,1); }; }
export function showConfirm(msg, onOk, onCancel) { confirmListeners.forEach(fn=>fn({msg, onOk, onCancel, id:Date.now()+Math.random()})); }

// ─── TOAST CONTAINER ─────────────────────────────────────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(()=>{
    return subscribeToast(t=>{
      setToasts(p=>[...p,t]);
      setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==t.id)), 3800);
    });
  },[]);
  const STYLES = {
    success:{bg:"#ecfdf5",border:"#6ee7b7",icon:"✅",color:"#065f46"},
    error:  {bg:"#fef2f2",border:"#fca5a5",icon:"❌",color:"#991b1b"},
    warn:   {bg:"#fffbeb",border:"#fcd34d",icon:"⚠️",color:"#92400e"},
    info:   {bg:"#eff6ff",border:"#93c5fd",icon:"ℹ️",color:"#1e40af"},
  };
  if(!toasts.length) return null;
  return (
    <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:99999,display:"flex",flexDirection:"column",gap:8,minWidth:280,maxWidth:"92vw",pointerEvents:"none"}}>
      {toasts.map(t=>{
        const s=STYLES[t.type]||STYLES.info;
        return (
          <div key={t.id} className="scale-in" style={{display:"flex",alignItems:"center",gap:10,padding:"12px 18px",borderRadius:14,background:s.bg,border:"1.5px solid "+s.border,boxShadow:"0 8px 32px rgba(0,0,0,0.13)",pointerEvents:"all",fontFamily:"Inter,sans-serif"}}>
            <span style={{fontSize:17,flexShrink:0}}>{s.icon}</span>
            <span style={{fontSize:13,fontWeight:600,color:s.color,lineHeight:1.4}}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
export function ConfirmModal() {
  const [item, setItem] = useState(null);
  useEffect(()=>{
    return subscribeConfirm(c=>setItem(c));
  },[]);
  if(!item) return null;
  const handle = (ok) => {
    setItem(null);
    if(ok && item.onOk) item.onOk();
    if(!ok && item.onCancel) item.onCancel();
  };
  const isDelete = item.msg?.toLowerCase().includes("supprim");
  const isSave   = item.msg?.toLowerCase().includes("enregistr") || item.msg?.toLowerCase().includes("sauvegarder") || item.msg?.toLowerCase().includes("modifier");
  const isSend   = item.msg?.toLowerCase().includes("envoyer") || item.msg?.toLowerCase().includes("email");
  const emoji    = isDelete ? "🗑️" : isSend ? "📧" : isSave ? "💾" : "❓";
  const btnLabel = isDelete ? "Supprimer" : isSend ? "Envoyer" : isSave ? "Confirmer" : "Confirmer";
  const btnColor = isDelete
    ? "linear-gradient(135deg,#ef4444,#dc2626)"
    : isSend
    ? "linear-gradient(135deg,#059669,#0d9488)"
    : "linear-gradient(135deg,#0891b2,#06b6d4)";
  const btnShadow = isDelete
    ? "0 4px 12px rgba(220,38,38,0.35)"
    : isSend
    ? "0 4px 12px rgba(5,150,105,0.35)"
    : "0 4px 12px rgba(8,145,178,0.35)";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:99998,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)"}}>
      <div className="scale-in" style={{background:"rgba(255,255,255,0.75)",backdropFilter:"blur(20px) saturate(180%)",WebkitBackdropFilter:"blur(20px) saturate(180%)",borderRadius:24,padding:"32px 24px",maxWidth:340,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)",fontFamily:"Inter,sans-serif",border:"1px solid rgba(255,255,255,0.6)"}}>
        <div style={{fontSize:44,textAlign:"center",marginBottom:14}}>{emoji}</div>
        <div style={{fontSize:16,fontWeight:800,color:"#0c1222",textAlign:"center",marginBottom:6,lineHeight:1.4}}>{item.msg}</div>
        {item.sub&&<div style={{fontSize:13,color:"#64748b",textAlign:"center",marginBottom:0,lineHeight:1.5}}>{item.sub}</div>}
        <div style={{display:"flex",gap:10,marginTop:24}}>
          <button onClick={()=>handle(false)} style={{flex:1,padding:"13px",borderRadius:14,background:"rgba(255,255,255,0.6)",border:"1.5px solid rgba(0,0,0,0.08)",cursor:"pointer",fontWeight:700,fontSize:14,color:"#64748b",fontFamily:"inherit"}}>
            Annuler
          </button>
          <button onClick={()=>handle(true)} style={{flex:1,padding:"13px",borderRadius:14,background:btnColor,border:"none",cursor:"pointer",fontWeight:800,fontSize:14,color:"#fff",fontFamily:"inherit",boxShadow:btnShadow}}>
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
