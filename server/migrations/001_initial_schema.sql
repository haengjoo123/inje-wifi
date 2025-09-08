-- 초기 데이터베이스 스키마 생성
-- 실행 날짜: 2024-01-01
-- 설명: 제보 및 공감 테이블 생성

-- 제보 테이블 생성
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    campus VARCHAR(50) NOT NULL,
    building VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    problem_types TEXT NOT NULL, -- JSON 형태로 저장
    custom_problem VARCHAR(200),
    description TEXT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    empathy_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 공감 테이블 생성
CREATE TABLE IF NOT EXISTS empathies (
    id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL,
    user_identifier VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_reports_campus ON reports(campus);
CREATE INDEX IF NOT EXISTS idx_reports_building ON reports(building);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_empathy_count ON reports(empathy_count);
CREATE INDEX IF NOT EXISTS idx_empathies_report_id ON empathies(report_id);
CREATE INDEX IF NOT EXISTS idx_empathies_user_identifier ON empathies(user_identifier);

-- 유니크 제약조건 (중복 공감 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_empathy ON empathies(report_id, user_identifier);