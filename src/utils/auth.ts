// 소셜 로그인 관련 타입 정의
export interface SocialUser {
  id: string;
  email: string;
  name: string;
  provider: 'naver' | 'kakao' | 'google';
  profileImg?: string;
  isAuthenticated: boolean;
}

// 사용자 정보를 가져오는 함수
export const fetchUserInfo = async (): Promise<SocialUser | null> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user`, {
      method: 'GET',
      credentials: 'include', // 쿠키를 포함하여 요청
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
};

// 네이버 로그인
export const handleNaverLogin = () => {
  try {
    console.log('=== Naver Login Debug Info ===');
    console.log('handleNaverLogin called');
    
    // Spring Security의 OAuth2 인증 시작 URL로 리다이렉션
    const springSecurityAuthUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/oauth2/authorization/naver`;
    
    // 로그인 성공 후 이동할 페이지를 세션에 저장
    sessionStorage.setItem('redirectAfterLogin', '/');
    
    console.log('Redirecting to Spring Security Auth URL:', springSecurityAuthUrl);
    
    // 3초 후에 리다이렉트
    setTimeout(() => {
      window.location.href = springSecurityAuthUrl;
    }, 3000);
    
  } catch (error) {
    console.error('Error in handleNaverLogin:', error);
    alert('네이버 로그인 처리 중 오류가 발생했습니다.');
  }
};

// 카카오 로그인
export const handleKakaoLogin = () => {
  try {
    // Spring Security를 사용하는 경우의 URL
    const kakaoAuthUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/oauth2/authorization/kakao`;
    
    // 로그인 성공 후 이동할 페이지를 세션에 저장
    sessionStorage.setItem('redirectAfterLogin', '/');
    
    window.location.href = kakaoAuthUrl;
  } catch (error) {
    console.error('Error in handleKakaoLogin:', error);
    alert('카카오 로그인 처리 중 오류가 발생했습니다.');
  }
};

// 구글 로그인
export const handleGoogleLogin = () => {
  try {
    // Spring Security를 사용하는 경우의 URL
    const googleAuthUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/oauth2/authorization/google`;
    
    // 로그인 성공 후 이동할 페이지를 세션에 저장
    sessionStorage.setItem('redirectAfterLogin', '/');
    
    window.location.href = googleAuthUrl;
  } catch (error) {
    console.error('Error in handleGoogleLogin:', error);
    alert('구글 로그인 처리 중 오류가 발생했습니다.');
  }
};

// 로그아웃 함수
export const handleLogout = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    // 로그아웃 후 홈페이지로 리다이렉트
    window.location.href = '/';
  } catch (error) {
    console.error('Error during logout:', error);
    alert('로그아웃 처리 중 오류가 발생했습니다.');
  }
};

// 로그인 상태 확인 함수
export const checkLoginStatus = async (): Promise<boolean> => {
  try {
    const userInfo = await fetchUserInfo();
    return userInfo?.isAuthenticated ?? false;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};