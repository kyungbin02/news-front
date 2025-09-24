"use client";

import React from 'react';
import { handleNaverLogin, handleKakaoLogin, handleGoogleLogin } from '@/utils/auth';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  if (!isOpen) return null;

  const handleLoginClick = () => {
    onClose(); // Close signup modal
    onSwitchToLogin(); // Open login modal
  };

  const handleNaverSignup = () => {
    console.log('Naver signup button clicked');
    handleNaverLogin();
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
          <h2 className="text-4xl font-bold mb-6">회원가입</h2>
          <p className="text-gray-600 text-lg">소셜 계정으로 간편하게 가입하세요.</p>
        </div>

        <div className="space-y-8">
          <button
            type="button"
            onClick={() => {
              console.log('Button clicked directly');
              handleNaverSignup();
            }}
            className="w-full bg-[#03C75A] text-white py-5 rounded-lg hover:bg-[#02b351] transition-colors flex items-center justify-center text-xl"
          >
            <span className="mr-4 text-2xl">N</span>
            네이버 회원가입
          </button>
          
          <button
            type="button"
            onClick={handleKakaoLogin}
            className="w-full bg-[#FEE500] text-[#000000] py-5 rounded-lg hover:bg-[#F4DC00] transition-colors flex items-center justify-center text-xl"
          >
            <span className="mr-4 text-2xl">K</span>
            카카오 회원가입
          </button>
          
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-gray-300 text-gray-700 py-5 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center text-xl"
          >
            <span className="mr-4 text-2xl font-bold bg-gradient-to-r from-[#EA4335] via-[#34A853] via-[#4285F4] via-[#34A853] to-[#FBBC05] bg-clip-text text-transparent">G</span>
            구글 회원가입
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg text-gray-600">
            이미 계정이 있으신가요?{' '}
            <button 
              type="button" 
              className="text-blue-600 hover:text-blue-700"
              onClick={handleLoginClick}
            >
              로그인
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupModal; 