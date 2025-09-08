import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportService from '../reportService';
import apiClient from '../api';
import { CreateReportRequest, Report } from '../../types';

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

describe('ReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReport', () => {
    it('should create a report successfully', async () => {
      const mockReportData: CreateReportRequest = {
        campus: '김해캠퍼스',
        building: '공학관',
        location: '3층 컴퓨터실',
        problemTypes: ['WiFi 신호 약함'],
        description: '와이파이 신호가 매우 약합니다.',
        password: '1234'
      };

      const mockResponse: Report = {
        id: '1',
        campus: '김해캠퍼스',
        building: '공학관',
        location: '3층 컴퓨터실',
        problemTypes: ['WiFi 신호 약함'],
        description: '와이파이 신호가 매우 약합니다.',
        empathyCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse
        }
      });

      const result = await ReportService.createReport(mockReportData);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/reports', mockReportData);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when API returns unsuccessful response', async () => {
      const mockReportData: CreateReportRequest = {
        campus: '김해캠퍼스',
        building: '공학관',
        location: '3층 컴퓨터실',
        problemTypes: ['WiFi 신호 약함'],
        description: '와이파이 신호가 매우 약합니다.',
        password: '1234'
      };

      mockedApiClient.post.mockResolvedValue({
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 데이터가 올바르지 않습니다.'
          }
        }
      });

      await expect(ReportService.createReport(mockReportData)).rejects.toThrow('제보 생성에 실패했습니다.');
    });
  });

  describe('getReports', () => {
    it('should fetch reports with default parameters', async () => {
      const mockReports: Report[] = [
        {
          id: '1',
          campus: '김해캠퍼스',
          building: '공학관',
          location: '3층 컴퓨터실',
          problemTypes: ['WiFi 신호 약함'],
          description: '와이파이 신호가 매우 약합니다.',
          empathyCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports
        }
      });

      const result = await ReportService.getReports();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/reports?');
      expect(result).toEqual(mockReports);
    });

    it('should fetch reports with filtering parameters', async () => {
      const mockReports: Report[] = [];

      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports
        }
      });

      await ReportService.getReports({
        sort: 'empathy',
        campus: '김해캠퍼스',
        building: '공학관'
      });

      // URL encoding을 고려하여 호출 확인
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/reports?sort=empathy&campus=')
      );
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('&building=')
      );
    });
  });
});