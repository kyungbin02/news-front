// 마이뉴스 관련 API 함수들
import { RSSArticle } from './rssApi';

export interface Bookmark {
  bookmarkId: number;
  userId: number;
  newsId: number;
  newsTitle: string;
  newsContent?: string;
  imageUrl?: string;
  category: string;
  createdAt: string;
}

export interface ViewHistory {
  id?: number; // 호환성을 위해 optional로 유지
  viewId: number; // 백엔드에서 실제로 주는 필드
  newsId: string;
  newsTitle: string;
  newsImageUrl?: string;
  category: string;
  viewedAt: string;
  readTime: number; // 읽은 시간 (초)
}

export interface NewsDetail {
  newsId: number;
  title: string;
  content: string;
  imageUrl?: string;
  category: string;
  publishDate: string;
  source?: string;
}

export interface MyComment {
  id: number;
  newsId: string;
  newsTitle: string;
  content: string;
  createdAt: string;
  likeCount: number;
  parentCommentId?: number | null;
}

export interface Inquiry {
  id: number;
  title: string;
  content: string;
  status: 'pending' | 'answered' | 'closed';
  createdAt: string;
  answeredAt?: string;
  answer?: string;
}

// 북마크 관련 API
export async function getBookmarks(): Promise<Bookmark[]> {
  try {
    const response = await fetch('http://localhost:8080/api/bookmarks', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token') || localStorage.getItem('access_token') || localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login';
      return [];
    }
    
    if (!response.ok) {
      console.error('북마크 조회 API 오류:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log('📚 북마크 API 응답:', data);
    
    // ✅ 안전한 처리: data.data가 undefined일 수 있으므로 빈 배열로 fallback
    const bookmarks = data.data || [];
    
    // 저장된 뉴스 데이터에서 이미지 찾아서 추가
    const bookmarksWithImages = bookmarks.map((bookmark: any) => {
      const imageUrl = getImageFromStoredNews(bookmark.newsId?.toString(), bookmark.newsTitle);
      return {
        ...bookmark,
        imageUrl: imageUrl
      };
    });
    
    console.log('📚 이미지가 적용된 북마크 목록:', bookmarksWithImages.length, '개');
    return bookmarksWithImages;
  } catch (error) {
    console.error('북마크 조회 실패:', error);
    return []; // 오류 시 빈 배열 반환
  }
}

export async function addBookmark(newsId: string, newsTitle: string, category: string = 'general'): Promise<boolean> {
  try {
    const requestBody = {
      newsId: parseInt(newsId)
    };
    
    console.log('📌 북마크 추가 요청:', requestBody);
    
    const response = await fetch('http://localhost:8080/api/bookmarks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token') || localStorage.getItem('access_token') || localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('📌 북마크 추가 응답:', response.status, response.statusText);
    
    if (response.status === 401) {
      window.location.href = '/login';
      return false;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('북마크 추가 오류:', errorText);
      return false;
    }
    
    console.log('✅ 북마크 추가 성공');
    return true;
  } catch (error) {
    console.error('북마크 추가 실패:', error);
    return false;
  }
}

export async function removeBookmark(bookmarkId: number): Promise<boolean> {
  try {
    console.log('🗑️ 북마크 삭제 요청:', bookmarkId);
    
    const response = await fetch(`http://localhost:8080/api/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token') || localStorage.getItem('access_token') || localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🗑️ 북마크 삭제 응답:', response.status, response.statusText);
    
    if (response.status === 401) {
      window.location.href = '/login';
      return false;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('북마크 삭제 오류:', errorText);
      return false;
    }
    
    console.log('✅ 북마크 삭제 성공');
    return true;
  } catch (error) {
    console.error('북마크 삭제 실패:', error);
    return false;
  }
}

// 북마크 여부 확인
export async function checkBookmark(newsId: string): Promise<{ isBookmarked: boolean; bookmark?: Bookmark }> {
  try {
    console.log('🔍 북마크 확인 요청:', newsId);
    
    const response = await fetch(`http://localhost:8080/api/bookmarks/check/${newsId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token') || localStorage.getItem('access_token') || localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔍 북마크 확인 응답:', response.status, response.statusText);
    
    if (response.status === 401) {
      window.location.href = '/login';
      return { isBookmarked: false };
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('북마크 확인 오류:', errorText);
      return { isBookmarked: false };
    }
    
    const data = await response.json();
    console.log('🔍 북마크 확인 데이터:', data);
    
    // ✅ 안전한 처리
    return {
      isBookmarked: data?.isBookmarked || false,
      bookmark: data?.bookmark || undefined
    };
  } catch (error) {
    console.error('북마크 확인 실패:', error);
    return { isBookmarked: false };
  }
}

// 저장된 뉴스 데이터에서 이미지 찾기 (localStorage 활용)
export const getImageFromStoredNews = (newsId: string, newsTitle: string): string => {
  try {
    if (typeof window === 'undefined') return '/image/news.webp';
    
    const storedArticles = localStorage.getItem('newsArticles');
    if (!storedArticles) return '/image/news.webp';
    
    const articles = JSON.parse(storedArticles);
    
    // 1. newsId로 먼저 찾기
    const byId = articles.find((article: any) => article.id === newsId);
    if (byId && byId.imageUrl) {
      console.log(`✅ ID로 이미지 발견: ${newsId} -> ${byId.imageUrl}`);
      return byId.imageUrl;
    }
    
    // 2. 제목으로 찾기 (부분 매칭)
    const byTitle = articles.find((article: any) => 
      article.title && newsTitle && (
        article.title.includes(newsTitle.substring(0, 10)) ||
        newsTitle.includes(article.title.substring(0, 10))
      )
    );
    if (byTitle && byTitle.imageUrl) {
      console.log(`✅ 제목으로 이미지 발견: "${newsTitle}" -> ${byTitle.imageUrl}`);
      return byTitle.imageUrl;
    }
    
    console.log(`⚠️ 저장된 뉴스에서 이미지를 찾지 못함: ${newsId}, "${newsTitle}"`);
  } catch (error) {
    console.log(`❌ 저장된 뉴스 검색 실패: ${newsId}`, error);
  }
  
  return '/image/news.webp'; // 기본 이미지
};

// 최근 본 뉴스 관련 API (메인페이지 방식과 동일하게 실제 이미지 시도 후 기본 이미지 대체)
export async function getViewHistory(): Promise<ViewHistory[]> {
  try {
    const response = await fetch('http://localhost:8080/api/view-history?limit=20', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token') || localStorage.getItem('access_token') || localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      window.location.href = '/login';
      return [];
    }
    
    if (!response.ok) {
      throw new Error('조회 기록 조회 실패');
    }
    
    const data = await response.json();
    
    const viewHistory = data.data || [];
    
    // 중복 제거: 같은 뉴스 ID의 경우 가장 최근 조회 기록만 유지
    const uniqueHistory = viewHistory.reduce((acc: any[], current: any) => {
      const existingIndex = acc.findIndex(item => item.newsId === current.newsId);
      
      if (existingIndex === -1) {
        // 새로운 뉴스인 경우 추가
        acc.push(current);
      } else {
        // 이미 존재하는 뉴스인 경우, 더 최근 것으로 교체
        const existing = acc[existingIndex];
        if (new Date(current.viewedAt) > new Date(existing.viewedAt)) {
          acc[existingIndex] = current;
        }
      }
      
      return acc;
    }, []);
    
    // 최신순으로 정렬
    uniqueHistory.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
    
    console.log(`📖 중복 제거 전: ${viewHistory.length}개, 후: ${uniqueHistory.length}개`);
    
    // 메인페이지에서 저장된 뉴스 데이터와 연관지어 이미지 가져오기
    const historyWithImages = uniqueHistory.map((item: any) => {
      const imageUrl = getImageFromStoredNews(item.newsId, item.newsTitle);
      return {
        ...item,
        newsImageUrl: imageUrl
      };
    });
    
    console.log('📖 조회 기록 이미지 적용:', historyWithImages.length, '개');
    const successCount = historyWithImages.filter(item => item.newsImageUrl !== '/image/news.webp').length;
    console.log(`📖 실제 이미지: ${successCount}개, 기본 이미지: ${historyWithImages.length - successCount}개`);
    
    return historyWithImages;
  } catch (error) {
    console.error('조회 기록 조회 실패:', error);
    return [];
  }
}

export async function addViewHistory(newsId: string, newsTitle: string, category: string = 'general', readTime: number = 0): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8080/api/view-history', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token') || localStorage.getItem('access_token') || localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newsId: parseInt(newsId),
        readTime
      }),
    });
    
    if (response.status === 401) {
      window.location.href = '/login';
      return false;
    }
    
    return response.ok;
  } catch (error) {
    console.error('조회 기록 추가 실패:', error);
    return false;
  }
}

