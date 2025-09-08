# 배포 가이드

인제대학교 와이파이 문제 제보 시스템의 프로덕션 배포 가이드입니다.

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [환경 설정](#환경-설정)
3. [배포 방법](#배포-방법)
4. [모니터링 및 유지보수](#모니터링-및-유지보수)
5. [트러블슈팅](#트러블슈팅)

## 시스템 요구사항

### 최소 요구사항
- **CPU**: 2 코어
- **메모리**: 2GB RAM
- **디스크**: 10GB 여유 공간
- **OS**: Ubuntu 20.04 LTS, CentOS 8, 또는 Windows Server 2019
- **Node.js**: 18.x 이상
- **npm**: 8.x 이상

### 권장 요구사항
- **CPU**: 4 코어
- **메모리**: 4GB RAM
- **디스크**: 50GB SSD
- **네트워크**: 100Mbps 이상

## 환경 설정

### 1. 환경 변수 설정

프로덕션 환경에서는 다음 환경 변수들을 설정해야 합니다:

#### 서버 환경 변수 (`server/.env.production`)
```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 데이터베이스 설정
DB_PATH=./data/wifi_report_prod.db

# 보안 설정
BCRYPT_ROUNDS=12
SESSION_SECRET=your_secure_session_secret_here

# CORS 설정
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 로깅 설정
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/wifi-report/app.log

# 레이트 리미팅
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 클라이언트 환경 변수 (`client/.env.production`)
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_TITLE=인제대학교 와이파이 문제 제보 시스템
VITE_APP_VERSION=1.0.0
```

### 2. 보안 설정

#### SSL/TLS 인증서
프로덕션 환경에서는 반드시 HTTPS를 사용해야 합니다:

```bash
# Let's Encrypt를 사용한 무료 SSL 인증서 발급
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

#### 방화벽 설정
```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 배포 방법

### 방법 1: 자동 배포 스크립트 사용 (권장)

#### Linux/macOS
```bash
# 저장소 클론
git clone https://github.com/your-repo/wifi-report-system.git
cd wifi-report-system

# 배포 스크립트 실행 권한 부여
chmod +x scripts/deploy.sh

# 프로덕션 배포
./scripts/deploy.sh production
```

#### Windows
```powershell
# PowerShell에서 실행
.\scripts\deploy.ps1 production
```

### 방법 2: Docker를 사용한 배포

#### Docker Compose 사용 (권장)
```bash
# 환경 변수 파일 생성
cp .env.example .env.production

# 환경 변수 편집
nano .env.production

# Docker Compose로 배포
docker-compose up -d

# 로그 확인
docker-compose logs -f wifi-report-app
```

#### 단일 Docker 컨테이너
```bash
# 이미지 빌드
docker build -t wifi-report-system .

# 컨테이너 실행
docker run -d \
  --name wifi-report-app \
  -p 3000:3000 \
  -v wifi_data:/app/server/data \
  -e NODE_ENV=production \
  wifi-report-system
```

### 방법 3: 수동 배포

```bash
# 1. 의존성 설치
npm run install:all

# 2. 테스트 실행
npm test

# 3. 프로덕션 빌드
npm run build

# 4. 데이터베이스 마이그레이션
npm run migrate

# 5. 서버 시작
npm run start:prod
```

## 프로세스 관리

### PM2를 사용한 프로세스 관리 (권장)

```bash
# PM2 설치
npm install -g pm2

# 애플리케이션 시작
pm2 start server/dist/index.js --name wifi-report-app

# 시스템 부팅 시 자동 시작 설정
pm2 startup
pm2 save

# 프로세스 상태 확인
pm2 status

# 로그 확인
pm2 logs wifi-report-app

# 애플리케이션 재시작
pm2 restart wifi-report-app
```

### systemd 서비스 설정

```bash
# 서비스 파일 생성
sudo nano /etc/systemd/system/wifi-report.service
```

```ini
[Unit]
Description=WiFi Report System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/wifi-report-system/build/server
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# 서비스 활성화 및 시작
sudo systemctl enable wifi-report
sudo systemctl start wifi-report
sudo systemctl status wifi-report
```

## 리버스 프록시 설정 (Nginx)

### Nginx 설정 파일 (`/etc/nginx/sites-available/wifi-report`)

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL 설정
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # 보안 헤더
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # 정적 파일 서빙
    location / {
        root /path/to/wifi-report-system/build/client;
        try_files $uri $uri/ /index.html;
        
        # 캐시 설정
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 프록시
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 헬스체크
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
```

```bash
# 설정 활성화
sudo ln -s /etc/nginx/sites-available/wifi-report /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 모니터링 및 유지보수

### 헬스체크

시스템 상태를 확인하는 엔드포인트들:

- **기본 헬스체크**: `GET /health`
- **간단한 핑**: `GET /ping`
- **준비 상태**: `GET /ready`
- **메트릭스**: `GET /metrics`

### 로그 관리

```bash
# 로그 파일 위치
/var/log/wifi-report/app.log

# 로그 로테이션 설정 (/etc/logrotate.d/wifi-report)
/var/log/wifi-report/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload wifi-report
    endscript
}
```

### 백업

```bash
# 데이터베이스 백업 스크립트
#!/bin/bash
BACKUP_DIR="/backup/wifi-report"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="/path/to/wifi-report-system/build/server/data/wifi_report_prod.db"

mkdir -p $BACKUP_DIR
cp $DB_PATH "$BACKUP_DIR/wifi_report_$DATE.db"

# 30일 이상 된 백업 파일 삭제
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
```

### 성능 모니터링

#### Prometheus + Grafana 설정

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'wifi-report-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

## 트러블슈팅

### 일반적인 문제들

#### 1. 서버가 시작되지 않는 경우
```bash
# 로그 확인
pm2 logs wifi-report-app
# 또는
journalctl -u wifi-report -f

# 포트 사용 확인
sudo netstat -tlnp | grep :3000
```

#### 2. 데이터베이스 연결 오류
```bash
# 데이터베이스 파일 권한 확인
ls -la /path/to/database/file

# 디렉토리 권한 설정
sudo chown -R www-data:www-data /path/to/data/directory
```

#### 3. 메모리 부족
```bash
# 메모리 사용량 확인
free -h
pm2 monit

# 스왑 파일 생성 (임시 해결책)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 4. SSL 인증서 문제
```bash
# 인증서 갱신
sudo certbot renew

# Nginx 설정 테스트
sudo nginx -t
```

### 성능 최적화

#### 1. 데이터베이스 최적화
```sql
-- 인덱스 재구성
REINDEX;

-- 통계 업데이트
ANALYZE;

-- 불필요한 데이터 정리
DELETE FROM empathies WHERE created_at < date('now', '-1 year');
```

#### 2. 캐시 설정
```bash
# Redis 설치 및 설정 (선택사항)
sudo apt install redis-server
sudo systemctl enable redis-server
```

## 보안 체크리스트

- [ ] HTTPS 설정 완료
- [ ] 환경 변수에 민감한 정보 저장
- [ ] 방화벽 설정 완료
- [ ] 정기적인 보안 업데이트
- [ ] 로그 모니터링 설정
- [ ] 백업 시스템 구축
- [ ] 레이트 리미팅 설정
- [ ] CORS 정책 설정
- [ ] SQL 인젝션 방지 확인

## 연락처

배포 관련 문제가 발생하면 다음으로 연락하세요:

- **개발팀**: dev@example.com
- **인프라팀**: infra@example.com
- **긴급상황**: +82-10-0000-0000