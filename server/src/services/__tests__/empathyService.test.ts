import { EmpathyService } from '../empathyService';
import { db } from '../../database/connection';
import { v4 as uuidv4 } from 'uuid';

// Mock the database connection
jest.mock('../../database/connection');
jest.mock('uuid');

describe('EmpathyService', () => {
  let empathyService: EmpathyService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
    };
    (db as any) = { db: mockDb };
    empathyService = new EmpathyService();
    
    // Reset mocks
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue('empathy-uuid-123');
  });

  describe('addEmpathy', () => {
    it('should add empathy successfully', async () => {
      // Mock that empathy doesn't exist yet
      mockDb.get.mockResolvedValue(null);
      
      // Mock successful insert
      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call({ lastID: 'empathy-uuid-123' }, null);
      });

      await empathyService.addEmpathy('report-1', 'user-123');

      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT id FROM empathies WHERE report_id = ? AND user_identifier = ?',
        ['report-1', 'user-123']
      );
      
      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO empathies (id, report_id, user_identifier) VALUES (?, ?, ?)',
        ['empathy-uuid-123', 'report-1', 'user-123'],
        expect.any(Function)
      );
    });

    it('should throw error when empathy already exists', async () => {
      // Mock that empathy already exists
      mockDb.get.mockResolvedValue({ id: 'existing-empathy' });

      await expect(empathyService.addEmpathy('report-1', 'user-123'))
        .rejects.toThrow('이미 공감하셨습니다');

      expect(mockDb.run).not.toHaveBeenCalled();
    });

    it('should throw error when database insert fails', async () => {
      mockDb.get.mockResolvedValue(null);
      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call(null, new Error('Database error'));
      });

      await expect(empathyService.addEmpathy('report-1', 'user-123'))
        .rejects.toThrow('Database error');
    });

    it('should handle database constraint violation (duplicate empathy)', async () => {
      mockDb.get.mockResolvedValue(null);
      
      // Simulate UNIQUE constraint violation
      const constraintError = new Error('UNIQUE constraint failed');
      (constraintError as any).code = 'SQLITE_CONSTRAINT_UNIQUE';
      
      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call(null, constraintError);
      });

      await expect(empathyService.addEmpathy('report-1', 'user-123'))
        .rejects.toThrow('이미 공감하셨습니다');
    });
  });

  describe('removeEmpathy', () => {
    it('should remove empathy successfully', async () => {
      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call({ changes: 1 }, null);
      });

      await empathyService.removeEmpathy('report-1', 'user-123');

      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM empathies WHERE report_id = ? AND user_identifier = ?',
        ['report-1', 'user-123'],
        expect.any(Function)
      );
    });

    it('should throw error when empathy not found', async () => {
      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call({ changes: 0 }, null);
      });

      await expect(empathyService.removeEmpathy('report-1', 'user-123'))
        .rejects.toThrow('공감을 찾을 수 없습니다');
    });

    it('should throw error when database delete fails', async () => {
      mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
        callback.call(null, new Error('Database error'));
      });

      await expect(empathyService.removeEmpathy('report-1', 'user-123'))
        .rejects.toThrow('Database error');
    });
  });

  describe('checkEmpathy', () => {
    it('should return empathy status and count when empathy exists', async () => {
      const mockEmpathy = { id: 'empathy-1' };
      const mockCount = { empathy_count: 5 };

      mockDb.get
        .mockResolvedValueOnce(mockEmpathy)
        .mockResolvedValueOnce(mockCount);

      const result = await empathyService.checkEmpathy('report-1', 'user-123');

      expect(mockDb.get).toHaveBeenNthCalledWith(1,
        'SELECT id FROM empathies WHERE report_id = ? AND user_identifier = ?',
        ['report-1', 'user-123']
      );
      
      expect(mockDb.get).toHaveBeenNthCalledWith(2,
        'SELECT empathy_count FROM reports WHERE id = ?',
        ['report-1']
      );

      expect(result).toEqual({
        hasEmpathy: true,
        empathyCount: 5
      });
    });

    it('should return empathy status and count when empathy does not exist', async () => {
      const mockCount = { empathy_count: 3 };

      mockDb.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockCount);

      const result = await empathyService.checkEmpathy('report-1', 'user-123');

      expect(result).toEqual({
        hasEmpathy: false,
        empathyCount: 3
      });
    });

    it('should return zero count when report not found', async () => {
      mockDb.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await empathyService.checkEmpathy('non-existent', 'user-123');

      expect(result).toEqual({
        hasEmpathy: false,
        empathyCount: 0
      });
    });

    it('should handle database errors gracefully', async () => {
      mockDb.get.mockRejectedValue(new Error('Database error'));

      await expect(empathyService.checkEmpathy('report-1', 'user-123'))
        .rejects.toThrow('Database error');
    });
  });

  describe('getEmpathyCount', () => {
    it('should return empathy count for existing report', async () => {
      const mockCount = { empathy_count: 7 };
      mockDb.get.mockResolvedValue(mockCount);

      const result = await empathyService.getEmpathyCount('report-1');

      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT empathy_count FROM reports WHERE id = ?',
        ['report-1']
      );
      expect(result).toBe(7);
    });

    it('should return 0 for non-existent report', async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await empathyService.getEmpathyCount('non-existent');

      expect(result).toBe(0);
    });

    it('should handle database errors', async () => {
      mockDb.get.mockRejectedValue(new Error('Database error'));

      await expect(empathyService.getEmpathyCount('report-1'))
        .rejects.toThrow('Database error');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty user identifier', async () => {
      await expect(empathyService.addEmpathy('report-1', ''))
        .rejects.toThrow();
    });

    it('should handle empty report ID', async () => {
      await expect(empathyService.addEmpathy('', 'user-123'))
        .rejects.toThrow();
    });

    it('should handle null values gracefully', async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await empathyService.checkEmpathy('report-1', 'user-123');
      
      expect(result.hasEmpathy).toBe(false);
      expect(result.empathyCount).toBe(0);
    });

    it('should handle concurrent empathy additions', async () => {
      // First call succeeds
      mockDb.get.mockResolvedValueOnce(null);
      mockDb.run.mockImplementationOnce((sql: string, params: any[], callback: Function) => {
        callback.call({ lastID: 'empathy-1' }, null);
      });

      // Second call should detect existing empathy
      mockDb.get.mockResolvedValueOnce({ id: 'empathy-1' });

      await empathyService.addEmpathy('report-1', 'user-123');
      
      await expect(empathyService.addEmpathy('report-1', 'user-123'))
        .rejects.toThrow('이미 공감하셨습니다');
    });
  });
});