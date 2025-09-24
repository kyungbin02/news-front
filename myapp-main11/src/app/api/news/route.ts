
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
