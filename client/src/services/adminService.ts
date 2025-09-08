import { ApiResponse } from '../types';

export interface AdminAuthRequest {
  adminKey: string;
}

export interface AdminDeleteRequest {
  reportId: string;
  adminKey: string;
}

export interface ExportDataResponse {
  reports: ReportExportData[];
  totalCount: number;
  exportedAt: string;
}

export interface ReportExportData {
  id: string;
  campus: string;
  building: string;
  location: string;
  problemTypes: string;
  customProblem?: string;
  description: string;
  empathyCount: number;
  createdAt: string;
}

export interface AdminStats {
  totalReports: number;
  recentReports: number;
  campusStats: { campus: string; count: number }[];
  topEmpathyReports: any[];
}

class AdminService {
  private readonly API_BASE = '/api/admin';

  /**
   * 관리자 키 검증
   */
  async verifyAdminKey(adminKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminKey }),
      });

      const data: ApiResponse<{ valid: boolean }> = await response.json();
      return data.success && data.data?.valid === true;
    } catch (error) {
      console.error('관리자 키 검증 실패:', error);
      return false;
    }
  }

  /**
   * 관리자 강제 삭제
   */
  async forceDeleteReport(reportId: string, adminKey: string): Promise<void> {
    const response = await fetch(`${this.API_BASE}/reports/${reportId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adminKey }),
    });

    const data: ApiResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || '삭제 실패');
    }
  }

  /**
   * 전체 데이터 엑셀 복사용으로 내보내기
   */
  async exportAllReports(adminKey: string): Promise<ExportDataResponse> {
    const response = await fetch(`${this.API_BASE}/export`, {
      method: 'GET',
      headers: {
        'x-admin-key': adminKey,
      },
    });

    const data: ApiResponse<ExportDataResponse> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || '데이터 내보내기 실패');
    }

    return data.data!;
  }

  /**
   * 관리자 통계 조회
   */
  async getStats(adminKey: string): Promise<AdminStats> {
    const response = await fetch(`${this.API_BASE}/stats`, {
      method: 'GET',
      headers: {
        'x-admin-key': adminKey,
      },
    });

    const data: ApiResponse<AdminStats> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || '통계 조회 실패');
    }

    return data.data!;
  }

  /**
   * 엑셀 복사용 텍스트 생성
   */
  generateExcelText(reports: ReportExportData[]): string {
    const headers = [
      'ID',
      '캠퍼스',
      '건물',
      '위치',
      '문제유형',
      '기타문제',
      '설명',
      '공감수',
      '작성일시'
    ];

    const rows = reports.map(report => [
      report.id,
      report.campus,
      report.building,
      report.location,
      report.problemTypes,
      report.customProblem || '',
      report.description.replace(/\n/g, ' '), // 개행문자 제거
      report.empathyCount.toString(),
      report.createdAt
    ]);

    const allRows = [headers, ...rows];
    return allRows.map(row => row.join('\t')).join('\n');
  }
}

export default new AdminService();
