import { Request } from 'express';

// Database Models
export interface Report {
  id: string;
  campus: string;
  building: string;
  location: string;
  problemTypes: string[];
  customProblem?: string;
  description: string;
  passwordHash: string;
  empathyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Empathy {
  id: string;
  reportId: string;
  userIdentifier: string;
  createdAt: Date;
}

// API Request Types
export interface CreateReportRequest {
  campus: string;
  building: string;
  location: string;
  problemTypes: string[];
  customProblem?: string;
  description: string;
  password: string;
}

export interface UpdateReportRequest {
  campus?: string;
  building?: string;
  location?: string;
  problemTypes?: string[];
  customProblem?: string;
  description?: string;
  password: string;
}

export interface DeleteReportRequest {
  password: string;
}

export interface EmpathyRequest {
  reportId: string;
}

export interface ReportListQuery {
  sort?: 'latest' | 'empathy';
  campus?: string;
  building?: string;
  page?: number;
  limit?: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ReportResponse {
  id: string;
  campus: string;
  building: string;
  location: string;
  problemTypes: string[];
  customProblem?: string;
  description: string;
  empathyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmpathyCheckResponse {
  hasEmpathy: boolean;
  empathyCount: number;
}

export interface ReportListResponse {
  reports: ReportResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Database Row Types (for raw database queries)
export interface ReportRow {
  id: string;
  campus: string;
  building: string;
  location: string;
  problem_types: string; // JSON string in database
  custom_problem?: string | null;
  description: string;
  password_hash: string;
  empathy_count: number;
  created_at: string; // ISO string from database
  updated_at: string; // ISO string from database
}

export interface EmpathyRow {
  id: string;
  report_id: string;
  user_identifier: string;
  created_at: string; // ISO string from database
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Service Layer Types
export interface ReportService {
  createReport(data: CreateReportRequest): Promise<ReportResponse>;
  getReports(query: ReportListQuery): Promise<ReportListResponse>;
  getReportById(id: string): Promise<ReportResponse | null>;
  updateReport(id: string, data: UpdateReportRequest): Promise<ReportResponse>;
  deleteReport(id: string, password: string): Promise<void>;
  verifyPassword(id: string, password: string): Promise<boolean>;
}

export interface EmpathyService {
  addEmpathy(reportId: string, userIdentifier: string): Promise<void>;
  removeEmpathy(reportId: string, userIdentifier: string): Promise<void>;
  checkEmpathy(reportId: string, userIdentifier: string): Promise<EmpathyCheckResponse>;
  getEmpathyCount(reportId: string): Promise<number>;
}

// Repository Types
export interface ReportRepository {
  create(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report>;
  findAll(query: ReportListQuery): Promise<{ reports: Report[]; total: number }>;
  findById(id: string): Promise<Report | null>;
  update(id: string, data: Partial<Report>): Promise<Report>;
  delete(id: string): Promise<void>;
  incrementEmpathyCount(id: string): Promise<void>;
  decrementEmpathyCount(id: string): Promise<void>;
}

export interface EmpathyRepository {
  create(empathy: Omit<Empathy, 'id' | 'createdAt'>): Promise<Empathy>;
  findByReportAndUser(reportId: string, userIdentifier: string): Promise<Empathy | null>;
  delete(reportId: string, userIdentifier: string): Promise<void>;
  countByReport(reportId: string): Promise<number>;
}

// Constants
export const CAMPUS_OPTIONS = ['김해캠퍼스', '부산캠퍼스'] as const;
export type Campus = typeof CAMPUS_OPTIONS[number];

export const PROBLEM_TYPES = [
  'WiFi 신호 약함',
  'WiFi 연결 끊김',
  '인터넷 속도 느림',
  '특정 사이트 접속 불가',
  '기타'
] as const;
export type ProblemType = typeof PROBLEM_TYPES[number];

// Error Codes
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_EMPATHY = 'DUPLICATE_EMPATHY',
  SERVER_ERROR = 'SERVER_ERROR'
}

// Express Request Extensions
export interface AuthenticatedRequest extends Request {
  reportId?: string;
  userIdentifier?: string;
}