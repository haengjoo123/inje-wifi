import { Router, Request, Response } from 'express';
import { reportService } from '../services/reportService';
import { ValidationMiddleware, asyncHandler } from '../middleware';
import {
  CreateReportRequest,
  UpdateReportRequest,
  DeleteReportRequest,
  ReportListQuery,
  ApiResponse
} from '../types';

const router = Router();

// POST /api/reports - Create new report
router.post('/', 
  ValidationMiddleware.validateCreateReport,
  asyncHandler(async (req: Request, res: Response) => {
    const reportData: CreateReportRequest = req.body;
    const report = await reportService.createReport(reportData);
    
    const response: ApiResponse = {
      success: true,
      data: report
    };
    
    res.status(201).json(response);
  })
);

// GET /api/reports - Get reports list with filtering and sorting
router.get('/', 
  ValidationMiddleware.validateReportListQuery,
  asyncHandler(async (req: Request, res: Response) => {
    const query: ReportListQuery = {
      sort: req.query.sort as 'latest' | 'empathy',
      campus: req.query.campus as string,
      building: req.query.building as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };
    
    const result = await reportService.getReports(query);
    
    const response: ApiResponse = {
      success: true,
      data: result
    };
    
    res.json(response);
  })
);

// GET /api/reports/:id - Get specific report
router.get('/:id', 
  ValidationMiddleware.validateReportId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const report = await reportService.getReportById(id);
    
    if (!report) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '제보를 찾을 수 없습니다'
        }
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      data: report
    };
    
    res.json(response);
  })
);

// PUT /api/reports/:id - Update report (requires password)
router.put('/:id', 
  ValidationMiddleware.validateReportId,
  ValidationMiddleware.validateUpdateReport,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateReportRequest = req.body;
    
    const report = await reportService.updateReport(id, updateData);
    
    const response: ApiResponse = {
      success: true,
      data: report
    };
    
    res.json(response);
  })
);

// POST /api/reports/:id/verify-password - Verify password for report
router.post('/:id/verify-password',
  ValidationMiddleware.validateReportId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '비밀번호를 입력해주세요'
        }
      };
      return res.status(400).json(response);
    }
    
    const isValid = await reportService.verifyPassword(id, password);
    
    const response: ApiResponse = {
      success: true,
      data: { valid: isValid }
    };
    
    res.json(response);
  })
);

// DELETE /api/reports/:id - Delete report (requires password)
router.delete('/:id', 
  ValidationMiddleware.validateReportId,
  ValidationMiddleware.validateDeleteReport,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { password }: DeleteReportRequest = req.body;
    
    await reportService.deleteReport(id, password);
    
    const response: ApiResponse = {
      success: true,
      data: { message: '제보가 삭제되었습니다' }
    };
    
    res.json(response);
  })
);

export default router;