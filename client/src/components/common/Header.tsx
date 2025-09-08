import { Link, useLocation } from 'react-router-dom'

const Header = () => {
  const location = useLocation()

  return (
    <header className="bg-primary-600 text-white shadow-strong sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold hover:text-primary-100 transition-colors duration-200"
          >
            <span className="hidden sm:inline">인제대학교 와이파이 제보 시스템</span>
            <span className="sm:hidden">와이파이 제보</span>
          </Link>
          <nav className="flex items-center space-x-2 sm:space-x-4">
            <Link
              to="/reports"
              className={`px-3 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base ${location.pathname === '/reports'
                  ? 'bg-primary-700 text-white'
                  : 'hover:bg-primary-700 hover:text-primary-100'
                }`}
            >
              <span className="hidden sm:inline">제보 목록</span>
              <span className="sm:hidden">목록</span>
            </Link>
            <Link
              to="/report"
              className={`btn-primary btn-sm sm:btn text-sm sm:text-base ${location.pathname === '/report' ? 'bg-primary-700' : ''
                }`}
            >
              <span className="hidden sm:inline">문제 제보하기</span>
              <span className="sm:hidden">제보</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header