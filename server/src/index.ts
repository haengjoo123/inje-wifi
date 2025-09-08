import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

import reportsRouter from './routes/reports';
import empathyRouter from './routes/empathy';
import healthRouter from './routes/health';
import adminRouter from './routes/admin';
import { errorHandler, notFoundHandler } from './middleware';
import { 
  securityHeaders, 
  apiRateLimit, 
  validateRequestSize, 
  sanitizeInput,
  corsOptions 
} from './middleware/security';
import { 
  requestLogger, 
  errorLogger, 
  performanceMonitor,
  logger 
} from './middleware/logging';
import { testConnection } from './database/supabase';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || 'localhost';

// Trust proxy (for production behind reverse proxy)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(securityHeaders);
app.use(validateRequestSize);
app.use(sanitizeInput);

// CORS configuration
app.use(cors(corsOptions));

// Request parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Logging and monitoring middleware
app.use(requestLogger);
app.use(performanceMonitor);

// Health check routes (no rate limiting)
app.use('/health', healthRouter);
app.use('/metrics', healthRouter);

// Rate limiting (apply to API routes only)
app.use('/api', apiRateLimit);

// API Routes
app.use('/api/reports', reportsRouter);
app.use('/api/reports', empathyRouter);
app.use('/api/admin', adminRouter);

// Serve static files from client build (must be after API routes)
const clientBuildPath = path.join(__dirname, '../../client/dist');

// Log environment and path for debugging
logger.info(`Environment: ${process.env.NODE_ENV}`);
logger.info(`Serving static files from: ${clientBuildPath}`);

// Always serve static files in production-like environments
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  app.use(express.static(clientBuildPath));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    const indexPath = path.join(clientBuildPath, 'index.html');
    logger.info(`Serving index.html from: ${indexPath} for path: ${req.path}`);
    res.sendFile(indexPath, (err) => {
      if (err) {
        logger.error(`Error serving index.html: ${err.message}`);
        res.status(500).send('Internal Server Error');
      }
    });
  });
} else {
  // Development fallback
  app.get('*', (req, res) => {
    res.status(404).json({ 
      error: 'Not Found', 
      message: 'This route is not available in development mode. Use the client dev server.' 
    });
  });
}

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  logger.info('Supabase 연결은 자동으로 관리되므로 별도 종료 작업이 필요하지 않습니다.');
  process.exit(0);
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Initialize database and start server
const startServer = async () => {
  try {
    logger.info('Starting server initialization...');
    
    // Test Supabase connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Supabase 데이터베이스 연결에 실패했습니다');
    }
    
    logger.info('✅ Supabase 데이터베이스 연결 성공');
    
    // Start server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server is running on ${HOST}:${PORT}`);
      logger.info(`📊 Health check: http://${HOST}:${PORT}/health`);
      logger.info(`📈 Metrics: http://${HOST}:${PORT}/metrics`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🗄️ Database: Supabase (inje-wifi)`);
    });
    
    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();