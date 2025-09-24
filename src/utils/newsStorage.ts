import { RSSArticle } from './rssApi';

// 뉴스를 백엔드 데이터베이스에 저장하는 함수
export async function saveNewsToBackend(article: RSSArticle): Promise<boolean> {
  try {
    console.log('📦 백엔드에 뉴스 저장 시도:', article.title);
    console.log('📦 원본 뉴스 ID:', article.id, '(타입:', typeof article.id, ')');
    
    // 숫자가 아닌 ID (해시)를 숫자로 변환
    let numericNewsId: number;
    if (typeof article.id === 'string') {
      // 해시 문자열을 숫자로 변환
      const numericFromRegex = parseInt(article.id.replace(/[^0-9]/g, ''));
      const numericFromHash = Math.abs(hashStringToNumber(article.id));
      numericNewsId = numericFromRegex || numericFromHash;
      
      console.log('📦 문자열 ID 변환:', {
        original: article.id,
        fromRegex: numericFromRegex,
        fromHash: numericFromHash,
        final: numericNewsId
      });
    } else {
      numericNewsId = parseInt(article.id);
      console.log('📦 숫자 ID 그대로 사용:', numericNewsId);
    }
    
    const newsData = {
      newsId: numericNewsId,
      title: article.title,
      content: article.description,
      category: article.category,
      source: article.source,
      imageUrl: article.imageUrl || null,
      url: article.link,
      publishedAt: article.pubDate,
      createdAt: new Date().toISOString()
    };
    
    console.log('📦 변환된 뉴스 데이터:', newsData);
    
    console.log('📡 백엔드 저장 API 호출 중...');
    const response = await fetch('http://localhost:8080/api/news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newsData),
    });
    
    console.log('📡 백엔드 저장 API 응답 상태:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ 뉴스 백엔드 저장 성공:', result);
      return true;
    } else {
      // 이미 존재하는 뉴스일 수도 있으므로 409 (Conflict)는 성공으로 간주
      if (response.status === 409) {
        console.log('⚠️ 이미 존재하는 뉴스 (무시):', numericNewsId);
        return true;
      }
      
      const errorText = await response.text();
      console.error('❌ 뉴스 백엔드 저장 실패:', response.status, response.statusText);
      console.error('❌ 에러 내용:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ 뉴스 백엔드 저장 중 오류:', error);
    return false;
  }
}

// 문자열을 숫자로 해시하는 함수
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

// 뉴스가 백엔드에 존재하는지 확인하는 함수
export async function checkNewsExistsInBackend(newsId: string): Promise<boolean> {
  try {
    console.log('🔍 뉴스 존재 확인 시작:', newsId);
    
    // 숫자가 아닌 ID (해시)를 숫자로 변환
    let numericNewsId: number;
    if (typeof newsId === 'string') {
      const numericFromRegex = parseInt(newsId.replace(/[^0-9]/g, ''));
      const numericFromHash = Math.abs(hashStringToNumber(newsId));
      numericNewsId = numericFromRegex || numericFromHash;
      
      console.log('🔍 ID 변환:', {
        original: newsId,
        fromRegex: numericFromRegex,
        fromHash: numericFromHash,
        final: numericNewsId
      });
    } else {
      numericNewsId = newsId;
    }
    
    console.log('🔍 백엔드 존재 확인 API 호출:', `/api/news/${numericNewsId}`);
    const response = await fetch(`http://localhost:8080/api/news/${numericNewsId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔍 백엔드 존재 확인 응답:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('🔍 백엔드 존재 확인 결과:', result);
      
      // 기본 뉴스 데이터가 아닌 실제 뉴스인지 확인
      const isRealNews = result.success && result.data && 
        result.data.title !== `뉴스 #${numericNewsId}` && 
        result.data.content !== '이 뉴스의 상세 내용을 불러올 수 없습니다. 나중에 다시 시도해주세요.';
      
      console.log('🔍 실제 뉴스 여부:', isRealNews);
      console.log('🔍 데이터 제목:', result.data?.title);
      console.log('🔍 기본 제목과 비교:', `뉴스 #${numericNewsId}`);
      
      return isRealNews;
    }
    
    console.log('🔍 뉴스 존재하지 않음 (응답 실패)');
    return false;
  } catch (error) {
    console.error('❌ 뉴스 존재 확인 중 오류:', error);
    return false;
  }
}

// 댓글 작성 전에 뉴스가 백엔드에 있는지 확인하고 없으면 저장하는 함수
export async function ensureNewsExistsInBackend(article: RSSArticle): Promise<boolean> {
  try {
    console.log('🔍 뉴스 백엔드 존재 확인 프로세스 시작');
    console.log('🔍 대상 뉴스:', {
      id: article.id,
      title: article.title,
      category: article.category,
      source: article.source
    });
    
    // 1. 먼저 백엔드에 뉴스가 있는지 확인
    console.log('🔍 1단계: 백엔드 존재 확인');
    const exists = await checkNewsExistsInBackend(article.id);
    
    if (exists) {
      console.log('✅ 뉴스가 이미 백엔드에 존재함 - 프로세스 완료');
      return true;
    }
    
    // 2. 없으면 저장
    console.log('🔍 2단계: 뉴스 백엔드 저장 시작');
    const saved = await saveNewsToBackend(article);
    
    if (saved) {
      console.log('✅ 뉴스 백엔드 저장 완료 - 프로세스 성공');
      
      // 3. 저장 후 다시 한 번 확인 (선택사항)
      console.log('🔍 3단계: 저장 후 재확인');
      const finalCheck = await checkNewsExistsInBackend(article.id);
      console.log('🔍 최종 확인 결과:', finalCheck);
      
      return true;
    } else {
      console.error('❌ 뉴스 백엔드 저장 실패 - 프로세스 실패');
      return false;
    }
  } catch (error) {
    console.error('❌ 뉴스 백엔드 확인/저장 중 오류:', error);
    return false;
  }
}
