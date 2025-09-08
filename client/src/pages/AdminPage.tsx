import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminService, { ExportDataResponse, AdminStats } from '../services/adminService';
import ReportService from '../services/reportService';
import { Report } from '../types';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 통계 데이터
  const [stats, setStats] = useState<AdminStats | null>(null);
  
  // 제보 목록
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  
  // 내보내기 데이터
  const [exportData, setExportData] = useState<ExportDataResponse | null>(null);

  // 로컬 스토리지에서 관리자 키 확인
  useEffect(() => {
    const savedKey = localStorage.getItem('admin_key');
    if (savedKey) {
      setAdminKey(savedKey);
      verifyAndSetAuth(savedKey);
    }
  }, []);

  const verifyAndSetAuth = async (key: string) => {
    try {
      const isValid = await AdminService.verifyAdminKey(key);
      if (isValid) {
        setIsAuthenticated(true);
        localStorage.setItem('admin_key', key);
        loadInitialData(key);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_key');
      }
    } catch (error) {
      console.error('인증 확인 실패:', error);
      setIsAuthenticated(false);
    }
  };

  const loadInitialData = async (key: string) => {
    try {
      // 통계 데이터 로드
      const statsData = await AdminService.getStats(key);
      setStats(statsData);
      
      // 제보 목록 로드
      await loadReports();
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
    }
  };

  const loadReports = async () => {
    try {
      setIsLoadingReports(true);
      const data = await ReportService.getReports({ sort: 'latest' });
      setReports(data);
    } catch (error) {
      console.error('제보 목록 로드 실패:', error);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const isValid = await AdminService.verifyAdminKey(adminKey);
      if (isValid) {
        setIsAuthenticated(true);
        localStorage.setItem('admin_key', adminKey);
        await loadInitialData(adminKey);
        setSuccess('관리자 인증이 완료되었습니다');
      } else {
        setError('잘못된 관리자 키입니다');
      }
    } catch (error) {
      setError('인증 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminKey('');
    setStats(null);
    setReports([]);
    setExportData(null);
    localStorage.removeItem('admin_key');
    setSuccess('로그아웃되었습니다');
  };

  const handleForceDelete = async (reportId: string) => {
    if (!confirm('정말로 이 제보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await AdminService.forceDeleteReport(reportId, adminKey);
      await loadReports(); // 목록 새로고침
      
      if (stats) {
        const updatedStats = await AdminService.getStats(adminKey);
        setStats(updatedStats);
      }
      
      setSuccess('제보가 삭제되었습니다');
    } catch (error: any) {
      setError(error.message || '삭제 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await AdminService.exportAllReports(adminKey);
      setExportData(data);
      
      // 클립보드에 복사
      const excelText = AdminService.generateExcelText(data.reports);
      await navigator.clipboard.writeText(excelText);
      
      setSuccess(`${data.totalCount}개의 제보 데이터가 클립보드에 복사되었습니다. 엑셀에 붙여넣기 하세요.`);
    } catch (error: any) {
      setError(error.message || '데이터 내보내기 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 인증되지 않은 경우 로그인 폼 표시
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              🔐 관리자 로그인
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              관리자 키를 입력하여 관리 기능에 접근하세요
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="admin-key" className="sr-only">
                관리자 키
              </label>
              <input
                id="admin-key"
                name="admin-key"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="관리자 키를 입력하세요"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="alert-error">
                <div className="flex items-center">
                  <div className="text-lg mr-3">⚠️</div>
                  <div>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="alert-success">
                <div className="flex items-center">
                  <div className="text-lg mr-3">✅</div>
                  <div>
                    <p className="text-sm">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || !adminKey.trim()}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '인증 중...' : '로그인'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-primary-600 hover:text-primary-500 text-sm"
              >
                ← 메인 페이지로 돌아가기
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 인증된 경우 관리자 대시보드 표시
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800 mb-2">🛠️ 관리자 대시보드</h1>
          <p className="text-secondary-600">
            제보 관리 및 데이터 내보내기 기능을 제공합니다
          </p>
        </div>
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            메인 페이지
          </button>
          <button
            onClick={handleLogout}
            className="btn-outline"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <div className="alert-error mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-lg mr-3">⚠️</div>
              <div>
                <h3 className="font-medium">오류가 발생했습니다</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="alert-success mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-lg mr-3">✅</div>
              <div>
                <p className="text-sm">{success}</p>
              </div>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-400 hover:text-green-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">전체 제보</h3>
                <p className="text-3xl font-bold text-primary-600">{stats.totalReports}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🆕</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">최근 7일</h3>
                <p className="text-3xl font-bold text-green-600">{stats.recentReports}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🏫</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">캠퍼스별</h3>
                <div className="text-sm text-gray-600">
                  {stats.campusStats.map((stat, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{stat.campus}</span>
                      <span className="font-semibold">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 관리 기능</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleExportData}
            disabled={isLoading}
            className="btn-primary flex items-center"
          >
            <span className="mr-2">📊</span>
            {isLoading ? '내보내는 중...' : '엑셀 데이터 복사'}
          </button>
          
          <button
            onClick={loadReports}
            disabled={isLoadingReports}
            className="btn-secondary flex items-center"
          >
            <span className="mr-2">🔄</span>
            {isLoadingReports ? '로딩 중...' : '제보 목록 새로고침'}
          </button>
        </div>
        
        {exportData && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              📈 총 {exportData.totalCount}개의 제보 데이터가 클립보드에 복사되었습니다.<br />
              Excel에서 Ctrl+V로 붙여넣기 하면 표 형태로 정리됩니다.<br />
              <span className="text-xs text-green-600">내보낸 시간: {exportData.exportedAt}</span>
            </p>
          </div>
        )}
      </div>

      {/* 제보 목록 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">📝 제보 목록 관리</h2>
          <p className="text-sm text-gray-600 mt-1">
            각 제보를 강제로 삭제할 수 있습니다 (비밀번호 불필요)
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제보 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  위치
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  공감
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작성일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {report.problemTypes.join(', ')}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {report.description}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.campus}</div>
                    <div className="text-sm text-gray-500">{report.building} - {report.location}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ❤️ {report.empathyCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleForceDelete(report.id)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                    >
                      🗑️ 삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {reports.length === 0 && !isLoadingReports && (
            <div className="text-center py-8 text-gray-500">
              제보가 없습니다.
            </div>
          )}
          
          {isLoadingReports && (
            <div className="text-center py-8 text-gray-500">
              로딩 중...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
