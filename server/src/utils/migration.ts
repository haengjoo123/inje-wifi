import fs from 'fs';
import path from 'path';
import { Database } from 'sqlite3';

interface Migration {
  id: string;
  filename: string;
  sql: string;
  executedAt?: Date;
}

export class MigrationManager {
  private db: Database;
  private migrationsPath: string;

  constructor(db: Database, migrationsPath: string = path.join(__dirname, '../../migrations')) {
    this.db = db;
    this.migrationsPath = migrationsPath;
  }

  /**
   * 마이그레이션 테이블 초기화
   */
  private async initializeMigrationTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS migrations (
          id VARCHAR(255) PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      this.db.run(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 실행된 마이그레이션 목록 조회
   */
  private async getExecutedMigrations(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT id FROM migrations ORDER BY executed_at',
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => row.id));
          }
        }
      );
    });
  }

  /**
   * 마이그레이션 파일 목록 조회
   */
  private getMigrationFiles(): Migration[] {
    if (!fs.existsSync(this.migrationsPath)) {
      console.log('마이그레이션 디렉토리가 존재하지 않습니다:', this.migrationsPath);
      return [];
    }

    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return files.map(filename => {
      const id = path.basename(filename, '.sql');
      const sql = fs.readFileSync(path.join(this.migrationsPath, filename), 'utf8');
      
      return {
        id,
        filename,
        sql
      };
    });
  }

  /**
   * 단일 마이그레이션 실행
   */
  private async executeMigration(migration: Migration): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        // 마이그레이션 SQL 실행
        this.db.exec(migration.sql, (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(new Error(`마이그레이션 ${migration.id} 실행 실패: ${err.message}`));
            return;
          }
          
          // 마이그레이션 기록 저장
          this.db.run(
            'INSERT INTO migrations (id, filename) VALUES (?, ?)',
            [migration.id, migration.filename],
            (err) => {
              if (err) {
                this.db.run('ROLLBACK');
                reject(new Error(`마이그레이션 ${migration.id} 기록 실패: ${err.message}`));
                return;
              }
              
              this.db.run('COMMIT', (err) => {
                if (err) {
                  reject(new Error(`마이그레이션 ${migration.id} 커밋 실패: ${err.message}`));
                } else {
                  console.log(`✅ 마이그레이션 ${migration.id} 완료`);
                  resolve();
                }
              });
            }
          );
        });
      });
    });
  }

  /**
   * 모든 대기 중인 마이그레이션 실행
   */
  async runMigrations(): Promise<void> {
    try {
      console.log('🔄 데이터베이스 마이그레이션 시작...');
      
      // 마이그레이션 테이블 초기화
      await this.initializeMigrationTable();
      
      // 실행된 마이그레이션과 파일 목록 조회
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = this.getMigrationFiles();
      
      // 실행되지 않은 마이그레이션 필터링
      const pendingMigrations = migrationFiles.filter(
        migration => !executedMigrations.includes(migration.id)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('✅ 실행할 마이그레이션이 없습니다.');
        return;
      }
      
      console.log(`📋 ${pendingMigrations.length}개의 마이그레이션을 실행합니다.`);
      
      // 순차적으로 마이그레이션 실행
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      console.log('🎉 모든 마이그레이션이 완료되었습니다.');
      
    } catch (error) {
      console.error('❌ 마이그레이션 실행 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 마이그레이션 상태 확인
   */
  async getStatus(): Promise<{ executed: string[], pending: string[] }> {
    await this.initializeMigrationTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = this.getMigrationFiles();
    const pendingMigrations = migrationFiles
      .filter(migration => !executedMigrations.includes(migration.id))
      .map(migration => migration.id);
    
    return {
      executed: executedMigrations,
      pending: pendingMigrations
    };
  }
}