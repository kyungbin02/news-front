import { NextRequest, NextResponse } from 'next/server';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

// 캐시 시스템 (실제 운영에서는 Redis 등 사용 권장)
const cache = new Map<string, { data: RSSArticle[], timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10분 캐시

// 실패한 RSS 피드 추적 (일정 시간 건너뛰기)
const failedFeeds = new Map<string, number>();
const RETRY_DELAY = 5 * 60 * 1000; // 5분 후 재시도

// RSS 피드 URL 목록 (백엔드에서 자동 카테고리 분류)
const ALL_RSS_FEEDS = [
  // General (전체/종합)
  'https://rss.donga.com/total.xml',
  'https://rss.joins.com/joins_news_list.xml',
  
  // Economy (경제)
  'https://rss.donga.com/economy.xml',
  
  // Sports (스포츠)
  'https://rss.donga.com/sports.xml'
];

// 백엔드 카테고리 분류 로직과 동일한 함수
function determineCategoryFromUrl(url: string): string {
  if (url.includes('sports')) return 'sports';
  if (url.includes('economy')) return 'economy';
  if (url.includes('total') || url.includes('joins.com')) return 'general';
  return 'general'; // 기본값
}

// 카테고리별 키워드 필터링 (백엔드와 동일한 분류 사용)
const CATEGORY_KEYWORDS = {
  general: ['전체', '종합', '뉴스', '일반', '사회', '정치', '국제', '국내'],
  sports: ['스포츠', '축구', '야구', '농구', '배구', '테니스', '골프', '올림픽', '월드컵', '선수', '경기', '리그', '팀', '감독', '코치', '훈련', '경기장', '승부', '우승', '메달', '기록'],
  economy: ['경제', '금융', '증시', '주식', '투자', '기업', '산업', '무역', '수출', '수입', 'GDP', '인플레이션', '금리', '환율', '부동산', '채권', '펀드', '은행', '보험', '재정', '예산', '세금', '일자리', '고용']
};

interface RSSArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  url?: string; // 원문 URL
  pubDate: string;
  source: string;
  category: string;
  imageUrl?: string;
}

// 간단한 해시 함수
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit 정수로 변환
  }
  return Math.abs(hash).toString(36);
}

// HTML 태그 제거 함수
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

// RSS 아이템을 RSSArticle로 변환
function parseRSSItem(item: any, source: string, category: string): RSSArticle {
  const title = item.title?.[0] || '';
  const description = item.description?.[0] || '';
  const link = item.link?.[0] || '';
  const pubDate = item.pubDate?.[0] || new Date().toISOString();
  
  // 이미지 URL 추출 (여러 방식 시도 - 고화질 우선)
  let imageUrl = '';
  
  try {
    // 1. content:encoded에서 이미지 찾기 (본문에 고화질 이미지가 있을 가능성 높음)
    if (item['content:encoded']) {
      const content = item['content:encoded'][0] || '';
      const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
    }
    
    // 2. description에서 img 태그 추출 (개선된 정규식)
    if (!imageUrl && description) {
      const imgMatches = [
        description.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i),
        description.match(/src=["']([^"']*\.(jpg|jpeg|png|gif|webp|bmp)[^"']*)["']/i),
        description.match(/https?:\/\/[^\s<>"']*\.(jpg|jpeg|png|gif|webp|bmp)/i)
      ];
      
      for (const match of imgMatches) {
        if (match && match[1]) {
          imageUrl = match[1];
          break;
        }
      }
    }
    
    // 3. enclosure 태그에서 이미지 찾기
    if (!imageUrl && item.enclosure && item.enclosure[0] && item.enclosure[0].$.url) {
      const enclosureUrl = item.enclosure[0].$.url;
      if (enclosureUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
        imageUrl = enclosureUrl;
      }
    }
    
    // 4. media:content에서 이미지 찾기
    if (!imageUrl && item['media:content']) {
      const mediaContent = Array.isArray(item['media:content']) ? item['media:content'][0] : item['media:content'];
      if (mediaContent && mediaContent.$ && mediaContent.$.url) {
        const mediaUrl = mediaContent.$.url;
        if (mediaUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) || mediaContent.$.type?.includes('image')) {
          imageUrl = mediaUrl;
        }
      }
    }
    
    // 5. media:thumbnail에서 이미지 찾기 (썸네일은 화질이 낮을 수 있음)
    if (!imageUrl && item['media:thumbnail']) {
      const mediaThumbnail = Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'][0] : item['media:thumbnail'];
      if (mediaThumbnail && mediaThumbnail.$ && mediaThumbnail.$.url) {
        imageUrl = mediaThumbnail.$.url;
      }
    }
    
    // 6. 기타 이미지 필드들 확인
    if (!imageUrl) {
      const imageFields = ['image', 'thumbnail', 'photo', 'picture'];
      for (const field of imageFields) {
        if (item[field] && item[field][0]) {
          const fieldValue = typeof item[field][0] === 'string' ? item[field][0] : item[field][0]._ || item[field][0].$.url;
          if (fieldValue && fieldValue.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
            imageUrl = fieldValue;
            break;
          }
        }
      }
    }
    
    // 7. URL 정리 및 검증
    if (imageUrl) {
      // 상대 경로를 절대 경로로 변환
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl.startsWith('/')) {
        const baseUrl = new URL(link).origin;
        imageUrl = baseUrl + imageUrl;
      }
      
      // URL 유효성 검사
      try {
        new URL(imageUrl);
      } catch {
        imageUrl = ''; // 유효하지 않은 URL이면 제거
      }
    }
    
  } catch (error) {
    console.warn('이미지 추출 중 오류:', error);
    imageUrl = '';
  }

  return {
    id: simpleHash(link),
    title: stripHtml(title),
    description: stripHtml(description).substring(0, 100) + '...', // 100자로 줄임
    link,
    url: link, // 원문 URL (link와 동일)
    pubDate,
    source,
    category,
    imageUrl
  };
}

