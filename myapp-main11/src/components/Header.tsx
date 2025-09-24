"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import NotificationDropdown from './NotificationDropdown';
import Link from 'next/link';
import { getToken, setToken, removeToken } from '@/utils/token';
import { checkAndShowUserStatusAlert } from '@/utils/userStatus';

export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [hasShownStatusAlert, setHasShownStatusAlert] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsMounted(true);
    
    const handleUrlToken = async () => {
      // 정지된 계정 처리
      const error = searchParams.get('error');
      const reason = searchParams.get('reason');
      const endDate = searchParams.get('endDate');
      
      if (error === 'account_suspended' && reason && endDate) {
        const decodedReason = decodeURIComponent(reason);
        const message = `🚫 계정 정지\n\n` +
          `사유: ${decodedReason}\n` +
          `정지 기간: ~ ${endDate}\n\n` +
          `정지 기간 동안 로그인이 제한됩니다.\n` +
          `정지 해제 후 다시 로그인해주세요.`;
        
        alert(message);
        
        // 토큰 삭제 및 메인 페이지로 이동
        removeToken();
        setUser(null);
        setHasShownStatusAlert(false);
        router.replace('/');
        return;
      }
      
      const tokenFromUrl = searchParams.get('token');
      if (tokenFromUrl) {
        console.log("URL에서 토큰 발견:", tokenFromUrl);
        
        // 중괄호 제거하여 순수한 JWT 토큰만 저장
        const cleanToken = tokenFromUrl.replace(/[{}]/g, '');
        console.log("정리된 토큰:", cleanToken);
        
        setToken(cleanToken);
        await checkLoginStatus(cleanToken);
        console.log("로그인 상태 업데이트 완료, URL을 정리합니다.");
        router.replace('/'); 
      } else {
        checkLoginStatus(null);
      }
    };
    
    handleUrlToken();

  }, [searchParams, router]);

  const checkLoginStatus = async (tokenOverride: string | null) => {
    const token = tokenOverride || getToken();
    console.log("checkLoginStatus 실행, 토큰:", token ? "있음" : "없음");

    if (!token) {
      console.log("토큰이 없으므로 로그아웃 상태로 처리합니다.");
      setUser(null);
      return;
    }

    try {
      console.log("백엔드로 사용자 정보 요청을 시작합니다.");
      const apiUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${apiUrl}/api/user`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("백엔드 응답 수신, 상태 코드:", response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log("수신된 사용자 데이터:", userData);

        if (userData.isAuthenticated) {
          console.log("사용자 인증 성공. UI를 업데이트합니다. 사용자 이름:", userData.username);
          setUser({ name: userData.username });
          
          // 일반 사용자만 경고/정지 알림 표시 (관리자는 제외, 한 번만)
          const isAdmin = userData.role === 'admin' || userData.isAdmin;
          if (!isAdmin && !hasShownStatusAlert) {
            console.log('🔍 일반 사용자 로그인 - 사용자 상태 확인 시작');
            setTimeout(async () => {
              console.log('⏰ 1초 후 사용자 상태 알림 확인 실행');
              const alertShown = await checkAndShowUserStatusAlert();
              console.log('📢 알림 표시 결과:', alertShown);
              if (alertShown) {
                setHasShownStatusAlert(true);
              }
            }, 1000); // 1초 후에 알림 표시 (로그인 완료 후)
          } else if (isAdmin) {
            console.log('👨‍💼 관리자 로그인 - 사용자 상태 확인 건너뜀');
          } else {
            console.log('🔕 이미 알림을 표시했거나 관리자입니다.');
          }
        } else {
          console.log("백엔드에서 인증 실패 응답. 토큰을 삭제하고 로그아웃 처리합니다.");
          removeToken();
          setUser(null);
        }
      } else {
        console.log("백엔드 응답이 'ok'가 아님. 토큰을 삭제하고 로그아웃 처리합니다.");
        removeToken();
        setUser(null);
      }
    } catch (error) {
      console.error('로그인 상태 확인 중 오류 발생:', error);
      removeToken();
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 200 || response.status === 302) {
        setUser(null);
        removeToken();
        setHasShownStatusAlert(false); // 로그아웃 시 알림 상태 초기화
        window.location.href = '/';
      } else {
        console.error('로그아웃 실패:', response.statusText);
      }
    } catch (error) {
      console.error('Error logging out:', error);
      setUser(null);
      removeToken();
      setHasShownStatusAlert(false); // 로그아웃 시 알림 상태 초기화
      window.location.href = '/';
    }
  };

  return (
    <>
      <header className="bg-white text-gray-900 relative z-10">
        <div className="border-b border-gray-200">
          <div className="container mx-auto px-4 py-2 flex justify-end items-center">
            <div className="flex items-center space-x-6">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{user.name}</span>님 환영합니다
                  </div>
                  <NotificationDropdown />
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-700 hover:text-[#e53e3e] flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    로그아웃
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-sm text-gray-700 hover:text-[#e53e3e] flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  로그인
                </button>
              )}
              {!user && (
                <button
                  onClick={() => setIsSignupModalOpen(true)}
                  className="text-sm text-gray-700 hover:text-[#e53e3e] flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  회원가입
                </button>
              )}
              <Link
                href="/mypage"
                className="text-sm text-gray-700 hover:text-[#e53e3e] flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                MY 뉴스
              </Link>
              <Link
                href="/customer"
                className="text-sm text-gray-700 hover:text-[#e53e3e] flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
                  />
                </svg>
                고객센터
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-[#e53e3e] font-bold text-3xl mr-10">
              뉴스포털
            </Link>
            <ul className="flex space-x-8">
              <li>
                <Link
                  href="/economy"
                  className="text-gray-800 hover:text-[#e53e3e] font-medium"
                >
                  경제
                </Link>
              </li>
              <li>
                <Link
                  href="/sports"
                  className="text-gray-800 hover:text-[#e53e3e] font-medium"
                >
                  스포츠
                </Link>
              </li>
              <li>
                <Link
                  href="/it"
                  className="text-gray-800 hover:text-[#e53e3e] font-medium"
                >
                  IT
                </Link>
              </li>
              <li>
                <Link
                  href="/column"
                  className="text-gray-800 hover:text-[#e53e3e] font-medium"
                >
                  칼럼
                </Link>
              </li>
            </ul>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="뉴스검색"
              className="py-2 px-4 pl-10 rounded-full bg-gray-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e53e3e] w-60"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </header>
      <div className="h-[0px]"></div>

      {isMounted && (
        <>
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onSignupClick={() => {
              setIsLoginModalOpen(false);
              setIsSignupModalOpen(true);
            }}
            onLoginSuccess={(userData) => {
              setUser(userData);
              setIsLoginModalOpen(false);
            }}
          />
          <SignupModal
            isOpen={isSignupModalOpen}
            onClose={() => setIsSignupModalOpen(false)}
            onSwitchToLogin={() => {
              setIsSignupModalOpen(false);
              setIsLoginModalOpen(true);
            }}
          />
        </>
      )}
    </>
  );
}
