import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
  ip: string;
  message?: string;
  error?: any;
}

class Logger {
  private logLevel: string;
  private logFilePath?: string;

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFilePath = process.env.LOG_FILE_PATH;
    
    // 로그 디렉토리 생성
    if (this.logFilePath) {
      const logDir = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry) + '\n';
  }

  private writeLog(entry: LogEntry): void {
    const logMessage = this.formatLogEntry(entry);
    
    // 콘솔 출력
    if (entry.level === 'error') {
      console.error(logMessage.trim());
    } else if (entry.level === 'warn') {
      console.warn(logMessage.trim());
    } else {
      console.log(logMessage.trim());
    }
    
    // 파일 출력 (프로덕션 환경)
    if (this.logFilePath && process.env.NODE_ENV === 'production') {
      fs.appendFileSync(this.logFilePath, logMessage);
    }
  }

  info(message: string, meta?: any): void {
    if (!this.shouldLog('info')) return;
    
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'info',
      method: '',
      url: '',
      ip: '',
      message,
      ...meta
    });
  }

  warn(message: string, meta?: any): void {
    if (!this.shouldLog('warn')) return;
    
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'warn',
      method: '',
      url: '',
      ip: '',
      message,
      ...meta
    });
  }

  error(message: string, error?: any, meta?: any): void {
    if (!this.shouldLog('error')) return;
    
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'error',
      method: '',
      url: '',
      ip: '',
      message,
      error: error?.stack || error,
      ...meta
    });
  }
}

export const logger = new Logger();

/**
 * HTTP 요청 로깅 미들웨어
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // 응답 완료 시 로그 기록
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 400 ? 'warn' : 'info',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || 'unknown'
    };
    
    logger.info('HTTP Request', logEntry);
  });
  
  next();
};

/**
 * 에러 로깅 미들웨어
 */
export const errorLogger = (error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('HTTP Error', error, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent'),
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  next(error);
};

/**
 * 성능 모니터링 미들웨어
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // 나노초를 밀리초로 변환
    
    // 느린 요청 경고 (1초 이상)
    if (responseTime > 1000) {
      logger.warn('Slow Request Detected', {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }
  });
  
  next();
};