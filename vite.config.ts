import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The API server (server/index.js) runs on :3001; proxying keeps the
    // browser on a single origin, so no CORS setup is needed in development.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
