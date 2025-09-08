
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { EmpathyButton } from '../EmpathyButton';
import { EmpathyService } from '../../../services/empathyService';
import { ApiErrorCode } from '../../../types';

// Mock the EmpathyService
vi.mock('../../../services/empathyService');
const mockEmpathyService = EmpathyService as any;

describe('EmpathyButton', () => {
  const defaultProps = {
    reportId: 'test-report-id',
    initialEmpathyCount: 5
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with initial empathy count', () => {
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: false,
      empathyCount: 5
    });

    render(<EmpathyButton {...defaultProps} />);
    
    expect(screen.getByText('🙋‍♂️ 저도 겪고 있어요')).toBeInTheDocument();
    expect(screen.getByText('5명이 같은 문제를 겪고 있습니다')).toBeInTheDocument();
  });

  it('shows empathy completed state when user has already empathized', async () => {
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: true,
      empathyCount: 6
    });

    render(<EmpathyButton {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('공감 완료')).toBeInTheDocument();
      expect(screen.getByText('6명이 같은 문제를 겪고 있습니다')).toBeInTheDocument();
    });
  });

  it('adds empathy when button is clicked and user has not empathized', async () => {
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: false,
      empathyCount: 5
    });
    mockEmpathyService.addEmpathy.mockResolvedValue({
      empathyCount: 6
    });

    render(<EmpathyButton {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('🙋‍♂️ 저도 겪고 있어요')).toBeInTheDocument();
    });

    const button = screen.getByText('🙋‍♂️ 저도 겪고 있어요');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockEmpathyService.addEmpathy).toHaveBeenCalledWith('test-report-id');
      expect(screen.getByRole('button', { name: '공감 완료' })).toBeInTheDocument();
      expect(screen.getByText('6명이 같은 문제를 겪고 있습니다')).toBeInTheDocument();
    });
  });

  it('shows duplicate empathy message when user tries to empathize again', async () => {
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: true,
      empathyCount: 6
    });

    render(<EmpathyButton {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '공감 완료' })).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: '공감 완료' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('이미 공감하셨습니다')).toBeInTheDocument();
    });
  });

  it('handles duplicate empathy error from server', async () => {
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: false,
      empathyCount: 5
    });
    
    const error = {
      response: {
        data: {
          error: {
            code: ApiErrorCode.DUPLICATE_EMPATHY
          }
        }
      }
    };
    mockEmpathyService.addEmpathy.mockRejectedValue(error);

    render(<EmpathyButton {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('🙋‍♂️ 저도 겪고 있어요')).toBeInTheDocument();
    });

    const button = screen.getByText('🙋‍♂️ 저도 겪고 있어요');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('이미 공감하셨습니다')).toBeInTheDocument();
    });
  });

  it('shows loading state when processing empathy', async () => {
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: false,
      empathyCount: 5
    });
    
    // Make addEmpathy hang to test loading state
    mockEmpathyService.addEmpathy.mockImplementation(() => new Promise(() => {}));

    render(<EmpathyButton {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('🙋‍♂️ 저도 겪고 있어요')).toBeInTheDocument();
    });

    const button = screen.getByText('🙋‍♂️ 저도 겪고 있어요');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('처리 중...')).toBeInTheDocument();
    });
  });

  it('handles general errors gracefully', async () => {
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: false,
      empathyCount: 5
    });
    mockEmpathyService.addEmpathy.mockRejectedValue(new Error('Network error'));

    render(<EmpathyButton {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('🙋‍♂️ 저도 겪고 있어요')).toBeInTheDocument();
    });

    const button = screen.getByText('🙋‍♂️ 저도 겪고 있어요');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('공감 처리 중 오류가 발생했습니다')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: false,
      empathyCount: 5
    });

    const { container } = render(
      <EmpathyButton {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});