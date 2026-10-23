import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    rollupOptions: {
      output: {
        // Heavy libraries get their own long-cached chunks so the public site never
        // downloads charts / the rich-text editor / QR tooling it does not use.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (/[\\/](recharts|d3-[^\\/]+|victory-vendor)[\\/]/.test(id)) return 'charts';
          if (/[\\/](react-quill-new|quill[^\\/]*)[\\/]/.test(id)) return 'editor';
          if (/[\\/]framer-motion[\\/]/.test(id)) return 'motion';
          if (/[\\/](i18next[^\\/]*|react-i18next)[\\/]/.test(id)) return 'i18n';
        }
      }
    }
  }
})