// 내가 쓴 댓글 관련 API (임시 데이터 - 백엔드 완성 전까지)
export async function getMyComments(): Promise<MyComment[]> {
  try {
    console.log('💬 내 댓글 조회 API 호출 시작');
    
    const response = await fetch('http://localhost:8080/api/comments/my', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token') || localStorage.getItem('access_token') || localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('💬 내 댓글 조회 응답 상태:', response.status);
    
    if (response.status === 401) {
      console.log('❌ 인증 실패 - 로그인 페이지로 이동');
      window.location.href = '/login';
      return [];
    }
    
    if (!response.ok) {
      console.error('❌ 내 댓글 조회 API 오류:', response.status, response.statusText);
      
      // 백엔드 API가 아직 구현되지 않은 경우 임시 데이터 반환
      if (response.status === 404) {
        console.log('⚠️ 댓글 API가 구현되지 않음 - 임시 데이터 사용');
        return getTemporaryComments();
      }
      
      return [];
    }
    
    const data = await response.json();
    console.log('💬 내 댓글 API 응답:', data);
    
    // 백엔드 응답 데이터를 프론트엔드 형식으로 변환
    const comments = (data.data || []).map((comment: any) => ({
      id: comment.commentId || comment.id,
      newsId: comment.newsId?.toString() || "0",
      newsTitle: comment.newsTitle || "제목 없음",
      content: comment.content || "",
      createdAt: comment.createdAt || new Date().toISOString(),
      likeCount: comment.likeCount || 0,
      parentCommentId: comment.parentCommentId || null
    }));
    
    console.log('✅ 내 댓글 조회 성공:', comments.length, '개');
    return comments;
    
  } catch (error) {
    console.error('❌ 내 댓글 조회 실패:', error);
    
    // 네트워크 오류 등의 경우 임시 데이터 반환
    console.log('⚠️ 네트워크 오류 - 임시 데이터 사용');
    return getTemporaryComments();
  }
}

// 임시 댓글 데이터 (백엔드 API 구현 전까지 사용)
function getTemporaryComments(): MyComment[] {
  return [
    {
      id: 1,
      newsId: "1",
      newsTitle: "삼성, 폴더블폰 신제품 공개",
      content: "정말 기대되는 신제품이네요! 언제 출시되나요?",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      likeCount: 5
    },
    {
      id: 2,
      newsId: "2",
      newsTitle: "국내 경제 성장률 전망치 상승",
      content: "경제 전망이 밝아지고 있네요. 좋은 소식입니다.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      likeCount: 3
    }
  ];
}

// 문의사항 관련 API (임시 데이터 - 백엔드 완성 전까지)
export async function getInquiries(): Promise<Inquiry[]> {
  // 임시 데이터 반환 (백엔드 완성 전까지)
  return [
    {
      id: 1,
      title: "뉴스 알림 설정 문의",
      content: "관심있는 카테고리 뉴스 알림을 받고 싶습니다. 어떻게 설정하나요?",
      status: "answered",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      answeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      answer: "마이페이지 > 알림 설정에서 원하는 카테고리를 선택하실 수 있습니다."
    },
    {
      id: 2,
      title: "댓글 작성 오류",
      content: "댓글을 작성하려고 하는데 오류가 발생합니다.",
      status: "pending",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}

export async function createInquiry(title: string, content: string): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8080/api/inquiries', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token') || localStorage.getItem('access_token') || localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('문의사항 생성 실패:', error);
    return false;
  }
}

