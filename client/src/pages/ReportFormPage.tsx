import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReportForm from '../components/report/ReportForm';
import { CreateReportRequest } from '../types';
import { ReportService } from '../services';

const ReportFormPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (reportData: CreateReportRequest) => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      await ReportService.createReport(reportData);
      // Show success message and redirect to report list
      alert('제보가 완료되었습니다!');
      navigate('/reports');
    } catch (error: any) {
      console.error('Failed to create report:', error);
      setSubmitError(
        error.response?.data?.error?.message || 
        '제보 등록 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-secondary-800 mb-3">📝 와이파이 문제 제보</h1>
        <p className="text-secondary-600">
          캠퍼스 내 와이파이 문제를 제보해주세요. 여러분의 제보가 더 나은 네트워크 환경을 만드는 데 도움이 됩니다.
        </p>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-secondary-800">제보 정보 입력</h2>
          <p className="text-sm text-secondary-600 mt-1">
            <span className="text-error-500">*</span> 표시된 항목은 필수 입력 사항입니다.
          </p>
        </div>

        <div className="card-body">
          {submitError && (
            <div className="alert-error mb-6">
              <div className="flex items-start">
                <span className="text-lg mr-2">⚠️</span>
                <p className="text-sm">{submitError}</p>
              </div>
            </div>
          )}

          <ReportForm 
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportFormPage;