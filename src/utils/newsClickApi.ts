// 뉴스 클릭 추적 API

export interface NewsClickTrackingData {
  news_id: number;
  news_title: string;
}

export interface NewsClickResponse {
  success: boolean;
  message?: string;
  data?: {
    news_id: number;
    news_title: string;
    click_count: number;
  };
  error?: string;
}

export interface PopularNews {
  news_id: number;
  news_title: string;
  click_count: number;
  last_clicked_at: string;
}

export interface PopularNewsResponse {
  success: boolean;
  data: PopularNews[];
  total: number;
  limit: number;
  error?: string;
}

// 뉴스 클릭 추적 기록
export async function trackNewsClick(newsId: string, newsTitle: string): Promise<NewsClickResponse> {
  try {
    // ID를 숫자로 변환 (해시나 문자열 ID를 처리)
    const numericId = parseInt(newsId.replace(/[^0-9]/g, '')) || Math.abs(hashStringToNumber(newsId));
    
    console.log(`뉴스 클릭 추적: ${newsTitle} (ID: ${numericId})`);
    
    const response = await fetch('http://localhost:8080/api/news-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newsId: numericId,
        title: newsTitle,
        category: 'general',
        url: `/news/${newsId}`
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '클릭 추적 실패');
    }

    return {
      success: true,
      message: '클릭 추적 성공',
      data: {
        news_id: numericId,
        news_title: newsTitle,
        click_count: 1
      }
    };
  } catch (error) {
    console.error('뉴스 클릭 추적 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

// 인기 뉴스 조회
export async function getPopularNews(limit: number = 10): Promise<PopularNewsResponse> {
  try {
    // 백엔드 URL 설정 (CORS 문제 방지를 위해 환경 변수 사용)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const url = `${backendUrl}/api/news/popular?limit=${limit}`;
    
    console.log('인기뉴스 API 호출:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '인기 뉴스 조회 실패');
    }

    // 백엔드 응답을 프론트엔드 형식으로 변환
    console.log('백엔드 원본 응답:', data);
    
    if (data.success && Array.isArray(data.data)) {
      const transformedData = data.data.map((item: any) => ({
        news_id: item.newsId,
        news_title: item.newsTitle || item.title || `뉴스 #${item.newsId}`,
        click_count: item.clickCount || 0,
        last_clicked_at: item.createdAt
      }));
      
      console.log('변환된 데이터:', transformedData);
      
      return {
        success: true,
        data: transformedData,
        total: data.total || transformedData.length,
        limit: data.limit || limit
      };
    } else {
      console.log('백엔드 응답 형식이 예상과 다름:', data);
      return {
        success: false,
        data: [],
        total: 0,
        limit,
        error: '백엔드 응답 형식 오류'
      };
    }
  } catch (error) {
    console.error('인기 뉴스 조회 오류:', error);
    return {
      success: false,
      data: [],
      total: 0,
      limit,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

// 문자열을 숫자로 해시화하는 함수
function hashStringToNumber(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit 정수로 변환
  }
  
  return Math.abs(hash);
}
