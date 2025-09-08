import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ReportDetail from '../ReportDetail';
import { Report } from '../../../types';

const mockReport: Report = {
  id: '1',
  campus: '김해캠퍼스',
  building: '공학관',
  location: '3층 컴퓨터실',
  problemTypes: ['WiFi 신호 약함', 'WiFi 연결 끊김'],
  customProblem: '특정 시간대 문제',
  description: '오후 2시경부터 와이파이 연결이 자주 끊어지고 신호가 약해집니다. 수업 중에 인터넷을 사용할 수 없어서 불편합니다.',
  empathyCount: 5,
  createdAt: new Date('2024-01-15T14:30:00Z'),
  updatedAt: new Date('2024-01-15T14:30:00Z')
};

describe('ReportDetail', () => {
  const defaultProps = {
    report: mockReport,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('제보 상세 정보를 올바르게 렌더링한다', () => {
    render(<ReportDetail {...defaultProps} />);

    expect(screen.getByText('김해캠퍼스')).toBeInTheDocument();
    expect(screen.getByText('공학관')).toBeInTheDocument();
    expect(screen.getByText('3층 컴퓨터실')).toBeInTheDocument();
    expect(screen.getByText('WiFi 신호 약함')).toBeInTheDocument();
    expect(screen.getByText('WiFi 연결 끊김')).toBeInTheDocument();
    expect(screen.getByText('특정 시간대 문제')).toBeInTheDocument();
    expect(screen.getByText('5명이 같은 문제를 겪고 있습니다')).toBeInTheDocument();
  });

  it('제보 설명을 올바르게 표시한다', () => {
    render(<ReportDetail {...defaultProps} />);

    expect(screen.getByText(/오후 2시경부터 와이파이 연결이/)).toBeInTheDocument();
  });

  it('수정 버튼 클릭 시 비밀번호 모달이 열린다', () => {
    render(<ReportDetail {...defaultProps} />);

    const editButton = screen.getByText('수정하기');
    fireEvent.click(editButton);

    expect(screen.getByText('제보 수정')).toBeInTheDocument();
  });

  it('삭제 버튼 클릭 시 비밀번호 모달이 열린다', () => {
    render(<ReportDetail {...defaultProps} />);

    const deleteButton = screen.getByText('삭제하기');
    fireEvent.click(deleteButton);

    expect(screen.getByText('제보 삭제')).toBeInTheDocument();
  });

  it('로딩 상태를 올바르게 표시한다', () => {
    render(<ReportDetail {...defaultProps} isLoading={true} />);

    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('공감 수가 0일 때도 올바르게 표시한다', () => {
    const reportWithZeroEmpathy = { ...mockReport, empathyCount: 0 };
    render(<ReportDetail {...defaultProps} report={reportWithZeroEmpathy} />);

    expect(screen.getByText('0명이 같은 문제를 겪고 있습니다')).toBeInTheDocument();
  });

  it('커스텀 문제가 없을 때도 올바르게 렌더링된다', () => {
    const reportWithoutCustomProblem = { ...mockReport, customProblem: undefined };
    render(<ReportDetail {...defaultProps} report={reportWithoutCustomProblem} />);

    expect(screen.getByText('WiFi 신호 약함')).toBeInTheDocument();
    expect(screen.getByText('WiFi 연결 끊김')).toBeInTheDocument();
    expect(screen.queryByText('특정 시간대 문제')).not.toBeInTheDocument();
  });
});