// RSS 피드 가져오기 (캐싱 및 실패 추적 포함)
async function fetchRSSFeed(url: string, source: string, category: string): Promise<RSSArticle[]> {
  // 캐시 확인
  const cacheKey = `${url}_${category}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Cache hit for ${source}`);
    return cached.data;
  }
  
  // 실패한 피드 확인 (일정 시간 건너뛰기)
  const lastFailTime = failedFeeds.get(url);
  if (lastFailTime && Date.now() - lastFailTime < RETRY_DELAY) {
    console.log(`Skipping failed feed ${source} (retry in ${Math.round((RETRY_DELAY - (Date.now() - lastFailTime)) / 1000)}s)`);
    return [];
  }

  try {
    console.log(`Fetching RSS from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsPortal/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.warn(`RSS 피드 오류 (${response.status}): ${url}`);
      failedFeeds.set(url, Date.now()); // 실패 기록
      return [];
    }
    
    const xmlText = await response.text();
    
    if (!xmlText || xmlText.length < 100) {
      console.warn(`RSS 피드 내용이 너무 짧음: ${url}`);
      failedFeeds.set(url, Date.now()); // 실패 기록
      return [];
    }
    
    console.log(`XML length: ${xmlText.length}`);
    
    const result = await parseXML(xmlText) as any;
    
    // RSS 구조 검증
    if (!result?.rss?.channel?.[0]?.item && !result?.feed?.entry) {
      console.warn(`유효하지 않은 RSS 구조: ${url}`);
      failedFeeds.set(url, Date.now()); // 실패 기록
      return [];
    }
    
    // RSS 2.0 또는 Atom 피드 처리
    const items = result?.rss?.channel?.[0]?.item || result?.feed?.entry || [];
    console.log(`Found ${items.length} items from ${source}`);
    
    if (items.length === 0) {
      console.warn(`RSS 피드에 기사가 없음: ${url}`);
      failedFeeds.set(url, Date.now()); // 실패 기록
      return [];
    }
    
    const articles: RSSArticle[] = [];
    
    items.forEach((item: any, index: number) => {
      if (index < 50) { // RSS당 최대 50개 기사
        try {
          const article = parseRSSItem(item, source, category);
          if (article.title && article.link) { // 필수 필드 검증
            articles.push(article);
          }
        } catch (itemError) {
          console.warn(`기사 파싱 오류 (${source}):`, itemError);
        }
      }
    });
    
    console.log(`Successfully parsed ${articles.length} articles from ${source}`);
    
    // 성공 시 캐시에 저장 및 실패 기록 제거
    cache.set(cacheKey, { data: articles, timestamp: Date.now() });
    failedFeeds.delete(url);
    
    return articles;
    
  } catch (error) {
    console.error(`RSS 피드 가져오기 실패 (${source}): ${url}`, error);
    failedFeeds.set(url, Date.now()); // 실패 기록
    return [];
  }
}

// 기사가 특정 카테고리와 관련있는지 확인
function isRelevantToCategory(article: RSSArticle, category: string): boolean {
  const keywords = CATEGORY_KEYWORDS[category as keyof typeof CATEGORY_KEYWORDS] || [];
  const text = (article.title + ' ' + article.description).toLowerCase();
  
  return keywords.some(keyword => text.includes(keyword.toLowerCase()));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'it';
  const limit = parseInt(searchParams.get('limit') || '6'); // 기본 6개, 더보기 시 전체
  
  console.log(`RSS API called with category: ${category}, limit: ${limit}`);
  
  // 전체 결과 캐시 확인
  const resultCacheKey = `result_${category}_${limit}`;
  const cachedResult = cache.get(resultCacheKey);
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
    console.log(`Full result cache hit for category: ${category}`);
    return NextResponse.json(cachedResult.data);
  }
  
  try {
    // 백엔드 카테고리 분류 로직을 사용하여 해당 카테고리에 맞는 피드만 필터링
    const relevantFeeds = ALL_RSS_FEEDS.filter(feedUrl => {
      const determinedCategory = determineCategoryFromUrl(feedUrl);
      return determinedCategory === category;
    });
    
    console.log(`Processing ${relevantFeeds.length} RSS feeds for category: ${category}`);
    console.log(`Relevant feeds:`, relevantFeeds);
    
    // 해당 카테고리에 맞는 RSS 피드를 병렬로 처리
    const feedPromises = relevantFeeds.map(async (feedUrl) => {
      const sourceName = new URL(feedUrl).hostname.replace('www.', '').replace('rss.', '');
      const determinedCategory = determineCategoryFromUrl(feedUrl);
      return await fetchRSSFeed(feedUrl, sourceName, determinedCategory);
    });
    
    const feedResults = await Promise.allSettled(feedPromises);
    const allArticles: RSSArticle[] = [];
    let successfulFeeds = 0;
    let failedFeeds = 0;
    
    feedResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
        if (result.value.length > 0) {
          successfulFeeds++;
        }
      } else {
        failedFeeds++;
        console.error(`Feed ${index} failed:`, result.reason);
      }
    });
    
    console.log(`Feed processing complete: ${successfulFeeds} successful, ${failedFeeds} failed`);
    console.log(`Total articles fetched: ${allArticles.length}`);
    
    if (allArticles.length === 0) {
      console.warn('No articles found from any RSS feed');
      return NextResponse.json([]);
    }
    
    // 발행일 기준으로 정렬
    allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    
    // 중복 제거 (제목 기준)
    const uniqueArticles = allArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    );
    
    console.log(`Unique articles: ${uniqueArticles.length}`);
    
    // 카테고리별 키워드 필터링
    const filteredArticles = uniqueArticles.filter(article => isRelevantToCategory(article, category));
    
    console.log(`Filtered articles: ${filteredArticles.length}`);
    
    // 필터링된 기사가 충분하지 않으면 원본 기사도 포함
    let finalArticles = filteredArticles;
    if (filteredArticles.length < 30) { // 최소 30개는 확보
      console.log('Not enough filtered articles, including additional articles');
      const additionalArticles = uniqueArticles
        .filter(article => !isRelevantToCategory(article, category))
        .slice(0, 30 - filteredArticles.length);
      finalArticles = [...filteredArticles, ...additionalArticles];
    }
    
    // 이미지가 있는 기사를 우선적으로 배치
    finalArticles.sort((a, b) => {
      if (a.imageUrl && !b.imageUrl) return -1;
      if (!a.imageUrl && b.imageUrl) return 1;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });
    
    console.log(`Final articles: ${finalArticles.length}`);
    console.log(`Articles with images: ${finalArticles.filter(a => a.imageUrl).length}`);
    
    // limit에 따라 반환할 기사 수 결정
    const resultArticles = limit === -1 ? finalArticles : finalArticles.slice(0, limit);
    
    // 결과 캐시에 저장
    cache.set(resultCacheKey, { data: resultArticles, timestamp: Date.now() });
    
    return NextResponse.json(resultArticles);
    
  } catch (error) {
    console.error('RSS parsing error:', error);
    return NextResponse.json(
      { error: 'RSS 파싱 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}