import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

import reportsRouter from './routes/reports';
import empathyRouter from './routes/empathy';
import healthRouter from './routes/health';
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
import { MigrationManager } from './utils/migration';
import { getDatabase } from './database/connection';

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

// Rate limiting (apply to API routes only)
app.use('/api', apiRateLimit);

// Serve static files from client build
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/health') || req.path.startsWith('/metrics')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Health check routes (no rate limiting)
app.use('/', healthRouter);

// API Routes
app.use('/api/reports', reportsRouter);
app.use('/api/reports', empathyRouter);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connection
    const { db } = await import('./database/connection');
    await db.close();
    logger.info('Database connection closed.');
  } catch (err) {
    logger.error('Error closing database connection:', err);
  }
  process.exit(0);
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Initialize database and start server
const startServer = async () => {
  try {
    logger.info('Starting server initialization...');
    
    // Connect to database first
    const { db } = await import('./database/connection');
    await db.connect();
    
    // Run database migrations
    const database = getDatabase();
    const migrationManager = new MigrationManager(database);
    await migrationManager.runMigrations();
    logger.info('Database initialized successfully');
    
    // Start server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server is running on ${HOST}:${PORT}`);
      logger.info(`📊 Health check: http://${HOST}:${PORT}/health`);
      logger.info(`📈 Metrics: http://${HOST}:${PORT}/metrics`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
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