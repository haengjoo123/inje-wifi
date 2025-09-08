import apiClient from './api';
import { EmpathyCheckResponse, ApiResponse } from '../types';

export class EmpathyService {
  /**
   * 공감 추가
   */
  static async addEmpathy(reportId: string): Promise<{ empathyCount: number }> {
    const response = await apiClient.post<ApiResponse<{ empathyCount: number }>>(
      `/reports/${reportId}/empathy`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error('공감 추가에 실패했습니다.');
    }
    
    return response.data.data;
  }

  /**
   * 공감 수 조회
   */
  static async getEmpathyCount(reportId: string): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      `/reports/${reportId}/empathy/count`
    );
    
    if (!response.data.success || response.data.data?.count === undefined) {
      throw new Error('공감 수 조회에 실패했습니다.');
    }
    
    return response.data.data.count;
  }

  /**
   * 사용자 공감 여부 확인
   */
  static async checkUserEmpathy(reportId: string): Promise<EmpathyCheckResponse> {
    const response = await apiClient.get<ApiResponse<EmpathyCheckResponse>>(
      `/reports/${reportId}/empathy/check`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error('공감 여부 확인에 실패했습니다.');
    }
    
    return response.data.data;
  }

  /**
   * 공감 제거 (필요한 경우)
   */
  static async removeEmpathy(reportId: string): Promise<{ empathyCount: number }> {
    const response = await apiClient.delete<ApiResponse<{ empathyCount: number }>>(
      `/reports/${reportId}/empathy`
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error('공감 제거에 실패했습니다.');
    }
    
    return response.data.data;
  }
}

export default EmpathyService;