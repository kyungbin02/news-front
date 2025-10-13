"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import NotificationDropdown from './NotificationDropdown';
import Link from 'next/link';
import { getToken, setToken, removeToken } from '@/utils/token';
import { checkAndShowUserStatusAlert } from '@/utils/userStatus';

export default function StandardHeader() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsMounted(true);
    
    const handleUrlToken = async () => {
      const tokenFromUrl = searchParams.get('token');
      if (tokenFromUrl) {
        console.log("URL에서 토큰 발견:", tokenFromUrl);
        setToken(tokenFromUrl);
        await checkLoginStatus(tokenFromUrl);
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
          
          // 사용자 상태 확인 (정지 여부 체크)
          const isSuspended = await checkAndShowUserStatusAlert();
          if (isSuspended) {
            // 정지된 사용자는 로그아웃 처리
            setUser(null);
            removeToken();
            return;
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
        window.location.href = '/';
      } else {
        console.error('로그아웃 실패:', response.statusText);
      }
    } catch (error) {
      console.error('Error logging out:', error);
      setUser(null);
      removeToken();
      window.location.href = '/';
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg text-gray-900">
        <div className="border-b border-gray-200">
          <div className="container mx-auto px-4 py-2 flex justify-end items-center">
            <div className="flex items-center space-x-6">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{user.name}</span>님 환영합니다
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm flex items-center text-gray-700 hover:text-[#e53e3e] transition-colors duration-300"
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
                  className="text-sm flex items-center text-gray-700 hover:text-[#e53e3e] transition-colors duration-300"
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
                  className="text-sm flex items-center text-gray-700 hover:text-[#e53e3e] transition-colors duration-300"
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
            <Link href="/" className="font-bold text-3xl mr-10 text-[#e53e3e]">
              뉴스포털
            </Link>
            <ul className="flex space-x-8">
              <li>
                <Link
                  href="/general"
                  className="font-medium text-gray-800 hover:text-[#e53e3e] transition-colors duration-300"
                >
                  전체
                </Link>
              </li>
              <li>
                <Link
                  href="/economy"
                  className="font-medium text-gray-800 hover:text-[#e53e3e] transition-colors duration-300"
                >
                  경제
                </Link>
              </li>
              <li>
                <Link
                  href="/sports"
                  className="font-medium text-gray-800 hover:text-[#e53e3e] transition-colors duration-300"
                >
                  스포츠
                </Link>
              </li>
              <li>
                <Link
                  href="/column"
                  className="font-medium text-gray-800 hover:text-[#e53e3e] transition-colors duration-300"
                >
                  칼럼
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex items-center space-x-4">
            {/* 알림 기능 */}
            {user && <NotificationDropdown />}
            
            {/* 검색창 */}
            <div className="relative">
              <input
                type="text"
                placeholder="뉴스검색"
                className="py-2 px-4 pl-10 rounded-full focus:outline-none focus:ring-2 focus:ring-[#e53e3e] w-60 bg-gray-100 text-gray-900 placeholder-gray-400"
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
        </div>
      </header>
      <div className="h-[120px]"></div>

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
