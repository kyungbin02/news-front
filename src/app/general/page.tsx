'use client';

import React, { useEffect, useState } from 'react';
import { RSSArticle, fetchRSSNews } from '@/utils/rssApi';
import { saveArticlesToStorage } from '@/utils/articleStorage';
import { trackNewsClick } from '@/utils/popularNewsApi';

import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default function GeneralPage() {
  const [news, setNews] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNewsIndex, setSelectedNewsIndex] = useState(0);
 // 선택된 언론사들
  const articlesPerPage = 6;

  const selectedNews = news.length > 0 ? news[selectedNewsIndex] : null;

  // 카테고리 한글 변환 함수
  const getCategoryKorean = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'general': '일반',
      'economy': '경제',
      'sports': '스포츠',
      'politics': '정치',
      'entertainment': '연예',
      'health': '건강',
      'science': '과학',
      'business': '비즈니스',
      'world': '국제',
      'society': '사회',
      'culture': '문화',
      'education': '교육',
      'environment': '환경',
      'lifestyle': '라이프스타일'
    };
    
    return categoryMap[category?.toLowerCase()] || category || '기타';
  };

  // 뉴스 미리보기 생성 함수 (메인페이지와 동일한 로직)
  const createNewsPreview = (article: RSSArticle, fullContent?: string): string => {
    // description이 있으면 사용
    if (article.description) {
      return article.description;
    }
    
    // fullContent가 있으면 텍스트만 추출해서 첫 300자
    if (fullContent) {
      const textOnly = fullContent
        .replace(/<[^>]*>/g, '') // HTML 태그 제거
        .replace(/&nbsp;/g, ' ') // &nbsp; 제거
        .replace(/\s+/g, ' ') // 연속 공백 제거
        .trim();
      
      if (textOnly.length > 300) {
        return textOnly.substring(0, 300) + '...';
      }
      return textOnly;
    }
    
    return '기사 미리보기를 불러올 수 없습니다.';
  };

  // 본문에서 첫 번째 이미지 추출 (메인페이지와 동일한 로직)
  const extractFirstImage = (html: string): string | null => {
    if (!html) return null;
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return imgMatch ? imgMatch[1] : null;
  };

  // 고화질 이미지 URL 생성 (메인페이지와 동일한 로직)
  const getHighQualityImageUrl = (article: RSSArticle, fullContent?: string): string => {
    const contentImageUrl = fullContent ? extractFirstImage(fullContent) : null;
    return contentImageUrl || article.imageUrl || '/image/news.webp';
  };

  const handleNewsSelect = (index: number) => {
    setSelectedNewsIndex(index);
  };

  const handleNewsClick = async (article: RSSArticle) => {
    try {
      // RSS 뉴스(해시 ID)는 클릭 추적 건너뛰기
      const isNumericId = /^\d+$/.test(article.id);
      if (!isNumericId) {
        console.log(`RSS 뉴스 클릭 추적 건너뛰기: ${article.title} (ID: ${article.id})`);
        return;
      }
      
      await trackNewsClick(article.id, article.title, article.category);
      console.log(`전체 뉴스 클릭 추적됨: ${article.title} (ID: ${article.id})`);
    } catch (error) {
      console.error('전체 뉴스 클릭 추적 실패:', error);
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
        console.log('전체 뉴스 공유 성공');
      } else {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareData.url);
          alert('링크가 클립보드에 복사되었습니다.');
        }
      }
    } catch (error) {
      console.error('전체 뉴스 공유 실패:', error);
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareData.url);
          alert('링크가 클립보드에 복사되었습니다.');
        }
      } catch (clipboardError) {
        console.error('클립보드 복사 실패:', clipboardError);
      }
    }
  };

  useEffect(() => {
    const loadNews = async () => {
      console.log('Starting to load all news...');
      setLoading(true);
      try {
        try {
          // 백엔드에서 전체 뉴스 가져오기 (단일 API 호출)
          const response = await fetch('http://localhost:8080/api/news?page=1&size=100', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
              const backendNews = data.data
                .filter((news: any) => news.title)
                .map((news: any, index: number) => {
                  const article: RSSArticle = {
                    id: news.newsId ? news.newsId.toString() : `backend-${index}`,
                    title: news.title,
                    description: news.description || '',
                    link: `/news/${news.newsId || `backend-${index}`}`,
                    category: news.category || 'general',
                    source: news.source || '알 수 없는 출처',
                    imageUrl: news.imageUrl || '/image/news.webp',
                    pubDate: news.createdAt || new Date().toISOString()
                  };
                  
                  // 미리보기 생성 (메인페이지와 동일한 로직)
                  const preview = createNewsPreview(article, news.content);
                  
                  // 고화질 이미지 URL 생성 (메인페이지와 동일한 로직)
                  const highQualityImageUrl = getHighQualityImageUrl(article, news.content);
                  
                  return {
                    ...article,
                    description: preview,
                    imageUrl: highQualityImageUrl
                  };
                });
              
              console.log('백엔드에서 전체 뉴스 로드:', backendNews.length);
              
              if (backendNews.length > 0) {
                setNews(backendNews);
                const totalPages = Math.ceil(backendNews.length / articlesPerPage);
                setTotalPages(totalPages);
                setCurrentPage(1);
                saveArticlesToStorage(backendNews);
                setLoading(false);
                return;
              } else {
                console.log('No valid news from backend, using RSS fallback');
              }
            }
          }
        } catch (backendError) {
          console.error('Backend failed, trying RSS fallback:', backendError);
        }
        
        console.log('Using RSS fallback for all news...');
        // RSS에서도 모든 카테고리 가져오기
        const rssCategories = ['general', 'economy', 'sports', 'it'];
        const allRssPromises = rssCategories.map(async (category) => {
          try {
            return await fetchRSSNews(category, -1);
          } catch (error) {
            console.error(`Failed to load RSS ${category} news:`, error);
            return [];
          }
        });

        const allRssNews = await Promise.all(allRssPromises);
        const combinedRssNews = allRssNews.flat();
        
        // 중복 제거 (같은 제목과 출처를 가진 뉴스 제거)
        const uniqueRssNews = combinedRssNews.reduce((acc: any[], current: any) => {
          const existingNews = acc.find(news => 
            news.title === current.title && news.source === current.source
          );
          if (!existingNews) {
            acc.push({
              ...current,
              id: `rss-unique-${acc.length}-${Date.now()}` // 고유한 키로 재생성
            });
          }
          return acc;
        }, []);
        
        // 최신순으로 정렬
        uniqueRssNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        
        console.log('Received all RSS news data:', uniqueRssNews.length);
        setNews(uniqueRssNews);
        const totalPages = Math.ceil(uniqueRssNews.length / articlesPerPage);
        setTotalPages(totalPages);
        setCurrentPage(1);
        saveArticlesToStorage(uniqueRssNews);
      } catch (error) {
        console.error('Error in loadNews:', error);
      }
      setLoading(false);
    };

    loadNews();
  }, []);

  const getCurrentPageArticles = () => {
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    return news.slice(startIndex, endIndex);
  };


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 개선된 페이지네이션 로직
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // 최대 5개 페이지 표시
    
    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 5개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지 주변 5개만 표시
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      // 끝에서 시작하는 경우 조정
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        {/* 애니메이션 배경 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* 메인 타이틀 */}
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
                <span className="text-sm font-medium text-white/90">🌐</span>
                <span className="text-sm font-medium text-white/90 ml-2">전체 카테고리 뉴스</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                모든 뉴스의 중심
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 mb-4 leading-relaxed max-w-4xl mx-auto">
                정치, 사회, 국제뉴스부터 문화, 연예, 생활정보까지<br />
                <span className="text-yellow-200 font-semibold">다양한 카테고리의 뉴스를 한 곳에서</span>
              </p>
              <p className="text-lg text-blue-200/80 mb-8 leading-relaxed">
                경제, 스포츠뿐만 아니라 일반 카테고리에 포함된<br />
                모든 분야의 뉴스를 시간순으로 확인하세요
              </p>
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                className="group px-8 py-4 bg-gradient-to-r from-white to-blue-50 text-indigo-600 font-semibold rounded-full hover:from-blue-50 hover:to-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center justify-center">
                  <span className="mr-2">📰</span>
                  전체 뉴스 둘러보기
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </button>
              <button 
                onClick={() => selectedNews && handleShare(selectedNews)}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/30"
              >
                <span className="flex items-center justify-center">
                  <span className="mr-2">🔗</span>
                  공유하기
                </span>
              </button>
            </div>
            
            {/* 카테고리 태그 */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {['정치', '사회', '국제', '경제', '스포츠', '문화', '연예', '생활', '건강', '과학', '기술', '교육'].map((category, index) => (
                <span 
                  key={category}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white/90 border border-white/20 hover:bg-white/20 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {category}
                </span>
              ))}
            </div>
            
          </div>
        </div>
        </div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="flex gap-8">
            {/* 메인 뉴스 영역 */}
            <div className="flex-1">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">전체 뉴스</h2>
                    <p className="text-gray-600">모든 카테고리의 최신 뉴스를 시간순으로 확인하세요</p>
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
                            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-3 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      </div>
                    </div>
                  ))
                ) : getCurrentPageArticles().length > 0 ? (
                  getCurrentPageArticles().map((article, index) => (
                    <Link
                      key={article.id}
                      href={article.link}
                      onClick={() => handleNewsClick(article)}
                      className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={article.imageUrl || '/image/news.webp'}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/image/news.webp';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {createNewsPreview(article)}
                        </p>
                        
                        {/* 카드 정보 - 깔끔한 스타일 */}
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                article.source === '동아일보' ? 'bg-blue-100 text-blue-800' :
                                article.source === '조선일보' ? 'bg-red-100 text-red-800' :
                                article.source === '중앙일보' ? 'bg-purple-100 text-purple-800' :
                                article.source === '경향신문' ? 'bg-orange-100 text-orange-800' :
                                article.source === '연합뉴스' ? 'bg-indigo-100 text-indigo-800' :
                                article.source === '매일경제' ? 'bg-yellow-100 text-yellow-800' :
                                article.source === '한국경제' ? 'bg-pink-100 text-pink-800' :
                                article.source === '오마이뉴스' ? 'bg-cyan-100 text-cyan-800' :
                                article.source === '전자신문' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {article.source}
                              </span>
                              <span className="text-xs text-gray-500">
                                {article.category === 'general' ? '전체' :
                                 article.category === 'economy' ? '경제' :
                                 article.category === 'sports' ? '스포츠' :
                                 article.category === 'tech' ? 'IT' :
                                 article.category === 'it' ? 'IT' :
                                 article.category}
                              </span>
                            </div>
                            <span className="font-semibold text-gray-700 text-sm">
                              {new Date(article.pubDate).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          {/* 구분선 효과 */}
                          <div className="flex justify-center">
                            <div className="w-20 h-1 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded-full opacity-70"></div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">전체 뉴스가 없습니다</h3>
                    <p className="text-gray-600 mb-6">잠시 후 다시 시도해주세요</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      새로고침
                    </button>
                  </div>
                )}
              </div>

              {/* 개선된 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex items-center space-x-2">
                    {/* 이전 페이지 그룹 버튼 */}
                    {currentPage > 3 && (
                      <button
                        onClick={() => handlePageChange(Math.max(1, currentPage - 5))}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        title="이전 페이지 그룹"
                      >
                        «
                      </button>
                    )}
                    
                    {/* 이전 버튼 */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>
                    
                    {/* 페이지 번호들 */}
                    {getPageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                          page === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    {/* 다음 버튼 */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                    
                    {/* 다음 페이지 그룹 버튼 */}
                    {currentPage < totalPages - 2 && (
                      <button
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 5))}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        title="다음 페이지 그룹"
                      >
                        »
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 사이드바 */}
            <div className="w-80">
              <Sidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
