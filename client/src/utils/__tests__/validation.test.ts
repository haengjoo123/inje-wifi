import { describe, it, expect } from 'vitest';
import { 
  validateField, 
  validateReportForm, 
  validateReportField,
  hasValidationErrors,
  getFirstError 
} from '../validation';

describe('Validation Utils', () => {
  describe('validateField', () => {
    it('should validate required fields', () => {
      const rule = { required: true };
      
      expect(validateField('', rule)).toBe('필수 입력 항목입니다');
      expect(validateField('value', rule)).toBeNull();
      expect(validateField([], rule)).toBe('필수 입력 항목입니다');
      expect(validateField(['item'], rule)).toBeNull();
    });

    it('should validate minimum length', () => {
      const rule = { minLength: 5 };
      
      expect(validateField('abc', rule)).toBe('최소 5자 이상 입력해주세요');
      expect(validateField('abcdef', rule)).toBeNull();
    });

    it('should validate maximum length', () => {
      const rule = { maxLength: 5 };
      
      expect(validateField('abcdef', rule)).toBe('최대 5자까지 입력 가능합니다');
      expect(validateField('abc', rule)).toBeNull();
    });

    it('should validate patterns', () => {
      const rule = { pattern: /^\d{4}$/ };
      
      expect(validateField('abc', rule)).toBe('올바른 형식으로 입력해주세요');
      expect(validateField('12345', rule)).toBe('올바른 형식으로 입력해주세요');
      expect(validateField('1234', rule)).toBeNull();
    });

    it('should validate custom rules', () => {
      const rule = { 
        custom: (value: string) => value === 'test' ? null : 'Must be test' 
      };
      
      expect(validateField('wrong', rule)).toBe('Must be test');
      expect(validateField('test', rule)).toBeNull();
    });
  });

  describe('validateReportField', () => {
    it('should validate campus field', () => {
      expect(validateReportField('campus', '', {})).toBe('필수 입력 항목입니다');
      expect(validateReportField('campus', '김해캠퍼스', {})).toBeNull();
    });

    it('should validate password field', () => {
      expect(validateReportField('password', '', {})).toBe('비밀번호를 입력해주세요');
      expect(validateReportField('password', 'abc', {})).toBe('숫자만 입력 가능합니다');
      expect(validateReportField('password', '123', {})).toBe('4자리 숫자를 입력해주세요');
      expect(validateReportField('password', '12345', {})).toBe('4자리 숫자를 입력해주세요');
      expect(validateReportField('password', '1234', {})).toBeNull();
    });

    it('should validate description field', () => {
      expect(validateReportField('description', '', {})).toBe('필수 입력 항목입니다');
      expect(validateReportField('description', 'short', {})).toBe('최소 10자 이상 입력해주세요');
      expect(validateReportField('description', 'This is a long enough description for testing', {})).toBeNull();
    });

    it('should validate problem types', () => {
      expect(validateReportField('problemTypes', [], {})).toBe('문제 유형을 하나 이상 선택해주세요');
      expect(validateReportField('problemTypes', ['WiFi 신호 약함'], {})).toBeNull();
    });

    it('should validate custom problem when 기타 is selected', () => {
      const formDataWithOther = { problemTypes: ['기타'] };
      const formDataWithoutOther = { problemTypes: ['WiFi 신호 약함'] };
      
      expect(validateReportField('customProblem', '', formDataWithOther)).toBe('기타 문제 내용을 입력해주세요');
      expect(validateReportField('customProblem', '', formDataWithoutOther)).toBeNull();
      expect(validateReportField('customProblem', 'Custom problem', formDataWithOther)).toBeNull();
    });
  });

  describe('validateReportForm', () => {
    it('should validate complete form', () => {
      const validForm = {
        campus: '김해캠퍼스',
        building: '공학관',
        location: '3층 301호',
        problemTypes: ['WiFi 신호 약함'],
        customProblem: '',
        description: 'This is a detailed description of the wifi problem that is long enough',
        password: '1234'
      };

      const errors = validateReportForm(validForm);
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should return errors for invalid form', () => {
      const invalidForm = {
        campus: '',
        building: '',
        location: '',
        problemTypes: [],
        customProblem: '',
        description: 'short',
        password: 'abc'
      };

      const errors = validateReportForm(invalidForm);
      expect(hasValidationErrors(errors)).toBe(true);
      expect(errors.campus).toBeTruthy();
      expect(errors.building).toBeTruthy();
      expect(errors.location).toBeTruthy();
      expect(errors.problemTypes).toBeTruthy();
      expect(errors.description).toBeTruthy();
      expect(errors.password).toBeTruthy();
    });
  });

  describe('utility functions', () => {
    it('should detect validation errors', () => {
      expect(hasValidationErrors({})).toBe(false);
      expect(hasValidationErrors({ field1: '' })).toBe(false);
      expect(hasValidationErrors({ field1: 'error' })).toBe(true);
    });

    it('should get first error', () => {
      expect(getFirstError({})).toBeNull();
      expect(getFirstError({ field1: '', field2: 'error2' })).toBe('error2');
      expect(getFirstError({ field1: 'error1', field2: 'error2' })).toBe('error1');
    });
  });
});