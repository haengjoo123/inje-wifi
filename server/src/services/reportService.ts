import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { db } from '../database/connection';
import {
  CreateReportRequest,
  UpdateReportRequest,
  ReportResponse,
  ReportListResponse,
  ReportListQuery,
  ReportRow,
  ValidationError,
  ApiErrorCode
} from '../types';
import {
  createValidationError,
  createUnauthorizedError,
  createNotFoundError,
  createServerError
} from '../middleware';

export class ReportService {
  private readonly SALT_ROUNDS = 10;

  async createReport(data: CreateReportRequest): Promise<ReportResponse> {
    // Note: Validation is now handled by middleware, but keeping this as backup
    const validationErrors = this.validateCreateReportData(data);
    if (validationErrors.length > 0) {
      throw createValidationError('입력 데이터가 올바르지 않습니다', validationErrors);
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);
    const now = new Date().toISOString();

    try {
      await db.run(
        `INSERT INTO reports (
          id, campus, building, location, problem_types, custom_problem, 
          description, password_hash, empathy_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [
          id,
          data.campus,
          data.building,
          data.location,
          JSON.stringify(data.problemTypes),
          data.customProblem || null,
          data.description,
          passwordHash,
          now,
          now
        ]
      );

      return this.mapRowToResponse({
        id,
        campus: data.campus,
        building: data.building,
        location: data.location,
        problem_types: JSON.stringify(data.problemTypes),
        custom_problem: data.customProblem || null,
        description: data.description,
        password_hash: passwordHash,
        empathy_count: 0,
        created_at: now,
        updated_at: now
      });
    } catch (error) {
      throw createServerError('제보 저장 중 오류가 발생했습니다', error);
    }
  }

  async getReports(query: ReportListQuery): Promise<ReportListResponse> {
    const {
      sort = 'latest',
      campus,
      building,
      page = 1,
      limit = 20
    } = query;

    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (campus && campus !== 'all') {
      whereConditions.push('campus = ?');
      params.push(campus);
    }

    if (building) {
      whereConditions.push('building LIKE ?');
      params.push(`%${building}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Build ORDER BY clause
    const orderBy = sort === 'empathy' 
      ? 'ORDER BY empathy_count DESC, created_at DESC'
      : 'ORDER BY created_at DESC';

    try {
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM reports ${whereClause}`;
      const countResult = await db.get<{ total: number }>(countQuery, params);
      const total = countResult?.total || 0;

      // Get reports
      const reportsQuery = `
        SELECT id, campus, building, location, problem_types, custom_problem,
               description, empathy_count, created_at, updated_at
        FROM reports 
        ${whereClause}
        ${orderBy}
        LIMIT ? OFFSET ?
      `;
      
      const reportRows = await db.all<ReportRow>(
        reportsQuery, 
        [...params, limit, offset]
      );

      const reports = reportRows.map(row => this.mapRowToResponse(row));
      const totalPages = Math.ceil(total / limit);

      return {
        reports,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw createServerError('제보 목록 조회 중 오류가 발생했습니다', error);
    }
  }

  async getReportById(id: string): Promise<ReportResponse | null> {
    try {
      const row = await db.get<ReportRow>(
        `SELECT id, campus, building, location, problem_types, custom_problem,
                description, empathy_count, created_at, updated_at
         FROM reports WHERE id = ?`,
        [id]
      );

      return row ? this.mapRowToResponse(row) : null;
    } catch (error) {
      throw createServerError('제보 조회 중 오류가 발생했습니다', error);
    }
  }

  async updateReport(id: string, data: UpdateReportRequest): Promise<ReportResponse> {
    // Verify password first
    const isValidPassword = await this.verifyPassword(id, data.password);
    if (!isValidPassword) {
      throw createUnauthorizedError('비밀번호가 일치하지 않습니다');
    }

    // Note: Validation is now handled by middleware, but keeping this as backup
    const validationErrors = this.validateUpdateReportData(data);
    if (validationErrors.length > 0) {
      throw createValidationError('입력 데이터가 올바르지 않습니다', validationErrors);
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    if (data.campus !== undefined) {
      updateFields.push('campus = ?');
      params.push(data.campus);
    }
    if (data.building !== undefined) {
      updateFields.push('building = ?');
      params.push(data.building);
    }
    if (data.location !== undefined) {
      updateFields.push('location = ?');
      params.push(data.location);
    }
    if (data.problemTypes !== undefined) {
      updateFields.push('problem_types = ?');
      params.push(JSON.stringify(data.problemTypes));
    }
    if (data.customProblem !== undefined) {
      updateFields.push('custom_problem = ?');
      params.push(data.customProblem || null);
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      params.push(data.description);
    }

    if (updateFields.length === 0) {
      // No fields to update, just return current report
      const current = await this.getReportById(id);
      if (!current) {
        throw createNotFoundError('제보를 찾을 수 없습니다');
      }
      return current;
    }

    updateFields.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    try {
      await db.run(
        `UPDATE reports SET ${updateFields.join(', ')} WHERE id = ?`,
        params
      );

      const updated = await this.getReportById(id);
      if (!updated) {
        throw createNotFoundError('제보를 찾을 수 없습니다');
      }

      return updated;
    } catch (error) {
      // Re-throw known errors
      if (error && typeof error === 'object' && ('code' in error || error instanceof Error)) {
        throw error;
      }
      throw createServerError('제보 수정 중 오류가 발생했습니다', error);
    }
  }

  async deleteReport(id: string, password: string): Promise<void> {
    // Verify password first
    const isValidPassword = await this.verifyPassword(id, password);
    if (!isValidPassword) {
      throw createUnauthorizedError('비밀번호가 일치하지 않습니다');
    }

    try {
      const result = await db.run('DELETE FROM reports WHERE id = ?', [id]);
      
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

  async verifyPassword(id: string, password: string): Promise<boolean> {
    try {
      const row = await db.get<{ password_hash: string }>(
        'SELECT password_hash FROM reports WHERE id = ?',
        [id]
      );

      if (!row) {
        return false;
      }

      return await bcrypt.compare(password, row.password_hash);
    } catch (error) {
      return false;
    }
  }

  private validateCreateReportData(data: CreateReportRequest): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.campus || !['김해캠퍼스', '부산캠퍼스'].includes(data.campus)) {
      errors.push({
        field: 'campus',
        message: '캠퍼스를 선택해주세요'
      });
    }

    if (!data.building || data.building.trim().length === 0) {
      errors.push({
        field: 'building',
        message: '건물명을 입력해주세요'
      });
    }

    if (!data.location || data.location.trim().length === 0) {
      errors.push({
        field: 'location',
        message: '상세 위치를 입력해주세요'
      });
    }

    if (!data.problemTypes || data.problemTypes.length === 0) {
      errors.push({
        field: 'problemTypes',
        message: '문제 유형을 선택해주세요'
      });
    }

    if (!data.description || data.description.trim().length < 10) {
      errors.push({
        field: 'description',
        message: '문제 설명을 20자 이상 입력해주세요'
      });
    }

    if (!data.password || !/^\d{4}$/.test(data.password)) {
      errors.push({
        field: 'password',
        message: '4자리 숫자 비밀번호를 입력해주세요'
      });
    }

    return errors;
  }

  private validateUpdateReportData(data: UpdateReportRequest): ValidationError[] {
    const errors: ValidationError[] = [];

    if (data.campus !== undefined && !['김해캠퍼스', '부산캠퍼스'].includes(data.campus)) {
      errors.push({
        field: 'campus',
        message: '올바른 캠퍼스를 선택해주세요'
      });
    }

    if (data.building !== undefined && data.building.trim().length === 0) {
      errors.push({
        field: 'building',
        message: '건물명을 입력해주세요'
      });
    }

    if (data.location !== undefined && data.location.trim().length === 0) {
      errors.push({
        field: 'location',
        message: '상세 위치를 입력해주세요'
      });
    }

    if (data.problemTypes !== undefined && data.problemTypes.length === 0) {
      errors.push({
        field: 'problemTypes',
        message: '문제 유형을 선택해주세요'
      });
    }

    if (data.description !== undefined && data.description.trim().length < 10) {
      errors.push({
        field: 'description',
        message: '문제 설명을 20자 이상 입력해주세요'
      });
    }

    if (!data.password || !/^\d{4}$/.test(data.password)) {
      errors.push({
        field: 'password',
        message: '4자리 숫자 비밀번호를 입력해주세요'
      });
    }

    return errors;
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

export const reportService = new ReportService();