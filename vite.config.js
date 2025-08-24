import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/lms/',              // 항상 /lms/ 기준으로 빌드
  plugins: [react()],
  build: { outDir: 'dist' },
})
