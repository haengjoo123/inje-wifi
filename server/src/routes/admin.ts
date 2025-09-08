import { Router, Request, Response } from 'express';
import { adminService } from '../services/adminService';
import { ValidationMiddleware, asyncHandler } from '../middleware';
import {
  AdminDeleteRequest,
  AdminAuthRequest,
  ApiResponse
} from '../types';

const router = Router();

// POST /api/admin/auth - 관리자 키 검증
router.post('/auth',
  asyncHandler(async (req: Request, res: Response) => {
    const { adminKey }: AdminAuthRequest = req.body;
    
    if (!adminKey) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '관리자 키를 입력해주세요'
        }
      };
      return res.status(400).json(response);
    }

    const isValid = adminService.verifyAdminKey(adminKey);
    
    const response: ApiResponse = {
      success: true,
      data: { 
        valid: isValid,
        message: isValid ? '관리자 인증 성공' : '잘못된 관리자 키입니다'
      }
    };
    
    res.json(response);
  })
);

// DELETE /api/admin/reports/:id - 관리자 강제 삭제
router.delete('/reports/:id',
  ValidationMiddleware.validateReportId,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminKey } = req.body;
    
    if (!adminKey) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '관리자 키를 입력해주세요'
        }
      };
      return res.status(400).json(response);
    }

    await adminService.forceDeleteReport(id, adminKey);
    
    const response: ApiResponse = {
      success: true,
      data: { message: '제보가 삭제되었습니다' }
    };
    
    res.json(response);
  })
);

// GET /api/admin/export - 전체 데이터 내보내기
router.get('/export',
  asyncHandler(async (req: Request, res: Response) => {
    const adminKey = req.headers['x-admin-key'] as string;
    
    if (!adminKey) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '관리자 키가 필요합니다'
        }
      };
      return res.status(400).json(response);
    }

    const exportData = await adminService.exportAllReports(adminKey);
    
    const response: ApiResponse = {
      success: true,
      data: exportData
    };
    
    res.json(response);
  })
);

// GET /api/admin/stats - 관리자 통계
router.get('/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const adminKey = req.headers['x-admin-key'] as string;
    
    if (!adminKey) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '관리자 키가 필요합니다'
        }
      };
      return res.status(400).json(response);
    }

    const stats = await adminService.getReportStats(adminKey);
    
    const response: ApiResponse = {
      success: true,
      data: stats
    };
    
    res.json(response);
  })
);

export default router;
