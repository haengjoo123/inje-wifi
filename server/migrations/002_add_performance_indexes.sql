-- 성능 최적화를 위한 추가 인덱스
-- 실행 날짜: 2024-01-15
-- 설명: 검색 및 정렬 성능 향상을 위한 복합 인덱스 추가

-- 캠퍼스별 최신순 정렬을 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_reports_campus_created_at ON reports(campus, created_at DESC);

-- 캠퍼스별 공감순 정렬을 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_reports_campus_empathy_count ON reports(campus, empathy_count DESC, created_at DESC);

-- 건물명 검색을 위한 인덱스 (LIKE 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_reports_building_lower ON reports(LOWER(building));

-- 전체 텍스트 검색을 위한 가상 테이블 (SQLite FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS reports_fts USING fts5(
    building,
    location,
    description,
    content='reports',
    content_rowid='rowid'
);

-- FTS 트리거 생성 (데이터 동기화)
CREATE TRIGGER IF NOT EXISTS reports_fts_insert AFTER INSERT ON reports BEGIN
    INSERT INTO reports_fts(rowid, building, location, description) 
    VALUES (new.rowid, new.building, new.location, new.description);
END;

CREATE TRIGGER IF NOT EXISTS reports_fts_delete AFTER DELETE ON reports BEGIN
    INSERT INTO reports_fts(reports_fts, rowid, building, location, description) 
    VALUES('delete', old.rowid, old.building, old.location, old.description);
END;

CREATE TRIGGER IF NOT EXISTS reports_fts_update AFTER UPDATE ON reports BEGIN
    INSERT INTO reports_fts(reports_fts, rowid, building, location, description) 
    VALUES('delete', old.rowid, old.building, old.location, old.description);
    INSERT INTO reports_fts(rowid, building, location, description) 
    VALUES (new.rowid, new.building, new.location, new.description);
END;