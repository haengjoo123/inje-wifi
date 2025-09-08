import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/connection';
import fs from 'fs';
import path from 'path';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    filesystem: {
      status: 'healthy' | 'unhealthy';
      error?: string;
    };
    memory: {
      status: 'healthy' | 'unhealthy';
      usage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
      };
      percentage: number;
    };
  };
}

/**
 * 데이터베이스 연결 상태 확인
 */
async function checkDatabase(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const db = getDatabase();
    
    db.get('SELECT 1 as test', (err, row) => {
      const responseTime = Date.now() - startTime;
      
      if (err) {
        resolve({
          status: 'unhealthy',
          error: err.message
        });
      } else {
        resolve({
          status: 'healthy',
          responseTime
        });
      }
    });
  });
}

/**
 * 파일시스템 상태 확인
 */
function checkFilesystem(): { status: 'healthy' | 'unhealthy'; error?: string } {
  try {
    const testFile = path.join(__dirname, '../temp/health-check.tmp');
    const testDir = path.dirname(testFile);
    
    // 임시 디렉토리 생성
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // 파일 쓰기 테스트
    fs.writeFileSync(testFile, 'health-check');
    
    // 파일 읽기 테스트
    const content = fs.readFileSync(testFile, 'utf8');
    
    // 파일 삭제
    fs.unlinkSync(testFile);
    
    if (content !== 'health-check') {
      throw new Error('파일 내용이 일치하지 않습니다');
    }
    
    return { status: 'healthy' };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 메모리 사용량 확인
 */
function checkMemory(): {
  status: 'healthy' | 'unhealthy';
  usage: { rss: number; heapTotal: number; heapUsed: number; external: number };
  percentage: number;
} {
  const memoryUsage = process.memoryUsage();
  const totalMemory = require('os').totalmem();
  const percentage = (memoryUsage.rss / totalMemory) * 100;
  
  // 메모리 사용량이 80% 이상이면 unhealthy
  const status = percentage > 80 ? 'unhealthy' : 'healthy';
  
  return {
    status,
    usage: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    },
    percentage: Math.round(percentage * 100) / 100
  };
}

/**
 * 애플리케이션 버전 정보 조회
 */
function getVersion(): string {
  try {
    const packageJson = require('../../package.json');
    return packageJson.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * 헬스체크 엔드포인트
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const [databaseCheck] = await Promise.all([
      checkDatabase()
    ]);
    
    const filesystemCheck = checkFilesystem();
    const memoryCheck = checkMemory();
    
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: getVersion(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: databaseCheck,
        filesystem: filesystemCheck,
        memory: memoryCheck
      }
    };
    
    // 하나라도 unhealthy면 전체 상태를 unhealthy로 설정
    if (
      databaseCheck.status === 'unhealthy' ||
      filesystemCheck.status === 'unhealthy' ||
      memoryCheck.status === 'unhealthy'
    ) {
      healthStatus.status = 'unhealthy';
    }
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 간단한 헬스체크 엔드포인트 (로드밸런서용)
 */
router.get('/ping', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * 준비 상태 확인 엔드포인트 (Kubernetes readiness probe용)
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const databaseCheck = await checkDatabase();
    
    if (databaseCheck.status === 'healthy') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not available'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 메트릭스 엔드포인트 (모니터링용)
 */
router.get('/metrics', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  // Prometheus 형식의 메트릭스
  const metrics = `
# HELP nodejs_memory_usage_bytes Memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_rss_bytes ${memoryUsage.rss}
nodejs_memory_usage_heap_total_bytes ${memoryUsage.heapTotal}
nodejs_memory_usage_heap_used_bytes ${memoryUsage.heapUsed}
nodejs_memory_usage_external_bytes ${memoryUsage.external}

# HELP nodejs_process_uptime_seconds Process uptime in seconds
# TYPE nodejs_process_uptime_seconds counter
nodejs_process_uptime_seconds ${process.uptime()}

# HELP nodejs_cpu_usage_microseconds CPU usage in microseconds
# TYPE nodejs_cpu_usage_microseconds counter
nodejs_cpu_usage_user_microseconds ${cpuUsage.user}
nodejs_cpu_usage_system_microseconds ${cpuUsage.system}
  `.trim();
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

export default router;