#!/bin/bash

# 와이파이 제보 시스템 배포 스크립트
# 사용법: ./scripts/deploy.sh [환경]
# 예시: ./scripts/deploy.sh production

set -e  # 에러 발생 시 스크립트 중단

# 환경 변수 설정
ENVIRONMENT=${1:-production}
PROJECT_NAME="wifi-report-system"
BUILD_DIR="build"
BACKUP_DIR="backup"

echo "🚀 $PROJECT_NAME 배포 시작 (환경: $ENVIRONMENT)"

# 1. 환경 확인
if [ "$ENVIRONMENT" != "production" ] && [ "$ENVIRONMENT" != "staging" ]; then
    echo "❌ 지원하지 않는 환경입니다. production 또는 staging을 사용하세요."
    exit 1
fi

# 2. 의존성 설치
echo "📦 의존성 설치 중..."
npm run install:all

# 3. 테스트 실행
echo "🧪 테스트 실행 중..."
cd server && npm test
cd ../client && npm test
cd ..

# 4. 빌드
echo "🔨 프로덕션 빌드 중..."
npm run build

# 5. 빌드 결과 확인
if [ ! -d "client/dist" ]; then
    echo "❌ 클라이언트 빌드 실패"
    exit 1
fi

if [ ! -d "server/dist" ]; then
    echo "❌ 서버 빌드 실패"
    exit 1
fi

# 6. 백업 생성 (기존 배포가 있는 경우)
if [ -d "$BUILD_DIR" ]; then
    echo "💾 기존 배포 백업 중..."
    BACKUP_NAME="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    mv "$BUILD_DIR" "$BACKUP_NAME"
    echo "✅ 백업 완료: $BACKUP_NAME"
fi

# 7. 배포 디렉토리 생성
echo "📁 배포 디렉토리 생성 중..."
mkdir -p "$BUILD_DIR"

# 8. 파일 복사
echo "📋 파일 복사 중..."
cp -r server/dist "$BUILD_DIR/server"
cp -r client/dist "$BUILD_DIR/client"
cp server/package.json "$BUILD_DIR/server/"
cp server/package-lock.json "$BUILD_DIR/server/"
cp -r server/migrations "$BUILD_DIR/server/"

# 환경 변수 파일 복사
if [ -f "server/.env.$ENVIRONMENT" ]; then
    cp "server/.env.$ENVIRONMENT" "$BUILD_DIR/server/.env"
fi

if [ -f "client/.env.$ENVIRONMENT" ]; then
    cp "client/.env.$ENVIRONMENT" "$BUILD_DIR/client/.env"
fi

# 9. 프로덕션 의존성 설치
echo "📦 프로덕션 의존성 설치 중..."
cd "$BUILD_DIR/server"
npm ci --only=production
cd ../..

# 10. 데이터베이스 마이그레이션 (프로덕션 환경에서만)
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🗄️ 데이터베이스 마이그레이션 실행 중..."
    cd "$BUILD_DIR/server"
    node -e "
        const { MigrationManager } = require('./utils/migration.js');
        const { getDatabase } = require('./database/connection.js');
        
        async function runMigrations() {
            const db = getDatabase();
            const migrationManager = new MigrationManager(db);
            await migrationManager.runMigrations();
            db.close();
        }
        
        runMigrations().catch(console.error);
    "
    cd ../..
fi

# 11. 권한 설정
echo "🔐 권한 설정 중..."
chmod +x "$BUILD_DIR/server/index.js"

# 12. 배포 완료
echo "✅ 배포 완료!"
echo "📍 배포 위치: $(pwd)/$BUILD_DIR"
echo "🌐 서버 시작: cd $BUILD_DIR/server && npm start"

# 13. 배포 정보 저장
cat > "$BUILD_DIR/deployment-info.json" << EOF
{
  "environment": "$ENVIRONMENT",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF

echo "📊 배포 정보가 $BUILD_DIR/deployment-info.json에 저장되었습니다."

# 14. 헬스체크 (선택사항)
if command -v curl &> /dev/null; then
    echo "🏥 헬스체크 수행 중..."
    sleep 5
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ 서버가 정상적으로 실행 중입니다."
    else
        echo "⚠️ 서버 헬스체크 실패. 수동으로 확인해주세요."
    fi
fi

echo "🎉 배포 프로세스가 완료되었습니다!"