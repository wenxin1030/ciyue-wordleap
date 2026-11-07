import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  server: { port: 5173, host: '127.0.0.1' },
  build: { chunkSizeWarningLimit: 1600 }
})