// 사용자 통계 관련 API
export async function getUserStats(): Promise<{
  totalBookmarks: number;
  totalViews: number;
  totalComments: number;
  categoryStats: { category: string; count: number; percentage: number }[];
}> {
  try {
    const response = await fetch('http://localhost:8080/api/view-history/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token') || localStorage.getItem('access_token') || localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      window.location.href = '/login';
      return {
        totalBookmarks: 0,
        totalViews: 0,
        totalComments: 0,
        categoryStats: []
      };
    }
    
    if (!response.ok) {
      throw new Error('사용자 통계 조회 실패');
    }
    
    const data = await response.json();
    return data.data || {
      totalBookmarks: 0,
      totalViews: 0,
      totalComments: 0,
      categoryStats: []
    };
  } catch (error) {
    console.error('사용자 통계 조회 실패:', error);
    return {
      totalBookmarks: 0,
      totalViews: 0,
      totalComments: 0,
      categoryStats: []
    };
  }
}

// 뉴스 상세 정보 가져오기 (이미지 포함)
export const getNewsDetail = async (newsId: string): Promise<NewsDetail | null> => {
  try {
    console.log('📰 뉴스 상세 정보 조회:', newsId, '(타입:', typeof newsId, ')');
    
    // newsId 유효성 검사
    if (!newsId || newsId === 'undefined' || newsId === 'null') {
      console.warn('❌ 유효하지 않은 newsId:', newsId);
      return null;
    }
    
    const apiUrl = `http://localhost:8080/api/news/${newsId}`;
    console.log('📰 API 호출 URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📰 응답 상태:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('📰 뉴스 상세 응답:', data);
      
      if (data.success && data.data) {
        const newsData = data.data;
        return {
          newsId: newsData.newsId,
          title: newsData.title,
          content: newsData.content,
          imageUrl: newsData.imageUrl,
          category: newsData.category,
          publishDate: newsData.publishDate,
          source: newsData.source
        };
      }
    } else {
      // 400 오류의 경우 응답 본문도 확인
      const errorText = await response.text();
      console.error('❌ 뉴스 상세 조회 실패:', response.status, response.statusText);
      console.error('❌ 오류 응답 본문:', errorText);
    }
    
    return null;
  } catch (error) {
    console.error('❌ 뉴스 상세 조회 오류:', error);
    return null;
  }
}

