import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Report, SortOption, FilterOptions } from '../types';
import ReportService from '../services/reportService';
import ReportList from '../components/report/ReportList';

const ReportListPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [filters, setFilters] = useState<FilterOptions>({
    campus: 'all',
    building: ''
  });
  const [isLoadingRef, setIsLoadingRef] = useState(false);

  // 제보 목록 로드
  const loadReports = async () => {
    // 이미 로딩 중이면 중복 요청 방지
    if (isLoadingRef) {
      return;
    }

    try {
      setIsLoadingRef(true);
      setIsLoading(true);
      setError(null);
      
      const params = {
        sort: sortBy,
        campus: filters.campus,
        building: filters.building || undefined
      };
      
      const data = await ReportService.getReports(params);
      setReports(data);
    } catch (err: any) {
      console.error('제보 목록 로드 실패:', err);
      
      // Rate limit 에러인 경우 더 친화적인 메시지 표시
      if (err.message === 'TOO_MANY_REQUESTS') {
        setError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('제보 목록을 불러오는데 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
      setIsLoadingRef(false);
    }
  };

  // 초기 로드 및 필터/정렬 변경 시 재로드
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadReports();
    }, 100); // 100ms 디바운스로 중복 요청 방지

    return () => clearTimeout(timeoutId);
  }, [sortBy, filters]);

  // 정렬 변경 핸들러
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
  };

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // 제보 클릭 핸들러
  const handleReportClick = (report: Report) => {
    navigate(`/reports/${report.id}`);
  };

  // 새 제보 작성 핸들러
  const handleNewReport = () => {
    navigate('/report');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800 mb-2">📋 제보 목록</h1>
          <p className="text-secondary-600">
            인제대학교 캠퍼스 내 와이파이 문제 제보를 확인하고 공감해보세요
          </p>
        </div>
        <button
          onClick={handleNewReport}
          className="mt-4 sm:mt-0 btn-primary btn-lg"
        >
          📝 새 제보 작성
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="alert-error mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-lg mr-3">⚠️</div>
              <div>
                <h3 className="font-medium">오류가 발생했습니다</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={loadReports}
              className="btn-error btn-sm ml-4"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 제보 목록 */}
      <ReportList
        reports={reports}
        sortBy={sortBy}
        filters={filters}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onReportClick={handleReportClick}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ReportListPage;