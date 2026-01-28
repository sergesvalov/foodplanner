import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Позволяет доступ по IP в локальной сети
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Адрес твоего Python backend при локальном запуске
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})