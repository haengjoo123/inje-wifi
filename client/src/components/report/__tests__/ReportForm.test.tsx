import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportForm from '../ReportForm';

describe('ReportForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders all form fields', () => {
    render(<ReportForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/캠퍼스/)).toBeInTheDocument();
    expect(screen.getByLabelText(/건물명/)).toBeInTheDocument();
    expect(screen.getByLabelText(/상세 위치/)).toBeInTheDocument();
    expect(screen.getByText(/문제 유형/)).toBeInTheDocument();
    expect(screen.getByLabelText(/문제 상세 설명/)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /제보하기/ })).toBeInTheDocument();
  });

  it('shows custom problem field when 기타 is selected', async () => {
    render(<ReportForm onSubmit={mockOnSubmit} />);

    const otherCheckbox = screen.getByRole('checkbox', { name: /기타/ });
    fireEvent.click(otherCheckbox);

    await waitFor(() => {
      expect(screen.getByLabelText(/기타 문제 상세 내용/)).toBeInTheDocument();
    });
  });

  it('validates required fields on submit', async () => {
    render(<ReportForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /제보하기/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getAllByText(/필수 입력 항목입니다/).length).toBeGreaterThan(0);
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates password format', async () => {
    render(<ReportForm onSubmit={mockOnSubmit} />);

    const passwordInput = screen.getByLabelText(/비밀번호/);
    fireEvent.change(passwordInput, { target: { value: 'abc' } });

    await waitFor(() => {
      expect(screen.getByText(/숫자만 입력 가능합니다/)).toBeInTheDocument();
    });
  });

  it('validates description minimum length', async () => {
    render(<ReportForm onSubmit={mockOnSubmit} />);

    const descriptionInput = screen.getByLabelText(/문제 상세 설명/);
    fireEvent.change(descriptionInput, { target: { value: 'short' } });

    await waitFor(() => {
      expect(screen.getByText(/최소 10자 이상 입력해주세요/)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<ReportForm onSubmit={mockOnSubmit} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/캠퍼스/), { target: { value: '김해캠퍼스' } });
    fireEvent.change(screen.getByLabelText(/건물명/), { target: { value: '공학관' } });
    fireEvent.change(screen.getByLabelText(/상세 위치/), { target: { value: '3층 301호' } });
    
    const wifiCheckbox = screen.getByRole('checkbox', { name: /WiFi 신호 약함/ });
    fireEvent.click(wifiCheckbox);
    
    fireEvent.change(screen.getByLabelText(/문제 상세 설명/), { 
      target: { value: 'This is a detailed description of the wifi problem that is long enough for validation' } 
    });
    fireEvent.change(screen.getByLabelText(/비밀번호/), { target: { value: '1234' } });

    const submitButton = screen.getByRole('button', { name: /제보하기/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        campus: '김해캠퍼스',
        building: '공학관',
        location: '3층 301호',
        problemTypes: ['WiFi 신호 약함'],
        description: 'This is a detailed description of the wifi problem that is long enough for validation',
        password: '1234'
      });
    });
  });

  it('disables building input when no campus is selected', () => {
    render(<ReportForm onSubmit={mockOnSubmit} />);

    const buildingInput = screen.getByLabelText(/건물명/);
    expect(buildingInput).toBeDisabled();
  });

  it('enables building input when campus is selected', async () => {
    render(<ReportForm onSubmit={mockOnSubmit} />);

    const campusSelect = screen.getByLabelText(/캠퍼스/);
    fireEvent.change(campusSelect, { target: { value: '김해캠퍼스' } });

    await waitFor(() => {
      const buildingInput = screen.getByLabelText(/건물명/);
      expect(buildingInput).not.toBeDisabled();
    });
  });
});