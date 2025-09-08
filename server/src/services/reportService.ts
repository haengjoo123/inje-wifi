import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { supabase } from '../database/supabase';
import {
  CreateReportRequest,
  UpdateReportRequest,
  ReportResponse,
  ReportListResponse,
  ReportListQuery,
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

    const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    try {
      const { data: insertData, error } = await supabase
        .from('reports')
        .insert({
          campus: data.campus,
          building: data.building,
          location: data.location,
          problem_types: data.problemTypes,
          custom_problem: data.customProblem || null,
          description: data.description,
          password_hash: passwordHash,
          empathy_count: 0
        })
        .select()
        .single();

      if (error) {
        throw createServerError('제보 저장 중 오류가 발생했습니다', error);
      }

      return this.mapSupabaseRowToResponse(insertData);
    } catch (error) {
      if (error && typeof error === 'object' && ('code' in error || error instanceof Error)) {
        throw error;
      }
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

    try {
      // Build query
      let supabaseQuery = supabase
        .from('reports')
        .select('id, campus, building, location, problem_types, custom_problem, description, empathy_count, created_at, updated_at', { count: 'exact' });

      // Apply filters
      if (campus && campus !== 'all') {
        supabaseQuery = supabaseQuery.eq('campus', campus);
      }

      if (building) {
        supabaseQuery = supabaseQuery.ilike('building', `%${building}%`);
      }

      // Apply sorting
      if (sort === 'empathy') {
        supabaseQuery = supabaseQuery.order('empathy_count', { ascending: false }).order('created_at', { ascending: false });
      } else {
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
      }

      // Apply pagination
      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      const { data: reportRows, error, count } = await supabaseQuery;

      if (error) {
        throw createServerError('제보 목록 조회 중 오류가 발생했습니다', error);
      }

      const total = count || 0;
      const reports = (reportRows || []).map(row => this.mapSupabaseRowToResponse(row));
      const totalPages = Math.ceil(total / limit);

      return {
        reports,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      if (error && typeof error === 'object' && ('code' in error || error instanceof Error)) {
        throw error;
      }
      throw createServerError('제보 목록 조회 중 오류가 발생했습니다', error);
    }
  }

  async getReportById(id: string): Promise<ReportResponse | null> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, campus, building, location, problem_types, custom_problem, description, empathy_count, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw createServerError('제보 조회 중 오류가 발생했습니다', error);
      }

      return data ? this.mapSupabaseRowToResponse(data) : null;
    } catch (error) {
      if (error && typeof error === 'object' && ('code' in error || error instanceof Error)) {
        throw error;
      }
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

    const updateData: any = {};
    let hasUpdates = false;

    if (data.campus !== undefined) {
      updateData.campus = data.campus;
      hasUpdates = true;
    }
    if (data.building !== undefined) {
      updateData.building = data.building;
      hasUpdates = true;
    }
    if (data.location !== undefined) {
      updateData.location = data.location;
      hasUpdates = true;
    }
    if (data.problemTypes !== undefined) {
      updateData.problem_types = data.problemTypes;
      hasUpdates = true;
    }
    if (data.customProblem !== undefined) {
      updateData.custom_problem = data.customProblem || null;
      hasUpdates = true;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
      hasUpdates = true;
    }

    if (!hasUpdates) {
      // No fields to update, just return current report
      const current = await this.getReportById(id);
      if (!current) {
        throw createNotFoundError('제보를 찾을 수 없습니다');
      }
      return current;
    }

    try {
      const { data: updatedData, error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw createNotFoundError('제보를 찾을 수 없습니다');
        }
        throw createServerError('제보 수정 중 오류가 발생했습니다', error);
      }

      return this.mapSupabaseRowToResponse(updatedData);
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
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);
      
      if (error) {
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

  async verifyPassword(id: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('password_hash')
        .eq('id', id)
        .single();

      if (error || !data) {
        return false;
      }

      return await bcrypt.compare(password, data.password_hash);
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

export const reportService = new ReportService();