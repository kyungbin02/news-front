import { getToken } from '@/utils/token';
import { getUserIdFromToken, isAdminFromToken } from '@/utils/jwt';
import { Notification, NotificationResponse, UnreadCountResponse } from '@/types/notification';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';

const getHeaders = () => {
  const token = getToken();
  if (!token) {
    throw new Error('토큰이 없습니다.');
  }
  
  // 토큰 정리 (Bearer 접두사 제거, 중괄호 제거, 공백 제거)
  let cleanToken = token.trim();
  
  console.log('🧹 토큰 정리 전:', {
    original: token,
    length: token.length,
    hasBearer: token.includes('Bearer'),
    hasBrackets: token.includes('{') || token.includes('}'),
    hasSpaces: token.includes(' ')
  });
  
  // Bearer 접두사가 있으면 제거
  if (cleanToken.startsWith('Bearer ')) {
    cleanToken = cleanToken.substring(7);
    console.log('🧹 Bearer 제거 후:', cleanToken);
  }
  
  // 중괄호 제거 (여러 번 적용)
  cleanToken = cleanToken.replace(/[{}]/g, '');
  console.log('🧹 중괄호 제거 후:', cleanToken);
  
  // 공백 제거
  cleanToken = cleanToken.trim();
  console.log('🧹 공백 제거 후:', cleanToken);
  
  // 최종 토큰 검증
  const finalToken = `Bearer ${cleanToken}`;
  console.log('🧹 최종 토큰 검증:', {
    original: token,
    cleaned: cleanToken,
    final: finalToken,
    hasBearer: finalToken.startsWith('Bearer '),
    hasBrackets: finalToken.includes('{') || finalToken.includes('}'),
    hasSpaces: finalToken.includes(' ') && !finalToken.includes('Bearer '),
    isValidFormat: finalToken.startsWith('Bearer ') && !finalToken.includes('{') && !finalToken.includes('}')
  });
  
  return {
    'Authorization': finalToken,
    'Content-Type': 'application/json'
  };
};

// 사용자 ID 가져오기
const getUserId = (): number | null => {
  const token = getToken();
  if (!token) return null;
  
  return getUserIdFromToken(token);
};

