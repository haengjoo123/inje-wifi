import { ReportService } from '../reportService';
import { CreateReportRequest, UpdateReportRequest, ReportListQuery } from '../../types';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Mock the database connection
jest.mock('../../database/connection', () => ({
  db: {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
  }
}));
jest.mock('bcrypt');
jest.mock('uuid');

describe('ReportService', () => {
  let reportService: ReportService;
  let mockDb: any;

  beforeEach(() => {
    // Get the mocked db from the mock
    const { db } = require('../../database/connection');
    mockDb = db;
    
    reportService = new ReportService();
    
    // Reset mocks
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue('test-uuid-123');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('createReport', () => {
    const validReportData: CreateReportRequest = {
      campus: '김해캠퍼스',
      building: '공학관',
      location: '3층 컴퓨터실',
      problemTypes: ['WiFi 신호 약함', 'WiFi 연결 끊김'],
      customProblem: '',
      description: '와이파이가 자주 끊어져서 수업에 지장이 있습니다.',
      password: '1234'
    };

    it('should create a report successfully', async () => {
      // Mock successful database insert
      mockDb.run.mockResolvedValue({ changes: 1 });

      const result = await reportService.createReport(validReportData);

      expect(bcrypt.hash).toHaveBeenCalledWith('1234', 10);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO reports'),
        expect.arrayContaining([
          'test-uuid-123',
          '김해캠퍼스',
          '공학관',
          '3층 컴퓨터실',
          JSON.stringify(['WiFi 신호 약함', 'WiFi 연결 끊김']),
          '',
          '와이파이가 자주 끊어져서 수업에 지장이 있습니다.',
          'hashed-password'
        ])
      );
      expect(result.id).toBe('test-uuid-123');
      expect(result.campus).toBe('김해캠퍼스');
    });

    it('should throw error when database insert fails', async () => {
      mockDb.run.mockRejectedValue(new Error('Database error'));

      await expect(reportService.createReport(validReportData))
        .rejects.toThrow('제보 저장 중 오류가 발생했습니다');
    });

    it('should handle custom problem correctly', async () => {
      const reportWithCustomProblem = {
        ...validReportData,
        problemTypes: ['기타'],
        customProblem: '특정 앱에서만 연결 안됨'
      };

      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call({ lastID: 'test-uuid-123' }, null);
      });

      mockDb.get.mockResolvedValue({
        id: 'test-uuid-123',
        campus: '김해캠퍼스',
        building: '공학관',
        location: '3층 컴퓨터실',
        problem_types: JSON.stringify(['기타']),
        custom_problem: '특정 앱에서만 연결 안됨',
        description: '와이파이가 자주 끊어져서 수업에 지장이 있습니다.',
        password_hash: 'hashed-password',
        empathy_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const result = await reportService.createReport(reportWithCustomProblem);

      expect(result.customProblem).toBe('특정 앱에서만 연결 안됨');
    });
  });

  describe('getReports', () => {
    const mockReports = [
      {
        id: 'report-1',
        campus: '김해캠퍼스',
        building: '공학관',
        location: '3층',
        problem_types: JSON.stringify(['WiFi 신호 약함']),
        custom_problem: null,
        description: '신호가 약합니다',
        empathy_count: 5,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'report-2',
        campus: '부산캠퍼스',
        building: '본관',
        location: '1층',
        problem_types: JSON.stringify(['WiFi 연결 끊김']),
        custom_problem: null,
        description: '연결이 끊어집니다',
        empathy_count: 3,
        created_at: '2024-01-02T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z'
      }
    ];

    it('should get reports with default sorting (latest)', async () => {
      mockDb.all.mockResolvedValue(mockReports);
      mockDb.get.mockResolvedValue({ count: 2 });

      const query: ReportListQuery = {};
      const result = await reportService.getReports(query);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        expect.any(Array)
      );
      expect(result.reports).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should sort by empathy count when requested', async () => {
      mockDb.all.mockResolvedValue(mockReports);
      mockDb.get.mockResolvedValue({ count: 2 });

      const query: ReportListQuery = { sort: 'empathy' };
      const result = await reportService.getReports(query);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY empathy_count DESC'),
        expect.any(Array)
      );
    });

    it('should filter by campus', async () => {
      const filteredReports = [mockReports[0]];
      mockDb.all.mockResolvedValue(filteredReports);
      mockDb.get.mockResolvedValue({ count: 1 });

      const query: ReportListQuery = { campus: '김해캠퍼스' };
      const result = await reportService.getReports(query);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('WHERE campus = ?'),
        expect.arrayContaining(['김해캠퍼스'])
      );
      expect(result.reports).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by building', async () => {
      const filteredReports = [mockReports[0]];
      mockDb.all.mockResolvedValue(filteredReports);
      mockDb.get.mockResolvedValue({ count: 1 });

      const query: ReportListQuery = { building: '공학관' };
      const result = await reportService.getReports(query);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('WHERE building LIKE ?'),
        expect.arrayContaining(['%공학관%'])
      );
    });

    it('should handle pagination correctly', async () => {
      mockDb.all.mockResolvedValue(mockReports);
      mockDb.get.mockResolvedValue({ count: 25 });

      const query: ReportListQuery = { page: 2, limit: 10 };
      const result = await reportService.getReports(query);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        expect.arrayContaining([10, 10])
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getReportById', () => {
    it('should return report when found', async () => {
      const mockReport = {
        id: 'report-1',
        campus: '김해캠퍼스',
        building: '공학관',
        location: '3층',
        problem_types: JSON.stringify(['WiFi 신호 약함']),
        custom_problem: null,
        description: '신호가 약합니다',
        password_hash: 'hashed-password',
        empathy_count: 5,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      mockDb.get.mockResolvedValue(mockReport);

      const result = await reportService.getReportById('report-1');

      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM reports WHERE id = ?'),
        ['report-1']
      );
      expect(result).toBeDefined();
      expect(result!.id).toBe('report-1');
      expect(result!.problemTypes).toEqual(['WiFi 신호 약함']);
    });

    it('should return null when report not found', async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await reportService.getReportById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateReport', () => {
    const updateData: UpdateReportRequest = {
      campus: '부산캠퍼스',
      building: '새 건물',
      description: '업데이트된 설명',
      password: '1234'
    };

    it('should update report successfully', async () => {
      const mockExistingReport = {
        id: 'report-1',
        password_hash: 'hashed-password'
      };

      const mockUpdatedReport = {
        id: 'report-1',
        campus: '부산캠퍼스',
        building: '새 건물',
        location: '3층',
        problem_types: JSON.stringify(['WiFi 신호 약함']),
        custom_problem: null,
        description: '업데이트된 설명',
        password_hash: 'hashed-password',
        empathy_count: 5,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString()
      };

      mockDb.get
        .mockResolvedValueOnce(mockExistingReport)
        .mockResolvedValueOnce(mockUpdatedReport);
      
      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call({ changes: 1 }, null);
      });

      const result = await reportService.updateReport('report-1', updateData);

      expect(bcrypt.compare).toHaveBeenCalledWith('1234', 'hashed-password');
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE reports SET'),
        expect.any(Array),
        expect.any(Function)
      );
      expect(result.campus).toBe('부산캠퍼스');
      expect(result.description).toBe('업데이트된 설명');
    });

    it('should throw error for wrong password', async () => {
      const mockExistingReport = {
        id: 'report-1',
        password_hash: 'hashed-password'
      };

      mockDb.get.mockResolvedValue(mockExistingReport);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(reportService.updateReport('report-1', updateData))
        .rejects.toThrow('비밀번호가 일치하지 않습니다');
    });

    it('should throw error for non-existent report', async () => {
      mockDb.get.mockResolvedValue(null);

      await expect(reportService.updateReport('non-existent', updateData))
        .rejects.toThrow('제보를 찾을 수 없습니다');
    });
  });

  describe('deleteReport', () => {
    it('should delete report successfully', async () => {
      const mockExistingReport = {
        id: 'report-1',
        password_hash: 'hashed-password'
      };

      mockDb.get.mockResolvedValue(mockExistingReport);
      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call({ changes: 1 }, null);
      });

      await reportService.deleteReport('report-1', '1234');

      expect(bcrypt.compare).toHaveBeenCalledWith('1234', 'hashed-password');
      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM reports WHERE id = ?',
        ['report-1'],
        expect.any(Function)
      );
    });

    it('should throw error for wrong password', async () => {
      const mockExistingReport = {
        id: 'report-1',
        password_hash: 'hashed-password'
      };

      mockDb.get.mockResolvedValue(mockExistingReport);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(reportService.deleteReport('report-1', 'wrong-password'))
        .rejects.toThrow('비밀번호가 일치하지 않습니다');
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const mockReport = {
        id: 'report-1',
        password_hash: 'hashed-password'
      };

      mockDb.get.mockResolvedValue(mockReport);

      const result = await reportService.verifyPassword('report-1', '1234');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('1234', 'hashed-password');
    });

    it('should return false for incorrect password', async () => {
      const mockReport = {
        id: 'report-1',
        password_hash: 'hashed-password'
      };

      mockDb.get.mockResolvedValue(mockReport);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await reportService.verifyPassword('report-1', 'wrong');

      expect(result).toBe(false);
    });

    it('should return false for non-existent report', async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await reportService.verifyPassword('non-existent', '1234');

      expect(result).toBe(false);
    });
  });
});