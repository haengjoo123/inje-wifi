import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Report } from '../types';
import ReportService from '../services/reportService';
import ReportDetail from '../components/report/ReportDetail';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 제보 상세 정보 로드
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
      console.error('제보 상세 조회 실패:', err);
      setError('제보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 제보 수정 핸들러
  const handleEdit = async (password: string) => {
    if (!report) return;

    try {
      // 비밀번호 검증
      const isValid = await ReportService.verifyPassword(report.id, password);
      if (!isValid) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }

      // 수정 페이지로 이동
      navigate(`/reports/${report.id}/edit`, { 
        state: { report, password } 
      });
    } catch (err) {
      console.error('비밀번호 검증 실패:', err);
      throw err;
    }
  };

  // 제보 삭제 핸들러
  const handleDelete = async (password: string) => {
    if (!report) return;

    try {
      await ReportService.deleteReport(report.id, { password });
      
      // 성공 메시지와 함께 목록으로 이동
      navigate('/reports', { 
        state: { message: '제보가 성공적으로 삭제되었습니다.' }
      });
    } catch (err) {
      console.error('제보 삭제 실패:', err);
      throw err;
    }
  };

  // 공감 업데이트 핸들러
  const handleEmpathyUpdate = (newCount: number) => {
    if (report) {
      setReport({
        ...report,
        empathyCount: newCount
      });
    }
  };

  // 뒤로가기 핸들러
  const handleGoBack = () => {
    navigate(-1);
  };

  // 초기 로드
  useEffect(() => {
    loadReport();
  }, [id]);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <button
          onClick={handleGoBack}
          className="flex items-center text-secondary-600 hover:text-secondary-800 transition-colors self-start"
        >
          <span className="mr-2 text-lg">←</span>
          <span className="text-sm sm:text-base">뒤로가기</span>
        </button>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/reports')}
            className="btn-secondary text-sm sm:text-base"
          >
            📋 목록으로
          </button>
          <button
            onClick={() => navigate('/report')}
            className="btn-primary text-sm sm:text-base"
          >
            📝 새 제보 작성
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="alert-error mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start">
              <div className="text-lg mr-3 flex-shrink-0">⚠️</div>
              <div>
                <h3 className="font-medium">오류가 발생했습니다</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={loadReport}
              className="btn-error btn-sm self-start sm:self-center"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* 제보 상세 내용 */}
      {!isLoading && !error && report && (
        <ReportDetail
          report={report}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onEmpathyUpdate={handleEmpathyUpdate}
          isLoading={isLoading}
        />
      )}

      {/* 제보를 찾을 수 없는 경우 */}
      {!isLoading && !error && !report && (
        <div className="card">
          <div className="card-body text-center py-16">
            <div className="text-secondary-300 text-6xl mb-6">📋</div>
            <h3 className="text-xl font-semibold text-secondary-700 mb-3">
              제보를 찾을 수 없습니다
            </h3>
            <p className="text-secondary-500 mb-8 max-w-md mx-auto">
              요청하신 제보가 존재하지 않거나 삭제되었을 수 있습니다.
            </p>
            <button
              onClick={() => navigate('/reports')}
              className="btn-primary btn-lg"
            >
              📋 제보 목록으로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetailPage;