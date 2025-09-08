import { ValidationErrors, ValidationRule, ValidationSchema } from '../types';

export const validateField = (value: any, rule: ValidationRule, formData?: any): string | null => {
  // Custom validation first (it can handle required logic too)
  if (rule.custom) {
    return rule.custom(value, formData);
  }

  // Required validation
  if (rule.required && (!value || (Array.isArray(value) && value.length === 0))) {
    return '필수 입력 항목입니다';
  }

  // Skip other validations if value is empty and not required
  if (!value && !rule.required) {
    return null;
  }

  // Min length validation
  if (rule.minLength && value.length < rule.minLength) {
    return `최소 ${rule.minLength}자 이상 입력해주세요`;
  }

  // Max length validation
  if (rule.maxLength && value.length > rule.maxLength) {
    return `최대 ${rule.maxLength}자까지 입력 가능합니다`;
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(value)) {
    return '올바른 형식으로 입력해주세요';
  }

  return null;
};

export const validateForm = (data: any, schema: ValidationSchema): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(schema).forEach(field => {
    const rule = schema[field];
    const value = data[field];
    const error = validateField(value, rule, data);
    
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

// Report form validation schema
export const reportFormSchema: ValidationSchema = {
  campus: {
    required: true
  },
  building: {
    required: true,
    minLength: 1,
    maxLength: 100
  },
  location: {
    required: true,
    minLength: 1,
    maxLength: 200
  },
  problemTypes: {
    required: true,
    custom: (value: string[]) => {
      if (!Array.isArray(value) || value.length === 0) {
        return '문제 유형을 하나 이상 선택해주세요';
      }
      return null;
    }
  },
  customProblem: {
    custom: (value: string, formData?: any) => {
      // Only validate if "기타" is selected
      if (formData?.problemTypes?.includes('기타')) {
        if (!value || value.trim().length === 0) {
          return '기타 문제 내용을 입력해주세요';
        }
        if (value.length > 200) {
          return '최대 200자까지 입력 가능합니다';
        }
      }
      return null;
    }
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 1000
  },
  password: {
    required: true,
    pattern: /^\d{4}$/,
    custom: (value: string) => {
      if (!value) {
        return '비밀번호를 입력해주세요';
      }
      if (!/^\d+$/.test(value)) {
        return '숫자만 입력 가능합니다';
      }
      if (value.length !== 4) {
        return '4자리 숫자를 입력해주세요';
      }
      return null;
    }
  }
};

// Validate individual field with context
export const validateReportField = (
  field: string, 
  value: any, 
  formData: any
): string | null => {
  const rule = reportFormSchema[field];
  if (!rule) return null;

  // Special handling for customProblem which depends on problemTypes
  if (field === 'customProblem' && rule.custom) {
    return rule.custom(value, formData);
  }

  return validateField(value, rule);
};

// Validate entire report form
export const validateReportForm = (formData: any): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate each field
  Object.keys(reportFormSchema).forEach(field => {
    const error = validateReportField(field, formData[field], formData);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

// Check if form has any errors
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).some(key => errors[key] && errors[key].length > 0);
};

// Get first error message
export const getFirstError = (errors: ValidationErrors): string | null => {
  const errorKeys = Object.keys(errors);
  for (const key of errorKeys) {
    if (errors[key]) {
      return errors[key];
    }
  }
  return null;
};