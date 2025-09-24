'use client';

import { useState, useEffect } from 'react';

export default function Sidebar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [trendingChange, setTrendingChange] = useState<{ [key: number]: 'up' | 'down' | 'new' | 'same' }>({
    1: 'new',
    2: 'up',
    3: 'down',
    4: 'up',
    5: 'same'
  });

  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(timer);
  }, []);

  // 트렌드 변화 시뮬레이션
  useEffect(() => {
    const timer = setInterval(() => {
      setTrendingChange(prev => {
        const changes = ['up', 'down', 'same'] as const;
        const newChanges = { ...prev };
        const randomIndex = Math.floor(Math.random() * 5) + 1;
        newChanges[randomIndex] = changes[Math.floor(Math.random() * changes.length)];
        return newChanges;
      });
    }, 10000); // 10초마다 변화

    return () => clearInterval(timer);
  }, []);

  const popularNews = [
    {
      rank: 1,
      title: "손흥민 헤트트릭 폭발... 토트넘 6연승",
      views: "12,345",
      time: "14시간 전",
      thumbnail: "⚽",
      category: "스포츠",
      trend: "hot"
    },
    {
      rank: 2,
      title: "원/달러 환율, 1개월 만에 최저치",
      views: "8,721",
      time: "24시간 전",
      thumbnail: "💰",
      category: "경제",
      trend: "up"
    },
    {
      rank: 3,
      title: "코스피, 외국인 매수세에 상승 마감",
      views: "7,890",
      time: "3시간 전",
      thumbnail: "📈",
      category: "경제",
      trend: "up"
    },
    {
      rank: 4,
      title: "류현진, 두 번째 재계약...\"1년 더\"",
      views: "6,543",
      time: "4시간 전",
      thumbnail: "⚾",
      category: "스포츠",
      trend: "new"
    },
    {
      rank: 5,
      title: "AI 기술 혁신, 전 산업 변화 예고",
      views: "5,432",
      time: "5시간 전",
      thumbnail: "🤖",
      category: "IT",
      trend: "rising"
    }
  ];

  const searchKeywords = [
    { rank: 1, keyword: "손흥민", change: trendingChange[1] },
    { rank: 2, keyword: "환율하락", change: trendingChange[2] },
    { rank: 3, keyword: "코스피 상승", change: trendingChange[3] },
    { rank: 4, keyword: "수출 실적", change: trendingChange[4] },
    { rank: 5, keyword: "류현진", change: trendingChange[5] }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'hot': return '🔥';
      case 'up': return '📈';
      case 'new': return '✨';
      case 'rising': return '🚀';
      default: return '📰';
    }
  };

  const getChangeIcon = (change: 'up' | 'down' | 'new' | 'same') => {
    switch (change) {
      case 'up': return <span className="text-red-500 text-xs">▲</span>;
      case 'down': return <span className="text-blue-500 text-xs">▼</span>;
      case 'new': return <span className="text-green-500 text-xs font-bold">NEW</span>;
      case 'same': return <span className="text-gray-400 text-xs">-</span>;
    }
  };

  return (
    <div className="w-80 shrink-0">
      <div className="sticky top-4 space-y-6">
        
        {/* 실시간 정보 헤더 */}
        <div className="bg-gradient-to-r from-[#e53e3e] to-[#c53030] rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">실시간 업데이트</span>
            </div>
            <span className="text-sm opacity-90">
              {currentTime.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          <div className="text-xs opacity-80">
            지금 가장 핫한 뉴스와 검색어를 확인하세요! 🔥
              </div>
            </div>

        {/* 인기뉴스 섹션 */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <span className="text-xl mr-2">🔥</span>
                인기뉴스
              </h3>
              <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                실시간
                </div>
              </div>
            </div>

          <div className="divide-y divide-gray-50">
            {popularNews.map((news, index) => (
              <div 
                key={index} 
                className="group px-5 py-4 hover:bg-gray-50 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    news.rank <= 3 ? 'bg-[#e53e3e] text-white' : 'bg-gray-200 text-gray-600'
                  } group-hover:scale-110 transition-transform duration-200`}>
                    {news.rank}
                </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{news.thumbnail}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        news.category === '스포츠' ? 'bg-blue-100 text-blue-700' :
                        news.category === '경제' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {news.category}
                      </span>
                      <span className="text-lg">{getTrendIcon(news.trend)}</span>
              </div>
                    
                    <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-[#e53e3e] transition-colors duration-200 leading-tight">
                      {news.title}
                    </h4>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {news.views}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {news.time}
                        </span>
            </div>
            
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-4 h-4 text-[#e53e3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                </div>
              </div>
            </div>
                </div>
              </div>
            ))}
            </div>
          
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <button className="w-full text-center text-sm text-[#e53e3e] font-medium hover:text-[#c53030] transition-colors">
              더 많은 인기뉴스 보기 →
            </button>
          </div>
        </div>

        {/* 실시간 검색어 */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <span className="text-xl mr-2">🔍</span>
                실시간 검색어
              </h3>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">LIVE</span>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-50">
            {searchKeywords.map((item, index) => (
              <div 
                key={index} 
                className="group px-5 py-3 hover:bg-gray-50 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg font-bold ${
                      item.rank <= 3 ? 'text-[#e53e3e]' : 'text-gray-400'
                    } group-hover:scale-110 transition-transform duration-200`}>
                      {item.rank}
                    </span>
                    <span className="text-gray-900 font-medium group-hover:text-[#e53e3e] transition-colors duration-200">
                      {item.keyword}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getChangeIcon(item.change)}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
            </div>
            </div>
            ))}
            </div>
          
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>매 10초마다 업데이트</span>
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                자동갱신
              </span>
            </div>
          </div>
        </div>

        {/* 추가: 오늘의 한줄 뉴스 */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">💡</span>
            <span className="font-bold text-sm">오늘의 한줄</span>
          </div>
          <p className="text-sm leading-relaxed opacity-90">
            "AI 시대, 변화에 적응하는 것이 생존의 열쇠다"
          </p>
          <div className="text-xs opacity-70 mt-2">
            - 테크 전문가 김OO
          </div>
        </div>
      </div>
    </div>
  );
} 