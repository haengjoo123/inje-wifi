import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './migrations';

const dbPath = path.join(__dirname, '../../data/database.sqlite');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const initializeDatabase = async (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      try {
        // Enable foreign key constraints
        await new Promise<void>((resolve, reject) => {
          db.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        // Run migrations
        await runMigrations(db);
        
        console.log('Database initialization completed');
        resolve(db);
      } catch (error) {
        reject(error);
      }
    });
  });
};

export const getDatabase = (): sqlite3.Database => {
  return new sqlite3.Database(dbPath);
};

export const closeDatabase = (db: sqlite3.Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
};