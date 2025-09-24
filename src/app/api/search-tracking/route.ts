import { NextRequest, NextResponse } from 'next/server';

// 간단한 검색 추적 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, category = 'general' } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: '검색어가 필요합니다.' },
        { status: 400 }
      );
    }

    // 여기서 실제로는 데이터베이스에 검색 기록을 저장합니다
    console.log(`🔍 검색 추적: "${query}" (카테고리: ${category})`);

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '검색이 추적되었습니다.',
      data: {
        query,
        category,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('검색 추적 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET 요청도 처리 (테스트용)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: '검색 추적 API가 정상 작동 중입니다.',
    timestamp: new Date().toISOString()
  });
}




