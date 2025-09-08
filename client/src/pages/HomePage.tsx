import { Link } from 'react-router-dom'

const HomePage = () => {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-16">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary-800 mb-6 text-balance">
            인제대학교 와이파이 문제 제보 시스템
          </h1>
          <p className="text-lg sm:text-xl text-secondary-600 mb-8 max-w-2xl mx-auto text-balance">
            캠퍼스 내 와이파이 문제를 제보하고 공유하여 더 나은 네트워크 환경을 만들어가세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/report" className="btn-primary btn-lg w-full sm:w-auto">
              📝 문제 제보하기
            </Link>
            <Link to="/reports" className="btn-secondary btn-lg w-full sm:w-auto">
              📋 제보 목록 보기
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card text-center">
            <div className="card-body">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-lg font-semibold text-secondary-800 mb-2">정확한 위치 제보</h3>
              <p className="text-secondary-600 text-sm">
                캠퍼스와 건물을 선택하여 문제 발생 위치를 정확하게 알려주세요
              </p>
            </div>
          </div>
          
          <div className="card text-center">
            <div className="card-body">
              <div className="text-4xl mb-4">🙋‍♂️</div>
              <h3 className="text-lg font-semibold text-secondary-800 mb-2">공감 기능</h3>
              <p className="text-secondary-600 text-sm">
                같은 문제를 겪고 있다면 공감을 표시하여 문제의 심각성을 알려주세요
              </p>
            </div>
          </div>
          
          <div className="card text-center">
            <div className="card-body">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-lg font-semibold text-secondary-800 mb-2">제보 전달</h3>
              <p className="text-secondary-600 text-sm">
                제보된 문제들을 학교에 건의하여 빠르게 해결하겠습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="card">
          <div className="card-body text-center">
            <h2 className="text-2xl font-bold text-secondary-800 mb-6">함께 만드는 더 나은 캠퍼스</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-primary-600">📊</div>
                <div className="text-sm text-secondary-600 mt-1">실시간 모니터링</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success-600">✅</div>
                <div className="text-sm text-secondary-600 mt-1">빠른 대응</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning-600">🎯</div>
                <div className="text-sm text-secondary-600 mt-1">우선순위 관리</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-600">🤝</div>
                <div className="text-sm text-secondary-600 mt-1">학생 참여</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage