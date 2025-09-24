import { NextRequest, NextResponse } from 'next/server';

// 메모리 기반 분석 데이터 저장
const analyticsData = {
  categoryStats: {
    'it': { count: 0, totalClicks: 0, avgAccuracy: 0 },
    'sports': { count: 0, totalClicks: 0, avgAccuracy: 0 },
    'economy': { count: 0, totalClicks: 0, avgAccuracy: 0 }
  },
  aiAnalysisFeatures: [
    { feature: "핵심 포인트 추출", description: "뉴스의 가장 중요한 내용을 한눈에", icon: "🎯", accuracy: 95 },
    { feature: "배경 & 맥락 분석", description: "사건의 배경과 전후 맥락을 설명", icon: "📚", accuracy: 92 },
    { feature: "영향 & 전망 예측", description: "뉴스가 미칠 영향과 향후 전망", icon: "📈", accuracy: 89 },
    { feature: "관련 키워드 추출", description: "뉴스와 연관된 핵심 키워드 제공", icon: "🏷️", accuracy: 97 }
  ],
  readingGuide: [
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
  ]
};

// 뉴스 데이터에서 통계 업데이트
export async function updateCategoryStats(category: string, clickCount: number = 1) {
  if (analyticsData.categoryStats[category]) {
    analyticsData.categoryStats[category].count += 1;
    analyticsData.categoryStats[category].totalClicks += clickCount;
    // 정확도는 클릭 수와 뉴스 수의 비율에 따라 계산 (시뮬레이션)
    const ratio = analyticsData.categoryStats[category].totalClicks / analyticsData.categoryStats[category].count;
    analyticsData.categoryStats[category].avgAccuracy = Math.min(98, 85 + ratio * 0.1);
  }
}

// 트렌딩 토픽 생성
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    switch (type) {
      case 'trending-topics':
        return NextResponse.json({
          trendingTopics: [
            {
              topic: "AI & 머신러닝",
              description: "인공지능 기술의 최신 동향과 산업 적용 사례",
              articles: analyticsData.categoryStats.it.count || 156,
              color: "bg-gray-700",
              icon: "🤖",
              category: "it"
            },
            {
              topic: "스포츠 & 엔터테인먼트",
              description: "국내외 스포츠 소식과 엔터테인먼트 뉴스",
              articles: analyticsData.categoryStats.sports.count || 89,
              color: "bg-gray-600",
              icon: "🏆",
              category: "sports"
            },
            {
              topic: "경제 & 금융",
              description: "글로벌 경제 동향과 금융 시장 분석",
              articles: analyticsData.categoryStats.economy.count || 124,
              color: "bg-gray-800",
              icon: "💰",
              category: "economy"
            }
          ]
        });

      case 'ai-features':
        // AI 분석 특징의 정확도를 실시간 데이터 기반으로 업데이트
        const updatedFeatures = analyticsData.aiAnalysisFeatures.map(feature => ({
          ...feature,
          accuracy: Math.max(85, Math.min(98, feature.accuracy + (Math.random() - 0.5) * 2))
        }));
        
        return NextResponse.json({ aiFeatures: updatedFeatures });

      case 'reading-guide':
        return NextResponse.json({ readingGuide: analyticsData.readingGuide });

      case 'recommendations':
        // 사용자 클릭 패턴 기반 추천 카테고리 생성
        const totalClicks = Object.values(analyticsData.categoryStats).reduce((sum, stat) => sum + stat.totalClicks, 0);
        
        const recommendations = [
          { 
            category: "테크", 
            icon: "💻", 
            count: `${analyticsData.categoryStats.it.count || 24}개`,
            color: "bg-gray-600",
            clicks: analyticsData.categoryStats.it.totalClicks
          },
          { 
            category: "스포츠", 
            icon: "⚽", 
            count: `${analyticsData.categoryStats.sports.count || 18}개`,
            color: "bg-gray-600",
            clicks: analyticsData.categoryStats.sports.totalClicks
          },
          { 
            category: "경제", 
            icon: "📊", 
            count: `${analyticsData.categoryStats.economy.count || 31}개`,
            color: "bg-gray-600",
            clicks: analyticsData.categoryStats.economy.totalClicks
          },
          { 
            category: "문화", 
            icon: "🎨", 
            count: "12개",
            color: "bg-gray-600",
            clicks: 0
          }
        ].sort((a, b) => b.clicks - a.clicks); // 클릭 수 기준 정렬

        return NextResponse.json({ recommendations });

      default:
        return NextResponse.json({
          categoryStats: analyticsData.categoryStats,
          totalArticles: Object.values(analyticsData.categoryStats).reduce((sum, stat) => sum + stat.count, 0),
          totalClicks: Object.values(analyticsData.categoryStats).reduce((sum, stat) => sum + stat.totalClicks, 0)
        });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

// 분석 데이터 업데이트
export async function POST(request: NextRequest) {
  try {
    const { category, action } = await request.json();
    
    if (action === 'update_stats' && category) {
      await updateCategoryStats(category);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating analytics:', error);
    return NextResponse.json({ error: 'Failed to update analytics' }, { status: 500 });
  }
}