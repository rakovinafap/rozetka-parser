import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/parse': 'http://localhost:3000',
      '/contact': 'http://localhost:3000'
    }
  }
})