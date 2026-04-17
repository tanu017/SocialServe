import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5050',
      // Socket.IO client connects to the dev origin; forward WS + HTTP long-polling to the API server
      '/socket.io': {
        target: 'http://localhost:5050',
        ws: true,
      },
    },
  },
})
