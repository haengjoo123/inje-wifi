import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ReportCard from '../ReportCard';
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

describe('ReportCard', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('제보 정보를 올바르게 렌더링한다', () => {
    render(<ReportCard report={mockReport} onClick={mockOnClick} />);

    expect(screen.getByText('김해캠퍼스')).toBeInTheDocument();
    expect(screen.getByText('공학관')).toBeInTheDocument();
    expect(screen.getByText('3층 컴퓨터실')).toBeInTheDocument();
    expect(screen.getByText('WiFi 신호 약함')).toBeInTheDocument();
    expect(screen.getByText('WiFi 연결 끊김')).toBeInTheDocument();
    expect(screen.getByText('특정 시간대 문제')).toBeInTheDocument();
    expect(screen.getByText('5명이 같은 문제를 겪고 있습니다')).toBeInTheDocument();
  });

  it('카드 클릭 시 onClick 핸들러가 호출된다', () => {
    render(<ReportCard report={mockReport} onClick={mockOnClick} />);

    const card = screen.getByText('공학관').closest('div');
    
    if (card) {
      fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalledWith(mockReport);
    }
  });

  it('설명이 길 때 적절히 표시된다', () => {
    render(<ReportCard report={mockReport} onClick={mockOnClick} />);

    const description = screen.getByText(/오후 2시경부터 와이파이 연결이/);
    expect(description).toBeInTheDocument();
  });

  it('공감 수가 0일 때도 올바르게 표시된다', () => {
    const reportWithZeroEmpathy = { ...mockReport, empathyCount: 0 };
    render(<ReportCard report={reportWithZeroEmpathy} onClick={mockOnClick} />);

    expect(screen.getByText('0명이 같은 문제를 겪고 있습니다')).toBeInTheDocument();
  });

  it('커스텀 문제가 없을 때도 올바르게 렌더링된다', () => {
    const reportWithoutCustomProblem = { ...mockReport, customProblem: undefined };
    render(<ReportCard report={reportWithoutCustomProblem} onClick={mockOnClick} />);

    expect(screen.getByText('WiFi 신호 약함')).toBeInTheDocument();
    expect(screen.getByText('WiFi 연결 끊김')).toBeInTheDocument();
    expect(screen.queryByText('특정 시간대 문제')).not.toBeInTheDocument();
  });
});