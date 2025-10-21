'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RSSArticle, fetchRSSNews } from '@/utils/rssApi';
import { searchNews, searchNewsWithTracking, trackSearch, getPopularSearches } from '@/utils/searchApi';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const [allNews, setAllNews] = useState<RSSArticle[]>([]);
  const [searchModalKeyword, setSearchModalKeyword] = useState('');
  const [searchModalResults, setSearchModalResults] = useState<RSSArticle[]>([]);
  const [searchModalLoading, setSearchModalLoading] = useState(false);
  const [searchKeywords, setSearchKeywords] = useState<any[]>([]);
  const router = useRouter();

  // 모달이 열릴 때 뉴스 데이터와 인기 검색어 로드
  useEffect(() => {
    if (isOpen) {
      loadNewsData();
      loadSearchKeywords();
    }
  }, [isOpen]);

  const loadNewsData = async () => {
    try {
      // 여러 카테고리에서 뉴스 가져오기 (메인페이지 방식과 동일)
      const [generalNews, sportsNews, economyNews] = await Promise.all([
        fetchRSSNews('general', 30),
        fetchRSSNews('sports', 30),
        fetchRSSNews('economy', 30)
      ]);
      
      // 모든 뉴스 합치고 날짜순 정렬
      const combinedNews = [...generalNews, ...sportsNews, ...economyNews]
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      
      setAllNews(combinedNews);
    } catch (error) {
      console.error('뉴스 로드 실패:', error);
    }
  };

  const loadSearchKeywords = async () => {
    try {
      const keywords = await getPopularSearches(6);
      setSearchKeywords(keywords);
    } catch (error) {
      console.error('인기 검색어 로드 실패:', error);
    }
  };

  const handleSearchModalClose = () => {
    setSearchModalKeyword('');
    setSearchModalResults([]);
    onClose();
  };

  const handleSearchModalSearch = async () => {
    if (searchModalKeyword.trim()) {
      setSearchModalLoading(true);
      try {
        // 검색어 추적
        await trackSearch(searchModalKeyword);
        
        // 실시간 검색어 업데이트
        await loadSearchKeywords();
        
        // 백엔드에서 검색 실행 (백엔드 실패 시 자동으로 로컬 검색으로 대체)
        const searchResults = await searchNewsWithTracking(searchModalKeyword, allNews);
        
        setSearchModalResults(searchResults);
      } catch (error) {
        console.error('검색 실패:', error);
        // 에러 시 로컬 검색으로 fallback
        const localResults = allNews.filter(article =>
          article.title.toLowerCase().includes(searchModalKeyword.toLowerCase()) ||
          article.description.toLowerCase().includes(searchModalKeyword.toLowerCase()) ||
          article.category.toLowerCase().includes(searchModalKeyword.toLowerCase())
        );
        setSearchModalResults(localResults);
      } finally {
        setSearchModalLoading(false);
      }
    }
  };

  const handleNewsClick = (article: RSSArticle) => {
    router.push(`/news/${article.id}`);
    handleSearchModalClose();
  };

  if (!isOpen) return null;

  return (
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
              className="absolute right-2 top-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>검색</span>
            </button>
          </div>
          
          {/* 인기 검색어 */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">인기 검색어</h3>
            <div className="flex flex-wrap gap-2">
              {searchKeywords.slice(0, 6).map((keyword, index) => (
                <button
                  key={index}
                  onClick={async () => {
                    setSearchModalKeyword(keyword.keyword);
                    // 키워드로 즉시 검색 실행
                    if (keyword.keyword.trim()) {
                      setSearchModalLoading(true);
                      try {
                        await trackSearch(keyword.keyword);
                        await loadSearchKeywords();
                        const searchResults = await searchNewsWithTracking(keyword.keyword, allNews);
                        setSearchModalResults(searchResults);
                      } catch (error) {
                        console.error('검색 실패:', error);
                        const localResults = allNews.filter(article =>
                          article.title.toLowerCase().includes(keyword.keyword.toLowerCase()) ||
                          article.description.toLowerCase().includes(keyword.keyword.toLowerCase()) ||
                          article.category.toLowerCase().includes(keyword.keyword.toLowerCase())
                        );
                        setSearchModalResults(localResults);
                      } finally {
                        setSearchModalLoading(false);
                      }
                    }
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
                    onClick={() => handleNewsClick(article)}
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
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            {article.category}
                          </span>
                          <span>{article.source}</span>
                          <span>{new Date(article.pubDate).toLocaleDateString('ko-KR')}</span>
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
  );
}

