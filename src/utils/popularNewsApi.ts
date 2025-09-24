// 인기뉴스 관련 API 함수들
import { RSSArticle } from './rssApi';

export interface PopularNews {
  rank: number;
  newsId: number;
  title: string;
  clickCount: number;
  category?: string;
  source?: string;
  createdAt?: string;
  imageUrl?: string;
}

// 전역적으로 현재 진행 중인 추적 요청들을 저장
const ongoingTrackingRequests = new Map<string, Promise<boolean>>();

// 뉴스 클릭 추적
export async function trackNewsClick(newsId: string, title: string, category?: string, url?: string): Promise<boolean> {
  const trackingKey = `track_${newsId}`;
  
  // 이미 같은 newsId에 대한 요청이 진행 중이면 그 결과를 반환
  if (ongoingTrackingRequests.has(trackingKey)) {
    console.log(`이미 뉴스 ${newsId} 추적 중입니다. 기존 요청을 대기합니다.`);
    return await ongoingTrackingRequests.get(trackingKey)!;
  }

  // 새로운 추적 요청 생성
  const trackingPromise = (async () => {
    try {
      const requestData = { 
        newsId: newsId, // 문자열 그대로 전송
        title, 
        category: category || 'general',
        url: url || ''
      };
      
      console.log(`뉴스 ${newsId} 조회수 추적 API 호출 시작`);
      console.log('전송할 데이터:', requestData);
      
      const response = await fetch('http://localhost:8080/api/news-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        mode: 'cors',
      });
      
      const isSuccess = response.ok;
      console.log(`뉴스 ${newsId} 조회수 추적 API 응답:`, isSuccess ? '성공' : '실패');
      return isSuccess;
    } catch (error) {
      console.error('Error tracking news click:', error);
      return false;
    } finally {
      // 요청 완료 후 맵에서 제거
      ongoingTrackingRequests.delete(trackingKey);
      console.log(`뉴스 ${newsId} 추적 요청 완료, 맵에서 제거됨`);
    }
  })();

  // 진행 중인 요청으로 등록
  ongoingTrackingRequests.set(trackingKey, trackingPromise);
  
  return await trackingPromise;
}

// 개별 뉴스 상세 정보 가져오기
async function getNewsDetails(newsId: number): Promise<{ title: string; category?: string; source?: string; imageUrl?: string } | null> {
  try {
    const response = await fetch(`http://localhost:8080/api/news/${newsId}`, {
      cache: 'no-store',
      mode: 'cors',
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.success && data.data) {
      return {
        title: data.data.title,
        category: data.data.category,
        source: data.data.source,
        imageUrl: data.data.imageUrl
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching news details for ${newsId}:`, error);
    return null;
  }
}

// 인기뉴스 TOP 조회
export async function getPopularNews(limit: number = 10): Promise<PopularNews[]> {
  try {
    const response = await fetch(`http://localhost:8080/api/news/popular?limit=${limit}`, {
      cache: 'no-store',
      mode: 'cors',
    });
    
    if (!response.ok) {
      console.warn('Backend not available for popular news');
      return [];
    }
    
    const data = await response.json();
    console.log('Popular news API response:', data);
    
    // 백엔드 응답 구조: { success: true, data: [...], total: number, limit: number }
    if (data.success && Array.isArray(data.data)) {
      // 제목이 없는 뉴스들의 상세 정보를 병렬로 가져오기
      const newsWithDetails = await Promise.all(
        data.data.map(async (item: any, index: number) => {
          let title = item.newsTitle || item.title;
          let category = item.category || 'general';
          let source = item.source || 'Backend News';
          let imageUrl = '/image/news.webp'; // 기본 이미지
          
          // 제목이 비어있거나 깨진 문자면 기본값으로 설정
          if (!title || title.trim() === '' || title.includes('?')) {
            title = `뉴스 #${item.newsId}`;
          }
          
          return {
            rank: index + 1,
            newsId: item.newsId,
            title,
            clickCount: item.clickCount || 0,
            category,
            source,
            createdAt: item.createdAt,
            imageUrl
          };
        })
      );
      
      return newsWithDetails;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching popular news:', error);
    return [];
  }
}

// 인기뉴스를 RSSArticle 형식으로 변환하여 조회
export async function getPopularNewsAsArticles(limit: number = 10): Promise<RSSArticle[]> {
  try {
    const response = await fetch(`http://localhost:8080/api/news/popular?limit=${limit}`, {
      cache: 'no-store',
      mode: 'cors',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch popular news');
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data.map((item: any) => ({
        id: item.newsId.toString(),
        title: item.title,
        description: item.content || '',
        link: `/news/${item.newsId}`,
        category: item.category || 'general',
        source: item.source || 'Backend News',
        imageUrl: item.imageUrl || '',
        pubDate: item.createdAt || new Date().toISOString()
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching popular news as articles:', error);
    return [];
  }
}

// 특정 뉴스의 클릭수 조회
export async function getNewsClickCount(newsId: string): Promise<number> {
  try {
    const response = await fetch(`http://localhost:8080/api/news-click/${newsId}`, {
      cache: 'no-store',
      mode: 'cors',
    });
    
    if (!response.ok) {
      return 0;
    }
    
    const data = await response.json();
    return data.clickCount || 0;
  } catch (error) {
    console.error('Error fetching news click count:', error);
    return 0;
  }
}