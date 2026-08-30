import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Retire le splash HTML dès que React a monté (fondu court pour éviter le flash)
requestAnimationFrame(() => {
  const splash = document.getElementById('bb-splash');
  if (!splash) return;
  splash.style.transition = 'opacity .25s ease';
  splash.style.opacity = '0';
  setTimeout(() => splash.remove(), 260);
});
