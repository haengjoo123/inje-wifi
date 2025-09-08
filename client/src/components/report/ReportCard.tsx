import React from 'react';
import { Report } from '../../types';

interface ReportCardProps {
  report: Report;
  onClick: (report: Report) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onClick }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  return (
    <div 
      className="card hover:shadow-medium transition-all duration-200 cursor-pointer group"
      onClick={() => onClick(report)}
    >
      <div className="card-body">
      {/* 헤더 - 캠퍼스와 작성일 */}
      <div className="flex justify-between items-start mb-4">
        <span className="badge-primary">
          📍 {report.campus}
        </span>
        <span className="text-sm text-secondary-500">
          {formatDate(report.createdAt)}
        </span>
      </div>

      {/* 위치 정보 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-secondary-800 mb-1 group-hover:text-primary-600 transition-colors duration-200">
          🏢 {report.building}
        </h3>
        <p className="text-sm text-secondary-600 flex items-center">
          <span className="mr-1">📍</span>
          {report.location}
        </p>
      </div>

      {/* 문제 유형 */}
      <div className="mb-4">
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

      {/* 설명 미리보기 */}
      <div className="mb-4">
        <p className="text-secondary-700 text-sm leading-relaxed overflow-hidden" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {report.description}
        </p>
      </div>

      {/* 하단 - 공감 수 */}
      <div className="flex justify-between items-center pt-4 border-t border-secondary-100">
        <div className="flex items-center text-sm text-secondary-600">
          <span className="mr-2 text-base">🙋‍♂️</span>
          <span>
            <span className="font-medium text-primary-600">{report.empathyCount}명</span>이 같은 문제를 겪고 있습니다
          </span>
        </div>
        <div className="text-sm text-primary-600 font-medium group-hover:text-primary-700 transition-colors duration-200">
          자세히 보기 →
        </div>
      </div>
      </div>
    </div>
  );
};

export default ReportCard;