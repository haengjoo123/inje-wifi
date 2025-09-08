import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmpathyService from '../empathyService';
import apiClient from '../api';
import { EmpathyCheckResponse } from '../../types';

// Mock the API client
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

const mockedApiClient = apiClient as any;

describe('EmpathyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addEmpathy', () => {
    it('should add empathy successfully', async () => {
      const reportId = '1';
      const mockResponse = { empathyCount: 5 };

      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse
        }
      });

      const result = await EmpathyService.addEmpathy(reportId);

      expect(mockedApiClient.post).toHaveBeenCalledWith(`/reports/${reportId}/empathy`);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when API returns unsuccessful response', async () => {
      const reportId = '1';

      mockedApiClient.post.mockResolvedValue({
        data: {
          success: false,
          error: {
            code: 'DUPLICATE_EMPATHY',
            message: '이미 공감하셨습니다.'
          }
        }
      });

      await expect(EmpathyService.addEmpathy(reportId)).rejects.toThrow('공감 추가에 실패했습니다.');
    });
  });

  describe('checkUserEmpathy', () => {
    it('should check user empathy status successfully', async () => {
      const reportId = '1';
      const mockResponse: EmpathyCheckResponse = {
        hasEmpathy: true,
        empathyCount: 5
      };

      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse
        }
      });

      const result = await EmpathyService.checkUserEmpathy(reportId);

      expect(mockedApiClient.get).toHaveBeenCalledWith(`/reports/${reportId}/empathy/check`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getEmpathyCount', () => {
    it('should get empathy count successfully', async () => {
      const reportId = '1';
      const mockResponse = { count: 10 };

      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse
        }
      });

      const result = await EmpathyService.getEmpathyCount(reportId);

      expect(mockedApiClient.get).toHaveBeenCalledWith(`/reports/${reportId}/empathy/count`);
      expect(result).toBe(10);
    });
  });
});