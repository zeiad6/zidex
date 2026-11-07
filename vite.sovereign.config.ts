import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/**
 * The sovereign interface is built as its own app so the production site
 * (static HTML pages + the legacy SPA) is never touched by it. Dev:
 *   npm run dev:sovereign  →  http://127.0.0.1:5180
 * Build (only when asked):
 *   npm run build:sovereign →  dist-sovereign/
 */
const root = import.meta.dirname

export default defineConfig({
  root: path.resolve(root, 'sovereign'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(root, 'sovereign/src') },
  },
  server: { host: '127.0.0.1', port: 5180, strictPort: true },
  preview: { host: '127.0.0.1', port: 5180, strictPort: true },
  build: {
    target: 'es2022',
    outDir: path.resolve(root, 'dist-sovereign'),
    emptyOutDir: true,
    cssCodeSplit: true,
  },
})
