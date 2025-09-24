'use client';

import React, { useEffect, useState } from 'react';
import { RSSArticle, fetchRSSNews } from '@/utils/rssApi';
import { saveArticlesToStorage } from '@/utils/articleStorage';
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default function Home() {
  const [news, setNews] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNewsIndex, setSelectedNewsIndex] = useState(0); // 선택된 뉴스 인덱스
  const articlesPerPage = 6; // 2x3 그리드

  // 현재 선택된 뉴스 가져오기
  const selectedNews = news.length > 0 ? news[selectedNewsIndex] : null;
  
  // 뉴스 선택 핸들러
  const handleNewsSelect = (index: number) => {
    setSelectedNewsIndex(index);
  };

  // IT 카테고리 배너 정보
  const categoryBanner = {
      title: "디지털 위기에 처한 세계, IT 초강대국들의 대응",
      description: "디지털상의 모든 정보를 통제할 수 있는 시장 조우의 무기로 인해 전 세계 국가와 조직의 기능이 마비되고, 인류 전체가 위협받는 걸 체감명의 위기가 찾아온다. 이를 막을 수 있는 건 오직 존재 자체가 기밀인 '에단 헌트'와...",
      category: "기술"
  };

  useEffect(() => {
    const loadNews = async () => {
      console.log('Starting to load mixed category news...');
      setLoading(true);
      try {
        console.log('Calling fetchRSSNews for multiple categories...');
        
        // 여러 카테고리를 병렬로 가져오기
        const [itNews, sportsNews, economyNews] = await Promise.all([
          fetchRSSNews('it', 8),        // IT 뉴스 8개
          fetchRSSNews('sports', 6),    // 스포츠 뉴스 6개
          fetchRSSNews('economy', 6)    // 경제 뉴스 6개
        ]);
        
        console.log('Received news data:', {
          it: itNews.length,
          sports: sportsNews.length,
          economy: economyNews.length
        });
        
        // 모든 뉴스를 하나의 배열로 합치고 날짜순 정렬
        const allNews = [...itNews, ...sportsNews, ...economyNews]
          .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        
        console.log('Total mixed news articles:', allNews.length);
        setNews(allNews);
        
        // 페이징 계산
        const totalPages = Math.ceil(allNews.length / articlesPerPage);
        setTotalPages(totalPages);
        setCurrentPage(1);
        
        // 기사 데이터를 로컬 스토리지에 저장
        saveArticlesToStorage(allNews);
      } catch (error) {
        console.error('Error in loadNews:', error);
      }
      setLoading(false);
    };

    loadNews();
  }, []);

  // 현재 페이지에 표시할 기사들
  const getCurrentPageArticles = () => {
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    return news.slice(startIndex, endIndex);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 페이징 컴포넌트
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
        {/* 이전 페이지 */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전
        </button>

        {/* 페이지 번호들 */}
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

        {/* 다음 페이지 */}
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
      {/* 주요 뉴스 배너 영역 */}
      <div className="w-full bg-[#00334e] py-0">
        <div className="relative">
          {/* 큰 배너 이미지 영역 */}
          <div className="w-full h-[600px] relative overflow-hidden">
            {/* 배경 이미지 */}
            <div className="absolute inset-0 overflow-hidden">
              {selectedNews?.imageUrl ? (
                <img
                  src={selectedNews.imageUrl}
                  alt={selectedNews.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center">
                          <div class="text-6xl font-bold text-white opacity-10">Breaking News</div>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center">
                  <div className="text-6xl font-bold text-white opacity-10">Breaking News</div>
                </div>
              )}
              {/* 어두운 그라데이션 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40"></div>
            </div>
            
            {/* 메인 뉴스 슬라이더 */}
            <div className="absolute inset-0 z-10">
              <div className="container mx-auto px-6 lg:px-8 h-full flex items-center">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full items-center">
                  {/* 왼쪽: 메인 뉴스 */}
                  <div className="text-white pr-12 lg:pr-16 flex flex-col justify-center">
                    <div className="mb-3 lg:mb-4">
                      <span className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs lg:text-sm font-bold rounded-full">
                        🧠 뉴스 깊이 읽기
                      </span>
                    </div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 lg:mb-6 leading-tight break-keep">
                      {selectedNews ? 
                        (selectedNews.title.length > 40 ? selectedNews.title.substring(0, 40) + "..." : selectedNews.title) : 
                        "AI가 분석하는 뉴스의 깊은 의미"
                      }
                    </h1>
                    <p className="text-sm md:text-base lg:text-lg text-gray-200 mb-4 lg:mb-6 leading-relaxed break-keep">
                      {selectedNews ? 
                        (selectedNews.description?.length > 100 ? selectedNews.description.substring(0, 100) + "..." : selectedNews.description) || "AI가 뉴스의 핵심 포인트, 배경, 영향을 깊이 분석하여 제공합니다. 단순한 요약을 넘어 진짜 의미를 파악해보세요..." :
                        "AI가 뉴스의 핵심 포인트, 배경, 영향을 깊이 분석하여 제공합니다. 단순한 요약을 넘어 진짜 의미를 파악해보세요..."
                      }
                    </p>
                    <div className="flex flex-wrap gap-2 lg:gap-3 mb-3 lg:mb-4">
                      <button className="px-4 lg:px-6 py-2 lg:py-3 bg-[#e53e3e] text-white font-bold rounded-lg hover:bg-[#c53030] transition-all duration-300 transform hover:scale-105 text-sm lg:text-base">
                        자세히 보기
                  </button>
                      <button className="px-4 lg:px-6 py-2 lg:py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-black transition-all duration-300 text-sm lg:text-base">
                    공유하기
                  </button>
                    </div>
                    <div className="flex flex-wrap items-center text-gray-300 text-xs lg:text-sm gap-2 lg:gap-3">
                      <span>📅 {selectedNews ? new Date(selectedNews.pubDate).toLocaleDateString('ko-KR') : '오늘'}</span>
                      <span>👁 15.2k</span>
                      <span>💬 234</span>
                    </div>
                  </div>

                  {/* 오른쪽: 최신 뉴스 리스트 */}
                  <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/10 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4 lg:mb-6">
                      <h2 className="text-lg lg:text-xl xl:text-2xl font-bold text-white flex items-center">
                        <span className="text-xl lg:text-2xl xl:text-3xl mr-2 lg:mr-3">📰</span>
                        최신 뉴스
                      </h2>
                      <div className="text-white/60 text-xs lg:text-sm">LIVE</div>
                    </div>
                    
                    <div className="space-y-2 lg:space-y-3">
                      {(news.length > 0 ? news.slice(0, 5) : [
                        { 
                          rank: 1, 
                          title: "메타 AI, 새로운 언어모델 발표로 주가 급등", 
                          category: "IT", 
                          time: "1시간 전",
                          trend: "🔥"
                        },
                        { 
                          rank: 2, 
                          title: "손흥민 EPL 이번 시즌 20골 달성", 
                          category: "스포츠", 
                          time: "2시간 전",
                          trend: "⚡"
                        },
                        { 
                          rank: 3, 
                          title: "코스피 3000선 돌파, 외국인 매수세", 
                          category: "경제", 
                          time: "3시간 전",
                          trend: "📈"
                        },
                        { 
                          rank: 4, 
                          title: "테슬라 자율주행 기술 새로운 업데이트", 
                          category: "IT", 
                          time: "4시간 전",
                          trend: "🚀"
                        },
                        { 
                          rank: 5, 
                          title: "K-리그 시즌 마지막 경기 결과", 
                          category: "스포츠", 
                          time: "5시간 전",
                          trend: "⚽"
                        }
                      ]).map((item, index) => {
                        const isRealNews = news.length > 0;
                        const rank = index + 1;
                        const displayTitle = item.title.length > 40 ? item.title.substring(0, 40) + "..." : item.title;
                        const isSelected = selectedNewsIndex === index;
                        
                        return (
                          <div 
                            key={index} 
                            className={`flex items-start p-2 lg:p-3 hover:bg-white/20 rounded-lg transition-all duration-200 cursor-pointer group ${
                              isSelected ? 'bg-white/15 border border-white/20' : 'hover:bg-white/10'
                            }`}
                            onClick={() => isRealNews && handleNewsSelect(index)}
                          >
                            <div className={`flex-shrink-0 w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2 lg:mr-3 ${
                              rank <= 3 ? 'bg-[#e53e3e]' : 'bg-white/20'
                            }`}>
                              {rank}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm">{isRealNews ? '📰' : (item as any).trend}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                                  {isRealNews ? 'IT' : (item as any).category}
                                </span>
                              </div>
                              <h3 className={`font-medium transition-colors text-xs lg:text-sm leading-tight break-keep ${
                                isSelected ? 'text-[#e53e3e]' : 'text-white group-hover:text-[#e53e3e]'
                              }`}>
                                {displayTitle}
                              </h3>
                              <div className="text-white/60 text-xs mt-1">
                                {isRealNews ? 
                                  new Date((item as any).pubDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) + ' 전' :
                                  (item as any).time
                                }
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 lg:mt-6 text-center">
                      <button className="text-[#e53e3e] hover:text-white transition-colors font-medium text-xs lg:text-sm">
                        더 많은 뉴스 보기 →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 네비게이션 인디케이터 */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
            {news.length > 0 ? (
              news.slice(0, Math.min(5, news.length)).map((_, index) => (
                <div 
                  key={index}
                  className={`w-3 h-3 rounded-full cursor-pointer transition-colors duration-300 ${
                    selectedNewsIndex === index ? 'bg-[#e53e3e]' : 'bg-white/40 hover:bg-white/60'
                  }`}
                  onClick={() => handleNewsSelect(index)}
                />
              ))
            ) : (
              <>
            <div className="w-3 h-3 bg-[#e53e3e] rounded-full"></div>
                <div className="w-3 h-3 bg-white/40 rounded-full hover:bg-white/60 cursor-pointer transition-colors"></div>
                <div className="w-3 h-3 bg-white/40 rounded-full hover:bg-white/60 cursor-pointer transition-colors"></div>
                <div className="w-3 h-3 bg-white/40 rounded-full hover:bg-white/60 cursor-pointer transition-colors"></div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* 메인 뉴스 영역 */}
          <div className="flex-1">
            {/* 현재 카테고리 표시 */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">최신 뉴스</h2>
                  <p className="text-gray-600">IT, 스포츠, 경제 등 다양한 분야의 최신 소식을 확인하세요</p>
                </div>
                <div className="text-sm text-gray-500">
                  총 {news.length}개 기사 · {currentPage}/{totalPages} 페이지
                </div>
              </div>
            </div>

            {/* 뉴스 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                // 로딩 상태 표시 (6개)
                [...Array(6)].map((_, index) => (
                  <div key={index} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
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
                // 현재 페이지 기사들만 표시
                getCurrentPageArticles().map((article, index) => (
                  <Link 
                    key={index} 
                    href={`/news/${article.id}`}
                    className="group block transform hover:scale-[1.01] transition-all duration-300"
                  >
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 h-full">
                      <div className="relative h-48 overflow-hidden">
                        {/* 순위 배지만 유지 */}
                        <div className="absolute top-3 left-3 bg-[#e53e3e] text-white px-2 py-1 rounded font-bold text-xs z-10">
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
                                // 카테고리별 스타일과 아이콘 결정
                                const categoryStyle = article.category === 'it' ? 'from-purple-50 to-indigo-100' :
                                                    article.category === 'sports' ? 'from-green-50 to-emerald-100' :
                                                    article.category === 'economy' ? 'from-blue-50 to-cyan-100' :
                                                    'from-gray-50 to-slate-100';
                                
                                const iconStyle = article.category === 'it' ? 'from-purple-400 to-indigo-500' :
                                                 article.category === 'sports' ? 'from-green-400 to-emerald-500' :
                                                 article.category === 'economy' ? 'from-blue-400 to-cyan-500' :
                                                 'from-gray-400 to-slate-500';
                                
                                const iconSvg = article.category === 'it' ? 
                                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>' :
                                  article.category === 'sports' ? 
                                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>' :
                                  article.category === 'economy' ?
                                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>' :
                                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>';
                                
                                const categoryText = article.category === 'it' ? 'IT 뉴스' :
                                                   article.category === 'sports' ? '스포츠 뉴스' :
                                                   article.category === 'economy' ? '경제 뉴스' :
                                                   '뉴스';
                                
                                parent.innerHTML = `
                                  <div class="w-full h-full bg-gradient-to-br ${categoryStyle} flex items-center justify-center">
                                    <div class="text-center">
                                      <div class="w-16 h-16 bg-gradient-to-br ${iconStyle} rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          ${iconSvg}
                                        </svg>
                                      </div>
                                      <p class="text-sm text-gray-500 font-medium">${categoryText}</p>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br flex items-center justify-center ${
                            article.category === 'it' ? 'from-purple-50 to-indigo-100' :
                            article.category === 'sports' ? 'from-green-50 to-emerald-100' :
                            article.category === 'economy' ? 'from-blue-50 to-cyan-100' :
                            'from-gray-50 to-slate-100'
                          }`}>
                            <div className="text-center">
                              <div className={`w-16 h-16 bg-gradient-to-br rounded-full flex items-center justify-center mx-auto mb-3 ${
                                article.category === 'it' ? 'from-purple-400 to-indigo-500' :
                                article.category === 'sports' ? 'from-green-400 to-emerald-500' :
                                article.category === 'economy' ? 'from-blue-400 to-cyan-500' :
                                'from-gray-400 to-slate-500'
                              }`}>
                                {article.category === 'it' ? (
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                ) : article.category === 'sports' ? (
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                ) : article.category === 'economy' ? (
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                ) : (
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                  </svg>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 font-medium">
                                {article.category === 'it' ? 'IT 뉴스' :
                                 article.category === 'sports' ? '스포츠 뉴스' :
                                 article.category === 'economy' ? '경제 뉴스' :
                                 '뉴스'}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* 카테고리 배지 */}
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-1 text-white text-xs font-medium rounded-full ${
                            article.category === 'it' ? 'bg-purple-500' :
                            article.category === 'sports' ? 'bg-green-500' :
                            article.category === 'economy' ? 'bg-blue-500' :
                            'bg-gray-500'
                          }`}>
                            {article.category === 'it' ? 'IT' :
                             article.category === 'sports' ? '스포츠' :
                             article.category === 'economy' ? '경제' :
                             '뉴스'}
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

            {/* 페이징 */}
            {!loading && news.length > 0 && <Pagination />}

            {/* 🧠 AI 깊이 분석 뉴스 섹션 */}
            <div className="mt-12 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="text-2xl mr-3">🧠</span>
                  AI 깊이 분석 뉴스
                </h2>
                <Link href="/trending" className="text-sm text-gray-500 hover:text-purple-600 transition-colors">
                  더보기 →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { rank: 1, title: "AI 기술 발전으로 변화하는 미래 산업", category: "IT", time: "2시간 전", analysis: "95%" },
                  { rank: 2, title: "월드컵 예선 한국 대표팀 명단 발표", category: "스포츠", time: "3시간 전", analysis: "92%" },
                  { rank: 3, title: "글로벌 경제 위기 속 한국 경제 전망", category: "경제", time: "1시간 전", analysis: "98%" },
                  { rank: 4, title: "메타버스 플랫폼 새로운 업데이트 공개", category: "IT", time: "4시간 전", analysis: "89%" },
                  { rank: 5, title: "프리미어리그 한국 선수들의 활약", category: "스포츠", time: "5시간 전", analysis: "87%" },
                  { rank: 6, title: "반도체 산업 투자 확대 계획 발표", category: "경제", time: "6시간 전", analysis: "94%" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 group cursor-pointer">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4 ${
                      item.rank <= 3 ? 'bg-[#e53e3e]' : 'bg-gray-400'
                    }`}>
                      {item.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 group-hover:text-[#e53e3e] transition-colors truncate">
                        {item.title}
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.category === 'IT' ? 'bg-gray-100 text-gray-700' :
                          item.category === '스포츠' ? 'bg-gray-100 text-gray-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.category}
                        </span>
                        <span className="text-xs text-gray-500">{item.time}</span>
                        <span className="text-xs text-purple-600 flex items-center font-medium">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          분석도 {item.analysis}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🧠 AI 분석 특징 & 💡 깊이 읽기 가이드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12 mb-8">
              {/* 🧠 AI 분석 특징 */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm p-6 border border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-xl mr-3">🧠</span>
                  AI 뉴스 분석 특징
                </h3>
                <div className="space-y-4">
                  {[
                    { feature: "핵심 포인트 추출", description: "뉴스의 가장 중요한 내용을 한눈에", icon: "🎯", accuracy: "95%" },
                    { feature: "배경 & 맥락 분석", description: "사건의 배경과 전후 맥락을 설명", icon: "📚", accuracy: "92%" },
                    { feature: "영향 & 전망 예측", description: "뉴스가 미칠 영향과 향후 전망", icon: "📈", accuracy: "89%" },
                    { feature: "관련 키워드 추출", description: "뉴스와 연관된 핵심 키워드 제공", icon: "🏷️", accuracy: "97%" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                      <div className="text-lg">{item.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{item.feature}</h4>
                          <span className="text-xs font-medium text-purple-600">{item.accuracy}</span>
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 💡 깊이 읽기 가이드 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-xl mr-3">💡</span>
                  뉴스 깊이 읽기 가이드
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      step: "1단계",
                      title: "AI 분석 결과 확인",
                      description: "핵심 포인트, 배경, 영향을 먼저 파악",
                      icon: "🧠",
                      color: "bg-purple-500"
                    },
                    {
                      step: "2단계", 
                      title: "원문 내용 읽기",
                      description: "AI 분석을 바탕으로 전체 기사 이해",
                      icon: "📖",
                      color: "bg-blue-500"
                    },
                    {
                      step: "3단계",
                      title: "관련 뉴스 연결",
                      description: "키워드로 연관 뉴스까지 확인",
                      icon: "🔗",
                      color: "bg-green-500"
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                      <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center text-white text-lg font-bold`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{item.icon}</span>
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white text-center">
                  <p className="text-sm font-medium">💡 팁: AI 분석을 먼저 읽으면 뉴스 이해도가 3배 향상됩니다!</p>
                </div>
              </div>
            </div>

            {/* 📈 트렌딩 토픽 */}
            <div className="mt-12 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">📈</span>
                트렌딩 토픽
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    topic: "AI & 머신러닝",
                    description: "인공지능 기술의 최신 동향과 산업 적용 사례",
                    articles: 156,
                    color: "bg-gray-700",
                    icon: "🤖"
                  },
                  {
                    topic: "스포츠 & 엔터테인먼트",
                    description: "국내외 스포츠 소식과 엔터테인먼트 뉴스",
                    articles: 89,
                    color: "bg-gray-600",
                    icon: "🏆"
                  },
                  {
                    topic: "경제 & 금융",
                    description: "글로벌 경제 동향과 금융 시장 분석",
                    articles: 124,
                    color: "bg-gray-800",
                    icon: "💰"
                  }
                ].map((item, index) => (
                  <div key={index} className={`relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${item.color}`}>
                    <div className="relative p-6 text-white">
                      <div className="text-3xl mb-3">{item.icon}</div>
                      <h3 className="text-lg font-bold mb-2">{item.topic}</h3>
                      <p className="text-white/90 text-sm mb-4 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.articles}개 기사</span>
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🎯 맞춤 뉴스 추천 */}
            <div className="mt-12 mb-8 bg-gray-50 rounded-lg p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                  <span className="text-2xl mr-3">🎯</span>
                  맞춤 뉴스 추천
                </h2>
                <p className="text-gray-600 text-sm">당신의 관심사에 맞는 뉴스를 추천해드립니다</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { category: "테크", icon: "💻", count: "24개", color: "bg-gray-600" },
                  { category: "스포츠", icon: "⚽", count: "18개", color: "bg-gray-600" },
                  { category: "경제", icon: "📊", count: "31개", color: "bg-gray-600" },
                  { category: "문화", icon: "🎨", count: "12개", color: "bg-gray-600" }
                ].map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200">
                    <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                      <span className="text-xl text-white">{item.icon}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{item.category}</h3>
                    <p className="text-xs text-gray-500">{item.count}</p>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-6">
                <button className="px-6 py-2 bg-[#e53e3e] text-white font-medium rounded hover:bg-[#c53030] transition-colors">
                  맞춤 설정하기
                </button>
              </div>
            </div>
          </div>

          {/* 우측 사이드바 */}
          <Sidebar />
        </div>
      </div>
    </div>
  );
}