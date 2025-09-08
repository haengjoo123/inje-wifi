import React from 'react';
import { SortOption, FilterOptions } from '../../types';

interface ReportFiltersProps {
  sortBy: SortOption;
  filters: FilterOptions;
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filters: FilterOptions) => void;
  totalCount: number;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  sortBy,
  filters,
  onSortChange,
  onFilterChange,
  totalCount
}) => {
  const handleCampusChange = (campus: string) => {
    onFilterChange({ ...filters, campus });
  };

  const handleBuildingChange = (building: string) => {
    onFilterChange({ ...filters, building });
  };

  const clearAllFilters = () => {
    onFilterChange({ campus: 'all', building: '' });
  };

  const hasActiveFilters = filters.campus !== 'all' || filters.building !== '';

  return (
    <div className="card">
      <div className="card-body">
        {/* 메인 필터 컨트롤 */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* 필터 섹션 */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
            <span className="text-sm font-medium text-secondary-700 whitespace-nowrap flex items-center">
              🔍 필터:
            </span>
            
            {/* 캠퍼스 필터 */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
              <select
                value={filters.campus}
                onChange={(e) => handleCampusChange(e.target.value)}
                className="form-select min-w-[140px]"
              >
                <option value="all">📍 전체 캠퍼스</option>
                <option value="김해캠퍼스">📍 김해캠퍼스</option>
                <option value="부산캠퍼스">📍 부산캠퍼스</option>
              </select>

              {/* 건물명 필터 */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="🏢 건물명 검색"
                  value={filters.building}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  className="form-input min-w-[160px]"
                />
                {filters.building && (
                  <button
                    onClick={() => handleBuildingChange('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 text-lg"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 정렬 및 결과 수 섹션 */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-secondary-700 whitespace-nowrap">📊 정렬:</span>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="form-select"
              >
                <option value="latest">🕒 최신순</option>
                <option value="empathy">🙋‍♂️ 공감순</option>
              </select>
            </div>
            
            <div className="text-sm text-secondary-600 whitespace-nowrap px-3 py-1 bg-secondary-100 rounded-full">
              총 <span className="font-semibold text-primary-600">{totalCount}</span>개의 제보
            </div>
          </div>
        </div>

        {/* 활성 필터 표시 */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-secondary-600">🏷️ 활성 필터:</span>
              
              {filters.campus !== 'all' && (
                <span className="badge-primary inline-flex items-center">
                  📍 {filters.campus}
                  <button
                    onClick={() => handleCampusChange('all')}
                    className="ml-2 text-primary-600 hover:text-primary-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filters.building && (
                <span className="badge-success inline-flex items-center">
                  🏢 {filters.building}
                  <button
                    onClick={() => handleBuildingChange('')}
                    className="ml-2 text-success-600 hover:text-success-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
              
              <button
                onClick={clearAllFilters}
                className="text-xs text-secondary-500 hover:text-secondary-700 underline ml-2 px-2 py-1 rounded hover:bg-secondary-100 transition-colors duration-200"
              >
                모든 필터 지우기
              </button>
            </div>
          </div>
        )}

        {/* 필터 결과 안내 */}
        {hasActiveFilters && totalCount === 0 && (
          <div className="mt-4 alert-warning">
            <div className="flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              <span className="text-sm">
                현재 필터 조건에 맞는 제보가 없습니다. 필터를 조정해보세요.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportFilters;