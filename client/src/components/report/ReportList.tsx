import React from 'react';
import { Report, SortOption, FilterOptions } from '../../types';
import ReportCard from './ReportCard';
import ReportFilters from './ReportFilters';
import LoadingSpinner from '../common/LoadingSpinner';

interface ReportListProps {
  reports: Report[];
  sortBy: SortOption;
  filters: FilterOptions;
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filters: FilterOptions) => void;
  onReportClick: (report: Report) => void;
  isLoading: boolean;
}

const ReportList: React.FC<ReportListProps> = ({
  reports,
  sortBy,
  filters,
  onSortChange,
  onFilterChange,
  onReportClick,
  isLoading
}) => {
  return (
    <div className="space-y-6">
      {/* 필터 및 정렬 컨트롤 - 항상 표시 */}
      <ReportFilters
        sortBy={sortBy}
        filters={filters}
        onSortChange={onSortChange}
        onFilterChange={onFilterChange}
        totalCount={reports.length}
      />

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* 제보가 없는 경우 */}
      {!isLoading && reports.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-16">
            <div className="text-secondary-300 text-6xl mb-6">📋</div>
            <h3 className="text-xl font-semibold text-secondary-700 mb-3">
              조건에 맞는 제보가 없습니다
            </h3>
            <p className="text-secondary-500 mb-8 max-w-md mx-auto">
              다른 필터 조건을 시도해보시거나 새로운 제보를 작성해보세요!
            </p>
            <button 
              onClick={() => window.location.href = '/report'}
              className="btn-primary btn-lg"
            >
              📝 제보하기
            </button>
          </div>
        </div>
      )}

      {/* 제보 목록 */}
      {!isLoading && reports.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={onReportClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportList;