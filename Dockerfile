# 멀티 스테이지 빌드를 사용한 프로덕션 Docker 이미지

# Stage 1: Build stage
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 (캐시 최적화)
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# 의존성 설치
RUN npm ci --only=production && \
    cd client && npm ci && \
    cd ../server && npm ci

# 소스 코드 복사
COPY . .

# 빌드 실행
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

# 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# 필요한 시스템 패키지 설치
RUN apk add --no-cache \
    sqlite \
    curl \
    && rm -rf /var/cache/apk/*

# 빌드된 파일 복사
COPY --from=builder --chown=nextjs:nodejs /app/server/dist ./server/
COPY --from=builder --chown=nextjs:nodejs /app/client/dist ./client/
COPY --from=builder --chown=nextjs:nodejs /app/server/package*.json ./server/
COPY --from=builder --chown=nextjs:nodejs /app/server/migrations ./server/migrations/

# 프로덕션 의존성만 설치
WORKDIR /app/server
RUN npm ci --only=production && npm cache clean --force

# 데이터 디렉토리 생성
RUN mkdir -p /app/server/data && \
    chown -R nextjs:nodejs /app/server/data

# 로그 디렉토리 생성
RUN mkdir -p /var/log/wifi-report && \
    chown -R nextjs:nodejs /var/log/wifi-report

# 사용자 전환
USER nextjs

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 포트 노출
EXPOSE 3000

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 애플리케이션 시작
CMD ["node", "index.js"]