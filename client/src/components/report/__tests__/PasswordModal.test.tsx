import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import PasswordModal from '../PasswordModal';

describe('PasswordModal', () => {
  const defaultProps = {
    isOpen: true,
    action: 'edit' as const,
    onSubmit: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('모달이 열려있을 때 올바르게 렌더링된다', () => {
    render(<PasswordModal {...defaultProps} />);

    expect(screen.getByText('제보 수정')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••')).toBeInTheDocument();
    expect(screen.getByText('수정하기')).toBeInTheDocument();
    expect(screen.getByText('취소')).toBeInTheDocument();
  });

  it('삭제 액션일 때 올바른 텍스트를 표시한다', () => {
    render(<PasswordModal {...defaultProps} action="delete" />);

    expect(screen.getByText('제보 삭제')).toBeInTheDocument();
    expect(screen.getByText('삭제하기')).toBeInTheDocument();
  });

  it('모달이 닫혀있을 때 렌더링되지 않는다', () => {
    render(<PasswordModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('제보 수정')).not.toBeInTheDocument();
  });

  it('비밀번호 입력이 올바르게 작동한다', () => {
    render(<PasswordModal {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText('••••');
    fireEvent.change(passwordInput, { target: { value: '1234' } });

    expect(passwordInput).toHaveValue('1234');
  });

  it('숫자가 아닌 문자는 입력되지 않는다', () => {
    render(<PasswordModal {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText('••••');
    fireEvent.change(passwordInput, { target: { value: 'abc1' } });

    expect(passwordInput).toHaveValue('1');
  });

  it('4자리를 초과하는 입력은 제한된다', () => {
    render(<PasswordModal {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText('••••');
    fireEvent.change(passwordInput, { target: { value: '12345' } });

    expect(passwordInput).toHaveValue('1234');
  });

  it('올바른 비밀번호로 제출할 수 있다', async () => {
    render(<PasswordModal {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText('••••');
    const submitButton = screen.getByText('수정하기');

    fireEvent.change(passwordInput, { target: { value: '1234' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('1234');
    });
  });

  it('빈 비밀번호로 제출 시 에러 메시지를 표시한다', async () => {
    render(<PasswordModal {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText('••••');
    const submitButton = screen.getByText('수정하기');

    // 먼저 값을 입력했다가 지워서 버튼을 활성화시킨 후 빈 값으로 제출
    fireEvent.change(passwordInput, { target: { value: '1' } });
    fireEvent.change(passwordInput, { target: { value: '' } });
    
    // 폼 제출 이벤트 직접 발생
    const form = submitButton.closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
    });
  });

  it('4자리가 아닌 비밀번호로 제출 시 에러 메시지를 표시한다', async () => {
    render(<PasswordModal {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText('••••');
    const submitButton = screen.getByText('수정하기');

    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('4자리 숫자를 입력해주세요.')).toBeInTheDocument();
    });
  });

  it('취소 버튼 클릭 시 onCancel이 호출된다', () => {
    render(<PasswordModal {...defaultProps} />);

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('비밀번호가 없을 때 제출 버튼이 비활성화된다', () => {
    render(<PasswordModal {...defaultProps} />);

    const submitButton = screen.getByText('수정하기');
    expect(submitButton).toBeDisabled();
  });
});