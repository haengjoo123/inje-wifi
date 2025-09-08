import { supabase } from '../database/supabase';
import {
  EmpathyCheckResponse,
  ApiErrorCode
} from '../types';
import {
  createNotFoundError,
  createDuplicateEmpathyError,
  createServerError
} from '../middleware';

export class EmpathyService {
  async addEmpathy(reportId: string, userIdentifier: string): Promise<{ empathyCount: number }> {
    // Check if report exists
    const reportExists = await this.checkReportExists(reportId);
    if (!reportExists) {
      throw createNotFoundError('제보를 찾을 수 없습니다');
    }

    // Check if user already empathized
    const existingEmpathy = await this.findEmpathy(reportId, userIdentifier);
    if (existingEmpathy) {
      throw createDuplicateEmpathyError('이미 공감하셨습니다');
    }

    try {
      console.log('공감 추가 시작 - reportId:', reportId, 'userIdentifier:', userIdentifier);
      
      const { error } = await supabase
        .from('empathies')
        .insert({
          report_id: reportId,
          user_identifier: userIdentifier
        });
      
      if (error) {
        // Check if it's a unique constraint violation (duplicate empathy)
        if (error.code === '23505') {
          throw createDuplicateEmpathyError('이미 공감하셨습니다');
        }
        throw createServerError('공감 추가 중 오류가 발생했습니다', error);
      }

      console.log('공감 INSERT 완료');

      // Get updated empathy count (트리거에 의해 자동 업데이트됨)
      const empathyCount = await this.getEmpathyCount(reportId);
      console.log('업데이트된 공감 수:', empathyCount);
      
      return { empathyCount };
    } catch (error) {
      if (error && typeof error === 'object' && ('code' in error || error instanceof Error)) {
        throw error;
      }
      throw createServerError('공감 추가 중 오류가 발생했습니다', error);
    }
  }

  async removeEmpathy(reportId: string, userIdentifier: string): Promise<{ empathyCount: number }> {
    try {
      const { error } = await supabase
        .from('empathies')
        .delete()
        .eq('report_id', reportId)
        .eq('user_identifier', userIdentifier);

      if (error) {
        throw createServerError('공감 제거 중 오류가 발생했습니다', error);
      }

      // Get updated empathy count
      const empathyCount = await this.getEmpathyCount(reportId);
      return { empathyCount };
    } catch (error) {
      // Re-throw known errors
      if (error && typeof error === 'object' && ('code' in error || error instanceof Error)) {
        throw error;
      }
      throw createServerError('공감 제거 중 오류가 발생했습니다', error);
    }
  }

  async checkEmpathy(reportId: string, userIdentifier: string): Promise<EmpathyCheckResponse> {
    try {
      // Check if user has empathized
      const empathy = await this.findEmpathy(reportId, userIdentifier);
      const hasEmpathy = !!empathy;

      // Get total empathy count
      const empathyCount = await this.getEmpathyCount(reportId);

      return {
        hasEmpathy,
        empathyCount
      };
    } catch (error) {
      throw createServerError('공감 상태 확인 중 오류가 발생했습니다', error);
    }
  }

  async getEmpathyCount(reportId: string): Promise<number> {
    try {
      // Get count from reports table (maintained by triggers)
      const { data, error } = await supabase
        .from('reports')
        .select('empathy_count')
        .eq('id', reportId)
        .single();

      if (error) {
        console.log('공감 수 조회 오류 - reportId:', reportId, 'error:', error);
        return 0;
      }

      console.log('공감 수 조회 결과 - reportId:', reportId, 'result:', data);
      return data?.empathy_count || 0;
    } catch (error) {
      throw createServerError('공감 수 조회 중 오류가 발생했습니다', error);
    }
  }

  private async findEmpathy(reportId: string, userIdentifier: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('empathies')
        .select('id, report_id, user_identifier, created_at')
        .eq('report_id', reportId)
        .eq('user_identifier', userIdentifier)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('공감 조회 오류:', error);
      }

      return data || null;
    } catch (error) {
      return null;
    }
  }

  private async checkReportExists(reportId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id')
        .eq('id', reportId)
        .single();

      return !!data && !error;
    } catch (error) {
      return false;
    }
  }
}

export const empathyService = new EmpathyService();