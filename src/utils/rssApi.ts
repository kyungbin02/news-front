// RSS API 인터페이스
export interface RSSArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  imageUrl?: string;
  aiSummary?: string[];
  summaryGenerated?: boolean;
}

// RSS 뉴스 가져오기
export async function fetchRSSNews(category: string, limit: number = 6): Promise<RSSArticle[]> {
  try {
    console.log(`Fetching RSS news for category: ${category}, limit: ${limit}`);
    
    // 서버사이드에서는 절대 URL 필요
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_URL || 'https://your-domain.com'
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/rss?category=${category.toLowerCase()}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('RSS API response:', data);

    // 에러 응답 체크
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Error fetching RSS news:', error);
    
    // 에러 시 빈 배열 반환
    return [];
  }
} 