import React, { useState, useEffect } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  action: 'edit' | 'delete' | null;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  action,
  onSubmit,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    if (password.length !== 4) {
      setError('4자리 숫자를 입력해주세요.');
      return;
    }

    if (!/^\d{4}$/.test(password)) {
      setError('숫자만 입력 가능합니다.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(password);
    } catch (err) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPassword(value);
    if (error) setError('');
  };

  const getActionText = () => {
    switch (action) {
      case 'edit':
        return '수정';
      case 'delete':
        return '삭제';
      default:
        return '';
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full mx-4 shadow-strong">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-secondary-800 flex items-center">
            🔒 제보 {getActionText()}
          </h3>
        </div>
        
        <div className="card-body">
          <p className="text-secondary-600 mb-6 text-sm sm:text-base">
            제보를 {getActionText()}하려면 작성 시 입력한 4자리 비밀번호를 입력해주세요.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                🔢 비밀번호 (4자리 숫자)
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••"
                className="form-input text-center text-lg sm:text-xl tracking-widest font-mono"
                maxLength={4}
                autoFocus
              />
              {error && (
                <p className="form-error">{error}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary flex-1 order-2 sm:order-1"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className={`flex-1 order-1 sm:order-2 ${
                  action === 'delete' ? 'btn-error' : 'btn-primary'
                }`}
                disabled={isSubmitting || !password}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    확인 중...
                  </span>
                ) : (
                  <>
                    {action === 'delete' ? '🗑️' : '✏️'} {getActionText()}하기
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;