// 여러 뉴스의 상세 정보를 배치로 가져오기 (이미지 포함)
export const getMultipleNewsDetails = async (newsIds: string[]): Promise<{[key: string]: NewsDetail}> => {
  try {
    console.log('📰 여러 뉴스 상세 정보 배치 조회:', newsIds);
    
    // 유효한 newsId만 필터링
    const validNewsIds = newsIds.filter(id => id && id !== 'undefined' && id !== 'null' && String(id).trim() !== '');
    console.log('📰 유효한 newsId 목록:', validNewsIds);
    
    if (validNewsIds.length === 0) {
      console.warn('📰 조회할 유효한 newsId가 없습니다.');
      return {};
    }
    
    // Promise.allSettled로 변경하여 일부 실패해도 다른 것들은 계속 처리
    const promises = validNewsIds.map(id => getNewsDetail(id));
    const results = await Promise.allSettled(promises);
    
    const newsMap: {[key: string]: NewsDetail} = {};
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        newsMap[validNewsIds[index]] = result.value;
      } else if (result.status === 'rejected') {
        console.error('📰 newsId', validNewsIds[index], '조회 실패:', result.reason);
      }
    });
    
    console.log('📰 배치 조회 완료, 성공:', Object.keys(newsMap).length, '/', validNewsIds.length);
    return newsMap;
  } catch (error) {
    console.error('❌ 여러 뉴스 상세 조회 오류:', error);
    return {};
  }
}
