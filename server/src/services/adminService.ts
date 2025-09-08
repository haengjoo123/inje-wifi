import { db } from '../database/connection';
import {
  ReportResponse,
  ExportDataResponse,
  ReportExportData,
  ReportRow,
  ValidationError,
  ApiErrorCode
} from '../types';
import {
  createUnauthorizedError,
  createServerError,
  createNotFoundError
} from '../middleware';

export class AdminService {
  private readonly ADMIN_KEY = process.env.ADMIN_KEY || 'admin123!@#';

  /**
   * 관리자 키 검증
   */
  verifyAdminKey(providedKey: string): boolean {
    return providedKey === this.ADMIN_KEY;
  }

  /**
   * 관리자 강제 삭제 (비밀번호 불필요)
   */
  async forceDeleteReport(reportId: string, adminKey: string): Promise<void> {
    if (!this.verifyAdminKey(adminKey)) {
      throw createUnauthorizedError('관리자 권한이 없습니다');
    }

    try {
      const result = await db.run('DELETE FROM reports WHERE id = ?', [reportId]);
      
      if (result.changes === 0) {
        throw createNotFoundError('제보를 찾을 수 없습니다');
      }
    } catch (error) {
      // Re-throw known errors
      if (error && typeof error === 'object' && ('code' in error || error instanceof Error)) {
        throw error;
      }
      throw createServerError('제보 삭제 중 오류가 발생했습니다', error);
    }
  }

  /**
   * 전체 제보 데이터를 엑셀 복사용 형태로 내보내기
   */
  async exportAllReports(adminKey: string): Promise<ExportDataResponse> {
    if (!this.verifyAdminKey(adminKey)) {
      throw createUnauthorizedError('관리자 권한이 없습니다');
    }

    try {
      // 모든 제보 데이터 조회 (최신순)
      const reportRows = await db.all<ReportRow>(
        `SELECT id, campus, building, location, problem_types, custom_problem,
                description, empathy_count, created_at, updated_at
         FROM reports 
         ORDER BY created_at DESC`
      );

      const reports: ReportExportData[] = reportRows.map(row => ({
        id: row.id,
        campus: row.campus,
        building: row.building,
        location: row.location,
        problemTypes: JSON.parse(row.problem_types).join(', '),
        customProblem: row.custom_problem || undefined,
        description: row.description,
        empathyCount: row.empathy_count,
        createdAt: new Date(row.created_at).toLocaleString('ko-KR')
      }));

      return {
        reports,
        totalCount: reports.length,
        exportedAt: new Date().toLocaleString('ko-KR')
      };
    } catch (error) {
      throw createServerError('데이터 내보내기 중 오류가 발생했습니다', error);
    }
  }

  /**
   * 관리자용 제보 통계 정보
   */
  async getReportStats(adminKey: string) {
    if (!this.verifyAdminKey(adminKey)) {
      throw createUnauthorizedError('관리자 권한이 없습니다');
    }

    try {
      // 전체 제보 수
      const totalResult = await db.get<{ total: number }>(
        'SELECT COUNT(*) as total FROM reports'
      );
      
      // 캠퍼스별 제보 수
      const campusStats = await db.all<{ campus: string; count: number }>(
        'SELECT campus, COUNT(*) as count FROM reports GROUP BY campus ORDER BY count DESC'
      );

      // 최근 7일 제보 수
      const recentResult = await db.get<{ recent: number }>(
        `SELECT COUNT(*) as recent FROM reports 
         WHERE created_at >= datetime('now', '-7 days')`
      );

      // 가장 많은 공감을 받은 제보 TOP 5
      const topEmpathy = await db.all<ReportRow>(
        `SELECT id, campus, building, location, problem_types, custom_problem,
                description, empathy_count, created_at, updated_at
         FROM reports 
         ORDER BY empathy_count DESC, created_at DESC 
         LIMIT 5`
      );

      return {
        totalReports: totalResult?.total || 0,
        recentReports: recentResult?.recent || 0,
        campusStats,
        topEmpathyReports: topEmpathy.map(row => this.mapRowToResponse(row))
      };
    } catch (error) {
      throw createServerError('통계 조회 중 오류가 발생했습니다', error);
    }
  }

  private mapRowToResponse(row: ReportRow): ReportResponse {
    return {
      id: row.id,
      campus: row.campus,
      building: row.building,
      location: row.location,
      problemTypes: JSON.parse(row.problem_types),
      customProblem: row.custom_problem || undefined,
      description: row.description,
      empathyCount: row.empathy_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export const adminService = new AdminService();
