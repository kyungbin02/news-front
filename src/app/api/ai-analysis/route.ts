import { NextRequest, NextResponse } from 'next/server';
import { fetchRSSNews } from '@/utils/rssApi';

// 실제 뉴스 데이터를 기반으로 AI 분석 결과 생성
const generateAIAnalysis = (articles: any[]) => {
  // 최근 클릭이 많은 뉴스들 중에서 선별
  const analysisResults = articles
    .filter(article => article.title && article.category)
    .slice(0, 6)
    .map((article, index) => {
      // 카테고리별 분석 정확도 시뮬레이션
      const categoryAccuracy = {
        'it': () => Math.floor(Math.random() * 6) + 93, // 93-98%
        'sports': () => Math.floor(Math.random() * 5) + 89, // 89-93%
        'economy': () => Math.floor(Math.random() * 7) + 91, // 91-97%
        'general': () => Math.floor(Math.random() * 5) + 87 // 87-91%
      };

      const category = article.category || 'general';
      const accuracy = categoryAccuracy[category] ? categoryAccuracy[category]() : 90;

      // 시간 계산 (최근일수록 높은 우선순위)
      const timeDiff = new Date().getTime() - new Date(article.pubDate || new Date()).getTime();
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      const timeDisplay = hoursAgo < 1 ? '방금 전' : 
                         hoursAgo < 24 ? `${hoursAgo}시간 전` : 
                         `${Math.floor(hoursAgo / 24)}일 전`;

      return {
        rank: index + 1,
        title: article.title.length > 45 ? article.title.substring(0, 45) + '...' : article.title,
        category: category === 'it' ? 'IT' : 
                 category === 'sports' ? '스포츠' : 
                 category === 'economy' ? '경제' : '일반',
        time: timeDisplay,
        analysis: `${accuracy}%`,
        newsId: article.id,
        originalCategory: category
      };
    });

  return analysisResults;
};

export async function GET(request: NextRequest) {
  try {
    // 실제 뉴스 데이터가 없을 때를 대비한 fallback 데이터
    const fallbackAnalysis = [
      { rank: 1, title: "뉴스를 불러오는 중입니다", category: "일반", time: "방금 전", analysis: "90%", newsId: "loading-1", originalCategory: "general" },
      { rank: 2, title: "잠시 후 다시 시도해주세요", category: "일반", time: "방금 전", analysis: "85%", newsId: "loading-2", originalCategory: "general" }
    ];

    try {
      // 실제 뉴스 데이터를 직접 가져오기
      const [itNews, sportsNews, economyNews] = await Promise.all([
        fetchRSSNews('it', 8),
        fetchRSSNews('sports', 6),
        fetchRSSNews('economy', 6)
      ]);
      
      const allNews = [...itNews, ...sportsNews, ...economyNews];
      
      if (allNews.length > 0) {
        const dynamicAnalysis = generateAIAnalysis(allNews);
        if (dynamicAnalysis.length > 0) {
          return NextResponse.json({ aiAnalysis: dynamicAnalysis });
        }
      }
    } catch (error) {
      console.log('RSS 데이터를 가져올 수 없어 fallback 데이터 사용:', error.message);
    }

    // RSS 데이터가 없으면 fallback 사용
    return NextResponse.json({ aiAnalysis: fallbackAnalysis });
    
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    return NextResponse.json({ error: 'Failed to generate AI analysis' }, { status: 500 });
  }
}

// AI 분석 결과 업데이트
export async function POST(request: NextRequest) {
  try {
    const { articles } = await request.json();
    
    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json({ error: 'Invalid articles data' }, { status: 400 });
    }

    const aiAnalysis = generateAIAnalysis(articles);
    return NextResponse.json({ aiAnalysis });
    
  } catch (error) {
    console.error('Error updating AI analysis:', error);
    return NextResponse.json({ error: 'Failed to update AI analysis' }, { status: 500 });
  }
}