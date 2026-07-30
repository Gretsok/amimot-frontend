import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En dev, le serveur Vite relaie /api et /socket.io vers le conteneur backend
// (DNS Docker), pour reproduire exactement le même comportement de routage
// que le reverse proxy Nginx utilisé en prod (décision d'architecture #3).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://backend:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.BACKEND_URL || 'http://backend:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
