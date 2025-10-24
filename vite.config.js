import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy:{
      '/api':{
        // target : 'http://127.0.0.1:8000',
        target : 'https://api.tagemi-foundation.org',
        changeOrigin : true,
        headers:{
          Accept:'application/json',
          "Content-Type" : 'application/json',
          "Access-Control-Allow-Origin": "https://api.tagemi-foundation.org",
          // "Access-Control-Allow-Origin": "http://127.0.0.1:8000",
          "Access-Control-Allow-Methods":"GET, POST, PUT, OPTIONS"

        }
      }
    }
  }
})
