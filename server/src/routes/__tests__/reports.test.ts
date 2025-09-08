import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import reportsRouter from '../reports';
import { ReportService } from '../../services/reportService';
import { CreateReportRequest, UpdateReportRequest } from '../../types';

// Mock the ReportService
jest.mock('../../services/reportService');

describe('Reports Routes', () => {
  let app: express.Application;
  let mockReportService: jest.Mocked<ReportService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/reports', reportsRouter);

    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock service instance
    mockReportService = {
      createReport: jest.fn(),
      getReports: jest.fn(),
      getReportById: jest.fn(),
      updateReport: jest.fn(),
      deleteReport: jest.fn(),
      verifyPassword: jest.fn(),
    } as any;

    // Mock the constructor to return our mock instance
    (ReportService as jest.Mock).mockImplementation(() => mockReportService);
  });

  describe('POST /api/reports', () => {
    const validReportData: CreateReportRequest = {
      campus: '김해캠퍼스',
      building: '공학관',
      location: '3층 컴퓨터실',
      problemTypes: ['WiFi 신호 약함', 'WiFi 연결 끊김'],
      customProblem: '',
      description: '와이파이가 자주 끊어져서 수업에 지장이 있습니다. 특히 오후 시간대에 더 심합니다.',
      password: '1234'
    };

    it('should create a report successfully', async () => {
      const mockCreatedReport = {
        id: 'report-123',
        ...validReportData,
        empathyCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReportService.createReport.mockResolvedValue(mockCreatedReport);

      const response = await request(app)
        .post('/api/reports')
        .send(validReportData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'report-123',
          campus: '김해캠퍼스',
          building: '공학관'
        })
      });

      expect(mockReportService.createReport).toHaveBeenCalledWith(validReportData);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = { ...validReportData, campus: '' };

      const response = await request(app)
        .post('/api/reports')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockReportService.createReport).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockReportService.createReport.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/reports')
        .send(validReportData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
    });

    it('should validate custom problem when "기타" is selected', async () => {
      const dataWithCustomProblem = {
        ...validReportData,
        problemTypes: ['기타'],
        customProblem: '특정 앱에서만 연결 안됨'
      };

      const mockCreatedReport = {
        id: 'report-123',
        ...dataWithCustomProblem,
        empathyCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReportService.createReport.mockResolvedValue(mockCreatedReport);

      const response = await request(app)
        .post('/api/reports')
        .send(dataWithCustomProblem)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/reports', () => {
    const mockReports = [
      {
        id: 'report-1',
        campus: '김해캠퍼스',
        building: '공학관',
        location: '3층',
        problemTypes: ['WiFi 신호 약함'],
        description: '신호가 약합니다',
        empathyCount: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'report-2',
        campus: '부산캠퍼스',
        building: '본관',
        location: '1층',
        problemTypes: ['WiFi 연결 끊김'],
        description: '연결이 끊어집니다',
        empathyCount: 3,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ];

    it('should get reports with default parameters', async () => {
      const mockResponse = {
        reports: mockReports,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1
      };

      mockReportService.getReports.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/reports')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockResponse
      });

      expect(mockReportService.getReports).toHaveBeenCalledWith({});
    });

    it('should get reports with query parameters', async () => {
      const mockResponse = {
        reports: [mockReports[0]],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockReportService.getReports.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/reports')
        .query({
          sort: 'empathy',
          campus: '김해캠퍼스',
          building: '공학관',
          page: '1',
          limit: '10'
        })
        .expect(200);

      expect(mockReportService.getReports).toHaveBeenCalledWith({
        sort: 'empathy',
        campus: '김해캠퍼스',
        building: '공학관',
        page: 1,
        limit: 10
      });
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/reports')
        .query({ sort: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle service errors', async () => {
      mockReportService.getReports.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/reports')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
    });
  });

  describe('GET /api/reports/:id', () => {
    const mockReport = {
      id: 'report-123',
      campus: '김해캠퍼스',
      building: '공학관',
      location: '3층',
      problemTypes: ['WiFi 신호 약함'],
      description: '신호가 약합니다',
      empathyCount: 5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    it('should get report by id successfully', async () => {
      mockReportService.getReportById.mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/reports/report-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'report-123',
          campus: '김해캠퍼스'
        })
      });

      expect(mockReportService.getReportById).toHaveBeenCalledWith('report-123');
    });

    it('should return 404 for non-existent report', async () => {
      mockReportService.getReportById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/reports/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle service errors', async () => {
      mockReportService.getReportById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/reports/report-123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
    });
  });

  describe('PUT /api/reports/:id', () => {
    const validUpdateData: UpdateReportRequest = {
      campus: '부산캠퍼스',
      building: '새 건물',
      description: '업데이트된 설명입니다. 문제가 더 심해졌습니다.',
      password: '1234'
    };

    const mockUpdatedReport = {
      id: 'report-123',
      campus: '부산캠퍼스',
      building: '새 건물',
      location: '3층',
      problemTypes: ['WiFi 신호 약함'],
      description: '업데이트된 설명입니다. 문제가 더 심해졌습니다.',
      empathyCount: 5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    };

    it('should update report successfully', async () => {
      mockReportService.updateReport.mockResolvedValue(mockUpdatedReport);

      const response = await request(app)
        .put('/api/reports/report-123')
        .send(validUpdateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'report-123',
          campus: '부산캠퍼스',
          building: '새 건물'
        })
      });

      expect(mockReportService.updateReport).toHaveBeenCalledWith('report-123', validUpdateData);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = { ...validUpdateData, password: '' };

      const response = await request(app)
        .put('/api/reports/report-123')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for wrong password', async () => {
      mockReportService.updateReport.mockRejectedValue(new Error('비밀번호가 일치하지 않습니다'));

      const response = await request(app)
        .put('/api/reports/report-123')
        .send(validUpdateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent report', async () => {
      mockReportService.updateReport.mockRejectedValue(new Error('제보를 찾을 수 없습니다'));

      const response = await request(app)
        .put('/api/reports/non-existent')
        .send(validUpdateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/reports/:id', () => {
    it('should delete report successfully', async () => {
      mockReportService.deleteReport.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/reports/report-123')
        .send({ password: '1234' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { message: '제보가 삭제되었습니다' }
      });

      expect(mockReportService.deleteReport).toHaveBeenCalledWith('report-123', '1234');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .delete('/api/reports/report-123')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for wrong password', async () => {
      mockReportService.deleteReport.mockRejectedValue(new Error('비밀번호가 일치하지 않습니다'));

      const response = await request(app)
        .delete('/api/reports/report-123')
        .send({ password: 'wrong' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent report', async () => {
      mockReportService.deleteReport.mockRejectedValue(new Error('제보를 찾을 수 없습니다'));

      const response = await request(app)
        .delete('/api/reports/non-existent')
        .send({ password: '1234' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/reports/:id/verify-password', () => {
    it('should verify password successfully', async () => {
      mockReportService.verifyPassword.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/reports/report-123/verify-password')
        .send({ password: '1234' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { valid: true }
      });

      expect(mockReportService.verifyPassword).toHaveBeenCalledWith('report-123', '1234');
    });

    it('should return false for wrong password', async () => {
      mockReportService.verifyPassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/reports/report-123/verify-password')
        .send({ password: 'wrong' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { valid: false }
      });
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/reports/report-123/verify-password')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});