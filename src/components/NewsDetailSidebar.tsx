'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPopularSearches, SearchKeyword } from '@/utils/searchApi';
import { getPopularNewsAsArticles } from '@/utils/popularNewsApi';
import { RSSArticle } from '@/utils/rssApi';

export default function NewsDetailSidebar() {
  const [searchKeywords, setSearchKeywords] = useState<SearchKeyword[]>([]);
  const [popularNews, setPopularNews] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // 실시간 검색어 로드
  const loadSearchKeywords = async () => {
    try {
      const keywords = await getPopularSearches(8);
      setSearchKeywords(keywords);
    } catch (error) {
      console.error('실시간 검색어 로드 실패:', error);
    }
  };

  // 인기뉴스 로드
  const loadPopularNews = async () => {
    try {
      const news = await getPopularNewsAsArticles(5);
      setPopularNews(news);
    } catch (error) {
      console.error('인기뉴스 로드 실패:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadSearchKeywords(),
          loadPopularNews()
        ]);
      } catch (error) {
        console.error('사이드바 데이터 로드 실패:', error);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  // 카테고리 한글 변환
  const getCategoryKorean = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'general': '전체',
      'tech': '기술',
      'technology': '기술',
      'it': 'IT',
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

  // 언론사 색상 매핑
  const getSourceColor = (source: string) => {
    const colorMap: { [key: string]: string } = {
      '동아일보': 'bg-blue-100 text-blue-800',
      '조선일보': 'bg-red-100 text-red-800',
      '중앙일보': 'bg-purple-100 text-purple-800',
      '경향신문': 'bg-orange-100 text-orange-800',
      '연합뉴스': 'bg-indigo-100 text-indigo-800',
      '매일경제': 'bg-yellow-100 text-yellow-800',
      '한국경제': 'bg-pink-100 text-pink-800',
      '오마이뉴스': 'bg-cyan-100 text-cyan-800',
      '전자신문': 'bg-green-100 text-green-800'
    };
    return colorMap[source] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="w-80 space-y-6">
        {/* 실시간 검색어 로딩 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>

        {/* 인기뉴스 로딩 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                    <div className="h-4 bg-gray-200 rounded w-8 ml-auto"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 space-y-6">
      {/* 실시간 검색어 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-red-200">
          <div className="w-1 h-6 bg-red-500"></div>
          <h3 className="text-lg font-bold text-gray-900">실시간 검색어</h3>
          <div className="flex items-center gap-1 text-red-500 text-sm font-semibold">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {searchKeywords.length > 0 ? (
            searchKeywords.map((keyword, index) => (
              <div key={keyword.keyword} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    index < 3 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-gray-800 font-medium">{keyword.keyword}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>{keyword.count}</span>
                  <span>회</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm">검색어 데이터를 불러오는 중...</p>
            </div>
          )}
        </div>
      </div>

      {/* 인기뉴스 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-200">
          <div className="w-1 h-6 bg-blue-500"></div>
          <h3 className="text-lg font-bold text-gray-900">인기뉴스</h3>
          <div className="flex items-center gap-1 text-blue-500 text-sm font-semibold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>HOT</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {popularNews.length > 0 ? (
            popularNews.map((news, index) => (
              <Link 
                key={news.id} 
                href={`/news/${news.id}`}
                className="block group"
              >
                <div className="p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getSourceColor(news.source)}`}>
                      {news.source}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                      {getCategoryKorean(news.category)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-orange-500 ml-auto">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{index + 1}위</span>
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-3 group-hover:text-blue-600 transition-colors mb-2">
                    {news.title}
                  </h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(news.pubDate).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p className="text-sm">인기뉴스를 불러오는 중...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
