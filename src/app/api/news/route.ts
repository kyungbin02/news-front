
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function getImageUrl(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const ogImage = $('meta[property="og:image"]').attr('content');
    return ogImage || null;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'IT';

  const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
  const NAVER_CLIENT_SECRET = process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET;

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    return NextResponse.json({ error: 'API credentials are missing' }, { status: 500 });
  }

  // 카테고리별 검색어 매핑
  const categoryQueries: { [key: string]: string } = {
    'IT': 'IT',
    'sports': '스포츠',
    'economy': '경제'
  };

  const query = categoryQueries[category] || 'IT';

  try {
    const response = await axios({
      method: 'get',
      url: 'https://openapi.naver.com/v1/search/news.json',
      params: {
        query,
        display: 6,
        sort: 'date'
      },
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
      }
    });

    // 각 뉴스 기사의 이미지 URL 가져오기
    const articlesWithImages = await Promise.all(
      response.data.items.map(async (item: any) => {
        const imageUrl = await getImageUrl(item.link);
        return {
          ...item,
          imageUrl
        };
      })
    );

    return NextResponse.json({
      ...response.data,
      items: articlesWithImages
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

// 뉴스 저장 (RSS 뉴스를 백엔드에 저장)
export async function POST(request: Request) {
  try {
    const newsData = await request.json();
    
    // 프론트엔드는 백엔드로 전달만 함 (실제 저장은 백엔드에서 처리)
    console.log('📦 백엔드로 뉴스 저장 요청 전달:', newsData.title);
    
    // 백엔드 API로 뉴스 저장 요청
    const backendResponse = await fetch('http://localhost:8080/api/news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newsData),
    });
    
    if (backendResponse.ok) {
      const result = await backendResponse.json();
      console.log('✅ 백엔드 뉴스 저장 성공:', result);
      return NextResponse.json({
        success: true,
        data: result.data,
        message: '뉴스가 성공적으로 저장되었습니다.'
      });
    } else {
      // 409 Conflict (이미 존재)는 성공으로 처리
      if (backendResponse.status === 409) {
        console.log('⚠️ 이미 존재하는 뉴스');
        return NextResponse.json({
          success: true,
          message: '이미 존재하는 뉴스입니다.'
        });
      }
      
      const errorText = await backendResponse.text();
      console.error('❌ 백엔드 뉴스 저장 실패:', backendResponse.status, errorText);
      return NextResponse.json({ 
        success: false,
        error: `백엔드 저장 실패: ${errorText}` 
      }, { status: backendResponse.status });
    }
  } catch (error) {
    console.error('뉴스 저장 API 오류:', error);
    return NextResponse.json({ 
      success: false,
      error: '뉴스 저장 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 
