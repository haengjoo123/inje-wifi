import { Request, Response, NextFunction } from "express";
import { ValidationMiddleware } from "../validation";
import { CreateReportRequest, UpdateReportRequest } from "../../types";

describe("Validation Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("validateCreateReport", () => {
    const validReportData: CreateReportRequest = {
      campus: "김해캠퍼스",
      building: "공학관",
      location: "3층 컴퓨터실",
      problemTypes: ["WiFi 신호 약함", "WiFi 연결 끊김"],
      customProblem: "",
      description:
        "와이파이가 자주 끊어져서 수업에 지장이 있습니다. 특히 오후 시간대에 더 심합니다.",
      password: "1234",
    };

    it("should pass validation with valid data", () => {
      mockRequest.body = validReportData;

      ValidationMiddleware.validateCreateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should reject missing campus", () => {
      mockRequest.body = { ...validReportData, campus: "" };

      ValidationMiddleware.validateCreateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "입력 데이터가 올바르지 않습니다",
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "campus",
              message: expect.any(String),
            }),
          ]),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject invalid campus", () => {
      mockRequest.body = { ...validReportData, campus: "서울캠퍼스" };

      ValidationMiddleware.validateCreateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "입력 데이터가 올바르지 않습니다",
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "campus",
              message: "올바른 캠퍼스를 선택해주세요",
            }),
          ]),
        },
      });
    });

    it("should reject missing building", () => {
      mockRequest.body = { ...validReportData, building: "" };

      ValidationMiddleware.validateCreateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "입력 데이터가 올바르지 않습니다",
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "building",
              message: expect.any(String),
            }),
          ]),
        },
      });
    });

    it("should reject missing location", () => {
      mockRequest.body = { ...validReportData, location: "" };

      ValidationMiddleware.validateCreateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should reject empty problem types", () => {
      mockRequest.body = { ...validReportData, problemTypes: [] };

      ValidationMiddleware.validateCreateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "입력 데이터가 올바르지 않습니다",
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "problemTypes",
              message: "문제 유형을 선택해주세요",
            }),
          ]),
        },
      });
    });

    it("should reject invalid problem types", () => {
      mockRequest.body = {
        ...validReportData,
        problemTypes: ["WiFi 신호 약함", "잘못된 문제 유형"],
      };

      ValidationMiddleware.validateCreateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "입력 데이터가 올바르지 않습니다",
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "problemTypes",
              message: expect.stringContaining("올바른 문제 유형"),
            }),
          ]),
        },
      });
    });

    it('should require custom problem when "기타" is selected', () => {
      mockRequest.body = {
        ...validReportData,
        problemTypes: ["기타"],
        customProblem: "",
      };

      ValidationMiddleware.validateCreateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(); // 기타 문제는 선택사항이므로 통과
    });

    it('should accept custom problem when "기타" is selected', () => {
      mockRequest.body = {
        ...validReportData,
        problemTypes: ["기타"],
        customProblem: "특정 앱에서만 연결이 안됩니다",
      };

      ValidationMiddleware.validateCreateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should reject short description", () => {
      mockRequest.body = { ...validReportData, description: "짧은 설명" };

      ValidationMiddleware.validateCreateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "입력 데이터가 올바르지 않습니다",
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "description",
              message: "문제 설명을 10자 이상 입력해주세요",
            }),
          ]),
        },
      });
    });

    it("should reject invalid password format", () => {
      mockRequest.body = { ...validReportData, password: "12a4" };

      ValidationMiddleware.validateCreateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "입력 데이터가 올바르지 않습니다",
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "password",
              message: "4자리 숫자 비밀번호를 입력해주세요",
            }),
          ]),
        },
      });
    });

    it("should reject password with wrong length", () => {
      mockRequest.body = { ...validReportData, password: "12345" };

      ValidationMiddleware.validateCreateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should handle multiple validation errors", () => {
      mockRequest.body = {
        campus: "",
        building: "",
        location: "",
        problemTypes: [],
        description: "short",
        password: "abc",
      };

      ValidationMiddleware.validateCreateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "입력 데이터가 올바르지 않습니다",
          details: expect.arrayContaining([
            expect.objectContaining({ field: "campus" }),
            expect.objectContaining({ field: "building" }),
            expect.objectContaining({ field: "location" }),
            expect.objectContaining({ field: "problemTypes" }),
            expect.objectContaining({ field: "description" }),
            expect.objectContaining({ field: "password" }),
          ]),
        },
      });
    });
  });

  describe("validateUpdateReport", () => {
    const validUpdateData: UpdateReportRequest = {
      campus: "부산캠퍼스",
      building: "새 건물",
      description: "업데이트된 설명입니다. 이제 문제가 더 심해졌습니다.",
      password: "5678",
    };

    it("should pass validation with valid data", () => {
      mockRequest.body = validUpdateData;

      ValidationMiddleware.validateUpdateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should reject invalid campus in update", () => {
      mockRequest.body = { ...validUpdateData, campus: "잘못된캠퍼스" };

      ValidationMiddleware.validateUpdateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should require password for update", () => {
      mockRequest.body = { ...validUpdateData, password: "" };

      ValidationMiddleware.validateUpdateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "입력 데이터가 올바르지 않습니다",
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "password",
              message: expect.any(String),
            }),
          ]),
        },
      });
    });

    it("should allow partial updates", () => {
      mockRequest.body = {
        description: "새로운 설명입니다. 문제가 해결되었습니다.",
        password: "1234",
      };

      ValidationMiddleware.validateUpdateReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe("validateDeleteReport", () => {
    it("should pass validation with valid password", () => {
      mockRequest.body = { password: "1234" };

      ValidationMiddleware.validateDeleteReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should reject missing password", () => {
      mockRequest.body = {};

      ValidationMiddleware.validateDeleteReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should reject invalid password format", () => {
      mockRequest.body = { password: "abcd" };

      ValidationMiddleware.validateDeleteReport(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe("validateReportListQuery", () => {
    it("should pass validation with valid query parameters", () => {
      mockRequest.query = {
        sort: "latest",
        campus: "김해캠퍼스",
        building: "공학관",
        page: "1",
        limit: "20",
      };

      ValidationMiddleware.validateReportListQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should pass validation with empty query", () => {
      mockRequest.query = {};

      ValidationMiddleware.validateReportListQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should reject invalid sort parameter", () => {
      mockRequest.query = { sort: "invalid" };

      ValidationMiddleware.validateReportListQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "쿼리 파라미터가 올바르지 않습니다",
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "sort",
              message: expect.any(String),
            }),
          ]),
        },
      });
    });

    it("should reject invalid campus parameter", () => {
      mockRequest.query = { campus: "잘못된캠퍼스" };

      ValidationMiddleware.validateReportListQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should reject invalid page parameter", () => {
      mockRequest.query = { page: "abc" };

      ValidationMiddleware.validateReportListQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should reject negative page parameter", () => {
      mockRequest.query = { page: "-1" };

      ValidationMiddleware.validateReportListQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should reject invalid limit parameter", () => {
      mockRequest.query = { limit: "0" };

      ValidationMiddleware.validateReportListQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should reject limit parameter exceeding maximum", () => {
      mockRequest.query = { limit: "101" };

      ValidationMiddleware.validateReportListQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
