import React, { useState, useEffect } from 'react';
import { EmpathyService } from '../../services/empathyService';
import { ApiErrorCode } from '../../types';

interface EmpathyButtonProps {
  reportId: string;
  initialEmpathyCount: number;
  onEmpathyUpdate?: (newCount: number) => void;
  className?: string;
}

export const EmpathyButton: React.FC<EmpathyButtonProps> = ({
  reportId,
  initialEmpathyCount,
  onEmpathyUpdate,
  className = ''
}) => {
  const [empathyCount, setEmpathyCount] = useState(initialEmpathyCount);
  const [hasEmpathy, setHasEmpathy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // initialEmpathyCount가 변경되면 상태 업데이트
  useEffect(() => {
    setEmpathyCount(initialEmpathyCount);
  }, [initialEmpathyCount]);

  // 컴포넌트 마운트 시 사용자의 공감 여부 확인
  useEffect(() => {
    const checkEmpathyStatus = async () => {
      try {
        const empathyStatus = await EmpathyService.checkUserEmpathy(reportId);
        setHasEmpathy(empathyStatus.hasEmpathy);
        setEmpathyCount(empathyStatus.empathyCount);
      } catch (error) {
        console.error('공감 상태 확인 실패:', error);
      }
    };

    checkEmpathyStatus();
  }, [reportId]);

  const handleEmpathyClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setMessage('');

    try {
      if (hasEmpathy) {
        // 이미 공감한 경우 메시지 표시
        setMessage('이미 공감하셨습니다');
        setTimeout(() => setMessage(''), 3000);
      } else {
        // 공감 추가
        const result = await EmpathyService.addEmpathy(reportId);
        setEmpathyCount(result.empathyCount);
        setHasEmpathy(true);
        setMessage('공감 완료');
        
        // 부모 컴포넌트에 업데이트 알림
        if (onEmpathyUpdate) {
          onEmpathyUpdate(result.empathyCount);
        }
        
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error: any) {
      console.error('공감 처리 실패:', error);
      
      // 에러 메시지 처리
      if (error.response?.data?.error?.code === ApiErrorCode.DUPLICATE_EMPATHY) {
        setMessage('이미 공감하셨습니다');
        setHasEmpathy(true);
      } else {
        setMessage('공감 처리 중 오류가 발생했습니다');
      }
      
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = hasEmpathy ? '✅ 공감 완료' : '🙋‍♂️ 저도 겪고 있어요';
  const buttonClass = hasEmpathy ? 'btn-success' : 'btn-primary';

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <button
        onClick={handleEmpathyClick}
        disabled={isLoading}
        className={`${buttonClass} btn-lg ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            처리 중...
          </span>
        ) : buttonText}
      </button>
      
      <div className="text-center">
        <p className="text-lg font-semibold text-primary-600">
          {empathyCount}명
        </p>
        <p className="text-sm text-secondary-600">
          이 같은 문제를 겪고 있습니다
        </p>
      </div>
      
      {message && (
        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
          message.includes('완료') 
            ? 'bg-success-100 text-success-700 border border-success-200' 
            : 'bg-error-100 text-error-700 border border-error-200'
        }`}>
          {message.includes('완료') ? '✅' : '⚠️'} {message}
        </div>
      )}
    </div>
  );
};

export default EmpathyButton;