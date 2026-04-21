// @ts-nocheck
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const supabase = createClient(
  "https://qhemxhnhbgdfvjqedwyi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZW14aG5oYmdkZnZqcWVkd3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODMzMDksImV4cCI6MjA5MTQ1OTMwOX0.JFcwVtN5QM-kEJISjU4l5qy9O559qo45LM2v62A9rMM"
);

const BRAND_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="96" viewBox="0 0 420 96">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#0891b2"/>
    </linearGradient>
  </defs>
  <rect width="420" height="96" rx="22" fill="white"/>
  <g transform="translate(18 18)">
    <rect width="60" height="60" rx="18" fill="url(#g)"/>
    <path d="M10 24c5 6 10 6 15 0s10-6 15 0 10 6 15 0" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"/>
    <path d="M10 38c5 6 10 6 15 0s10-6 15 0 10 6 15 0" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"/>
  </g>
  <text x="94" y="42" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" fill="#0c1222">BRIBLUE</text>
  <text x="94" y="66" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="600" fill="#0891b2">Création - Traitement de l&apos;eau - Installation - Dépannage</text>
</svg>`)}`;


const LOGO_FICHE = "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%224%22%20y%3D%223%22%20width%3D%2216%22%20height%3D%2218%22%20rx%3D%222%22/%3E%3Cpolyline%20points%3D%2216%203%2016%207%2020%207%22/%3E%3Cpath%20d%3D%22M8%209l1%201%202-2%22/%3E%3Cline%20x1%3D%2213%22%20y1%3D%2210%22%20x2%3D%2217%22%20y2%3D%2210%22/%3E%3Cpath%20d%3D%22M8%2014l1%201%202-2%22/%3E%3Cline%20x1%3D%2213%22%20y1%3D%2215%22%20x2%3D%2217%22%20y2%3D%2215%22/%3E%3C/svg%3E";

const IconFiche = ({size=18, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="2"/>
    <polyline points="16 3 16 7 20 7" fill="none"/>
    <path d="M7 10l1.5 1.5L11 9"/>
    <line x1="13" y1="10.5" x2="17" y2="10.5"/>
    <path d="M7 15l1.5 1.5L11 14"/>
    <line x1="13" y1="15.5" x2="17" y2="15.5"/>
  </svg>
);

// ICNES SVG PREMIUM
const Ico = {
// Pool-themed professional icons
  home: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
  clients: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></svg>,
  clipboard: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  contract: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>,
  epuisette: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="9" r="6"/><path d="M10 9v6"/><path d="M4 9a6 6 0 0012 0"/><line x1="10" y1="15" x2="10" y2="22"/></svg>,
  chemicals: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v5l3 9a3 3 0 01-3 3H9a3 3 0 01-3-3l3-9V3z"/><line x1="9" y1="3" x2="15" y2="3"/><path d="M7.5 15h9"/></svg>,
  edit: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  close: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  save: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  search: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  back: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  next: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  check: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  alert: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  phone: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.15 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  mail: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  pin: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  user: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  note: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
  pdf: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/></svg>,
  send: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  sign: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
  calendar: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  drop: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>,
  phTest: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><circle cx="12" cy="14" r="3"/><line x1="10" y1="5" x2="14" y2="5"/></svg>,
  chart: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  euro: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M17 8a6 6 0 100 8"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="9" x2="12" y2="9"/></svg>,
  pool: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 14c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/><path d="M7 6V3M17 6V3"/></svg>,
  wrench: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  brush: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="17" width="12" height="4" rx="1"/><path d="M5 17V8a2 2 0 012-2h4a2 2 0 012 2v9"/><line x1="15" y1="19" x2="21" y2="19"/></svg>,
  clock: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  star: (s=16,c="currentColor",fill="none") => <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  snow: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 7l-5-5-5 5"/><path d="M17 17l-5 5-5-5"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M7 7l-5 5 5 5"/><path d="M17 7l5 5-5 5"/></svg>,
  flower: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2a3 3 0 000 6M12 16a3 3 0 000 6M2 12a3 3 0 006 0M16 12a3 3 0 006 0M4.93 4.93a3 3 0 004.24 4.24M14.83 14.83a3 3 0 004.24 4.24M4.93 19.07a3 3 0 004.24-4.24M14.83 9.17a3 3 0 004.24-4.24"/></svg>,
  sun: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  leaf: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M11 20A7 7 0 014 13c0-7 7-11 7-11s7 4 7 11a7 7 0 01-7 7z"/><line x1="11" y1="20" x2="11" y2="13"/></svg>,
  wave: (s=28,c="white") => <svg width={s} height={s} viewBox="0 0 32 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><path d="M2 8c2.5 3 5 3 7.5 0S14 5 16.5 8s5 3 7.5 0"/><path d="M2 16c2.5 3 5 3 7.5 0S14 13 16.5 16s5 3 7.5 0"/></svg>,
  cart: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-8.42H6"/></svg>,
  truck: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  camera: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  image: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  userPlus: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  rdv: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="15" r="2"/></svg>,
  download: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
};


// DONNES PAR DFAUT
// Modle mois par mois: {1:{entretien:0,controle:0}, 2:{...}, ... 12:{...}}
const MOIS_PAR_MOIS_DEF = Object.fromEntries([...Array(12)].map((_,i)=>[i+1,{entretien:0,controle:0}]));
const SAISONS_META = {
  hiver:     { label: "Hiver",     icon: "snow",    mois: [12,1,2],  color: "#60a5fa", bg: "#eff6ff" },
  printemps: { label: "Printemps", icon: "flower",  mois: [3,4,5],   color: "#34d399", bg: "#ecfdf5" },
  ete:       { label: "Été",       icon: "sun",     mois: [6,7,8],   color: "#f59e0b", bg: "#fffbeb" },
  automne:   { label: "Automne",   icon: "leaf",    mois: [9,10,11], color: "#d97706", bg: "#fff7ed" },
};
const MOIS = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MOIS_L = ["","Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

// Migration: old saisons format OR moisParMois  normalized moisParMois (keys always integers)
function migrateMois(data) {
  if (!data) return {...MOIS_PAR_MOIS_DEF};
// Already mois-par-mois? (keys 1-12 as string or number)
  if (data["1"] || data[1]) {
    const r = {};
    for (let m=1;m<=12;m++) { const v=data[m]||data[String(m)]||{entretien:0,controle:0}; r[m]={entretien:v.entretien??0,controle:v.controle??0}; }
    return r;
  }
// Old saisons format  convert
  const SM = {hiver:[12,1,2],printemps:[3,4,5],ete:[6,7,8],automne:[9,10,11]};
  const r = {};
  for (let m=1;m<=12;m++) r[m]={entretien:0,controle:0};
  for (const [k,mois] of Object.entries(SM)) {
    const v = data[k]; if (!v) continue;
    const e = typeof v === "number" ? v : v.entretien ?? 0;
    const c = typeof v === "number" ? 0 : v.controle ?? 0;
    for (const m of mois) { r[m] = {entretien:e, controle:c}; }
  }
  return r;
}
function getMoisVal(mpm, m) { const d = migrateMois(mpm); return d[m] || d[String(m)] || {entretien:0,controle:0}; }

// ═══════════════════════════════════════════════════════════
// DÉDUCTION AUTOMATIQUE : passage ⭐ non prévu
// Si en mois M les passages effectués > planning, l'excédent
// est déduit du mois précédent ou suivant qui a un déficit.
// ═══════════════════════════════════════════════════════════
// Planning brut sans déduction automatique — retourne simplement le planning prévu par mois
function getPlanningMois(mpm) {
  const plan = {};
  for (let m = 1; m <= 12; m++) {
    const v = getMoisVal(mpm, m);
    plan[m] = { e: v.entretien, c: v.controle };
  }
  return plan;
}


const CLIENTS_INIT = [
  { id:"C001", nom:"GAMBIN IMMO - COPRO O GARDEN", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"Confort+", prix:2418, prixPassageE:78, prixPassageC:0, dateDebut:"2025-09-29", dateFin:"2026-09-29", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:2,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:2,controle:0},11:{entretien:2,controle:0},12:{entretien:2,controle:0}} },
  { id:"C002", nom:"Mme HAMMER", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"Confort", prix:2210, prixPassageE:85, prixPassageC:0, dateDebut:"2026-03-01", dateFin:"2027-03-01", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
  { id:"C003", nom:"Mme LOPEZ", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"VAC+", prix:1690, prixPassageE:65, prixPassageC:0, dateDebut:"2025-06-01", dateFin:"2026-06-01", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
  { id:"C004", nom:"Mme MARCELLOT", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"VAC+", prix:1690, prixPassageE:65, prixPassageC:0, dateDebut:"2025-11-20", dateFin:"2026-11-20", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:1,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
  { id:"C005", nom:"Mr MOREL", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"VAC+", prix:1690, prixPassageE:65, prixPassageC:0, dateDebut:"2026-03-01", dateFin:"2027-03-01", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
  { id:"C006", nom:"Mr NEGRE Claude", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"Confort", prix:1740, prixPassageE:65, prixPassageC:35, dateDebut:"2026-04-01", dateFin:"2027-04-01", photoPiscine:"", moisParMois:{1:{entretien:0,controle:1},2:{entretien:0,controle:1},3:{entretien:0,controle:1},4:{entretien:2,controle:1},5:{entretien:4,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:1},11:{entretien:0,controle:1},12:{entretien:0,controle:1}} },
  { id:"C007", nom:"Mme RITTER", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"VAC+", prix:1690, prixPassageE:65, prixPassageC:0, dateDebut:"2025-07-28", dateFin:"2026-07-28", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
];
const PASSAGES_INIT = [
  { id:1, clientId:"C001", date:"2026-04-06", type:"Entretien complet", ph:7.2, chlore:1.5, actions:"Nettoyage, vérif. pompe", obs:"RAS",                      tech:"Dorian", ok:true },
  { id:2, clientId:"C002", date:"2026-04-06", type:"Entretien complet", ph:7.4, chlore:1.2, actions:"Nettoyage, ajust. pH",    obs:"Filtre à changer bientôt", tech:"Dorian", ok:true },
  { id:3, clientId:"C001", date:"2026-04-07", type:"Contrôle d'eau",    ph:7.1, chlore:1.8, actions:"Contrôle mesures",          obs:"RAS",                      tech:"Dorian", ok:true },
];

const PRODUITS_DEFAUT = ["Chlore lent Galet","PH minus","Flocculant","Anti-calcaire","Anti-Algues","Anti-Phosphate","Éponge Magique","Filtre à cartouche","Tac+","Chlore granule","Hypochlorite","Anti-Algues moutarde","Sac de sel"];

const STATUT_LIV = {
  aFacturer: { label:"À facturer", color:"#0369a1", bg:"#f0f9ff" },
  facture:   { label:"Facturé",    color:"#0284c7", bg:"#e0f2fe" },
  paye:      { label:"Payé",       color:"#059669", bg:"#d1fae5" },
};

// RESPONSIVE HOOK
function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(()=>{
    const h = ()=> setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    window.addEventListener("orientationchange", h);
    return ()=>{ window.removeEventListener("resize", h); window.removeEventListener("orientationchange", h); };
  },[]);
  return m;
}

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(()=>{
    const onOn = ()=>{ setOnline(true); flushOfflineQueue().then(()=>setPendingCount(0)); };
    const onOff = ()=>setOnline(false);
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    // Vérifier la queue toutes les 30s
    const interval = setInterval(()=>{ setPendingCount(Object.keys(offlineQueue.pending).length); }, 5000);
    return ()=>{ window.removeEventListener('online', onOn); window.removeEventListener('offline', onOff); clearInterval(interval); };
  },[]);
  return { online, pendingCount };
}

// STORAGE
async function load(key, fallback) {
  try {
    const { data, error } = await supabase
      .from("app_data")
      .select("data")
      .eq("id", 1)
      .single();

    if (error || !data?.data) {
      try { const ls = localStorage.getItem("briblue_" + key); if (ls) return JSON.parse(ls); } catch {}
      return fallback;
    }

    const allData = data.data;
    if (key in allData) return allData[key];

    try { const ls = localStorage.getItem("briblue_" + key); if (ls) return JSON.parse(ls); } catch {}
    return null;
  } catch {
    try { const ls = localStorage.getItem("briblue_" + key); if (ls) return JSON.parse(ls); } catch {}
    return fallback;
  }
}

// Queue hors-ligne
const offlineQueue = { pending: {}, flush: null };

async function saveToSupabase(key, val) {
  const { error } = await supabase.rpc('patch_app_data', { p_key: key, p_val: val });
  if (error) {
    const { data: current } = await supabase.from("app_data").select("data").eq("id",1).single();
    await supabase.from("app_data").upsert({ id:1, data:{...(current?.data||{}), [key]:val} });
  }
}

async function flushOfflineQueue() {
  const keys = Object.keys(offlineQueue.pending);
  if (!keys.length) return;
  for (const key of keys) {
    try {
      await saveToSupabase(key, offlineQueue.pending[key]);
      delete offlineQueue.pending[key];
    } catch {}
  }
}

// Écouter le retour de connexion
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOfflineQueue();
  });
}

async function save(key, val) {
  // Toujours sauvegarder en mémoire locale d'abord
  try { localStorage.setItem('briblue_' + key, JSON.stringify(val)); } catch {}
  
  if (!navigator.onLine) {
    // Hors-ligne : stocker dans la queue
    offlineQueue.pending[key] = val;
    return;
  }
  
  // En ligne : envoyer directement
  try {
    await saveToSupabase(key, val);
    // Vider la queue si items en attente
    if (Object.keys(offlineQueue.pending).length > 0) flushOfflineQueue();
  } catch {
    // Erreur réseau : mettre en queue
    offlineQueue.pending[key] = val;
  }
}


// UTILS
function getSaison(m) {
  for (const [k,s] of Object.entries(SAISONS_META)) if (s.mois.includes(m)) return k;
  return "ete";
}
function getEntretienMois(mpm, m) { return getMoisVal(mpm, m).entretien; }
function getControleMois(mpm, m) { return getMoisVal(mpm, m).controle; }
function totalAnnuel(mpm, type="all") {
  let t=0;
  for (let m=1;m<=12;m++) {
    const v = getMoisVal(mpm, m);
    if (type==="entretien") t+=v.entretien;
    else if (type==="controle") t+=v.controle;
    else t+=v.entretien+v.controle;
  }
  return t;
}
function daysUntil(d) {
  if (!d) return null;
  return Math.round((new Date(d) - new Date()) / 86400000);
}
function isEntretienType(type) {
  const t = (type||"").toLowerCase();
  return t.includes("entretien") || t.includes("visite complète") || t.includes("visite technique") || t.includes("rattrapage");
}
function isControleType(type) {
  const t = (type||"").toLowerCase();
  return t.includes("contrôle") || t.includes("controle");
}
function alerteClient(c, passages) {
  const j = daysUntil(c.dateFin);
  const cs = c.dateDebut ? c.dateDebut.slice(0,10) : null;
  const ce = c.dateFin ? c.dateFin.slice(0,10) : null;
  const today = TODAY;

  // Contrat pas encore commencé → ok
  if (cs && today < cs) return "ok";
  // Fin de contrat proche
  if (j !== null && j >= 0 && j <= 30) return "rouge";
  if (j !== null && j > 30 && j <= 60) return "jaune";

  const now = new Date();
  const moisCur = now.getMonth() + 1;
  const yearCur = now.getFullYear();
  const mpm = c.moisParMois || c.saisons || {};

  // Passages dans la plage du contrat
  const passContrat = passages.filter(p => {
    if (p.clientId !== c.id) return false;
    if (cs && ce) { const d = String(p.date).slice(0,10); return d >= cs && d <= ce; }
    return new Date(p.date).getFullYear() === yearCur;
  });

  // Planning brut (sans déduction automatique)
  const mpmPlan = getPlanningMois(mpm);

  // Ne vérifier que les mois qui sont DANS la plage du contrat ET passés
  let retard = false;
  for (let m = 1; m < moisCur; m++) {
    const effPlan = (mpmPlan[m]?.e||0) + (mpmPlan[m]?.c||0);
    if (effPlan === 0) continue;
    const moisStr = `${yearCur}-${String(m).padStart(2,'0')}-01`;
    if (cs && moisStr < cs.slice(0,8)+'01') continue;
    if (ce && moisStr > ce) continue;
    const done = passContrat.filter(p => {
      const d = new Date(p.date);
      return d.getMonth()+1 === m && d.getFullYear() === yearCur;
    }).length;
    if (done < effPlan) { retard = true; break; }
  }
  if (retard) return "orange";

  // Mois EN COURS dans la plage du contrat
  const effCurPlan = (mpmPlan[moisCur]?.e||0) + (mpmPlan[moisCur]?.c||0);
  if (effCurPlan > 0) {
    const moisCurStr = `${yearCur}-${String(moisCur).padStart(2,'0')}-01`;
    const inRange = (!cs || moisCurStr >= cs.slice(0,8)+'01') && (!ce || moisCurStr <= ce);
    if (inRange) {
      const doneCur = passContrat.filter(p => {
        const d = new Date(p.date);
        return d.getMonth()+1 === moisCur && d.getFullYear() === yearCur;
      }).length;
      if (doneCur < effCurPlan) return "aFaire";
    }
  }

  return "ok";
}
function uid() { return crypto.randomUUID(); }
const TODAY = new Date().toISOString().split("T")[0];

/**
 * calcMensualites(prixAnnuel)
 * Si prixAnnuel / 12 n'est pas un entier :
 *   - mois 1 = arrondi au centime supérieur pour absorber le reste
 *   - mois 2-12 = Math.floor(prixAnnuel / 12 * 100) / 100
 * Garantit que la somme des 12 mensualités == prixAnnuel exactement.
 *
 * Retourne { m1, m11, estRond, total }
 */
function calcMensualites(prixAnnuel) {
  if (!prixAnnuel || prixAnnuel <= 0) return { m1: 0, m11: 0, estRond: true, total: 0 };
  const base = Math.floor(prixAnnuel / 12 * 100) / 100; // centimes inférieurs
  const somme11 = Math.round(base * 11 * 100) / 100;
  const m1 = Math.round((prixAnnuel - somme11) * 100) / 100;
  const estRond = m1 === base;
  return { m1, m11: base, estRond, total: prixAnnuel };
}

const MOIS_NOW = new Date().getMonth() + 1;
const YEAR_NOW = new Date().getFullYear();


