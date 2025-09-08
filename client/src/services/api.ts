import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiErrorCode } from '../types';

// API 기본 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키 기반 공감 중복 방지를 위해 필요
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // 요청 로깅 (개발 환경에서만)
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 응답 로깅 (개발 환경에서만)
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    // 에러 로깅
    console.error('[API Response Error]', error.response?.data || error.message);
    
    // 네트워크 에러 처리
    if (!error.response) {
      return Promise.reject({
        code: ApiErrorCode.SERVER_ERROR,
        message: '네트워크 연결을 확인해주세요.',
        details: error.message
      });
    }

    // 서버 에러 응답 처리
    const errorResponse = error.response.data;
    if (errorResponse && !errorResponse.success && errorResponse.error) {
      return Promise.reject(errorResponse.error);
    }

    // 기본 HTTP 상태 코드 에러 처리
    let message = '알 수 없는 오류가 발생했습니다.';
    let code = ApiErrorCode.SERVER_ERROR;

    switch (error.response.status) {
      case 400:
        message = '잘못된 요청입니다.';
        code = ApiErrorCode.VALIDATION_ERROR;
        break;
      case 401:
        message = '인증이 필요합니다.';
        code = ApiErrorCode.UNAUTHORIZED;
        break;
      case 404:
        message = '요청한 리소스를 찾을 수 없습니다.';
        code = ApiErrorCode.NOT_FOUND;
        break;
      case 409:
        message = '중복된 요청입니다.';
        code = ApiErrorCode.DUPLICATE_EMPATHY;
        break;
      case 500:
        message = '서버 내부 오류가 발생했습니다.';
        break;
    }

    return Promise.reject({
      code,
      message,
      details: error.response.data
    });
  }
);

export default apiClient;