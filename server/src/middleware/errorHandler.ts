import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ApiErrorCode } from '../types';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: ApiErrorCode, message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Error handler middleware
 * This should be the last middleware in the chain
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let errorCode = ApiErrorCode.SERVER_ERROR;
  let message = '서버 내부 오류가 발생했습니다';
  let details: any = undefined;

  // Handle custom AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details;
  }
  // Handle known error objects with code property
  else if (error && typeof error === 'object' && 'code' in error) {
    const customError = error as any;
    const customErrorCode = customError.code;
    
    // Validate that the error code is a valid ApiErrorCode
    if (Object.values(ApiErrorCode).includes(customErrorCode)) {
      errorCode = customErrorCode as ApiErrorCode;
    } else {
      errorCode = ApiErrorCode.SERVER_ERROR;
    }
    
    message = customError.message || message;
    details = customError.details;
    
    // Map error codes to status codes
    statusCode = getStatusCodeFromErrorCode(errorCode);
  }
  // Handle validation errors from libraries
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = ApiErrorCode.VALIDATION_ERROR;
    message = '입력 데이터가 올바르지 않습니다';
    details = error.message;
  }
  // Handle database constraint errors
  else if (error.message.includes('UNIQUE constraint failed')) {
    statusCode = 409;
    errorCode = ApiErrorCode.DUPLICATE_EMPATHY;
    message = '이미 공감하셨습니다';
  }
  // Handle database foreign key errors
  else if (error.message.includes('FOREIGN KEY constraint failed')) {
    statusCode = 404;
    errorCode = ApiErrorCode.NOT_FOUND;
    message = '관련된 데이터를 찾을 수 없습니다';
  }

  // Create standardized error response
  const errorResponse: ApiResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...(details && { details })
    }
  };

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    delete errorResponse.error?.details;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Not found handler middleware
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ApiResponse = {
    success: false,
    error: {
      code: ApiErrorCode.NOT_FOUND,
      message: `경로를 찾을 수 없습니다: ${req.method} ${req.path}`
    }
  };

  res.status(404).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass them to error middleware
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Map error codes to HTTP status codes
 */
function getStatusCodeFromErrorCode(errorCode: ApiErrorCode): number {
  switch (errorCode) {
    case ApiErrorCode.VALIDATION_ERROR:
      return 400;
    case ApiErrorCode.UNAUTHORIZED:
      return 401;
    case ApiErrorCode.NOT_FOUND:
      return 404;
    case ApiErrorCode.DUPLICATE_EMPATHY:
      return 409;
    case ApiErrorCode.SERVER_ERROR:
    default:
      return 500;
  }
}

/**
 * Helper functions to create specific errors
 */
export const createValidationError = (message: string, details?: any): AppError => {
  return new AppError(ApiErrorCode.VALIDATION_ERROR, message, 400, details);
};

export const createUnauthorizedError = (message: string = '인증이 필요합니다'): AppError => {
  return new AppError(ApiErrorCode.UNAUTHORIZED, message, 401);
};

export const createNotFoundError = (message: string = '요청한 리소스를 찾을 수 없습니다'): AppError => {
  return new AppError(ApiErrorCode.NOT_FOUND, message, 404);
};

export const createDuplicateEmpathyError = (message: string = '이미 공감하셨습니다'): AppError => {
  return new AppError(ApiErrorCode.DUPLICATE_EMPATHY, message, 409);
};

export const createServerError = (message: string = '서버 내부 오류가 발생했습니다', details?: any): AppError => {
  return new AppError(ApiErrorCode.SERVER_ERROR, message, 500, details);
};