import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../../data/database.sqlite');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: sqlite3.Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<sqlite3.Database> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Enable foreign key constraints
        this.db!.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Connected to SQLite database');
            resolve(this.db!);
          }
        });
      });
    });
  }

  public getConnection(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  public async close(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.db = null;
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }

  // Helper method for running queries with promises
  public run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.getConnection().run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  // Helper method for getting single row
  public get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.getConnection().get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T | undefined);
        }
      });
    });
  }

  // Helper method for getting all rows
  public all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.getConnection().all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve((rows || []) as T[]);
        }
      });
    });
  }

  // Helper method for transactions
  public async transaction<T>(callback: (db: sqlite3.Database) => Promise<T>): Promise<T> {
    const db = this.getConnection();
    
    await new Promise<void>((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      const result = await callback(db);
      
      await new Promise<void>((resolve, reject) => {
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return result;
    } catch (error) {
      await new Promise<void>((resolve, reject) => {
        db.run('ROLLBACK', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      throw error;
    }
  }
}

export const db = DatabaseConnection.getInstance();

// Export getDatabase function for compatibility
export const getDatabase = (): sqlite3.Database => {
  return db.getConnection();
};

export default db;