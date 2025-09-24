'use client';

import React, { useEffect, useState } from 'react';
import { RSSArticle, fetchRSSNews } from '@/utils/rssApi';
import { saveArticlesToStorage } from '@/utils/articleStorage';
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default function SportsPage() {
  const [news, setNews] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const articlesPerPage = 9; // 3x3 그리드

  // 스포츠 카테고리 배너 정보
  const categoryBanner = {
    title: "월드컵 예선, 한국 축구의 새로운 도전",
    description: "한국 축구 대표팀이 월드컵 예선을 앞두고 새로운 도전을 시작합니다. 손흥민 주장을 중심으로 한 새로운 세대의 선수들이 모여 더 강력한 팀워크를 보여줄 것으로 기대됩니다. 국내외 스포츠 소식을 빠르게 전해드립니다.",
    category: "스포츠"
  };

  useEffect(() => {
    const loadNews = async () => {
      console.log('Starting to load RSS news...');
      setLoading(true);
      try {
        console.log('Calling fetchRSSNews...');
        const newsData = await fetchRSSNews('sports', -1); // 스포츠 뉴스만 로드
        console.log('Received RSS news data:', newsData);
        setNews(newsData);
        
        // 페이징 계산
        const totalPages = Math.ceil(newsData.length / articlesPerPage);
        setTotalPages(totalPages);
        setCurrentPage(1);
        
        // 기사 데이터를 로컬 스토리지에 저장
        saveArticlesToStorage(newsData);
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
              {news.length > 0 && news[0]?.imageUrl ? (
                <img
                  src={news[0].imageUrl}
                  alt={news[0].title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-blue-800 via-indigo-700 to-purple-900 flex items-center justify-center">
                          <div class="text-6xl font-bold text-white opacity-10">Sports News</div>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-800 via-indigo-700 to-purple-900 flex items-center justify-center">
                  <div className="text-6xl font-bold text-white opacity-10">Sports News</div>
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
                      <span className="px-3 lg:px-4 py-1.5 lg:py-2 bg-[#e53e3e] text-white text-xs lg:text-sm font-bold rounded-full">
                        ⚽ 최신 스포츠뉴스
                      </span>
                    </div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 lg:mb-6 leading-tight break-keep">
                      {news.length > 0 ? 
                        (news[0]?.title?.length > 40 ? news[0]?.title.substring(0, 40) + "..." : news[0]?.title) || "월드컵 예선, 한국 축구의 새로운 도전" : 
                        "월드컵 예선, 한국 축구의 새로운 도전"
                      }
                    </h1>
                    <p className="text-sm md:text-base lg:text-lg text-gray-200 mb-4 lg:mb-6 leading-relaxed break-keep">
                      {news.length > 0 ? 
                        ((news[0]?.description?.length > 100 ? news[0]?.description.substring(0, 100) + "..." : news[0]?.description) || "한국 축구 대표팀이 월드컵 예선을 앞두고 새로운 도전을 시작합니다. 손흥민 주장을 중심으로 한 새로운 세대...") :
                        "한국 축구 대표팀이 월드컵 예선을 앞두고 새로운 도전을 시작합니다. 손흥민 주장을 중심으로 한 새로운 세대..."
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
                      <span>📅 {news.length > 0 ? new Date(news[0]?.pubDate || Date.now()).toLocaleDateString('ko-KR') : '오늘'}</span>
                      <span>👁 25.3k</span>
                      <span>💬 412</span>
                    </div>
                  </div>

                  {/* 오른쪽: 최신 스포츠뉴스 리스트 */}
                  <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/10 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4 lg:mb-6">
                      <h2 className="text-lg lg:text-xl xl:text-2xl font-bold text-white flex items-center">
                        <span className="text-xl lg:text-2xl xl:text-3xl mr-2 lg:mr-3">🏆</span>
                        최신 스포츠뉴스
                      </h2>
                      <div className="text-white/60 text-xs lg:text-sm">LIVE</div>
                    </div>
                    
                    <div className="space-y-2 lg:space-y-3">
                      {(news.length > 0 ? news.slice(1, 6) : [
                        { 
                          rank: 1, 
                          title: "손흥민 해트트릭 폭발, 토트넘 6연승 질주", 
                          category: "축구", 
                          time: "15분 전",
                          trend: "⚽"
                        },
                        { 
                          rank: 2, 
                          title: "류현진 시즌 10승 달성, 플레이오프 진출", 
                          category: "야구", 
                          time: "45분 전",
                          trend: "⚾"
                        },
                        { 
                          rank: 3, 
                          title: "한국 배구 여자대표팀 아시안게임 금메달", 
                          category: "배구", 
                          time: "1시간 전",
                          trend: "🏐"
                        },
                        { 
                          rank: 4, 
                          title: "김연경 은퇴 선언, 배구계 큰 손실", 
                          category: "배구", 
                          time: "2시간 전",
                          trend: "😢"
                        },
                        { 
                          rank: 5, 
                          title: "e스포츠 월드챔피언십 한국팀 우승", 
                          category: "e스포츠", 
                          time: "3시간 전",
                          trend: "🎮"
                        }
                      ]).map((item, index) => {
                        const isRealNews = news.length > 0;
                        const rank = index + 1;
                        const displayTitle = item.title.length > 40 ? item.title.substring(0, 40) + "..." : item.title;
                        
                        return (
                          <div key={index} className="flex items-start p-2 lg:p-3 hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer group">
                            <div className={`flex-shrink-0 w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2 lg:mr-3 ${
                              rank <= 3 ? 'bg-[#e53e3e]' : 'bg-white/20'
                            }`}>
                              {rank}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm">{isRealNews ? '⚽' : (item as any).trend}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                                  {isRealNews ? '스포츠' : (item as any).category}
                                </span>
                              </div>
                              <h3 className="text-white font-medium group-hover:text-[#e53e3e] transition-colors text-xs lg:text-sm leading-tight break-keep">
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
                        더 많은 스포츠뉴스 보기 →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 네비게이션 인디케이터 */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
            <div className="w-3 h-3 bg-[#e53e3e] rounded-full"></div>
            <div className="w-3 h-3 bg-white/40 rounded-full hover:bg-white/60 cursor-pointer transition-colors"></div>
            <div className="w-3 h-3 bg-white/40 rounded-full hover:bg-white/60 cursor-pointer transition-colors"></div>
            <div className="w-3 h-3 bg-white/40 rounded-full hover:bg-white/60 cursor-pointer transition-colors"></div>
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">스포츠 뉴스</h2>
                  <p className="text-gray-600">최신 스포츠 소식을 확인하세요</p>
                </div>
                <div className="text-sm text-gray-500">
                  총 {news.length}개 기사 · {currentPage}/{totalPages} 페이지
                </div>
              </div>
            </div>

            {/* 뉴스 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                // 로딩 상태 표시 (9개)
                [...Array(9)].map((_, index) => (
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
                // 현재 페이지 기사들만 표시
                getCurrentPageArticles().map((article, index) => (
                  <Link 
                    key={index} 
                    href={`/news/${article.id}`}
                    className="group block transform hover:scale-[1.02] transition-all duration-300"
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
                                  <div class="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                                    <div class="text-center">
                                      <div class="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                        </svg>
                                      </div>
                                      <p class="text-sm text-gray-500 font-medium">스포츠 뉴스</p>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <p className="text-sm text-gray-500 font-medium">스포츠 뉴스</p>
                            </div>
                          </div>
                        )}
                        {/* 카테고리 배지 */}
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 text-white text-xs font-medium rounded-full bg-blue-500">
                            스포츠
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 transition-colors duration-200 group-hover:text-blue-600">
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

            {/* 페이징 */}
            {!loading && news.length > 0 && <Pagination />}

            {/* 🔥 실시간 인기 뉴스 섹션 */}
            <div className="mt-12 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="text-2xl mr-3">🔥</span>
                  실시간 인기 스포츠뉴스
                </h2>
                <Link href="/trending" className="text-sm text-gray-500 hover:text-[#e53e3e] transition-colors">
                  더보기 →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { rank: 1, title: "손흥민 해트트릭 폭발, 토트넘 6연승 질주", category: "축구", time: "1시간 전", views: "25.3k" },
                  { rank: 2, title: "류현진 시즌 10승 달성, 토론토 플레이오프 진출", category: "야구", time: "2시간 전", views: "18.7k" },
                  { rank: 3, title: "한국 배구 여자대표팀, 아시안게임 금메달", category: "배구", time: "3시간 전", views: "15.2k" },
                  { rank: 4, title: "김연경 은퇴 선언, 한국 배구계 큰 손실", category: "배구", time: "4시간 전", views: "12.8k" },
                  { rank: 5, title: "프리미어리그 한국 선수들의 활약상", category: "해외축구", time: "5시간 전", views: "11.5k" },
                  { rank: 6, title: "e스포츠 월드챔피언십 한국팀 우승", category: "e스포츠", time: "6시간 전", views: "9.9k" }
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
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                          {item.category}
                        </span>
                        <span className="text-xs text-gray-500">{item.time}</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {item.views}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ⚽ 경기 일정 & 🏆 리그 순위 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12 mb-8">
              {/* ⚽ 경기 일정 */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-xl mr-3">⚽</span>
                  오늘의 경기 일정
                </h3>
                <div className="space-y-3">
                  {[
                    { time: "19:00", home: "맨시티", away: "리버풀", league: "EPL", status: "예정" },
                    { time: "21:30", home: "바르셀로나", away: "레알마드리드", league: "라리가", status: "예정" },
                    { time: "23:00", home: "PSG", away: "마르세유", league: "리그1", status: "예정" },
                    { time: "02:00", home: "레이커스", away: "워리어스", league: "NBA", status: "예정" },
                    { time: "14:00", home: "LG", away: "두산", league: "KBO", status: "종료" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">{item.time}</span>
                        <span className="font-medium text-gray-900">{item.home} vs {item.away}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{item.league}</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          item.status === '예정' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 🏆 리그 순위 */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-xl mr-3">🏆</span>
                  프리미어리그 순위
                </h3>
                <div className="space-y-3">
                  {[
                    { rank: 1, team: "맨시티", points: "78", record: "25-3-2" },
                    { rank: 2, team: "아스날", points: "75", record: "24-3-3" },
                    { rank: 3, team: "리버풀", points: "72", record: "23-3-4" },
                    { rank: 4, team: "토트넘", points: "65", record: "20-5-5" },
                    { rank: 5, team: "첼시", points: "62", record: "19-5-6" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm font-bold w-6 text-center ${
                          item.rank <= 3 ? 'text-[#e53e3e]' : 'text-gray-600'
                        }`}>
                          {item.rank}
                        </span>
                        <span className="font-medium text-gray-900">{item.team}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500">{item.record}</span>
                        <span className="text-sm font-bold text-gray-900">{item.points}점</span>
                      </div>
                    </div>
                  ))}
                </div>
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