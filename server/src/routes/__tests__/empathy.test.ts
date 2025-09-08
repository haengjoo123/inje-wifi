import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import empathyRouter from '../empathy';
import { EmpathyService } from '../../services/empathyService';

// Mock the EmpathyService
jest.mock('../../services/empathyService');

describe('Empathy Routes', () => {
  let app: express.Application;
  let mockEmpathyService: jest.Mocked<EmpathyService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/reports', empathyRouter);

    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock service instance
    mockEmpathyService = {
      addEmpathy: jest.fn(),
      removeEmpathy: jest.fn(),
      checkEmpathy: jest.fn(),
      getEmpathyCount: jest.fn(),
    } as any;

    // Mock the constructor to return our mock instance
    (EmpathyService as jest.Mock).mockImplementation(() => mockEmpathyService);
  });

  describe('POST /api/reports/:id/empathy', () => {
    it('should add empathy successfully', async () => {
      mockEmpathyService.addEmpathy.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/reports/report-123/empathy')
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: { message: '공감이 추가되었습니다' }
      });

      expect(mockEmpathyService.addEmpathy).toHaveBeenCalledWith(
        'report-123',
        expect.any(String) // user identifier from cookie
      );
    });

    it('should generate user identifier when no cookie exists', async () => {
      mockEmpathyService.addEmpathy.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/reports/report-123/empathy')
        .expect(201);

      // Check that a cookie was set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/user_id=/);
      expect(cookies[0]).toMatch(/Max-Age=31536000/); // 1 year
      expect(cookies[0]).toMatch(/HttpOnly/);
    });

    it('should use existing user identifier from cookie', async () => {
      mockEmpathyService.addEmpathy.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/reports/report-123/empathy')
        .set('Cookie', 'user_id=existing-user-123')
        .expect(201);

      expect(mockEmpathyService.addEmpathy).toHaveBeenCalledWith(
        'report-123',
        'existing-user-123'
      );
    });

    it('should return 409 for duplicate empathy', async () => {
      mockEmpathyService.addEmpathy.mockRejectedValue(new Error('이미 공감하셨습니다'));

      const response = await request(app)
        .post('/api/reports/report-123/empathy')
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_EMPATHY');
      expect(response.body.error.message).toBe('이미 공감하셨습니다');
    });

    it('should handle service errors', async () => {
      mockEmpathyService.addEmpathy.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/reports/report-123/empathy')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
    });

    it('should validate report ID parameter', async () => {
      const response = await request(app)
        .post('/api/reports//empathy') // empty report ID
        .expect(404); // Should not match route

      expect(mockEmpathyService.addEmpathy).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/reports/:id/empathy', () => {
    it('should remove empathy successfully', async () => {
      mockEmpathyService.removeEmpathy.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/reports/report-123/empathy')
        .set('Cookie', 'user_id=user-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { message: '공감이 취소되었습니다' }
      });

      expect(mockEmpathyService.removeEmpathy).toHaveBeenCalledWith(
        'report-123',
        'user-123'
      );
    });

    it('should return 404 when empathy not found', async () => {
      mockEmpathyService.removeEmpathy.mockRejectedValue(new Error('공감을 찾을 수 없습니다'));

      const response = await request(app)
        .delete('/api/reports/report-123/empathy')
        .set('Cookie', 'user_id=user-123')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle missing user identifier', async () => {
      const response = await request(app)
        .delete('/api/reports/report-123/empathy')
        .expect(200); // Should still work, just generate new user ID

      expect(mockEmpathyService.removeEmpathy).toHaveBeenCalledWith(
        'report-123',
        expect.any(String)
      );
    });
  });

  describe('GET /api/reports/:id/empathy/count', () => {
    it('should get empathy count successfully', async () => {
      mockEmpathyService.getEmpathyCount.mockResolvedValue(7);

      const response = await request(app)
        .get('/api/reports/report-123/empathy/count')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { count: 7 }
      });

      expect(mockEmpathyService.getEmpathyCount).toHaveBeenCalledWith('report-123');
    });

    it('should return 0 for non-existent report', async () => {
      mockEmpathyService.getEmpathyCount.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/reports/non-existent/empathy/count')
        .expect(200);

      expect(response.body.data.count).toBe(0);
    });

    it('should handle service errors', async () => {
      mockEmpathyService.getEmpathyCount.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/reports/report-123/empathy/count')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
    });
  });

  describe('GET /api/reports/:id/empathy/check', () => {
    it('should check empathy status successfully', async () => {
      const mockEmpathyCheck = {
        hasEmpathy: true,
        empathyCount: 5
      };

      mockEmpathyService.checkEmpathy.mockResolvedValue(mockEmpathyCheck);

      const response = await request(app)
        .get('/api/reports/report-123/empathy/check')
        .set('Cookie', 'user_id=user-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockEmpathyCheck
      });

      expect(mockEmpathyService.checkEmpathy).toHaveBeenCalledWith(
        'report-123',
        'user-123'
      );
    });

    it('should return false when user has not empathized', async () => {
      const mockEmpathyCheck = {
        hasEmpathy: false,
        empathyCount: 3
      };

      mockEmpathyService.checkEmpathy.mockResolvedValue(mockEmpathyCheck);

      const response = await request(app)
        .get('/api/reports/report-123/empathy/check')
        .set('Cookie', 'user_id=user-123')
        .expect(200);

      expect(response.body.data.hasEmpathy).toBe(false);
      expect(response.body.data.empathyCount).toBe(3);
    });

    it('should handle missing user identifier', async () => {
      const mockEmpathyCheck = {
        hasEmpathy: false,
        empathyCount: 2
      };

      mockEmpathyService.checkEmpathy.mockResolvedValue(mockEmpathyCheck);

      const response = await request(app)
        .get('/api/reports/report-123/empathy/check')
        .expect(200);

      expect(mockEmpathyService.checkEmpathy).toHaveBeenCalledWith(
        'report-123',
        expect.any(String)
      );

      // Should set cookie for new user
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/user_id=/);
    });

    it('should handle service errors', async () => {
      mockEmpathyService.checkEmpathy.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/reports/report-123/empathy/check')
        .set('Cookie', 'user_id=user-123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
    });
  });

  describe('User identifier management', () => {
    it('should generate consistent user identifiers', async () => {
      mockEmpathyService.addEmpathy.mockResolvedValue(undefined);

      // First request should generate a user ID
      const response1 = await request(app)
        .post('/api/reports/report-123/empathy')
        .expect(201);

      const cookies1 = response1.headers['set-cookie'];
      expect(cookies1).toBeDefined();
      
      const userIdMatch = cookies1[0].match(/user_id=([^;]+)/);
      expect(userIdMatch).toBeTruthy();
      
      const userId = userIdMatch![1];
      expect(userId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    });

    it('should preserve user identifier across requests', async () => {
      mockEmpathyService.checkEmpathy.mockResolvedValue({
        hasEmpathy: false,
        empathyCount: 0
      });

      const existingUserId = 'existing-user-456';

      const response = await request(app)
        .get('/api/reports/report-123/empathy/check')
        .set('Cookie', `user_id=${existingUserId}`)
        .expect(200);

      expect(mockEmpathyService.checkEmpathy).toHaveBeenCalledWith(
        'report-123',
        existingUserId
      );

      // Should not set a new cookie when one already exists
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeUndefined();
    });

    it('should handle malformed user identifier cookie', async () => {
      mockEmpathyService.addEmpathy.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/reports/report-123/empathy')
        .set('Cookie', 'user_id=invalid-format')
        .expect(201);

      // Should generate a new valid user ID
      expect(mockEmpathyService.addEmpathy).toHaveBeenCalledWith(
        'report-123',
        expect.stringMatching(/^[a-f0-9-]{36}$/)
      );

      // Should set a new cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });
  });

  describe('Cookie security', () => {
    it('should set secure cookie attributes', async () => {
      mockEmpathyService.addEmpathy.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/reports/report-123/empathy')
        .expect(201);

      const cookies = response.headers['set-cookie'];
      expect(cookies[0]).toMatch(/HttpOnly/);
      expect(cookies[0]).toMatch(/SameSite=Strict/);
      expect(cookies[0]).toMatch(/Max-Age=31536000/); // 1 year
    });

    it('should not expose user identifier in response body', async () => {
      mockEmpathyService.addEmpathy.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/reports/report-123/empathy')
        .expect(201);

      expect(response.body.data).not.toHaveProperty('userIdentifier');
      expect(response.body.data).not.toHaveProperty('userId');
    });
  });
});