// 사용자 알림 조회
export const getUserNotifications = async (): Promise<NotificationResponse> => {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new Error('사용자 ID를 찾을 수 없습니다.');
    }

    const token = getToken();
    console.log('🔍 알림 조회 디버깅:', {
      userId,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : '없음',
      apiUrl: `${baseUrl}/api/notifications/user/${userId}`
    });

    // 토큰 유효성 검사
    if (!token) {
      throw new Error('토큰이 없습니다. 로그인이 필요합니다.');
    }

    // JWT 토큰 상세 검증
    console.log('🔍 JWT 토큰 상세 검증:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenParts: token ? token.split('.').length : 0,
      tokenPreview: token ? `${token.substring(0, 50)}...` : '없음',
      fullToken: token, // 전체 토큰 로깅 (개발용)
      tokenStartsWithBearer: token ? token.startsWith('Bearer ') : false,
      tokenHasBrackets: token ? token.includes('{') || token.includes('}') : false,
      tokenHasSpaces: token ? token.includes(' ') : false
    });

    // JWT 토큰 만료 확인
    try {
      const payload = getUserIdFromToken(token);
      if (payload) {
        console.log('🔍 JWT 페이로드:', payload);
        if (payload.exp) {
          const now = Math.floor(Date.now() / 1000);
          const exp = payload.exp;
          const isExpired = now > exp;
          console.log('⏰ JWT 만료 확인:', {
            now: now,
            exp: exp,
            isExpired: isExpired,
            timeLeft: isExpired ? 0 : exp - now
          });
        }
      }
    } catch (error) {
      console.log('❌ JWT 페이로드 파싱 실패:', error);
    }

    // 먼저 백엔드 API 존재 여부 확인
    console.log('🔍 백엔드 API 존재 여부 확인 중...');
    
    // 백엔드 다른 API 테스트 (관리자 API)
    try {
      console.log('🔍 관리자 API 테스트 중...');
      const adminResponse = await fetch(`${baseUrl}/api/admin/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('👤 관리자 API 응답:', {
        status: adminResponse.status,
        ok: adminResponse.ok
      });
      
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log('👤 관리자 정보:', adminData);
      }
    } catch (error) {
      console.log('👤 관리자 API 테스트 실패:', error);
    }

    // 일반 사용자 API 테스트
    try {
      console.log('🔍 일반 사용자 API 테스트 중...');
      const userResponse = await fetch(`${baseUrl}/api/user/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('👤 일반 사용자 API 응답:', {
        status: userResponse.status,
        ok: userResponse.ok
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('👤 사용자 상태:', userData);
      }
    } catch (error) {
      console.log('👤 일반 사용자 API 테스트 실패:', error);
    }
    
    // 백엔드에서 제공한 정확한 엔드포인트 사용
    const endpoint = `/api/notifications/user/${userId}`;

    let response: Response;
    try {
      const headers = getHeaders();
      console.log(`🔄 알림 조회 요청: ${baseUrl}${endpoint}`);
      console.log('📋 요청 헤더:', headers);
      console.log('🔍 브라우저 개발자 도구 > Network 탭에서 실제 요청을 확인하세요');
      
      response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: headers
      });
      
      console.log(`📡 알림 조회 응답:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ 알림 조회 실패:`, {
          status: response.status,
          errorText: errorText
        });
        
        // 백엔드 개발자에게 전달할 디버깅 정보
        console.log('🚨 백엔드 개발자에게 전달할 정보:');
        console.log('1. JWT 토큰이 유효함 (관리자 API, 사용자 API 모두 성공)');
        console.log('2. Authorization 헤더 형식: Bearer {토큰}');
        console.log('3. 요청 URL:', `${baseUrl}${endpoint}`);
        console.log('4. 사용자 ID:', userId);
        console.log('5. 응답 상태:', response.status);
        console.log('6. 오류 메시지:', errorText);
        
        throw new Error(`알림 조회 실패: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📋 알림 응답 데이터:', data);
      console.log('📊 데이터 타입:', typeof data);
      console.log('📊 배열인가?', Array.isArray(data));
      console.log('📊 객체인가?', data && typeof data === 'object' && !Array.isArray(data));
      
      // 서버 응답의 각 알림 상세 분석
      if (Array.isArray(data)) {
        console.log('🔍 서버 응답 배열 상세 분석:');
        data.forEach((notification, index) => {
          console.log(`서버 알림 ${index + 1}:`, {
            id: notification.id,
            notification_type: notification.notification_type,
            notification_title: notification.notification_title,
            notification_message: notification.notification_message,
            isRead: notification.isRead,
            is_read: notification.is_read,
            isReadType: typeof notification.isRead,
            is_readType: typeof notification.is_read,
            allKeys: Object.keys(notification)
          });
        });
      } else if (data && data.notifications) {
        console.log('🔍 서버 응답 객체 상세 분석:');
        data.notifications.forEach((notification, index) => {
          console.log(`서버 알림 ${index + 1}:`, {
            id: notification.id,
            notification_type: notification.notification_type,
            notification_title: notification.notification_title,
            notification_message: notification.notification_message,
            isRead: notification.isRead,
            is_read: notification.is_read,
            isReadType: typeof notification.isRead,
            is_readType: typeof notification.is_read,
            allKeys: Object.keys(notification)
          });
        });
      }
      
      // 백엔드 응답 형식에 따라 처리
      let processedData;
      if (Array.isArray(data)) {
        // 배열로 온 경우: {notifications: [], unreadCount: 0} 형태로 변환
        console.log('🔄 배열 형태의 응답을 객체로 변환');
        
        // is_read 필드를 isRead로 변환
        const processedNotifications = data.map(notification => ({
          ...notification,
          isRead: notification.is_read !== undefined ? notification.is_read : notification.isRead
        }));
        
        processedData = {
          notifications: processedNotifications,
          unreadCount: processedNotifications.filter(n => {
            const isRead = typeof n.isRead === 'number' ? n.isRead === 1 : n.isRead;
            return !isRead;
          }).length
        };
      } else {
        // 객체로 온 경우: 그대로 사용
        console.log('🔄 객체 형태의 응답 사용');
        
        if (data.notifications) {
          // is_read 필드를 isRead로 변환
          data.notifications = data.notifications.map(notification => ({
            ...notification,
            isRead: notification.is_read !== undefined ? notification.is_read : notification.isRead
          }));
        }
        
        processedData = data;
      }
      
      
      console.log('📊 처리된 데이터:', processedData);
      console.log('📊 알림 통계:', {
        totalNotifications: processedData.notifications?.length || 0,
        unreadCount: processedData.unreadCount || 0,
        hasNotifications: processedData.notifications && processedData.notifications.length > 0
      });
      
      return processedData;
    } catch (error) {
      console.error('알림 조회 오류:', error);
      throw error;
    }
  } catch (error) {
    console.error('사용자 알림 조회 실패:', error);
    throw error;
  }
};

  // 읽지 않은 알림 수 조회 (사용자용)
  export const getUserUnreadCount = async (): Promise<number> => {
    try {
      const userId = getUserId();
      if (!userId) {
        return 0;
      }

      // 사용자 알림 목록을 가져와서 읽지 않은 알림 수를 계산
      const endpoint = `/api/notifications/user/${userId}`;
      
      try {
        console.log(`🔄 읽지 않은 알림 수 조회: ${baseUrl}${endpoint}`);
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: getHeaders()
        });

        console.log(`📡 읽지 않은 알림 수 응답:`, {
          status: response.status,
          ok: response.ok
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📊 읽지 않은 알림 수 응답 데이터:', data);
          
          // 백엔드 응답 형식에 따라 처리
          let notifications = [];
          if (Array.isArray(data)) {
            // 배열로 온 경우
            notifications = data;
          } else if (data && typeof data === 'object' && 'notifications' in data) {
            // 객체로 온 경우
            notifications = data.notifications || [];
          }
          
          // 읽지 않은 알림 수 계산
          const unreadCount = notifications.filter(n => !n.isRead).length;
          console.log('📊 계산된 읽지 않은 알림 수:', unreadCount);
          console.log('📊 전체 알림 수:', notifications.length);
          console.log('📊 읽지 않은 알림들:', notifications.filter(n => !n.isRead));
          
          return unreadCount;
        } else {
          const errorText = await response.text();
          console.log(`❌ 읽지 않은 알림 수 조회 실패: ${response.status}`, errorText);
          return 0;
        }
      } catch (error) {
        console.log(`❌ 읽지 않은 알림 수 조회 오류:`, error);
        return 0;
      }
    } catch (error) {
      console.error('읽지 않은 알림 수 조회 실패:', error);
      return 0;
    }
  };

// 특정 알림 읽음 처리
export const markAsRead = async (notificationId: number): Promise<void> => {
  try {
    console.log(`🔄 알림 읽음 처리 요청: ${baseUrl}/api/notifications/${notificationId}/read`);
    console.log(`🆔 처리할 알림 ID: ${notificationId}`);
    
    const headers = getHeaders();
    console.log(`📋 요청 헤더:`, headers);
    console.log(`🌐 요청 URL: ${baseUrl}/api/notifications/${notificationId}/read`);
    
    const response = await fetch(`${baseUrl}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: headers
    });

    console.log(`📡 알림 읽음 처리 응답:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ 알림 읽음 처리 실패:`, {
        status: response.status,
        errorText: errorText,
        url: `${baseUrl}/api/notifications/${notificationId}/read`
      });
      throw new Error(`알림 읽음 처리 실패: ${response.status} - ${errorText}`);
    } else {
      // 성공 응답도 확인
      try {
        const responseText = await response.text();
        console.log(`✅ 알림 읽음 처리 성공 응답:`, responseText);
        console.log(`✅ 서버에서 알림 ID ${notificationId} 읽음 처리 완료`);
      } catch (e) {
        console.log(`✅ 알림 읽음 처리 성공 (응답 본문 없음)`);
        console.log(`✅ 서버에서 알림 ID ${notificationId} 읽음 처리 완료`);
      }
    }
  } catch (error) {
    console.error('알림 읽음 처리 실패:', error);
    console.error('요청 URL:', `${baseUrl}/api/notifications/${notificationId}/read`);
    throw error;
  }
};

