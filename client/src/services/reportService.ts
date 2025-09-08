import apiClient from './api';
import { 
  Report, 
  CreateReportRequest, 
  UpdateReportRequest, 
  DeleteReportRequest,
  ReportListParams,
  ApiResponse 
} from '../types';

export class ReportService {
  /**
   * 새 제보 생성
   */
  static async createReport(reportData: CreateReportRequest): Promise<Report> {
    const response = await apiClient.post<ApiResponse<Report>>('/reports', reportData);
    
    if (!response.data.success || !response.data.data) {
      throw new Error('제보 생성에 실패했습니다.');
    }
    
    return response.data.data;
  }

  /**
   * 제보 목록 조회 (정렬, 필터링 지원)
   */
  static async getReports(params: ReportListParams = {}): Promise<Report[]> {
    const queryParams = new URLSearchParams();
    
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.campus && params.campus !== 'all') queryParams.append('campus', params.campus);
    if (params.building) queryParams.append('building', params.building);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<ApiResponse<{ reports: Report[], total: number, page: number, limit: number, totalPages: number }>>(`/reports?${queryParams.toString()}`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error('제보 목록 조회에 실패했습니다.');
    }
    
    // 서버에서 반환하는 객체에서 reports 배열만 추출
    return response.data.data.reports;
  }

  /**
   * 특정 제보 상세 조회
   */
  static async getReportById(id: string): Promise<Report> {
    const response = await apiClient.get<ApiResponse<Report>>(`/reports/${id}`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error('제보 조회에 실패했습니다.');
    }
    
    return response.data.data;
  }

  /**
   * 제보 수정 (비밀번호 인증 필요)
   */
  static async updateReport(id: string, updateData: UpdateReportRequest): Promise<Report> {
    const response = await apiClient.put<ApiResponse<Report>>(`/reports/${id}`, updateData);
    
    if (!response.data.success || !response.data.data) {
      throw new Error('제보 수정에 실패했습니다.');
    }
    
    return response.data.data;
  }

  /**
   * 제보 삭제 (비밀번호 인증 필요)
   */
  static async deleteReport(id: string, deleteData: DeleteReportRequest): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/reports/${id}`, {
      data: deleteData
    });
    
    if (!response.data.success) {
      throw new Error('제보 삭제에 실패했습니다.');
    }
  }

  /**
   * 비밀번호 검증 (수정/삭제 전 확인용)
   */
  static async verifyPassword(id: string, password: string): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<{ valid: boolean }>>(`/reports/${id}/verify-password`, {
        password
      });
      
      return response.data.success && response.data.data?.valid === true;
    } catch (error) {
      return false;
    }
  }
}

export default ReportService;