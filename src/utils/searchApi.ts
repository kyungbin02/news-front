// 검색 관련 API 함수들
import { RSSArticle } from '@/utils/rssApi';

export interface SearchKeyword {
  rank: number;
  keyword: string;
  count: number;
  change: 'up' | 'down' | 'same' | 'new';
}

export interface SearchSuggestion {
  keyword: string;
  count: number;
}

// 검색어 추적
export async function trackSearch(keyword: string): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8080/api/search-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword }),
      mode: 'cors',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error tracking search:', error);
    return false;
  }
}

// 실시간 검색어 가져오기
export async function getPopularSearches(limit: number = 10): Promise<SearchKeyword[]> {
  try {
    const response = await fetch(`http://localhost:8080/api/search-tracking/top?limit=${limit}`, {
      cache: 'no-store',
      mode: 'cors',
    });
    
    if (!response.ok) {
      console.warn('Backend not available for popular searches');
      return [];
    }
    
    const data = await response.json();
    console.log('Popular searches API response:', data);
    
    // 백엔드 응답 구조: { success: true, data: [...], total: number, limit: number }
    if (data.success && Array.isArray(data.data)) {
      return data.data.map((item: any, index: number) => ({
        rank: index + 1,
        keyword: item.keyword,
        count: item.searchCount,
        change: 'same' as const // 기본값으로 설정
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    return [];
  }
}

// 검색어 자동완성
export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const response = await fetch(`http://localhost:8080/api/search-tracking/recent?query=${encodeURIComponent(query)}`, {
      cache: 'no-store',
      mode: 'cors',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch suggestions');
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return [];
  }
}

// 백엔드 뉴스 검색 API (검색어 추적 포함) - 백엔드 실패 시 로컬 검색으로 대체
export async function searchNewsWithTracking(keyword: string, articles: RSSArticle[] = []): Promise<RSSArticle[]> {
  try {
    if (!keyword || keyword.trim().length === 0) {
      return articles;
    }

    // 백엔드 검색 시도
    try {
      const response = await fetch(`http://localhost:8080/api/news/search?keyword=${encodeURIComponent(keyword)}`, {
        cache: 'no-store',
        mode: 'cors',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // 백엔드 데이터를 프론트엔드 형식으로 변환
        if (data.success && data.data) {
          return data.data.map((newsItem: any) => ({
            id: newsItem.newsId.toString(),
            title: newsItem.title,
            description: newsItem.content,
            link: `/news/${newsItem.newsId}`,
            category: newsItem.category,
            source: newsItem.source || 'Backend News',
            imageUrl: newsItem.imageUrl,
            pubDate: newsItem.createdAt || new Date().toISOString()
          }));
        }
      }
    } catch (backendError) {
      console.warn('백엔드 검색 실패, 로컬 검색으로 대체:', backendError);
    }
    
    // 백엔드 실패 시 로컬 검색으로 대체
    return searchNews(keyword, articles);
    
  } catch (error) {
    console.error('Error searching news:', error);
    // 최종 실패 시에도 로컬 검색으로 대체
    return searchNews(keyword, articles);
  }
}

// 뉴스 검색 (기존 뉴스 데이터에서 검색) - 로컬 백업용
export function searchNews(keyword: string, articles: RSSArticle[]): RSSArticle[] {
  if (!keyword || keyword.trim().length === 0) {
    return articles;
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  
  return articles.filter(article => 
    article.title.toLowerCase().includes(normalizedKeyword) ||
    (article.description && article.description.toLowerCase().includes(normalizedKeyword)) ||
    (article.category && article.category.toLowerCase().includes(normalizedKeyword))
  );
}