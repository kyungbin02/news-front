// JWT 토큰 관리 유틸리티

// 토큰을 localStorage에 저장
export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jwt_token', token);
  }
};

// localStorage에서 토큰 가져오기
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jwt_token');
  }
  return null;
};

// 토큰 삭제
// 로그아웃 시 auth-storage 전체를 지우는 것이 안전할 수 있습니다.
// 만약 다른 정보도 함께 저장한다면 token 필드만 null로 업데이트해야 합니다.
export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jwt_token');
  }
};

// 토큰이 유효한지 확인 (기본적인 형식 체크)
export const isTokenValid = (token: string): boolean => {
  if (!token) return false;
  
  // JWT 토큰은 3개의 부분으로 구성되어 있음 (header.payload.signature)
  const parts = token.split('.');
  return parts.length === 3;
};

// Authorization 헤더 생성
export const getAuthHeader = (): { Authorization: string } | {} => {
  const token = getToken();
  if (token && isTokenValid(token)) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}; 