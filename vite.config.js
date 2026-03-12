import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: This fixes the black screen by making paths relative
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})