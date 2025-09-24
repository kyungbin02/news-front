'use client';

import React, { useEffect, useState } from 'react';
import { RSSArticle, fetchRSSNews } from '@/utils/rssApi';
import { saveArticlesToStorage } from '@/utils/articleStorage';
import { searchNews, trackSearch } from '@/utils/searchApi';
import { trackNewsClick } from '@/utils/newsClickApi';
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";

export default function ITPage() {
  const [news, setNews] = useState<RSSArticle[]>([]);
  const [allNews, setAllNews] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedNewsIndex, setSelectedNewsIndex] = useState(0);
  
  const articlesPerPage = 6;

  const selectedNews = news.length > 0 ? news[selectedNewsIndex] : null;

  const handleNewsSelect = (index: number) => {
    setSelectedNewsIndex(index);
  };

  const handleNewsClick = async (article: RSSArticle) => {
    try {
      await trackNewsClick(article.id, article.title);
      console.log(`IT 뉴스 클릭 추적됨: ${article.title}`);
    } catch (error) {
      console.error('IT 뉴스 클릭 추적 실패:', error);
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
        console.log('IT 뉴스 공유 성공');
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
      console.error('IT 뉴스 공유 실패:', error);
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

  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1);
    
    if (keyword.trim() === '') {
      setNews(allNews);
      setTotalPages(Math.ceil(allNews.length / articlesPerPage));
    } else {
      try {
        await trackSearch(keyword);
        const searchResults = searchNews(keyword, allNews);
        setNews(searchResults);
        setTotalPages(Math.ceil(searchResults.length / articlesPerPage));
      } catch (error) {
        console.error('IT 뉴스 검색 실패:', error);
        const searchResults = searchNews(keyword, allNews);
        setNews(searchResults);
        setTotalPages(Math.ceil(searchResults.length / articlesPerPage));
      }
    }
  };

  useEffect(() => {
    const loadITNews = async () => {
      console.log('IT 뉴스 로딩 시작...');
      setLoading(true);
      try {
        try {
          const response = await fetch('http://localhost:8080/api/news?category=it&page=1&size=50', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
              const backendNews = data.data
                .filter((news: any) => news.title)
                .map((news: any, index: number) => ({
                  id: news.newsId ? news.newsId.toString() : `it-${index}`,
                  title: news.title,
                  description: (news.content || '').substring(0, 200) + '...',
                  link: `/news/${news.newsId || `it-${index}`}`,
                  category: 'it',
                  source: 'IT News Backend',
                  imageUrl: news.imageUrl || '/image/news.webp',
                  pubDate: news.createdAt || new Date().toISOString()
                }));
              
              console.log('백엔드에서 IT 뉴스 로드:', backendNews.length);
              
              if (backendNews.length > 0) {
                setNews(backendNews);
                setAllNews(backendNews);
                setTotalPages(Math.ceil(backendNews.length / articlesPerPage));
                saveArticlesToStorage(backendNews);
                setLoading(false);
                return;
              }
            }
          }
        } catch (backendError) {
          console.error('백엔드 실패, RSS 사용:', backendError);
        }
        
        console.log('RSS로 IT 뉴스 로딩...');
        const itNews = await fetchRSSNews('it', 50);
        
        console.log('RSS로 IT 뉴스 로드:', itNews.length);
        setNews(itNews);
        setAllNews(itNews);
        setTotalPages(Math.ceil(itNews.length / articlesPerPage));
        saveArticlesToStorage(itNews);
      } catch (error) {
        console.error('IT 뉴스 로드 오류:', error);
      }
      setLoading(false);
    };

    loadITNews();
  }, []);

  const getCurrentPageArticles = () => {
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    return news.slice(startIndex, endIndex);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                ? 'bg-purple-600 text-white'
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
    <div className="min-h-screen bg-gray-50">
      {/* 전체 화면 동영상 배경 */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          poster="/image/news.webp"
        >
          <source src="/video/it.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-blue-900/80 to-indigo-900/80"></div>
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
                IT의 새로운 경험
              </h1>
              
              <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
                AI, 클라우드, 메타버스 등 첨단 기술의 혁신과 미래를 한 곳에서 만나보세요
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                <button 
                  onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                  className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-full hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  IT 뉴스 둘러보기
                </button>
                <button 
                  onClick={() => selectedNews && handleShare(selectedNews)}
                  className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
                >
                  공유하기
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white mb-1">2,847</div>
                  <div className="text-blue-200 text-sm">IT 뉴스</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white mb-1">156</div>
                  <div className="text-blue-200 text-sm">기술 트렌드</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white mb-1">89</div>
                  <div className="text-blue-200 text-sm">AI 분석</div>
                </div>
              </div>
            </div>

            {/* 오른쪽: IT 뉴스 리스트 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center">
                  <span className="text-2xl mr-3">💻</span>
                  최신 IT 뉴스
                </h2>
                <div className="flex items-center space-x-2 bg-green-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-green-500/30">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-200 text-sm font-bold">LIVE</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {(news.length > 0 ? news.slice(0, 5) : [
                  { 
                    rank: 1, 
                    title: "OpenAI, GPT-5 발표로 AI 시장 혁신", 
                    category: "AI", 
                    time: "1시간 전",
                    trend: "🔥"
                  },
                  { 
                    rank: 2, 
                    title: "삼성전자, 3나노 공정 양산 본격화", 
                    category: "반도체", 
                    time: "2시간 전",
                    trend: "⚡"
                  },
                  { 
                    rank: 3, 
                    title: "메타, VR/AR 신기술 공개", 
                    category: "메타버스", 
                    time: "3시간 전",
                    trend: "🚀"
                  },
                  { 
                    rank: 4, 
                    title: "구글, 클라우드 서비스 대폭 업그레이드", 
                    category: "클라우드", 
                    time: "4시간 전",
                    trend: "☁️"
                  },
                  { 
                    rank: 5, 
                    title: "애플, M3 칩셋 성능 벤치마크 공개", 
                    category: "하드웨어", 
                    time: "5시간 전",
                    trend: "🍎"
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
                      onClick={() => isRealNews && handleNewsSelect(index)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          rank <= 3 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-white/20 text-white'
                        }`}>
                          {rank}
                        </div>
                        <span className="text-white font-medium text-sm lg:text-base group-hover:text-purple-200 transition-colors">
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
                <button className="text-purple-400 hover:text-white transition-colors font-medium text-sm">
                  더 많은 IT 뉴스 보기 →
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
              {/* IT 뉴스 영역 */}
              <div className="flex-1">
                <div className="mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div className="flex-1 max-w-md">
                      <SearchBar 
                        onSearch={handleSearch}
                        placeholder="IT 뉴스 검색..."
                        className="w-full"
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      총 {news.length}개 기사 · {currentPage}/{totalPages} 페이지
                      {searchKeyword && (
                        <span className="ml-2 px-2 py-1 bg-purple-500 text-white rounded-full text-xs">
                          '{searchKeyword}' 검색결과
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {searchKeyword ? `'${searchKeyword}' IT 검색 결과` : 'IT 뉴스'}
                      </h2>
                      <p className="text-gray-600">
                        {searchKeyword 
                          ? (news.length > 0 
                            ? `'${searchKeyword}'와 관련된 IT 뉴스를 찾았습니다`
                            : `'${searchKeyword}'와 관련된 IT 뉴스를 찾을 수 없습니다`)
                          : '최신 IT 기술 동향과 업계 소식을 확인하세요'
                        }
                      </p>
                    </div>
                    {searchKeyword && (
                      <button
                        onClick={() => handleSearch('')}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-purple-600 border border-gray-300 rounded-lg hover:border-purple-600 transition-colors"
                      >
                        전체 보기
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    [...Array(6)].map((_, index) => (
                      <div key={index} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
                        <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-pulse">
                              <div className="w-12 h-12 bg-purple-300 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
                        className="group block transform hover:scale-[1.01] transition-all duration-300"
                        onClick={() => handleNewsClick(article)}
                      >
                        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 h-full">
                          <div className="relative h-48 overflow-hidden">
                            <div className="absolute top-3 left-3 bg-purple-500 text-white px-2 py-1 rounded font-bold text-xs z-10">
                              {(currentPage - 1) * 6 + index + 1}
                            </div>
                            
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
                                      <div class="w-full h-full bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
                                        <div class="text-center">
                                          <div class="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                            </svg>
                                          </div>
                                          <p class="text-sm text-gray-500 font-medium">IT 뉴스</p>
                                        </div>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <p className="text-sm text-gray-500 font-medium">IT 뉴스</p>
                                </div>
                              </div>
                            )}
                            
                            <div className="absolute top-3 right-3">
                              <span className="px-2 py-1 text-white text-xs font-medium rounded-full bg-purple-500">
                                IT
                              </span>
                            </div>
                          </div>
                          
                          <div className="p-5">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 transition-colors duration-200 group-hover:text-purple-600">
                              {article.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                              {article.description || "최신 IT 뉴스와 기술 동향을 확인해보세요."}
                            </p>
                            
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
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

                {!loading && news.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">IT 뉴스가 없습니다</h3>
                    <p className="text-gray-600 mb-6">잠시 후 다시 시도해주세요</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      새로고침
                    </button>
                  </div>
                )}
              </div>

              <Sidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}