import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: { allowedHosts: ['agrinova-ai-frontend.onrender.com'] },
  plugins: [react()],
})
