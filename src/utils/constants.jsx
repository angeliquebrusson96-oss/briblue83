// @ts-nocheck
import React from "react";

// ─── BRAND ASSETS ──────────────────────────────────────────────────────────────
export const BRAND_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
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

export const LOGO_FICHE = "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%224%22%20y%3D%223%22%20width%3D%2216%22%20height%3D%2218%22%20rx%3D%222%22/%3E%3Cpolyline%20points%3D%2216%203%2016%207%2020%207%22/%3E%3Cpath%20d%3D%22M8%209l1%201%202-2%22/%3E%3Cline%20x1%3D%2213%22%20y1%3D%2210%22%20x2%3D%2217%22%20y2%3D%2210%22/%3E%3Cpath%20d%3D%22M8%2014l1%201%202-2%22/%3E%3Cline%20x1%3D%2213%22%20y1%3D%2215%22%20x2%3D%2217%22%20y2%3D%2215%22/%3E%3C/svg%3E";

export const IconFiche = ({size=18, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="2"/>
    <polyline points="16 3 16 7 20 7" fill="none"/>
    <path d="M7 10l1.5 1.5L11 9"/>
    <line x1="13" y1="10.5" x2="17" y2="10.5"/>
    <path d="M7 15l1.5 1.5L11 14"/>
    <line x1="13" y1="15.5" x2="17" y2="15.5"/>
  </svg>
);

// ─── SVG ICON SET ──────────────────────────────────────────────────────────────
export const Ico = {
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

// ─── DATA CONSTANTS ────────────────────────────────────────────────────────────
export const MOIS_PAR_MOIS_DEF = Object.fromEntries([...Array(12)].map((_,i)=>[i+1,{entretien:0,controle:0}]));

export const SAISONS_META = {
  hiver:     { label: "Hiver",     icon: "snow",    mois: [12,1,2],  color: "#60a5fa", bg: "#eff6ff" },
  printemps: { label: "Printemps", icon: "flower",  mois: [3,4,5],   color: "#34d399", bg: "#ecfdf5" },
  ete:       { label: "Été",       icon: "sun",     mois: [6,7,8],   color: "#f59e0b", bg: "#fffbeb" },
  automne:   { label: "Automne",   icon: "leaf",    mois: [9,10,11], color: "#d97706", bg: "#fff7ed" },
};

export const MOIS = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
export const MOIS_L = ["","Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

export const CLIENTS_INIT = [
  { id:"C001", nom:"GAMBIN IMMO - COPRO O GARDEN", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"Confort+", prix:2418, prixPassageE:78, prixPassageC:0, dateDebut:"2025-09-29", dateFin:"2026-09-29", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:2,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:2,controle:0},11:{entretien:2,controle:0},12:{entretien:2,controle:0}} },
  { id:"C002", nom:"Mme HAMMER", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"Confort", prix:2210, prixPassageE:85, prixPassageC:0, dateDebut:"2026-03-01", dateFin:"2027-03-01", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
  { id:"C003", nom:"Mme LOPEZ", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"VAC+", prix:1690, prixPassageE:65, prixPassageC:0, dateDebut:"2025-06-01", dateFin:"2026-06-01", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
  { id:"C004", nom:"Mme MARCELLOT", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"VAC+", prix:1690, prixPassageE:65, prixPassageC:0, dateDebut:"2025-11-20", dateFin:"2026-11-20", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:1,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
  { id:"C005", nom:"Mr MOREL", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"VAC+", prix:1690, prixPassageE:65, prixPassageC:0, dateDebut:"2026-03-01", dateFin:"2027-03-01", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
  { id:"C006", nom:"Mr NEGRE Claude", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"Confort", prix:1740, prixPassageE:65, prixPassageC:35, dateDebut:"2026-04-01", dateFin:"2027-04-01", photoPiscine:"", moisParMois:{1:{entretien:0,controle:1},2:{entretien:0,controle:1},3:{entretien:0,controle:1},4:{entretien:2,controle:1},5:{entretien:4,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:1},11:{entretien:0,controle:1},12:{entretien:0,controle:1}} },
  { id:"C007", nom:"Mme RITTER", tel:"", email:"", adresse:"", bassin:"Liner", volume:0, formule:"VAC+", prix:1690, prixPassageE:65, prixPassageC:0, dateDebut:"2025-07-28", dateFin:"2026-07-28", photoPiscine:"", moisParMois:{1:{entretien:1,controle:0},2:{entretien:1,controle:0},3:{entretien:2,controle:0},4:{entretien:2,controle:0},5:{entretien:2,controle:0},6:{entretien:4,controle:0},7:{entretien:4,controle:0},8:{entretien:4,controle:0},9:{entretien:4,controle:0},10:{entretien:1,controle:0},11:{entretien:1,controle:0},12:{entretien:1,controle:0}} },
];

export const PASSAGES_INIT = [
  { id:1, clientId:"C001", date:"2026-04-06", type:"Entretien complet", ph:7.2, chlore:1.5, actions:"Nettoyage, vérif. pompe", obs:"RAS",                      tech:"Dorian", ok:true },
  { id:2, clientId:"C002", date:"2026-04-06", type:"Entretien complet", ph:7.4, chlore:1.2, actions:"Nettoyage, ajust. pH",    obs:"Filtre à changer bientôt", tech:"Dorian", ok:true },
  { id:3, clientId:"C001", date:"2026-04-07", type:"Contrôle d'eau",    ph:7.1, chlore:1.8, actions:"Contrôle mesures",          obs:"RAS",                      tech:"Dorian", ok:true },
];

export const PRODUITS_DEFAUT = ["Chlore lent Galet","PH minus","Flocculant","Anti-calcaire","Anti-Algues","Anti-Phosphate","Éponge Magique","Filtre à cartouche","Tac+","Chlore granule","Hypochlorite","Anti-Algues moutarde","Sac de sel"];

export const STATUT_LIV = {
  aFacturer: { label:"À facturer", color:"#0369a1", bg:"#f0f9ff" },
  facture:   { label:"Facturé",    color:"#0284c7", bg:"#e0f2fe" },
  paye:      { label:"Payé",       color:"#059669", bg:"#d1fae5" },
};

// ─── DESIGN SYSTEM ────────────────────────────────────────────────────────────
export const DS = {
  blue:       "#0891b2",
  blueSoft:   "rgba(8,145,178,0.1)",
  teal:       "#0e7490",
  tealSoft:   "rgba(14,116,144,0.1)",
  green:      "#059669",
  greenSoft:  "rgba(5,150,105,0.12)",
  red:        "#e11d48",
  redSoft:    "rgba(225,29,72,0.09)",
  orange:     "#f59e0b",
  orangeSoft: "rgba(245,158,11,0.1)",
  purple:     "#7c3aed",
  purpleSoft: "rgba(124,58,237,0.1)",
  dark:       "#0b1220",
  mid:        "#64748b",
  light:      "rgba(255,255,255,0.45)",
  white:      "#fff",
  border:     "rgba(6,182,212,0.18)",
  glass:      "rgba(255,255,255,0.55)",
  radius:     16,
  radiusSm:   12,
  radiusLg:   22,
  nmShadow:   "6px 6px 14px rgba(6,182,212,0.18), -4px -4px 10px rgba(255,255,255,0.75)",
  nmShadowSm: "3px 3px 8px rgba(6,182,212,0.14), -2px -2px 6px rgba(255,255,255,0.7)",
};

export const AC = {
  rouge:  { tx:"#be123c", bg:"#fff1f2", bd:"#fecdd3", lbl:"Urgent" },
  jaune:  { tx:"#b45309", bg:"#fffbeb", bd:"#fde68a", lbl:"À surveiller" },
  orange: { tx:"#c2410c", bg:"#fff7ed", bd:"#fed7aa", lbl:"En retard" },
  aFaire: { tx:"#0369a1", bg:"#e0f2fe", bd:"#bae6fd", lbl:"À planifier" },
  bleu:   { tx:"#1d4ed8", bg:"#eff6ff", bd:"#bfdbfe", lbl:"En retard" },
  ok:     { tx:"#065f46", bg:"#ecfdf5", bd:"#a7f3d0", lbl:"OK" },
};

export const RAPPORT_STATUS = {
  cree:     { label:"Créé",     color:"#64748b", bg:"#f8fafc" },
  envoye:   { label:"Envoyé",   color:"#0891b2", bg:"#e0f2fe" },
  lu:       { label:"Lu",       color:"#7c3aed", bg:"#f5f3ff" },
  valide:   { label:"Validé",   color:"#059669", bg:"#f0fdf4" },
};

export const AUTH = { email: "briblue83@hotmail.com", code: "2004" };
