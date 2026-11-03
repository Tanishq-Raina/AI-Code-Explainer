import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const proxy = {
    '/render-api': {
      target: env.VIDEO_PROXY_TARGET || 'http://localhost:4000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/render-api/, '/api'),
    },
  }
  return {
  plugins: [react()],
  server: {
    proxy,
  },
  preview: { proxy },
  }
})
