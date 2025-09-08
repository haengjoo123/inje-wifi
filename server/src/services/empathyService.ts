import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/connection';
import {
  EmpathyCheckResponse,
  EmpathyRow,
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

    const id = uuidv4();
    const now = new Date().toISOString();

    try {
      console.log('공감 추가 시작 - reportId:', reportId, 'userIdentifier:', userIdentifier);
      
      const insertResult = await db.run(
        'INSERT INTO empathies (id, report_id, user_identifier, created_at) VALUES (?, ?, ?, ?)',
        [id, reportId, userIdentifier, now]
      );
      
      console.log('공감 INSERT 결과:', insertResult);

      // 트리거가 작동하지 않을 경우를 대비해 수동으로 empathy_count 업데이트
      await db.run(
        'UPDATE reports SET empathy_count = (SELECT COUNT(*) FROM empathies WHERE report_id = ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [reportId, reportId]
      );

      // Get updated empathy count
      const empathyCount = await this.getEmpathyCount(reportId);
      console.log('업데이트된 공감 수:', empathyCount);
      
      return { empathyCount };
    } catch (error) {
      // Check if it's a unique constraint violation (duplicate empathy)
      if (error instanceof Error && error.message && error.message.includes('UNIQUE constraint failed')) {
        throw createDuplicateEmpathyError('이미 공감하셨습니다');
      }
      
      throw createServerError('공감 추가 중 오류가 발생했습니다', error);
    }
  }

  async removeEmpathy(reportId: string, userIdentifier: string): Promise<{ empathyCount: number }> {
    try {
      const result = await db.run(
        'DELETE FROM empathies WHERE report_id = ? AND user_identifier = ?',
        [reportId, userIdentifier]
      );

      if (result.changes === 0) {
        throw createNotFoundError('공감을 찾을 수 없습니다');
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
      const result = await db.get<{ empathy_count: number }>(
        'SELECT empathy_count FROM reports WHERE id = ?',
        [reportId]
      );

      console.log('공감 수 조회 결과 - reportId:', reportId, 'result:', result);
      
      // 트리거가 작동하지 않을 경우를 대비해 실제 empathies 테이블에서도 카운트 확인
      const actualCount = await db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM empathies WHERE report_id = ?',
        [reportId]
      );
      
      console.log('실제 empathies 테이블 카운트:', actualCount);

      return result?.empathy_count || 0;
    } catch (error) {
      throw createServerError('공감 수 조회 중 오류가 발생했습니다', error);
    }
  }

  private async findEmpathy(reportId: string, userIdentifier: string): Promise<EmpathyRow | null> {
    try {
      const empathy = await db.get<EmpathyRow>(
        'SELECT id, report_id, user_identifier, created_at FROM empathies WHERE report_id = ? AND user_identifier = ?',
        [reportId, userIdentifier]
      );

      return empathy || null;
    } catch (error) {
      return null;
    }
  }

  private async checkReportExists(reportId: string): Promise<boolean> {
    try {
      const result = await db.get<{ id: string }>(
        'SELECT id FROM reports WHERE id = ?',
        [reportId]
      );

      return !!result;
    } catch (error) {
      return false;
    }
  }
}

export const empathyService = new EmpathyService();