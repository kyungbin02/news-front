'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getToken } from '@/utils/token';
import { 
  Users, 
  FileText, 
  Headphones, 
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  UserCheck,
  Shield,
  Search,
  Image as ImageIcon,
  X
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // 관리자 정보 가져오기
  const fetchAdminInfo = async () => {
    try {
      const token = getToken();
      if (!token) {
        console.log('토큰이 없습니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/admin/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('관리자 정보:', data);
        setAdminInfo(data);
      } else {
        console.error('관리자 정보 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('관리자 정보 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminInfo();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">관리자 대시보드</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                {adminInfo?.username}님
              </div>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    window.location.href = '/';
                  }
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 네비게이션 탭 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: '대시보드', icon: BarChart3, href: '/admin' },
              { id: 'users', label: '사용자 관리', icon: Users, href: '/admin/users' },
              { id: 'posts', label: '게시물 관리', icon: FileText, href: '/admin/posts' },
              { id: 'reports', label: '신고내역', icon: AlertCircle, href: '/admin/reports' },
              { id: 'support', label: '고객센터', icon: Headphones, href: '/admin/support' },
              { id: 'news', label: '뉴스 통계', icon: TrendingUp, href: '/admin/news' }
            ].map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <a
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors text-sm font-medium ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : ''}`} />
                  <span>{tab.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

