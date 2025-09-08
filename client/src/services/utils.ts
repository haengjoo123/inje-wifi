import { ApiErrorCode } from '../types';

/**
 * API 에러 메시지를 사용자 친화적인 메시지로 변환
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.code) {
    switch (error.code) {
      case ApiErrorCode.VALIDATION_ERROR:
        return '입력 정보를 확인해주세요.';
      case ApiErrorCode.UNAUTHORIZED:
        return '비밀번호가 일치하지 않습니다.';
      case ApiErrorCode.NOT_FOUND:
        return '요청한 제보를 찾을 수 없습니다.';
      case ApiErrorCode.DUPLICATE_EMPATHY:
        return '이미 공감하셨습니다.';
      case ApiErrorCode.SERVER_ERROR:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      default:
        return '알 수 없는 오류가 발생했습니다.';
    }
  }

  return '알 수 없는 오류가 발생했습니다.';
};

/**
 * 재시도 가능한 API 호출 래퍼
 */
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // 마지막 시도이거나 재시도 불가능한 에러인 경우
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // 지연 후 재시도
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};

/**
 * 재시도 가능한 에러인지 확인
 */
const isRetryableError = (error: any): boolean => {
  // 네트워크 에러나 서버 에러는 재시도 가능
  if (!error?.code) return true;
  
  const nonRetryableCodes = [
    ApiErrorCode.VALIDATION_ERROR,
    ApiErrorCode.UNAUTHORIZED,
    ApiErrorCode.NOT_FOUND,
    ApiErrorCode.DUPLICATE_EMPATHY
  ];
  
  return !nonRetryableCodes.includes(error.code);
};

/**
 * 디바운스된 API 호출
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};