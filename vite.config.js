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
    // Bug Rolldown : son minifieur assigne le même nom court (ex. "Re", "Ne")
    // à des variables de portées imbriquées (module + fonction), causant un TDZ.
    // esbuild n'a pas ce bug et est plus rapide.
    // oxc = nouveau minifieur Vite 8 (esbuild est déprécié dans Vite 8)
    minify: 'oxc',
    rollupOptions: {
      output: {
        // Rolldown scope-flattening bug : il assigne le même nom court (ex. "Re")
        // à des variables de modules différents (helpers.js "Re" = calculerPassagesPrevusContrat,
        // App.jsx "Re" = saveStock hook), causant un TDZ à l'exécution.
        // La solution : forcer chaque groupe de modules dans son propre chunk → portées séparées.
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/firebase')) {
            return 'firebase-vendor';
          }
          // Isoler les utilitaires dans leurs propres chunks pour éviter la collision de noms
          if (id.includes('/src/utils/helpers')) return 'utils-helpers';
          if (id.includes('/src/utils/constants')) return 'utils-constants';
          if (id.includes('/src/lib/')) return 'lib';
        },
      },
    },
  },
})
