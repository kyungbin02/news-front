import { NextRequest, NextResponse } from 'next/server';

// 임시 뉴스 데이터베이스 (실제 프로젝트에서는 실제 DB 사용)
const mockNewsDatabase: { [key: string]: any } = {};

// localStorage에서 뉴스 찾기 (클라이언트 데이터 활용)
function findNewsFromLocalStorage(newsId: string): any | null {
  // 이 부분은 실제로는 서버에서 실행되므로 localStorage 접근 불가
  // 대신 RSS 데이터나 실제 DB에서 조회해야 함
  return null;
}

// RSS 데이터에서 뉴스 찾기 (백업용)
async function findNewsFromRSS(newsId: string): Promise<any | null> {
  try {
    // 모든 카테고리에서 뉴스 검색
    const categories = ['it', 'sports', 'economy'];
    
    for (const category of categories) {
      const rssResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/rss?category=${category}`, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (rssResponse.ok) {
        const rssData = await rssResponse.json();
        const foundArticle = rssData.articles?.find((article: any) => 
          article.id === newsId || article.id === parseInt(newsId)
        );
        
        if (foundArticle) {
          return {
            newsId: foundArticle.id,
            title: foundArticle.title,
            content: foundArticle.description,
            category: foundArticle.category,
            source: foundArticle.source,
            imageUrl: foundArticle.imageUrl,
            createdAt: foundArticle.pubDate,
            link: foundArticle.link
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('RSS에서 뉴스 검색 실패:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 뉴스 상세 API 호출 - ID:', id);
    
    // 숫자 ID 검증
    if (!id || !/^\d+$/.test(id)) {
      console.log('❌ 잘못된 뉴스 ID:', id);
      return NextResponse.json(
        { 
          success: false, 
          error: '유효하지 않은 뉴스 ID입니다.' 
        }, 
        { status: 400 }
      );
    }
    
    // 1. 임시 데이터베이스에서 먼저 찾기
    let newsData = mockNewsDatabase[id];
    
    // 2. RSS 데이터에서 찾기 (백업)
    if (!newsData) {
      console.log('📡 RSS에서 뉴스 검색 중...');
      newsData = await findNewsFromRSS(id);
    }
    
    // 3. 데이터가 없으면 기본 응답
    if (!newsData) {
      console.log('❌ 뉴스를 찾을 수 없음:', id);
      
      // 기본 뉴스 데이터 반환 (404 대신)
      const defaultNews = {
        newsId: parseInt(id),
        title: `뉴스 #${id}`,
        content: '이 뉴스의 상세 내용을 불러올 수 없습니다. 나중에 다시 시도해주세요.',
        category: 'general',
        source: 'Unknown',
        imageUrl: '/image/news.webp',
        createdAt: new Date().toISOString(),
        link: `/news/${id}`
      };
      
      return NextResponse.json({
        success: true,
        data: defaultNews,
        message: '기본 뉴스 데이터가 반환되었습니다.'
      });
    }
    
    console.log('✅ 뉴스 데이터 찾음:', newsData.title);
    
    return NextResponse.json({
      success: true,
      data: newsData
    });
    
  } catch (error) {
    console.error('뉴스 상세 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '뉴스 조회 중 오류가 발생했습니다.' 
      }, 
      { status: 500 }
    );
  }
}

// 뉴스 데이터 저장 (동적으로 뉴스 추가할 때 사용)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsData = await request.json();
    
    // 임시 데이터베이스에 저장
    mockNewsDatabase[id] = {
      newsId: parseInt(id),
      ...newsData,
      createdAt: newsData.createdAt || new Date().toISOString()
    };
    
    console.log('✅ 뉴스 데이터 저장됨:', id, newsData.title);
    
    return NextResponse.json({
      success: true,
      message: '뉴스가 성공적으로 저장되었습니다.'
    });
    
  } catch (error) {
    console.error('뉴스 저장 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '뉴스 저장 중 오류가 발생했습니다.' 
      }, 
      { status: 500 }
    );
  }
}
