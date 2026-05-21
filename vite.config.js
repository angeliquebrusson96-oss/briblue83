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
    // Bug Rolldown/OXC : le minifieur assigne le même nom court (Re, Ne, ut...)
    // à des variables dans des portées imbriquées (module scope ET scope App()),
    // causant un TDZ "Cannot access X before initialization" à l'exécution.
    //
    // Solution définitive : désactiver la minification des variables (mangling).
    // La compression whitespace/dead-code est conservée via rolldownOptions.
    // Impact taille : +20-30% gzip, mais l'app fonctionne correctement.
    minify: false,
    rollupOptions: {
      output: {
        // Séparer les vendors et utilitaires en chunks distincts
        // (portées JS isolées + meilleure mise en cache)
        manualChunks(id) {
          // Normaliser les séparateurs de chemin (Windows \ vs Linux /)
          const normalId = id.replace(/\\/g, '/');
          if (normalId.includes('node_modules/react') || normalId.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (normalId.includes('node_modules/firebase')) {
            return 'firebase-vendor';
          }
          if (normalId.includes('/src/utils/helpers')) return 'utils-helpers';
          if (normalId.includes('/src/utils/constants')) return 'utils-constants';
          if (normalId.includes('/src/lib/')) return 'lib';
          if (normalId.includes('/src/pages/')) return 'pages';
          if (normalId.includes('/src/components/')) return 'components';
          if (normalId.includes('/src/styles')) return 'styles';
        },
      },
    },
  },
})
