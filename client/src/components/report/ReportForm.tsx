import React, { useState } from 'react';
import { CreateReportRequest, CAMPUS_OPTIONS, PROBLEM_TYPES, ReportFormState } from '../../types';
import { validateReportField, validateReportForm, hasValidationErrors } from '../../utils/validation';

interface ReportFormProps {
  onSubmit: (report: CreateReportRequest) => void;
  isLoading?: boolean;
  initialData?: Partial<CreateReportRequest>;
  submitButtonText?: string;
  showPasswordField?: boolean;
}

const ReportForm: React.FC<ReportFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
  submitButtonText = '제보하기',
  showPasswordField = true
}) => {
  const [formState, setFormState] = useState<ReportFormState>({
    campus: initialData?.campus || '',
    building: initialData?.building || '',
    location: initialData?.location || '',
    problemTypes: initialData?.problemTypes || [],
    customProblem: initialData?.customProblem || '',
    description: initialData?.description || '',
    password: initialData?.password || '',
    errors: {},
    isSubmitting: false
  });

  const handleInputChange = (field: keyof ReportFormState, value: string) => {
    setFormState(prev => {
      const newFormState = {
        ...prev,
        [field]: value
      };

      // Real-time validation for the changed field
      const error = validateReportField(field, value, newFormState);

      return {
        ...newFormState,
        errors: {
          ...prev.errors,
          [field]: error || ''
        }
      };
    });
  };

  const handleProblemTypeChange = (problemType: string, checked: boolean) => {
    setFormState(prev => {
      const newProblemTypes = checked
        ? [...prev.problemTypes, problemType]
        : prev.problemTypes.filter(type => type !== problemType);

      const newFormState = {
        ...prev,
        problemTypes: newProblemTypes
      };

      // Validate problem types
      const problemTypesError = validateReportField('problemTypes', newProblemTypes, newFormState);

      // Also validate custom problem if "기타" selection changes
      let customProblemError = prev.errors.customProblem;
      if (problemType === '기타') {
        customProblemError = validateReportField('customProblem', prev.customProblem, newFormState) || '';
      }

      return {
        ...newFormState,
        errors: {
          ...prev.errors,
          problemTypes: problemTypesError || '',
          customProblem: customProblemError
        }
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate entire form before submission
    const formData = {
      campus: formState.campus,
      building: formState.building,
      location: formState.location,
      problemTypes: formState.problemTypes,
      customProblem: formState.customProblem,
      description: formState.description,
      password: formState.password
    };

    const validationErrors = validateReportForm(formData);

    if (hasValidationErrors(validationErrors)) {
      setFormState(prev => ({
        ...prev,
        errors: validationErrors
      }));
      return;
    }

    const reportData: CreateReportRequest = {
      campus: formState.campus,
      building: formState.building,
      location: formState.location,
      problemTypes: formState.problemTypes,
      customProblem: formState.customProblem || undefined,
      description: formState.description,
      password: formState.password
    };

    onSubmit(reportData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 캠퍼스 선택 */}
      <div className="form-group">
        <label htmlFor="campus" className="form-label">
          📍 캠퍼스 <span className="text-error-500">*</span>
        </label>
        <select
          id="campus"
          value={formState.campus}
          onChange={(e) => handleInputChange('campus', e.target.value)}
          className={`form-select ${formState.errors.campus
            ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
            : ''
            }`}
          disabled={isLoading}
        >
          <option value="">캠퍼스를 선택해주세요</option>
          {CAMPUS_OPTIONS.map(campus => (
            <option key={campus} value={campus}>
              {campus}
            </option>
          ))}
        </select>
        {formState.errors.campus && (
          <p className="form-error">{formState.errors.campus}</p>
        )}
      </div>

      {/* 건물명 */}
      <div className="form-group">
        <label htmlFor="building" className="form-label">
          🏢 건물명 <span className="text-error-500">*</span>
        </label>
        <input
          type="text"
          id="building"
          value={formState.building}
          onChange={(e) => handleInputChange('building', e.target.value)}
          placeholder="예: 하연관, 도서관, 신어관"
          className={`form-input ${formState.errors.building
            ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
            : ''
            }`}
          disabled={isLoading || !formState.campus}
        />
        {formState.errors.building && (
          <p className="form-error">{formState.errors.building}</p>
        )}
      </div>

      {/* 상세 위치 */}
      <div className="form-group">
        <label htmlFor="location" className="form-label">
          📍 상세 위치 <span className="text-error-500">*</span>
        </label>
        <input
          type="text"
          id="location"
          value={formState.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          placeholder="예: 3층 301호, 1층 로비, 지하 1층 카페"
          className={`form-input ${formState.errors.location
            ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
            : ''
            }`}
          disabled={isLoading}
        />
        {formState.errors.location && (
          <p className="form-error">{formState.errors.location}</p>
        )}
      </div>

      {/* 문제 유형 */}
      <div className="form-group">
        <label className="form-label">
          🚨 문제 유형 <span className="text-error-500">*</span>
          <span className="text-sm text-secondary-500 ml-2">(여러 개 선택 가능)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
          {PROBLEM_TYPES.map(problemType => (
            <label key={problemType} className="flex items-center cursor-pointer hover:bg-white p-2 rounded-lg transition-colors duration-200">
              <input
                type="checkbox"
                checked={formState.problemTypes.includes(problemType)}
                onChange={(e) => handleProblemTypeChange(problemType, e.target.checked)}
                className="form-checkbox"
                disabled={isLoading}
              />
              <span className="ml-3 text-sm text-secondary-700 select-none">{problemType}</span>
            </label>
          ))}
        </div>
        {formState.errors.problemTypes && (
          <p className="form-error">{formState.errors.problemTypes}</p>
        )}
      </div>

      {/* 기타 문제 직접 입력 */}
      {formState.problemTypes.includes('기타') && (
        <div className="form-group">
          <label htmlFor="customProblem" className="form-label">
            ✏️ 기타 문제 상세 내용 <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            id="customProblem"
            value={formState.customProblem}
            onChange={(e) => handleInputChange('customProblem', e.target.value)}
            placeholder="겪고 있는 문제를 구체적으로 설명해주세요"
            className={`form-input ${formState.errors.customProblem
              ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
              : ''
              }`}
            disabled={isLoading}
          />
          {formState.errors.customProblem && (
            <p className="form-error">{formState.errors.customProblem}</p>
          )}
        </div>
      )}

      {/* 문제 상세 설명 */}
      <div className="form-group">
        <label htmlFor="description" className="form-label">
          📝 문제 상세 설명 <span className="text-error-500">*</span>
        </label>
        <textarea
          id="description"
          value={formState.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="와이파이 문제 상황을 자세히 설명해주세요 (최소 10자 이상)"
          rows={4}
          className={`form-textarea ${formState.errors.description
            ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
            : ''
            }`}
          disabled={isLoading}
        />
        <div className="mt-2 flex justify-between items-center">
          {formState.errors.description && (
            <p className="form-error">{formState.errors.description}</p>
          )}
          <div className={`text-sm ml-auto px-2 py-1 rounded-full ${formState.description.length >= 10
            ? 'bg-success-100 text-success-700'
            : 'bg-secondary-100 text-secondary-600'
            }`}>
            {formState.description.length}/10자 이상
            {formState.description.length >= 10 && (
              <span className="ml-1">✓</span>
            )}
          </div>
        </div>
      </div>

      {/* 비밀번호 */}
      {showPasswordField && (
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            🔒 비밀번호 <span className="text-error-500">*</span>
          </label>
          <input
            type="password"
            id="password"
            value={formState.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="4자리 숫자 (제보 수정/삭제 시 필요)"
            maxLength={4}
            className={`form-input max-w-xs ${formState.errors.password
              ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
              : ''
              }`}
            disabled={isLoading}
          />
          <div className="mt-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
            <p className="text-sm text-warning-800">
              💡 제보를 수정하거나 삭제할 때 필요한 4자리 숫자를 입력해주세요
            </p>
          </div>
          {formState.errors.password && (
            <p className="form-error">{formState.errors.password}</p>
          )}
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="pt-6 border-t border-secondary-200">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary btn-lg w-full"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              제보 중...
            </span>
          ) : (
            <>📤 {submitButtonText}</>
          )}
        </button>
      </div>
    </form>
  );
};

export default ReportForm;