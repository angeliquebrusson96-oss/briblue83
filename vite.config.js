import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Vite 8 / rolldown ne traite plus le JSX dans .js par défaut
      // constants.js, ui.js, styles.js contiennent du JSX → on les inclut
      include: /\.(jsx|js|tsx|ts)$/,
    }),
  ],
})
