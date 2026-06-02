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
    // Solution : terser avec mangle désactivé (pas de renommage = pas de collision).
    // La compression whitespace/dead-code reste active → ~même taille que OXC.
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      // Ne pas renommer les variables → aucun risque de collision de noms
      mangle: false,
      compress: {
        // Désactiver les optimisations qui réordonnent les déclarations (cause TDZ)
        sequences: false,
        // Conserver les noms de fonctions pour le débogage
        keep_fnames: true,
        // Supprimer tous les console.* en production → moins d'infos en clair
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        // Supprimer les commentaires pour réduire la taille
        comments: false,
      },
    },
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
          // Firebase v12 scoped packages : firebase/ ET @firebase/ ET @grpc/
          if (
            normalId.includes('node_modules/firebase') ||
            normalId.includes('node_modules/@firebase') ||
            normalId.includes('node_modules/@grpc')
          ) {
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
