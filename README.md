# 인제대학교 와이파이 문제 제보 시스템

학생들이 캠퍼스 내 와이파이 문제를 제보하고 공유할 수 있는 웹 애플리케이션입니다.

## 기술 스택

- **Frontend**: React.js + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: SQLite (개발), PostgreSQL (운영)
- **Testing**: Jest (Backend), Vitest (Frontend)

## 프로젝트 구조

```
wifi-report-system/
├── client/          # React 프론트엔드
├── server/          # Express 백엔드
├── package.json     # 루트 패키지 설정
└── README.md
```

## 설치 및 실행

### 1. 의존성 설치

```bash
# 모든 패키지 설치
npm run install:all
```

### 2. 개발 서버 실행

```bash
# 프론트엔드와 백엔드 동시 실행
npm run dev
```

개별 실행:
```bash
# 백엔드만 실행 (포트 3001)
npm run dev:server

# 프론트엔드만 실행 (포트 3000)
npm run dev:client
```

### 3. 빌드

```bash
# 전체 빌드
npm run build

# 개별 빌드
npm run build:client
npm run build:server
```

### 4. 테스트

```bash
# 백엔드 테스트
cd server && npm test

# 프론트엔드 테스트
cd client && npm test
```

## API 엔드포인트

- `GET /api/health` - 서버 상태 확인
- `POST /api/reports` - 새 제보 생성
- `GET /api/reports` - 제보 목록 조회
- `GET /api/reports/:id` - 특정 제보 조회
- `PUT /api/reports/:id` - 제보 수정
- `DELETE /api/reports/:id` - 제보 삭제
- `POST /api/reports/:id/empathy` - 공감 추가

## 환경 변수

서버 환경 변수 (`server/.env`):
```
PORT=3001
NODE_ENV=development
```