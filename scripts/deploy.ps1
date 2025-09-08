# 와이파이 제보 시스템 배포 스크립트 (Windows PowerShell)
# 사용법: .\scripts\deploy.ps1 [환경]
# 예시: .\scripts\deploy.ps1 production

param(
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

# 환경 변수 설정
$ProjectName = "wifi-report-system"
$BuildDir = "build"
$BackupDir = "backup"

Write-Host "🚀 $ProjectName 배포 시작 (환경: $Environment)" -ForegroundColor Green

# 1. 환경 확인
if ($Environment -notin @("production", "staging")) {
    Write-Host "❌ 지원하지 않는 환경입니다. production 또는 staging을 사용하세요." -ForegroundColor Red
    exit 1
}

# 2. 의존성 설치
Write-Host "📦 의존성 설치 중..." -ForegroundColor Yellow
npm run install:all
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 의존성 설치 실패" -ForegroundColor Red
    exit 1
}

# 3. 테스트 실행
Write-Host "🧪 테스트 실행 중..." -ForegroundColor Yellow
Set-Location server
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 서버 테스트 실패" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ../client
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 클라이언트 테스트 실패" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

# 4. 빌드
Write-Host "🔨 프로덕션 빌드 중..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 빌드 실패" -ForegroundColor Red
    exit 1
}

# 5. 빌드 결과 확인
if (!(Test-Path "client\dist")) {
    Write-Host "❌ 클라이언트 빌드 실패" -ForegroundColor Red
    exit 1
}

if (!(Test-Path "server\dist")) {
    Write-Host "❌ 서버 빌드 실패" -ForegroundColor Red
    exit 1
}

# 6. 백업 생성 (기존 배포가 있는 경우)
if (Test-Path $BuildDir) {
    Write-Host "💾 기존 배포 백업 중..." -ForegroundColor Yellow
    $BackupName = "$BackupDir\backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    if (!(Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }
    Move-Item $BuildDir $BackupName
    Write-Host "✅ 백업 완료: $BackupName" -ForegroundColor Green
}

# 7. 배포 디렉토리 생성
Write-Host "📁 배포 디렉토리 생성 중..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $BuildDir | Out-Null

# 8. 파일 복사
Write-Host "📋 파일 복사 중..." -ForegroundColor Yellow
Copy-Item -Recurse "server\dist" "$BuildDir\server"
Copy-Item -Recurse "client\dist" "$BuildDir\client"
Copy-Item "server\package.json" "$BuildDir\server\"
Copy-Item "server\package-lock.json" "$BuildDir\server\"
Copy-Item -Recurse "server\migrations" "$BuildDir\server\"

# 환경 변수 파일 복사
if (Test-Path "server\.env.$Environment") {
    Copy-Item "server\.env.$Environment" "$BuildDir\server\.env"
}

if (Test-Path "client\.env.$Environment") {
    Copy-Item "client\.env.$Environment" "$BuildDir\client\.env"
}

# 9. 프로덕션 의존성 설치
Write-Host "📦 프로덕션 의존성 설치 중..." -ForegroundColor Yellow
Set-Location "$BuildDir\server"
npm ci --only=production
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 프로덕션 의존성 설치 실패" -ForegroundColor Red
    Set-Location ..\..
    exit 1
}
Set-Location ..\..

# 10. 배포 완료
Write-Host "✅ 배포 완료!" -ForegroundColor Green
Write-Host "📍 배포 위치: $(Get-Location)\$BuildDir" -ForegroundColor Cyan
Write-Host "🌐 서버 시작: cd $BuildDir\server && npm start" -ForegroundColor Cyan

# 11. 배포 정보 저장
$DeploymentInfo = @{
    environment = $Environment
    deployedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    version = try { git rev-parse HEAD } catch { "unknown" }
    branch = try { git branch --show-current } catch { "unknown" }
} | ConvertTo-Json -Depth 2

$DeploymentInfo | Out-File "$BuildDir\deployment-info.json" -Encoding UTF8

Write-Host "📊 배포 정보가 $BuildDir\deployment-info.json에 저장되었습니다." -ForegroundColor Cyan

# 12. 헬스체크 (선택사항)
if (Get-Command curl -ErrorAction SilentlyContinue) {
    Write-Host "🏥 헬스체크 수행 중..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    try {
        $response = curl -f http://localhost:3000/health 2>$null
        Write-Host "✅ 서버가 정상적으로 실행 중입니다." -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ 서버 헬스체크 실패. 수동으로 확인해주세요." -ForegroundColor Yellow
    }
}

Write-Host "🎉 배포 프로세스가 완료되었습니다!" -ForegroundColor Green