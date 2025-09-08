import { initializeDatabase, closeDatabase } from './init';
import { migrations } from './migrations';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

describe('Database Initialization', () => {
  const testDbPath = path.join(__dirname, '../../data/database.sqlite');
  let db: sqlite3.Database;

  afterEach(async () => {
    // Close database connection if open
    if (db) {
      await closeDatabase(db);
    }
    
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should initialize database successfully', async () => {
    db = await initializeDatabase();
    expect(fs.existsSync(testDbPath)).toBe(true);
    expect(db).toBeDefined();
  });

  it('should create all required tables', async () => {
    db = await initializeDatabase();
    
    // Check if reports table exists
    const reportsTable = await new Promise<any>((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='reports'", (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    expect(reportsTable).toBeDefined();
    expect(reportsTable.name).toBe('reports');

    // Check if empathies table exists
    const empathiesTable = await new Promise<any>((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='empathies'", (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    expect(empathiesTable).toBeDefined();
    expect(empathiesTable.name).toBe('empathies');

    // Check if migrations table exists
    const migrationsTable = await new Promise<any>((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'", (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    expect(migrationsTable).toBeDefined();
    expect(migrationsTable.name).toBe('migrations');
  });

  it('should create all required indexes', async () => {
    db = await initializeDatabase();
    
    // Check if indexes exist
    const indexes = await new Promise<any[]>((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const indexNames = indexes.map(idx => idx.name);
    expect(indexNames).toContain('idx_reports_created_at');
    expect(indexNames).toContain('idx_reports_empathy_count');
    expect(indexNames).toContain('idx_reports_campus');
    expect(indexNames).toContain('idx_empathies_report_id');
  });

  it('should create all required triggers', async () => {
    db = await initializeDatabase();
    
    // Check if triggers exist
    const triggers = await new Promise<any[]>((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='trigger'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const triggerNames = triggers.map(trigger => trigger.name);
    expect(triggerNames).toContain('update_empathy_count_on_insert');
    expect(triggerNames).toContain('update_empathy_count_on_delete');
    expect(triggerNames).toContain('update_reports_timestamp');
  });

  it('should apply all migrations', async () => {
    db = await initializeDatabase();
    
    // Check applied migrations
    const appliedMigrations = await new Promise<any[]>((resolve, reject) => {
      db.all('SELECT version, name FROM migrations ORDER BY version', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    expect(appliedMigrations).toHaveLength(migrations.length);
    
    migrations.forEach((migration, index) => {
      expect(appliedMigrations[index].version).toBe(migration.version);
      expect(appliedMigrations[index].name).toBe(migration.name);
    });
  });

  it('should enforce foreign key constraints', async () => {
    db = await initializeDatabase();
    
    // Check if foreign keys are enabled
    const foreignKeysEnabled = await new Promise<any>((resolve, reject) => {
      db.get('PRAGMA foreign_keys', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    expect(foreignKeysEnabled.foreign_keys).toBe(1);
  });
});