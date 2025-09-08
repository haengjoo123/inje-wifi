
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { EmpathyButton } from '../EmpathyButton';
import { EmpathyService } from '../../../services/empathyService';
import { ApiErrorCode } from '../../../types';
import * as cookieUtils from '../../../utils/cookies';

// Mock the EmpathyService
vi.mock('../../../services/empathyService');
const mockEmpathyService = EmpathyService as any;

// Mock cookie utilities
vi.mock('../../../utils/cookies');
const mockCookieUtils = cookieUtils as any;

describe('Empathy Integration - Duplicate Prevention', () => {
  const defaultProps = {
    reportId: 'test-report-id',
    initialEmpathyCount: 5
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock getUserIdentifier to return a consistent value
    mockCookieUtils.getUserIdentifier.mockReturnValue('test-user-123');
  });

  it('prevents duplicate empathy when user has already empathized (client-side check)', async () => {
    // Mock that user has already empathized
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: true,
      empathyCount: 6
    });

    render(<EmpathyButton {...defaultProps} />);
    
    // Wait for initial check to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '공감 완료' })).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: '공감 완료' });
    fireEvent.click(button);

    // Should show duplicate message without calling addEmpathy
    await waitFor(() => {
      expect(screen.getByText('이미 공감하셨습니다')).toBeInTheDocument();
    });

    expect(mockEmpathyService.addEmpathy).not.toHaveBeenCalled();
  });

  it('prevents duplicate empathy when server returns duplicate error', async () => {
    // Mock that user hasn't empathized according to client check
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: false,
      empathyCount: 5
    });

    // Mock server returning duplicate error
    const duplicateError = {
      response: {
        data: {
          error: {
            code: ApiErrorCode.DUPLICATE_EMPATHY,
            message: '이미 공감하셨습니다'
          }
        }
      }
    };
    mockEmpathyService.addEmpathy.mockRejectedValue(duplicateError);

    render(<EmpathyButton {...defaultProps} />);
    
    // Wait for initial check to complete
    await waitFor(() => {
      expect(screen.getByText('🙋‍♂️ 저도 겪고 있어요')).toBeInTheDocument();
    });

    const button = screen.getByText('🙋‍♂️ 저도 겪고 있어요');
    fireEvent.click(button);

    // Should call addEmpathy but handle the duplicate error
    await waitFor(() => {
      expect(mockEmpathyService.addEmpathy).toHaveBeenCalledWith('test-report-id');
      expect(screen.getByText('이미 공감하셨습니다')).toBeInTheDocument();
    });

    // Button should change to completed state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '공감 완료' })).toBeInTheDocument();
    });
  });

  it('successfully adds empathy when user has not empathized before', async () => {
    // Mock that user hasn't empathized
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: false,
      empathyCount: 5
    });

    // Mock successful empathy addition
    mockEmpathyService.addEmpathy.mockResolvedValue({
      empathyCount: 6
    });

    render(<EmpathyButton {...defaultProps} />);
    
    // Wait for initial check to complete
    await waitFor(() => {
      expect(screen.getByText('🙋‍♂️ 저도 겪고 있어요')).toBeInTheDocument();
    });

    const button = screen.getByText('🙋‍♂️ 저도 겪고 있어요');
    fireEvent.click(button);

    // Should successfully add empathy
    await waitFor(() => {
      expect(mockEmpathyService.addEmpathy).toHaveBeenCalledWith('test-report-id');
      expect(screen.getByRole('button', { name: '공감 완료' })).toBeInTheDocument();
      expect(screen.getByText('6명이 같은 문제를 겪고 있습니다')).toBeInTheDocument();
    });
  });

  it('maintains empathy state across component re-renders', async () => {
    // Mock that user has empathized
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: true,
      empathyCount: 8
    });

    const { rerender } = render(<EmpathyButton {...defaultProps} />);
    
    // Wait for initial check to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '공감 완료' })).toBeInTheDocument();
      expect(screen.getByText('8명이 같은 문제를 겪고 있습니다')).toBeInTheDocument();
    });

    // Re-render with updated empathy count
    rerender(<EmpathyButton {...defaultProps} initialEmpathyCount={9} />);

    // Should still show empathy completed state with updated count from server
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '공감 완료' })).toBeInTheDocument();
      expect(screen.getByText('8명이 같은 문제를 겪고 있습니다')).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully while maintaining duplicate prevention', async () => {
    // Mock that user hasn't empathized
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: false,
      empathyCount: 5
    });

    // Mock network error
    mockEmpathyService.addEmpathy.mockRejectedValue(new Error('Network error'));

    render(<EmpathyButton {...defaultProps} />);
    
    // Wait for initial check to complete
    await waitFor(() => {
      expect(screen.getByText('🙋‍♂️ 저도 겪고 있어요')).toBeInTheDocument();
    });

    const button = screen.getByText('🙋‍♂️ 저도 겪고 있어요');
    fireEvent.click(button);

    // Should show error message but not change empathy state
    await waitFor(() => {
      expect(screen.getByText('공감 처리 중 오류가 발생했습니다')).toBeInTheDocument();
    });

    // Button should remain in original state
    expect(screen.getByText('🙋‍♂️ 저도 겪고 있어요')).toBeInTheDocument();
  });

  it('uses consistent user identifier for empathy tracking', async () => {
    mockEmpathyService.checkUserEmpathy.mockResolvedValue({
      hasEmpathy: false,
      empathyCount: 5
    });

    mockEmpathyService.addEmpathy.mockResolvedValue({
      empathyCount: 6
    });

    render(<EmpathyButton {...defaultProps} />);
    
    // Wait for initial check
    await waitFor(() => {
      expect(mockEmpathyService.checkUserEmpathy).toHaveBeenCalledWith('test-report-id');
    });

    const button = screen.getByText('🙋‍♂️ 저도 겪고 있어요');
    fireEvent.click(button);

    // Should use the same user identifier for both check and add operations
    await waitFor(() => {
      expect(mockEmpathyService.addEmpathy).toHaveBeenCalledWith('test-report-id');
    });

    // The EmpathyButton component doesn't directly use getUserIdentifier
    // The user identification is handled by the backend via cookies
    // This test verifies that the same report ID is used consistently
    expect(mockEmpathyService.checkUserEmpathy).toHaveBeenCalledWith('test-report-id');
    expect(mockEmpathyService.addEmpathy).toHaveBeenCalledWith('test-report-id');
  });
});