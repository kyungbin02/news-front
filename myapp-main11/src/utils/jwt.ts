/**
 * JWT 토큰을 안전하게 파싱하는 유틸리티 함수들
 */

export interface JWTPayload {
  user_id: number;
  is_admin: boolean;
  username?: string;
  [key: string]: any;
}

/**
 * JWT 토큰을 파싱하여 페이로드를 반환합니다.
 * @param token JWT 토큰
 * @returns 파싱된 페이로드 또는 null
 */
export const parseJWT = (token: string): JWTPayload | null => {
  if (!token) {
    return null;
  }

  try {
    // JWT 토큰 형식 검증 (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('잘못된 JWT 토큰 형식:', token);
      return null;
    }

    // Base64 디코딩 (URL-safe Base64 처리)
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // 패딩 추가 (Base64 길이가 4의 배수가 되도록)
    const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    const decodedPayload = atob(paddedBase64);
    const parsedPayload = JSON.parse(decodedPayload);
    
    return parsedPayload;
  } catch (error) {
    console.error('JWT 토큰 파싱 오류:', error);
    console.error('토큰:', token);
    return null;
  }
};

/**
 * JWT 토큰에서 사용자 ID를 추출합니다.
 * @param token JWT 토큰
 * @returns 사용자 ID 또는 null
 */
export const getUserIdFromToken = (token: string): number | null => {
  const payload = parseJWT(token);
  return payload?.user_id || null;
};

/**
 * JWT 토큰에서 관리자 여부를 확인합니다.
 * @param token JWT 토큰
 * @returns 관리자 여부
 */
export const isAdminFromToken = (token: string): boolean => {
  const payload = parseJWT(token);
  return payload?.is_admin || false;
};

/**
 * JWT 토큰에서 사용자명을 추출합니다.
 * @param token JWT 토큰
 * @returns 사용자명 또는 null
 */
export const getUsernameFromToken = (token: string): string | null => {
  const payload = parseJWT(token);
  return payload?.username || null;
};



