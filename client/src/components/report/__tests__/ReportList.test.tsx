import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ReportList from '../ReportList';
import { Report, SortOption, FilterOptions } from '../../../types';

const mockReports: Report[] = [
  {
    id: '1',
    campus: '김해캠퍼스',
    building: '공학관',
    location: '3층 컴퓨터실',
    problemTypes: ['WiFi 신호 약함'],
    description: '와이파이 신호가 약합니다.',
    empathyCount: 5,
    createdAt: new Date('2024-01-15T14:30:00Z'),
    updatedAt: new Date('2024-01-15T14:30:00Z')
  },
  {
    id: '2',
    campus: '부산캠퍼스',
    building: '본관',
    location: '2층 강의실',
    problemTypes: ['WiFi 연결 끊김'],
    description: '와이파이 연결이 자주 끊어집니다.',
    empathyCount: 3,
    createdAt: new Date('2024-01-14T10:00:00Z'),
    updatedAt: new Date('2024-01-14T10:00:00Z')
  }
];

describe('ReportList', () => {
  const defaultProps = {
    reports: mockReports,
    sortBy: 'latest' as SortOption,
    filters: { campus: 'all', building: '' } as FilterOptions,
    onSortChange: vi.fn(),
    onFilterChange: vi.fn(),
    onReportClick: vi.fn(),
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로딩 중일 때 스피너를 표시한다', () => {
    render(<ReportList {...defaultProps} isLoading={true} />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('제보가 없을 때 빈 상태를 표시한다', () => {
    render(<ReportList {...defaultProps} reports={[]} />);
    
    expect(screen.getByText('아직 제보가 없습니다')).toBeInTheDocument();
    expect(screen.getByText('첫 번째 와이파이 문제를 제보해보세요!')).toBeInTheDocument();
  });

  it('제보 목록을 올바르게 렌더링한다', () => {
    render(<ReportList {...defaultProps} />);
    
    expect(screen.getByText('공학관')).toBeInTheDocument();
    expect(screen.getByText('본관')).toBeInTheDocument();
    expect(screen.getByText('총 2개의 제보')).toBeInTheDocument();
  });

  it('정렬 옵션 변경이 작동한다', () => {
    render(<ReportList {...defaultProps} />);
    
    const sortSelect = screen.getByDisplayValue('최신순');
    fireEvent.change(sortSelect, { target: { value: 'empathy' } });
    
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('empathy');
  });

  it('캠퍼스 필터 변경이 작동한다', () => {
    render(<ReportList {...defaultProps} />);
    
    const campusSelect = screen.getByDisplayValue('전체 캠퍼스');
    fireEvent.change(campusSelect, { target: { value: '김해캠퍼스' } });
    
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      campus: '김해캠퍼스',
      building: ''
    });
  });

  it('건물명 필터 변경이 작동한다', () => {
    render(<ReportList {...defaultProps} />);
    
    const buildingInput = screen.getByPlaceholderText('건물명 검색');
    fireEvent.change(buildingInput, { target: { value: '공학관' } });
    
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      campus: 'all',
      building: '공학관'
    });
  });

  it('활성 필터를 표시하고 제거할 수 있다', () => {
    const propsWithFilters = {
      ...defaultProps,
      filters: { campus: '김해캠퍼스', building: '공학관' }
    };
    
    render(<ReportList {...propsWithFilters} />);
    
    expect(screen.getByText('활성 필터:')).toBeInTheDocument();
    expect(screen.getByText('건물: 공학관')).toBeInTheDocument();
    
    // 필터 제거 버튼 클릭
    const removeButtons = screen.getAllByText('×');
    fireEvent.click(removeButtons[0]);
    
    expect(defaultProps.onFilterChange).toHaveBeenCalled();
  });
});