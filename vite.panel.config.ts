import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/** بناء لوحة التحكم المصغّرة (Mini App) — تطبيق مستقل عن الموقع الرئيسي:
 *  جذره panel/، مخرجه dist/panel، ويُخدم من /panel/ فيعود رابط اللوحة ثابتاً
 *  لكل بوت: zeidexsoft.com/panel/#id=<botId>. */
export default defineConfig({
  root: 'panel',
  base: '/panel/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './panel') },
  },
  build: {
    target: 'es2022',
    outDir: '../dist/panel',
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
  },
})
