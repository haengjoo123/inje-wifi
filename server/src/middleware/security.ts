import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * 보안 헤더 설정 미들웨어
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // XSS 보호
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HTTPS 강제 (프로덕션 환경)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // 콘텐츠 보안 정책
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self';"
  );
  
  // 레퍼러 정책
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

/**
 * API 레이트 리미팅
 */
export const apiRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15분
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (process.env.NODE_ENV === 'development' ? '1000' : '100')), // 개발환경에서는 더 관대하게
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 헬스체크 엔드포인트는 제외하고, 개발환경에서는 모든 요청 허용
    return req.path === '/health' || process.env.NODE_ENV === 'development';
  }
});

/**
 * 제보 작성 전용 레이트 리미팅 (더 엄격)
 */
export const reportCreationRateLimit = rateLimit({
  windowMs: 60000, // 1분
  max: 3, // 1분에 3개까지
  message: {
    error: 'REPORT_RATE_LIMIT',
    message: '제보 작성은 1분에 3개까지만 가능합니다.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 공감 기능 레이트 리미팅
 */
export const empathyRateLimit = rateLimit({
  windowMs: 60000, // 1분
  max: 10, // 1분에 10개까지
  message: {
    error: 'EMPATHY_RATE_LIMIT',
    message: '공감은 1분에 10개까지만 가능합니다.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 입력 데이터 크기 제한
 */
export const validateRequestSize = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.get('content-length');
  const maxSize = 1024 * 1024; // 1MB
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: '요청 데이터가 너무 큽니다.'
      }
    });
  }
  
  next();
};

/**
 * SQL 인젝션 방지를 위한 입력 검증
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(\b(OR|AND)\b.*=.*)/i
  ];
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return dangerousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };
  
  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: '유효하지 않은 입력입니다.'
      }
    });
  }
  
  next();
};

/**
 * CORS 설정 (프로덕션용)
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
    
    // 개발 환경에서는 모든 origin 허용
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // origin이 없는 경우 (모바일 앱 등) 허용
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};