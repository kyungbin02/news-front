// 동적 콘텐츠 API 관련 함수들

export interface AIAnalysisItem {
  rank: number;
  title: string;
  category: string;
  time: string;
  analysis: string;
  newsId?: string;
  originalCategory?: string;
}

export interface TrendingTopic {
  topic: string;
  description: string;
  articles: number;
  color: string;
  icon: string;
  category: string;
}

export interface AIFeature {
  feature: string;
  description: string;
  icon: string;
  accuracy: number;
}

export interface ReadingGuide {
  step: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface Recommendation {
  category: string;
  icon: string;
  count: string;
  color: string;
  clicks?: number;
}

// AI 분석 뉴스 가져오기
export async function getAIAnalysisNews(): Promise<AIAnalysisItem[]> {
  try {
    const response = await fetch('/api/ai-analysis', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch AI analysis');
    }
    
    const data = await response.json();
    return data.aiAnalysis || [];
  } catch (error) {
    console.error('Error fetching AI analysis news:', error);
    
    // 최소 Fallback 데이터
    return [];
  }
}

// 트렌딩 토픽 가져오기
export async function getTrendingTopics(): Promise<TrendingTopic[]> {
  try {
    const response = await fetch('/api/analytics?type=trending-topics', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch trending topics');
    }
    
    const data = await response.json();
    return data.trendingTopics || [];
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    
    // 최소 Fallback 데이터
    return [];
  }
}

// AI 분석 특징 가져오기
export async function getAIFeatures(): Promise<AIFeature[]> {
  try {
    const response = await fetch('/api/analytics?type=ai-features', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch AI features');
    }
    
    const data = await response.json();
    return data.aiFeatures || [];
  } catch (error) {
    console.error('Error fetching AI features:', error);
    
    // Fallback 데이터
    return [
      { feature: "핵심 포인트 추출", description: "뉴스의 가장 중요한 내용을 한눈에", icon: "🎯", accuracy: 95 },
      { feature: "배경 & 맥락 분석", description: "사건의 배경과 전후 맥락을 설명", icon: "📚", accuracy: 92 },
      { feature: "영향 & 전망 예측", description: "뉴스가 미칠 영향과 향후 전망", icon: "📈", accuracy: 89 },
      { feature: "관련 키워드 추출", description: "뉴스와 연관된 핵심 키워드 제공", icon: "🏷️", accuracy: 97 }
    ];
  }
}

// 읽기 가이드 가져오기
export async function getReadingGuide(): Promise<ReadingGuide[]> {
  try {
    const response = await fetch('/api/analytics?type=reading-guide', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch reading guide');
    }
    
    const data = await response.json();
    return data.readingGuide || [];
  } catch (error) {
    console.error('Error fetching reading guide:', error);
    
    // Fallback 데이터
    return [
      {
        step: "1단계",
        title: "AI 분석 결과 확인",
        description: "핵심 포인트, 배경, 영향을 먼저 파악",
        icon: "🧠",
        color: "bg-purple-500"
      },
      {
        step: "2단계", 
        title: "원문 내용 읽기",
        description: "AI 분석을 바탕으로 전체 기사 이해",
        icon: "📖",
        color: "bg-blue-500"
      },
      {
        step: "3단계",
        title: "관련 뉴스 연결",
        description: "키워드로 연관 뉴스까지 확인",
        icon: "🔗",
        color: "bg-green-500"
      }
    ];
  }
}

// 맞춤 추천 가져오기
export async function getPersonalizedRecommendations(): Promise<Recommendation[]> {
  try {
    const response = await fetch('/api/analytics?type=recommendations', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch recommendations');
    }
    
    const data = await response.json();
    return data.recommendations || [];
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    
    // Fallback 데이터
    return [
      { category: "테크", icon: "💻", count: "24개", color: "bg-gray-600" },
      { category: "스포츠", icon: "⚽", count: "18개", color: "bg-gray-600" },
      { category: "경제", icon: "📊", count: "31개", color: "bg-gray-600" },
      { category: "문화", icon: "🎨", count: "12개", color: "bg-gray-600" }
    ];
  }
}

// 분석 통계 업데이트
export async function updateAnalyticsStats(category: string): Promise<boolean> {
  try {
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category, action: 'update_stats' }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error updating analytics stats:', error);
    return false;
  }
}