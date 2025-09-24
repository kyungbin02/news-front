import type { Comment, ApiResponse } from '@/types/comment';

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api';

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

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  
  // 다양한 토큰 키에서 검색 (기존 auth.ts와 동일)
  const possibleTokenKeys = [
    'accessToken', 'token', 'jwt', 'jwt_token', 'authToken', 'bearerToken',
    'access_token', 'id_token', 'refresh_token'
  ];

  let token: string | null = null;
  for (const key of possibleTokenKeys) {
    const sessionToken = sessionStorage.getItem(key);
    const localToken = localStorage.getItem(key);
    if (sessionToken || localToken) {
      token = sessionToken || localToken;
      break;
    }
  }
  
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 댓글 목록 (인증 불필요)
export async function getComments(newsId: string | number): Promise<Comment[]> {
  try {
    // 숫자가 아닌 ID (해시)를 숫자로 변환
    let numericNewsId: number;
    if (typeof newsId === 'string') {
      // 해시 문자열을 숫자로 변환
      numericNewsId = parseInt(newsId.replace(/[^0-9]/g, '')) || Math.abs(hashStringToNumber(newsId));
    } else {
      numericNewsId = newsId;
    }
    
    console.log('🔍 백엔드 댓글 API 호출:', `${API}/comments/news/${numericNewsId}`, `(원본 ID: ${newsId})`);
    
    const res = await fetch(`${API}/comments/news/${numericNewsId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    
    console.log('🔍 댓글 API 응답 상태:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('🔍 댓글 API 오류:', res.status, errorText);
      
      // 로그인 페이지로 리다이렉트된 경우
      if (res.status === 302 || res.url.includes('/login')) {
        console.error('🔍 백엔드에서 로그인 페이지로 리다이렉트됨');
        throw new Error('댓글 조회에 인증이 필요합니다. 백엔드 설정을 확인해주세요.');
      }
      
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const json: ApiResponse<Comment[]> = await res.json();
    console.log('🔍 댓글 API 응답 데이터:', json);
    
    if (!json.success || !Array.isArray(json.data)) {
      console.warn('🔍 댓글 API 응답 형식 오류:', json);
      return [];
    }
    
    return json.data;
  } catch (error) {
    console.error('🔍 댓글 목록 조회 실패:', error);
    throw error;
  }
}

// 댓글 작성 (로그인 필요)
export async function createComment(payload: { newsId: string | number; content: string; parentId?: number | null }): Promise<Comment> {
  // 숫자가 아닌 ID (해시)를 숫자로 변환
  let numericNewsId: number;
  if (typeof payload.newsId === 'string') {
    // 해시 문자열을 숫자로 변환
    numericNewsId = parseInt(payload.newsId.replace(/[^0-9]/g, '')) || Math.abs(hashStringToNumber(payload.newsId));
  } else {
    numericNewsId = payload.newsId;
  }

  console.log('💬 백엔드 댓글 작성 API 호출:', numericNewsId);

  const res = await fetch(`${API}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      newsId: numericNewsId,
      content: payload.content,
      parentId: payload.parentId
    }),
  });
  const json: ApiResponse<Comment> = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || '댓글 작성 실패');
  }
  return json.data;
}

// 댓글 수정 (로그인 필요)
export async function updateComment(commentId: number, content: string): Promise<boolean> {
  const res = await fetch(`${API}/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ content }),
  });
  const json: ApiResponse<unknown> = await res.json();
  return !!json.success;
}

// 댓글 삭제 (로그인 필요)
export async function deleteComment(commentId: number): Promise<boolean> {
  const res = await fetch(`${API}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  const json: ApiResponse<unknown> = await res.json();
  return !!json.success;
}

// 좋아요 토글 (로그인 필요)
export async function toggleCommentLike(commentId: number): Promise<boolean> {
  const res = await fetch(`${API}/comments/${commentId}/reaction`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  const json: ApiResponse<unknown> = await res.json();
  return !!json.success;
}

// 좋아요 수 조회
export async function getCommentLikeCount(commentId: number): Promise<number> {
  const res = await fetch(`${API}/comments/${commentId}/likes`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  const json: ApiResponse<unknown> = await res.json();
  return (json.success && typeof (json as any).likeCount === 'number') ? (json as any).likeCount : 0;
}

// 대댓글 목록 조회
export async function getReplies(commentId: number): Promise<Comment[]> {
  try {
    console.log('🔍 대댓글 API 호출:', `${API}/comments/${commentId}/replies`);
    
    const res = await fetch(`${API}/comments/${commentId}/replies`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    
    console.log('🔍 대댓글 API 응답 상태:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('🔍 대댓글 API 오류:', res.status, errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const json: ApiResponse<Comment[]> = await res.json();
    console.log('🔍 대댓글 API 응답 데이터:', json);
    
    if (!json.success || !Array.isArray(json.data)) {
      console.warn('🔍 대댓글 API 응답 형식 오류:', json);
      return [];
    }
    
    return json.data;
  } catch (error) {
    console.error('🔍 대댓글 목록 조회 실패:', error);
    throw error;
  }
}