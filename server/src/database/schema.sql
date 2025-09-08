-- WiFi Report System Database Schema
-- This file contains the complete database schema for the WiFi report system

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Reports table
-- Stores all WiFi problem reports submitted by students
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  campus TEXT NOT NULL CHECK (campus IN ('김해캠퍼스', '부산캠퍼스')),
  building TEXT NOT NULL CHECK (length(building) > 0),
  location TEXT NOT NULL CHECK (length(location) > 0),
  problem_types TEXT NOT NULL CHECK (json_valid(problem_types)),
  custom_problem TEXT,
  description TEXT NOT NULL CHECK (length(description) >= 20),
  password_hash TEXT NOT NULL CHECK (length(password_hash) > 0),
  empathy_count INTEGER DEFAULT 0 CHECK (empathy_count >= 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Empathies table
-- Stores empathy reactions from users for specific reports
CREATE TABLE IF NOT EXISTS empathies (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  user_identifier TEXT NOT NULL CHECK (length(user_identifier) > 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  UNIQUE(report_id, user_identifier)
);

-- Indexes for reports table
-- Performance optimization for common queries

-- Index for sorting by creation date (latest first)
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Index for sorting by empathy count (most empathy first)
CREATE INDEX IF NOT EXISTS idx_reports_empathy_count ON reports(empathy_count DESC);

-- Index for filtering by campus
CREATE INDEX IF NOT EXISTS idx_reports_campus ON reports(campus);

-- Index for filtering by building
CREATE INDEX IF NOT EXISTS idx_reports_building ON reports(building);

-- Composite index for campus and building filtering
CREATE INDEX IF NOT EXISTS idx_reports_campus_building ON reports(campus, building);

-- Composite index for sorting with campus filter
CREATE INDEX IF NOT EXISTS idx_reports_campus_created_at ON reports(campus, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_campus_empathy_count ON reports(campus, empathy_count DESC);

-- Indexes for empathies table

-- Index for finding empathies by report
CREATE INDEX IF NOT EXISTS idx_empathies_report_id ON empathies(report_id);

-- Index for finding empathies by user
CREATE INDEX IF NOT EXISTS idx_empathies_user_identifier ON empathies(user_identifier);

-- Index for creation date sorting
CREATE INDEX IF NOT EXISTS idx_empathies_created_at ON empathies(created_at DESC);

-- Triggers for automatic data maintenance

-- Trigger to automatically update empathy_count when empathy is added
CREATE TRIGGER IF NOT EXISTS update_empathy_count_on_insert
AFTER INSERT ON empathies
BEGIN
  UPDATE reports 
  SET empathy_count = empathy_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.report_id;
END;

-- Trigger to automatically update empathy_count when empathy is removed
CREATE TRIGGER IF NOT EXISTS update_empathy_count_on_delete
AFTER DELETE ON empathies
BEGIN
  UPDATE reports 
  SET empathy_count = empathy_count - 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.report_id;
END;

-- Trigger to update updated_at timestamp on report updates
CREATE TRIGGER IF NOT EXISTS update_reports_timestamp
AFTER UPDATE ON reports
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE reports 
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;