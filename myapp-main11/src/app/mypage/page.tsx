import Link from "next/link";
import Image from "next/image";

export default function MyPage() {
  // 임시 사용자 데이터
  const user = {
    name: "홍길동",
    email: "user@example.com",
    joinDate: "2023년 5월 12일",
    profileImage: "/image/profile-placeholder.jpg"
  };

  // 임시 북마크 뉴스 데이터
  const bookmarkedNews = [
    { id: 1, title: "삼성, 폴더블폰 신제품 공개", category: "IT", date: "2일 전", isRead: true },
    { id: 2, title: "국내 경제 성장률 전망치 상승", category: "경제", date: "3일 전", isRead: false },
    { id: 3, title: "AI 기술 발전으로 인한 산업 변화", category: "기술", date: "1주일 전", isRead: true },
  ];

  // 임시 최근 본 뉴스 데이터
  const recentlyViewedNews = [
    { id: 4, title: "우주 탐사 새 프로젝트 발표", category: "과학", date: "오늘", image: "/image/news-placeholder.jpg" },
    { id: 5, title: "글로벌 IT 기업 실적 발표", category: "경제", date: "어제", image: "/image/news-placeholder.jpg" },
    { id: 6, title: "스포츠 스타의 은퇴 선언", category: "스포츠", date: "어제", image: "/image/news-placeholder.jpg" },
  ];

  // 임시 구독 중인 뉴스레터 데이터
  const subscribedNewsletters = [
    { id: 1, name: "테크 인사이트", frequency: "주 2회", lastSent: "2일 전" },
    { id: 2, name: "경제 브리핑", frequency: "주 1회", lastSent: "5일 전" },
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-6 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">마이페이지</h1>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* 왼쪽 사이드바 - 프로필 정보 */}
            <div className="w-full md:w-1/4">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-4 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-gray-500 text-sm">{user.email}</p>
                  <p className="text-gray-400 text-xs mt-1">가입일: {user.joinDate}</p>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <nav className="flex flex-col space-y-2">
                    <Link href="/mypage" className="px-3 py-2 text-[#e53e3e] font-medium rounded bg-red-50">
                      내 프로필
                    </Link>
                    <Link href="/mypage/bookmarks" className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                      북마크한 뉴스
                    </Link>
                    <Link href="/mypage/history" className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                      열람 기록
                    </Link>
                    <Link href="/mypage/newsletters" className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                      뉴스레터 관리
                    </Link>
                    <Link href="/mypage/notifications" className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                      알림 설정
                    </Link>
                    <Link href="/mypage/preferences" className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                      관심사 설정
                    </Link>
                  </nav>
                </div>
              </div>
              
              {/* 뉴스 소비 통계 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-medium text-gray-900 mb-4">내 뉴스 통계</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">IT/기술</span>
                      <span className="text-gray-900">65%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-[#e53e3e] h-2 rounded-full" style={{ width: "65%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">경제</span>
                      <span className="text-gray-900">20%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-[#e53e3e] h-2 rounded-full" style={{ width: "20%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">스포츠</span>
                      <span className="text-gray-900">10%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-[#e53e3e] h-2 rounded-full" style={{ width: "10%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">기타</span>
                      <span className="text-gray-900">5%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-[#e53e3e] h-2 rounded-full" style={{ width: "5%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 오른쪽 메인 콘텐츠 */}
            <div className="w-full md:w-3/4">
              {/* 북마크한 뉴스 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">북마크한 뉴스</h3>
                  <Link href="/mypage/bookmarks" className="text-[#e53e3e] text-sm hover:underline">
                    모두 보기
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {bookmarkedNews.map(news => (
                    <div key={news.id} className="flex items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="w-2 h-2 rounded-full bg-[#e53e3e] mr-3"></div>
                      <div className="flex-1">
                        <Link href={`/news/${news.id}`} className="font-medium text-gray-900 hover:text-[#e53e3e]">
                          {news.title}
                        </Link>
                        <div className="flex text-xs text-gray-500 mt-1">
                          <span className="mr-2">{news.category}</span>
                          <span>{news.date}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center">
                        {news.isRead ? (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">읽음</span>
                        ) : (
                          <span className="px-2 py-1 bg-[#e53e3e] text-white text-xs rounded">읽지 않음</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 최근 본 뉴스 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">최근 본 뉴스</h3>
                  <Link href="/mypage/history" className="text-[#e53e3e] text-sm hover:underline">
                    모두 보기
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentlyViewedNews.map(news => (
                    <div key={news.id} className="bg-gray-50 rounded overflow-hidden">
                      <div className="h-32 bg-gray-200 relative">
                        <div className="absolute inset-0 flex items-center justify-center text-[#e53e3e] bg-[#e3e6f3]">
                          {news.category}
                        </div>
                      </div>
                      <div className="p-3">
                        <Link href={`/news/${news.id}`} className="font-medium text-gray-900 hover:text-[#e53e3e] text-sm">
                          {news.title}
                        </Link>
                        <div className="text-xs text-gray-500 mt-1">
                          {news.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 구독 중인 뉴스레터 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">구독 중인 뉴스레터</h3>
                  <Link href="/mypage/newsletters" className="text-[#e53e3e] text-sm hover:underline">
                    관리하기
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {subscribedNewsletters.map(newsletter => (
                    <div key={newsletter.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div>
                        <h4 className="font-medium text-gray-900">{newsletter.name}</h4>
                        <div className="text-xs text-gray-500 mt-1">
                          {newsletter.frequency} · 마지막 발송: {newsletter.lastSent}
                        </div>
                      </div>
                      <button className="text-sm text-gray-500 hover:text-[#e53e3e]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button className="w-full py-2 rounded-md border border-[#e53e3e] text-[#e53e3e] font-medium hover:bg-red-50 transition">
                    새 뉴스레터 구독하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 