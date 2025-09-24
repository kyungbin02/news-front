import Link from "next/link";

export default function NewslettersPage() {
  // 구독 중인 뉴스레터 더미 데이터
  const subscribedNewsletters = [
    { 
      id: 1, 
      name: "테크 인사이트", 
      description: "IT 및 기술 분야의 최신 트렌드와 깊이 있는 분석을 제공합니다.",
      frequency: "주 2회", 
      lastSent: "2일 전",
      image: "/image/newsletter-tech.jpg" 
    },
    { 
      id: 2, 
      name: "경제 브리핑", 
      description: "국내외 경제 동향과 시장 분석, 투자 정보를 한눈에 볼 수 있습니다.",
      frequency: "주 1회", 
      lastSent: "5일 전",
      image: "/image/newsletter-economy.jpg" 
    },
    { 
      id: 3, 
      name: "글로벌 이슈", 
      description: "전 세계 주요 이슈와 국제 정세에 대한 심층 보도를 제공합니다.",
      frequency: "주 3회", 
      lastSent: "1일 전",
      image: "/image/newsletter-global.jpg" 
    },
  ];

  // 추천 뉴스레터 더미 데이터
  const recommendedNewsletters = [
    { 
      id: 4, 
      name: "과학 탐구", 
      description: "최신 과학 연구와 발견, 우주 탐사에 관한 소식을 전합니다.",
      frequency: "주 1회",
      image: "/image/newsletter-science.jpg" 
    },
    { 
      id: 5, 
      name: "헬스케어", 
      description: "건강 관련 최신 연구와 의학 정보, 웰빙 팁을 제공합니다.",
      frequency: "주 2회",
      image: "/image/newsletter-health.jpg" 
    },
    { 
      id: 6, 
      name: "문화 & 예술", 
      description: "국내외 문화, 예술 소식과 새로운 콘텐츠를 소개합니다.",
      frequency: "격주",
      image: "/image/newsletter-culture.jpg" 
    },
    { 
      id: 7, 
      name: "스포츠 하이라이트", 
      description: "주요 스포츠 경기 결과와 선수 소식, 분석을 제공합니다.",
      frequency: "주 3회",
      image: "/image/newsletter-sports.jpg" 
    },
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
            <h1 className="text-2xl font-bold text-gray-900">뉴스레터 관리</h1>
          </div>
          
          {/* 구독 중인 뉴스레터 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">구독 중인 뉴스레터</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {subscribedNewsletters.map((newsletter, index) => (
                <div key={newsletter.id} className={`p-6 ${index !== subscribedNewsletters.length - 1 ? 'border-b border-gray-200' : ''}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-start space-x-4 mb-4 md:mb-0">
                      <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#e3e6f3] flex items-center justify-center text-[#e53e3e] font-bold">
                        NL
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{newsletter.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{newsletter.description}</p>
                        <div className="flex text-xs text-gray-500">
                          <span className="mr-3">{newsletter.frequency}</span>
                          <span>마지막 발송: {newsletter.lastSent}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">
                        설정
                      </button>
                      <button className="px-4 py-2 border border-[#e53e3e] rounded text-sm text-[#e53e3e] hover:bg-red-50">
                        구독 해지
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          {/* 맞춤 설정 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">뉴스레터 맞춤 설정</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">수신 빈도 설정</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="daily-digest"
                        name="notification-method"
                        type="radio"
                        className="h-4 w-4 text-[#e53e3e] border-gray-300 focus:ring-[#e53e3e]"
                        defaultChecked
                      />
                      <label htmlFor="daily-digest" className="ml-3 block text-sm font-medium text-gray-700">
                        모든 뉴스레터 수신
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="weekly-digest"
                        name="notification-method"
                        type="radio"
                        className="h-4 w-4 text-[#e53e3e] border-gray-300 focus:ring-[#e53e3e]"
                      />
                      <label htmlFor="weekly-digest" className="ml-3 block text-sm font-medium text-gray-700">
                        주간 다이제스트로 한 번에 받기
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">이메일 형식</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="html"
                        name="email-format"
                        type="radio"
                        className="h-4 w-4 text-[#e53e3e] border-gray-300 focus:ring-[#e53e3e]"
                        defaultChecked
                      />
                      <label htmlFor="html" className="ml-3 block text-sm font-medium text-gray-700">
                        HTML (이미지와 디자인이 포함된 형식)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="text"
                        name="email-format"
                        type="radio"
                        className="h-4 w-4 text-[#e53e3e] border-gray-300 focus:ring-[#e53e3e]"
                      />
                      <label htmlFor="text" className="ml-3 block text-sm font-medium text-gray-700">
                        텍스트 (단순 텍스트 형식)
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button className="px-4 py-2 bg-[#e53e3e] text-white rounded hover:bg-[#c53030] transition">
                    설정 저장
                  </button>
                </div>
              </div>
            </div>
          </section>
          
          {/* 추천 뉴스레터 */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">추천 뉴스레터</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendedNewsletters.map(newsletter => (
                <div key={newsletter.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="h-40 bg-[#e3e6f3] flex items-center justify-center text-[#e53e3e] font-bold relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {newsletter.name}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{newsletter.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{newsletter.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{newsletter.frequency}</span>
                      <button className="px-4 py-2 bg-[#e53e3e] text-white rounded-md hover:bg-[#c53030] transition">
                        구독하기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
} 