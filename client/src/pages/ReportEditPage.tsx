import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Report, UpdateReportRequest } from '../types';
import ReportService from '../services/reportService';
import ReportForm from '../components/report/ReportForm';

interface LocationState {
  report?: Report;
  password?: string;
}

const ReportEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [report, setReport] = useState<Report | null>(state?.report || null);
  const [isLoading, setIsLoading] = useState(!state?.report);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 제보 정보 로드 (state에서 전달받지 못한 경우)
  const loadReport = async () => {
    if (!id) {
      setError('잘못된 제보 ID입니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await ReportService.getReportById(id);
      setReport(data);
    } catch (err) {
      console.error('제보 조회 실패:', err);
      setError('제보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 제보 수정 제출 핸들러
  const handleSubmit = async (formData: UpdateReportRequest) => {
    if (!report || !id) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await ReportService.updateReport(id, formData);
      
      // 성공 시 상세 페이지로 이동
      navigate(`/reports/${id}`, {
        state: { message: '제보가 성공적으로 수정되었습니다.' }
      });
    } catch (err) {
      console.error('제보 수정 실패:', err);
      setError('제보 수정에 실패했습니다. 비밀번호를 확인해주세요.');
      setIsSubmitting(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    navigate(`/reports/${id}`);
  };

  // 초기 로드
  useEffect(() => {
    if (!report) {
      loadReport();
    }
  }, [id]);

  // 비밀번호가 없으면 상세 페이지로 리다이렉트
  useEffect(() => {
    if (!state?.password && !isLoading) {
      navigate(`/reports/${id}`, {
        state: { error: '수정 권한이 없습니다. 비밀번호를 다시 입력해주세요.' }
      });
    }
  }, [state?.password, isLoading, navigate, id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">제보 수정</h1>
            <p className="text-gray-600">
              제보 내용을 수정하고 저장하세요
            </p>
          </div>
          
          <button
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            취소
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-medium">오류가 발생했습니다</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
            </div>
          </div>
        )}

        {/* 수정 폼 */}
        {!isLoading && report && state?.password && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <ReportForm
              initialData={{
                campus: report.campus,
                building: report.building,
                location: report.location,
                problemTypes: report.problemTypes,
                customProblem: report.customProblem || '',
                description: report.description,
                password: state.password
              }}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              submitButtonText="수정 완료"
              showPasswordField={false} // 수정 시에는 비밀번호 필드 숨김
            />
          </div>
        )}

        {/* 안내 메시지 */}
        {!isLoading && report && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 수정된 내용은 즉시 반영되며, 다른 사용자들이 확인할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportEditPage;