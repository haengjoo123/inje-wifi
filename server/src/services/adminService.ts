import { supabase } from '../database/supabase';
import {
  ReportResponse,
  ExportDataResponse,
  ReportExportData,
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
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw createNotFoundError('제보를 찾을 수 없습니다');
        }
        throw createServerError('제보 삭제 중 오류가 발생했습니다', error);
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
      const { data: reportRows, error } = await supabase
        .from('reports')
        .select('id, campus, building, location, problem_types, custom_problem, description, empathy_count, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw createServerError('데이터 내보내기 중 오류가 발생했습니다', error);
      }

      const reports: ReportExportData[] = (reportRows || []).map(row => ({
        id: row.id,
        campus: row.campus,
        building: row.building,
        location: row.location,
        problemTypes: Array.isArray(row.problem_types) ? row.problem_types.join(', ') : JSON.parse(row.problem_types || '[]').join(', '),
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
      if (error && typeof error === 'object' && ('code' in error || error instanceof Error)) {
        throw error;
      }
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
      const { count: totalCount, error: totalError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        throw createServerError('통계 조회 중 오류가 발생했습니다', totalError);
      }
      
      // 캠퍼스별 제보 수 (Supabase에서는 직접 GROUP BY 지원하지 않으므로 모든 데이터 가져와서 처리)
      const { data: allReports, error: reportsError } = await supabase
        .from('reports')
        .select('campus');

      if (reportsError) {
        throw createServerError('통계 조회 중 오류가 발생했습니다', reportsError);
      }

      const campusStats = (allReports || []).reduce((acc: { campus: string; count: number }[], report) => {
        const existing = acc.find(item => item.campus === report.campus);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ campus: report.campus, count: 1 });
        }
        return acc;
      }, []).sort((a, b) => b.count - a.count);

      // 최근 7일 제보 수
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentCount, error: recentError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      if (recentError) {
        throw createServerError('통계 조회 중 오류가 발생했습니다', recentError);
      }

      // 가장 많은 공감을 받은 제보 TOP 5
      const { data: topEmpathy, error: topError } = await supabase
        .from('reports')
        .select('id, campus, building, location, problem_types, custom_problem, description, empathy_count, created_at, updated_at')
        .order('empathy_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (topError) {
        throw createServerError('통계 조회 중 오류가 발생했습니다', topError);
      }

      return {
        totalReports: totalCount || 0,
        recentReports: recentCount || 0,
        campusStats,
        topEmpathyReports: (topEmpathy || []).map(row => this.mapSupabaseRowToResponse(row))
      };
    } catch (error) {
      if (error && typeof error === 'object' && ('code' in error || error instanceof Error)) {
        throw error;
      }
      throw createServerError('통계 조회 중 오류가 발생했습니다', error);
    }
  }

  private mapSupabaseRowToResponse(row: any): ReportResponse {
    return {
      id: row.id,
      campus: row.campus,
      building: row.building,
      location: row.location,
      problemTypes: Array.isArray(row.problem_types) ? row.problem_types : JSON.parse(row.problem_types || '[]'),
      customProblem: row.custom_problem || undefined,
      description: row.description,
      empathyCount: row.empathy_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export const adminService = new AdminService();
