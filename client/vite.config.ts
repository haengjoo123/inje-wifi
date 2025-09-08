import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // 프로덕션 빌드 최적화
    minify: 'esbuild', // terser 대신 esbuild 사용
    // 청크 분할 최적화
    rollupOptions: {
      output: {
        manualChunks: {
          // 벤더 라이브러리 분리
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          utils: ['axios'],
        },
      },
    },
    // 청크 크기 경고 임계값 (KB)
    chunkSizeWarningLimit: 1000,
    // 소스맵 생성 (프로덕션에서는 false로 설정)
    sourcemap: false,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  // 프리뷰 서버 설정
  preview: {
    port: 4173,
    host: true,
  },
})