'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getPopularSearches } from '@/utils/searchApi';

interface PopularNews {
  newsId?: number;
  news_id?: number;
  title?: string;
  newsTitle?: string;
  source?: string;
  clickCount?: number;
  click_count?: number;
  views?: number;
  category?: string;
}

interface SearchKeyword {
  keyword: string;
  rank: number;
  count: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [popularNews, setPopularNews] = useState<PopularNews[]>([]);
  const [searchKeywords, setSearchKeywords] = useState<SearchKeyword[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'economy', label: '경제', href: '/economy', icon: '💰' },
    { id: 'sports', label: '스포츠', href: '/sports', icon: '⚽' },
    { id: 'column', label: '칼럼', href: '/column', icon: '📝' }
  ];

  // 인기뉴스 로드
  const loadPopularNews = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/news/popular?limit=4');
      const data = await response.json();
      console.log('인기뉴스 API 응답:', data);
      if (data.success && data.data.length > 0) {
        console.log('인기뉴스 데이터:', data.data);
        // 데이터 구조에 맞게 매핑
        const mappedNews = data.data.map((news: any) => ({
          newsId: news.newsId || news.news_id || 0,
          title: news.title || news.newsTitle || '제목 없음',
          source: news.source || '알 수 없는 출처',
          clickCount: news.clickCount || news.click_count || news.views || 0,
          category: news.category || 'general'
        }));
        console.log('매핑된 인기뉴스:', mappedNews);
        setPopularNews(mappedNews);
      } else {
        console.log('인기뉴스 데이터가 없습니다:', data);
      }
    } catch (error) {
      console.error('인기뉴스 로드 실패:', error);
      // 백엔드 실패 시 폴백 데이터
      const fallbackNews = [
        {
          newsId: 1,
          title: 'AI 기술 혁신으로 업계 변화',
          source: '조선일보',
          clickCount: 1200,
          category: 'tech'
        },
        {
          newsId: 2,
          title: '경제 정책 변화로 시장 반응',
          source: '매일경제',
          clickCount: 850,
          category: 'economy'
        },
        {
          newsId: 3,
          title: '스포츠 이슈로 화제',
          source: '동아일보',
          clickCount: 630,
          category: 'sports'
        },
        {
          newsId: 4,
          title: 'IT 업계 새로운 트렌드',
          source: '전자신문',
          clickCount: 470,
          category: 'tech'
        }
      ];
      console.log('폴백 인기뉴스 사용:', fallbackNews);
      setPopularNews(fallbackNews);
    }
  };

  // 실시간 검색어 로드
  const loadSearchKeywords = async () => {
    try {
      const keywords = await getPopularSearches(6);
      setSearchKeywords(keywords);
    } catch (error) {
      console.error('실시간 검색어 로드 실패:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadPopularNews(),
          loadSearchKeywords()
        ]);
      } catch (error) {
        console.error('사이드바 데이터 로드 실패:', error);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  return (
    <div className="w-80 shrink-0">
      <div className="sticky top-4 space-y-6">
        {/* 카테고리 메뉴 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📂</span>
            카테고리
          </h3>
          <nav className="space-y-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  pathname === category.href
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-base">{category.icon}</span>
                {category.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 인기 뉴스 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🔥</span>
            인기 뉴스
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex items-start space-x-3 p-2">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : popularNews.length > 0 ? (
            <div className="space-y-3">
              {popularNews.map((news, index) => (
                <Link
                  key={news.newsId || index}
                  href={`/news/${news.newsId || index}`}
                  className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1 hover:text-blue-600 transition-colors truncate" title={news.title || '제목 없음'}>
                      {news.title || news.newsTitle || '제목 없음'}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{news.source || '알 수 없는 출처'}</span>
                      <span>•</span>
                      <span>{(news.clickCount || news.click_count || news.views || 0).toLocaleString()} 조회</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">인기 뉴스가 없습니다</p>
            </div>
          )}
        </div>

        {/* 실시간 검색어 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🔍</span>
            실시간 키워드
          </h3>
          {loading ? (
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="px-3 py-1 bg-gray-200 rounded-full h-6 w-16 animate-pulse"></div>
              ))}
            </div>
          ) : searchKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {searchKeywords.map((keyword, index) => (
                <span
                  key={keyword.keyword}
                  className={`px-3 py-1 text-xs rounded-full transition-colors cursor-pointer ${
                    index < 3 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {keyword.keyword}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">검색어가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 