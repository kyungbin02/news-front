"use client";

import React, { useEffect } from "react";
import { getAuthHeader, setToken } from "@/utils/token";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupClick: () => void;
  onLoginSuccess: (userData: { name: string }) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSignupClick,
  onLoginSuccess,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const checkLoginStatus = async () => {
      try {
        const authHeader = getAuthHeader();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/user`,
          {
            method: 'POST',
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              ...authHeader
            },
          }
        );

        if (!response.ok) {
          console.log("로그인 상태 확인 실패:", response.status);
          return;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const userData = await response.json();
          if (userData.isAuthenticated) {
            if (userData.token) {
              // 중괄호 제거하여 순수한 JWT 토큰만 저장
              const cleanToken = userData.token.replace(/[{}]/g, '');
              console.log("🔑 로그인 성공 - 토큰 처리 시작");
              console.log("백엔드에서 받은 토큰:", userData.token);
              console.log("정리된 토큰:", cleanToken);
              
              setToken(cleanToken);
              
              // 토큰 저장 후 즉시 확인
              const savedToken = localStorage.getItem('jwt_token');
              console.log("🔍 토큰 저장 후 확인:", {
                저장됨: !!savedToken,
                토큰길이: savedToken ? savedToken.length : 0,
                토큰미리보기: savedToken ? `${savedToken.substring(0, 20)}...` : '없음'
              });
            } else {
              console.log("❌ 백엔드에서 토큰을 받지 못함");
            }
            onLoginSuccess({ name: userData.name });
            onClose();
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    checkLoginStatus();
  }, [isOpen, onLoginSuccess, onClose]);

  if (!isOpen) return null;

  const handleNaverLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/oauth2/authorization/naver`;
  };

  const handleKakaoLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/oauth2/authorization/kakao`;
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/oauth2/authorization/google`;
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white/95 rounded-lg p-16 w-[700px] relative transform transition-all duration-500 ease-in-out">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
        
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">로그인</h2>
          <p className="text-gray-600 text-lg">
            소셜 계정으로 간편하게 로그인하세요.
          </p>
        </div>

        <div className="space-y-8">
          <button
            type="button"
            onClick={handleNaverLogin}
            className="w-full bg-[#03C75A] text-white py-5 rounded-lg hover:bg-[#02b351] transition-colors flex items-center justify-center text-xl"
          >
            <span className="mr-4 text-2xl">N</span>
            네이버 로그인
          </button>

          <button
            type="button"
            onClick={handleKakaoLogin}
            className="w-full bg-[#FEE500] text-[#000000] py-5 rounded-lg hover:bg-[#F4DC00] transition-colors flex items-center justify-center text-xl"
          >
            <span className="mr-4 text-2xl">K</span>
            카카오 로그인
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-gray-300 text-gray-700 py-5 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center text-xl"
          >
            <svg className="w-6 h-6 mr-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google 로그인
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg text-gray-600">
            계정이 없으신가요?{" "}
            <button
              onClick={onSignupClick}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              회원가입
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
