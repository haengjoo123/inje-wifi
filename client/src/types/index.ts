// Core Data Models
export interface Report {
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

export interface Empathy {
  id: string;
  reportId: string;
  userIdentifier: string;
  createdAt: Date;
}

// API Request/Response Types
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

export interface EmpathyCheckResponse {
  hasEmpathy: boolean;
  empathyCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Form State Types
export interface ReportFormState {
  campus: string;
  building: string;
  location: string;
  problemTypes: string[];
  customProblem: string;
  description: string;
  password: string;
  errors: ValidationErrors;
  isSubmitting: boolean;
}

export interface PasswordModalState {
  isOpen: boolean;
  action: 'edit' | 'delete' | null;
  password: string;
  error: string;
  isSubmitting: boolean;
}

// Validation Types
export interface ValidationErrors {
  [key: string]: string;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any, formData?: any) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Filter and Sort Types
export interface FilterOptions {
  campus: string;
  building: string;
}

export type SortOption = 'latest' | 'empathy';

export interface ReportListParams {
  sort?: SortOption;
  campus?: string;
  building?: string;
  page?: number;
  limit?: number;
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

export const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'empathy', label: '공감순' }
] as const;

export const FILTER_CAMPUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '김해캠퍼스', label: '김해캠퍼스' },
  { value: '부산캠퍼스', label: '부산캠퍼스' }
] as const;

// Error Codes
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_EMPATHY = 'DUPLICATE_EMPATHY',
  SERVER_ERROR = 'SERVER_ERROR'
}