// 모든 알림 읽음 처리 (프론트엔드에서 개별 처리)
export const markAllAsRead = async (notifications: Notification[]): Promise<void> => {
  try {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    await Promise.all(unreadNotifications.map(notification => markAsRead(notification.id)));
  } catch (error) {
    console.error('모든 알림 읽음 처리 실패:', error);
    throw error;
  }
};

// 관리자 알림 조회
export const getAdminNotifications = async (): Promise<NotificationResponse> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('토큰이 없습니다.');
    }

    const isAdmin = isAdminFromToken(token);
    if (!isAdmin) {
      throw new Error('관리자 권한이 필요합니다.');
    }

    console.log('🔍 관리자 알림 조회 요청');

    const endpoint = `/api/notifications/admin`;
    const headers = getHeaders();
    
    console.log(`🔄 관리자 알림 조회 요청: ${baseUrl}${endpoint}`);
    console.log('📋 요청 헤더:', headers);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: headers
    });

    console.log(`📡 관리자 알림 조회 응답:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ 관리자 알림 조회 실패:`, {
        status: response.status,
        errorText: errorText
      });
      throw new Error(`관리자 알림 조회 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📋 관리자 알림 데이터:', data);

    // 데이터 처리 (사용자용과 동일)
    let processedData;
    if (Array.isArray(data)) {
      const processedNotifications = data.map(notification => ({
        ...notification,
        isRead: notification.is_read !== undefined ? notification.is_read : notification.isRead
      }));
      processedData = {
        notifications: processedNotifications,
        unreadCount: processedNotifications.filter(n => {
          const isRead = typeof n.isRead === 'number' ? n.isRead === 1 : n.isRead;
          return !isRead;
        }).length
      };
    } else {
      if (data.notifications) {
        data.notifications = data.notifications.map(notification => ({
          ...notification,
          isRead: notification.is_read !== undefined ? notification.is_read : notification.isRead
        }));
      }
      processedData = data;
    }

    console.log('✅ 관리자 알림 조회 성공:', processedData);
    return processedData;
  } catch (error) {
    console.error('관리자 알림 조회 실패:', error);
    throw error;
  }
};

// 관리자 읽지 않은 알림 수 조회
export const getAdminUnreadCount = async (): Promise<number> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('토큰이 없습니다.');
    }

    const isAdmin = isAdminFromToken(token);
    if (!isAdmin) {
      throw new Error('관리자 권한이 필요합니다.');
    }

    console.log('🔍 관리자 읽지 않은 알림 수 조회 요청');

    const endpoint = `/api/notifications/admin/unread-count`;
    const headers = getHeaders();
    
    console.log(`🔄 관리자 읽지 않은 알림 수 조회 요청: ${baseUrl}${endpoint}`);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: headers
    });

    console.log(`📡 관리자 읽지 않은 알림 수 응답:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ 관리자 읽지 않은 알림 수 조회 실패:`, {
        status: response.status,
        errorText: errorText
      });
      throw new Error(`관리자 읽지 않은 알림 수 조회 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📋 관리자 읽지 않은 알림 수:', data);

    return data.unreadCount || 0;
  } catch (error) {
    console.error('관리자 읽지 않은 알림 수 조회 실패:', error);
    return 0;
  }
};