// ICS EXPORT
function exportRdvToICS(rdv, client) {
  const dt = rdv.date.replace(/-/g, "");
  const heure = (rdv.heure || "09:00").replace(":", "");
  const duree = parseInt(rdv.duree, 10) || 60;
  const startMinutes = parseInt(heure.slice(0, 2), 10) * 60 + parseInt(heure.slice(2), 10);
  const endMinutes = startMinutes + duree;
  const endH = Math.floor(endMinutes / 60);
  const endM = endMinutes % 60;
  const endTime = String(endH).padStart(2, "0") + String(endM).padStart(2, "0");

  const desc = [
    rdv.description || "",
    client ? "Client: " + (client.nom || "") : "",
    client && client.adresse ? "Adresse: " + client.adresse : "",
  ].filter(Boolean).join("\\n");

  const summary = "BRIBLUE - " + (rdv.type || "Rendez-vous") + (client ? " - " + (client.nom || "") : "");
  const locationLine = client && client.adresse ? "LOCATION:" + client.adresse : "";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BRIBLUE//CRM//FR",
    "BEGIN:VEVENT",
    "DTSTART:" + dt + "T" + heure + "00",
    "DTEND:" + dt + "T" + endTime + "00",
    "SUMMARY:" + summary,
    "DESCRIPTION:" + desc,
    locationLine,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:RDV BRIBLUE dans 30 min",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `BRIBLUE_RDV_${dt}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// NOTIFICATION SOUND
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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

// PWA SETUP
function setupPWA() {
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = {name:"BRIBLUE CRM",short_name:"BRIBLUE",description:"Gestion entretien piscines",start_url:window.location.href,display:"standalone",background_color:"#0c1222",theme_color:"#0891b2",orientation:"portrait",icons:[{src:"data:image/svg+xml,"+encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 192 192\"><rect width=\"192\" height=\"192\" rx=\"40\" fill=\"#0c1222\"/><path d=\"M30 70c15 18 30 18 45 0s30-18 45 0 30 18 45 0\" fill=\"none\" stroke=\"white\" stroke-width=\"8\" stroke-linecap=\"round\"/><path d=\"M30 100c15 18 30 18 45 0s30-18 45 0 30 18 45 0\" fill=\"none\" stroke=\"white\" stroke-width=\"8\" stroke-linecap=\"round\"/></svg>'),sizes:"192x192",type:"image/svg+xml"},{src:"data:image/svg+xml,"+encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><rect width=\"512\" height=\"512\" rx=\"100\" fill=\"#0c1222\"/><path d=\"M80 190c40 48 80 48 120 0s80-48 120 0 80 48 120 0\" fill=\"none\" stroke=\"white\" stroke-width=\"20\" stroke-linecap=\"round\"/><path d=\"M80 270c40 48 80 48 120 0s80-48 120 0 80 48 120 0\" fill=\"none\" stroke=\"white\" stroke-width=\"20\" stroke-linecap=\"round\"/></svg>'),sizes:"512x512",type:"image/svg+xml"}]};
    const blob = new Blob([JSON.stringify(manifest)], {type:"application/json"});
    const link = document.createElement("link"); link.rel="manifest"; link.href=URL.createObjectURL(blob); document.head.appendChild(link);
  }
  if (!document.querySelector('meta[name="theme-color"]')) { const m=document.createElement("meta"); m.name="theme-color"; m.content="#0891b2"; document.head.appendChild(m); }
  if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) { const m1=document.createElement("meta"); m1.name="apple-mobile-web-app-capable"; m1.content="yes"; document.head.appendChild(m1); const m2=document.createElement("meta"); m2.name="apple-mobile-web-app-status-bar-style"; m2.content="black-translucent"; document.head.appendChild(m2); const m3=document.createElement("meta"); m3.name="apple-mobile-web-app-title"; m3.content="BRIBLUE"; document.head.appendChild(m3); }
  if ('serviceWorker' in navigator) { const swCode=`self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>self.clients.claim());self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).catch(()=>new Response('Offline',{status:503}))));`; const swBlob=new Blob([swCode],{type:'application/javascript'}); navigator.serviceWorker.register(URL.createObjectURL(swBlob)).catch(()=>{}); }
}

// DESIGN SYSTEM V2  MODERNE
const DS = {
  blue:"#0891b2", blueSoft:"#e8f4f8", blueGrad:"linear-gradient(135deg,#06b6d4,#0891b2)",
  dark:"#0f172a", mid:"#64748b",
  light:"#eef6f9", bg:"#e8f4f8", border:"#d0e8f0", white:"#f4f9fb",
  green:"#059669", greenSoft:"#d1fae5", greenGrad:"linear-gradient(135deg,#059669,#34d399)",
  red:"#be123c", redSoft:"#fff1f2",
  orange:"#f59e0b", orangeSoft:"#fffbeb",
  yellow:"#d97706", yellowSoft:"#fef9c3",
  purple:"#4f46e5", purpleSoft:"#eef2ff", purpleGrad:"linear-gradient(135deg,#4f46e5,#818cf8)",
  teal:"#0e7490", tealSoft:"#cffafe",
  radius: 16, radiusSm: 12, radiusLg: 22,
  shadow: "4px 4px 8px rgba(166,210,220,0.6), -3px -3px 7px rgba(255,255,255,0.9)",
  shadowMd: "6px 6px 12px rgba(166,210,220,0.7), -4px -4px 10px rgba(255,255,255,0.9)",
  shadowLg: "8px 8px 16px rgba(166,210,220,0.7), -5px -5px 12px rgba(255,255,255,0.9)",
  shadowIn: "inset 3px 3px 6px rgba(166,210,220,0.5), inset -2px -2px 5px rgba(255,255,255,0.8)",
  nmShadow: "4px 4px 8px rgba(166,210,220,0.6), -3px -3px 7px rgba(255,255,255,0.9)",
  nmShadowSm: "3px 3px 6px rgba(166,210,220,0.5), -2px -2px 5px rgba(255,255,255,0.85)",
  font: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};

const AC = {
  rouge:  { bg:DS.redSoft,    bd:"#fda4af", tx:DS.red,    lbl:"URGENT"   },
  jaune:  { bg:DS.yellowSoft, bd:"#fcd34d", tx:DS.yellow, lbl:"Attention" },
  orange: { bg:DS.orangeSoft, bd:"#fcd34d", tx:DS.orange, lbl:"Retard"   },
  aFaire: { bg:"#eff6ff",     bd:"#93c5fd", tx:"#2563eb", lbl:"À faire"  },
  ok:     { bg:DS.greenSoft,  bd:"#86efac", tx:DS.green,  lbl:"OK"       },
};

const RAPPORT_STATUS = {
  saisie: { label:"En cours de saisie", color:DS.mid, bg:"#f3f4f6" },
  cree:   { label:"Créé", color:DS.blue, bg:DS.blueSoft },
  envoye: { label:"Envoyé", color:DS.green, bg:DS.greenSoft },
};

function normalizeRapportStatus(status) {
  return RAPPORT_STATUS[status] ? status : "saisie";
}

function getRapportStatus(p) {
  if (p?.rapportStatut) return normalizeRapportStatus(p.rapportStatut);
  if (p?.rapportEnvoyeAt) return "envoye";
  if (p?.ok) return "cree";
  return "saisie";
}

// STYLES GLOBAUX INJECTS
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
    body { font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #eef2f7; overflow-x: hidden; -webkit-font-smoothing: antialiased; -webkit-overflow-scrolling: touch; }
    input, select, textarea, button { font-family: inherit; -webkit-appearance: none; }
    button { cursor: pointer; touch-action: manipulation; }
    a { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
    input, select, textarea { background: #f4f9fb !important; color: #0f172a !important; -webkit-text-fill-color: #0f172a !important; color-scheme: light; border-color: #d0e8f0 !important; }
    input::placeholder, textarea::placeholder { color: #94a3b8 !important; -webkit-text-fill-color: #94a3b8 !important; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: ${DS.blue} !important; box-shadow: 0 0 0 3px ${DS.blue}22 !important; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #e8f4f8; border-radius: 99px; }
    ::-webkit-scrollbar-thumb { background: #b8d8e4; border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: #8ec5d4; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeInFast { from { opacity:0; } to { opacity:1; } }
    @keyframes slideUp { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
    @keyframes scaleIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.6; } }
    @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
    @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
    .fade-in { animation: fadeIn .35s cubic-bezier(.22,1,.36,1) both; }
    /* Safari GPU acceleration */
    .nm-card, .btn-hover, .card-hover { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
    /* Safari: fix buttons inside sticky header */
    header, [data-safari-header] { -webkit-transform: translateZ(0); transform: translateZ(0); isolation: isolate; }
    .slide-up { animation: slideUp .38s cubic-bezier(.22,1,.36,1) both; }
    .scale-in { animation: scaleIn .28s cubic-bezier(.22,1,.36,1) both; }
    /* Soft UI buttons */
    .btn-hover { transition: all .18s cubic-bezier(.22,1,.36,1); -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
    @media (hover: hover) { .btn-hover:hover { transform: translateY(-1px); box-shadow: 6px 6px 12px rgba(166,210,220,0.7), -4px -4px 10px rgba(255,255,255,0.95) !important; } }
    .btn-hover:active { transform: scale(0.97); box-shadow: inset 3px 3px 6px rgba(166,210,220,0.5), inset -2px -2px 5px rgba(255,255,255,0.8) !important; }
    /* Soft UI cards */
    .card-hover { transition: all .2s cubic-bezier(.22,1,.36,1); -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
    @media (hover: hover) { .card-hover:hover { transform: translateY(-2px); box-shadow: 6px 6px 14px rgba(166,210,220,0.65), -4px -4px 10px rgba(255,255,255,0.95) !important; } }
    .card-hover:active { transform: translateY(0); }
    /* Soft UI card base */
    .nm-card {
      background: #e8f4f8;
      border-radius: 18px;
      box-shadow: 4px 4px 8px rgba(166,210,220,0.6), -3px -3px 7px rgba(255,255,255,0.9);
      border: none;
    }
    .nm-inset {
      background: #e8f4f8;
      box-shadow: inset 3px 3px 6px rgba(166,210,220,0.5), inset -2px -2px 5px rgba(255,255,255,0.8);
      border-radius: 12px;
      border: none;
    }
    /* Desktop sidebar */
    @media (min-width: 768px) {
      .sidebar-nav-active { background: rgba(8,145,178,0.12) !important; box-shadow: inset 3px 3px 6px rgba(166,210,220,0.4), inset -2px -2px 5px rgba(255,255,255,0.7) !important; }
    }
    .page-content { animation: fadeInFast .25s ease both; }
  `}</style>
);


// ═══════════════════════════════════════════
// SYSTÈME TOAST + CONFIRM (remplace alert/confirm)
// ═══════════════════════════════════════════
const toastListeners = [];
function subscribeToast(fn) { toastListeners.push(fn); return ()=>{ const i=toastListeners.indexOf(fn); if(i>=0) toastListeners.splice(i,1); }; }
function showToast(msg, type="info") { toastListeners.forEach(fn=>fn({msg, type, id:Date.now()+Math.random()})); }
function toastSuccess(msg) { showToast(msg,"success"); }
function toastError(msg)   { showToast(msg,"error"); }
function toastInfo(msg)    { showToast(msg,"info"); }
function toastWarn(msg)    { showToast(msg,"warn"); }

const confirmListeners = [];
function subscribeConfirm(fn) { confirmListeners.push(fn); return ()=>{ const i=confirmListeners.indexOf(fn); if(i>=0) confirmListeners.splice(i,1); }; }
function showConfirm(msg, onOk, onCancel) { confirmListeners.forEach(fn=>fn({msg, onOk, onCancel, id:Date.now()+Math.random()})); }

function ToastContainer() {
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

function ConfirmModal() {
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
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:99998,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>handle(false)}>
      <div className="scale-in" onClick={e=>e.stopPropagation()} style={{background:"#eef2f7",borderRadius:22,padding:"28px 24px",maxWidth:360,width:"100%",boxShadow:"8px 8px 24px rgba(166,210,220,0.7), -5px -5px 16px rgba(255,255,255,0.9)",fontFamily:"Inter,sans-serif"}}>
        <div style={{fontSize:36,textAlign:"center",marginBottom:12}}>🗑️</div>
        <div style={{fontSize:15,fontWeight:700,color:"#0c1222",textAlign:"center",marginBottom:8,lineHeight:1.4}}>{item.msg}</div>
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={()=>handle(false)} style={{flex:1,padding:"12px",borderRadius:14,background:"#eef2f7",border:"none",cursor:"pointer",fontWeight:700,fontSize:14,color:"#64748b",fontFamily:"inherit",boxShadow:"4px 4px 8px rgba(166,210,220,0.6), -3px -3px 7px rgba(255,255,255,0.9)"}}>Annuler</button>
          <button onClick={()=>handle(true)} style={{flex:1,padding:"12px",borderRadius:14,background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"none",cursor:"pointer",fontWeight:700,fontSize:14,color:"#fff",fontFamily:"inherit",boxShadow:"4px 4px 12px rgba(220,38,38,0.35)"}}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

// COMPOSANTS DE BASE
function Avatar({ nom, size=40, photo }) {
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

function IcoBubble({ ico, color=DS.blue, bg, size=38 }) {
  const bgCol = bg || color+"15";
  return (
    <div style={{width:size,height:size,borderRadius:size*0.3,background:bgCol,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      {ico}
    </div>
  );
}

function Tag({ children, color=DS.blue, bg, style={} }) {
  const bgCol = bg || color+"14";
  return (
    <span style={{background:bgCol,color,borderRadius:20,padding:"3px 10px",fontSize:15,fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4,letterSpacing:-0.2,...style}}>{children}</span>
  );
}

function Modal({ title, onClose, children, wide }) {
  const isMobile = useIsMobile();
  useEffect(()=>{
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return ()=>{ document.body.style.overflow = prev; };
  },[]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.35)",zIndex:200,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?"0":"12px"}}>
      <div className={isMobile?"slide-up":"scale-in"}
        style={{background:"#eef2f7",borderRadius:isMobile?"28px 28px 0 0":DS.radiusLg,
          width:"100%",maxWidth:isMobile?"100%":wide?720:560,
          maxHeight:isMobile?"92dvh":"88vh",
          display:"flex",flexDirection:"column",
          boxShadow:"8px 8px 24px rgba(166,210,220,0.7), -5px -5px 16px rgba(255,255,255,0.9)",
          overflowY:"hidden",
          paddingBottom:"env(safe-area-inset-bottom,0px)"}}
        onClick={e=>e.stopPropagation()}>
        {isMobile && <div style={{flexShrink:0,display:"flex",justifyContent:"center",paddingTop:10,paddingBottom:2}}>
          <div style={{width:36,height:4,borderRadius:2,background:"#c8dce8"}}/>
        </div>}
        <div style={{flexShrink:0,padding:isMobile?"8px 18px 12px":"14px 24px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid "+DS.border}}>
          <span style={{color:DS.dark,fontWeight:700,fontSize:16}}>{title}</span>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:10,background:"#eef2f7",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:DS.nmShadowSm}}>
            {Ico.close(13,DS.mid)}
          </button>
        </div>
        <div data-modal-body="1" style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",overflowScrolling:"touch",padding:isMobile?"14px 18px 24px":"20px 24px 24px",WebkitTransform:"translateZ(0)"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, style={} }) {
  return (
    <div style={{marginBottom:22,...style}}>
      {title && <div style={{fontSize:15,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>{title}</div>}
      {children}
    </div>
  );
}

function ProgressBar({ value, max, color=DS.blue, height=6 }) {
  const pct = max > 0 ? Math.min(100, value/max*100) : 0;
  return (
    <div style={{height,background:"#dde8f0",borderRadius:99,overflow:"hidden",boxShadow:"inset 2px 2px 4px rgba(166,210,220,0.5)"}}>
      <div style={{height:"100%",width:`${pct}%`,background:pct>=100?DS.greenGrad:DS.blueGrad,borderRadius:99,transition:"width .5s cubic-bezier(.22,1,.36,1)"}}/>
    </div>
  );
}

function Card({ children, style={}, onClick, className="", id }) {
  return (
    <div id={id} onClick={onClick} className={onClick?"card-hover":className} style={{background:"#eef2f7",borderRadius:18,padding:"16px 18px",boxShadow:"5px 5px 12px rgba(166,210,220,0.6), -4px -4px 9px rgba(255,255,255,0.9)",border:"none",cursor:onClick?"pointer":"default",transition:"all .2s",...style}}>{children}</div>
  );
}

function Input({ label, ...p }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label && <span style={{fontSize:13,fontWeight:600,color:DS.mid,textTransform:"uppercase",letterSpacing:.7}}>{label}</span>}
      <input style={{padding:"11px 14px",borderRadius:DS.radiusSm,border:"none",fontSize:15,outline:"none",background:"#eef2f7",boxSizing:"border-box",width:"100%",color:DS.dark,fontFamily:"inherit",transition:"all .2s",boxShadow:"inset 3px 3px 6px rgba(166,210,220,0.45), inset -2px -2px 5px rgba(255,255,255,0.8)",...(p.style||{})}} {...p}/>
    </div>
  );
}

function Select({ label, options, ...p }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label && <span style={{fontSize:13,fontWeight:600,color:DS.mid,textTransform:"uppercase",letterSpacing:.7}}>{label}</span>}
      <select style={{padding:"11px 14px",borderRadius:DS.radiusSm,border:"none",fontSize:15,outline:"none",background:"#eef2f7",color:DS.dark,fontFamily:"inherit",cursor:"pointer",appearance:"none",boxShadow:"inset 3px 3px 6px rgba(166,210,220,0.45), inset -2px -2px 5px rgba(255,255,255,0.8)",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",paddingRight:36}} {...p}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// PHOTO PICKER
function PhotoPicker({ label, value, onChange, compact }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
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
          <img src={value} alt="photo" style={{width:"100%",maxHeight:compact?120:220,objectFit:"cover",display:"block"}}/>
          <button onClick={() => onChange("")} style={{position:"absolute",top:8,right:8,width:32,height:32,borderRadius:16,background:"rgba(0,0,0,0.6)",border:"2px solid rgba(255,255,255,0.4)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>{Ico.close(14,"#fff")}</button>
          <button onClick={() => cameraRef.current?.click()} style={{position:"absolute",bottom:8,right:8,padding:"6px 12px",borderRadius:10,background:"rgba(0,0,0,0.55)",border:"1px solid rgba(255,255,255,0.3)",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:15,fontWeight:600,color:"#fff",fontFamily:"inherit"}}>{Ico.camera(13,"#fff")} Reprendre</button>
        </div>
      ) : (
        <div style={{display:"flex",gap:10}}>
          <button onClick={() => cameraRef.current?.click()} className="btn-hover" style={{flex:1,padding:"16px 10px",borderRadius:DS.radius,border:"none",background:"#eef2f7",boxShadow:DS.nmShadow,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,fontFamily:"inherit"}}>
            {Ico.camera(24,DS.blue)}
            <span style={{fontSize:15,fontWeight:700,color:DS.blue}}>Caméra</span>
            <span style={{fontSize:15,color:DS.mid}}>Photo directe</span>
          </button>
          <button onClick={() => galleryRef.current?.click()} className="btn-hover" style={{flex:1,padding:"16px 10px",borderRadius:DS.radius,border:"none",background:"#eef2f7",boxShadow:DS.nmShadow,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,fontFamily:"inherit"}}>
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

// BOUTON PRIMAIRE
function BtnPrimary({ children, onClick, bg=DS.blueGrad, color="#fff", icon, style={} }) {
  return (
    <button onClick={onClick} className="btn-hover" style={{padding:"12px 20px",borderRadius:DS.radiusSm,background:bg,border:"none",cursor:"pointer",fontWeight:700,fontSize:15,color,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"4px 4px 12px rgba(8,145,178,0.3), -2px -2px 6px rgba(255,255,255,0.7)",transition:"all .2s",...style}}>
      {icon}{children}
    </button>
  );
}

function RapportStatusPicker({ value, onChange, compact=false }) {
  const current = normalizeRapportStatus(value);
  const meta = RAPPORT_STATUS[current];
  return (
    <select
      value={current}
      onChange={e=>onChange?.(e.target.value)}
      style={{
        padding:compact?"7px 10px":"11px 14px",
        borderRadius:compact?10:DS.radiusSm,
        border:"1.5px solid "+meta.color+"33",
        background:meta.bg,
        color:meta.color,
        fontSize:compact?12:14,
        fontWeight:800,
        fontFamily:"inherit",
        cursor:"pointer",
        outline:"none",
        appearance:"none",
        minWidth:compact?138:"100%",
      }}
    >
      {Object.entries(RAPPORT_STATUS).map(([k,s])=>(
        <option key={k} value={k}>{s.label}</option>
      ))}
    </select>
  );
}

// FORMULAIRE CLIENT (avec Entretien/Contrle par saison + PVC arm)
function FormClient({ initial, clients, onSave, onClose }) {
  const isNew = !initial?.id;
  const isMobile = useIsMobile();
  const [f, setF] = useState(() => {
    if (initial) {
      return { ...initial, moisParMois: migrateMois(initial.moisParMois||initial.saisons), photoPiscine: initial.photoPiscine||"", prixPassageE: initial.prixPassageE||0, prixPassageC: initial.prixPassageC||0, notesTarifaires: initial.notesTarifaires||"" };
    }
    return {
      id: `C${String(clients.length+1).padStart(3,"0")}`,
      nom:"", tel:"", email:"", adresse:"", bassin:"Liner", volume:30,
      formule:"VAC", prix:0, prixPassageE:0, prixPassageC:0, dateDebut:TODAY, photoPiscine:"", notesTarifaires:"",
      dateFin: `${new Date().getFullYear()+1}-03-31`,
      moisParMois: {...MOIS_PAR_MOIS_DEF},
    };
  });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const setMoisVal = (m,type,v) => setF(p=>({...p,moisParMois:{...p.moisParMois,[m]:{...p.moisParMois[m],[type]:Math.max(0,v)}}}));
  const totalE = totalAnnuel(f.moisParMois,"entretien");
  const totalC = totalAnnuel(f.moisParMois,"controle");
  const total = totalE + totalC;

  return (
    <Modal title={isNew ? "Nouveau client" : `Modifier — ${f.nom}`} onClose={onClose} wide>
      <Section title="Informations">
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
          <div style={{gridColumn:"1/-1"}}><Input label="Nom complet *" value={f.nom} onChange={e=>set("nom",e.target.value)} placeholder="Dupont Marie"/></div>
          <Input label="Téléphone" value={f.tel} onChange={e=>set("tel",e.target.value)}/>
          <Input label="Email" type="email" value={f.email} onChange={e=>set("email",e.target.value)}/>
          <div style={{gridColumn:"1/-1"}}><Input label="Adresse" value={f.adresse} onChange={e=>set("adresse",e.target.value)}/></div>
          <Select label="Type bassin" value={f.bassin} onChange={e=>set("bassin",e.target.value)} options={["Liner","Béton","Coque polyester","PVC armé","Hors-sol","Autre"]}/>
          <Input label="Volume (m³)" type="number" style={{fontSize:16}} value={f.volume} onChange={e=>set("volume",+e.target.value)}/>
        </div>
      </Section>
      <Section title="Photo de la piscine">
        <PhotoPicker value={f.photoPiscine||""} onChange={v=>set("photoPiscine",v)} compact/>
      </Section>
      <Section title="Contrat">
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr",gap:8}}>
          <Select label="Formule" value={f.formule} onChange={e=>set("formule",e.target.value)} options={["VAC","VAC+","Confort","Confort+"]}/>
          <div/>
          {!isMobile&&<div/>}
          <Input label="Date début" type="date" value={f.dateDebut} onChange={e=>set("dateDebut",e.target.value)}/>
          <Input label="Date fin" type="date" value={f.dateFin} onChange={e=>set("dateFin",e.target.value)}/>
        </div>
      </Section>
      <Section title="Passages par mois">
        <div style={{background:DS.dark,padding:"8px 14px",borderRadius:"12px 12px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:"rgba(255,255,255,0.8)",fontSize:15,fontWeight:700}}>Planning mensuel</span>
          <span style={{color:"#fff",fontSize:15,fontWeight:800}}>🔧 {totalE}  ·  💧 {totalC}  ·  Total {totalE+totalC}</span>
        </div>
        <div style={{padding:"6px 10px",background:"#f8fafc",borderLeft:"1px solid "+DS.border,borderRight:"1px solid "+DS.border,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={()=>setF(p=>({...p,moisParMois:Object.fromEntries([1,2,3,4,5,6,7,8,9,10,11,12].map(m=>[m,{entretien:0,controle:0}]))}))}
            style={{fontSize:12,fontWeight:700,color:DS.red,background:DS.redSoft,border:"1px solid #fca5a5",borderRadius:6,padding:"4px 12px",cursor:"pointer",fontFamily:"inherit"}}>
            🔄 Tout remettre à zéro
          </button>
        </div>
        <div style={{border:"1px solid "+DS.border,borderTop:"none",borderRadius:"0 0 12px 12px",overflow:"hidden"}}>
          {[...Array(12)].map((_,i)=>{
            const m=i+1; const mv=getMoisVal(f.moisParMois,m); const sc=SAISONS_META[getSaison(m)];
            return (
              <div key={m} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderBottom:i<11?"1px solid "+DS.border:"none",background:i%2===0?DS.white:DS.light}}>
                <div style={{width:36,display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:4,height:24,borderRadius:2,background:sc.color}}/>
                  <span style={{fontSize:15,fontWeight:700,color:sc.color}}>{MOIS[m]}</span>
                </div>
                <div style={{flex:1,display:"flex",alignItems:"center",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:15,color:DS.blue}}>🔧</span>
                    <button onClick={()=>setMoisVal(m,"entretien",mv.entretien-1)} style={{width:24,height:24,borderRadius:6,border:"none",background:"#eef2f7",boxShadow:DS.nmShadowSm,cursor:"pointer",fontSize:15,fontWeight:700,color:DS.mid,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                    <span style={{fontSize:16,fontWeight:900,color:DS.blue,minWidth:16,textAlign:"center"}}>{mv.entretien}</span>
                    <button onClick={()=>setMoisVal(m,"entretien",mv.entretien+1)} style={{width:24,height:24,borderRadius:6,border:"1px solid "+DS.blue,background:DS.blueSoft,cursor:"pointer",fontSize:15,fontWeight:700,color:DS.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:15,color:DS.teal}}>💧</span>
                    <button onClick={()=>setMoisVal(m,"controle",mv.controle-1)} style={{width:24,height:24,borderRadius:6,border:"none",background:"#eef2f7",boxShadow:DS.nmShadowSm,cursor:"pointer",fontSize:15,fontWeight:700,color:DS.mid,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                    <span style={{fontSize:16,fontWeight:900,color:DS.teal,minWidth:16,textAlign:"center"}}>{mv.controle}</span>
                    <button onClick={()=>setMoisVal(m,"controle",mv.controle+1)} style={{width:24,height:24,borderRadius:6,border:"1px solid "+DS.teal,background:DS.tealSoft,cursor:"pointer",fontSize:15,fontWeight:700,color:DS.teal,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                  </div>
                </div>
                <div style={{fontSize:15,fontWeight:700,color:mv.entretien+mv.controle>0?DS.dark:DS.border,minWidth:20,textAlign:"right"}}>{mv.entretien+mv.controle>0?mv.entretien+mv.controle:"—"}</div>
              </div>
            );
          })}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginTop:12}}>
          <Input label="Prix/passage entretien (€)" type="number" style={{fontSize:16}} value={f.prixPassageE||""} onChange={e=>set("prixPassageE",+e.target.value||0)}/>
          <Input label="Prix/passage contrôle (€)" type="number" style={{fontSize:16}} value={f.prixPassageC||""} onChange={e=>set("prixPassageC",+e.target.value||0)}/>
        </div>
        {/* Récap tarification auto */}
        <div style={{marginTop:12,background:"#0891b2",borderRadius:DS.radiusSm,padding:"14px 16px",color:"#fff"}}>
          <div style={{fontSize:15,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:"rgba(255,255,255,0.5)",marginBottom:10}}>Tarification</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:15,color:"rgba(255,255,255,0.7)"}}>🔧 {totalE} entretiens × {f.prixPassageE||0}€</span>
              <span style={{fontSize:15,fontWeight:800}}>{totalE*(f.prixPassageE||0)} €</span>
            </div>
            {totalC>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:15,color:"rgba(255,255,255,0.7)"}}>💧 {totalC} contrôles × {f.prixPassageC||0}€</span>
              <span style={{fontSize:15,fontWeight:800}}>{totalC*(f.prixPassageC||0)} €</span>
            </div>}
            <div style={{borderTop:"1px solid rgba(255,255,255,0.15)",paddingTop:8,marginTop:4}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)"}}>Prix annuel</span>
                <span style={{fontSize:20,fontWeight:900,color:"#22d3ee"}}>{(totalE*(f.prixPassageE||0)+totalC*(f.prixPassageC||0)).toLocaleString("fr")} €</span>
              </div>
              {(()=>{
                const prix = totalE*(f.prixPassageE||0)+totalC*(f.prixPassageC||0);
                if (!prix) return null;
                const {m1,m11,estRond} = calcMensualites(prix);
                return estRond
                  ? <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",textAlign:"right"}}>12 × {m11} €/mois</div>
                  : <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",textAlign:"right"}}>
                      1er mois : <span style={{color:"#fcd34d",fontWeight:700}}>{m1} €</span> · puis 11 × {m11} €
                    </div>;
              })()}
            </div>
          </div>
        </div>
      </Section>
      <Section title="📝 Notes tarifaires (optionnel)">
        <div style={{fontSize:12,color:DS.mid,marginBottom:8,lineHeight:1.5}}>
          Ces notes apparaîtront dans le contrat — ex: produits inclus, remise accordée, condition spéciale…
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {(f.notesTarifaires||"").split("\n").filter((_,i,a)=>i<a.length).map((line,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{color:DS.blue,fontWeight:700,flexShrink:0}}>•</span>
              <input
                value={line}
                placeholder={i===0?"Ex: Produits de traitement inclus dans le forfait":"Ajouter une note…"}
                onChange={e=>{
                  const lines=(f.notesTarifaires||"").split("\n");
                  lines[i]=e.target.value;
                  set("notesTarifaires",lines.join("\n"));
                }}
                style={{flex:1,padding:"9px 12px",borderRadius:8,border:"1.5px solid "+DS.border,fontSize:13,outline:"none",color:DS.dark,fontFamily:"inherit"}}
              />
              {(f.notesTarifaires||"").split("\n").length>1&&(
                <button onClick={()=>{
                  const lines=(f.notesTarifaires||"").split("\n");
                  lines.splice(i,1);
                  set("notesTarifaires",lines.join("\n"));
                }} style={{width:26,height:26,borderRadius:6,background:"#fff1f2",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {Ico.close(10,DS.red)}
                </button>
              )}
            </div>
          ))}
          <button onClick={()=>set("notesTarifaires",(f.notesTarifaires?f.notesTarifaires+"\n":""))}
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderRadius:8,background:DS.blueSoft,border:"1px solid "+DS.blue+"33",cursor:"pointer",fontSize:12,fontWeight:700,color:DS.blue,fontFamily:"inherit",alignSelf:"flex-start"}}>
            {Ico.plus(11,DS.blue)} Ajouter une note
          </button>
        </div>
      </Section>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} className="btn-hover" style={{flex:1,padding:"12px",borderRadius:DS.radiusSm,background:DS.light,border:"none",cursor:"pointer",fontWeight:700,fontSize:15,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{Ico.close(13,DS.mid)} Annuler</button>
        <BtnPrimary onClick={()=>{ if(!f.nom.trim()){ toastWarn("Nom du client requis"); return; } const prixCalc=totalE*(f.prixPassageE||0)+totalC*(f.prixPassageC||0); onSave({...f, prix:prixCalc}); }} icon={Ico.save(15,"#fff")} style={{flex:2}}>Enregistrer</BtnPrimary>
      </div>
    </Modal>
  );
}

// FORMULAIRE LIVRAISON
function genererHTMLLivraison(livraison, client) {
  const dateStr = new Date(livraison.date).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"});
  const produitsList = (livraison.produits||[]).length > 0
    ? (livraison.produits||[]).map(p=>`<li style="padding:4px 0;border-bottom:1px solid #f0f4f8;font-size:13px;color:#1e293b;">${p}</li>`).join("")
    : "<li style='color:#94a3b8;font-size:13px;'>Aucun produit listé</li>";
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Bon de livraison BRIBLUE</title>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#1e293b;}
  .wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(14,165,233,.1);overflow:hidden;}
  .header{background:linear-gradient(135deg,#0ea5e9,#0369a1);padding:28px 32px;color:#fff;}
  .header h1{margin:0 0 4px;font-size:22px;font-weight:900;}
  .header p{margin:0;opacity:.85;font-size:13px;}
  .body{padding:28px 32px;}
  .section{margin-bottom:22px;}
  .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#64748b;margin-bottom:10px;}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .info-box{background:#f8fafc;border-radius:10px;padding:12px 14px;border:1px solid #e2e8f0;}
  .info-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;}
  .info-value{font-size:13px;font-weight:700;color:#1e293b;}
  ul{margin:0;padding:0 0 0 0;list-style:none;}
  .montant{font-size:22px;font-weight:900;color:#0369a1;margin-top:4px;}
  .footer{background:#f0f9ff;padding:16px 32px;border-top:1px solid #e0f2fe;font-size:11px;color:#64748b;text-align:center;}
  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;}
</style></head><body><div class="wrapper">
<div class="header">
  <h1>📦 Bon de livraison</h1>
  <p>BRIBLUE — Entretien & Traitement de piscines</p>
</div>
<div class="body">
  <div class="section">
    <div class="section-title">Informations</div>
    <div class="info-grid">
      <div class="info-box"><div class="info-label">Client</div><div class="info-value">${client?.nom||"—"}</div></div>
      <div class="info-box"><div class="info-label">Date</div><div class="info-value">${dateStr}</div></div>
      ${client?.adresse?`<div class="info-box" style="grid-column:1/-1"><div class="info-label">Adresse</div><div class="info-value">${client.adresse}</div></div>`:""}
    </div>
  </div>
  <div class="section">
    <div class="section-title">Produits livrés</div>
    <ul>${produitsList}</ul>
    ${livraison.description?`<div style="margin-top:10px;background:#f8fafc;border-radius:10px;padding:12px 14px;border:1px solid #e2e8f0;font-size:13px;color:#475569;">${livraison.description}</div>`:""}
  </div>
  ${livraison.montant?`<div class="section"><div class="section-title">Montant</div><div class="montant">${Number(livraison.montant).toLocaleString("fr")} €</div></div>`:""}
</div>
<div class="footer">Document généré le ${new Date().toLocaleDateString("fr")} · <strong>BRIBLUE</strong> · 06 67 18 61 15</div>
</div></body></html>`;
}

async function envoyerEmailLivraison(livraison, client) {
  const RESEND_API_KEY = "re_FLTMeUdh_vL8QGqJhP2C293WEVCm9c7rh";
  const FROM = "rapport-piscine@briblue83.com";

  if (!client?.email) { toastWarn("Aucun email renseigné pour ce client."); return; }

  const dateStr = new Date(livraison.date).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"});
  const filename = `BonLivraison_BRIBLUE_${client?.nom?.replace(/\s/g,"_")||"client"}_${livraison.date}.html`;
  const html = genererHTMLLivraison(livraison, client);
  const b64 = btoa(unescape(encodeURIComponent(html)));

  const produits = (livraison.produits||[]).length > 0 ? (livraison.produits||[]).join(", ") : "voir document joint";
  const corps = `Bonjour ${client?.nom||""},\n\nVotre bon de livraison du ${dateStr} est disponible.\n\nJe reste a votre disposition pour toute question.\n\nCordialement,\nDorian Briaire\nTechnicien de Piscine - BRI BLUE`;

  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `BRIBLUE <${FROM}>`,
        to: [client.email],
        subject: `Bon de livraison BRIBLUE — ${dateStr}`,
        text: corps,
        attachments: [{ filename, content: b64 }],
      }),
    });

    const data = await res.json();

    if (res.ok) {
      toastSuccess(`Email envoyé à ${client.email} !`);
    } else {
      console.error("Resend error:", data);
      toastError(`Erreur envoi : ${data?.message || JSON.stringify(data)}`);
    }
  } catch(err) {
    toastError(`Erreur réseau : ${err.message}`);
  }
}

function FormLivraison({ initial, clientId, clients=[], produitsStock=[], onSave, onClose }) {
  const isEdit = !!initial?.id;
  const isMobile = useIsMobile();
  const [f, setF] = useState(()=>initial || { id:uid(), clientId:clientId||"", date:TODAY, produits:[], description:"", montant:"", statut:"aFacturer", photos:[] });
  const [step, setStep] = useState(1);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const PLIV = produitsStock.length > 0 ? produitsStock : PRODUITS_DEFAUT;
  const toggleProduit = (p) => { const arr = f.produits.includes(p) ? f.produits.filter(x=>x!==p) : [...f.produits,p]; set("produits",arr); };
  const selectedClient = clients.find(c=>c.id===f.clientId);

  const addPhotos = (e) => {
    const files = Array.from(e.target.files||[]).slice(0, 10-(f.photos||[]).length);
    if(!files.length) return;
    let loaded = 0;
    const newPhotos = [...(f.photos||[])];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        newPhotos.push(reader.result);
        loaded++;
        if (loaded === files.length) set("photos", newPhotos.slice(0,10));
      };
      reader.readAsDataURL(file);
    });
    e.target.value="";
  };

  const STEP_INFO = [
    { l:"Client & Date",   color:"#0891b2" },
    { l:"Produits",        color:"#059669" },
    { l:"Photos & Envoi",  color:"#4f46e5" },
  ];
  const STEPS = STEP_INFO.length;
  const cur = STEP_INFO[step-1];
  const pct = Math.round((step-1)/STEPS*100);

  return (
    <Modal title={isEdit?"Modifier la livraison":"📦 Nouvelle livraison"} onClose={onClose} wide>
      {/* Stepper */}
      <div style={{marginBottom:14}}>
        <div style={{height:4,background:DS.light,borderRadius:99,marginBottom:10,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,#0891b2,${cur.color})`,borderRadius:99,transition:"width .4s"}}/>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:10}}>
          {STEP_INFO.map((s,i)=>{
            const done=i+1<step, active=i+1===step;
            return (
              <button key={i} onClick={()=>setStep(i+1)}
                style={{flex:1,padding:"8px 4px",borderRadius:10,border:"1.5px solid "+(active?s.color:done?"#059669":DS.border),
                  background:active?s.color+"12":done?"#f0fdf4":DS.white,
                  cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:700,
                  color:active?s.color:done?"#059669":DS.mid,transition:"all .2s"}}>
                {done?"✓ ":""}{s.l}
              </button>
            );
          })}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,background:cur.color+"0d",border:"1px solid "+cur.color+"22"}}>
          <span style={{width:6,height:6,borderRadius:3,background:cur.color,flexShrink:0,display:"block"}}/>
          <span style={{fontSize:13,fontWeight:700,color:cur.color}}>{cur.l}</span>
          <span style={{fontSize:11,color:DS.mid,marginLeft:"auto"}}>Étape {step}/{STEPS}</span>
        </div>
      </div>

      {/* ÉTAPE 1 — Client & Date */}
      {step===1 && (
        <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:12}}>
          {clients.length>1 && (
            <div>
              <span style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:8}}>Client *</span>
              {isMobile
                ? <select value={f.clientId} onChange={e=>set("clientId",e.target.value)}
                    style={{width:"100%",padding:"12px",borderRadius:DS.radiusSm,border:"none",background:"#eef2f7",boxShadow:DS.nmShadowSm,fontSize:14,color:DS.dark,fontFamily:"inherit"}}>
                    <option value="">Choisir…</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                : <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:160,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
                    {clients.map(c=>{
                      const sel=f.clientId===c.id;
                      return (
                        <button key={c.id} onClick={()=>set("clientId",c.id)}
                          style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,
                            border:"1.5px solid "+(sel?"#0891b2":DS.border),background:sel?"#f0f9ff":DS.white,
                            cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
                          <Avatar nom={c.nom} size={32}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:700,fontSize:13,color:DS.dark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</div>
                            <div style={{fontSize:11,color:DS.mid}}>{c.formule}</div>
                          </div>
                          {sel&&<div style={{width:20,height:20,borderRadius:10,background:"#0891b2",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.check(10,"#fff")}</div>}
                        </button>
                      );
                    })}
                  </div>
              }
            </div>
          )}
          {selectedClient && (
            <div style={{background:"#f0f9ff",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,border:"1px solid #bae6fd"}}>
              <Avatar nom={selectedClient.nom} size={36}/>
              <div><div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{selectedClient.nom}</div><div style={{fontSize:11,color:DS.mid}}>{selectedClient.formule}</div></div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
            <div>
              <span style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Date *</span>
              <input type="date" value={f.date} onChange={e=>set("date",e.target.value)}
                style={{width:"100%",padding:"11px 12px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:14,outline:"none",boxSizing:"border-box",color:DS.dark,fontFamily:"inherit"}}/>
            </div>
            <div>
              <span style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Montant €</span>
              <input type="number" value={f.montant} onChange={e=>set("montant",e.target.value)} placeholder="0.00"
                style={{width:"100%",padding:"11px 12px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:14,outline:"none",boxSizing:"border-box",color:DS.dark,fontFamily:"inherit"}}/>
            </div>
          </div>
          <div>
            <span style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:8}}>Statut</span>
            <div style={{display:"flex",gap:6}}>
              {Object.entries(STATUT_LIV).map(([k,s])=>(
                <button key={k} onClick={()=>set("statut",k)}
                  style={{flex:1,padding:"9px 4px",borderRadius:10,border:"1.5px solid "+(f.statut===k?s.color:DS.border),
                    background:f.statut===k?s.bg:DS.white,cursor:"pointer",fontSize:12,fontWeight:700,
                    color:f.statut===k?s.color:DS.mid,fontFamily:"inherit",transition:"all .15s"}}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 2 — Produits */}
      {step===2 && (
        <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:13,color:DS.mid,fontWeight:600}}>{f.produits.length} sélectionné{f.produits.length!==1?"s":""}</span>
            {f.produits.length>0&&<button onClick={()=>set("produits",[])} style={{fontSize:12,color:DS.red,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Effacer</button>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:5}}>
            {PLIV.map(p=>{
              const sel=f.produits.includes(p);
              return (
                <button key={p} onClick={()=>toggleProduit(p)}
                  style={{display:"flex",alignItems:"center",gap:7,padding:"9px 10px",borderRadius:10,cursor:"pointer",
                    background:sel?"#f0fdf4":DS.white,border:"1.5px solid "+(sel?"#059669":DS.border),
                    fontFamily:"inherit",textAlign:"left",transition:"all .15s"}}>
                  <div style={{width:16,height:16,borderRadius:4,border:"2px solid "+(sel?"#059669":DS.border),background:sel?"#059669":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {sel&&<svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{fontSize:12,fontWeight:sel?700:400,color:sel?"#065f46":DS.mid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p}</span>
                </button>
              );
            })}
          </div>
          <div>
            <span style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Notes / Quantités</span>
            <textarea value={f.description} onChange={e=>set("description",e.target.value)}
              placeholder="Ex : 2 sacs chlore lent, 1 bidon pH+..."
              style={{width:"100%",padding:"10px 12px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:60,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark,outline:"none"}}/>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 — Photos & Envoi */}
      {step===3 && (
        <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.7}}>Photos {(f.photos||[]).length>0&&`(${(f.photos||[]).length}/10)`}</span>
              {(f.photos||[]).length<10&&(
                <label style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:8,background:"#f0f9ff",border:"1px solid #bae6fd",cursor:"pointer",fontSize:12,fontWeight:700,color:"#0891b2"}}>
                  {Ico.plus(11,"#0891b2")} Ajouter
                  <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={addPhotos}/>
                </label>
              )}
            </div>
            {(f.photos||[]).length===0
              ? <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:18,borderRadius:12,border:"2px dashed "+DS.border,background:DS.light,cursor:"pointer"}}>
                  {Ico.camera(26,DS.mid)}
                  <span style={{fontSize:13,color:DS.mid,fontWeight:600}}>Ajouter des photos</span>
                  <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={addPhotos}/>
                </label>
              : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8}}>
                  {(f.photos||[]).map((ph,i)=>(
                    <div key={i} style={{position:"relative",borderRadius:10,overflow:"hidden",border:"1px solid "+DS.border}}>
                      <img src={ph} alt={`Photo ${i+1}`} style={{width:"100%",height:80,objectFit:"cover",display:"block"}}/>
                      <button onClick={()=>set("photos",(f.photos||[]).filter((_,j)=>j!==i))}
                        style={{position:"absolute",top:4,right:4,width:22,height:22,borderRadius:11,background:"rgba(0,0,0,0.65)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {Ico.close(9,"#fff")}
                      </button>
                    </div>
                  ))}
                </div>
            }
          </div>
          {/* Récap */}
          <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",border:"1px solid "+DS.border}}>
            <div style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Récapitulatif</div>
            {[
              ["Client", selectedClient?.nom||"—"],
              ["Date", f.date?new Date(f.date).toLocaleDateString("fr"):"—"],
              ["Produits", f.produits.length+" article"+(f.produits.length!==1?"s":"")],
              f.montant?["Montant", f.montant+" €"]:null,
            ].filter(Boolean).map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"3px 0"}}>
                <span style={{color:DS.mid}}>{l}</span>
                <span style={{fontWeight:700,color:DS.dark}}>{v}</span>
              </div>
            ))}
          </div>
          {selectedClient?.email&&(
            <button onClick={()=>envoyerEmailLivraison({...f,id:isEdit?f.id:uid()}, selectedClient)}
              style={{padding:"11px",borderRadius:DS.radiusSm,background:"#f0f9ff",border:"1px solid #bae6fd",cursor:"pointer",fontWeight:700,fontSize:13,color:"#0891b2",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {Ico.send(13,"#0891b2")} Envoyer par email à {selectedClient.email}
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{display:"flex",gap:8,marginTop:16,paddingTop:12,borderTop:"1px solid "+DS.border}}>
        <button onClick={step===1?onClose:()=>setStep(s=>s-1)}
          style={{padding:"11px 16px",borderRadius:DS.radiusSm,background:DS.light,border:"1px solid "+DS.border,cursor:"pointer",fontWeight:700,fontSize:13,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          {step===1?<>{Ico.close(12,DS.mid)} Annuler</>:<>{Ico.back(12,DS.mid)} Retour</>}
        </button>
        <div style={{flex:1}}/>
        {step<STEPS
          ? <button onClick={()=>setStep(s=>s+1)}
              style={{padding:"11px 20px",borderRadius:DS.radiusSm,background:(STEP_INFO[step]||STEP_INFO[STEPS-1]).color,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,boxShadow:`0 3px 10px ${(STEP_INFO[step]||STEP_INFO[STEPS-1]).color}33`}}>
              {(STEP_INFO[step]||STEP_INFO[STEPS-1]).l} {Ico.next(13,"#fff")}
            </button>
          : <button onClick={()=>{if(!f.clientId){ toastWarn("Client requis"); return; } if(!f.date){ toastWarn("Date requise"); return; }onSave({...f,id:isEdit?f.id:uid()});}}
              style={{padding:"11px 20px",borderRadius:DS.radiusSm,background:"linear-gradient(135deg,#059669,#0d9488)",border:"none",cursor:"pointer",fontWeight:700,fontSize:13,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,boxShadow:"0 3px 10px rgba(5,150,105,0.3)"}}>
              {Ico.save(14,"#fff")} Enregistrer
            </button>
        }
      </div>
    </Modal>
  );
}


function FormRdv({ initial, clients, onSave, onClose }) {
  const isEdit = !!initial?.id;
  const [f, setF] = useState(()=> initial || {
    id: uid(), clientId:"", date:TODAY, heure:"09:00", duree:"60",
    type:"Rendez-vous client", description:"", rappel:false
  });
  const set = (k,v) => setF(p=>({...p,[k]:v}));

  return (
    <Modal title={isEdit ? "Modifier le RDV" : "Nouveau rendez-vous"} onClose={onClose}>
      <Section title="Client (optionnel)">
        <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:180,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          <button onClick={()=>set("clientId","")} style={{padding:"8px 12px",borderRadius:DS.radiusSm,border:"1.5px solid "+(f.clientId===""?DS.blue:DS.border),background:f.clientId===""?DS.blueSoft:DS.white,cursor:"pointer",textAlign:"left",fontFamily:"inherit",fontSize:15,fontWeight:f.clientId===""?700:400,color:f.clientId===""?DS.blue:DS.mid}}>— Aucun client —</button>
          {clients.map(c=>{
            const sel = f.clientId===c.id;
            return (
              <button key={c.id} onClick={()=>set("clientId",c.id)} className="card-hover" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:DS.radiusSm,border:"1.5px solid "+(sel?DS.blue:DS.border),background:sel?DS.blueSoft:DS.white,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
                <Avatar nom={c.nom} size={30}/>
                <span style={{fontWeight:sel?700:400,fontSize:15,color:sel?DS.dark:DS.mid}}>{c.nom}</span>
              </button>
            );
          })}
        </div>
      </Section>
      <Section title="Date & heure">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Input label="Date *" type="date" value={f.date} onChange={e=>set("date",e.target.value)}/>
          <Input label="Heure" type="time" value={f.heure} onChange={e=>set("heure",e.target.value)}/>
        </div>
        <div style={{marginTop:10}}>
          <Input label="Durée (min)" type="number" style={{fontSize:16}} value={f.duree} onChange={e=>set("duree",e.target.value)}/>
        </div>
      </Section>
      <Section title="Type">
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {[
            {v:"Rendez-vous client",ico:"🤝"},{v:"Mise en route",ico:"▶️"},{v:"Hivernage",ico:"❄️"},
            {v:"Devis / Visite technique",ico:"📋"},{v:"Réparation / SAV",ico:"🔧"},{v:"Autre",ico:"📌"}
          ].map(({v,ico})=>{
            const sel=f.type===v;
            return (
              <button key={v} onClick={()=>set("type",v)} className="btn-hover" style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:12,border:`1.5px solid ${sel?DS.purple:DS.border}`,background:sel?DS.purpleSoft:DS.white,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .2s"}}>
                <span style={{fontSize:16}}>{ico}</span>
                <span style={{fontSize:15,fontWeight:sel?700:400,color:sel?DS.purple:DS.mid,flex:1}}>{v}</span>
                {sel && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={DS.purple} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            );
          })}
        </div>
      </Section>
      <Section title="Description">
        <textarea value={f.description} onChange={e=>set("description",e.target.value)} placeholder="Détails, adresse, notes..."
          style={{width:"100%",padding:"10px 12px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:15,minHeight:64,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark,outline:"none"}}/>
      </Section>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} className="btn-hover" style={{flex:1,padding:"12px",borderRadius:DS.radiusSm,background:DS.light,border:"none",cursor:"pointer",fontWeight:700,fontSize:15,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{Ico.close(13,DS.mid)} Annuler</button>
        <BtnPrimary onClick={()=>{ if(!f.date){ toastWarn("Date requise"); return; } onSave({...f,id:isEdit?f.id:uid()}); }} icon={Ico.save(15,"#fff")} style={{flex:2}}>Enregistrer</BtnPrimary>
      </div>
    </Modal>
  );
}

// FICHE CLIENT — VERSION REDESSINÉE
function FicheClient({ client, passages, livraisons=[], rdvs=[], produitsStock=[], contrats={}, onUpdateContrat, onUpdateClient, onSaveLivraison, onDeleteLivraison, onUpdateStatutLivraison, onEdit, onDelete, onDeletePassage, onClose, onAddPassage, onEditPassage, onUpdatePassageStatus, onAddRdv, onEditRdv, onDeleteRdv }) {
  const [tab, setTab] = useState("historique");
  const [detailPassageFiche, setDetailPassageFiche] = useState(null);
  const [showFormLiv, setShowFormLiv] = useState(false);
  const [editLiv, setEditLiv] = useState(null);
  const [selectedMois, setSelectedMois] = useState(null);
  const [showCarnetPreview, setShowCarnetPreview] = useState(false);
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
  const pct = total>0?Math.round(eff/total*100):0;
  const mensualite = (()=>{const {m11}=calcMensualites(client.prix||0);return m11;})();

  // TABS config
  const TABS = [
    {id:"historique", label:"Historique", ico:"🕐"},
    {id:"passages",   label:"Passages",   ico:"🔧"},
    {id:"saisons",    label:"Planning",   ico:"📅"},
    {id:"infos",      label:"Infos",      ico:"ℹ️"},
    {id:"rdvs",       label:"RDV",        ico:"📆"},
    {id:"livraisons", label:"Livraisons", ico:"📦"},
    {id:"carnet",     label:"Carnet",     ico:"📱"},
  ];

  return (
    <>
    <Modal title="" onClose={onClose} wide>
      {/* ══════════════════ HERO HEADER ══════════════════ */}
      <div style={{margin:isMobile?"-18px -20px 0":"-24px -28px 0"}}>

        {/* Bandeau gradient */}
        <div style={{background:"linear-gradient(135deg,#0c1f3f 0%,#0e3460 60%,#0891b2 100%)",padding:"20px 20px 0",position:"relative",overflow:"hidden"}}>
          {/* Décoration cercle bg */}
          <div style={{position:"absolute",right:-40,top:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,0.04)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",right:40,bottom:-20,width:100,height:100,borderRadius:"50%",background:"rgba(8,145,178,0.15)",pointerEvents:"none"}}/>

          {/* Ligne 1 : nom + badge alerte */}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:8,position:"relative"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:isMobile?18:22,fontWeight:900,color:"#fff",lineHeight:1.15,letterSpacing:-.3}}>{client.nom}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",marginTop:3,fontWeight:500}}>
                {[client.formule,client.bassin,client.volume?client.volume+"m³":null].filter(Boolean).join(" · ")}
              </div>
            </div>
            <div style={{background:col.bg,color:col.tx,fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:20,flexShrink:0,border:"1px solid "+col.tx+"44",whiteSpace:"nowrap"}}>{col.lbl}</div>
          </div>

          {/* Ligne 2 : contrat restant */}
          {jours!==null&&(
            <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"4px 10px",marginBottom:14}}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={jours<=30?"#fde68a":"#7dd3fc"} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style={{fontSize:11,fontWeight:700,color:jours<=30?"#fde68a":"#7dd3fc"}}>{jours>=0?jours+" j restants":"Contrat expiré"}</span>
            </div>
          )}

          {/* KPI row — 4 tuiles compactes */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:0,paddingBottom:16}}>
            {[
              {label:"Entretiens",val:`${effE}/${totalE}`,ok:effE>=totalE,sub:"effectués"},
              {label:"Contrôles", val:`${effC}/${totalC}`,ok:effC>=totalC,sub:"effectués"},
              {label:"Restants",  val:rest,ok:rest===0,accent:rest>0?"#fde68a":"#a7f3d0",sub:"passages"},
              {label:"Mensualité",val:mensualite+"€",ok:true,accent:"#a7f3d0",sub:"/mois"},
            ].map(({label,val,ok,accent,sub},i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.07)",borderRadius:10,padding:"10px 6px",textAlign:"center",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",fontWeight:700,textTransform:"uppercase",letterSpacing:.4,marginBottom:3}}>{label}</div>
                <div style={{fontSize:i===2?20:16,fontWeight:900,color:accent||(ok?"#a7f3d0":"#fde68a"),lineHeight:1}}>{val}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",marginTop:2}}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Barre de progression globale */}
          <div style={{height:3,background:"rgba(255,255,255,0.1)",margin:"0 0 0"}}>
            <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,#0891b2,#a7f3d0)",transition:"width 1s ease",borderRadius:"0 99px 99px 0"}}/>
          </div>
        </div>

        {/* TABS — scrollables, compacts */}
        <div style={{background:"#fff",display:"flex",borderBottom:"1px solid #f1f5f9",overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
          {TABS.map(({id,label,ico})=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{flexShrink:0,padding:"10px 14px",border:"none",cursor:"pointer",fontWeight:tab===id?800:500,fontSize:12,fontFamily:"inherit",background:"transparent",color:tab===id?"#0891b2":"#94a3b8",borderBottom:tab===id?"2.5px solid #0891b2":"2.5px solid transparent",transition:"all .12s",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4,WebkitTapHighlightColor:"transparent"}}>
              <span style={{fontSize:13}}>{ico}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════ CONTENU TABS ══════════════════ */}
      <div style={{paddingTop:16}}>

      {/* -- HISTORIQUE -- */}
      {tab==="historique" && (
        <div className="fade-in">
          {(()=>{
            const passClient2 = passages.filter(p=>p.clientId===client.id);
            const livClient  = (livraisons||[]).filter(l=>l.clientId===client.id);
            const rdvClient2 = (rdvs||[]).filter(r=>r.clientId===client.id);
            const events = [
              ...(client.dateDebut?[{date:client.dateDebut,title:"Début de contrat",sub:client.formule+(client.prix?" · "+client.prix+"€/an":""),dot:"#22d3ee",badge:"Contrat",badgeColor:"#0891b2"}]:[]),
              ...passClient2.map(p=>({date:p.date,title:p.type||"Passage",sub:[p.tech?"par "+p.tech:null,p.ph?"pH "+p.ph:null,p.chlore?"Cl "+p.chlore:null].filter(Boolean).join(" · "),dot:isControleType(p.type)?"#0e7490":"#0891b2",badge:p.ok?"Effectué":"En cours",badgeColor:p.ok?"#059669":"#f59e0b",_p:p})),
              ...livClient.map(l=>({date:l.date,title:"Livraison",sub:[l.produits?.slice(0,2).join(", "),l.montant?l.montant+"€":null].filter(Boolean).join(" · "),dot:"#f59e0b",badge:l.statut==="paye"?"Payé":l.statut==="facture"?"Facturé":"À facturer",badgeColor:l.statut==="paye"?"#059669":"#f59e0b",_l:l})),
              ...rdvClient2.map(r=>({date:r.date,title:r.type||"RDV",sub:[r.heure,r.duree?r.duree+" min":null].filter(Boolean).join(" · "),dot:"#818cf8",badge:r.date>=TODAY?"À venir":"Passé",badgeColor:r.date>=TODAY?"#818cf8":"#94a3b8",_r:r})),
            ].sort((a,b)=>b.date.localeCompare(a.date));
            if(!events.length) return <div style={{textAlign:"center",padding:"48px 0",color:"#94a3b8",fontSize:14}}>Aucun historique</div>;
            const grouped={};
            events.forEach(ev=>{ const d=new Date(ev.date); const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; if(!grouped[k]) grouped[k]=[]; grouped[k].push(ev); });
            return Object.keys(grouped).sort((a,b)=>b.localeCompare(a)).map(key=>{
              const [yr,mo]=key.split("-");
              return (
                <div key={key} style={{marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:800,color:"#0f172a",marginBottom:10,paddingBottom:6,borderBottom:"2px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span>{MOIS_L[parseInt(mo)]} {yr}</span>
                    <span style={{fontSize:10,color:"#94a3b8",fontWeight:500}}>{grouped[key].length} événement{grouped[key].length>1?"s":""}</span>
                  </div>
                  {grouped[key].map((ev,i)=>{
                    const d=new Date(ev.date);
                    const clickable=!!(ev._p||ev._l||ev._r);
                    return (
                      <div key={i} onClick={ev._p?()=>setDetailPassageFiche(ev._p):ev._l?()=>{setEditLiv(ev._l);setShowFormLiv(true);}:ev._r?()=>onEditRdv&&onEditRdv(ev._r):undefined}
                        style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:i<grouped[key].length-1?"1px solid #f8fafc":"none",cursor:clickable?"pointer":"default"}}>
                        <div style={{width:36,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                          <div style={{width:10,height:10,borderRadius:"50%",background:ev.dot}}/>
                          <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,textAlign:"center",lineHeight:1.2}}>{d.toLocaleDateString("fr",{day:"2-digit",month:"short"})}</div>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:2}}>{ev.title}</div>
                          {ev.sub&&<div style={{fontSize:11,color:"#64748b"}}>{ev.sub}</div>}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                          <span style={{fontSize:10,fontWeight:700,color:ev.badgeColor,background:ev.badgeColor+"18",padding:"2px 7px",borderRadius:10,whiteSpace:"nowrap"}}>{ev.badge}</span>
                          {clickable&&<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* -- PASSAGES / RAPPORTS -- */}
      {tab==="passages" && (
        <div className="fade-in">
          {/* Action bar */}
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
              const rapportMeta=RAPPORT_STATUS[rapportStatus];
              return (
                <div key={p.id} style={{background:"#fff",borderRadius:14,border:"1px solid #f1f5f9",marginBottom:8,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                  {/* Header passage */}
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
                    {/* Mesures compactes */}
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

                  {/* Photos */}
                  {(p.photoArrivee||p.photoDepart)&&(
                    <div style={{display:"flex",gap:4,padding:"0 14px 8px"}}>
                      {p.photoArrivee&&<div style={{flex:1,position:"relative"}}><img src={p.photoArrivee} alt="" style={{width:"100%",height:52,objectFit:"cover",borderRadius:8}}/><span style={{position:"absolute",bottom:2,left:4,fontSize:8,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.5)",borderRadius:3,padding:"1px 4px"}}>Arrivée</span></div>}
                      {p.photoDepart&&<div style={{flex:1,position:"relative"}}><img src={p.photoDepart} alt="" style={{width:"100%",height:52,objectFit:"cover",borderRadius:8}}/><span style={{position:"absolute",bottom:2,left:4,fontSize:8,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.5)",borderRadius:3,padding:"1px 4px"}}>Départ</span></div>}
                    </div>
                  )}

                  {/* Statut rapport */}
                  <div style={{padding:"0 14px 8px"}} onClick={e=>e.stopPropagation()}>
                    <RapportStatusPicker compact value={rapportStatus} onChange={(next)=>onUpdatePassageStatus?.({...p,rapportStatut:next,rapportEnvoyeAt:next==="envoye"?(p.rapportEnvoyeAt||new Date().toISOString()):null})}/>
                  </div>

                  {/* Boutons d'action — rangée compacte */}
                  <div style={{display:"flex",borderTop:"1px solid #f8fafc"}}>
                    {[
                      {label:"Aperçu",  ico:Ico.search(12,DS.mid),  bg:"#f8fafc", color:DS.dark,   onClick:()=>setDetailPassageFiche(p)},
                      {label:"Modifier",ico:Ico.edit(12,DS.mid),    bg:"#f8fafc", color:DS.mid,    onClick:()=>onEditPassage&&onEditPassage(p)},
                      {label:"Rapport", ico:Ico.pdf(12,DS.blue),    bg:"#eff6ff", color:DS.blue,   onClick:()=>ouvrirRapport(p,client)},
                      ...(client.email?[{label:"Email",ico:Ico.send(12,DS.green),bg:"#f0fdf4",color:DS.green,onClick:()=>envoyerEmail(p,client,onUpdatePassageStatus)}]:[]),
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
                        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={doneManuel>0?"#7c3aed":DS.mid} strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {isSelMois&&passM.length>0&&(
                <div style={{background:"#f8fafc",padding:"8px 12px",borderBottom:i<11?"1px solid "+DS.border:"none",display:"flex",flexDirection:"column",gap:6}}>
                  {passM.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(p=>{
                    const phOk=p.ph>=7&&p.ph<=7.6;const clOk=p.chlore>=0.5&&p.chlore<=3;
                    return (
                      <div key={p.id} style={{background:"#fff",borderRadius:10,padding:"9px 11px",border:"1px solid #f1f5f9"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <div style={{fontSize:12,fontWeight:700,color:DS.dark}}>{new Date(p.date).toLocaleDateString("fr",{day:"2-digit",month:"long"})} {p.tech&&<span style={{color:DS.mid,fontWeight:500}}>· {p.tech}</span>}</div>
                          <div style={{display:"flex",gap:4}}>
                            {p.ph&&<span style={{fontSize:10,fontWeight:700,color:phOk?DS.green:DS.red,background:phOk?DS.greenSoft:DS.redSoft,padding:"1px 5px",borderRadius:4}}>pH {p.ph}</span>}
                            {p.chlore&&<span style={{fontSize:10,fontWeight:700,color:clOk?DS.green:DS.red,background:clOk?DS.greenSoft:DS.redSoft,padding:"1px 5px",borderRadius:4}}>Cl {p.chlore}</span>}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:4}}>
                          <button onClick={e=>{e.stopPropagation();setDetailPassageFiche(p);}} style={{flex:1,padding:"5px",borderRadius:7,background:"#f1f5f9",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>{Ico.search(10,DS.mid)} Aperçu</button>
                          <button onClick={e=>{e.stopPropagation();onEditPassage&&onEditPassage(p);}} style={{flex:1,padding:"5px",borderRadius:7,background:"#f1f5f9",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>{Ico.edit(10,DS.mid)} Modifier</button>
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
          {/* Contact rapide */}
          {(client.tel||client.email)&&(
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {client.tel&&<a href={"tel:"+client.tel} style={{flex:1,height:44,borderRadius:12,background:"#eff6ff",border:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:13,fontWeight:700,color:DS.blue,textDecoration:"none",WebkitTapHighlightColor:"transparent"}}>
                {Ico.phone(14,DS.blue)} Appeler
              </a>}
              {client.email&&<a href={"mailto:"+client.email} style={{flex:1,height:44,borderRadius:12,background:"#f0fdf4",border:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:13,fontWeight:700,color:DS.green,textDecoration:"none",WebkitTapHighlightColor:"transparent"}}>
                {Ico.mail(14,DS.green)} Email
              </a>}
            </div>
          )}
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #f1f5f9",overflow:"hidden",marginBottom:16}}>
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
              <div style={{width:34,height:34,borderRadius:9,background:"#f0f9ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{r.ico}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:2}}>{r.l}</div>
                {r.href?<a href={r.href} style={{fontSize:13,color:DS.blue,fontWeight:700,textDecoration:"none"}}>{r.v}</a>:<div style={{fontSize:13,color:"#0f172a",fontWeight:600}}>{r.v}</div>}
              </div>
            </div>
          ))}
          </div>

          {/* Statut contrat */}
          {(()=>{
            const ct=contratClient;
            if(!ct) return null;
            const cfg={
              signe_complet:{bg:"#f0fdf4",border:"#6ee7b7",color:DS.green,label:"✅ Contrat co-signé",sub:"Signé le "+new Date(ct.signedAt||0).toLocaleDateString("fr")},
              signe_client: {bg:"#eff6ff",border:"#93c5fd",color:DS.blue,label:"📝 Client signé",sub:"En attente de votre signature"},
              signe:        {bg:"#f0fdf4",border:"#6ee7b7",color:DS.green,label:"✅ Contrat signé",sub:""},
            }[ct.statut]||{bg:"#fff7ed",border:"#fed7aa",color:DS.orange,label:"📨 En attente de signature",sub:""};
            return <div style={{background:cfg.bg,border:"1px solid "+cfg.border,borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:800,color:cfg.color}}>{cfg.label}</div>
                {cfg.sub&&<div style={{fontSize:10,color:DS.mid,marginTop:1}}>{cfg.sub}</div>}
              </div>
            </div>;
          })()}

          {/* Boutons actions */}
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
              style={{height:44,borderRadius:12,background:"#f1f5f9",border:"none",cursor:"pointer",fontWeight:700,fontSize:12,color:DS.dark,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5,WebkitTapHighlightColor:"transparent"}}>
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
                    <button onClick={()=>onEditRdv&&onEditRdv(r)} style={{flex:1,padding:"7px",borderRadius:8,background:"#f8fafc",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontSize:11,fontWeight:700,color:DS.mid,fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>{Ico.edit(11,DS.mid)} Modifier</button>
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
          {/* Stats rapides */}
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
                <div key={l.id} style={{background:"#fff",borderRadius:12,border:"1px solid #f1f5f9",marginBottom:8,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                  <div style={{padding:"12px 14px 8px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{new Date(l.date).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"})}</div>
                      {l.produits&&l.produits.length>0&&<div style={{fontSize:11,color:DS.mid,marginTop:2}}>{l.produits.join(", ")}</div>}
                      {l.description&&<div style={{fontSize:11,color:DS.mid,marginTop:1}}>{l.description}</div>}
                      {l.montant&&<div style={{fontSize:15,fontWeight:900,color:DS.dark,marginTop:4}}>{Number(l.montant).toLocaleString("fr")} €</div>}
                    </div>
                    <span style={{fontSize:10,fontWeight:700,color:s.color,background:s.bg,padding:"2px 8px",borderRadius:8,flexShrink:0,border:"1px solid "+s.color+"44"}}>{s.label}</span>
                  </div>
                  {/* Statut picker compact */}
                  <div style={{display:"flex",gap:4,padding:"0 14px 8px"}}>
                    {Object.entries(STATUT_LIV).map(([k,sv])=>(
                      <button key={k} onClick={()=>onUpdateStatutLivraison(l.id,k)} style={{flex:1,padding:"5px 2px",borderRadius:7,border:"1.5px solid "+(l.statut===k?sv.color:DS.border),background:l.statut===k?sv.bg:"#fff",cursor:"pointer",fontSize:10,fontWeight:700,color:l.statut===k?sv.color:DS.mid,fontFamily:"inherit"}}>{sv.label}</button>
                    ))}
                  </div>
                  <div style={{display:"flex",borderTop:"1px solid #f8fafc"}}>
                    <button onClick={()=>{setEditLiv(l);setShowFormLiv(true);}} style={{flex:1,padding:"8px",background:"#f8fafc",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontSize:11,fontWeight:700,color:DS.mid,fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>{Ico.edit(11,DS.mid)} Modifier</button>
                    {client.email
                      ?<button onClick={()=>envoyerEmailLivraison(l,client)} style={{flex:1,padding:"8px",background:"#f0fdf4",border:"none",borderLeft:"1px solid #f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,fontSize:11,fontWeight:700,color:DS.green,fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}>{Ico.send(11,DS.green)} Email</button>
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

            {/* -- BOUTON APERÇU CLIENT -- */}
            <button onClick={()=>setShowCarnetPreview(true)}
              style={{width:"100%",height:52,borderRadius:16,background:"linear-gradient(135deg,#0891b2,#0e7490)",border:"none",cursor:"pointer",fontWeight:800,fontSize:14,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 4px 16px rgba(8,145,178,0.35)",WebkitTapHighlightColor:"transparent"}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Aperçu — Vue client
            </button>

            {/* QR Card principale */}
            <div style={{background:"linear-gradient(145deg,#0c1f3f,#0e3460,#0a5a8a)",borderRadius:20,padding:"24px 20px",position:"relative",overflow:"hidden",boxShadow:"0 8px 32px rgba(8,145,178,0.25)"}}>
              {/* Décos */}
              <div style={{position:"absolute",right:-30,top:-30,width:140,height:140,borderRadius:"50%",background:"rgba(8,145,178,0.12)",pointerEvents:"none"}}/>
              <div style={{position:"absolute",left:-20,bottom:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.03)",pointerEvents:"none"}}/>

              {/* Badge BRIBLUE */}
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:18,position:"relative"}}>
                <svg width={16} height={12} viewBox="0 0 32 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M2 8c2.5 3 5 3 7.5 0S14 5 16.5 8s5 3 7.5 0"/>
                  <path d="M2 16c2.5 3 5 3 7.5 0S14 13 16.5 16s5 3 7.5 0"/>
                </svg>
                <span style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,0.5)",letterSpacing:1,textTransform:"uppercase"}}>Carnet numérique</span>
              </div>

              {/* Contenu principal : QR + code */}
              <div style={{display:"flex",gap:18,alignItems:"center",position:"relative"}}>
                {/* QR Code */}
                <div style={{width:96,height:96,borderRadius:14,overflow:"hidden",flexShrink:0,background:"#fff",padding:4,boxShadow:"0 4px 16px rgba(0,0,0,0.3)"}}>
                  <img src={qrUrl} alt="QR" width={88} height={88} style={{display:"block",borderRadius:8}} onError={e=>{e.target.style.display="none";}}/>
                </div>
                {/* Nom + code */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:16,fontWeight:900,color:"#fff",marginBottom:4,lineHeight:1.2}}>{client.nom}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Code d'accès</div>
                  <div style={{fontSize:26,fontWeight:900,color:"#7dd3fc",letterSpacing:4,fontFamily:"'Courier New',monospace",background:"rgba(125,211,252,0.08)",borderRadius:8,padding:"4px 10px",display:"inline-block"}}>{code}</div>
                </div>
              </div>

              {/* Boutons d'action */}
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

            {/* Dernière intervention */}
            {lastPass && (
              <div style={{background:"#fff",borderRadius:16,border:"1px solid #f1f5f9",padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
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

            {/* Ce que voit le client */}
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

            {/* Lien URL */}
            <div style={{background:"#f8fafc",borderRadius:12,padding:"10px 14px",border:"1px solid #e2e8f0"}}>
              <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>Lien du carnet</div>
              <div style={{fontSize:11,color:"#0891b2",fontWeight:600,wordBreak:"break-all",lineHeight:1.5}}>{carnetUrl}</div>
            </div>
          </div>
        );
      })()}

      </div>{/* fin contenu */}
    </Modal>

    {/* -- APERÇU CARNET CLIENT (plein écran) -- */}
    {showCarnetPreview&&(
      <div style={{position:"fixed",inset:0,zIndex:9999,background:"#f0f4f8",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        {/* Barre fermeture */}
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
        {/* Le vrai composant CarnetPublic avec les données déjà chargées */}
        <CarnetPublicInline client={client} passages={passages}/>
      </div>
    )}
    </>
  );
}

// COMPOSANTS FORMULAIRE PASSAGE
const ETAT_LOCAL_OPTIONS = ["Nettoyage du sol","Trace d'eau au sol","Trace d'eau au mur","Fuite plomberie","Fuite moteur","Sur filtre ?"];

function MultiCheck({ label, options, values, onChange }) {
  const toggle = (v) => { const arr = values.includes(v) ? values.filter(x=>x!==v) : [...values,v]; onChange(arr); };
  return (
    <div>
      {label && (
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <span style={{fontSize:15,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7}}>{label}</span>
          {values.length>0 && <span style={{background:DS.blue,color:"#fff",fontSize:15,fontWeight:800,borderRadius:10,padding:"1px 7px",minWidth:18,textAlign:"center"}}>{values.length}</span>}
        </div>
      )}
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {options.map(o=>{
          const sel=values.includes(o);
          return (
            <button key={o} onClick={()=>toggle(o)} className="btn-hover" style={{display:"inline-flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:20,border:`1.5px solid ${sel?DS.blue:DS.border}`,background:sel?DS.blueGrad:DS.white,cursor:"pointer",fontFamily:"inherit",fontWeight:sel?700:500,fontSize:15,color:sel?"#fff":DS.mid,boxShadow:sel?"0 2px 8px "+DS.blue+"33":"none",transition:"all .2s",WebkitTapHighlightColor:"transparent"}}>
              {sel
                ? <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={DS.border} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              }
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RadioGroup({ label, options, value, onChange, color }) {
  const activeColor = color || DS.blue;
  const activeGrad = color ? `linear-gradient(135deg,${color},${color}cc)` : DS.blueGrad;
  return (
    <div>
      {label && <span style={{fontSize:15,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:8}}>{label}</span>}
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {options.map(o=>{
          const sel=value===o;
          return (
            <button key={o} onClick={()=>onChange(o)} className="btn-hover" style={{display:"flex",alignItems:"center",gap:11,padding:"11px 14px",borderRadius:12,border:`1.5px solid ${sel?activeColor:DS.border}`,background:sel?activeGrad:DS.white,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .2s",boxShadow:sel?`0 2px 10px ${activeColor}33`:"none",WebkitTapHighlightColor:"transparent"}}>
              <div style={{width:18,height:18,borderRadius:9,border:`2px solid ${sel?"transparent":DS.border}`,background:sel?"rgba(255,255,255,0.3)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
                {sel && <div style={{width:8,height:8,borderRadius:4,background:"#fff"}}/>}
              </div>
              <span style={{fontSize:15,fontWeight:sel?700:400,color:sel?"#fff":DS.mid,flex:1}}>{o}</span>
              {sel && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OuiNon({ label, value, onChange }) {
  return (
    <div>
      {label && <span style={{fontSize:15,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:7}}>{label}</span>}
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>onChange(true)} className="btn-hover" style={{flex:1,padding:"10px",borderRadius:10,border:`1.5px solid ${value===true?DS.green:DS.border}`,background:value===true?DS.greenSoft:DS.white,color:value===true?DS.green:DS.mid,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s",boxShadow:value===true?"0 2px 8px "+DS.green+"33":"none"}}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Oui
        </button>
        <button onClick={()=>onChange(false)} className="btn-hover" style={{flex:1,padding:"10px",borderRadius:10,border:`1.5px solid ${value===false?DS.red:DS.border}`,background:value===false?DS.redSoft:DS.white,color:value===false?DS.red:DS.mid,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s",boxShadow:value===false?"0 2px 8px "+DS.red+"33":"none"}}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Non
        </button>
      </div>
    </div>
  );
}

function StarRating({ value, onChange }) {
  const labels=["","Mauvais","Passable","Bien","Très bien","Excellent"];
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={()=>onChange(n)} style={{background:"none",border:"none",cursor:"pointer",padding:"2px",lineHeight:1,transition:"all .2s",transform:n<=value?"scale(1.15)":"scale(1)"}}>
            {Ico.star(28,n<=value?"#f59e0b":"#e2e8f0",n<=value?"#f59e0b":"none")}
          </button>
        ))}
      </div>
      {value>0 && (
        <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"#fffbeb",borderRadius:8,padding:"4px 10px",border:"1px solid #fcd34d"}}>
          <span style={{fontSize:15,fontWeight:800,color:"#d97706"}}>{value}/5</span>
          <span style={{fontSize:15,color:"#92400e",fontWeight:500}}>{labels[value]}</span>
        </div>
      )}
    </div>
  );
}

function NumField({ label, value, onChange, unit, ideal, okFn }) {
  const hasVal = value !== "" && value !== null && value !== undefined;
  const ok = hasVal && okFn ? okFn(value) : true;
  const statusColor = !hasVal ? DS.border : ok ? "#22c55e" : "#ef4444";
  const statusBg = !hasVal ? DS.light : ok ? "#f0fdf4" : "#fef2f2";
  const statusTx = !hasVal ? DS.mid : ok ? "#16a34a" : "#be123c";
  return (
    <div style={{background:statusBg,borderRadius:10,padding:"10px 12px",border:`1.5px solid ${hasVal?(ok?"#86efac":"#fda4af"):DS.border}`,transition:"all .2s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <div style={{fontSize:15,fontWeight:700,color:DS.mid}}>
          {label}{unit && <span style={{color:"#94a3b8",fontWeight:400}}> ({unit})</span>}
        </div>
        {ideal && (
          <span style={{fontSize:9,fontWeight:700,color:hasVal?statusTx:"#94a3b8",background:hasVal?(ok?"#dcfce7":"#fff1f2"):"#f1f5f9",padding:"2px 7px",borderRadius:8,letterSpacing:.3}}>
            {hasVal ? (ok ? "✓ OK" : "⚠ Hors plage") : `idéal ${ideal}`}
          </span>
        )}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <input type="number" step="0.1" value={value===""||value===null||value===undefined?"":value} onChange={e=>onChange(e.target.value===""?"":+e.target.value)}
          style={{flex:1,padding:"8px 10px",borderRadius:8,border:`1.5px solid ${statusColor}`,fontSize:16,fontWeight:800,boxSizing:"border-box",color:statusTx,background:"#fff",transition:"all .2s",outline:"none",fontFamily:"inherit",minWidth:0}}/>
        {hasVal && (
          <div style={{width:28,height:28,borderRadius:14,background:ok?"#22c55e":"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 2px 6px ${ok?"#22c55e":"#ef4444"}44`}}>
            {ok
              ? <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }
          </div>
        )}
      </div>
    </div>
  );
}

// SIGNATURE PAD
function SignaturePad({ value, onChange, label }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasSign, setHasSign] = useState(!!value);

  useEffect(()=>{
    if(value && canvasRef.current) {
      const img = new Image();
      img.onload = ()=>{ const ctx=canvasRef.current?.getContext("2d"); ctx&&ctx.drawImage(img,0,0); };
      img.src = value;
    }
  },[]);

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const src = e.touches?.[0] || e;
    return { x:(src.clientX-r.left)*(canvas.width/r.width), y:(src.clientY-r.top)*(canvas.height/r.height) };
  };
  const start = (e) => { e.preventDefault(); drawing.current=true; const canvas=canvasRef.current; const ctx=canvas.getContext("2d"); const {x,y}=getPos(e,canvas); ctx.beginPath(); ctx.moveTo(x,y); ctx.strokeStyle="#1b3a5c"; ctx.lineWidth=2.5; ctx.lineCap="round"; ctx.lineJoin="round"; };
  const move = (e) => { e.preventDefault(); if(!drawing.current)return; const canvas=canvasRef.current; const ctx=canvas.getContext("2d"); const {x,y}=getPos(e,canvas); ctx.lineTo(x,y); ctx.stroke(); };
  const end = (e) => { e.preventDefault(); drawing.current=false; const data=canvasRef.current.toDataURL("image/png"); setHasSign(true); onChange(data); };
  const clear = () => { const canvas=canvasRef.current; canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height); setHasSign(false); onChange(""); };

  return (
    <div>
      {label && <span style={{fontSize:15,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>{label}</span>}
      <div style={{border:"1.5px solid "+DS.border,borderRadius:DS.radius,overflow:"hidden",background:DS.light,position:"relative"}}>
        <canvas ref={canvasRef} width={500} height={140} style={{display:"block",width:"100%",height:140,touchAction:"none",cursor:"crosshair"}}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
        {!hasSign && <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
          <span style={{color:DS.border,fontSize:15,display:"flex",alignItems:"center",gap:6}}>{Ico.sign(14,"#cbd5e1")} Signez ici</span>
        </div>}
      </div>
      {hasSign && <button onClick={clear} style={{marginTop:4,background:"none",border:"none",color:"#94a3b8",fontSize:15,cursor:"pointer",fontWeight:600}}>✕ Effacer</button>}
    </div>
  );
}


// CONTRAT PDF (HTML  print)
function genererContratHTML(client, sigPrestataire="", sigClient="") {
  const mpm = migrateMois(client.moisParMois||client.saisons);
  const totalE = totalAnnuel(client.moisParMois||client.saisons,"entretien");
  const totalC = totalAnnuel(client.moisParMois||client.saisons,"controle");
  const total = totalE + totalC;
  const prixE = client.prixPassageE || 0;
  const prixC = client.prixPassageC || 0;
  const totalPrixE = totalE * prixE;
  const totalPrixC = totalC * prixC;
  const totalAnnuelPrix = totalPrixE + totalPrixC;
  const { m1, m11, estRond } = calcMensualites(totalAnnuelPrix);
  const dateContrat = client.dateDebut ? new Date(client.dateDebut).toLocaleDateString("fr") : "—";
  const dateFin = client.dateFin ? new Date(client.dateFin).toLocaleDateString("fr") : "—";
  let moisRows = "";
  for (let m=1;m<=12;m++) {
    const mv = mpm[m] || {entretien:0,controle:0};
    moisRows += `<tr><td>${MOIS_L[m]}</td><td class="center">${mv.entretien||"—"}</td><td class="center">${mv.controle||"—"}</td></tr>`;
  }
  moisRows += `<tr class="total-row"><td><strong>TOTAL DE PASSAGE</strong></td><td class="center"><strong>${totalE}</strong></td><td class="center"><strong>${totalC}</strong></td></tr>`;
  const sigPrestaHTML = sigPrestataire
    ? `<img src="${sigPrestataire}" style="max-height:70px;display:block;margin-top:8px;border-radius:6px;"/>`
    : `<canvas id="sigPresta" width="300" height="80" style="border:1.5px dashed #cbd5e1;border-radius:8px;cursor:crosshair;display:block;margin-top:8px;width:100%;touch-action:none;"></canvas><p style="font-size:10px;color:#94a3b8;margin-top:4px;">Signez dans le cadre ci-dessus</p>`;
  const sigClientHTML = sigClient
    ? `<img src="${sigClient}" style="max-height:70px;display:block;margin-top:8px;border-radius:6px;"/>`
    : `<canvas id="sigClient" width="300" height="80" style="border:1.5px dashed #cbd5e1;border-radius:8px;cursor:crosshair;display:block;margin-top:8px;width:100%;touch-action:none;"></canvas><p style="font-size:10px;color:#94a3b8;margin-top:4px;">Signez dans le cadre ci-dessus</p>`;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Contrat BRIBLUE — ${client.nom}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;font-size:12px;color:#1e293b;background:#fff}
.page{max-width:780px;margin:0 auto;padding:32px}
h1{font-size:28px;font-weight:900;color:#0c1222;text-align:center;letter-spacing:2px;margin-bottom:4px}
.section{margin-bottom:20px}
.section-title{background:linear-gradient(135deg,#0c1222,#1a365d);color:#fff;padding:10px 18px;border-radius:10px 10px 0 0;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:1px}
table{width:100%;border-collapse:collapse;border:1px solid #e2e8f0}
table th{background:#f0f9ff;color:#0369a1;font-size:10px;text-transform:uppercase;letter-spacing:.5px;padding:8px 12px;text-align:left;border:1px solid #e2e8f0}
table td{padding:7px 12px;border:1px solid #e2e8f0;font-size:12px}
.center{text-align:center}
.total-row{background:#f0f9ff;font-weight:700}
.info-grid{display:grid;grid-template-columns:140px 1fr;border:1px solid #e2e8f0;border-radius:0 0 10px 10px;overflow:hidden}
.info-grid .label{background:#f8fafc;padding:8px 14px;font-weight:700;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0}
.info-grid .value{padding:8px 14px;font-weight:700;font-size:13px;color:#0c1222;border-bottom:1px solid #e2e8f0}
.recap{background:linear-gradient(135deg,#0c1222,#1a365d);color:#fff;border-radius:12px;padding:20px 24px;margin:20px 0}
.recap h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.7);margin-bottom:8px}
.recap .prix{font-size:24px;font-weight:900;margin-bottom:12px}
.mensualite{background:rgba(255,255,255,0.1);border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border:1px solid rgba(255,255,255,0.15)}
.mensualite .mlabel{font-size:11px;color:rgba(255,255,255,0.7);font-weight:600}
.mensualite .montant{font-size:20px;font-weight:900;color:#22d3ee}
.conditions{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-bottom:20px}
.conditions h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:10px}
.conditions li{margin-bottom:6px;font-size:11px;color:#475569;line-height:1.5}
.detail{border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:20px}
.detail h4{background:#f0f9ff;padding:10px 16px;font-size:11px;font-weight:800;color:#0369a1;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e2e8f0}
.detail ul{padding:12px 16px 12px 32px;font-size:11px;color:#475569;line-height:1.8}
.signatures{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:30px}
.sig-box{border:1px solid #e2e8f0;border-radius:12px;padding:16px;}
.sig-label{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.sig-date{font-size:11px;color:#64748b;margin-bottom:6px}
.btn-clear{background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;padding:6px 14px;border-radius:8px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;margin-top:6px}
.footer{margin-top:24px;text-align:center;font-size:10px;color:#94a3b8;padding-top:16px;border-top:1px solid #e2e8f0}
.no-print{margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap}
.btn-print{background:linear-gradient(135deg,#0c1222,#1a365d);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-weight:700;cursor:pointer;font-size:15px;font-family:inherit}
.btn-dl{background:linear-gradient(135deg,#0369a1,#0ea5e9);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-weight:700;cursor:pointer;font-size:15px;font-family:inherit}
@media print{.page{padding:16px}.no-print{display:none!important}canvas{border:1px solid #e2e8f0!important}.btn-clear{display:none!important}@page{margin:10mm}}
</style></head><body>
<div class="page">
<div class="no-print">
  <button onclick="window.print()" class="btn-print">🖨️ Imprimer / PDF</button>
  <button onclick="(function(){var a=document.createElement('a');a.href='data:text/html;charset=utf-8,'+encodeURIComponent(document.documentElement.outerHTML);a.download='Contrat_BRIBLUE_${client.nom.replace(/\s/g,'_')}.html';document.body.appendChild(a);a.click();document.body.removeChild(a);})()" class="btn-dl">💾 Enregistrer</button>
</div>
<div style="text-align:center;padding:0 0 14px"><span style="font-size:40px;font-weight:900;color:#0c1222;letter-spacing:-2px">Bri<span style="color:#0369a1">&#x2019;</span>blue</span></div>
<h1 style="margin-top:0">CONTRAT PISCINE</h1>
<div style="text-align:center;color:#0369a1;font-size:13px;font-weight:700;margin-bottom:20px;">Création · Traitement de l'eau · Installation · Dépannage</div>
<div class="section">
  <div class="section-title">Informations du contrat</div>
  <div class="info-grid">
    <div class="label">Client</div><div class="value">${client.nom}</div>
    <div class="label">Date du contrat</div><div class="value">${dateContrat}</div>
    <div class="label">Début</div><div class="value">${dateContrat}</div>
    <div class="label">Fin</div><div class="value">${dateFin}</div>
    <div class="label">Total passages</div><div class="value">${total} passages annuels</div>
  </div>
</div>
<div class="section">
  <div class="section-title">Planning des interventions</div>
  <table><thead><tr><th>Mois</th><th class="center">Nettoyage complet</th><th class="center">Contrôle de l'eau</th></tr></thead><tbody>${moisRows}</tbody></table>
</div>
<div class="section">
  <div class="section-title">Tarifs des prestations</div>
  <table><thead><tr><th>Type</th><th class="center">Passages</th><th class="center">Prix/passage</th><th class="center">Total</th></tr></thead>
  <tbody>
    <tr><td>Nettoyage complet</td><td class="center">${totalE}</td><td class="center">${prixE} €</td><td class="center"><strong>${totalPrixE} €</strong></td></tr>
    <tr><td>Contrôle de l'eau</td><td class="center">${totalC||"—"}</td><td class="center">${prixC||"—"} €</td><td class="center"><strong>${totalPrixC||"—"} €</strong></td></tr>
  </tbody></table>
</div>
<div class="recap">
  <h3>Récapitulatif financier</h3>
  <div class="prix">Prix annuel : ${totalAnnuelPrix.toLocaleString("fr")} €</div>
  ${estRond ? `
  <div class="mensualite">
    <div><div class="mlabel">Mensualité</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">12 × ${m11} €</div></div>
    <div class="montant">${m11} € / mois</div>
  </div>
  ` : `
  <div class="mensualite" style="flex-direction:column;gap:8px">
    <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
      <div><div class="mlabel">1ᵉʳ prélèvement (ajustement)</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">Absorbe le reste d'arrondi</div></div>
      <div class="montant" style="color:#fbbf24">${m1} €</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;width:100%;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px">
      <div><div class="mlabel">Mensualités 2 à 12</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">11 prélèvements identiques</div></div>
      <div class="montant">${m11} € / mois</div>
    </div>
  </div>
  `}
</div>
${client.notesTarifaires ? `
<div class="conditions" style="background:#f0f9ff;border-color:#bae6fd;">
  <h3 style="color:#0891b2;">📝 Notes tarifaires particulières</h3>
  <ul>
    ${client.notesTarifaires.split("\n").filter(l=>l.trim()).map(l=>`<li style="color:#0e7490;font-weight:600;">${l.trim()}</li>`).join("")}
  </ul>
</div>
` : ""}
<div class="conditions">
  <h3>Conditions & Informations</h3>
  <ul>
    <li>Utilisation exclusive des produits de la société pour garantir la qualité du traitement.</li>
    <li><strong>Produits non inclus</strong> dans le forfait annuel.</li>
    <li>Intervention supplémentaire possible en cas d'aléas climatiques (fortes pluies / vent).</li>
    <li>Rapport d'entretien transmis par email après chaque passage.</li>
    <li>Kit d'entretien fourni et facturé séparément (brosse, épuisette, manche, tuyau).</li>
  </ul>
</div>
<div class="detail"><h4>Nettoyage complet du bassin</h4><ul><li>Passage épuisette si nécessaire</li><li>Nettoyage au balai aspirateur</li><li>Vérification et ajustement (chlore, pH)</li><li>Contrôle technique (filtre, pompe)</li><li>Livraison de produits si besoin</li></ul></div>
<div class="detail"><h4>Contrôle de l'eau</h4><ul><li>Nettoyage rapide surface à l'épuisette</li><li>Vérification et ajustement (chlore, pH)</li><li>Contrôle technique</li><li>Livraison de produits si besoin</li></ul></div>
<div class="signatures">
  <div class="sig-box">
    <div class="sig-label">Le prestataire — BRIBLUE</div>
    <div class="sig-date">Dorian Briaire · ${new Date().toLocaleDateString("fr")}</div>
    ${sigPrestaHTML}
    ${!sigPrestataire ? `<button class="btn-clear" onclick="clearSig('sigPresta')">Effacer</button>` : ""}
  </div>
  <div class="sig-box">
    <div class="sig-label">Le client — ${client.nom}</div>
    <div class="sig-date">Lu et approuvé · ${new Date().toLocaleDateString("fr")}</div>
    ${sigClientHTML}
    ${!sigClient ? `<button class="btn-clear" onclick="clearSig('sigClient')">Effacer</button>` : ""}
  </div>
</div>
<div class="footer">BRIBLUE · SIRET 84345436400053 · La Seyne-sur-Mer · 06 67 18 61 15</div>
</div>
<script>
function setupCanvas(id){const c=document.getElementById(id);if(!c)return;const ctx=c.getContext('2d');let drawing=false;function pos(e){const r=c.getBoundingClientRect();const s=e.touches?e.touches[0]:e;return{x:(s.clientX-r.left)*(c.width/r.width),y:(s.clientY-r.top)*(c.height/r.height)};}
c.addEventListener('mousedown',e=>{drawing=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.strokeStyle='#1b3a5c';ctx.lineWidth=2;ctx.lineCap='round';});
c.addEventListener('mousemove',e=>{if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();});
c.addEventListener('mouseup',()=>drawing=false);
c.addEventListener('touchstart',e=>{e.preventDefault();drawing=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.strokeStyle='#1b3a5c';ctx.lineWidth=2;ctx.lineCap='round';},{passive:false});
c.addEventListener('touchmove',e=>{e.preventDefault();if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();},{passive:false});
c.addEventListener('touchend',()=>drawing=false);}
function clearSig(id){const c=document.getElementById(id);if(c)c.getContext('2d').clearRect(0,0,c.width,c.height);}
setupCanvas('sigPresta');setupCanvas('sigClient');
</script>
</body></html>`;
}

function ouvrirContrat(client, sigPrestataire="", sigClient="") {
  const html = genererContratHTML(client, sigPrestataire, sigClient);
  const blob = new Blob([html], {type:"text/html;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
}

async function envoyerContratSignature(client) {
  if (!client?.email) { toastWarn("Aucun email renseigné pour ce client."); return; }

  // Confirmation avant envoi
  // confirm replaced by modal — called from button directly

  const sigLink = `${window.location.origin}/sign.html?clientId=${client.id}&contractId=CT-${client.id}`;
  const dateStr = new Date().toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"});

  const htmlEmail = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:16px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
  <tr><td style="background:#0c1222;padding:20px 28px;border-radius:10px 10px 0 0;">
    <span style="font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:2px;">BRI BLUE</span>
  </td></tr>
  <tr><td style="background:#ffffff;padding:28px;border:1px solid #e2e8f0;border-top:none;">
    <p style="font-size:15px;color:#1e293b;margin:0 0 12px;">Bonjour <strong>${client.nom}</strong>,</p>
    <p style="font-size:14px;color:#475569;margin:0 0 20px;line-height:1.6;">Votre contrat d'entretien piscine BRIBLUE est prêt. Veuillez cliquer sur le lien ci-dessous pour le consulter et le signer :</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr><td style="background:#0369a1;border-radius:10px;padding:14px 24px;text-align:center;">
        <a href="${sigLink}" style="color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;display:block;">➡ Cliquez ici pour signer votre contrat</a>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#64748b;margin:0 0 8px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
    <p style="font-size:11px;color:#0369a1;word-break:break-all;margin:0;">${sigLink}</p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:14px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">
    <p style="margin:0;font-size:12px;color:#64748b;"><strong>Dorian Briaire</strong><br/>Technicien de Piscine - BRI BLUE</p>
  </td></tr>
</table>
</body></html>`;

  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "rapport-piscine@briblue83.com",
        to: [client.email],
        subject: `Votre contrat BRIBLUE — À signer`,
        html: htmlEmail,
        text: `Bonjour ${client.nom},\n\nVotre contrat BRIBLUE est prêt à signer.\n\nLien de signature :\n${sigLink}\n\nCordialement,\nDorian Briaire\nTechnicien de Piscine - BRI BLUE`,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      // Marquer "demande_envoyee" dans Supabase
      try {
        const { createClient } = await import("@supabase/supabase-js").catch(()=>({createClient:null}));
        // Sauvegarde locale dans l'état contrats via un appel à l'API
        await fetch("/api/sign-contract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractId: "CT-" + client.id,
            clientId: client.id,
            signatureClient: "pending",
            signedAt: new Date().toISOString(),
            statut_override: "demande_envoyee",
          }),
        });
      } catch(e) {}
      toastSuccess(`Contrat envoyé à ${client.email} !`);
    }
    else toastError(`Erreur : ${data?.message}`);
  } catch(err) {
    toastError(`Erreur réseau : ${err.message}`);
  }
}

// RAPPORT HTML PREMIUM
function genererHTMLRapport(passage, client) {
  const d = new Date(passage.date).toLocaleDateString("fr", {day:"2-digit",month:"long",year:"numeric"});
  const val = (v, u="") => (v !== "" && v !== null && v !== undefined) ? `<strong>${v}</strong>${u?" "+u:""}` : `<span class="empty">—</span>`;
  const liste = (arr) => arr?.length ? arr.join(", ") : "—";
  const ouinon = (v) => v===true?`<span class="badge ok">OUI</span>`:v===false?`<span class="badge no">NON</span>`:"—";
  const etoiles = (n) => n>0 ? `<span class="stars">${"★".repeat(n)}${"☆".repeat(5-n)}</span> <span class="star-num">${n}/5</span>` : "—";

  const sigTech = passage.signatureTech ? `<img src="${passage.signatureTech}" class="sig-img"/>` : `<div class="sig-empty">Non signée</div>`;
  const sigClient = passage.signatureClient ? `<img src="${passage.signatureClient}" class="sig-img"/>` : `<div class="sig-empty">Non signée</div>`;

  const hasPhotos = passage.photoArrivee || passage.photoDepart || (passage.photos||[]).some(Boolean);
  const allPhotos = [
    passage.photoArrivee ? {src:passage.photoArrivee, label:"À l'arrivée"} : null,
    ...((passage.photos||[]).map((p,i)=>p?{src:p,label:`Photo ${i+2}`}:null)),
    passage.photoDepart ? {src:passage.photoDepart, label:"Au départ"} : null,
  ].filter(Boolean);
  const sectionPhotos = hasPhotos ? `
<div class="section">
  <div class="section-title"><span class="sec-icon">📸</span> Photos d'intervention</div>
  <div class="section-body" style="display:grid;grid-template-columns:${allPhotos.length===1?"1fr":"1fr 1fr"};gap:16px">
    ${allPhotos.map(p=>`<div><div class="photo-label">${p.label}</div><img src="${p.src}" class="photo"/></div>`).join("")}
  </div>
</div>` : "";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<title>Rapport BRIBLUE — ${client?.nom||""} — ${d}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',system-ui,sans-serif;font-size:13px;color:#1e293b;background:#f8fafc;padding:0}
  .page{max-width:780px;margin:0 auto;padding:24px;background:#fff}
  .header{background:linear-gradient(135deg,#0c1222 0%,#1a365d 50%,#0369a1 100%);color:#fff;padding:28px 32px;border-radius:16px;margin-bottom:20px;position:relative;overflow:hidden}
  .header::after{content:'';position:absolute;top:-50%;right:-20%;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,0.05)}
  .header h1{font-size:22px;font-weight:900;margin-bottom:2px;letter-spacing:-0.5px;position:relative;z-index:1}
  .header-sub{font-size:12px;opacity:.7;position:relative;z-index:1;margin-top:4px}
  .header-meta{display:flex;gap:20px;margin-top:14px;position:relative;z-index:1}
  .header-meta .meta-item{background:rgba(255,255,255,0.12);border-radius:10px;padding:8px 14px;font-size:11px;font-weight:600;backdrop-filter:blur(4px)}
  .header-meta .meta-item strong{display:block;font-size:14px;font-weight:800;margin-top:2px}
  .section{margin-bottom:16px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;break-inside:avoid}
  .section-title{background:linear-gradient(135deg,#f0f9ff,#e0f2fe);color:#0369a1;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:.8px;padding:10px 18px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:8px}
  .sec-icon{font-size:14px}
  .section-body{padding:14px 18px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .field{padding:8px 12px;background:#f8fafc;border-radius:8px;border:1px solid #f1f5f9}
  .field-label{font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
  .field-value{font-size:13px;color:#1e293b;font-weight:500}
  .field-value strong{font-weight:800;color:#0c1222}
  .empty{color:#cbd5e1;font-weight:400}
  .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700}
  .badge.ok{background:#d1fae5;color:#059669}
  .badge.no{background:#fee2e2;color:#dc2626}
  .stars{color:#f59e0b;font-size:16px;letter-spacing:1px}
  .star-num{font-size:11px;color:#94a3b8;font-weight:600}
  .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  .sig-img{max-height:70px;border:1px solid #e2e8f0;border-radius:10px;display:block}
  .sig-empty{height:70px;border:2px dashed #e2e8f0;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:12px;font-weight:500}
  .sig-label{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
  .photo{width:100%;max-height:240px;object-fit:cover;border-radius:10px;border:1px solid #e2e8f0;display:block}
  .photo-label{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
  .footer{margin-top:24px;font-size:11px;color:#94a3b8;text-align:center;padding:16px 0;border-top:2px solid #f1f5f9}
  .footer strong{color:#64748b}
  .no-print{margin-bottom:16px;display:flex;gap:8px}
  .btn-print{background:linear-gradient(135deg,#0c1222,#1a365d);color:#fff;border:none;padding:12px 24px;border-radius:12px;font-weight:700;cursor:pointer;font-size:14px;font-family:inherit;box-shadow:0 4px 12px rgba(12,18,34,0.3)}
  .btn-close{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;padding:12px 24px;border-radius:12px;font-weight:700;cursor:pointer;font-size:14px;font-family:inherit}
  @media print{.page{padding:10px;box-shadow:none}.no-print{display:none!important}@page{margin:8mm}.header{border-radius:10px}}
</style></head><body>
<div class="page">

<div class="header">
  <h1>BRIBLUE</h1>
  <div class="header-sub">Rapport d'entretien piscine</div>
  <div class="header-meta">
    <div class="meta-item">Client<strong>${client?.nom||"—"}</strong></div>
    <div class="meta-item">Date<strong>${d}</strong></div>
    <div class="meta-item">Formule<strong>${client?.formule||"—"}</strong></div>
    <div class="meta-item">Technicien<strong>${passage.tech||"Dorian"}</strong></div>
  </div>
</div>

<div class="no-print">
  <div style="display:flex;gap:10px;flex-wrap:wrap;">
    <button onclick="window.print()" style="background:linear-gradient(135deg,#0c1222,#1a365d);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-weight:700;cursor:pointer;font-size:15px;font-family:inherit;box-shadow:0 4px 12px rgba(12,18,34,0.3);">
      🖨️ Imprimer / PDF
    </button>
    <button onclick="(function(){var a=document.createElement('a');a.href='data:text/html;charset=utf-8,'+encodeURIComponent(document.documentElement.outerHTML);a.download='Rapport_BRIBLUE.html';document.body.appendChild(a);a.click();document.body.removeChild(a);})()" style="background:linear-gradient(135deg,#0369a1,#0ea5e9);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-weight:700;cursor:pointer;font-size:15px;font-family:inherit;box-shadow:0 4px 12px rgba(3,105,161,0.3);">
      💾 Enregistrer
    </button>
  </div>
</div>

<div class="section">
  <div class="section-title"><span class="sec-icon">🏊</span> Bassin & Intervention</div>
  <div class="section-body grid">
    <div class="field"><div class="field-label">Type</div><div class="field-value">${passage.type||"—"}</div></div>
    <div class="field"><div class="field-label">Statut</div><div class="field-value">${(() => { const rs = RAPPORT_STATUS[getRapportStatus(passage)] || RAPPORT_STATUS.saisie; return `<span class="badge" style="background:${rs.bg};color:${rs.color}">${rs.label}</span>`; })()}</div></div>
    <div class="field"><div class="field-label">Type bassin</div><div class="field-value">${client?.bassin||"—"}</div></div>
    <div class="field"><div class="field-label">Volume</div><div class="field-value">${client?.volume?client.volume+" m³":"—"}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title"><span class="sec-icon">💧</span> Analyses eau</div>
  <div class="section-body grid">
    <div class="field"><div class="field-label">Chlore libre</div><div class="field-value">${val(passage.chloreLibre,"ppm")}</div></div>
    <div class="field"><div class="field-label">pH bandelette</div><div class="field-value">${val(passage.ph)}</div></div>
    <div class="field"><div class="field-label">Alcalinité</div><div class="field-value">${val(passage.alcalinite,"ppm")}</div></div>
    <div class="field"><div class="field-label">Stabilisant</div><div class="field-value">${val(passage.stabilisant,"ppm")}</div></div>
    <div class="field"><div class="field-label">Taux chlore</div><div class="field-value">${val(passage.tChlore)}</div></div>
    <div class="field"><div class="field-label">Taux pH</div><div class="field-value">${val(passage.tPH)}</div></div>
    <div class="field"><div class="field-label">Taux sel</div><div class="field-value">${val(passage.tSel)}</div></div>
    <div class="field"><div class="field-label">Taux phosphate</div><div class="field-value">${val(passage.tPhosphate)}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title"><span class="sec-icon">🔍</span> État du bassin</div>
  <div class="section-body grid">
    <div class="field"><div class="field-label">Qualité eau</div><div class="field-value">${passage.qualiteEau||"—"}</div></div>
    <div class="field"><div class="field-label">Fond</div><div class="field-value">${liste(passage.etatFond)}</div></div>
    <div class="field"><div class="field-label">Parois</div><div class="field-value">${liste(passage.etatParois)}</div></div>
    <div class="field"><div class="field-label">Local technique</div><div class="field-value">${liste(passage.etatLocal)}</div></div>
    <div class="field"><div class="field-label">Bac tampon</div><div class="field-value">${liste(passage.etatBacTampon)}</div></div>
    <div class="field"><div class="field-label">Volet / bac</div><div class="field-value">${liste(passage.etatVoletBac)}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title"><span class="sec-icon">⚗️</span> Correctifs apportés</div>
  <div class="section-body grid">
    <div class="field"><div class="field-label">Chlore</div><div class="field-value">${val(passage.corrChlore)}</div></div>
    <div class="field"><div class="field-label">pH</div><div class="field-value">${val(passage.corrPH)}</div></div>
    <div class="field"><div class="field-label">Sel</div><div class="field-value">${val(passage.corrSel)}</div></div>
    <div class="field"><div class="field-label">Algicide</div><div class="field-value">${val(passage.corrAlgicide)}</div></div>
    <div class="field"><div class="field-label">Peroxyde</div><div class="field-value">${val(passage.corrPeroxyde)}</div></div>
    <div class="field"><div class="field-label">Chlore choc</div><div class="field-value">${val(passage.corrChloreChoc)}</div></div>
    <div class="field"><div class="field-label">Phosphate</div><div class="field-value">${val(passage.corrPhosphate)}</div></div>
    <div class="field"><div class="field-label">Alcafix</div><div class="field-value">${val(passage.corrAlcafix)}</div></div>
    <div class="field"><div class="field-label">Autre</div><div class="field-value">${val(passage.corrAutre)}</div></div>
  </div>
</div>

${(passage.livraisonProduits&&(passage.produitsLivres||[]).length>0)?`
<div class="section">
  <div class="section-title"><span class="sec-icon">📦</span> Produits livrés</div>
  <div class="section-body">
    <div class="field" style="grid-column:1/-1"><div class="field-value">${liste(passage.produitsLivres)}${passage.livraisonAutre?" — "+passage.livraisonAutre:""}</div></div>
  </div>
</div>`:""}

<div class="section">
  <div class="section-title"><span class="sec-icon">✅</span> Clôture</div>
  <div class="section-body grid">
    <div class="field"><div class="field-label">Devis à faire</div><div class="field-value">${ouinon(passage.devis)}</div></div>
    <div class="field"><div class="field-label">Prise d'échantillon</div><div class="field-value">${ouinon(passage.priseEchantillon)}</div></div>
    <div class="field"><div class="field-label">Présence client</div><div class="field-value">${ouinon(passage.presenceClient)}</div></div>
    <div class="field"><div class="field-label">Ressenti</div><div class="field-value">${etoiles(passage.ressenti)}</div></div>
    ${passage.commentaires?`<div class="field" style="grid-column:1/-1"><div class="field-label">Commentaires</div><div class="field-value">${passage.commentaires}</div></div>`:""}
  </div>
</div>

${sectionPhotos}

<div class="section">
  <div class="section-title"><span class="sec-icon">✍️</span> Signatures</div>
  <div class="section-body sig-grid">
    <div><div class="sig-label">Technicien</div>${sigTech}</div>
    <div><div class="sig-label">Client / Propriétaire</div>${sigClient}</div>
  </div>
</div>

<div class="footer">Document généré le ${new Date().toLocaleDateString("fr")} · <strong>BRIBLUE</strong> · 06 67 18 61 15</div>

</div>
</body></html>`;
}

function ouvrirRapport(passage, client) {
  const html = genererHTMLRapport(passage, client);
  const blob = new Blob([html], {type:"text/html;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
}

async function envoyerEmail(passage, client, onSent) {
  const FROM = "rapport-piscine@briblue83.com";

  if (!client?.email) { toastWarn("Aucun email renseigné pour ce client."); return; }

  const dateStr = new Date(passage.date).toLocaleDateString("fr",{day:"2-digit",month:"long",year:"numeric"});
  const htmlRapport = genererHTMLRapport(passage, client);

  const htmlEmail = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;">
  <tr><td style="background:#0c1222;padding:20px 28px;border-radius:10px 10px 0 0;">
    <span style="font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:2px;">BRI BLUE</span>
  </td></tr>
  <tr><td style="background:#ffffff;padding:28px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
    <p style="font-size:15px;color:#1e293b;margin:0 0 12px;">Bonjour <strong>${client?.nom||""}</strong>,</p>
    <p style="font-size:14px;color:#475569;margin:0 0 20px;line-height:1.6;">Votre rapport d'entretien piscine du <strong>${dateStr}</strong> est disponible.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;"><td style="padding:10px 16px;font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Informations</td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;"><span style="font-size:11px;color:#94a3b8;">Client</span><br/><strong style="font-size:13px;color:#1e293b;">${client?.nom||"—"}</strong></td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;"><span style="font-size:11px;color:#94a3b8;">Date</span><br/><strong style="font-size:13px;color:#1e293b;">${dateStr}</strong></td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;"><span style="font-size:11px;color:#94a3b8;">Type</span><br/><strong style="font-size:13px;color:#1e293b;">${passage.type||"—"}</strong></td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;"><span style="font-size:11px;color:#94a3b8;">Technicien</span><br/><strong style="font-size:13px;color:#1e293b;">${passage.tech||"Dorian"}</strong></td></tr>
      ${passage.ph||passage.chloreLibre ? `<tr style="background:#f0fdf4;"><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;"><span style="font-size:11px;color:#94a3b8;">Analyses eau</span><br/><strong style="font-size:13px;color:#1e293b;">${passage.ph?"pH: "+passage.ph+" &nbsp;":""}${passage.chloreLibre?"Chlore: "+passage.chloreLibre+" ppm":""}</strong></td></tr>` : ""}
      ${passage.commentaires ? `<tr><td style="padding:10px 16px;"><span style="font-size:11px;color:#94a3b8;">Commentaires</span><br/><span style="font-size:13px;color:#475569;">${passage.commentaires}</span></td></tr>` : ""}
    </table>
    <p style="font-size:13px;color:#64748b;margin:20px 0 0;line-height:1.6;">Je reste a votre disposition pour toute question.</p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:16px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">
    <p style="margin:0;font-size:12px;color:#64748b;"><strong>Dorian Briaire</strong><br/>Technicien de Piscine — BRI BLUE</p>
  </td></tr>
</table>
</body></html>`;

  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `BRIBLUE <${FROM}>`,
        to: [client.email],
        subject: `Rapport entretien piscine — ${dateStr}`,
        html: htmlEmail,
        text: `Bonjour ${client?.nom||""},\n\nVotre rapport d'entretien piscine du ${dateStr} est disponible.\n\nJe reste a votre disposition pour toute question.\n\nCordialement,\nDorian Briaire\nTechnicien de Piscine - BRI BLUE`,
        attachments: [{
          filename: `Rapport_BRIBLUE_${(client?.nom||"client").replace(/\s/g,"_")}_${passage.date}.html`,
          content: btoa(unescape(encodeURIComponent(genererHTMLRapport(passage, client)))),
        }],
      }),
    });

    const data = await res.json();

    if (res.ok) {
      if (onSent) onSent({ ...passage, rapportStatut: "envoye", rapportEnvoyeAt: new Date().toISOString() });
      toastSuccess(`Fiche envoyée à ${client.email} !`);
    } else {
      console.error("Resend error:", data);
      toastError(`Erreur envoi : ${data?.message || JSON.stringify(data)}`);
    }
  } catch(err) {
    console.error("Fetch error:", err);
    toastError(`Erreur réseau : ${err.message}`);
  }
}

// COMPOSANT MROW - défini en dehors pour éviter re-render à chaque frappe
function MRow({label,unit,value,onChange,ideal,okFn,icon,color="#0891b2"}) {
  const hasVal = value!==""&&value!==null&&value!==undefined&&value!==false;
  const ok = hasVal&&okFn ? okFn(+value) : true;
  const statusColor = !hasVal?"#e2e8f0":ok?"#22c55e":"#ef4444";
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,background:hasVal?(ok?"#f0fdf4":"#fef2f2"):DS.white,border:`1px solid ${hasVal?(ok?"#bbf7d0":"#fecaca"):"#f1f5f9"}`,transition:"all .25s"}}>
      <div style={{width:34,height:34,borderRadius:10,background:color+"15",border:`1px solid ${color}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {icon}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:DS.dark,lineHeight:1.2}}>{label}{unit&&<span style={{fontSize:11,color:"#94a3b8",fontWeight:400}}> ({unit})</span>}</div>
        {ideal&&<div style={{fontSize:10,color:"#94a3b8",marginTop:2,fontWeight:500}}>idéal {ideal}</div>}
      </div>
      <input type="number" step="0.1" value={value===""||value===null||value===undefined?"":value} onChange={e=>onChange(e.target.value===""?"":+e.target.value)}
        style={{width:72,padding:"8px 10px",borderRadius:9,border:`2px solid ${statusColor}`,fontSize:15,fontWeight:800,boxSizing:"border-box",color:hasVal?(ok?"#16a34a":"#be123c"):DS.dark,background:"#fff",textAlign:"center",outline:"none",fontFamily:"inherit",flexShrink:0,transition:"all .2s"}}/>
      <div style={{width:28,height:28,borderRadius:14,background:!hasVal?"#f1f5f9":ok?"#22c55e":"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .3s",boxShadow:hasVal?`0 2px 6px ${ok?"#22c55e":"#ef4444"}44`:"none"}}>
        {!hasVal
          ? <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          : ok
            ? <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        }
      </div>
    </div>
  );
}

// FORMULAIRE PASSAGE (avec Alcafix + types Entretien/Contrle)
function FormPassage({ clients, defaultClientId, initial, onSave, onSaveLivraison, produitsStock=[], onClose }) {
  const EMPTY = {
    date:TODAY, clientId:defaultClientId||"", type:"Entretien complet", tech:"Dorian",
    chloreLibre:"", ph:"", alcalinite:"", stabilisant:"",
    tSel:"", tPhosphate:"", tStabilisant:"", tChlore:"", tPH:"",
    qualiteEau:"", etatFond:[], etatParois:[], etatLocal:[], etatBacTampon:[], etatVoletBac:[],
    corrChlore:"", corrPhosphate:"", corrPH:"", corrSel:"", corrAlgicide:"", corrPeroxyde:"", corrChloreChoc:"", corrAlcafix:"", corrAutre:"",
    devis:null, priseEchantillon:null, commentaires:"",
    livraisonProduits:null, produitsLivres:[], livraisonAutre:"",
    stabilisantHaut:false,
    ressenti:0, presenceClient:null,
    signatureTech:"", signatureClient:"",
    photoArrivee:"",
    photoDepart:"",
    photosDepart:[],
    photos:[],
    ok:false,
    rapportStatut:"saisie",
    // SAV / Devis
    descriptionSAV:"", equipementSAV:[], piecesSAV:"", urgenceDevis:"",
  };
  const isEdit = !!initial?.id;
  const isMobile = useIsMobile();
  const [f,setF]=useState(isEdit ? {...EMPTY,...initial, rapportStatut:getRapportStatus(initial)} : EMPTY);
  const [step,setStep]=useState(1);
  useEffect(()=>{ const el=document.querySelector('[data-modal-body="1"]'); if(el) el.scrollTop=0; },[step]);
  const isSAV = f.type==="SAV";
  const isDevis = f.type==="Demande de devis";
  const isSansDonnees = f.type==="Passage sans données";
  const isSimplified = isSAV || isDevis;
  const STEPS = isSansDonnees ? 1 : isSimplified ? 3 : 6;
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const ph=Number(f.tPH)||Number(f.ph);
  const cl=Number(f.tChlore)||Number(f.chloreLibre);

  const handleSave = () => {
    if(!f.clientId||!f.date){ toastWarn("Client et date requis"); return; }
    const isSAVsave = f.type==="SAV";
    const isDevissave = f.type==="Demande de devis";
    const isSansDonneesSave = f.type==="Passage sans données";
    const isSimplifiedSave = isSAVsave || isDevissave || isSansDonneesSave;
    const passage = {
      ...f,
      id: isEdit ? f.id : uid(),
      ph: isSimplifiedSave ? "" : (ph||f.tPH||f.ph||""),
      chlore: isSimplifiedSave ? "" : (cl||f.tChlore||f.chloreLibre||""),
      rapportStatut: normalizeRapportStatus(f.rapportStatut || (f.ok ? "cree" : "saisie")),
      actions: isSimplifiedSave
        ? [
            isSAVsave && f.descriptionSAV && `Panne: ${f.descriptionSAV}`,
            isSAVsave && f.equipementSAV?.length && `Équipements: ${f.equipementSAV.join(", ")}`,
            isSAVsave && f.piecesSAV && `Pièces: ${f.piecesSAV}`,
            isDevissave && f.descriptionSAV && `Devis: ${f.descriptionSAV}`,
            isDevissave && f.urgenceDevis && `Urgence: ${f.urgenceDevis}`,
          ].filter(Boolean).join(" | ") || ""
        : [
            f.corrChlore&&`Chlore: ${f.corrChlore}`,
            f.corrPH&&`pH: ${f.corrPH}`,
            f.corrAlgicide&&`Algicide: ${f.corrAlgicide}`,
            f.corrChloreChoc&&`Chlore choc: ${f.corrChloreChoc}`,
            f.corrAlcafix&&`Alcafix: ${f.corrAlcafix}`,
            f.corrAutre&&f.corrAutre,
          ].filter(Boolean).join(", ") || "",
      obs: isSimplifiedSave ? (f.descriptionSAV || f.commentaires || "") : f.commentaires,
    };
    onSave(passage);
    // Auto-créer une livraison si produits livrés
    if (f.livraisonProduits && (f.produitsLivres?.length > 0 || f.livraisonAutre) && onSaveLivraison) {
      onSaveLivraison({
        id: uid(),
        clientId: f.clientId,
        date: f.date,
        produits: f.produitsLivres || [],
        description: f.livraisonAutre || "",
        montant: "",
        statut: "aFacturer",
      });
    }
  };

  const client = clients.find(c=>c.id===f.clientId);

  // Icônes SVG premium pour les étapes de la fiche entretien
  const STEP_ICONS = [
    // 1. Intervention — clé plate stylisée
    (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    // 2. Analyses eau — flacon avec bulles
    (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v5l3 9a3 3 0 01-3 3H9a3 3 0 01-3-3l3-9V3z"/><path d="M9 3h6"/><path d="M6.5 15h11"/><circle cx="10" cy="12" r="1" fill={c}/><circle cx="14" cy="13.5" r="0.8" fill={c}/></svg>,
    // 3. État bassin — piscine avec vagues
    (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 14c2.5 2.5 5 2.5 7.5 0s5-2.5 7.5 0 5 2.5 7.5 0" clipPath="url(#p)"/><defs><clipPath id="p"><rect x="2" y="6" width="20" height="12"/></clipPath></defs><line x1="7" y1="6" x2="7" y2="3"/><line x1="17" y1="6" x2="17" y2="3"/></svg>,
    // 4. Correctifs — éprouvette chimie
    (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2l10 0"/><path d="M7 2v5l-4.5 9a2.5 2.5 0 002.3 3.5h10.4a2.5 2.5 0 002.3-3.5L13 7V2"/><path d="M5 15h14"/></svg>,
    // 5. Clôture — checklist validée
    (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    // 6. Signatures — stylo plume
    (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg>,
  ];
  const STEP_INFO_FULL = [
    {ic:STEP_ICONS[0],l:isMobile?"Interv.":"Intervention",color:"#0891b2"},
    {ic:STEP_ICONS[1],l:isMobile?"Analyses":"Analyses eau",color:"#0891b2"},
    {ic:STEP_ICONS[2],l:isMobile?"Bassin":"État bassin",color:"#059669"},
    {ic:STEP_ICONS[3],l:"Correctifs",color:"#4f46e5"},
    {ic:STEP_ICONS[4],l:"Clôture",color:"#b45309"},
    {ic:STEP_ICONS[5],l:isMobile?"Sign.":"Signatures",color:"#059669"},
  ];
  const SAV_ICON = (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5"/></svg>;
  const DEVIS_ICON = (c="currentColor",s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>;
  const STEP_INFO_SAV = [
    {ic:STEP_ICONS[0],l:isMobile?"Interv.":"Intervention",color:"#0891b2"},
    {ic:SAV_ICON,l:isMobile?"Panne":"Détail panne",color:"#dc2626"},
    {ic:STEP_ICONS[5],l:isMobile?"Sign.":"Clôture",color:"#059669"},
  ];
  const STEP_INFO_DEVIS = [
    {ic:STEP_ICONS[0],l:isMobile?"Interv.":"Intervention",color:"#0891b2"},
    {ic:DEVIS_ICON,l:isMobile?"Devis":"Détail devis",color:"#7c3aed"},
    {ic:STEP_ICONS[5],l:isMobile?"Sign.":"Clôture",color:"#059669"},
  ];
  const STEP_INFO_SANS = [
    {ic:(c="currentColor",s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5"/></svg>,l:"Enregistrer",color:"#64748b"},
  ];
  const STEP_INFO = isSansDonnees ? STEP_INFO_SANS : isSAV ? STEP_INFO_SAV : isDevis ? STEP_INFO_DEVIS : STEP_INFO_FULL;

  const Stepper = () => {
    const pct = Math.round((step-1)/STEPS*100);
    return (
    <div style={{marginBottom:16}}>
      {/* Barre de progression globale */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:12,color:DS.mid,fontWeight:600}}>Progression</span>
        <span style={{fontSize:12,fontWeight:700,color:DS.dark}}>{step-1} / {STEPS} étapes — {pct}%</span>
      </div>
      <div style={{height:5,background:DS.light,borderRadius:99,marginBottom:16,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#059669,#0ea5e9)",borderRadius:99,transition:"width .4s cubic-bezier(.22,1,.36,1)"}}/>
      </div>

      {/* Ronds étapes */}
      <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:14,position:"relative"}}>
        {/* Ligne fond */}
        <div style={{position:"absolute",top:"50%",left:"4%",right:"4%",height:2,background:DS.light,transform:"translateY(-50%)",zIndex:0}}/>
        {/* Ligne progression */}
        <div style={{position:"absolute",top:"50%",left:"4%",height:2,width:`${Math.max(0,(step-1.5)/STEPS*92)}%`,background:"linear-gradient(90deg,#059669,#0ea5e9)",transform:"translateY(-50%)",transition:"width .4s",zIndex:1}}/>
        {STEP_INFO.map((s,i)=>{
          const done=i+1<step, active=i+1===step;
          return (
            <div key={i} style={{flex:1,display:"flex",justifyContent:"center",zIndex:2}}>
              <button onClick={()=>setStep(i+1)} title={s.l} style={{
                width:active?44:36, height:active?44:36,
                borderRadius:"50%", border:"none", cursor:"pointer",
                background:active?s.color:done?"#059669":DS.white,
                border:done||active?"none":`2px solid ${DS.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                flexShrink:0, position:"relative",
                transition:"all .3s cubic-bezier(.22,1,.36,1)",
                boxShadow:active?`0 4px 16px ${s.color}44`:done?"0 2px 8px rgba(5,150,105,0.25)":"none",
              }}>
                {done
                  ? <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : (typeof s.ic==="function" ? s.ic(active?"#fff":"#94a3b8", active?17:14) : <span style={{fontSize:active?14:11}}>{s.ic}</span>)
                }
                {active && <div style={{position:"absolute",inset:-4,borderRadius:"50%",border:`2px solid ${s.color}44`,pointerEvents:"none"}}/>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Labels sous les ronds */}
      <div style={{display:"flex",marginBottom:14}}>
        {STEP_INFO.map((s,i)=>{
          const done=i+1<step, active=i+1===step;
          const shortLabel = {Intervention:"Interv.",Analyses:"Analys.","Analyses eau":"Analyses","État bassin":"Bassin",Correctifs:"Correct.",Clôture:"Clôture",Signatures:"Signat."};
          const label = shortLabel[s.l] || s.l;
          return (
            <div key={i} style={{flex:1,textAlign:"center"}}>
              <span style={{fontSize:8,fontWeight:active?800:500,color:active?s.color:done?"#059669":DS.mid,letterSpacing:0,display:"block",lineHeight:1.2}}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Bandeau étape active */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderRadius:14,background:`${STEP_INFO[step-1].color}10`,border:`1.5px solid ${STEP_INFO[step-1].color}30`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:STEP_INFO[step-1].color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 3px 10px ${STEP_INFO[step-1].color}44`}}>
            {typeof STEP_INFO[step-1].ic==="function" ? STEP_INFO[step-1].ic("#fff",16) : <span style={{fontSize:15}}>{STEP_INFO[step-1].ic}</span>}
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:STEP_INFO[step-1].color,letterSpacing:-0.2}}>{STEP_INFO[step-1].l}</div>
            <div style={{fontSize:11,color:DS.mid,marginTop:1}}>Étape {step} sur {STEPS}</div>
          </div>
        </div>
        <div style={{fontSize:22,fontWeight:900,color:STEP_INFO[step-1].color,opacity:0.8}}>{pct}<span style={{fontSize:12,fontWeight:600}}>%</span></div>
      </div>
    </div>
  );};


  const clientSel = clients.find(c=>c.id===f.clientId);

  return (
    <Modal title={isEdit ? "Modifier le passage" : "Rapport"} onClose={onClose} wide>
      {/* Bandeau client sélectionné */}
      {clientSel && (
        <div style={{margin:"-24px -28px 16px",marginTop:isMobile?"-18px":"-24px",marginLeft:isMobile?"-20px":"-28px",marginRight:isMobile?"-20px":"-28px",position:"relative",overflow:"hidden"}}>
          {/* Fond avec photo piscine si dispo */}
          {clientSel.photoPiscine
            ? <div style={{position:"absolute",inset:0,background:`url(${clientSel.photoPiscine}) center/cover`,filter:"brightness(0.35)"}}/>
            : <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#0c1222 0%,#0f2a4a 50%,#0369a1 100%)"}}/>
          }
          {/* Motif décoratif */}
          <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,borderRadius:70,background:"rgba(56,189,248,0.08)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",bottom:-20,left:-20,width:100,height:100,borderRadius:50,background:"rgba(14,165,233,0.06)",pointerEvents:"none"}}/>
          <div style={{position:"relative",padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
            <div style={{position:"relative"}}>
              <Avatar nom={clientSel.nom} size={48}/>
              <div style={{position:"absolute",bottom:-3,right:-3,width:16,height:16,borderRadius:8,background:DS.green,border:"2px solid #0c1222",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {Ico.check(8,"#fff")}
              </div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:900,fontSize:15,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:-0.3}}>{clientSel.nom}</div>
              <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>
                <span style={{background:"rgba(56,189,248,0.2)",color:"#7dd3fc",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,border:"1px solid rgba(56,189,248,0.3)"}}>{clientSel.formule}</span>
                {clientSel.bassin&&<span style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:6}}>{clientSel.bassin}{clientSel.volume?" "+clientSel.volume+"m³":""}</span>}
                <span style={{background:"rgba(14,165,233,0.25)",color:"#38bdf8",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,border:"1px solid rgba(14,165,233,0.3)"}}>{new Date(f.date).toLocaleDateString("fr",{weekday:"short",day:"2-digit",month:"short"})}</span>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              <div style={{background:"rgba(5,150,105,0.2)",border:"1px solid rgba(5,150,105,0.4)",borderRadius:8,padding:"4px 10px",display:"flex",alignItems:"center",gap:5}}>
                {Ico.pool(13,"#6ee7b7")}
                <span style={{fontSize:10,fontWeight:700,color:"#6ee7b7"}}>Rapport</span>
              </div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:500}}>{clientSel.adresse?.split(",").pop()?.trim()||""}</div>
            </div>
          </div>
        </div>
      )}
      <Stepper/>

      {step===1 && (
        <div className="fade-in">
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
            <Input label="Date *" type="date" value={f.date} onChange={e=>set("date",e.target.value)}/>
            <Input label="Technicien" value={f.tech} onChange={e=>set("tech",e.target.value)} placeholder="Prénom"/>
          </div>
          <div style={{marginTop:16}}>
            <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:8}}>Client *</span>
            {isMobile ? (
              <select
                value={f.clientId}
                onChange={e=>set("clientId", e.target.value)}
                style={{width:"100%",padding:"14px 16px",borderRadius:DS.radiusSm,border:"none",background:"#eef2f7",boxShadow:DS.nmShadowSm,fontSize:15,color:DS.dark}}
              >
                <option value="">Choisir un client</option>
                {clients.map(c=>(
                  <option key={c.id} value={c.id}>{c.nom} — {c.formule}</option>
                ))}
              </select>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,maxHeight:220,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
                {clients.map(c=>{
                  const sel=f.clientId===c.id;
                  return (
                    <button key={c.id} onClick={()=>set("clientId",c.id)} className="card-hover" style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:DS.radiusSm,border:`2px solid ${sel?DS.blue:DS.border}`,background:sel?DS.blueSoft:DS.white,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .2s",boxShadow:sel?"0 2px 12px "+DS.blue+"22":"none"}}>
                      <Avatar nom={c.nom} size={38}/>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{c.nom}</div>
                        <div style={{fontSize:11,color:DS.mid,marginTop:1}}>{c.formule} · {c.bassin} {c.volume}m³</div>
                      </div>
                      {sel && <div style={{width:22,height:22,borderRadius:11,background:DS.blueGrad,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 6px "+DS.blue+"44"}}>{Ico.check(12,"#fff")}</div>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{marginTop:16}}>
            <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:8}}>Type d'intervention</span>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {[
                {v:"Entretien complet",ico:Ico.wrench,col:"#0284c7",bg:"#e0f2fe"},
                {v:"Contrôle d'eau",ico:Ico.drop,col:"#0891b2",bg:"#e0f7fa"},
                {v:"Visite technique",ico:Ico.brush,col:"#4f46e5",bg:"#eef2ff"},
                {v:"Bassin en rattrapage",ico:Ico.chemicals,col:"#b45309",bg:"#fef3c7"},
                {v:"Fin de rattrapage",ico:Ico.check,col:"#059669",bg:"#d1fae5"},
                {v:"SAV",ico:(s,c)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5"/></svg>,col:"#dc2626",bg:"#fef2f2"},
                {v:"Demande de devis",ico:(s,c)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/><path d="M9 9h1"/></svg>,col:"#7c3aed",bg:"#f5f3ff"},
                {v:"Passage sans données",ico:(s,c)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5"/></svg>,col:"#64748b",bg:"#f1f5f9"},
              ].map(({v,ico,col,bg})=>{
                const sel=f.type===v;
                return (
                  <button key={v} onClick={()=>{set("type",v);setStep(1);}} className="btn-hover" style={{display:"flex",alignItems:"center",gap:11,padding:"11px 14px",borderRadius:12,border:`1.5px solid ${sel?col:DS.border}`,background:sel?bg:DS.white,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .2s",boxShadow:sel?`0 2px 10px ${col}22`:"none"}}>
                    <div style={{width:32,height:32,borderRadius:9,background:sel?col:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
                      {ico(15,sel?"#fff":DS.mid)}
                    </div>
                    <span style={{fontSize:13,fontWeight:sel?700:400,color:sel?col:DS.mid,flex:1}}>{v}</span>
                    {sel && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{borderTop:"1px solid "+DS.border,paddingTop:16,marginTop:16}}>
            {(() => {
              const filledPhotos = [
                f.photoArrivee ? {key:"pa", label:"Arrivée", val:f.photoArrivee} : null,
                ...((f.photos||[]).map((v,i)=>v?{key:`p${i}`,label:`Photo ${i+2}`,val:v,idx:i}:null)),
              ].filter(Boolean);
              const canAdd = filledPhotos.length < 10;

              const addPhotos = (e) => {
                const files = Array.from(e.target.files||[]).slice(0, 10 - filledPhotos.length);
                let newArrivee = f.photoArrivee||"";
                let newPhotos = [...(f.photos||[])];
                let readers = 0;
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (!newArrivee) { newArrivee = reader.result; }
                    else { newPhotos = [...newPhotos, reader.result]; }
                    readers++;
                    if (readers === files.length) {
                      set("photoArrivee", newArrivee);
                      set("photos", newPhotos.slice(0,9));
                    }
                  };
                  reader.readAsDataURL(file);
                });
                e.target.value="";
              };

              const removePhoto = (key, idx) => {
                if (key==="pa") set("photoArrivee","");
                else { const arr=[...(f.photos||[])]; arr.splice(idx,1); set("photos",arr); }
              };

              return (
                <div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7}}>
                      Photos arrivée {filledPhotos.length>0 && `(${filledPhotos.length}/10)`}
                    </span>
                    {canAdd && (
                      <label style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:8,background:DS.blueSoft,border:"1px solid "+DS.blue+"33",cursor:"pointer",fontSize:12,fontWeight:700,color:DS.blue}}>
                        {Ico.plus(12,DS.blue)} Ajouter
                        <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={addPhotos}/>
                      </label>
                    )}
                  </div>
                  {filledPhotos.length === 0
                    ? <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:20,borderRadius:12,border:"2px dashed "+DS.border,background:DS.light,cursor:"pointer"}}>
                        {Ico.camera(28,DS.mid)}
                        <span style={{fontSize:13,color:DS.mid,fontWeight:600}}>Appuyez pour ajouter des photos</span>
                        <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={addPhotos}/>
                      </label>
                    : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
                        {filledPhotos.map(p=>(
                          <div key={p.key} style={{position:"relative",borderRadius:10,overflow:"hidden",border:"1px solid "+DS.border}}>
                            <img src={p.val} alt={p.label} style={{width:"100%",height:90,objectFit:"cover",display:"block"}}/>
                            <span style={{position:"absolute",bottom:4,left:5,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.55)",borderRadius:4,padding:"1px 6px"}}>{p.label}</span>
                            <button onClick={()=>removePhoto(p.key,p.idx)} style={{position:"absolute",top:4,right:4,width:24,height:24,borderRadius:12,background:"rgba(0,0,0,0.65)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                              {Ico.close(10,"#fff")}
                            </button>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {isSansDonnees && step===1 && (
        <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{padding:"16px",background:"#f8fafc",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,display:"flex",alignItems:"flex-start",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5"/></svg>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#475569",marginBottom:3}}>Passage sans données</div>
              <div style={{fontSize:12,color:DS.mid}}>Ce passage sera enregistré avec la date et le type uniquement, sans mesures ni rapport.</div>
            </div>
          </div>
          <div>
            <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Type d'intervention</span>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {[
                {v:"Entretien complet",col:"#0284c7"},
                {v:"Contrôle d'eau",col:"#0891b2"},
                {v:"Visite technique",col:"#4f46e5"},
                {v:"Bassin en rattrapage",col:"#b45309"},
              ].map(({v,col})=>{
                const sel=f.commentaires===v||(f.commentaires===''&&v==="Entretien complet");
                return (
                  <button key={v} onClick={()=>set("commentaires",v)} className="btn-hover"
                    style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:12,border:`1.5px solid ${sel?col:DS.border}`,background:sel?col+"12":DS.white,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:sel?700:400,color:sel?col:DS.mid,transition:"all .2s"}}>
                    {v}
                    {sel&&<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:"auto"}}><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Note (optionnel)</span>
            <textarea value={f.obs||""} onChange={e=>set("obs",e.target.value)} placeholder="Ex: Passage effectué, client absent..."
              style={{width:"100%",padding:"11px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:80,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark}}/>
          </div>
        </div>
      )}

      {step===2 && isSimplified && (
        <div className="fade-in">
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>{isSAV?"Description de la panne":"Description des travaux demandés"}</span>
              <textarea value={f.descriptionSAV||""} onChange={e=>set("descriptionSAV",e.target.value)}
                placeholder={isSAV?"Décrivez le problème constaté, le symptôme, l'équipement concerné..":"Décrivez les travaux souhaités, les équipements à installer ou remplacer..."}
                style={{width:"100%",padding:"12px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:120,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark}}/>
            </div>
            {isSAV && (
              <div>
                <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Équipement concerné</span>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {["Pompe","Filtre","Volet","Robot","Électrolyseur","Régulateur pH","Chauffage","Autre"].map(eq=>{
                    const sel=(f.equipementSAV||[]).includes(eq);
                    return <button key={eq} onClick={()=>{ const arr=f.equipementSAV||[]; set("equipementSAV",sel?arr.filter(x=>x!==eq):[...arr,eq]); }} className="btn-hover" style={{padding:"10px 12px",borderRadius:10,border:"1.5px solid "+(sel?"#dc2626":DS.border),background:sel?"#fef2f2":DS.white,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:sel?700:400,color:sel?"#dc2626":DS.mid,textAlign:"left",transition:"all .2s"}}>{eq}</button>;
                  })}
                </div>
              </div>
            )}
            {isSAV && (
              <div>
                <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Pièces remplacées / utilisées</span>
                <textarea value={f.piecesSAV||""} onChange={e=>set("piecesSAV",e.target.value)}
                  placeholder="Ex: Joint pompe x2, filtre cartouche, ..."
                  style={{width:"100%",padding:"10px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:70,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark}}/>
              </div>
            )}
            {isDevis && (
              <div>
                <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Urgence</span>
                <div style={{display:"flex",gap:8}}>
                  {[{v:"Normale",col:"#059669",bg:"#d1fae5"},{v:"Rapide",col:"#b45309",bg:"#fef3c7"},{v:"Urgente",col:"#dc2626",bg:"#fef2f2"}].map(({v,col,bg})=>{
                    const sel=f.urgenceDevis===v;
                    return <button key={v} onClick={()=>set("urgenceDevis",v)} className="btn-hover" style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(sel?col:DS.border),background:sel?bg:DS.white,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:sel?700:500,color:sel?col:DS.mid,transition:"all .2s"}}>{v}</button>;
                  })}
                </div>
              </div>
            )}
            <div>
              <OuiNon label={isSAV?"Devis pour les pièces ?":"Visite de chiffrage nécessaire ?"} value={f.devis} onChange={v=>set("devis",v)}/>
            </div>
            <div>
              <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:4}}>Commentaires</span>
              <textarea value={f.commentaires||""} onChange={e=>set("commentaires",e.target.value)} placeholder="Informations complémentaires..."
                style={{width:"100%",padding:"11px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:80,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark}}/>
            </div>
          </div>
        </div>
      )}

      {step===2 && !isSimplified && (
        <div className="fade-in">
          {(()=>{
            const okCount = [
              f.chloreLibre!==undefined&&f.chloreLibre!==""&&+f.chloreLibre>=1&&+f.chloreLibre<=3,
              f.ph!==undefined&&f.ph!==""&&+f.ph>=7.2&&+f.ph<=7.8,
              f.alcalinite!==undefined&&f.alcalinite!==""&&+f.alcalinite>=80&&+f.alcalinite<=120,
              f.stabilisant!==undefined&&f.stabilisant!==""&&+f.stabilisant>=30&&+f.stabilisant<=50,
            ].filter(Boolean).length;
            const filledCount = [f.chloreLibre,f.ph,f.alcalinite,f.stabilisant].filter(v=>v!==""&&v!==null&&v!==undefined).length;
            return (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{borderRadius:DS.radius,overflow:"hidden",border:"1px solid "+DS.border,boxShadow:DS.shadow}}>
              <div style={{background:"linear-gradient(135deg,#0891b2,#06b6d4)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.phTest(16,"#fff")}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:"#fff",letterSpacing:.3}}>Test Bandelette</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.75)",marginTop:1}}>Analyse chimique de l'eau</div>
                  </div>
                </div>
                <div style={{background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"4px 12px",display:"flex",alignItems:"center",gap:5}}>
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{fontSize:11,fontWeight:800,color:"#fff"}}>{okCount}/{filledCount||4} OK</span>
                </div>
              </div>
              <div style={{background:DS.white,padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                <MRow label="Chlore libre" unit="ppm" value={f.chloreLibre} onChange={v=>set("chloreLibre",v)} ideal="1 – 3" okFn={v=>v>=1&&v<=3} color="#0891b2"
                  icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>}/>
                <MRow label="pH" value={f.ph} onChange={v=>set("ph",v)} ideal="7.2 – 7.8" okFn={v=>v>=7.2&&v<=7.8} color="#0891b2"
                  icon={<span style={{fontSize:13,fontWeight:900,color:"#0891b2",letterSpacing:-1}}>pH</span>}/>
                <MRow label="Alcalinité totale" unit="ppm" value={f.alcalinite} onChange={v=>set("alcalinite",v)} ideal="80 – 120" okFn={v=>v>=80&&v<=120} color="#0284c7"
                  icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round"><path d="M2 8c2.5 3 5 3 7.5 0S14 5 16.5 8s5 3 7.5 0"/><path d="M2 16c2.5 3 5 3 7.5 0S14 13 16.5 16s5 3 7.5 0"/></svg>}/>
                <div>
                  <MRow label="Stabilisant" unit="ppm" value={f.stabilisant} onChange={v=>set("stabilisant",v)} ideal="30 – 50" okFn={v=>v>=30&&v<=50} color="#0891b2"
                    icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}/>
                  <label style={{display:"flex",alignItems:"center",gap:8,marginTop:6,padding:"6px 10px",borderRadius:8,background:f.stabilisantHaut?"#fff7ed":"#f8fafc",border:"1px solid "+(f.stabilisantHaut?"#fcd34d":"#e2e8f0"),cursor:"pointer",width:"fit-content"}}>
                    <input type="checkbox" checked={!!f.stabilisantHaut} onChange={e=>set("stabilisantHaut",e.target.checked)} style={{width:16,height:16,accentColor:"#b45309"}}/>
                    <span style={{fontSize:12,fontWeight:700,color:f.stabilisantHaut?"#b45309":"#64748b"}}>⚠️ Stabilisant HAUT</span>
                  </label>
                </div>
              </div>
            </div>
            <div style={{borderRadius:DS.radius,overflow:"hidden",border:"1px solid "+DS.border,boxShadow:DS.shadow}}>
              <div style={{background:"linear-gradient(135deg,#4f46e5,#818cf8)",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.chart(16,"#fff")}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:"#fff",letterSpacing:.3}}>Mesures Électroniques</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.75)",marginTop:1}}>Relevés appareils de mesure</div>
                </div>
              </div>
              <div style={{background:DS.white,padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                <MRow label="Taux de sel" value={f.tSel} onChange={v=>set("tSel",v)} color="#4f46e5"
                  icon={<span style={{fontSize:16}}>🧂</span>}/>
                <MRow label="Taux de phosphate" value={f.tPhosphate} onChange={v=>set("tPhosphate",v)} color="#4f46e5"
                  icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v5l3 9a3 3 0 01-3 3H9a3 3 0 01-3-3l3-9V3z"/><path d="M6.5 15h11"/></svg>}/>
                <MRow label="Taux de chlore" value={f.tChlore} onChange={v=>set("tChlore",v)} ideal="1 – 1.5" okFn={v=>v>=0.5&&v<=3} color="#0891b2"
                  icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>}/>
                <MRow label="Taux de pH" value={f.tPH} onChange={v=>set("tPH",v)} ideal="7.2 – 7.4" okFn={v=>v>=7.0&&v<=7.6} color="#0891b2"
                  icon={<span style={{fontSize:13,fontWeight:900,color:"#4f46e5",letterSpacing:-1}}>pH</span>}/>
                <MRow label="Taux stabilisant" value={f.tStabilisant} onChange={v=>set("tStabilisant",v)} color="#4f46e5"
                  icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}/>
              </div>
            </div>
          </div>
            );
          })()}
        </div>
      )}

      {step===3 && !isSimplified && (
        <div className="fade-in">
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {/* Qualité eau — chips visuels colorés */}
              <div>
                <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:8}}>Qualité de l'eau</span>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:6}}>
                  {[
                    {v:"Cristalline",icon:"💎",color:"#0891b2",bg:"#e0f7fa"},
                    {v:"Trouble",icon:"🌫️",color:"#64748b",bg:"#f1f5f9"},
                    {v:"Laiteuse",icon:"🥛",color:"#94a3b8",bg:"#f8fafc"},
                    {v:"Verte",icon:"🌿",color:"#16a34a",bg:"#f0fdf4"},
                  ].map(({v,icon,color,bg})=>{
                    const sel=f.qualiteEau===v;
                    return (
                      <button key={v} onClick={()=>set("qualiteEau",v)} className="btn-hover" style={{padding:"12px 10px",borderRadius:12,border:`2px solid ${sel?color:DS.border}`,background:sel?bg:DS.white,cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all .2s",boxShadow:sel?`0 2px 10px ${color}33`:"none"}}>
                        <div style={{fontSize:22,marginBottom:3}}>{icon}</div>
                        <div style={{fontSize:11,fontWeight:sel?800:500,color:sel?color:DS.mid}}>{v}</div>
                        {sel && <div style={{width:8,height:8,borderRadius:4,background:color,margin:"4px auto 0"}}/>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <MultiCheck label="État du fond" values={f.etatFond} onChange={v=>set("etatFond",v)} options={["Sale","Très sale","Attaque d'algues"]}/>
              <MultiCheck label="État des parois" values={f.etatParois} onChange={v=>set("etatParois",v)} options={["Propre","Sale","Attaque d'algues"]}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <MultiCheck label="État du local" values={f.etatLocal} onChange={v=>set("etatLocal",v)} options={ETAT_LOCAL_OPTIONS}/>
              <MultiCheck label="État du bac tampon" values={f.etatBacTampon} onChange={v=>set("etatBacTampon",v)} options={["Propre","Sale","Passage de balai","Nettoyage au jet d'eau","Nettoyage au Karcher"]}/>
              <MultiCheck label="État du volet / bac" values={f.etatVoletBac} onChange={v=>set("etatVoletBac",v)} options={["Propre","Sale","Passage de balai","Nettoyage au jet d'eau","Nettoyage au karcher"]}/>
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 4 — Correctifs avec Alcafix */}
      {step===4 && !isSimplified && (
        <div className="fade-in">
          <div style={{background:`linear-gradient(135deg,#7c3aed08,#7c3aed12)`,borderRadius:DS.radius,padding:18,border:"1px solid #7c3aed18",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:800,color:"#4f46e5",textTransform:"uppercase",letterSpacing:.8,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:26,height:26,borderRadius:8,background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.chemicals(13,"#fff")}</div>
              Produits apportés
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr",gap:10}}>
              {[
                {k:"corrChlore",l:"Chlore",ico:"🧪",col:"#0891b2"},
                {k:"corrPH",l:"pH",ico:"⚗️",col:"#4f46e5"},
                {k:"corrSel",l:"Sel",ico:"🧂",col:"#64748b"},
                {k:"corrAlgicide",l:"Algicide",ico:"🌿",col:"#16a34a"},
                {k:"corrPeroxyde",l:"Peroxyde",ico:"💧",col:"#0284c7"},
                {k:"corrChloreChoc",l:"Chlore Choc",ico:"⚡",col:"#b45309"},
                {k:"corrPhosphate",l:"Phosphate",ico:"🔬",col:"#be185d"},
                {k:"corrAlcafix",l:"Alcafix",ico:"🧫",col:"#059669"},
                {k:"corrAutre",l:"Autre",ico:"📦",col:"#94a3b8"},
              ].map(({k,l,ico,col})=>(
                <div key={k} style={{background:"#fff",borderRadius:10,padding:"10px 12px",border:"1px solid "+DS.border}}>
                  <div style={{fontSize:10,fontWeight:700,color:col,marginBottom:5,display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:13}}>{ico}</span> {l}
                  </div>
                  <input value={f[k]||""} onChange={e=>set(k,e.target.value)}
                    placeholder={k==="corrSel"?"ex: 2 sacs":k==="corrChlore"?"ex: 200g":"ex: 500ml"}
                    style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1.5px solid "+DS.border,fontSize:13,outline:"none",boxSizing:"border-box",color:DS.dark,fontFamily:"inherit",transition:"all .2s",background:f[k]?col+"08":DS.white}}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{marginTop:8}}>
            <OuiNon label="Devis à faire ?" value={f.devis} onChange={v=>set("devis",v)}/>
          </div>
        </div>
      )}

      {(step===5 || (isSimplified && step===3)) && (
        <div className="fade-in">
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {!isSimplified && <OuiNon label="Prise d'échantillon ?" value={f.priseEchantillon} onChange={v=>set("priseEchantillon",v)}/>}
              {!isSimplified && <div>
                <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:4}}>Commentaires</span>
                <textarea value={f.commentaires} onChange={e=>set("commentaires",e.target.value)} placeholder="Anomalies, recommandations..."
                  style={{width:"100%",padding:"11px 14px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:100,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark,transition:"all .2s"}}/>
              </div>}
              <OuiNon label="Livraison de produits ?" value={f.livraisonProduits} onChange={v=>set("livraisonProduits",v)}/>
              {f.livraisonProduits && (
                <>
                  <MultiCheck label="Produit(s) livré(s)" values={f.produitsLivres} onChange={v=>set("produitsLivres",v)} options={produitsStock&&produitsStock.length>0?produitsStock:PRODUITS_DEFAUT}/>
                  <div>
                    <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:4}}>Autre (quantités, marques…)</span>
                    <textarea value={f.livraisonAutre} onChange={e=>set("livraisonAutre",e.target.value)}
                      style={{width:"100%",padding:"9px 12px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.border,fontSize:13,minHeight:56,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",color:DS.dark}}/>
                  </div>
                </>
              )}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Ressenti de la prestation</span>
                <StarRating value={f.ressenti} onChange={v=>set("ressenti",v)}/>
              </div>
              <OuiNon label="Présence du locataire / propriétaire ?" value={f.presenceClient} onChange={v=>set("presenceClient",v)}/>
              <div style={{borderTop:"1px solid "+DS.border,paddingTop:14}}>
                {(()=>{
                  const filledDepart = [
                    f.photoDepart ? {key:"pd0", label:"Départ", val:f.photoDepart} : null,
                    ...((f.photosDepart||[]).map((v,i)=>v?{key:`pd${i+1}`,label:`Départ ${i+2}`,val:v,idx:i}:null)),
                  ].filter(Boolean);
                  const canAdd = filledDepart.length < 10;

                  const addDepart = (e) => {
                    const files = Array.from(e.target.files||[]).slice(0, 10 - filledDepart.length);
                    if(!files.length) return;
                    let newDepart = f.photoDepart||"";
                    let newExtras = [...(f.photosDepart||[])];
                    let done = 0;
                    files.forEach(file => {
                      const r = new FileReader();
                      r.onload = () => {
                        if (!newDepart) newDepart = r.result;
                        else newExtras = [...newExtras, r.result];
                        done++;
                        if (done === files.length) {
                          set("photoDepart", newDepart);
                          set("photosDepart", newExtras.slice(0,9));
                        }
                      };
                      r.readAsDataURL(file);
                    });
                    e.target.value="";
                  };

                  const removeDepart = (key, idx) => {
                    if (key==="pd0") {
                      // Promouvoir la première extra si dispo
                      const extras = [...(f.photosDepart||[])];
                      set("photoDepart", extras[0]||"");
                      set("photosDepart", extras.slice(1));
                    } else {
                      const arr = [...(f.photosDepart||[])]; arr.splice(idx,1); set("photosDepart",arr);
                    }
                  };

                  return (
                    <div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7}}>
                          Photos départ {filledDepart.length>0&&`(${filledDepart.length}/10)`}
                        </span>
                        {canAdd&&(
                          <label style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:DS.blueSoft,border:"1px solid "+DS.blue+"33",cursor:"pointer",fontSize:12,fontWeight:700,color:DS.blue}}>
                            {Ico.plus(12,DS.blue)} Ajouter
                            <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={addDepart}/>
                          </label>
                        )}
                      </div>
                      {filledDepart.length===0
                        ? <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:18,borderRadius:12,border:"2px dashed "+DS.border,background:DS.light,cursor:"pointer"}}>
                            {Ico.camera(26,DS.mid)}
                            <span style={{fontSize:13,color:DS.mid,fontWeight:600}}>Ajouter des photos au départ</span>
                            <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={addDepart}/>
                          </label>
                        : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
                            {filledDepart.map(p=>(
                              <div key={p.key} style={{position:"relative",borderRadius:10,overflow:"hidden",border:"1px solid "+DS.border}}>
                                <img src={p.val} alt={p.label} style={{width:"100%",height:90,objectFit:"cover",display:"block"}}/>
                                <span style={{position:"absolute",bottom:4,left:5,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.55)",borderRadius:4,padding:"1px 6px"}}>{p.label}</span>
                                <button onClick={()=>removeDepart(p.key,p.idx)} style={{position:"absolute",top:5,right:5,width:24,height:24,borderRadius:12,background:"rgba(0,0,0,0.65)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  {Ico.close(10,"#fff")}
                                </button>
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                  );
                })()}
              </div>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:`linear-gradient(135deg,${DS.greenSoft},#bbf7d0)`,padding:"14px 16px",borderRadius:DS.radiusSm,border:"1.5px solid "+DS.green+"44",marginTop:4,transition:"all .2s"}}>
                <input type="checkbox" checked={f.ok} onChange={e=>set("ok",e.target.checked)} style={{width:20,height:20,accentColor:DS.green}}/>
                <span style={{fontWeight:800,color:"#16a34a",fontSize:14,display:"flex",alignItems:"center",gap:6}}>
                  {Ico.check(16,"#16a34a")} Passage validé et terminé
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {step===6 && !isSimplified && (
        <div className="fade-in">
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>
            <SignaturePad label="Signature du technicien" value={f.signatureTech} onChange={v=>set("signatureTech",v)}/>
            <SignaturePad label="Signature du client / propriétaire" value={f.signatureClient} onChange={v=>set("signatureClient",v)}/>
          </div>
          {(f.photoArrivee||f.photoDepart||(f.photos||[]).some(Boolean)) && (
            <div style={{background:DS.light,borderRadius:DS.radiusSm,padding:14,border:"1px solid "+DS.border,marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>
                Photos jointes ({[f.photoArrivee,f.photoDepart,...(f.photos||[])].filter(Boolean).length}/5)
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
                {f.photoArrivee && (<div style={{position:"relative"}}><img src={f.photoArrivee} alt="Arrivée" style={{width:"100%",height:80,objectFit:"cover",borderRadius:8,border:"1px solid "+DS.border,display:"block"}}/><span style={{position:"absolute",bottom:4,left:5,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.6)",borderRadius:4,padding:"1px 6px"}}>Arrivée</span></div>)}
                {(f.photos||[]).map((ph,i)=>ph?(<div key={i} style={{position:"relative"}}><img src={ph} alt={`Photo ${i+2}`} style={{width:"100%",height:80,objectFit:"cover",borderRadius:8,border:"1px solid "+DS.border,display:"block"}}/><span style={{position:"absolute",bottom:4,left:5,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.6)",borderRadius:4,padding:"1px 6px"}}>Photo {i+2}</span></div>):null)}
                {f.photoDepart && (<div style={{position:"relative"}}><img src={f.photoDepart} alt="Départ" style={{width:"100%",height:80,objectFit:"cover",borderRadius:8,border:"1px solid "+DS.border,display:"block"}}/><span style={{position:"absolute",bottom:4,left:5,fontSize:9,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.6)",borderRadius:4,padding:"1px 6px"}}>Départ</span></div>)}
              </div>
            </div>
          )}
          <div style={{background:`linear-gradient(135deg,#be185d08,#be185d12)`,borderRadius:DS.radius,padding:18,border:"1px solid #be185d18"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#be185d",textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Exporter le rapport</div>
            <div style={{marginBottom:12}}>
              <span style={{fontSize:11,fontWeight:800,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Statut du rapport</span>
              <RapportStatusPicker value={f.rapportStatut} onChange={v=>set("rapportStatut",v)} />
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
              <button onClick={()=>ouvrirRapport(f,client)} className="btn-hover" style={{padding:"14px",borderRadius:DS.radiusSm,background:"#eef2f7",border:"1.5px solid "+DS.border,cursor:"pointer",fontWeight:700,fontSize:14,color:DS.dark,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {Ico.pdf(18,DS.dark)} Télécharger PDF
              </button>
              {client?.email ? (
                <button onClick={()=>envoyerEmail(f,client)} className="btn-hover" style={{padding:"14px",borderRadius:DS.radiusSm,background:DS.blueGrad,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 16px "+DS.blue+"44"}}>
                  {Ico.send(16,"#fff")} Envoyer à {client.email}
                </button>
              ) : (
                <div style={{fontSize:12,color:DS.orange,textAlign:"center",padding:"14px",background:DS.orangeSoft,borderRadius:DS.radiusSm,display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontWeight:600}}>
                  {Ico.alert(13,DS.orange)} Aucun email renseigné
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{display:"flex",gap:10,marginTop:20,paddingTop:14,borderTop:"1px solid "+DS.border,alignItems:"center"}}>
        <button onClick={step===1?onClose:()=>setStep(s=>s-1)} className="btn-hover" style={{minHeight:52,padding:"14px 20px",borderRadius:DS.radiusSm,background:DS.light,border:"1.5px solid "+DS.border,cursor:"pointer",fontWeight:700,fontSize:14,color:DS.mid,fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          {step===1
            ? <><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Annuler</>
            : <><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> Retour</>
          }
        </button>
        <div style={{flex:1}}/>
        {step<STEPS
          ? <button onClick={()=>setStep(s=>s+1)} className="btn-hover" style={{minHeight:52,padding:"14px 24px",borderRadius:DS.radiusSm,background:(STEP_INFO[step]||STEP_INFO[STEPS-1]).color,border:"none",cursor:"pointer",fontWeight:800,fontSize:15,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,boxShadow:`0 4px 16px ${(STEP_INFO[step]||STEP_INFO[STEPS-1]).color}44`,flexShrink:0}}>
              {(STEP_INFO[step]||STEP_INFO[STEPS-1]).l} <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          : <button onClick={handleSave} className="btn-hover" style={{minHeight:52,padding:"14px 24px",borderRadius:DS.radiusSm,background:"linear-gradient(135deg,#059669,#34d399)",border:"none",cursor:"pointer",fontWeight:800,fontSize:15,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px #05996944",flexShrink:0}}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Enregistrer
            </button>
        }
      </div>
    </Modal>
  );
}

// CALENDRIER INTERACTIF
function CalendrierInteractif({ passages, rdvs, clients, onClientClick, onEditPassage, onEditRdv }) {
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
                  <div key={p.id} onClick={()=>onEditPassage&&onEditPassage(p)} className="card-hover" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#eef2f7",borderRadius:8,marginBottom:4,border:"1.5px solid "+DS.blue+"33",cursor:"pointer"}}>
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
                  <div key={r.id} onClick={()=>onEditRdv&&onEditRdv(r)} className="card-hover" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#eef2f7",borderRadius:8,marginBottom:4,border:"none",cursor:"pointer"}}>
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

// ALERTES COLLAPSIBLE
function AlertesBlock({ alertes, passages, onClientClick }) {
  const [open, setOpen] = useState(false);
  const preview = alertes.slice(0, 2);
  const isMobile = useIsMobile();
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
            const al=alerteClient(c,passages); const col=AC[al];
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
            const al=alerteClient(c,passages); const col=AC[al]; const j=daysUntil(c.dateFin);
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

// DASHBOARD  Bannire tches + RDV
function Dashboard({ clients, passages, rdvs=[], onClientClick, onAddPassage, onAddLivraison, onAddClient, onAddRdv, onEditPassage, onEditRdv }) {
  const isMobile = useIsMobile();
  const moisCourant = MOIS_NOW;
  const saisonNow = getSaison(moisCourant);
  const sMeta = SAISONS_META[saisonNow];
  const [showAllTaches, setShowAllTaches] = useState(false);

  // Tâches à effectuer ce mois
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

  // RDVs à venir
  const rdvsFuturs = rdvs.filter(r=>r.date>=TODAY).sort((a,b)=>a.date===b.date?(a.heure||"").localeCompare(b.heure||""):a.date.localeCompare(b.date));
  const rdvsToday = rdvsFuturs.filter(r=>r.date===TODAY);
  const rdvsProchains = rdvsFuturs.filter(r=>r.date>TODAY).slice(0,5);

  return (
    <div>
      {/* Widget passages du mois — redesigné */}
      <div style={{marginBottom:14,borderRadius:DS.radius,overflow:"hidden",boxShadow:DS.nmShadow,border:"none"}}>
        {/* Header */}
        <div style={{background:"#eef2f7",padding:"14px 18px 12px",borderBottom:"1px solid #dde8f0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:DS.dark,letterSpacing:-0.5}}>{MOIS_L[moisCourant]} {YEAR_NOW}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",marginTop:2}}>
                {totalTaches>0
                  ? <><span style={{background:"#fef9c3",color:"#92400e",padding:"2px 10px",borderRadius:20,fontWeight:800,fontSize:13,border:"1px solid #fde68a"}}>{totalTaches}</span><span style={{marginLeft:6,color:DS.mid,fontSize:13}}>passage{totalTaches>1?"s":""} restant{totalTaches>1?"s":""}</span></>
                  : <span style={{color:DS.green,fontWeight:600}}>✅ Tous les passages sont effectués</span>}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Tag color={sMeta.color} bg={sMeta.bg}>{sMeta.label}</Tag>
              {tachesRestantes.length>PREVIEW&&(
                <button onClick={()=>setShowAllTaches(v=>!v)} style={{width:32,height:32,borderRadius:10,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.1)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:18,fontWeight:900,fontFamily:"inherit"}}>
                  {showAllTaches?"−":"+"}
                </button>
              )}
            </div>
          </div>
          {/* Barre de progression globale */}
          {tachesMois.length>0&&(()=>{
            const total = tachesMois.reduce((a,t)=>a+t.prevE+t.prevC,0);
            const done = tachesMois.reduce((a,t)=>a+t.effE+t.effC,0);
            const pct = total>0?Math.round(done/total*100):100;
            return (
              <div style={{marginTop:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,color:DS.mid,fontWeight:600}}>Avancement global</span>
                  <span style={{fontSize:12,fontWeight:800,color:pct>=100?DS.green:"#b45309"}}>{pct}%</span>
                </div>
                <div style={{height:5,background:"#dde8f0",borderRadius:99,overflow:"hidden",boxShadow:"inset 1px 1px 3px rgba(166,210,220,0.4)"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:pct>=100?"#34d399":"linear-gradient(90deg,#fbbf24,#f59e0b)",borderRadius:99,transition:"width .5s"}}/>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Liste passages restants */}
        {tachesRestantes.length>0&&(
          <div style={{background:"#eef2f7"}}>
            {tachesRestantes.slice(0, showAllTaches?999:PREVIEW).map(({client,restE,restC,effE,prevE,effC,prevC},i)=>{
              const pct2 = (prevE+prevC)>0?Math.round((effE+effC)/(prevE+prevC)*100):0;
              return (
                <div key={client.id} onClick={()=>onClientClick(client)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",
                    borderBottom:i<Math.min(tachesRestantes.length,showAllTaches?999:PREVIEW)-1?"1px solid "+DS.border:"none",
                    cursor:"pointer",background:"#eef2f7",transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#e4eef5"}
                  onMouseLeave={e=>e.currentTarget.style.background="#eef2f7"}>
                  <Avatar nom={client.nom} size={36} photo={client.photoPiscine}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:DS.dark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{client.nom}</div>
                    <div style={{display:"flex",gap:8,marginTop:3,alignItems:"center"}}>
                      {prevE>0&&<span style={{fontSize:11,fontWeight:700,color:restE>0?DS.orange:DS.green}}>🔧 {effE}/{prevE}</span>}
                      {prevC>0&&<span style={{fontSize:11,fontWeight:700,color:restC>0?DS.teal:DS.green}}>💧 {effC}/{prevC}</span>}
                      <div style={{flex:1,height:3,background:DS.light,borderRadius:99,overflow:"hidden",maxWidth:60}}>
                        <div style={{height:"100%",width:`${pct2}%`,background:pct2>=100?DS.green:"#f59e0b",borderRadius:99}}/>
                      </div>
                    </div>
                  </div>
                  <div style={{background:"#fef3c7",color:"#b45309",fontSize:12,fontWeight:800,padding:"3px 10px",borderRadius:20,border:"1px solid #fcd34d",flexShrink:0}}>
                    {restE+restC} rest.
                  </div>
                </div>
              );
            })}
            {/* Bouton voir tout */}
            {!showAllTaches&&tachesRestantes.length>PREVIEW&&(
              <button onClick={()=>setShowAllTaches(true)}
                style={{width:"100%",padding:"10px",border:"none",borderTop:"1px solid "+DS.border,background:DS.light,cursor:"pointer",fontSize:13,fontWeight:700,color:DS.blue,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Voir {tachesRestantes.length-PREVIEW} autres clients
              </button>
            )}
            {showAllTaches&&tachesRestantes.length>PREVIEW&&(
              <button onClick={()=>setShowAllTaches(false)}
                style={{width:"100%",padding:"10px",border:"none",borderTop:"1px solid "+DS.border,background:DS.light,cursor:"pointer",fontSize:13,fontWeight:700,color:DS.mid,fontFamily:"inherit"}}>
                Réduire
              </button>
            )}
          </div>
        )}

        {/* Clients à jour */}
        {tachesRestantes.length===0&&tachesOk.length>0&&(
          <div style={{padding:"12px 16px",background:DS.greenSoft}}>
            <div style={{fontSize:13,fontWeight:600,color:DS.green}}>Tous les {tachesOk.length} clients sont à jour ce mois-ci 🎉</div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:10,marginBottom:14}}>
        <BtnPrimary onClick={onAddPassage} bg={DS.blueGrad} icon={Ico.clipboard(14,"#fff")} style={{width:"100%",fontSize:13,padding:"11px 8px",borderRadius:14}}>Passage</BtnPrimary>
        <BtnPrimary onClick={()=>onAddLivraison()} bg={DS.blueGrad} icon={Ico.truck(14,"#fff")} style={{width:"100%",fontSize:13,padding:"11px 8px",borderRadius:14}}>Livraison</BtnPrimary>
        <BtnPrimary onClick={onAddRdv} bg={DS.blueGrad} icon={Ico.rdv(14,"#fff")} style={{width:"100%",fontSize:13,padding:"11px 8px",borderRadius:14}}>RDV</BtnPrimary>
      </div>

      {/* RDVs Aujourd'hui */}
      {rdvsToday.length>0 && (
        <Card style={{marginBottom:14,border:"none"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <IcoBubble ico={Ico.rdv(14,DS.purple)} color={DS.purple} size={30}/>
            <span style={{fontWeight:800,fontSize:14,color:DS.dark}}>Aujourd'hui</span>
          </div>
          {rdvsToday.map(r=>{
            const c = clients.find(x=>x.id===r.clientId);
            return (
              <div key={r.id} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+DS.border}}>
                <div style={{width:42,textAlign:"center"}}>
                  <div style={{fontSize:15,fontWeight:900,color:DS.purple}}>{r.heure||"--:--"}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13,color:DS.dark}}>{r.type}</div>
                  {c&&<div style={{fontSize:11,color:DS.mid,marginTop:1}}>{c.nom} · {c.adresse?.split(",").pop()?.trim()}</div>}
                  {r.description&&<div style={{fontSize:11,color:DS.mid}}>{r.description}</div>}
                </div>
                <Tag color={DS.purple}>{r.duree||60} min</Tag>
              </div>
            );
          })}
        </Card>
      )}

      {/* RDVs à venir */}
      {rdvsProchains.length>0 && (
        <Card style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <IcoBubble ico={Ico.calendar(14,DS.blue)} color={DS.blue} size={30}/>
            <span style={{fontWeight:800,fontSize:14,color:DS.dark}}>Prochains RDV</span>
          </div>
          {rdvsProchains.map(r=>{
            const c = clients.find(x=>x.id===r.clientId);
            const d = new Date(r.date);
            return (
              <div key={r.id} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+DS.border}}>
                <div style={{width:46,textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:10,fontWeight:700,color:DS.mid,textTransform:"uppercase"}}>{d.toLocaleDateString("fr",{weekday:"short"})}</div>
                  <div style={{fontSize:18,fontWeight:900,color:DS.dark,lineHeight:1}}>{d.getDate()}</div>
                  <div style={{fontSize:10,color:DS.mid}}>{MOIS[d.getMonth()+1]}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13,color:DS.dark,display:"flex",alignItems:"center",gap:6}}>{r.heure||""} — {r.type}</div>
                  {c&&<div style={{fontSize:11,color:DS.mid,marginTop:1}}>{c.nom}</div>}
                  {r.description&&<div style={{fontSize:11,color:DS.mid}}>{r.description}</div>}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* Mini calendar INTERACTIF */}
      <CalendrierInteractif passages={passages} rdvs={rdvs} clients={clients} onClientClick={onClientClick} onEditPassage={onEditPassage} onEditRdv={onEditRdv}/>

      {/* Alertes collapsible */}
      {(()=>{
        const alertes = clients.filter(c=>alerteClient(c,passages)!=="ok");
        if (alertes.length===0) return null;
        return <AlertesBlock alertes={alertes} passages={passages} onClientClick={onClientClick}/>;
      })()}
    </div>
  );
}

// PAGE CLIENTS
function PageClients({ clients, passages, contrats={}, onUpdateContrat, onClientClick, onAdd }) {
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();
  const filtered = useMemo(()=>clients.filter(c=>c.nom.toLowerCase().includes(search.toLowerCase())||c.adresse?.toLowerCase().includes(search.toLowerCase())),[clients,search]);
  const totalAll = clients.length;
  const alertCount = clients.filter(c=>alerteClient(c,passages)!=="ok").length;

  const CONTRAT_STATUTS = [
    { key:"aucun",         label:"Aucun contrat",         color:"#9ca3af", bg:"#f9fafb", border:"#e5e7eb" },
    { key:"cree",          label:"📄 Contrat créé",       color:"#0891b2", bg:"#e0f2fe", border:"#7dd3fc" },
    
    { key:"demande_envoyee",label:"📨 Contrat envoyé",    color:"#0891b2", bg:"#f0f9ff", border:"#bae6fd" },
    { key:"signe_client",  label:"📝 En attente co-sign.", color:"#4f46e5", bg:"#eef2ff", border:"#a5b4fc" },
    { key:"signe_complet", label:"✅ Contrat signé",      color:"#059669", bg:"#f0fdf4", border:"#86efac" },
    { key:"renouveler",    label:"🔄 À renouveler",       color:"#b45309", bg:"#fef3c7", border:"#fcd34d" },
    { key:"suspendu",      label:"⏸ Suspendu",            color:"#dc2626", bg:"#fff1f2", border:"#fda4af" },
  ];

  const [openPicker, setOpenPicker] = useState(null); // clientId du picker ouvert

  const getContrat = (clientId) =>
    contrats["CT-"+clientId]
    || Object.values(contrats).find(c=>c.clientId===clientId)
    || null;

  const getStatutMeta = (clientId) => {
    const ct = getContrat(clientId);
    const key = ct?.statut || "aucun";
    return CONTRAT_STATUTS.find(s=>s.key===key) || CONTRAT_STATUTS[0];
  };

  const setStatut = (clientId, key) => {
    const contractId = "CT-"+clientId;
    if (onUpdateContrat) onUpdateContrat(contractId, { clientId, statut: key === "prepare" ? "cree" : key });
    setOpenPicker(null);
  };

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <div style={{flex:1,background:"linear-gradient(135deg,#0891b2,#06b6d4)",borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:10,boxShadow:"4px 4px 12px rgba(8,145,178,0.35), -2px -2px 6px rgba(255,255,255,0.5)"}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.clients(16,"#fff")}</div>
          <div><div style={{fontSize:18,fontWeight:800,color:"#fff"}}>{totalAll}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.6)"}}>Clients</div></div>
        </div>
        {alertCount>0&&<div style={{background:"#eef2f7",borderRadius:DS.radiusSm,padding:"10px 14px",display:"flex",alignItems:"center",gap:8,border:"1px solid #fecaca"}}>
          <div style={{width:36,height:36,borderRadius:10,background:"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.alert(15,DS.red)}</div>
          <div><div style={{fontSize:18,fontWeight:800,color:DS.red}}>{alertCount}</div><div style={{fontSize:11,color:DS.red,fontWeight:600}}>Alertes</div></div>
        </div>}
      </div>
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <div style={{flex:1,position:"relative"}}>
          <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>{Ico.search(16,"#94a3b8")}</div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
            style={{width:"100%",padding:"11px 14px 11px 40px",borderRadius:DS.radius,border:"none",fontSize:13,outline:"none",boxSizing:"border-box",background:"#eef2f7",boxShadow:"inset 3px 3px 6px rgba(166,210,220,0.45), inset -2px -2px 5px rgba(255,255,255,0.8)",color:DS.dark,fontFamily:"inherit"}}/>
        </div>
        <BtnPrimary onClick={onAdd} bg={DS.blueGrad} icon={Ico.userPlus(14,"#fff")} style={{flexShrink:0,padding:"10px 16px",fontSize:13,borderRadius:14,boxShadow:"4px 4px 12px rgba(8,145,178,0.3)"}}>
          {!isMobile && "Nouveau"}
        </BtnPrimary>
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",color:DS.mid,padding:40,fontSize:13}}>Aucun client trouvé</div>}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10}}>
        {filtered.map((c,idx)=>{
          const al=alerteClient(c,passages); const col=AC[al];
          const mpm=c.moisParMois||c.saisons||{};
          const tE=totalAnnuel(mpm,"entretien"), tC=totalAnnuel(mpm,"controle"), tot=tE+tC;
          const cs=c.dateDebut?c.dateDebut.slice(0,10):null; const ce=c.dateFin?c.dateFin.slice(0,10):null;
          const inC=(p)=>{const ds=String(p.date).slice(0,10);return cs&&ce?ds>=cs&&ds<=ce:new Date(p.date).getFullYear()===YEAR_NOW;};
          const eE=passages.filter(p=>p.clientId===c.id&&inC(p)&&isEntretienType(p.type)).length;
          const eC=passages.filter(p=>p.clientId===c.id&&inC(p)&&isControleType(p.type)).length;
          const eff=eE+eC;
          const pct=tot>0?Math.round(eff/tot*100):0;
          const rest=Math.max(0,tot-eff);
          const accentColor=al==="rouge"?DS.red:al==="jaune"?"#d97706":al==="orange"?"#d97706":DS.green;
          return (
            <div key={c.id} onClick={()=>onClientClick(c)} className="fade-in card-hover"
              style={{animationDelay:`${idx*0.03}s`,background:"#eef2f7",borderRadius:DS.radius,
                overflow:openPicker===c.id?"visible":"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                border:"1px solid "+DS.border,borderTop:"2px solid "+accentColor,
                cursor:"pointer",display:"flex",flexDirection:"column",position:"relative",zIndex:openPicker===c.id?999:1}}>
              {c.photoPiscine&&(
                <div style={{height:72,background:`url(${c.photoPiscine}) center/cover`,position:"relative",flexShrink:0}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.35))"}}/>
                </div>
              )}
              <div style={{padding:"12px",flex:1,display:"flex",flexDirection:"column",gap:7}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                  <Avatar nom={c.nom} size={34}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:DS.dark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom}</div>
                    <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                      <span style={{background:"#f1f5f9",color:DS.mid,padding:"1px 7px",borderRadius:20,fontWeight:600,fontSize:10,border:"1px solid "+DS.border}}>{c.formule}</span>
                      {c.bassin&&<span style={{background:DS.light,color:DS.mid,padding:"1px 6px",borderRadius:20,fontWeight:500,fontSize:10}}>{c.bassin}</span>}
                    </div>
                  </div>
                  <Tag color={col.tx} bg={col.bg} style={{fontSize:9,fontWeight:700,flexShrink:0,padding:"2px 6px"}}>{col.lbl}</Tag>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:3}}>
                  <div style={{textAlign:"center",padding:"4px 2px",borderRadius:6,background:"#f8fafc",border:"1px solid "+DS.border}}>
                    <div style={{fontSize:13,fontWeight:800,color:DS.blue}}>{eE}<span style={{fontSize:9,color:DS.mid}}>/{tE}</span></div>
                    <div style={{fontSize:9,color:DS.mid}}>Entret.</div>
                  </div>
                  <div style={{textAlign:"center",padding:"4px 2px",borderRadius:6,background:"#f8fafc",border:"1px solid "+DS.border}}>
                    <div style={{fontSize:13,fontWeight:800,color:DS.teal}}>{eC}<span style={{fontSize:9,color:DS.mid}}>/{tC}</span></div>
                    <div style={{fontSize:9,color:DS.mid}}>Contrôl.</div>
                  </div>
                  <div style={{textAlign:"center",padding:"4px 2px",borderRadius:6,background:"#f8fafc",border:"1px solid "+DS.border}}>
                    <div style={{fontSize:13,fontWeight:800,color:rest>0?"#b45309":DS.green}}>{pct}<span style={{fontSize:9,color:DS.mid}}>%</span></div>
                    <div style={{fontSize:9,color:DS.mid}}>{rest>0?rest+" rest.":"À jour"}</div>
                  </div>
                </div>
                {tot>0&&<div style={{height:3,background:DS.light,borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:pct>=100?"#059669":pct>=50?"#0891b2":"#f59e0b",borderRadius:99}}/>
                </div>}
                {/* Badge statut contrat — cliquable */}
                {(()=>{
                  const meta = getStatutMeta(c.id);
                  const isOpen = openPicker===c.id;
                  return (
                    <div style={{position:"relative"}}>
                      <button onClick={e=>{e.stopPropagation();setOpenPicker(isOpen?null:c.id);}}
                        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 8px",borderRadius:6,background:meta.bg,border:"1px solid "+meta.border,cursor:"pointer",fontFamily:"inherit"}}>
                        <span style={{fontSize:10,fontWeight:700,color:meta.color}}>{meta.label}</span>
                        <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      {isOpen&&(
                        <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#eef2f7",borderRadius:8,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",border:"1px solid "+DS.border,zIndex:100,overflow:"auto",maxHeight:220}}>
                          {CONTRAT_STATUTS.map(s=>(
                            <button key={s.key} onClick={()=>setStatut(c.id,s.key)}
                              style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"7px 10px",background:meta.key===s.key?s.bg:DS.white,border:"none",cursor:"pointer",fontFamily:"inherit",borderBottom:"1px solid "+DS.light}}>
                              <span style={{fontSize:11,fontWeight:meta.key===s.key?700:500,color:meta.key===s.key?s.color:DS.dark}}>{s.label}</span>
                              {meta.key===s.key&&<svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:"auto"}}><polyline points="20 6 9 17 4 12"/></svg>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// MODAL APERCU PASSAGE
function PassageDetailModal({ passage, client, onClose }) {
  const isMobile = useIsMobile();
  if (!passage) return null;

  const val = (v, u="") => (v!==""&&v!==null&&v!==undefined) ? `${v}${u?" "+u:""}` : "—";
  const ouiNon = (v) => v===true ? "✅ Oui" : v===false ? "❌ Non" : "—";
  const liste = (arr) => Array.isArray(arr)&&arr.length ? arr.join(", ") : (arr||"—");
  const etoiles = (n) => n>0 ? "★".repeat(n)+"☆".repeat(5-n)+" "+n+"/5" : "—";

  const photos = [
    passage.photoArrivee ? {src:passage.photoArrivee, label:"Arrivée"} : null,
    ...((passage.photos||[]).filter(Boolean).map((src,i)=>({src, label:`Arrivée ${i+2}`}))),
    passage.photoDepart ? {src:passage.photoDepart, label:"Départ"} : null,
    ...((passage.photosDepart||[]).filter(Boolean).map((src,i)=>({src, label:`Départ ${i+2}`}))),
  ].filter(Boolean);

  const rapportStatus = getRapportStatus(passage);
  const rapportMeta = RAPPORT_STATUS[rapportStatus];
  const isCtrl = isControleType(passage.type);

  const Block = ({title, icon, color=DS.blue, children}) => (
    <div style={{borderRadius:DS.radiusSm,overflow:"hidden",border:"1px solid "+DS.border,marginBottom:12}}>
      <div style={{background:color+"12",borderBottom:"1px solid "+color+"22",padding:"9px 14px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:14}}>{icon}</span>
        <span style={{fontSize:12,fontWeight:800,color,textTransform:"uppercase",letterSpacing:.7}}>{title}</span>
      </div>
      <div style={{padding:"12px 14px",background:"#eef2f7"}}>{children}</div>
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
      <Block title="Intervention" icon="🔧" color={DS.blue}>
        <Row label="Type" value={passage.type||"—"}/>
        <Row label="Technicien" value={passage.tech||"—"}/>
        {passage.actions&&<Row label="Actions" value={passage.actions}/>}
        {passage.obs&&<Row label="Observations" value={passage.obs} color={DS.orange}/>}
      </Block>

      {/* Analyses */}
      {(passage.chloreLibre||passage.ph||passage.alcalinite||passage.stabilisant||passage.tChlore||passage.tPH||passage.tSel||passage.tPhosphate||passage.tStabilisant) && (
        <Block title="Analyses eau" icon="💧" color={DS.teal}>
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
        <Block title="État bassin" icon="🏊" color={DS.green}>
          {passage.qualiteEau&&<Row label="Qualité eau" value={passage.qualiteEau}/>}
          {(passage.etatFond||[]).length>0&&<Row label="Fond" value={liste(passage.etatFond)}/>}
          {(passage.etatParois||[]).length>0&&<Row label="Parois" value={liste(passage.etatParois)}/>}
          {(passage.etatLocal||[]).length>0&&<Row label="Local" value={liste(passage.etatLocal)}/>}
        </Block>
      )}

      {/* Correctifs */}
      {(passage.corrChlore||passage.corrPH||passage.corrSel||passage.corrAlgicide||passage.corrAlcafix||passage.corrAutre) && (
        <Block title="Correctifs apportés" icon="⚗️" color={DS.purple}>
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
      <Block title="Clôture" icon="✅" color={DS.orange}>
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
        <Block title={`Photos (${photos.length})`} icon="📸" color={DS.mid}>
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
        <Block title="Signatures" icon="✍️" color={DS.mid}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
            {passage.signatureTech&&<div><div style={{fontSize:10,fontWeight:700,color:DS.mid,marginBottom:6}}>TECHNICIEN</div><img src={passage.signatureTech} style={{width:"100%",maxHeight:60,objectFit:"contain",borderRadius:8,border:"1px solid "+DS.border,background:"#fafafa"}}/></div>}
            {passage.signatureClient&&<div><div style={{fontSize:10,fontWeight:700,color:DS.mid,marginBottom:6}}>CLIENT</div><img src={passage.signatureClient} style={{width:"100%",maxHeight:60,objectFit:"contain",borderRadius:8,border:"1px solid "+DS.border,background:"#fafafa"}}/></div>}
          </div>
        </Block>
      )}
    </Modal>
  );
}

// PAGE PASSAGES
function PagePassages({ clients, passages, onAdd, onDelete, onEdit, onUpdatePassageStatus }) {
  const [filter,setFilter]=useState("mois");
  const [detailPassage, setDetailPassage] = useState(null);
  const now=new Date();
  const filtered=useMemo(()=>{
    return passages.filter(p=>{
      const d=new Date(p.date);
      if(filter==="semaine") return (now-d)/86400000<=7&&d<=now;
      if(filter==="mois") return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
      return true;
    }).sort((a,b)=>new Date(b.date)-new Date(a.date));
  },[passages,filter]);

  const counts = useMemo(()=>({
    semaine: passages.filter(p=>{const d=new Date(p.date);return (now-d)/86400000<=7&&d<=now;}).length,
    mois: passages.filter(p=>{const d=new Date(p.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).length,
    tout: passages.length,
  }),[passages]);

  return (
    <div>
      {/* Header Rapports avec logo */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <IconFiche size={26} color="#0891b2"/>
        <span style={{fontWeight:800,fontSize:17,color:DS.dark}}>Rapports</span>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
        <div style={{display:"flex",gap:6,flex:1,background:DS.light,borderRadius:DS.radius,padding:4}}>
          {[["semaine","7 jours",Ico.clock],[" mois","Ce mois",Ico.calendar],["tout","Tout",Ico.clipboard]].map(([v,l,ico])=>{
            const key=v.trim(); const active=filter===key;
            return (
              <button key={key} onClick={()=>setFilter(key)} className="btn-hover" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 4px",borderRadius:DS.radiusSm,border:"none",cursor:"pointer",fontFamily:"inherit",background:active?DS.white:"transparent",color:active?DS.dark:DS.mid,boxShadow:active?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all .2s"}}>
                <span style={{fontWeight:800,fontSize:16,color:active?DS.blue:DS.mid}}>{counts[key]}</span>
                <span style={{fontSize:10,fontWeight:active?700:500}}>{l}</span>
              </button>
            );
          })}
        </div>
        <button onClick={onAdd} className="btn-hover" style={{flexShrink:0,padding:"9px 12px",background:DS.blue,border:"none",borderRadius:DS.radiusSm,cursor:"pointer",display:"flex",alignItems:"center",gap:7,fontFamily:"inherit",fontWeight:700,fontSize:13,color:"#fff"}}>
          <IconFiche size={16} color="#fff"/>
          Rapport
        </button>
      </div>
      {filtered.length===0
        ? <div style={{textAlign:"center",color:DS.mid,padding:40,fontSize:13}}>Aucun passage sur cette période</div>
        : <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map((p,idx)=>{
            const c=clients.find(x=>x.id===p.clientId);
            const phOk=p.ph>=7&&p.ph<=7.6, clOk=p.chlore>=0.5&&p.chlore<=3;
            const isCtrl = isControleType(p.type);
            const rapportStatus = getRapportStatus(p);
            const rapportMeta = RAPPORT_STATUS[rapportStatus];
            return (
              <Card key={p.id} className="fade-in" style={{animationDelay:`${idx*0.05}s`}}>
                <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <Avatar nom={c?.nom||"?"} size={42} photo={c?.photoPiscine}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:13,color:DS.dark}}>{c?.nom||p.clientId}</div>
                        <div style={{fontSize:11,color:DS.mid,marginTop:1,display:"flex",alignItems:"center",gap:4}}>
                          {new Date(p.date).toLocaleDateString("fr",{weekday:"short",day:"2-digit",month:"short"})}
                          {p.tech&&<><span>·</span>{Ico.user(10,DS.mid)}<span>{p.tech}</span></>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:3,alignItems:"center"}}>
                        {p.ok?<IcoBubble ico={Ico.check(11,DS.green)} color={DS.green} size={24}/>:<IcoBubble ico={Ico.x(11,DS.red)} color={DS.red} size={24}/>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap",alignItems:"center"}}>
                      <Tag color={isCtrl?DS.teal:DS.blue} style={{fontSize:11}}>
                        <span style={{display:"flex",alignItems:"center",gap:4}}>
                          {isCtrl ? Ico.drop(11,DS.teal) : Ico.wrench(11,DS.blue)} {p.type}
                        </span>
                      </Tag>
                      {p.ph&&<Tag color={phOk?DS.green:DS.red} style={{fontSize:11}}>pH {p.ph}</Tag>}
                      {p.chlore&&<Tag color={clOk?DS.green:DS.red} style={{fontSize:11}}>Cl {p.chlore}</Tag>}
                      <Tag color={rapportMeta.color} bg={rapportMeta.bg} style={{fontSize:11}}>{rapportMeta.label}</Tag>
                    </div>
                    {(p.photoArrivee||p.photoDepart) && (
                      <div style={{display:"flex",gap:6,marginBottom:6}}>
                        {p.photoArrivee && (<div style={{position:"relative"}}><img src={p.photoArrivee} alt="Arrivée" style={{height:48,width:72,objectFit:"cover",borderRadius:7,border:"1px solid "+DS.border}}/><span style={{position:"absolute",bottom:2,left:3,fontSize:8,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.55)",borderRadius:3,padding:"1px 4px"}}>Arr.</span></div>)}
                        {p.photoDepart && (<div style={{position:"relative"}}><img src={p.photoDepart} alt="Départ" style={{height:48,width:72,objectFit:"cover",borderRadius:7,border:"1px solid "+DS.border}}/><span style={{position:"absolute",bottom:2,left:3,fontSize:8,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.55)",borderRadius:3,padding:"1px 4px"}}>Dép.</span></div>)}
                      </div>
                    )}
                    
                    
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:6,marginTop:10,paddingTop:10,borderTop:"1px solid "+DS.border}}>
                      <button onClick={()=>setDetailPassage(p)} className="btn-hover" style={{padding:"10px",borderRadius:10,background:DS.light,border:"1px solid "+DS.border,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.dark,fontFamily:"inherit",fontWeight:700}}>
                        {Ico.search(13,DS.mid)} Aperçu
                      </button>
                      <button onClick={()=>ouvrirRapport(p,c)} className="btn-hover" style={{padding:"10px",borderRadius:10,background:DS.blueSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.blue,fontFamily:"inherit",fontWeight:700,boxShadow:"0 1px 4px "+DS.blue+"22"}}>
                        {Ico.pdf(14,DS.blue)} Rapport PDF
                      </button>
                      {c?.email
                        ? <button onClick={()=>envoyerEmail(p,c,onUpdatePassageStatus)} className="btn-hover" style={{padding:"10px",borderRadius:10,background:DS.greenSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.green,fontFamily:"inherit",fontWeight:700}}>
                            {Ico.send(13,DS.green)} Envoyer email
                          </button>
                        : <div style={{borderRadius:10,background:DS.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:DS.mid,fontWeight:500}}>{Ico.mail(12,DS.mid)} Pas d'email</div>
                      }
                      <button onClick={()=>onEdit(p)} className="btn-hover" style={{padding:"10px",borderRadius:10,background:DS.light,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.mid,fontFamily:"inherit",fontWeight:700}}>
                        {Ico.edit(13,DS.mid)} Modifier
                      </button>
                      <button onClick={()=>showConfirm("Supprimer ce passage ?",()=>onDelete(p.id))} className="btn-hover" style={{padding:"10px",borderRadius:10,background:DS.redSoft,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color:DS.red,fontFamily:"inherit",fontWeight:700}}>
                        {Ico.trash(13,DS.red)} Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      }
      {detailPassage && <PassageDetailModal passage={detailPassage} client={clients.find(x=>x.id===detailPassage.clientId)} onClose={()=>setDetailPassage(null)}/>}
    </div>
  );
}
function PageRdv({ clients, rdvs, onAdd, onEdit, onDelete }) {
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
          <button key={v} onClick={()=>setFilter(v)} className="btn-hover" style={{padding:"7px 16px",borderRadius:20,border:filter===v?"none":"1px solid "+DS.border,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",background:filter===v?DS.blue:DS.white,color:filter===v?"#fff":DS.mid,boxShadow:"none",border:filter===v?"none":"1px solid "+DS.border}}>{l}</button>
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

// AUTH
const AUTH = { email: "briblue83@hotmail.com", code: "2004" };

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const isMobile = useIsMobile();

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
    <div style={{minHeight:"100vh",background:"#eef2f7",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"'Inter', -apple-system, system-ui, sans-serif",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-30%",right:"-20%",width:"60vw",height:"60vw",borderRadius:"50%",background:"radial-gradient(circle, #0284c720 0%, transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-20%",left:"-15%",width:"50vw",height:"50vw",borderRadius:"50%",background:"radial-gradient(circle, #7c3aed15 0%, transparent 70%)",pointerEvents:"none"}}/>

      <div className="scale-in" style={{marginBottom:32,display:"flex",flexDirection:"column",alignItems:"center",gap:12,position:"relative"}}>
        <div style={{width:80,height:80,borderRadius:24,background:"#0891b2",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"6px 6px 16px rgba(8,145,178,0.4), -4px -4px 10px rgba(255,255,255,0.4)"}}>{Ico.wave(42,"white")}</div>
        <div style={{textAlign:"center"}}>
          <div style={{fontWeight:900,fontSize:28,color:DS.dark,letterSpacing:-1}}>BRIBLUE</div>
          <div style={{color:DS.mid,fontSize:12,marginTop:2,fontWeight:500}}>Création · Traitement de l'eau · Installation · Dépannage</div>
        </div>
      </div>
      <div className="fade-in" style={{width:"100%",maxWidth:400,background:"#eef2f7",borderRadius:DS.radiusLg,padding:28,boxShadow:"8px 8px 24px rgba(166,210,220,0.7), -5px -5px 16px rgba(255,255,255,0.9)",border:"none",position:"relative"}}>
        <div style={{marginBottom:24}}>
          <div style={{fontWeight:800,fontSize:18,color:DS.dark}}>Connexion Technicien</div>
          <div style={{color:DS.mid,fontSize:13,marginTop:4}}>Accès réservé à l'équipe BRIBLUE</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Adresse email</label>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>{Ico.mail(15,"#9ca3af")}</div>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="briblue83@hotmail.com" onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{width:"100%",padding:"12px 14px 12px 38px",borderRadius:DS.radiusSm,border:"none",fontSize:14,outline:"none",boxSizing:"border-box",color:DS.dark,fontFamily:"inherit",background:"#eef2f7",boxShadow:"inset 3px 3px 6px rgba(166,210,220,0.45), inset -2px -2px 5px rgba(255,255,255,0.8)"}}/>
            </div>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:.7,display:"block",marginBottom:6}}>Code d'accès</label>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>{Ico.user(15,"#9ca3af")}</div>
              <input type={showCode?"text":"password"} value={code} onChange={e=>{setCode(e.target.value);setErr("");}} placeholder="••••" onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{width:"100%",padding:"12px 44px 12px 38px",borderRadius:DS.radiusSm,border:"none",fontSize:14,outline:"none",boxSizing:"border-box",color:DS.dark,fontFamily:"inherit",background:"#eef2f7",boxShadow:"inset 3px 3px 6px rgba(166,210,220,0.45), inset -2px -2px 5px rgba(255,255,255,0.8)"}}/>
              <button onClick={()=>setShowCode(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:2}}>
                {showCode ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </div>
          {err && <div style={{background:DS.redSoft,color:DS.red,borderRadius:10,padding:"9px 12px",fontSize:13,display:"flex",alignItems:"center",gap:6,fontWeight:600}}>{Ico.alert(13,DS.red)} {err}</div>}
          <BtnPrimary onClick={handleLogin} style={{width:"100%",marginTop:4,padding:"14px",fontSize:15,background:loading?"#93c5fd":DS.dark,cursor:loading?"not-allowed":"pointer"}}>
            {loading ? <><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{animation:"pulse 1s infinite"}}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Connexion…</> : <>{Ico.next(16,"#fff")} Se connecter</>}
          </BtnPrimary>
        </div>
      </div>
      <div style={{marginTop:20,color:"#94a3b8",fontSize:11,textAlign:"center",fontWeight:500}}>BRIBLUE · SIRET 84345436400053 · La Seyne-sur-Mer</div>
    </div>
  );
}

// APP ROOT
function ModalStock({ stock, onClose, onUpdateStock, onAddProduit, onDeleteProduit }) {
  const [newProduit, setNewProduit] = useState("");
  const produitsListe = Object.keys(stock);

  return (
    <Modal title="📦 Stock produits" onClose={onClose} wide>
      <Section title="Ajouter un produit personnalisé">
        <div style={{display:"flex",gap:8,flexWrap:"wrap",width:"100%"}}>
          <input value={newProduit} onChange={e=>setNewProduit(e.target.value)} placeholder="Nom du produit..."
            onKeyDown={e=>e.key==="Enter"&&newProduit.trim()&&(onAddProduit(newProduit.trim()),setNewProduit(""))}
            style={{flex:"1 1 140px",minWidth:0,width:"100%",padding:"11px 14px",borderRadius:DS.radiusSm,border:"none",fontSize:14,outline:"none",fontFamily:"inherit",color:DS.dark,boxSizing:"border-box",boxShadow:"inset 3px 3px 6px rgba(166,210,220,0.45), inset -2px -2px 5px rgba(255,255,255,0.8)"}}/>
          <BtnPrimary onClick={()=>{if(newProduit.trim()){onAddProduit(newProduit.trim());setNewProduit("");}}} icon={Ico.plus(14,"#fff")} bg={DS.blue} style={{flexShrink:0,whiteSpace:"nowrap"}}>Ajouter</BtnPrimary>
        </div>
      </Section>
      <Section title="Quantités en stock">
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {produitsListe.map(p=>{
            const qty = stock[p] ?? 0;
            const low = qty <= 2;
            return (
              <div key={p} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:DS.radiusSm,background:"#eef2f7",border:"none",boxShadow:low?"inset 2px 2px 5px rgba(239,68,68,0.15), inset -1px -1px 3px rgba(255,255,255,0.7)":"inset 2px 2px 5px rgba(166,210,220,0.35), inset -1px -1px 3px rgba(255,255,255,0.7)"}}>
                <div style={{flex:1}}>
                  <span style={{fontSize:13,fontWeight:600,color:DS.dark}}>{p}</span>
                  {low&&<span style={{marginLeft:8,fontSize:10,fontWeight:700,color:DS.red}}>⚠️ Stock bas</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <button onClick={()=>onUpdateStock(p, Math.max(0, qty-1))} style={{width:28,height:28,borderRadius:8,border:"none",background:"#eef2f7",boxShadow:"3px 3px 6px rgba(166,210,220,0.5), -2px -2px 4px rgba(255,255,255,0.8)",cursor:"pointer",fontSize:16,fontWeight:700,color:DS.mid,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                  <span style={{fontSize:16,fontWeight:900,color:low?DS.red:DS.dark,minWidth:28,textAlign:"center"}}>{qty}</span>
                  <button onClick={()=>onUpdateStock(p, qty+1)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#eef2f7",boxShadow:"3px 3px 6px rgba(166,210,220,0.5), -2px -2px 4px rgba(255,255,255,0.8)",cursor:"pointer",fontSize:16,fontWeight:700,color:DS.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
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


// -- CARNET INLINE (aperçu interne, données déjà chargées) ------------------
function CarnetPublicInline({ client, passages }) {
  const [selectedPassage, setSelectedPassage] = useState(null);

  const passClient = (passages||[])
    .filter(p=>p.clientId===client.id && p.ok)
    .sort((a,b)=>new Date(b.date)-new Date(a.date));

  const last = passClient[0]||null;
  const F = "system-ui,-apple-system,sans-serif";
  const phOk  = v => v>=7 && v<=7.6;
  const clOk  = v => v>=0.5 && v<=3;
  const fmtDate = (d,opts) => new Date(d).toLocaleDateString("fr",opts);

  return (
    <>
    <div style={{minHeight:"100vh",background:"#f0f4f8",fontFamily:F,maxWidth:480,margin:"0 auto",paddingBottom:40}}>

      {/* -- HEADER gradient -- */}
      <div style={{background:"linear-gradient(160deg,#0c1f3f 0%,#0e4a7a 70%,#0891b2 100%)",padding:"28px 22px 32px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-50,top:-50,width:200,height:200,borderRadius:"50%",background:"rgba(56,189,248,0.07)"}}/>
        <div style={{position:"absolute",left:-30,bottom:-30,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,0.03)"}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,position:"relative"}}>
          <div style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width={18} height={13} viewBox="0 0 32 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M2 8c2.5 3 5 3 7.5 0S14 5 16.5 8s5 3 7.5 0"/>
              <path d="M2 16c2.5 3 5 3 7.5 0S14 13 16.5 16s5 3 7.5 0"/>
            </svg>
          </div>
          <span style={{fontSize:13,fontWeight:800,color:"rgba(255,255,255,0.9)",letterSpacing:.3}}>BRIBLUE</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginLeft:4}}>Carnet d'entretien</span>
        </div>
        <div style={{position:"relative"}}>
          <div style={{fontSize:24,fontWeight:900,color:"#fff",lineHeight:1.1,marginBottom:6}}>{client.nom}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
            {[client.bassin,client.formule,client.volume?client.volume+"m³":null,client.dateDebut?"Suivi depuis "+fmtDate(client.dateDebut,{month:"long",year:"numeric"}):null].filter(Boolean).map((t,i)=>(
              <span key={i} style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.65)",background:"rgba(255,255,255,0.08)",borderRadius:20,padding:"3px 10px"}}>{t}</span>
            ))}
          </div>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.08)",borderRadius:12,padding:"10px 16px",border:"1px solid rgba(255,255,255,0.1)"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:900,color:"#38bdf8",lineHeight:1}}>{passClient.length}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",fontWeight:600,marginTop:2}}>intervention{passClient.length!==1?"s":""}</div>
            </div>
            {last&&(<>
              <div style={{width:1,height:36,background:"rgba(255,255,255,0.1)"}}/>
              <div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",fontWeight:600,marginBottom:2}}>Dernière visite</div>
                <div style={{fontSize:13,fontWeight:800,color:"#e0f2fe"}}>{fmtDate(last.date,{day:"2-digit",month:"short",year:"numeric"})}</div>
              </div>
            </>)}
          </div>
        </div>
      </div>

      <div style={{padding:"0 16px",marginTop:-12}}>
        {last&&(
          <div style={{background:"#fff",borderRadius:20,padding:"18px 18px",marginBottom:14,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",border:"1px solid #e8f4f8"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div>
                <div style={{fontSize:10,fontWeight:800,color:"#0891b2",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Dernière intervention</div>
                <div style={{fontSize:17,fontWeight:900,color:"#0f172a"}}>{last.type||"Entretien"}</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:3,display:"flex",alignItems:"center",gap:5}}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {fmtDate(last.date,{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
                </div>
                {last.tech&&<div style={{fontSize:12,color:"#64748b",marginTop:2,display:"flex",alignItems:"center",gap:5}}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {last.tech}
                </div>}
              </div>
              <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#0891b2,#0e7490)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                {isControleType(last.type)?"💧":"🔧"}
              </div>
            </div>
            {(last.ph||last.chlore||last.temperature)&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:last.obs||last.actions?14:0}}>
                {last.ph&&(<div style={{borderRadius:14,padding:"12px 8px",textAlign:"center",background:phOk(last.ph)?"#f0fdf4":"#fff7ed",border:"1.5px solid "+(phOk(last.ph)?"#86efac":"#fed7aa")}}>
                  <div style={{fontSize:10,fontWeight:800,color:phOk(last.ph)?"#166534":"#92400e",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>pH</div>
                  <div style={{fontSize:30,fontWeight:900,color:phOk(last.ph)?"#16a34a":"#d97706",lineHeight:1}}>{last.ph}</div>
                  <div style={{fontSize:10,fontWeight:700,color:phOk(last.ph)?"#22c55e":"#f59e0b",marginTop:4}}>{phOk(last.ph)?"✓ Idéal":"⚠ Revoir"}</div>
                </div>)}
                {last.chlore&&(<div style={{borderRadius:14,padding:"12px 8px",textAlign:"center",background:clOk(last.chlore)?"#f0fdf4":"#fff7ed",border:"1.5px solid "+(clOk(last.chlore)?"#86efac":"#fed7aa")}}>
                  <div style={{fontSize:10,fontWeight:800,color:clOk(last.chlore)?"#166534":"#92400e",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Chlore</div>
                  <div style={{fontSize:30,fontWeight:900,color:clOk(last.chlore)?"#16a34a":"#d97706",lineHeight:1}}>{last.chlore}</div>
                  <div style={{fontSize:10,fontWeight:700,color:clOk(last.chlore)?"#22c55e":"#f59e0b",marginTop:4}}>{clOk(last.chlore)?"✓ Idéal":"⚠ Revoir"}</div>
                </div>)}
                {last.temperature&&(<div style={{borderRadius:14,padding:"12px 8px",textAlign:"center",background:"#f0f9ff",border:"1.5px solid #bae6fd"}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#075985",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Temp.</div>
                  <div style={{fontSize:30,fontWeight:900,color:"#0284c7",lineHeight:1}}>{last.temperature}°</div>
                  <div style={{fontSize:10,fontWeight:700,color:"#38bdf8",marginTop:4}}>Eau</div>
                </div>)}
              </div>
            )}
            {last.actions&&(<div style={{background:"#f8fafc",borderRadius:12,padding:"10px 14px",marginBottom:last.obs?8:0}}>
              <div style={{fontSize:10,fontWeight:800,color:"#64748b",textTransform:"uppercase",letterSpacing:.6,marginBottom:5}}>Actions réalisées</div>
              <div style={{fontSize:13,color:"#334155",lineHeight:1.7}}>{last.actions}</div>
            </div>)}
            {last.obs&&(<div style={{background:"#fffbeb",borderRadius:12,padding:"10px 14px",borderLeft:"3px solid #fbbf24"}}>
              <div style={{fontSize:10,fontWeight:800,color:"#92400e",textTransform:"uppercase",letterSpacing:.6,marginBottom:5}}>Observations</div>
              <div style={{fontSize:13,color:"#78350f",lineHeight:1.7}}>{last.obs}</div>
            </div>)}
          </div>
        )}

        {passClient.length>1&&(
          <div>
            <div style={{fontSize:11,fontWeight:800,color:"#64748b",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,paddingLeft:2}}>
              Historique ({passClient.length} interventions)
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {passClient.map((p,i)=>(
                <div key={p.id} onClick={()=>setSelectedPassage(p)}
                  style={{background:"#fff",borderRadius:16,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,0.05)",border:"1px solid "+(i===0?"#bae6fd":"#f1f5f9"),cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:42,height:42,borderRadius:12,background:isControleType(p.type)?"#ecfdf5":"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                    {isControleType(p.type)?"💧":"🔧"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:2}}>{p.type||"Entretien"}</div>
                    <div style={{fontSize:12,color:"#64748b"}}>
                      {fmtDate(p.date,{day:"2-digit",month:"long",year:"numeric"})}
                      {p.tech&&<span style={{color:"#94a3b8"}}> · {p.tech}</span>}
                    </div>
                    {(p.ph||p.chlore||p.temperature)&&(
                      <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>
                        {p.ph&&<span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6,background:phOk(p.ph)?"#dcfce7":"#fef3c7",color:phOk(p.ph)?"#166534":"#92400e"}}>pH {p.ph}</span>}
                        {p.chlore&&<span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6,background:clOk(p.chlore)?"#dcfce7":"#fef3c7",color:clOk(p.chlore)?"#166534":"#92400e"}}>Cl {p.chlore}</span>}
                        {p.temperature&&<span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6,background:"#e0f2fe",color:"#0369a1"}}>{p.temperature}°C</span>}
                      </div>
                    )}
                  </div>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              ))}
            </div>
          </div>
        )}

        {passClient.length===0&&(
          <div style={{background:"#fff",borderRadius:20,padding:"48px 24px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:48,marginBottom:12}}>🏊</div>
            <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:6}}>Aucune intervention</div>
            <div style={{fontSize:13,color:"#94a3b8"}}>Les interventions apparaîtront ici au fur et à mesure.</div>
          </div>
        )}

        <div style={{marginTop:32,textAlign:"center",padding:"16px 0"}}>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,lineHeight:2}}>
            BRIBLUE · Traitement de l'eau · La Seyne-sur-Mer<br/>SIRET 84345436400053
          </div>
        </div>
      </div>
    </div>

    {selectedPassage&&(
      <div onClick={()=>setSelectedPassage(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:10001,padding:0,backdropFilter:"blur(4px)"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",WebkitOverflowScrolling:"touch",boxShadow:"0 -12px 48px rgba(0,0,0,0.2)",paddingBottom:"max(32px,env(safe-area-inset-bottom,32px))"}}>
          <div style={{padding:"14px 0 4px",display:"flex",justifyContent:"center"}}><div style={{width:36,height:4,background:"#e2e8f0",borderRadius:2}}/></div>
          <div style={{padding:"12px 22px 0"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontSize:20,fontWeight:900,color:"#0f172a",marginBottom:4}}>{selectedPassage.type||"Entretien"}</div>
                <div style={{fontSize:13,color:"#64748b"}}>{fmtDate(selectedPassage.date,{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</div>
                {selectedPassage.tech&&<div style={{fontSize:12,color:"#64748b",marginTop:3}}>👤 {selectedPassage.tech}</div>}
              </div>
              <button onClick={()=>setSelectedPassage(null)} style={{width:34,height:34,borderRadius:"50%",background:"#f1f5f9",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {(selectedPassage.ph||selectedPassage.chlore||selectedPassage.temperature)&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
                {selectedPassage.ph&&(<div style={{borderRadius:16,padding:"14px 8px",textAlign:"center",background:phOk(selectedPassage.ph)?"#f0fdf4":"#fff7ed",border:"2px solid "+(phOk(selectedPassage.ph)?"#86efac":"#fed7aa")}}>
                  <div style={{fontSize:10,fontWeight:800,color:phOk(selectedPassage.ph)?"#166534":"#92400e",textTransform:"uppercase",marginBottom:6}}>pH</div>
                  <div style={{fontSize:34,fontWeight:900,color:phOk(selectedPassage.ph)?"#16a34a":"#d97706",lineHeight:1}}>{selectedPassage.ph}</div>
                  <div style={{fontSize:11,fontWeight:700,color:phOk(selectedPassage.ph)?"#22c55e":"#f59e0b",marginTop:6}}>{phOk(selectedPassage.ph)?"✓ Idéal":"⚠ Revoir"}</div>
                </div>)}
                {selectedPassage.chlore&&(<div style={{borderRadius:16,padding:"14px 8px",textAlign:"center",background:clOk(selectedPassage.chlore)?"#f0fdf4":"#fff7ed",border:"2px solid "+(clOk(selectedPassage.chlore)?"#86efac":"#fed7aa")}}>
                  <div style={{fontSize:10,fontWeight:800,color:clOk(selectedPassage.chlore)?"#166534":"#92400e",textTransform:"uppercase",marginBottom:6}}>Chlore</div>
                  <div style={{fontSize:34,fontWeight:900,color:clOk(selectedPassage.chlore)?"#16a34a":"#d97706",lineHeight:1}}>{selectedPassage.chlore}</div>
                  <div style={{fontSize:11,fontWeight:700,color:clOk(selectedPassage.chlore)?"#22c55e":"#f59e0b",marginTop:6}}>{clOk(selectedPassage.chlore)?"✓ Idéal":"⚠ Revoir"}</div>
                </div>)}
                {selectedPassage.temperature&&(<div style={{borderRadius:16,padding:"14px 8px",textAlign:"center",background:"#f0f9ff",border:"2px solid #bae6fd"}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#075985",textTransform:"uppercase",marginBottom:6}}>Temp.</div>
                  <div style={{fontSize:34,fontWeight:900,color:"#0284c7",lineHeight:1}}>{selectedPassage.temperature}°</div>
                  <div style={{fontSize:11,fontWeight:700,color:"#38bdf8",marginTop:6}}>Eau</div>
                </div>)}
              </div>
            )}
            {selectedPassage.actions&&(<div style={{background:"#f8fafc",borderRadius:14,padding:"14px 16px",marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:800,color:"#64748b",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Actions réalisées</div>
              <div style={{fontSize:14,color:"#334155",lineHeight:1.8}}>{selectedPassage.actions}</div>
            </div>)}
            {selectedPassage.obs&&(<div style={{background:"#fffbeb",borderRadius:14,padding:"14px 16px",marginBottom:12,borderLeft:"4px solid #fbbf24"}}>
              <div style={{fontSize:10,fontWeight:800,color:"#92400e",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Observations</div>
              <div style={{fontSize:14,color:"#78350f",lineHeight:1.8}}>{selectedPassage.obs}</div>
            </div>)}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// -- CARNET PUBLIC (URL ?carnet=CODE) ----------------------------------------─
function generateCarnetCode(clientId) {
  // Code court et mémorisable basé sur l'id client
  const hash = clientId.split("").reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0)|0,0);
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const prefix = letters[(Math.abs(hash)%24)] + letters[(Math.abs(hash>>4)%24)];
  const num = String(Math.abs(hash)%9000+1000);
  return prefix+"-"+num;
}

function CarnetPublic({ code, allClients, allPassages }) {
  const [loadedClients, setLoadedClients] = useState(null);
  const [loadedPassages, setLoadedPassages] = useState(null);
  const [selectedPassage, setSelectedPassage] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("app_data").select("data").eq("id", 1).single();
        if (data?.data) {
          const c = data.data["bb_clients_v2"];
          const p = data.data["bb_passages_v2"];
          setLoadedClients(c && c.length ? c : CLIENTS_INIT);
          setLoadedPassages(p && p.length ? p : PASSAGES_INIT);
        } else {
          setLoadedClients(CLIENTS_INIT);
          setLoadedPassages(PASSAGES_INIT);
        }
      } catch {
        setLoadedClients(CLIENTS_INIT);
        setLoadedPassages(PASSAGES_INIT);
      }
    })();
  }, []);

  if (loadedClients === null) return (
    <div style={{minHeight:"100vh",background:"#0c1f3f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif"}}>
      <div style={{width:48,height:48,border:"4px solid rgba(255,255,255,0.1)",borderTop:"4px solid #38bdf8",borderRadius:"50%",animation:"spin 0.8s linear infinite",marginBottom:20}}/>
      <div style={{fontSize:15,color:"rgba(255,255,255,0.6)",fontWeight:600}}>Chargement de votre carnet…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const client = loadedClients.find(c=>generateCarnetCode(c.id)===code.toUpperCase());
  if (!client) return (
    <div style={{minHeight:"100vh",background:"#0c1f3f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif"}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <div style={{fontSize:18,fontWeight:800,color:"#fff",marginBottom:8}}>Code invalide</div>
      <div style={{fontSize:14,color:"rgba(255,255,255,0.5)"}}>Vérifiez le code fourni par votre technicien.</div>
    </div>
  );

  const passClient = (loadedPassages||[])
    .filter(p=>p.clientId===client.id && p.ok)
    .sort((a,b)=>new Date(b.date)-new Date(a.date));

  const last = passClient[0]||null;
  const F = "system-ui,-apple-system,sans-serif";

  // helpers
  const phOk  = v => v>=7 && v<=7.6;
  const clOk  = v => v>=0.5 && v<=3;
  const fmtDate = (d,opts) => new Date(d).toLocaleDateString("fr",opts);

  return (
    <>
    <div style={{minHeight:"100vh",background:"#f0f4f8",fontFamily:F,maxWidth:480,margin:"0 auto",paddingBottom:40}}>

      {/* -- HEADER gradient -- */}
      <div style={{background:"linear-gradient(160deg,#0c1f3f 0%,#0e4a7a 70%,#0891b2 100%)",padding:"28px 22px 32px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-50,top:-50,width:200,height:200,borderRadius:"50%",background:"rgba(56,189,248,0.07)"}}/>
        <div style={{position:"absolute",left:-30,bottom:-30,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,0.03)"}}/>

        {/* Logo ligne */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,position:"relative"}}>
          <div style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width={18} height={13} viewBox="0 0 32 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M2 8c2.5 3 5 3 7.5 0S14 5 16.5 8s5 3 7.5 0"/>
              <path d="M2 16c2.5 3 5 3 7.5 0S14 13 16.5 16s5 3 7.5 0"/>
            </svg>
          </div>
          <span style={{fontSize:13,fontWeight:800,color:"rgba(255,255,255,0.9)",letterSpacing:.3}}>BRIBLUE</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginLeft:4}}>Carnet d'entretien</span>
        </div>

        {/* Nom client + infos */}
        <div style={{position:"relative"}}>
          <div style={{fontSize:24,fontWeight:900,color:"#fff",lineHeight:1.1,marginBottom:6}}>{client.nom}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
            {[
              client.bassin,
              client.formule,
              client.volume ? client.volume+"m³" : null,
              client.dateDebut ? "Suivi depuis "+fmtDate(client.dateDebut,{month:"long",year:"numeric"}) : null,
            ].filter(Boolean).map((t,i)=>(
              <span key={i} style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.65)",background:"rgba(255,255,255,0.08)",borderRadius:20,padding:"3px 10px"}}>{t}</span>
            ))}
          </div>

          {/* Stat rapide : nb passages */}
          <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.08)",borderRadius:12,padding:"10px 16px",border:"1px solid rgba(255,255,255,0.1)"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:900,color:"#38bdf8",lineHeight:1}}>{passClient.length}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",fontWeight:600,marginTop:2}}>intervention{passClient.length!==1?"s":""}</div>
            </div>
            {last&&(
              <>
                <div style={{width:1,height:36,background:"rgba(255,255,255,0.1)"}}/>
                <div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",fontWeight:600,marginBottom:2}}>Dernière visite</div>
                  <div style={{fontSize:13,fontWeight:800,color:"#e0f2fe"}}>{fmtDate(last.date,{day:"2-digit",month:"short",year:"numeric"})}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{padding:"0 16px",marginTop:-12}}>

        {/* -- DERNIÈRE INTERVENTION -- */}
        {last&&(
          <div style={{background:"#fff",borderRadius:20,padding:"18px 18px",marginBottom:14,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",border:"1px solid #e8f4f8"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div>
                <div style={{fontSize:10,fontWeight:800,color:"#0891b2",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Dernière intervention</div>
                <div style={{fontSize:17,fontWeight:900,color:"#0f172a"}}>{last.type||"Entretien"}</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:3,display:"flex",alignItems:"center",gap:5}}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {fmtDate(last.date,{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
                </div>
                {last.tech&&<div style={{fontSize:12,color:"#64748b",marginTop:2,display:"flex",alignItems:"center",gap:5}}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {last.tech}
                </div>}
              </div>
              <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#0891b2,#0e7490)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                {isControleType(last.type)?"💧":"🔧"}
              </div>
            </div>

            {/* Mesures en gros */}
            {(last.ph||last.chlore||last.temperature)&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:last.obs||last.actions?14:0}}>
                {last.ph&&(
                  <div style={{borderRadius:14,padding:"12px 8px",textAlign:"center",background:phOk(last.ph)?"#f0fdf4":"#fff7ed",border:"1.5px solid "+(phOk(last.ph)?"#86efac":"#fed7aa")}}>
                    <div style={{fontSize:10,fontWeight:800,color:phOk(last.ph)?"#166534":"#92400e",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>pH</div>
                    <div style={{fontSize:30,fontWeight:900,color:phOk(last.ph)?"#16a34a":"#d97706",lineHeight:1}}>{last.ph}</div>
                    <div style={{fontSize:10,fontWeight:700,color:phOk(last.ph)?"#22c55e":"#f59e0b",marginTop:4}}>{phOk(last.ph)?"✓ Idéal":"⚠ Revoir"}</div>
                  </div>
                )}
                {last.chlore&&(
                  <div style={{borderRadius:14,padding:"12px 8px",textAlign:"center",background:clOk(last.chlore)?"#f0fdf4":"#fff7ed",border:"1.5px solid "+(clOk(last.chlore)?"#86efac":"#fed7aa")}}>
                    <div style={{fontSize:10,fontWeight:800,color:clOk(last.chlore)?"#166534":"#92400e",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Chlore</div>
                    <div style={{fontSize:30,fontWeight:900,color:clOk(last.chlore)?"#16a34a":"#d97706",lineHeight:1}}>{last.chlore}</div>
                    <div style={{fontSize:10,fontWeight:700,color:clOk(last.chlore)?"#22c55e":"#f59e0b",marginTop:4}}>{clOk(last.chlore)?"✓ Idéal":"⚠ Revoir"}</div>
                  </div>
                )}
                {last.temperature&&(
                  <div style={{borderRadius:14,padding:"12px 8px",textAlign:"center",background:"#f0f9ff",border:"1.5px solid #bae6fd"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#075985",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Temp.</div>
                    <div style={{fontSize:30,fontWeight:900,color:"#0284c7",lineHeight:1}}>{last.temperature}°</div>
                    <div style={{fontSize:10,fontWeight:700,color:"#38bdf8",marginTop:4}}>Eau</div>
                  </div>
                )}
              </div>
            )}

            {/* Actions / Obs */}
            {last.actions&&(
              <div style={{background:"#f8fafc",borderRadius:12,padding:"10px 14px",marginBottom:last.obs?8:0}}>
                <div style={{fontSize:10,fontWeight:800,color:"#64748b",textTransform:"uppercase",letterSpacing:.6,marginBottom:5}}>Actions réalisées</div>
                <div style={{fontSize:13,color:"#334155",lineHeight:1.7}}>{last.actions}</div>
              </div>
            )}
            {last.obs&&(
              <div style={{background:"#fffbeb",borderRadius:12,padding:"10px 14px",borderLeft:"3px solid #fbbf24"}}>
                <div style={{fontSize:10,fontWeight:800,color:"#92400e",textTransform:"uppercase",letterSpacing:.6,marginBottom:5}}>Observations</div>
                <div style={{fontSize:13,color:"#78350f",lineHeight:1.7}}>{last.obs}</div>
              </div>
            )}
          </div>
        )}

        {/* -- HISTORIQUE -- */}
        {passClient.length>1&&(
          <div>
            <div style={{fontSize:11,fontWeight:800,color:"#64748b",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,paddingLeft:2}}>
              Historique ({passClient.length} interventions)
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {passClient.map((p,i)=>{
                const isLast=i===0;
                return (
                  <div key={p.id} onClick={()=>setSelectedPassage(p)}
                    style={{background:"#fff",borderRadius:16,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,0.05)",border:"1px solid "+(isLast?"#bae6fd":"#f1f5f9"),cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"box-shadow .15s"}}
                    onTouchStart={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(8,145,178,0.15)"}
                    onTouchEnd={e=>e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,0.05)"}>
                    {/* Icône type */}
                    <div style={{width:42,height:42,borderRadius:12,background:isControleType(p.type)?"#ecfdf5":"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                      {isControleType(p.type)?"💧":"🔧"}
                    </div>
                    {/* Contenu */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:2}}>{p.type||"Entretien"}</div>
                      <div style={{fontSize:12,color:"#64748b"}}>
                        {fmtDate(p.date,{day:"2-digit",month:"long",year:"numeric"})}
                        {p.tech&&<span style={{color:"#94a3b8"}}> · {p.tech}</span>}
                      </div>
                      {(p.ph||p.chlore||p.temperature)&&(
                        <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>
                          {p.ph&&<span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6,background:phOk(p.ph)?"#dcfce7":"#fef3c7",color:phOk(p.ph)?"#166534":"#92400e"}}>pH {p.ph}</span>}
                          {p.chlore&&<span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6,background:clOk(p.chlore)?"#dcfce7":"#fef3c7",color:clOk(p.chlore)?"#166534":"#92400e"}}>Cl {p.chlore}</span>}
                          {p.temperature&&<span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:6,background:"#e0f2fe",color:"#0369a1"}}>{p.temperature}°C</span>}
                        </div>
                      )}
                    </div>
                    {/* Flèche */}
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {passClient.length===0&&(
          <div style={{background:"#fff",borderRadius:20,padding:"48px 24px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:48,marginBottom:12}}>🏊</div>
            <div style={{fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:6}}>Aucune intervention</div>
            <div style={{fontSize:13,color:"#94a3b8"}}>Les interventions apparaîtront ici au fur et à mesure.</div>
          </div>
        )}

        {/* Footer */}
        <div style={{marginTop:32,textAlign:"center",padding:"16px 0"}}>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,lineHeight:2}}>
            BRIBLUE · Traitement de l'eau · La Seyne-sur-Mer<br/>
            SIRET 84345436400053
          </div>
        </div>
      </div>
    </div>

    {/* -- BOTTOM SHEET DÉTAIL -- */}
    {selectedPassage&&(
      <div onClick={()=>setSelectedPassage(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1000,padding:0,backdropFilter:"blur(4px)"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",WebkitOverflowScrolling:"touch",boxShadow:"0 -12px 48px rgba(0,0,0,0.2)",paddingBottom:"max(32px,env(safe-area-inset-bottom,32px))"}}>
          {/* Handle */}
          <div style={{padding:"14px 0 4px",display:"flex",justifyContent:"center"}}>
            <div style={{width:36,height:4,background:"#e2e8f0",borderRadius:2}}/>
          </div>
          <div style={{padding:"12px 22px 0"}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontSize:20,fontWeight:900,color:"#0f172a",marginBottom:4}}>{selectedPassage.type||"Entretien"}</div>
                <div style={{fontSize:13,color:"#64748b",display:"flex",alignItems:"center",gap:5}}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {fmtDate(selectedPassage.date,{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
                </div>
                {selectedPassage.tech&&<div style={{fontSize:12,color:"#64748b",marginTop:3,display:"flex",alignItems:"center",gap:5}}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {selectedPassage.tech}
                </div>}
              </div>
              <button onClick={()=>setSelectedPassage(null)} style={{width:34,height:34,borderRadius:"50%",background:"#f1f5f9",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Mesures grandes */}
            {(selectedPassage.ph||selectedPassage.chlore||selectedPassage.temperature)&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
                {selectedPassage.ph&&(
                  <div style={{borderRadius:16,padding:"14px 8px",textAlign:"center",background:phOk(selectedPassage.ph)?"#f0fdf4":"#fff7ed",border:"2px solid "+(phOk(selectedPassage.ph)?"#86efac":"#fed7aa")}}>
                    <div style={{fontSize:10,fontWeight:800,color:phOk(selectedPassage.ph)?"#166534":"#92400e",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>pH</div>
                    <div style={{fontSize:34,fontWeight:900,color:phOk(selectedPassage.ph)?"#16a34a":"#d97706",lineHeight:1}}>{selectedPassage.ph}</div>
                    <div style={{fontSize:11,fontWeight:700,color:phOk(selectedPassage.ph)?"#22c55e":"#f59e0b",marginTop:6}}>{phOk(selectedPassage.ph)?"✓ Idéal":"⚠ Revoir"}</div>
                  </div>
                )}
                {selectedPassage.chlore&&(
                  <div style={{borderRadius:16,padding:"14px 8px",textAlign:"center",background:clOk(selectedPassage.chlore)?"#f0fdf4":"#fff7ed",border:"2px solid "+(clOk(selectedPassage.chlore)?"#86efac":"#fed7aa")}}>
                    <div style={{fontSize:10,fontWeight:800,color:clOk(selectedPassage.chlore)?"#166534":"#92400e",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Chlore</div>
                    <div style={{fontSize:34,fontWeight:900,color:clOk(selectedPassage.chlore)?"#16a34a":"#d97706",lineHeight:1}}>{selectedPassage.chlore}</div>
                    <div style={{fontSize:11,fontWeight:700,color:clOk(selectedPassage.chlore)?"#22c55e":"#f59e0b",marginTop:6}}>{clOk(selectedPassage.chlore)?"✓ Idéal":"⚠ Revoir"}</div>
                  </div>
                )}
                {selectedPassage.temperature&&(
                  <div style={{borderRadius:16,padding:"14px 8px",textAlign:"center",background:"#f0f9ff",border:"2px solid #bae6fd"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#075985",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Temp.</div>
                    <div style={{fontSize:34,fontWeight:900,color:"#0284c7",lineHeight:1}}>{selectedPassage.temperature}°</div>
                    <div style={{fontSize:11,fontWeight:700,color:"#38bdf8",marginTop:6}}>Eau</div>
                  </div>
                )}
              </div>
            )}

            {selectedPassage.actions&&(
              <div style={{background:"#f8fafc",borderRadius:14,padding:"14px 16px",marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:800,color:"#64748b",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Actions réalisées</div>
                <div style={{fontSize:14,color:"#334155",lineHeight:1.8}}>{selectedPassage.actions}</div>
              </div>
            )}
            {selectedPassage.obs&&(
              <div style={{background:"#fffbeb",borderRadius:14,padding:"14px 16px",marginBottom:12,borderLeft:"4px solid #fbbf24"}}>
                <div style={{fontSize:10,fontWeight:800,color:"#92400e",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Observations</div>
                <div style={{fontSize:14,color:"#78350f",lineHeight:1.8}}>{selectedPassage.obs}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
// -- FIN CARNET --------------------------------------------------------------
export default function App() {
  // Détection URL carnet public
  const [carnetCode] = useState(()=>{
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get("carnet")||"";
    } catch { return ""; }
  });
  const [loggedIn, setLoggedIn] = useState(false);
  const { online, pendingCount } = useOnlineStatus();
  const [page, setPage] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [passages, setPassages] = useState([]);
  const [livraisons, setLivraisons] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [stock, setStock] = useState({});
  const [showStock, setShowStock] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [contrats, setContrats] = useState({});
  const [initialLoaded, setInitialLoaded] = useState(false);
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
  const dismissAlerte = (clientId) => { setDismissedAlertes(prev=>{ const next=[...new Set([...prev,clientId])]; try{ localStorage.setItem("briblue_dismissed_alertes", JSON.stringify(next)); }catch{} return next; }); };
  const prevTaskCount = useRef(0);
  const isMobile = useIsMobile();

  useEffect(()=>{ setupPWA(); try { if(sessionStorage.getItem("bb_auth")==="1") setLoggedIn(true); } catch {} },[]);

  useEffect(()=>{
    if(!loggedIn) return;
    (async()=>{
      const c = await load("bb_clients_v2", null);
      const passages_data = await load("bb_passages_v2", null);
      const l = await load("bb_livraisons_v1", null);
      const r = await load("bb_rdvs_v1", null);
      const s = await load("bb_stock_v1", null);
      const ct = await load("bb_contrats_v1", null);

      // null = clé absente de Supabase (première fois) → utiliser données initiales
      // valeur présente = toujours utiliser les données Supabase
      const clientsData = c !== null ? c : CLIENTS_INIT;
      const passagesData = passages_data !== null ? passages_data : PASSAGES_INIT;
      const livraisonsData = l !== null ? l : [];
      const rdvsData = r !== null ? r : [];
      const stockData = s !== null ? s : {};
      const contratsData = ct !== null ? ct : {};
      const sWithDefaults = {...Object.fromEntries(PRODUITS_DEFAUT.map(nom=>[nom,0])), ...stockData};

      const cMigrated = clientsData.map(cl => ({...cl, moisParMois: migrateMois(cl.moisParMois||cl.saisons), photoPiscine: cl.photoPiscine||"", prixPassageE: cl.prixPassageE||0, prixPassageC: cl.prixPassageC||0}));
      setClients(cMigrated); setPassages(passagesData); setLivraisons(livraisonsData); setRdvs(rdvsData); setStock(sWithDefaults); setContrats(contratsData); setReady(true); setInitialLoaded(true);
    })();
  },[loggedIn]);

  // Sauvegarde MANUELLE uniquement — jamais automatique au chargement
  const saveClients   = useCallback((data) => save("bb_clients_v2",    data), []);
  const savePassages  = useCallback((data) => save("bb_passages_v2",   data), []);
  const saveLivraisonsList = useCallback((data) => save("bb_livraisons_v1", data), []);
  const saveRdvsList  = useCallback((data) => save("bb_rdvs_v1",       data), []);
  const saveStock     = useCallback((data) => save("bb_stock_v1",      data), []);
  const saveContrats  = useCallback((data) => save("bb_contrats_v1",   data), []);

  // Polling toutes les 10s pour détecter nouvelles signatures
  useEffect(()=>{
    if(!ready) return;
    const interval = setInterval(async()=>{
      const ct = await load("bb_contrats_v1", {});
      setContrats(prev => {
        // Détecter nouvelle signature
        const newSig = Object.values(ct).find(c =>
          (c.statut === "signe_client" || c.statut === "signe_complet") &&
          (!prev[Object.keys(ct).find(k => ct[k] === c)] ||
           prev[Object.keys(ct).find(k => ct[k] === c)]?.statut !== c.statut)
        );
        if (newSig) {
          playNotifSound();
          const cli = clients.find(cl => cl.id === newSig.clientId);
          const msg = newSig.statut === "signe_complet" ? `✅ Contrat co-signé par ${cli?.nom||newSig.clientId} !` : `📝 ${cli?.nom||newSig.clientId} a signé son contrat — votre signature est requise.`;
          if (cli) toastInfo(msg);
        }
        return ct;
      });
    }, 10000);
    return ()=>clearInterval(interval);
  },[ready, clients]);

// Notification sound when new tasks appear
  useEffect(()=>{
    if(!ready) return;
    const currentTasks = clients.reduce((a,c)=>{
      const prevE=getEntretienMois(c.moisParMois||c.saisons,MOIS_NOW);const prevC=getControleMois(c.moisParMois||c.saisons,MOIS_NOW);
      const effE=passages.filter(p=>p.clientId===c.id&&new Date(p.date).getMonth()+1===MOIS_NOW&&new Date(p.date).getFullYear()===YEAR_NOW&&isEntretienType(p.type)).length;
      const effC=passages.filter(p=>p.clientId===c.id&&new Date(p.date).getMonth()+1===MOIS_NOW&&new Date(p.date).getFullYear()===YEAR_NOW&&isControleType(p.type)).length;
      return a+Math.max(0,prevE-effE)+Math.max(0,prevC-effC);
    },0);
    if(prevTaskCount.current>0 && currentTasks>prevTaskCount.current) playNotifSound();
    prevTaskCount.current=currentTasks;
  },[clients,passages,ready]);

  const handleLogin = useCallback(()=>{ try{sessionStorage.setItem("bb_auth","1");}catch{} setLoggedIn(true); },[]);
  const handleLogout = useCallback(()=>{ try{sessionStorage.removeItem("bb_auth");}catch{} setLoggedIn(false);setReady(false);setClients([]);setPassages([]);setLivraisons([]);setRdvs([]); },[]);

  const saveClient = useCallback(c=>{ setClients(prev=>{ const next=prev.find(x=>x.id===c.id)?prev.map(x=>x.id===c.id?c:x):[...prev,c]; saveClients(next); return next; }); setShowFormClient(false);setEditClient(null);setFicheClient(c); },[saveClients]);
  const deleteClient = useCallback(id=>{ showConfirm("Supprimer ce client et tous ses passages ?", ()=>{ setClients(prev=>{ const next=prev.filter(x=>x.id!==id); saveClients(next); return next; }); setPassages(prev=>{ const next=prev.filter(x=>x.clientId!==id); savePassages(next); return next; }); setFicheClient(null); }); },[saveClients,savePassages]);
  const savePassage = useCallback(p=>{ setPassages(prev=>{ const next=prev.find(x=>x.id===p.id)?prev.map(x=>x.id===p.id?p:x):[...prev,p]; savePassages(next); return next; }); setShowFormPassage(false);setEditPassage(null); },[savePassages]);
  const updatePassageRapportStatus = useCallback((passageMaj) => {
    setPassages(prev => {
      const next = prev.map(x => x.id === passageMaj.id ? { ...x, ...passageMaj } : x);
      savePassages(next);
      return next;
    });
  }, [savePassages]);
  const deletePassage = useCallback(id=>{ setPassages(prev=>{ const next=prev.filter(x=>x.id!==id); savePassages(next); return next; }); },[savePassages]);
  const openAddPassageFromClient = useCallback(cid=>{ setEditPassage(null);setDefaultClientId(cid);setShowFormPassage(true); },[]);
  const openEditPassage = useCallback(p=>{ setEditPassage(p);setDefaultClientId(p.clientId);setShowFormPassage(true); },[]);
  const saveLivraison = useCallback(l=>{ 
    setLivraisons(prev=>{ const next=prev.find(x=>x.id===l.id)?prev.map(x=>x.id===l.id?l:x):[...prev,l]; saveLivraisonsList(next); return next; });
    // Déduire du stock les produits livrés
    if (l.produits?.length > 0) {
      setStock(prev => {
        const next = {...prev};
        l.produits.forEach(p => { if(next[p] !== undefined) next[p] = Math.max(0, (next[p]||0) - 1); });
        saveStock(next);
        return next;
      });
    }
  },[saveLivraisonsList, saveStock]);
  const deleteLivraison = useCallback(id=>{ setLivraisons(prev=>{ const next=prev.filter(x=>x.id!==id); saveLivraisonsList(next); return next; }); },[saveLivraisonsList]);
  const updateStatutLivraison = useCallback((id,statut)=>{ setLivraisons(prev=>{ const next=prev.map(x=>x.id===id?{...x,statut}:x); saveLivraisonsList(next); return next; }); },[saveLivraisonsList]);
  const updateStock = useCallback((produit, qty) => { setStock(prev=>{ const next={...prev,[produit]:qty}; saveStock(next); return next; }); },[saveStock]);
  const addProduitStock = useCallback((nom) => { setStock(prev=>{ const next={...prev,[nom]:prev[nom]??0}; saveStock(next); return next; }); },[saveStock]);
  const deleteProduitStock = useCallback((nom) => { setStock(prev=>{ const n={...prev}; delete n[nom]; saveStock(n); return n; }); },[saveStock]);
  const nbStockBas = useMemo(()=>Object.values(stock).filter(q=>q<=2).length,[stock]);
  const handleImport = useCallback((newClients, newPassages) => {
    setClients(prev => {
      const next = [...prev, ...newClients];
      saveClients(next);
      return next;
    });
    setPassages(prev => {
      const next = [...prev, ...newPassages];
      savePassages(next);
      return next;
    });
    setShowImport(false);
  }, [saveClients, savePassages]);

  const saveRdv = useCallback(r=>{ setRdvs(prev=>{ const next=prev.find(x=>x.id===r.id)?prev.map(x=>x.id===r.id?r:x):[...prev,r]; saveRdvsList(next); return next; }); setShowFormRdv(false);setEditRdv(null); },[saveRdvsList]);
  const deleteRdv = useCallback(id=>{ setRdvs(prev=>{ const next=prev.filter(x=>x.id!==id); saveRdvsList(next); return next; }); },[saveRdvsList]);

  const openAddClient = useCallback(()=>{ setEditClient(null); setShowFormClient(true); },[]);

  const nbAlertes = useMemo(()=>clients.filter(c=>alerteClient(c,passages)!=="ok"&&!dismissedAlertes.includes(c.id)).length,[clients,passages,dismissedAlertes]);
  const nbAFacturer = useMemo(()=>livraisons.filter(l=>l.statut==="aFacturer").length,[livraisons]);

  // Carnet public — accessible sans login
  if(carnetCode) return <><GlobalStyles/><CarnetPublic code={carnetCode} allClients={clients.length?clients:CLIENTS_INIT} allPassages={passages.length?passages:PASSAGES_INIT}/></>;

  if(!loggedIn) return <><GlobalStyles/>
      <ToastContainer/>
      <ConfirmModal/><LoginScreen onLogin={handleLogin}/></>;

  if(!ready) return (
    <>
    <GlobalStyles/>
    <div style={{height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#eef2f7",gap:16,fontFamily:"'Inter', -apple-system, system-ui, sans-serif"}}>
      <div className="scale-in" style={{width:80,height:80,borderRadius:24,background:"#0891b2",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 12px 40px rgba(12,18,34,0.35)"}}>{Ico.wave(42,"white")}</div>
      <div style={{fontWeight:900,fontSize:24,color:DS.blue,letterSpacing:-0.5}}>BRIBLUE</div>
      <div style={{color:DS.mid,fontSize:13}}>Chargement…</div>
    </div>
    </>
  );

  const NAV = [
    { id:"dashboard", l:"Accueil", icon:(a)=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?DS.blue:"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M5 16c2 2 4 2 6 0s4-2 6 0" opacity={a?1:0.4}/><path d="M9 21V14h6v7"/></svg> },
    { id:"clients",   l:"Clients", icon:(a)=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?DS.blue:"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></svg> },
    { id:"interventions", l:"Rapports", icon:(a)=><IconFiche size={22} color={a?DS.blue:"#94a3b8"}/> },
    { id:"rdv", l:"Rendez-vous", icon:(a)=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?"#818cf8":"#94a3b8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="15" r="2.5" fill={a?"#818cf8":"none"}/></svg> },
  ];

  const PAGE_LABELS = { dashboard:`Bonjour Dorian 👋`, clients:"Clients", passages:"Rapports", interventions:"Rapports", rdv:"Rendez-vous" };

  return (
    <>
    <GlobalStyles/>
    <div style={{minHeight:"100vh",background:"#eef2f7",fontFamily:"'Inter', -apple-system, system-ui, sans-serif",maxWidth:isMobile?640:1280,margin:"0 auto",position:"relative",display:"flex",flexDirection:"column",overflowX:"hidden",width:"100%"}}>
      {/* HEADER — Soft UI */}
      <div style={{background:"#eef2f7",padding:isMobile?"10px 14px":"10px 28px",display:"flex",alignItems:"center",gap:isMobile?8:14,position:"sticky",top:0,zIndex:50,boxShadow:"0 4px 16px rgba(166,210,220,0.5)",width:"100%",boxSizing:"border-box",WebkitBackfaceVisibility:"hidden"}}>

        <button onClick={()=>setPage("dashboard")} style={{background:"#eef2f7",border:"none",padding:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:isMobile?44:42,height:isMobile?44:42,borderRadius:14,flexShrink:0,boxShadow:DS.nmShadow}}>
          {Ico.wave(isMobile?22:20,"#0891b2")}
        </button>

        <div style={{width:9,height:9,borderRadius:"50%",background:online?"#34d399":"#f87171",boxShadow:online?"0 0 0 3px rgba(52,211,153,0.25)":"0 0 0 3px rgba(248,113,113,0.25)",flexShrink:0}}/>

        <div style={{flex:1}}/>

        <div style={{display:"flex",gap:isMobile?8:10,alignItems:"center",flexShrink:0}}>

          {!isMobile&&(
            <button onClick={()=>setShowImport(true)} style={{display:"flex",alignItems:"center",gap:7,padding:"0 16px",height:40,borderRadius:20,background:"#eef2f7",border:"none",cursor:"pointer",flexShrink:0,fontFamily:"inherit",boxShadow:DS.nmShadow}}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              <span style={{fontSize:12,fontWeight:600,color:"#64748b"}}>Import</span>
            </button>
          )}

          <button onClick={()=>setShowStock(true)} style={{position:"relative",width:isMobile?44:undefined,height:isMobile?44:40,padding:isMobile?0:"0 16px",display:"flex",alignItems:"center",justifyContent:"center",gap:7,borderRadius:isMobile?14:20,background:"#eef2f7",border:"none",cursor:"pointer",flexShrink:0,fontFamily:"inherit",boxShadow:DS.nmShadow}}>
            <svg width={isMobile?22:16} height={isMobile?22:16} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V21H3V8"/><path d="M23 3H1v5h22V3z"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            {!isMobile&&<span style={{fontSize:12,fontWeight:600,color:"#94a3b8"}}>Stock</span>}
            {nbStockBas>0&&<span style={{position:"absolute",top:-4,right:-4,minWidth:18,height:18,borderRadius:9,background:"#ef4444",color:"#fff",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{nbStockBas}</span>}
          </button>



          {isMobile&&(
            <button onClick={()=>{setDefaultLivraisonClientId("");setShowFormLivraison(true);}} style={{width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:14,background:"#eef2f7",border:"none",cursor:"pointer",flexShrink:0,boxShadow:DS.nmShadow}}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </button>
          )}

          <button onClick={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} style={{width:isMobile?44:undefined,height:isMobile?44:40,padding:isMobile?0:"0 18px",display:"flex",alignItems:"center",justifyContent:"center",gap:7,borderRadius:isMobile?14:20,background:"linear-gradient(135deg,#06b6d4,#0891b2)",border:"none",cursor:"pointer",flexShrink:0,fontFamily:"inherit",boxShadow:"4px 4px 12px rgba(8,145,178,0.35), -2px -2px 6px rgba(255,255,255,0.6)"}}>
            <svg width={isMobile?22:16} height={isMobile?22:16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
            {!isMobile&&<span style={{fontSize:12,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>Rapport</span>}
          </button>

          <button onClick={handleLogout} style={{width:isMobile?44:40,height:isMobile?44:40,borderRadius:14,background:"#eef2f7",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:DS.nmShadow}}>
            <svg width={isMobile?20:16} height={isMobile?20:16} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>

        </div>
      </div>

      {/* LAYOUT PRINCIPAL — sidebar desktop, plein mobile */}
      {isMobile ? (
        <>
          {/* TITRE mobile */}
          <div style={{padding:"16px 16px 4px"}}>
            <h2 style={{margin:0,fontSize:22,fontWeight:900,color:DS.dark,letterSpacing:-0.5}}>{PAGE_LABELS[page]}</h2>
            {page==="dashboard"&&<p style={{margin:"2px 0 0",color:DS.mid,fontSize:12,fontWeight:500}}>Aujourd'hui tâchons de ne rien oublier ;)</p>}
          </div>
          <div style={{padding:"6px 16px 110px",overflowX:"hidden",WebkitOverflowScrolling:"touch"}}>
            {page==="dashboard"&&<Dashboard clients={clients} passages={passages} rdvs={rdvs} onClientClick={setFicheClient} onAddPassage={()=>{setDefaultClientId("");setShowFormPassage(true);}} onAddLivraison={()=>{setDefaultLivraisonClientId("");setShowFormLivraison(true);}} onAddClient={openAddClient} onAddRdv={()=>{setEditRdv(null);setShowFormRdv(true);}} onEditPassage={openEditPassage} onEditRdv={r=>{setEditRdv(r);setShowFormRdv(true);}}/>}
            {page==="clients"&&<PageClients clients={clients} passages={passages} contrats={contrats} onUpdateContrat={(contractId,data)=>setContrats(prev=>{ const next={...prev,[contractId]:{...prev[contractId],...data}}; saveContrats(next); return next; })} onClientClick={setFicheClient} onAdd={openAddClient}/>}
            {(page==="passages"||page==="interventions")&&<PagePassages clients={clients} passages={passages} onAdd={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} onDelete={deletePassage} onEdit={openEditPassage} onUpdatePassageStatus={updatePassageRapportStatus}/>}
            {page==="rdv"&&<PageRdv clients={clients} rdvs={rdvs} onAdd={()=>{setEditRdv(null);setShowFormRdv(true);}} onEdit={r=>{setEditRdv(r);setShowFormRdv(true);}} onDelete={deleteRdv}/>}
          </div>
        </>
      ) : (
        /* LAYOUT DESKTOP : sidebar gauche + contenu principal */
        <div style={{display:"flex",flex:1,minHeight:0}}>
          {/* Sidebar navigation desktop */}
          <div style={{width:220,flexShrink:0,background:"#eef2f7",borderRight:"1px solid "+DS.border,display:"flex",flexDirection:"column",padding:"24px 12px",gap:4,position:"sticky",top:62,height:"calc(100vh - 62px)",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
            {/* Stats rapides */}
            <div style={{padding:"12px 14px",borderRadius:16,background:"#eef2f7",boxShadow:DS.nmShadowSm,marginBottom:16}}>
              <div style={{fontSize:9,fontWeight:700,color:DS.mid,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Aperçu</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:DS.mid}}>Clients</span><span style={{fontSize:13,fontWeight:800,color:DS.dark}}>{clients.length}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:DS.mid}}>Ce mois</span><span style={{fontSize:13,fontWeight:800,color:DS.blue}}>{passages.filter(p=>new Date(p.date).getMonth()+1===MOIS_NOW&&new Date(p.date).getFullYear()===YEAR_NOW).length} pass.</span></div>
                {nbAlertes>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:DS.mid}}>Alertes</span><span style={{fontSize:13,fontWeight:800,color:"#ef4444"}}>{nbAlertes}</span></div>}
              </div>
            </div>
            {/* Nav links */}
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:14,border:"none",cursor:"pointer",background:page===n.id?"#eef2f7":"transparent",textAlign:"left",fontFamily:"inherit",transition:"all .2s",width:"100%",boxShadow:page===n.id?DS.nmShadowSm:"none"}}>
                {n.icon(page===n.id)}
                <span style={{fontSize:13,fontWeight:page===n.id?700:500,color:page===n.id?DS.blue:DS.mid}}>{n.l}</span>
                {page===n.id&&<div style={{marginLeft:"auto",width:4,height:16,borderRadius:2,background:DS.blue}}/>}
              </button>
            ))}
            <div style={{marginTop:"auto",display:"flex",flexDirection:"column",gap:8,paddingTop:16,borderTop:"1px solid "+DS.border}}>
              <button onClick={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:14,border:"none",background:"#eef2f7",cursor:"pointer",fontFamily:"inherit",width:"100%",boxShadow:DS.nmShadowSm}}>
                {Ico.clipboard(14,DS.blue)}<span style={{fontSize:12,fontWeight:600,color:DS.mid}}>Nouveau passage</span>
              </button>
              <button onClick={openAddClient} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:14,border:"none",background:"#eef2f7",cursor:"pointer",fontFamily:"inherit",width:"100%",boxShadow:DS.nmShadowSm}}>
                {Ico.userPlus(14,DS.purple)}<span style={{fontSize:12,fontWeight:600,color:DS.purple}}>Nouveau client</span>
              </button>
            </div>
          </div>
          {/* Contenu principal desktop */}
          <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",minWidth:0}}>
            <div style={{padding:"20px 32px 80px",maxWidth:860,margin:"0 auto"}}>
              <div style={{marginBottom:16}}>
                <h2 style={{margin:0,fontSize:26,fontWeight:900,color:DS.dark,letterSpacing:-0.5}}>{PAGE_LABELS[page]}</h2>
                {page==="dashboard"&&<p style={{margin:"2px 0 0",color:DS.mid,fontSize:13,fontWeight:500}}>Aujourd'hui tâchons de ne rien oublier ;)</p>}
              </div>
              {page==="dashboard"&&<Dashboard clients={clients} passages={passages} rdvs={rdvs} onClientClick={setFicheClient} onAddPassage={()=>{setDefaultClientId("");setShowFormPassage(true);}} onAddLivraison={()=>{setDefaultLivraisonClientId("");setShowFormLivraison(true);}} onAddClient={openAddClient} onAddRdv={()=>{setEditRdv(null);setShowFormRdv(true);}} onEditPassage={openEditPassage} onEditRdv={r=>{setEditRdv(r);setShowFormRdv(true);}}/>}
              {page==="clients"&&<PageClients clients={clients} passages={passages} contrats={contrats} onUpdateContrat={(contractId,data)=>setContrats(prev=>{ const next={...prev,[contractId]:{...prev[contractId],...data}}; saveContrats(next); return next; })} onClientClick={setFicheClient} onAdd={openAddClient}/>}
              {(page==="passages"||page==="interventions")&&<PagePassages clients={clients} passages={passages} onAdd={()=>{setEditPassage(null);setDefaultClientId("");setShowFormPassage(true);}} onDelete={deletePassage} onEdit={openEditPassage} onUpdatePassageStatus={updatePassageRapportStatus}/>}
              {page==="rdv"&&<PageRdv clients={clients} rdvs={rdvs} onAdd={()=>{setEditRdv(null);setShowFormRdv(true);}} onEdit={r=>{setEditRdv(r);setShowFormRdv(true);}} onDelete={deleteRdv}/>}
            </div>
          </div>
        </div>
      )}

      {/* NAV BAS MODERNISÉ — mobile seulement */}
      {isMobile && <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:640,background:"#eef2f7",borderTop:"1px solid "+DS.border,display:"flex",alignItems:"flex-end",boxShadow:"0 -4px 20px rgba(166,210,220,0.5)",zIndex:50,paddingBottom:"env(safe-area-inset-bottom,4px)",WebkitTransform:"translateX(-50%) translate3d(0,0,0)",willChange:"transform"}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setPage(n.id)} style={{flex:1,padding:"10px 4px 12px",border:"none",cursor:"pointer",background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .15s",position:"relative"}}>
            {page===n.id && <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:32,height:3,borderRadius:"0 0 3px 3px",background:DS.blue}}/>}
            <div style={{width:38,height:38,borderRadius:12,background:page===n.id?"#eef2f7":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",boxShadow:page===n.id?DS.nmShadowSm:"none"}}>
              {n.icon(page===n.id)}
            </div>
            <span style={{fontSize:10,fontWeight:page===n.id?700:500,color:page===n.id?(n.id==="rdv"?"#818cf8":DS.blue):"#94a3b8"}}>{n.l}</span>
          </button>
        ))}
      </div>}

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

      {/* MODAL ALERTES */}
      {showModalAlertes&&(()=>{
        const alertes = clients.filter(c=>alerteClient(c,passages)!=="ok"&&!dismissedAlertes.includes(c.id));
        return (
          <Modal title={`Alertes (${alertes.length})`} onClose={()=>setShowModalAlertes(false)}>
            {dismissedAlertes.length>0&&(
              <button onClick={()=>{ setDismissedAlertes([]); try{localStorage.removeItem("briblue_dismissed_alertes");}catch{} }} style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,padding:"7px 14px",borderRadius:8,background:"#f1f5f9",border:"1.5px solid #e2e8f0",cursor:"pointer",fontSize:12,fontWeight:700,color:"#64748b",fontFamily:"inherit"}}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                Restaurer {dismissedAlertes.length} alerte{dismissedAlertes.length>1?"s":""} masquée{dismissedAlertes.length>1?"s":""}
              </button>
            )}
            {alertes.length===0
              ? <div style={{textAlign:"center",color:DS.mid,padding:32,fontSize:13}}>{dismissedAlertes.length>0?"Toutes les alertes sont masquées":"Aucune alerte en cours"}</div>
              : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {alertes.map(c=>{
                  const al=alerteClient(c,passages); const col=AC[al]; const j=daysUntil(c.dateFin);
                  const mpm=c.moisParMois||c.saisons||{};
                  const tE=totalAnnuel(mpm,"entretien"), tC=totalAnnuel(mpm,"controle"), tot=tE+tC;
                  const cs=c.dateDebut?c.dateDebut.slice(0,10):null; const ce=c.dateFin?c.dateFin.slice(0,10):null;
          const inC=(p)=>{const ds=String(p.date).slice(0,10);return cs&&ce?ds>=cs&&ds<=ce:new Date(p.date).getFullYear()===YEAR_NOW;};
          const eE=passages.filter(p=>p.clientId===c.id&&inC(p)&&isEntretienType(p.type)).length;
                  const eC=passages.filter(p=>p.clientId===c.id&&inC(p)&&isControleType(p.type)).length;
                  const eff=eE+eC;
                  const pct=tot>0?Math.round(eff/tot*100):0;
                  // Calcul des mois en retard (mois passés où des passages restent)
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
                      <button onClick={(e)=>{e.stopPropagation();dismissAlerte(c.id);}} title="Masquer cette alerte" style={{position:"absolute",top:8,right:8,zIndex:2,width:26,height:26,borderRadius:8,background:"rgba(0,0,0,0.08)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} className="btn-hover">
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
                              <div key={m} style={{background:"#eef2f7",border:"1.5px solid "+col.bd,borderRadius:8,padding:"5px 9px",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
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
// ================================================================
// IMPORT CONNECTEAM
// ================================================================
function ModalImportConnecteam({ clients, onImport, onClose }) {
  const [status, setStatus] = useState("idle"); // idle | parsing | preview | importing | done
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [selected, setSelected] = useState([]);
  const isMobile = useIsMobile();

  // Mapping colonnes Connecteam → champs passage BRIBLUE
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
      id: uid(),
      clientId,
      date,
      tech: row[7] || "Dorian",
      type: mapType(row[16]),
      tSel: fixNum(row[17]), tPhosphate: fixNum(row[18]), tStabilisant: fixNum(row[19]), tChlore: fixNum(row[20]), tPH: fixNum(row[21]),
      qualiteEau: row[22]||"",
      etatFond: row[23] ? [row[23]] : [],
      etatParois: row[24] ? [row[24]] : [],
      etatLocal: row[25] ? [row[25]] : [],
      etatBacTampon: row[26] ? [row[26]] : [],
      etatVoletBac: row[27] ? [row[27]] : [],
      corrChlore: row[28]||"", corrPhosphate: row[29]||"", corrPH: row[30]||"", corrSel: row[31]||"",
      corrAlgicide: row[32]||"", corrPeroxyde: row[33]||"", corrChloreChoc: row[34]||"", corrAutre: row[35]||"",
      devis: mapOuiNon(row[36]), priseEchantillon: mapOuiNon(row[37]),
      commentaires: row[38]||"",
      photoArrivee: photos[0]||"",
      photos: photos.slice(1),
      photoDepart: photosDepart[0]||"",
      photosDepart: photosDepart.slice(1),
      livraisonProduits: mapOuiNon(row[54]),
      produitsLivres: row[55] ? String(row[55]).split(",").map(s=>s.trim()).filter(Boolean) : [],
      livraisonAutre: row[56]||"",
      ressenti: Number(row[57])||0,
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
        // Utilise SheetJS (XLSX) chargé en CDN
        const XLSX = window.XLSX;
        if (!XLSX) { setErrors(["SheetJS non chargé — rechargez la page"]); setStatus("idle"); return; }
        const wb = XLSX.read(e.target.result, {type:"array", cellDates:true});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:null});
        if (data.length < 2) { setErrors(["Fichier vide"]); setStatus("idle"); return; }
        const headers = data[0];
        const dataRows = data.slice(1).filter(r => r.some(v=>v));
        
        // Matcher les clients
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
      } catch(err) {
        setErrors([String(err)]);
        setStatus("idle");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const doImport = () => {
    setStatus("importing");
    const newClients = [];
    const newPassages = [];
    const clientMap = {};

    selected.forEach(i => {
      const {row, nomConnecteam, matched} = rows[i];
      let clientId;
      if (matched) {
        clientId = matched.id;
      } else {
        // Créer client si pas déjà créé dans ce batch
        if (clientMap[nomConnecteam]) {
          clientId = clientMap[nomConnecteam];
        } else {
          const newC = {
            id: uid(),
            nom: String(row[6]||row[5]||"Inconnu").trim(),
            tel:"", email:"", adresse:"", bassin:"Liner", volume:0,
            formule:"VAC", prix:0, prixPassageE:0, prixPassageC:0,
            dateDebut: new Date().toISOString().split("T")[0],
            dateFin: `${new Date().getFullYear()+1}-03-31`,
            photoPiscine:"", notesTarifaires:"",
            moisParMois: Object.fromEntries([1,2,3,4,5,6,7,8,9,10,11,12].map(m=>[m,{entretien:0,controle:0}])),
          };
          newClients.push(newC);
          clientMap[nomConnecteam] = newC.id;
          clientId = newC.id;
        }
      }
      const passage = mapRow(row, clientId);
      newPassages.push(passage);
    });

    onImport(newClients, newPassages);
    setStatus("done");
  };

  const unmatchedCount = rows.filter((_,i)=>selected.includes(i)&&!rows[i].matched).length;

  return (
    <Modal title="📥 Import Connecteam" onClose={onClose} wide>
      {/* Chargement SheetJS */}
      

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

      {status==="parsing"&&(
        <div style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:32,marginBottom:12}}>⏳</div>
          <div style={{fontWeight:700,color:DS.dark}}>Lecture en cours…</div>
        </div>
      )}

      {status==="preview"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:10,background:DS.blueSoft,border:"1px solid "+DS.border}}>
            <span style={{fontWeight:700,fontSize:14,color:DS.blue}}>{rows.length} passages trouvés</span>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setSelected(rows.map((_,i)=>i))} style={{fontSize:12,fontWeight:700,color:DS.blue,background:"none",border:"none",cursor:"pointer"}}>Tout sélect.</button>
              <button onClick={()=>setSelected([])} style={{fontSize:12,fontWeight:700,color:DS.mid,background:"none",border:"none",cursor:"pointer"}}>Tout désél.</button>
            </div>
          </div>
          {unmatchedCount>0&&(
            <div style={{padding:"10px 14px",background:"#fef3c7",borderRadius:8,border:"1px solid #fcd34d",fontSize:13,color:"#92400e"}}>
              ⚠️ <strong>{unmatchedCount} client(s) non trouvé(s)</strong> — seront créés automatiquement
            </div>
          )}
          <div style={{maxHeight:360,overflowY:"auto",WebkitOverflowScrolling:"touch",display:"flex",flexDirection:"column",gap:4}}>
            {rows.map((r,i)=>{
              const sel = selected.includes(i);
              return (
                <label key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,cursor:"pointer",background:sel?DS.white:DS.light,border:"1.5px solid "+(sel?DS.border:"transparent")}}>
                  <input type="checkbox" checked={sel} onChange={()=>setSelected(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i])} style={{accentColor:DS.blue,width:14,height:14,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{fontWeight:700,fontSize:13,color:DS.dark}}>{r.nomConnecteam||"—"}</span>
                      {r.matched
                        ? <span style={{fontSize:10,fontWeight:700,color:DS.green,background:DS.greenSoft,padding:"1px 6px",borderRadius:4}}>✓ {r.matched.nom}</span>
                        : <span style={{fontSize:10,fontWeight:700,color:"#b45309",background:"#fef3c7",padding:"1px 6px",borderRadius:4}}>+ Nouveau client</span>
                      }
                    </div>
                    <div style={{fontSize:11,color:DS.mid}}>
                      {r.row[4]?new Date(r.row[4]).toLocaleDateString("fr"):"—"} · {r.row[16]||"Type ?"}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <div style={{display:"flex",gap:10,paddingTop:8,borderTop:"1px solid "+DS.border}}>
            <button onClick={()=>setStatus("idle")} style={{flex:1,padding:"11px",borderRadius:DS.radiusSm,background:DS.light,border:"1px solid "+DS.border,cursor:"pointer",fontWeight:700,fontSize:13,color:DS.mid,fontFamily:"inherit"}}>
              ← Retour
            </button>
            <button onClick={doImport} disabled={selected.length===0}
              style={{flex:2,padding:"11px",borderRadius:DS.radiusSm,background:selected.length>0?DS.blue:"#9ca3af",border:"none",cursor:selected.length>0?"pointer":"default",fontWeight:700,fontSize:13,color:"#fff",fontFamily:"inherit"}}>
              Importer {selected.length} passage{selected.length!==1?"s":""}
            </button>
          </div>
        </div>
      )}

      {status==="importing"&&(
        <div style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:32,marginBottom:12}}>💾</div>
          <div style={{fontWeight:700,color:DS.dark}}>Import en cours…</div>
        </div>
      )}

      {status==="done"&&(
        <div style={{textAlign:"center",padding:32,display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
          <div style={{fontSize:48}}>✅</div>
          <div style={{fontWeight:800,fontSize:16,color:DS.green}}>Import terminé !</div>
          <div style={{fontSize:13,color:DS.mid}}>{selected.length} passages importés</div>
          <button onClick={onClose} style={{marginTop:8,padding:"11px 24px",borderRadius:DS.radiusSm,background:DS.blue,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,color:"#fff",fontFamily:"inherit"}}>
            Fermer
          </button>
        </div>
      )}
    </Modal>
  );
}