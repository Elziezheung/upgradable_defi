import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' ws: localhost:* 127.0.0.1:* *; script-src 'self' 'unsafe-inline' 'unsafe-eval' ws: localhost:* 127.0.0.1:* *; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: *; connect-src 'self' ws: wss: http: https: localhost:* 127.0.0.1:* *;"
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
