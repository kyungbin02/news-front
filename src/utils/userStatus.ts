import { getToken } from './token';

// JWT 토큰에서 user_id 추출
const getUserIdFromToken = (token: string): number | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ JWT 토큰 형식이 올바르지 않습니다.');
      return null;
    }

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    console.log('🔍 JWT 페이로드:', payload);
    
    // user_id 또는 id 필드에서 사용자 ID 추출
    const userId = payload.user_id || payload.id || payload.userId;
    
    if (userId) {
      console.log('✅ JWT에서 user_id 추출 성공:', userId);
      return parseInt(userId.toString());
    } else {
      console.log('❌ JWT 페이로드에서 user_id를 찾을 수 없습니다.');
      return null;
    }
  } catch (error) {
    console.error('💥 JWT 토큰 파싱 오류:', error);
    return null;
  }
};

export interface UserStatus {
  user_id: number;
  user_status: string;
  sanction_reason?: string;
  sanction_start_date?: string;
  sanction_end_date?: string;
  admin_comment?: string;
}

// 사용자 상태 확인
export const checkUserStatus = async (): Promise<UserStatus | null> => {
  try {
    const token = getToken();
    if (!token) {
      console.log('🔑 토큰이 없어서 사용자 상태를 확인할 수 없습니다.');
      return null;
    }

    // JWT 토큰에서 user_id 추출
    const userId = getUserIdFromToken(token);
    if (!userId) {
      console.log('❌ JWT 토큰에서 user_id를 추출할 수 없습니다.');
      return null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
    
    // 일반 사용자용 API 시도 (우선순위)
    let apiUrl = `${baseUrl}/api/user/status`;
    console.log('🔍 사용자 상태 확인 API 호출 (일반 사용자용):', apiUrl);
    
    let response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // 401 오류인 경우 관리자 API로 재시도
    if (response.status === 401) {
      console.log('⚠️ 일반 사용자 API 401 오류, 관리자 API로 재시도');
      apiUrl = `${baseUrl}/api/admin/user/${userId}/status`;
      console.log('🔍 사용자 상태 확인 API 호출 (관리자용):', apiUrl);
      
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('📡 사용자 상태 API 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (response.ok) {
      const data = await response.json();
      console.log('👤 사용자 상태 확인 성공:', data);
      return data;
    } else {
      console.log('❌ 사용자 상태 확인 실패:', response.status, response.statusText);
      
      // 401 또는 404 오류인 경우 API가 구현되지 않았거나 권한 문제
      if (response.status === 401 || response.status === 404) {
        console.log('⚠️ 사용자 상태 API가 구현되지 않았거나 권한 문제입니다. 백엔드 개발자에게 요청하세요.');
      }
      
      return null;
    }
  } catch (error) {
    console.error('💥 사용자 상태 확인 오류:', error);
    return null;
  }
};

// 경고/정지 상태 확인 및 알림 표시
// 반환값: true = 로그인 차단 (정지), false = 로그인 허용 (경고 또는 정상)
export const checkAndShowUserStatusAlert = async (): Promise<boolean> => {
  try {
    console.log('🔍 사용자 상태 알림 확인 시작');
    
    const userStatus = await checkUserStatus();
    
    if (!userStatus) {
      console.log('❌ 사용자 상태 정보를 가져올 수 없습니다.');
      return false;
    }

    // 경고 상태인 경우
    if (userStatus.user_status === 'warning') {
      const message = `⚠️ 경고 조치\n\n` +
        `관리자 코멘트: ${userStatus.sanction_reason || '없음'}\n\n` +
        `서비스 이용 시 주의해주세요.`;
      
      alert(message);
      return true;
    }

    // 정지 상태인 경우
    if (userStatus.user_status === 'suspended') {
      const startDate = userStatus.sanction_start_date ? 
        new Date(userStatus.sanction_start_date).toLocaleDateString() : '알 수 없음';
      const endDate = userStatus.sanction_end_date ? 
        new Date(userStatus.sanction_end_date).toLocaleDateString() : '알 수 없음';
      
      const message = `🚫 계정 정지\n\n` +
        `사유: ${userStatus.sanction_reason || '없음'}\n` +
        `정지 기간: ${startDate} ~ ${endDate}\n\n` +
        `정지 기간 동안 로그인이 제한됩니다.\n` +
        `정지 해제 후 다시 로그인해주세요.`;
      
      alert(message);
      
      // 정지된 사용자는 로그아웃 처리
      const { removeToken } = await import('./token');
      removeToken();
      window.location.href = '/';
      
      return true;
    }

    return false;
  } catch (error) {
    console.error('사용자 상태 알림 확인 오류:', error);
    return false;
  }
};
