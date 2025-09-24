'use client';

import React, { useState, useEffect } from 'react';
import { getToken } from '@/utils/token';
import { 
  TrendingUp, 
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  Globe
} from 'lucide-react';

export default function NewsPage() {
  // 뉴스 관련 상태
  const [newsStats, setNewsStats] = useState<any>(null);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // 뉴스 통계 가져오기
  const fetchNewsStats = async () => {
    try {
      const token = getToken();
      if (!token) {
        console.log('토큰이 없습니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/admin/news/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('뉴스 통계 조회 성공:', data);
        setNewsStats(data);
      } else {
        console.log('뉴스 통계 조회 실패:', response.status);
      }
    } catch (error) {
      console.log('뉴스 통계 조회 오류:', error);
    }
  };

  // 뉴스 목록 가져오기
  const fetchNewsList = async () => {
    setNewsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        console.log('토큰이 없습니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/admin/news/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('뉴스 목록 조회 성공:', data);
        setNewsList(data);
      } else {
        console.log('뉴스 목록 조회 실패:', response.status);
        setNewsList([]);
      }
    } catch (error) {
      console.log('뉴스 목록 조회 오류:', error);
      setNewsList([]);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsStats();
    fetchNewsList();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">뉴스 통계</h2>
      
      {/* 뉴스 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">전체 뉴스</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {newsStats?.totalNews || newsList.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">총 조회수</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {newsStats?.totalViews || newsList.reduce((sum, news) => sum + (news.view_count || 0), 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">총 좋아요</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {newsStats?.totalLikes || newsList.reduce((sum, news) => sum + (news.like_count || 0), 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">총 댓글</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {newsStats?.totalComments || newsList.reduce((sum, news) => sum + (news.comment_count || 0), 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 인기 뉴스 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">인기 뉴스</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">조회수가 높은 뉴스 목록입니다.</p>
        </div>
        <div className="border-t border-gray-200">
          {newsLoading ? (
            <div className="px-4 py-5 sm:px-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">뉴스 목록을 불러오는 중...</p>
            </div>
          ) : newsList.length === 0 ? (
            <div className="px-4 py-5 sm:px-6 text-center">
              <p className="text-gray-500">뉴스가 없습니다.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {newsList
                .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                .slice(0, 10)
                .map((news) => (
                <li key={news.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {news.title}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {news.content?.substring(0, 100)}...
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {news.view_count || 0}
                        </span>
                        <span className="flex items-center">
                          <Heart className="h-3 w-3 mr-1" />
                          {news.like_count || 0}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {news.comment_count || 0}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(news.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <Eye className="h-3 w-3 mr-1" />
                        보기
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 카테고리별 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">카테고리별 뉴스</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">카테고리별 뉴스 분포입니다.</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">정치</span>
                <span className="text-sm font-medium text-gray-900">45</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">경제</span>
                <span className="text-sm font-medium text-gray-900">32</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">사회</span>
                <span className="text-sm font-medium text-gray-900">28</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">문화</span>
                <span className="text-sm font-medium text-gray-900">15</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">일별 조회수</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">최근 7일간의 조회수 추이입니다.</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">오늘</span>
                <span className="text-sm font-medium text-gray-900">1,234</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">어제</span>
                <span className="text-sm font-medium text-gray-900">987</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">2일 전</span>
                <span className="text-sm font-medium text-gray-900">1,456</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">3일 전</span>
                <span className="text-sm font-medium text-gray-900">1,123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

