import React, { useState } from 'react';
import { Report } from '../../types';
import PasswordModal from './PasswordModal';
import { EmpathyButton } from '../empathy/EmpathyButton';

interface ReportDetailProps {
  report: Report;
  onEdit: (password: string) => void;
  onDelete: (password: string) => void;
  onEmpathyUpdate?: (newCount: number) => void;
  isLoading?: boolean;
}

const ReportDetail: React.FC<ReportDetailProps> = ({
  report,
  onEdit,
  onDelete,
  onEmpathyUpdate,
  isLoading = false
}) => {
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    action: 'edit' | 'delete' | null;
  }>({
    isOpen: false,
    action: null
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    });
  };

  const handleEditClick = () => {
    setPasswordModal({ isOpen: true, action: 'edit' });
  };

  const handleDeleteClick = () => {
    setPasswordModal({ isOpen: true, action: 'delete' });
  };

  const handlePasswordSubmit = async (password: string) => {
    try {
      if (passwordModal.action === 'edit') {
        await onEdit(password);
      } else if (passwordModal.action === 'delete') {
        await onDelete(password);
      }
      setPasswordModal({ isOpen: false, action: null });
    } catch (error) {
      // 오류가 발생하면 모달을 닫지 않고 PasswordModal에서 처리하도록 함
      throw error;
    }
  };

  const handlePasswordCancel = () => {
    setPasswordModal({ isOpen: false, action: null });
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="animate-pulse">
            <div className="h-4 bg-secondary-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-secondary-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-secondary-200 rounded"></div>
              <div className="h-4 bg-secondary-200 rounded w-5/6"></div>
              <div className="h-4 bg-secondary-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 sm:px-6 py-4 sm:py-6 text-white">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div className="flex-1">
              <span className="badge-primary bg-white bg-opacity-20 text-white mb-3 inline-block">
                📍 {report.campus}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold mb-2">🏢 {report.building}</h1>
              <p className="text-primary-100 flex items-center">
                <span className="mr-1">📍</span>
                {report.location}
              </p>
            </div>
            <div className="text-left sm:text-right text-primary-100 text-sm">
              <p className="break-words">{formatDate(report.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="card-body">
          {/* 문제 유형 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
              🚨 문제 유형
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.problemTypes.map((type, index) => (
                <span
                  key={index}
                  className="badge-error"
                >
                  {type}
                </span>
              ))}
              {report.customProblem && (
                <span className="badge-warning">
                  {report.customProblem}
                </span>
              )}
            </div>
          </div>

          {/* 상세 설명 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
              📝 상세 설명
            </h3>
            <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
              <p className="text-secondary-700 leading-relaxed whitespace-pre-wrap break-words">
                {report.description}
              </p>
            </div>
          </div>

          {/* 공감 기능 */}
          <div className="mb-6">
            <div className="card bg-primary-50 border-primary-200">
              <div className="card-body text-center">
                <h3 className="text-lg font-semibold text-secondary-800 mb-3">
                  🙋‍♂️ 공감하기
                </h3>
                <p className="text-sm text-secondary-600 mb-4">
                  이 제보에 공감하여 문제의 심각성을 알려주세요
                </p>
                <EmpathyButton
                  reportId={report.id}
                  initialEmpathyCount={report.empathyCount}
                  onEmpathyUpdate={onEmpathyUpdate}
                />
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-secondary-200">
            <button
              onClick={handleEditClick}
              className="btn-primary btn-lg flex-1"
            >
              ✏️ 수정하기
            </button>
            <button
              onClick={handleDeleteClick}
              className="btn-error btn-lg flex-1"
            >
              🗑️ 삭제하기
            </button>
          </div>

          {/* 안내 메시지 */}
          <div className="mt-4 alert-warning">
            <div className="flex items-start">
              <span className="text-lg mr-2 flex-shrink-0">💡</span>
              <p className="text-sm">
                제보를 수정하거나 삭제하려면 작성 시 입력한 4자리 비밀번호가 필요합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 비밀번호 모달 */}
      <PasswordModal
        isOpen={passwordModal.isOpen}
        action={passwordModal.action}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
      />
    </>
  );
};

export default ReportDetail;