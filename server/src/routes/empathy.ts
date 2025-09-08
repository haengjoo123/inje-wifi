import { Router, Request, Response } from 'express';
import { empathyService } from '../services/empathyService';
import { ValidationMiddleware, asyncHandler } from '../middleware';
import { ApiResponse } from '../types';

const router = Router();

// Middleware to generate user identifier from cookies/IP
const getUserIdentifier = (req: Request): string => {
  // Try to get user identifier from cookie first
  let userIdentifier = req.cookies?.user_id;
  
  if (!userIdentifier) {
    // Generate a simple identifier based on IP and User-Agent
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    userIdentifier = Buffer.from(`${ip}-${userAgent}`).toString('base64');
  }
  
  return userIdentifier;
};

// POST /api/reports/:id/empathy - Add empathy to report
router.post('/:id/empathy', 
  ValidationMiddleware.validateReportId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id: reportId } = req.params;
    const userIdentifier = getUserIdentifier(req);
    
    const result = await empathyService.addEmpathy(reportId, userIdentifier);
    
    // Set cookie for future requests if not already set
    if (!req.cookies?.user_id) {
      res.cookie('user_id', userIdentifier, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    
    const response: ApiResponse = {
      success: true,
      data: result
    };
    
    res.status(201).json(response);
  })
);

// GET /api/reports/:id/empathy/count - Get empathy count for report
router.get('/:id/empathy/count', 
  ValidationMiddleware.validateReportId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id: reportId } = req.params;
    const count = await empathyService.getEmpathyCount(reportId);
    
    const response: ApiResponse = {
      success: true,
      data: { count }
    };
    
    res.json(response);
  })
);

// GET /api/reports/:id/empathy/check - Check if user has empathized and get count
router.get('/:id/empathy/check', 
  ValidationMiddleware.validateReportId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id: reportId } = req.params;
    const userIdentifier = getUserIdentifier(req);
    
    const result = await empathyService.checkEmpathy(reportId, userIdentifier);
    
    // Set cookie for future requests if not already set
    if (!req.cookies?.user_id) {
      res.cookie('user_id', userIdentifier, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    
    const response: ApiResponse = {
      success: true,
      data: result
    };
    
    res.json(response);
  })
);

// DELETE /api/reports/:id/empathy - Remove empathy (optional feature)
router.delete('/:id/empathy', 
  ValidationMiddleware.validateReportId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id: reportId } = req.params;
    const userIdentifier = getUserIdentifier(req);
    
    const result = await empathyService.removeEmpathy(reportId, userIdentifier);
    
    const response: ApiResponse = {
      success: true,
      data: result
    };
    
    res.json(response);
  })
);

export default router;