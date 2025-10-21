'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchNews } from '@/utils/searchApi';
import { RSSArticle, fetchRSSNews } from '@/utils/rssApi';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: number;
  title: string;
  category: string;
  date: string;
  thumbnail?: string;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allNews, setAllNews] = useState<RSSArticle[]>([]);
  const router = useRouter();

  // 모달 열릴 때 뉴스 데이터 로드
  useEffect(() => {
    if (isOpen && allNews.length === 0) {
      const loadNews = async () => {
        try {
          // 전체 카테고리 뉴스 가져오기 (limit: -1 = 전체)
          const feeds = await fetchRSSNews('all', -1);
          setAllNews(feeds);
        } catch (error) {
          console.error('뉴스 로드 실패:', error);
        }
      };
      loadNews();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      setTimeout(() => {
        const input = document.getElementById('search-input');
        if (input) input.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // 로컬 검색 실행 (빠른검색과 동일한 방식)
      const results = searchNews(query, allNews);
      
      // RSSArticle을 SearchResult 형식으로 변환
      const searchResults = results.map((article) => ({
        id: parseInt(article.id),
        title: article.title,
        category: article.category || '전체',
        date: article.pubDate || new Date().toISOString(),
        thumbnail: article.imageUrl
      }));
      
      setSearchResults(searchResults);
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleNewsClick = (newsId: number) => {
    router.push(`/news/${newsId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl mx-4 relative z-10 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">뉴스 검색</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="relative">
            <input
              id="search-input"
              type="text"
              placeholder="검색어를 입력하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 px-5 pl-12 rounded-full border-2 border-gray-300 focus:outline-none focus:border-red-500 text-lg"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[calc(80vh-180px)]">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-red-500"></div>
              <p className="mt-4 text-gray-600">검색 중...</p>
            </div>
          ) : searchQuery.trim() === '' ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg">검색어를 입력해주세요</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg">검색 결과가 없습니다</p>
              <p className="text-sm mt-2">다른 검색어로 시도해보세요</p>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4 px-2">
                총 <span className="font-semibold text-red-500">{searchResults.length}</span>개의 검색 결과
              </p>
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleNewsClick(result.id)}
                    className="p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100 hover:border-red-200"
                  >
                    <div className="flex items-start space-x-4">
                      {result.thumbnail && (
                        <img src={result.thumbnail} alt={result.title} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="inline-block px-2 py-0.5 text-xs font-medium text-red-600 bg-red-50 rounded">
                            {result.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(result.date).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-base font-medium text-gray-900 line-clamp-2 hover:text-red-600 transition-colors">
                          {result.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


