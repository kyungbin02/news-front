'use client';

import React, { useEffect, useState } from 'react';
import { RSSArticle, fetchRSSNews } from '@/utils/rssApi';
import { saveArticlesToStorage } from '@/utils/articleStorage';
import { trackNewsClick } from '@/utils/popularNewsApi';
import { trackSearch, searchNews, getPopularSearches } from '@/utils/searchApi';

import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default function EconomyPage() {
  const [news, setNews] = useState<RSSArticle[]>([]);
  const [allNews, setAllNews] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNewsIndex, setSelectedNewsIndex] = useState(0);
  const [stats, setStats] = useState({ totalNews: 0 });
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchModalKeyword, setSearchModalKeyword] = useState('');
  const [searchModalLoading, setSearchModalLoading] = useState(false);
  const [searchModalResults, setSearchModalResults] = useState<RSSArticle[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchKeywords, setSearchKeywords] = useState<{keyword: string, count: number}[]>([]);
  const [showMoreNews, setShowMoreNews] = useState(false);
  const articlesPerPage = 6;

  // 현재 선택된 뉴스 가져오기
  const selectedNews = news.length > 0 ? news[selectedNewsIndex] : null;

  const handleNewsSelect = (index: number) => {
    setSelectedNewsIndex(index);
  };

  const handleNewsClick = async (article: RSSArticle) => {
    try {
      await trackNewsClick(article.id, article.title, article.category);
      console.log(`경제 뉴스 클릭 추적됨: ${article.title} (ID: ${article.id})`);
    } catch (error) {
      console.error('경제 뉴스 클릭 추적 실패:', error);
    }
  };

  const handleShare = async (article: RSSArticle) => {
    const shareData = {
      title: article.title,
      text: article.description || article.title,
      url: `${window.location.origin}/news/${article.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('경제 뉴스 공유 성공');
      } else {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareData.url);
          alert('링크가 클립보드에 복사되었습니다!');
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = shareData.url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('링크가 클립보드에 복사되었습니다!');
        }
      }
    } catch (error) {
      console.error('경제 뉴스 공유 실패:', error);
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareData.url);
          alert('링크가 클립보드에 복사되었습니다!');
        }
      } catch (clipboardError) {
        console.error('클립보드 복사도 실패:', clipboardError);
        alert('공유 기능을 사용할 수 없습니다. 브라우저를 업데이트해 주세요.');
      }
    }
  };

  // 빠른 검색 클릭 핸들러
  const handleQuickSearchClick = () => {
    setShowSearchModal(true);
  };

  // 검색 모달 닫기
  const handleSearchModalClose = () => {
    setShowSearchModal(false);
    setSearchModalKeyword('');
    setSearchModalResults([]);
  };

  // 검색 모달에서 검색 실행
  const handleSearchModalSearch = async () => {
    if (searchModalKeyword.trim()) {
      setSearchModalLoading(true);
      try {
        // 검색어 추적
        await trackSearch(searchModalKeyword);
        
        // 실시간 검색어 업데이트
        await loadSearchKeywords();
        
        // 로컬 검색 실행
        const searchResults = searchNews(searchModalKeyword, allNews);
        setSearchModalResults(searchResults);
        
      } catch (error) {
        console.error('검색 실패:', error);
        // 에러 시에도 로컬 검색 실행
        const searchResults = searchNews(searchModalKeyword, allNews);
        setSearchModalResults(searchResults);
      } finally {
        setSearchModalLoading(false);
      }
    }
  };

  // 인기 검색어 로딩
  const loadSearchKeywords = async () => {
    try {
      const keywords = await getPopularSearches(8);
      setSearchKeywords(keywords);
    } catch (error) {
      console.error('실시간 검색어 로드 실패:', error);
    }
  };

  // 클라이언트에서만 통계 계산
  useEffect(() => {
    setStats({
      totalNews: news.length
    });
  }, [news.length]);

  useEffect(() => {
    const loadNews = async () => {
      console.log('Starting to load RSS news...');
      setLoading(true);
      try {
        console.log('Calling fetchRSSNews...');
        const newsData = await fetchRSSNews('economy', -1);
        console.log('Received RSS news data:', newsData);
        
        // 경제 관련 뉴스만 필터링 (적당한 수준)
        const filteredNews = newsData.filter(article => {
          const category = article.category?.toLowerCase();
          const title = article.title?.toLowerCase() || '';
          const description = article.description?.toLowerCase() || '';
          const text = title + ' ' + description;
          
          // 경제 관련 키워드가 있으면 포함
          const economyKeywords = [
            '경제', '금융', '증권', '주식', '코스피', '코스닥', '환율', '원/달러',
            '부동산', '아파트', '전세', '매매', '투자', '벤처', '스타트업',
            '기업', '회사', '매출', '영업이익', '순이익', '실적', '배당',
            '은행', '금리', '대출', '예금', '신용카드', '보험',
            '정부', '정책', '세금', '예산', '국채', '공채',
            '수출', '수입', '무역', 'FTA', '관세', '통상',
            '인플레이션', '물가', 'CPI', 'GDP', '성장률',
            '반도체', 'IT', '기술', '디지털', 'AI', '빅데이터',
            '에너지', '석유', '가스', '전력', '신재생에너지',
            '자동차', '조선', '철강', '화학', '바이오'
          ];
          
          // 스포츠 관련 키워드가 있으면 제외
          const sportsKeywords = [
            '골프', '축구', '야구', '농구', '배구', '테니스', '올림픽', '월드컵',
            '선수', '경기', '리그', '팀', '감독', '코치', '우승', '메달',
            'K리그', 'KBO', '프리미어리그', '라리가', 'MLB', 'NBA'
          ];
          
          // 스포츠 키워드가 있으면 제외
          if (sportsKeywords.some(keyword => text.includes(keyword))) {
            return false;
          }
          
          // 경제 키워드가 있으면 포함
          if (economyKeywords.some(keyword => text.includes(keyword))) {
            return true;
          }
          
          // 카테고리가 economy, economic, business면 포함
          if (category === 'economy' || category === 'economic' || category === 'business') {
            return true;
          }
          
          return false;
        });
        
        console.log('Filtered economy news:', filteredNews.length);
        setNews(filteredNews);
        setAllNews(filteredNews); // 전체 뉴스 저장
        
        const totalPages = Math.ceil(filteredNews.length / articlesPerPage);
        setTotalPages(totalPages);
        setCurrentPage(1);
        
        saveArticlesToStorage(filteredNews);
      } catch (error) {
        console.error('Error in loadNews:', error);
      }
      setLoading(false);
    };

    loadNews();
    loadSearchKeywords();
  }, []);

  const getCurrentPageArticles = () => {
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    return news.slice(startIndex, endIndex);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const Pagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 rounded-md ${
              currentPage === page
                ? 'bg-[#e53e3e] text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 전체 화면 동영상 배경 */}
      <div className="absolute inset-0 z-0 h-screen">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          poster="/image/news.webp"
        >
          <source src="/video/economy.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-green-900/80 to-teal-900/80"></div>
      </div>
      
      {/* 메인 콘텐츠 - 동영상 위에 오버레이 */}
      <div className="relative z-10 min-h-screen">
        {/* 첫 화면 히어로 섹션 - 전체 화면 */}
        <div className="h-screen flex items-center justify-center">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* 왼쪽: 메인 콘텐츠 */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
                경제의 새로운 경험
              </h1>
              
              <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
                주식, 부동산, 금융 등 모든 경제 분야의 생생한 현장과 분석을 실시간으로 만나보세요
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                <button 
                  onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                  className="px-8 py-4 bg-white text-[#e53e3e] font-semibold rounded-full hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  경제 뉴스 둘러보기
                </button>
                <button 
                  onClick={() => selectedNews && handleShare(selectedNews)}
                  className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-[#e53e3e] transition-all duration-300 transform hover:scale-105"
                >
                  공유하기
                </button>
              </div>

              {/* 바로가기 아이콘들 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="group bg-gradient-to-br from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 rounded-xl p-4 border border-blue-500/30 transition-all duration-300 cursor-pointer"
                     onClick={() => window.scrollTo({ top: 1600, behavior: 'smooth' })}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">📰</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">최신뉴스</div>
                      <div className="text-blue-200 text-xs">실시간 업데이트</div>
                    </div>
                  </div>
                </div>
                
                <div className="group bg-gradient-to-br from-orange-500/20 to-red-600/20 hover:from-orange-500/30 hover:to-red-600/30 rounded-xl p-4 border border-orange-500/30 transition-all duration-300 cursor-pointer"
                     onClick={handleQuickSearchClick}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">🔍</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">빠른검색</div>
                      <div className="text-orange-200 text-xs">카테고리별</div>
                    </div>
                  </div>
                </div>
                
                <div className="group bg-gradient-to-br from-purple-500/20 to-pink-600/20 hover:from-purple-500/30 hover:to-pink-600/30 rounded-xl p-4 border border-purple-500/30 transition-all duration-300 cursor-pointer"
                     onClick={() => window.location.href = '/mypage/bookmarks'}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">⭐</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">북마크</div>
                      <div className="text-purple-200 text-xs">저장된 뉴스</div>
                    </div>
                  </div>
                </div>
                
                <div className="group bg-gradient-to-br from-green-500/20 to-emerald-600/20 hover:from-green-500/30 hover:to-emerald-600/30 rounded-xl p-4 border border-green-500/30 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">📊</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">총 뉴스</div>
                      <div className="text-green-200 text-xs">{stats.totalNews}개</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 경제 뉴스 리스트 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center">
                  <span className="text-2xl mr-3">📈</span>
                  최신 경제뉴스
                </h2>
                <div className="flex items-center space-x-2 bg-green-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-green-500/30">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-200 text-sm font-bold">LIVE</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {(news.length > 0 ? news.slice(0, showMoreNews ? 10 : 5) : [
                  { 
                    rank: 1, 
                    title: "코스피 3000선 돌파, 외국인 매수세 지속", 
                    category: "증권", 
                    time: "30분 전",
                    trend: "📈"
                  },
                  { 
                    rank: 2, 
                    title: "부동산 정책 변화로 아파트 거래량 급증", 
                    category: "부동산", 
                    time: "1시간 전",
                    trend: "🏠"
                  },
                  { 
                    rank: 3, 
                    title: "원/달러 환율 1200원대 하락", 
                    category: "금융", 
                    time: "2시간 전",
                    trend: "💱"
                  },
                  { 
                    rank: 4, 
                    title: "반도체 업계 투자 확대 발표", 
                    category: "산업", 
                    time: "3시간 전",
                    trend: "🔧"
                  },
                  { 
                    rank: 5, 
                    title: "스타트업 투자 열기 지속", 
                    category: "벤처", 
                    time: "4시간 전",
                    trend: "🚀"
                  }
                ]).map((item, index) => {
                  const isRealNews = news.length > 0;
                  const rank = index + 1;
                  const displayTitle = item.title.length > 40 ? item.title.substring(0, 40) + "..." : item.title;
                  
                  const isSelected = selectedNewsIndex === index;
                  
                  return (
                    <div 
                      key={index} 
                      className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer ${
                        isSelected ? 'bg-white/15 border border-white/20' : 'hover:bg-white/10'
                      }`}
                      onClick={() => {
                        if (isRealNews && 'id' in item) {
                          handleNewsClick(item as RSSArticle);
                          window.location.href = `/news/${item.id}`;
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          rank <= 3 
                            ? 'bg-[#e53e3e] text-white' 
                            : 'bg-white/20 text-white'
                        }`}>
                          {rank}
                        </div>
                        <span className="text-white font-medium text-sm lg:text-base group-hover:text-[#e53e3e] transition-colors">
                          {displayTitle}
                        </span>
                      </div>
                      <div className="text-white/70 text-xs font-medium">
                        {isRealNews ? 
                          new Date((item as any).pubDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) + ' 전' :
                          (item as any).time
                        }
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => setShowMoreNews(!showMoreNews)}
                  className="text-[#e53e3e] hover:text-white transition-colors font-medium text-sm"
                >
                  {showMoreNews ? '뉴스 접기 ←' : '더 많은 경제뉴스 보기 →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 뉴스 그리드 섹션 */}
        <div className="relative z-10 bg-white">
          <div className="container mx-auto px-4 py-16">
            <div className="flex gap-8">
              {/* 메인 뉴스 영역 */}
              <div className="flex-1">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">경제 뉴스</h2>
                      <p className="text-gray-600">최신 경제 소식을 확인하세요</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      총 {news.length}개 기사 · {currentPage}/{totalPages} 페이지
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    [...Array(6)].map((_, index) => (
                      <div key={index} className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-pulse">
                              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-5">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mb-4"></div>
                          <div className="flex justify-between items-center">
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    getCurrentPageArticles().map((article, index) => (
                      <Link 
                        key={index} 
                        href={`/news/${article.id}`}
                        className="group block transform hover:scale-[1.02] transition-all duration-300"
                        onClick={() => handleNewsClick(article)}
                      >
                        <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full">
                          <div className="relative h-48 overflow-hidden">
                            {article.imageUrl ? (
                              <img
                                src={article.imageUrl}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                                        <div class="text-center">
                                          <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0116 0z"></path>
                                            </svg>
                                          </div>
                                          <p class="text-sm text-gray-500 font-medium">경제 뉴스</p>
                                        </div>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0116 0z" />
                                    </svg>
                                  </div>
                                  <p className="text-sm text-gray-500 font-medium">경제 뉴스</p>
                                </div>
                              </div>
                            )}
                            <div className="absolute top-3 left-3 bg-[#e53e3e] text-white px-2 py-1 rounded font-bold text-xs z-10">
                              {(currentPage - 1) * 6 + index + 1}
                            </div>
                            
                            <div className="absolute top-3 right-3">
                              <span className="px-2 py-1 text-white text-xs font-medium rounded-full bg-green-500">
                                경제
                              </span>
                            </div>
                          </div>
                          <div className="p-5">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 transition-colors duration-200 group-hover:text-[#e53e3e]">
                              {article.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                              {article.description}
                            </p>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <span className="text-xs text-gray-500 font-medium">{article.source}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs text-gray-500">
                                  {new Date(article.pubDate).toLocaleDateString('ko-KR', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                {!loading && news.length > 0 && <Pagination />}
              </div>

              <Sidebar />
            </div>
          </div>
        </div>
      </div>

      {/* 검색 모달 */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-100">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-t-3xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">빠른 검색</h2>
                    <p className="text-orange-100 text-sm">원하는 뉴스를 검색해보세요</p>
                  </div>
                </div>
                <button
                  onClick={handleSearchModalClose}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 검색 입력 */}
            <div className="p-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchModalKeyword}
                  onChange={(e) => setSearchModalKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchModalSearch()}
                  placeholder="검색어를 입력하세요..."
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:outline-none transition-colors"
                  autoFocus
                />
                <button
                  onClick={handleSearchModalSearch}
                  disabled={searchModalLoading}
                  className="absolute right-2 top-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  {searchModalLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>검색</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* 인기 검색어 */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">인기 검색어</h3>
                <div className="flex flex-wrap gap-2">
                  {searchKeywords.slice(0, 6).map((keyword, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchModalKeyword(keyword.keyword);
                        handleSearchModalSearch();
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 rounded-full text-sm transition-colors duration-200"
                    >
                      {keyword.keyword}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 검색 결과 */}
              {searchModalLoading && (
                <div className="mt-6 text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">검색 중...</p>
                </div>
              )}
              
              {searchModalResults.length > 0 && !searchModalLoading && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      검색 결과 ({searchModalResults.length}개)
                    </h3>
                    <button
                      onClick={() => setSearchModalResults([])}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      결과 지우기
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {searchModalResults.map((article, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          handleNewsClick(article);
                          window.location.href = `/news/${article.id}`;
                        }}
                        className="p-4 bg-gray-50 hover:bg-orange-50 rounded-xl cursor-pointer transition-colors duration-200 border border-gray-200 hover:border-orange-200"
                      >
                        <div className="flex items-start space-x-3">
                          <img
                            src={article.imageUrl || '/image/news.webp'}
                            alt={article.title}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/image/news.webp';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                              {article.title}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {article.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{article.source}</span>
                              <span>
                                {new Date(article.pubDate).toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {searchModalResults.length === 0 && !searchModalLoading && searchModalKeyword && (
                <div className="mt-6 text-center py-8">
                  <div className="text-gray-400 text-4xl mb-3">🔍</div>
                  <p className="text-gray-600">검색 결과가 없습니다</p>
                  <p className="text-sm text-gray-500 mt-1">다른 검색어를 시도해보세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}