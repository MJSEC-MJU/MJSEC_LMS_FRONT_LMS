import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  // 개발과 배포에서 base 경로를 분리
  base: mode === 'development' ? '/' : '/lms/',
  plugins: [react()],
  build: { outDir: 'dist' },
  server: {
    // CORS 회피를 위한 개발 프록시 설정
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // 일부 스프링 보안 설정에서 Origin을 엄격히 검사하여 403을 반환하는 경우가 있음
            // 개발 환경에서는 Origin 헤더를 제거하여 단순 Same-Origin 요청처럼 보이게 함
            proxyReq.removeHeader('origin')
          })
        },
      },
    },
  },
}))
