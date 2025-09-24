import Link from "next/link";

export default function BookmarksPage() {
  // 북마크한 뉴스 더미 데이터
  const bookmarkedNews = [
    { id: 1, title: "삼성, 폴더블폰 신제품 공개", category: "IT", date: "2일 전", isRead: true, summary: "삼성전자가 새로운 폴더블폰 시리즈를 공개했습니다. 이번 제품은 내구성이 크게 향상되었으며..." },
    { id: 2, title: "국내 경제 성장률 전망치 상승", category: "경제", date: "3일 전", isRead: false, summary: "한국은행이 올해 국내 경제성장률 전망치를 상향 조정했습니다. 세계 경제 회복에 따른 수출 증가와 내수 개선으로..." },
    { id: 3, title: "AI 기술 발전으로 인한 산업 변화", category: "기술", date: "1주일 전", isRead: true, summary: "인공지능 기술의 발전이 다양한 산업에 혁신을 가져오고 있습니다. 특히 의료, 금융, 제조 분야에서의 변화가..." },
    { id: 4, title: "글로벌 IT 기업 실적 발표", category: "경제", date: "1주일 전", isRead: true, summary: "주요 글로벌 IT 기업들이 2분기 실적을 발표했습니다. 대부분의 기업이 시장 예상을 상회하는 실적을 기록했으며..." },
    { id: 5, title: "우주 탐사 새 프로젝트 발표", category: "과학", date: "2주일 전", isRead: false, summary: "NASA와 SpaceX가 공동으로 새로운 우주 탐사 프로젝트를 발표했습니다. 이번 프로젝트는 화성 탐사를 위한..." },
    { id: 6, title: "환경 문제 해결을 위한 새로운 기술", category: "환경", date: "2주일 전", isRead: true, summary: "탄소 배출량을 줄이는 새로운 기술이 개발되었습니다. 이 기술은 산업 현장에서 발생하는 이산화탄소를..." },
    { id: 7, title: "인공지능 윤리 관련 국제 협약 체결", category: "IT", date: "3주일 전", isRead: false, summary: "주요 국가들이 인공지능 개발과 활용에 관한 윤리적 가이드라인을 담은 국제 협약을 체결했습니다..." },
    { id: 8, title: "메타버스 시장 규모 확대 전망", category: "IT", date: "3주일 전", isRead: true, summary: "메타버스 시장이 2025년까지 연평균 40% 이상 성장할 것으로 전망됩니다. 엔터테인먼트와 교육 분야에서의..." },
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-6 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center mb-6">
            <Link href="/mypage" className="text-gray-500 hover:text-[#e53e3e] mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">북마크한 뉴스</h1>
          </div>
          
          {/* 필터 및 정렬 옵션 */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                  <select id="category" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#e53e3e] focus:ring-[#e53e3e] sm:text-sm">
                    <option value="">전체</option>
                    <option value="IT">IT</option>
                    <option value="경제">경제</option>
                    <option value="기술">기술</option>
                    <option value="과학">과학</option>
                    <option value="환경">환경</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">읽음 상태</label>
                  <select id="status" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#e53e3e] focus:ring-[#e53e3e] sm:text-sm">
                    <option value="">전체</option>
                    <option value="read">읽음</option>
                    <option value="unread">읽지 않음</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">정렬</label>
                <select id="sort" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#e53e3e] focus:ring-[#e53e3e] sm:text-sm">
                  <option value="date_desc">최신순</option>
                  <option value="date_asc">오래된순</option>
                  <option value="title_asc">제목순</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* 북마크 리스트 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {bookmarkedNews.map(news => (
                <div key={news.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">{news.category}</span>
                        {!news.isRead && (
                          <span className="px-2 py-1 bg-[#e53e3e] text-xs text-white rounded">읽지 않음</span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        <Link href={`/news/${news.id}`} className="hover:text-[#e53e3e]">
                          {news.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">{news.summary}</p>
                      <div className="text-gray-400 text-xs">{news.date} 저장됨</div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-[#e53e3e] rounded-full hover:bg-red-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-[#e53e3e] rounded-full hover:bg-red-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 페이지네이션 */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    총 <span className="font-medium">8</span>개 항목 중 <span className="font-medium">1</span>-<span className="font-medium">8</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">이전</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a href="#" aria-current="page" className="z-10 bg-[#e53e3e] border-[#e53e3e] text-white relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                      1
                    </a>
                    <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                      2
                    </a>
                    <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                      3
                    </a>
                    <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">다음</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 