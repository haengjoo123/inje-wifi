import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

export interface Migration {
  version: number;
  name: string;
  up: string;
  down?: string;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: `
      -- Enable foreign key constraints
      PRAGMA foreign_keys = ON;

      -- Reports table
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
      CREATE TABLE IF NOT EXISTS empathies (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL,
        user_identifier TEXT NOT NULL CHECK (length(user_identifier) > 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
        UNIQUE(report_id, user_identifier)
      );
    `,
    down: `
      DROP TABLE IF EXISTS empathies;
      DROP TABLE IF EXISTS reports;
    `
  },
  {
    version: 2,
    name: 'add_indexes',
    up: `
      -- Indexes for reports table
      CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reports_empathy_count ON reports(empathy_count DESC);
      CREATE INDEX IF NOT EXISTS idx_reports_campus ON reports(campus);
      CREATE INDEX IF NOT EXISTS idx_reports_building ON reports(building);
      CREATE INDEX IF NOT EXISTS idx_reports_campus_building ON reports(campus, building);
      CREATE INDEX IF NOT EXISTS idx_reports_campus_created_at ON reports(campus, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reports_campus_empathy_count ON reports(campus, empathy_count DESC);

      -- Indexes for empathies table
      CREATE INDEX IF NOT EXISTS idx_empathies_report_id ON empathies(report_id);
      CREATE INDEX IF NOT EXISTS idx_empathies_user_identifier ON empathies(user_identifier);
      CREATE INDEX IF NOT EXISTS idx_empathies_created_at ON empathies(created_at DESC);
    `,
    down: `
      DROP INDEX IF EXISTS idx_reports_created_at;
      DROP INDEX IF EXISTS idx_reports_empathy_count;
      DROP INDEX IF EXISTS idx_reports_campus;
      DROP INDEX IF EXISTS idx_reports_building;
      DROP INDEX IF EXISTS idx_reports_campus_building;
      DROP INDEX IF EXISTS idx_reports_campus_created_at;
      DROP INDEX IF EXISTS idx_reports_campus_empathy_count;
      DROP INDEX IF EXISTS idx_empathies_report_id;
      DROP INDEX IF EXISTS idx_empathies_user_identifier;
      DROP INDEX IF EXISTS idx_empathies_created_at;
    `
  },
  {
    version: 3,
    name: 'add_triggers',
    up: `
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
    `,
    down: `
      DROP TRIGGER IF EXISTS update_empathy_count_on_insert;
      DROP TRIGGER IF EXISTS update_empathy_count_on_delete;
      DROP TRIGGER IF EXISTS update_reports_timestamp;
    `
  },
  {
    version: 4,
    name: 'update_description_min_length',
    up: `
      -- Create new table with updated constraint
      CREATE TABLE reports_new (
        id TEXT PRIMARY KEY,
        campus TEXT NOT NULL CHECK (campus IN ('김해캠퍼스', '부산캠퍼스')),
        building TEXT NOT NULL CHECK (length(building) > 0),
        location TEXT NOT NULL CHECK (length(location) > 0),
        problem_types TEXT NOT NULL CHECK (json_valid(problem_types)),
        custom_problem TEXT,
        description TEXT NOT NULL CHECK (length(description) >= 10),
        password_hash TEXT NOT NULL CHECK (length(password_hash) > 0),
        empathy_count INTEGER DEFAULT 0 CHECK (empathy_count >= 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Copy data from old table
      INSERT INTO reports_new SELECT * FROM reports;

      -- Drop old table and rename new one
      DROP TABLE reports;
      ALTER TABLE reports_new RENAME TO reports;

      -- Recreate indexes
      CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reports_empathy_count ON reports(empathy_count DESC);
      CREATE INDEX IF NOT EXISTS idx_reports_campus ON reports(campus);
      CREATE INDEX IF NOT EXISTS idx_reports_building ON reports(building);
      CREATE INDEX IF NOT EXISTS idx_reports_campus_building ON reports(campus, building);
      CREATE INDEX IF NOT EXISTS idx_reports_campus_created_at ON reports(campus, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reports_campus_empathy_count ON reports(campus, empathy_count DESC);

      -- Recreate triggers
      CREATE TRIGGER IF NOT EXISTS update_empathy_count_on_insert
      AFTER INSERT ON empathies
      BEGIN
        UPDATE reports 
        SET empathy_count = empathy_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.report_id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_empathy_count_on_delete
      AFTER DELETE ON empathies
      BEGIN
        UPDATE reports 
        SET empathy_count = empathy_count - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.report_id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_reports_timestamp
      AFTER UPDATE ON reports
      FOR EACH ROW
      WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE reports 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
      END;
    `,
    down: `
      -- Revert to 20 character minimum
      CREATE TABLE reports_new (
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

      INSERT INTO reports_new SELECT * FROM reports;
      DROP TABLE reports;
      ALTER TABLE reports_new RENAME TO reports;
    `
  }
];

export class MigrationRunner {
  private db: sqlite3.Database;

  constructor(db: sqlite3.Database) {
    this.db = db;
  }

  async createMigrationsTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getAppliedMigrations(): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT version FROM migrations ORDER BY version', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.version));
        }
      });
    });
  }

  async applyMigration(migration: Migration): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        // Execute migration SQL
        this.db.exec(migration.up, (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          // Record migration as applied
          this.db.run(
            'INSERT INTO migrations (version, name) VALUES (?, ?)',
            [migration.version, migration.name],
            (err) => {
              if (err) {
                this.db.run('ROLLBACK');
                reject(err);
                return;
              }
              
              this.db.run('COMMIT', (err) => {
                if (err) {
                  reject(err);
                } else {
                  console.log(`Applied migration ${migration.version}: ${migration.name}`);
                  resolve();
                }
              });
            }
          );
        });
      });
    });
  }

  async runMigrations(): Promise<void> {
    await this.createMigrationsTable();
    const appliedMigrations = await this.getAppliedMigrations();
    
    for (const migration of migrations) {
      if (!appliedMigrations.includes(migration.version)) {
        await this.applyMigration(migration);
      }
    }
  }
}

export const runMigrations = async (db: sqlite3.Database): Promise<void> => {
  const runner = new MigrationRunner(db);
  await runner.runMigrations();
};