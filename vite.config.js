import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Vite 8 / Rolldown : forcer l'automatic JSX runtime (évite le TDZ
      // "Cannot access X before initialization" causé par le runtime classique
      // qui injecte React.createElement avant que React soit initialisé dans le bundle).
      jsxRuntime: 'automatic',
      // Inclure les .js contenant du JSX (constants.jsx, ui.jsx, styles.jsx)
      include: /\.(jsx|js|tsx|ts)$/,
    }),
  ],
  build: {
    // Activer le source map en production pour faciliter le débogage
    // (peut être désactivé si le bundle est trop volumineux)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Séparer les vendors (Rolldown exige une fonction, pas un objet)
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/firebase')) {
            return 'firebase-vendor';
          }
        },
      },
    },
  },
})
