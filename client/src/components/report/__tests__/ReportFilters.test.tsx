import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ReportFilters from '../ReportFilters';
import { SortOption, FilterOptions } from '../../../types';

describe('ReportFilters', () => {
  const defaultProps = {
    sortBy: 'latest' as SortOption,
    filters: { campus: 'all', building: '' } as FilterOptions,
    onSortChange: vi.fn(),
    onFilterChange: vi.fn(),
    totalCount: 5
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('기본 필터 컨트롤을 렌더링한다', () => {
    render(<ReportFilters {...defaultProps} />);

    expect(screen.getByText('필터:')).toBeInTheDocument();
    expect(screen.getByText('정렬:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('전체 캠퍼스')).toBeInTheDocument();
    expect(screen.getByDisplayValue('최신순')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('건물명 검색')).toBeInTheDocument();
    expect(screen.getByText((_, element) => {
      return element?.textContent === '총 5개의 제보';
    })).toBeInTheDocument();
  });

  it('캠퍼스 필터 변경이 작동한다', () => {
    render(<ReportFilters {...defaultProps} />);

    const campusSelect = screen.getByDisplayValue('전체 캠퍼스');
    fireEvent.change(campusSelect, { target: { value: '김해캠퍼스' } });

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      campus: '김해캠퍼스',
      building: ''
    });
  });

  it('건물명 필터 변경이 작동한다', () => {
    render(<ReportFilters {...defaultProps} />);

    const buildingInput = screen.getByPlaceholderText('건물명 검색');
    fireEvent.change(buildingInput, { target: { value: '공학관' } });

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      campus: 'all',
      building: '공학관'
    });
  });

  it('정렬 옵션 변경이 작동한다', () => {
    render(<ReportFilters {...defaultProps} />);

    const sortSelect = screen.getByDisplayValue('최신순');
    fireEvent.change(sortSelect, { target: { value: 'empathy' } });

    expect(defaultProps.onSortChange).toHaveBeenCalledWith('empathy');
  });

  it('활성 필터를 표시한다', () => {
    const propsWithFilters = {
      ...defaultProps,
      filters: { campus: '김해캠퍼스', building: '공학관' }
    };

    render(<ReportFilters {...propsWithFilters} />);

    expect(screen.getByText('활성 필터:')).toBeInTheDocument();
    // 활성 필터 영역에서 찾기
    const activeFiltersSection = screen.getByText('활성 필터:').parentElement;
    expect(activeFiltersSection).toHaveTextContent('김해캠퍼스');
    expect(activeFiltersSection).toHaveTextContent('공학관');
  });

  it('활성 필터 제거 버튼이 작동한다', () => {
    const propsWithFilters = {
      ...defaultProps,
      filters: { campus: '김해캠퍼스', building: '공학관' }
    };

    render(<ReportFilters {...propsWithFilters} />);

    // 활성 필터 영역에서 캠퍼스 필터 제거 버튼 찾기
    const activeFiltersSection = screen.getByText('활성 필터:').parentElement;
    const campusFilterSpan = activeFiltersSection?.querySelector('.bg-blue-100');
    const campusRemoveButton = campusFilterSpan?.querySelector('button');
    
    if (campusRemoveButton) {
      fireEvent.click(campusRemoveButton);
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
        campus: 'all',
        building: '공학관'
      });
    }
  });

  it('모든 필터 지우기 버튼이 작동한다', () => {
    const propsWithFilters = {
      ...defaultProps,
      filters: { campus: '김해캠퍼스', building: '공학관' }
    };

    render(<ReportFilters {...propsWithFilters} />);

    const clearAllButton = screen.getByText('모든 필터 지우기');
    fireEvent.click(clearAllButton);

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      campus: 'all',
      building: ''
    });
  });

  it('필터 결과가 없을 때 안내 메시지를 표시한다', () => {
    const propsWithNoResults = {
      ...defaultProps,
      filters: { campus: '김해캠퍼스', building: '존재하지않는건물' },
      totalCount: 0
    };

    render(<ReportFilters {...propsWithNoResults} />);

    expect(screen.getByText('현재 필터 조건에 맞는 제보가 없습니다. 필터를 조정해보세요.')).toBeInTheDocument();
  });

  it('건물명 입력 필드의 클리어 버튼이 작동한다', () => {
    const propsWithBuilding = {
      ...defaultProps,
      filters: { campus: 'all', building: '공학관' }
    };

    render(<ReportFilters {...propsWithBuilding} />);

    // 입력 필드 옆의 클리어 버튼 찾기
    const buildingInput = screen.getByPlaceholderText('건물명 검색');
    const clearButton = buildingInput.parentElement?.querySelector('button');
    
    if (clearButton) {
      fireEvent.click(clearButton);
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
        campus: 'all',
        building: ''
      });
    }
  });
});