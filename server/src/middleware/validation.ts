import { Request, Response, NextFunction } from 'express';
import {
  CreateReportRequest,
  UpdateReportRequest,
  DeleteReportRequest,
  ValidationError,
  ApiErrorCode,
  CAMPUS_OPTIONS,
  PROBLEM_TYPES
} from '../types';

export class ValidationMiddleware {
  
  /**
   * Validate create report request data
   */
  static validateCreateReport(req: Request, res: Response, next: NextFunction) {
    const data: CreateReportRequest = req.body;
    const errors = ValidationMiddleware.validateCreateReportData(data);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: '입력 데이터가 올바르지 않습니다',
          details: errors
        }
      });
    }
    
    next();
  }

  /**
   * Validate update report request data
   */
  static validateUpdateReport(req: Request, res: Response, next: NextFunction) {
    const data: UpdateReportRequest = req.body;
    const errors = ValidationMiddleware.validateUpdateReportData(data);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: '입력 데이터가 올바르지 않습니다',
          details: errors
        }
      });
    }
    
    next();
  }

  /**
   * Validate delete report request data
   */
  static validateDeleteReport(req: Request, res: Response, next: NextFunction) {
    const data: DeleteReportRequest = req.body;
    const errors = ValidationMiddleware.validateDeleteReportData(data);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: '입력 데이터가 올바르지 않습니다',
          details: errors
        }
      });
    }
    
    next();
  }

  /**
   * Validate report ID parameter
   */
  static validateReportId(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: '올바른 제보 ID를 제공해주세요'
        }
      });
    }
    
    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: '올바른 제보 ID 형식이 아닙니다'
        }
      });
    }
    
    next();
  }

  /**
   * Validate query parameters for report list
   */
  static validateReportListQuery(req: Request, res: Response, next: NextFunction) {
    const { sort, campus, building, page, limit } = req.query;
    const errors: ValidationError[] = [];

    // Validate sort parameter
    if (sort && !['latest', 'empathy'].includes(sort as string)) {
      errors.push({
        field: 'sort',
        message: '정렬 옵션은 latest 또는 empathy만 가능합니다'
      });
    }

    // Validate campus parameter
    if (campus && campus !== 'all' && !CAMPUS_OPTIONS.includes(campus as any)) {
      errors.push({
        field: 'campus',
        message: '올바른 캠퍼스를 선택해주세요'
      });
    }

    // Validate building parameter (optional string)
    if (building && typeof building !== 'string') {
      errors.push({
        field: 'building',
        message: '건물명은 문자열이어야 합니다'
      });
    }

    // Validate page parameter
    if (page) {
      const pageNum = parseInt(page as string);
      if (isNaN(pageNum) || pageNum < 1) {
        errors.push({
          field: 'page',
          message: '페이지 번호는 1 이상의 숫자여야 합니다'
        });
      }
    }

    // Validate limit parameter
    if (limit) {
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push({
          field: 'limit',
          message: '페이지 크기는 1-100 사이의 숫자여야 합니다'
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: '쿼리 파라미터가 올바르지 않습니다',
          details: errors
        }
      });
    }

    next();
  }

  /**
   * Validate create report data
   */
  private static validateCreateReportData(data: CreateReportRequest): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate campus
    if (!data.campus) {
      errors.push({
        field: 'campus',
        message: '캠퍼스를 선택해주세요'
      });
    } else if (!CAMPUS_OPTIONS.includes(data.campus as any)) {
      errors.push({
        field: 'campus',
        message: '올바른 캠퍼스를 선택해주세요'
      });
    }

    // Validate building
    if (!data.building) {
      errors.push({
        field: 'building',
        message: '건물명을 입력해주세요'
      });
    } else if (typeof data.building !== 'string' || data.building.trim().length === 0) {
      errors.push({
        field: 'building',
        message: '건물명을 입력해주세요'
      });
    } else if (data.building.trim().length > 100) {
      errors.push({
        field: 'building',
        message: '건물명은 100자 이하로 입력해주세요'
      });
    }

    // Validate location
    if (!data.location) {
      errors.push({
        field: 'location',
        message: '상세 위치를 입력해주세요'
      });
    } else if (typeof data.location !== 'string' || data.location.trim().length === 0) {
      errors.push({
        field: 'location',
        message: '상세 위치를 입력해주세요'
      });
    } else if (data.location.trim().length > 200) {
      errors.push({
        field: 'location',
        message: '상세 위치는 200자 이하로 입력해주세요'
      });
    }

    // Validate problem types
    if (!data.problemTypes) {
      errors.push({
        field: 'problemTypes',
        message: '문제 유형을 선택해주세요'
      });
    } else if (!Array.isArray(data.problemTypes) || data.problemTypes.length === 0) {
      errors.push({
        field: 'problemTypes',
        message: '문제 유형을 선택해주세요'
      });
    } else {
      // Validate each problem type
      const validProblemTypes = [...PROBLEM_TYPES];
      const invalidTypes = data.problemTypes.filter(type => !validProblemTypes.includes(type as any));
      if (invalidTypes.length > 0) {
        errors.push({
          field: 'problemTypes',
          message: '올바른 문제 유형을 선택해주세요'
        });
      }
    }

    // Validate custom problem (optional)
    if (data.customProblem !== undefined) {
      if (typeof data.customProblem !== 'string') {
        errors.push({
          field: 'customProblem',
          message: '기타 문제는 문자열이어야 합니다'
        });
      } else if (data.customProblem.length > 200) {
        errors.push({
          field: 'customProblem',
          message: '기타 문제는 200자 이하로 입력해주세요'
        });
      }
    }

    // Validate description
    if (!data.description) {
      errors.push({
        field: 'description',
        message: '문제 설명을 입력해주세요'
      });
    } else if (typeof data.description !== 'string') {
      errors.push({
        field: 'description',
        message: '문제 설명은 문자열이어야 합니다'
      });
    } else if (data.description.trim().length < 10) {
      errors.push({
        field: 'description',
        message: '문제 설명을 10자 이상 입력해주세요'
      });
    } else if (data.description.trim().length > 2000) {
      errors.push({
        field: 'description',
        message: '문제 설명은 2000자 이하로 입력해주세요'
      });
    }

    // Validate password
    if (!data.password) {
      errors.push({
        field: 'password',
        message: '비밀번호를 입력해주세요'
      });
    } else if (typeof data.password !== 'string') {
      errors.push({
        field: 'password',
        message: '비밀번호는 문자열이어야 합니다'
      });
    } else if (!/^\d{4}$/.test(data.password)) {
      errors.push({
        field: 'password',
        message: '4자리 숫자 비밀번호를 입력해주세요'
      });
    }

    return errors;
  }

  /**
   * Validate update report data
   */
  private static validateUpdateReportData(data: UpdateReportRequest): ValidationError[] {
    const errors: ValidationError[] = [];

    // Password is always required for updates
    if (!data.password) {
      errors.push({
        field: 'password',
        message: '비밀번호를 입력해주세요'
      });
    } else if (typeof data.password !== 'string') {
      errors.push({
        field: 'password',
        message: '비밀번호는 문자열이어야 합니다'
      });
    } else if (!/^\d{4}$/.test(data.password)) {
      errors.push({
        field: 'password',
        message: '4자리 숫자 비밀번호를 입력해주세요'
      });
    }

    // Validate optional fields only if they are provided
    if (data.campus !== undefined) {
      if (!CAMPUS_OPTIONS.includes(data.campus as any)) {
        errors.push({
          field: 'campus',
          message: '올바른 캠퍼스를 선택해주세요'
        });
      }
    }

    if (data.building !== undefined) {
      if (typeof data.building !== 'string' || data.building.trim().length === 0) {
        errors.push({
          field: 'building',
          message: '건물명을 입력해주세요'
        });
      } else if (data.building.trim().length > 100) {
        errors.push({
          field: 'building',
          message: '건물명은 100자 이하로 입력해주세요'
        });
      }
    }

    if (data.location !== undefined) {
      if (typeof data.location !== 'string' || data.location.trim().length === 0) {
        errors.push({
          field: 'location',
          message: '상세 위치를 입력해주세요'
        });
      } else if (data.location.trim().length > 200) {
        errors.push({
          field: 'location',
          message: '상세 위치는 200자 이하로 입력해주세요'
        });
      }
    }

    if (data.problemTypes !== undefined) {
      if (!Array.isArray(data.problemTypes) || data.problemTypes.length === 0) {
        errors.push({
          field: 'problemTypes',
          message: '문제 유형을 선택해주세요'
        });
      } else {
        const validProblemTypes = [...PROBLEM_TYPES];
        const invalidTypes = data.problemTypes.filter(type => !validProblemTypes.includes(type as any));
        if (invalidTypes.length > 0) {
          errors.push({
            field: 'problemTypes',
            message: '올바른 문제 유형을 선택해주세요'
          });
        }
      }
    }

    if (data.customProblem !== undefined) {
      if (typeof data.customProblem !== 'string') {
        errors.push({
          field: 'customProblem',
          message: '기타 문제는 문자열이어야 합니다'
        });
      } else if (data.customProblem.length > 200) {
        errors.push({
          field: 'customProblem',
          message: '기타 문제는 200자 이하로 입력해주세요'
        });
      }
    }

    if (data.description !== undefined) {
      if (typeof data.description !== 'string') {
        errors.push({
          field: 'description',
          message: '문제 설명은 문자열이어야 합니다'
        });
      } else if (data.description.trim().length < 10) {
        errors.push({
          field: 'description',
          message: '문제 설명을 10자 이상 입력해주세요'
        });
      } else if (data.description.trim().length > 2000) {
        errors.push({
          field: 'description',
          message: '문제 설명은 2000자 이하로 입력해주세요'
        });
      }
    }

    return errors;
  }

  /**
   * Validate delete report data
   */
  private static validateDeleteReportData(data: DeleteReportRequest): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.password) {
      errors.push({
        field: 'password',
        message: '비밀번호를 입력해주세요'
      });
    } else if (typeof data.password !== 'string') {
      errors.push({
        field: 'password',
        message: '비밀번호는 문자열이어야 합니다'
      });
    } else if (!/^\d{4}$/.test(data.password)) {
      errors.push({
        field: 'password',
        message: '4자리 숫자 비밀번호를 입력해주세요'
      });
    }

    return errors;
  }
}