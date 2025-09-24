'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  getBookmarks, 
  getViewHistory, 
  getMyComments, 
  getInquiries, 
  createInquiry,
  Bookmark,
  ViewHistory,
  MyComment,
  Inquiry
} from "@/utils/myNewsApi";
import { getToken, removeToken } from "@/utils/token";

export default function MyPage() {
  // 상태 관리
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [viewHistory, setViewHistory] = useState<ViewHistory[]>([]);
  const [myComments, setMyComments] = useState<MyComment[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 문의사항 모달 상태
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryTitle, setInquiryTitle] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');
  const [expandedInquiry, setExpandedInquiry] = useState<number | null>(null);
  
  // 사용자 정보
  const [user, setUser] = useState<{
    name: string;
    email: string;
    createdAt: string;
  } | null>(null);

  // 읽기 패턴 분석 함수들
  const getReadingPatternByTime = () => {
    if (!viewHistory || viewHistory.length === 0) return [];
    
    const timePatterns = Array(24).fill(0);
    viewHistory.forEach(history => {
      const hour = new Date(history.viewedAt).getHours();
      timePatterns[hour]++;
    });
    
    return timePatterns.map((count, hour) => ({
      hour: `${hour}시`,
      count,
      percentage: viewHistory.length > 0 ? (count / viewHistory.length) * 100 : 0
    }));
  };
  
  const getReadingPatternByCategory = () => {
    if (!viewHistory || viewHistory.length === 0) return [];
    
    const categoryCount: { [key: string]: number } = {};
    viewHistory.forEach(history => {
      const category = history.category || '기타';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    return Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / viewHistory.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  };
  
  const getRecentActivity = () => {
    const recentNews = viewHistory
      ?.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
      .slice(0, 3) || [];
      
    const recentComments = myComments
      ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3) || [];
      
    return { recentNews, recentComments };
  };

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        console.log('토큰이 없습니다.');
        return;
      }

      // 사용자 정보 로드
      const userResponse = await fetch('http://localhost:8080/api/user', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.isAuthenticated) {
          setUser({
            name: userData.username || userData.name || '사용자',
            email: userData.email || 'user@example.com',
            createdAt: userData.createdAt || new Date().toISOString()
          });
        }
      }

      // 병렬로 데이터 로드
      const [bookmarksData, historyData, commentsData, inquiriesData] = await Promise.all([
        getBookmarks(),
        getViewHistory(),
        getMyComments(),
        getInquiries()
      ]);

      setBookmarks(bookmarksData);
      setViewHistory(historyData);
      setMyComments(commentsData);
      setInquiries(inquiriesData);

    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 문의사항 제출
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryTitle.trim() || !inquiryContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      const result = await createInquiry(inquiryTitle, inquiryContent);
      if (result) {
        alert('문의사항이 등록되었습니다.');
        setInquiryTitle('');
        setInquiryContent('');
        setIsInquiryModalOpen(false);
        loadData(); // 데이터 새로고침
      }
    } catch (error) {
      console.error('문의사항 등록 실패:', error);
      alert('문의사항 등록에 실패했습니다.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e53e3e] mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">마이페이지</h1>
            <p className="text-gray-600">나의 뉴스 활동과 통계를 확인해보세요</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* 왼쪽 사이드바 - 간소화된 프로필 */}
            <div className="w-full lg:w-1/4">
              {/* 사용자 프로필 카드 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="text-center">
                  {/* 프로필 이미지 */}
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#e53e3e] to-[#c53030] rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  
                  {/* 사용자 정보 */}
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    {user?.name || '사용자'}
                  </h2>
                  <p className="text-gray-600 text-sm mb-3">
                    {user?.email || 'user@example.com'}
                  </p>
                  
                  {/* 프로필 수정 버튼 */}
                  <Link 
                    href="/mypage/profile" 
                    className="inline-block bg-[#e53e3e] text-white px-3 py-1.5 rounded-lg hover:bg-[#c53030] transition-colors text-sm"
                  >
                    프로필 수정
                  </Link>
                </div>
              </div>
              
              {/* 활동 통계 - 간소화 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📊 활동 통계</h3>
                
                {/* 통계 카드들 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">북마크</span>
                    </div>
                    <span className="text-lg font-bold text-red-500">{bookmarks?.length || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">읽은 뉴스</span>
                    </div>
                    <span className="text-lg font-bold text-blue-500">{viewHistory?.length || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">작성한 댓글</span>
                    </div>
                    <span className="text-lg font-bold text-green-500">{myComments?.length || 0}</span>
                  </div>
                </div>
              </div>
              
              {/* 빠른 메뉴 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🔗 빠른 메뉴</h3>
                <nav className="space-y-2">
                  <Link href="/mypage/bookmarks" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    📖 북마크한 뉴스
                  </Link>
                  <Link href="/mypage/history" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    👁️ 열람 기록
                  </Link>
                  <Link href="/mypage/comments" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    💬 내 댓글
                  </Link>
                  <Link href="/mypage/preferences" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    ⚙️ 관심사 설정
                  </Link>
                </nav>
              </div>
            </div>

            {/* 오른쪽 메인 콘텐츠 */}
            <div className="w-full lg:w-3/4">
              {/* 최근 활동 요약 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">🕒 최근 활동</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 최근 읽은 뉴스 */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      최근 읽은 뉴스
                    </h4>
                    {getRecentActivity().recentNews.length > 0 ? (
                      <div className="space-y-3">
                        {getRecentActivity().recentNews.map((news, index) => (
                          <div key={news.viewId} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-purple-600">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={`/news/${news.newsId}`}
                                className="text-sm font-medium text-gray-900 hover:text-purple-600 line-clamp-2"
                              >
                                {news.newsTitle}
                              </Link>
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                <span className="mr-2">{news.category}</span>
                                <span>{new Date(news.viewedAt).toLocaleDateString('ko-KR')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <div className="text-2xl mb-2">📰</div>
                        <p className="text-sm">최근 읽은 뉴스가 없습니다</p>
                      </div>
                    )}
                  </div>

                  {/* 최근 작성한 댓글 */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                      최근 작성한 댓글
                    </h4>
                    {getRecentActivity().recentComments.length > 0 ? (
                      <div className="space-y-3">
                        {getRecentActivity().recentComments.map((comment, index) => (
                          <div key={comment.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-orange-600">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={`/news/${comment.newsId}`}
                                className="text-sm font-medium text-gray-900 hover:text-orange-600 line-clamp-1"
                              >
                                {comment.newsTitle}
                              </Link>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {comment.content}
                              </p>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <div className="text-2xl mb-2">💬</div>
                        <p className="text-sm">최근 작성한 댓글이 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 읽기 패턴 분석 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">📊 읽기 패턴 분석</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 시간대별 읽기 패턴 */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      시간대별 읽기 패턴
                    </h4>
                    {viewHistory && viewHistory.length > 0 ? (
                      <div className="space-y-2">
                        {getReadingPatternByTime()
                          .filter(pattern => pattern.count > 0)
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 5)
                          .map((pattern, index) => (
                            <div key={pattern.hour} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 w-12">{pattern.hour}</span>
                              <div className="flex-1 mx-3">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${pattern.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className="text-sm text-gray-500 w-8 text-right">{pattern.count}개</span>
                            </div>
                          ))}
                        <div className="text-xs text-gray-400 mt-2">
                          총 {viewHistory.length}개의 뉴스를 읽었습니다
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <div className="text-2xl mb-2">⏰</div>
                        <p className="text-sm">읽기 패턴을 분석할 데이터가 없습니다</p>
                      </div>
                    )}
                  </div>

                  {/* 카테고리별 읽기 패턴 */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      카테고리별 읽기 패턴
                    </h4>
                    {viewHistory && viewHistory.length > 0 ? (
                      <div className="space-y-2">
                        {getReadingPatternByCategory().slice(0, 5).map((pattern, index) => (
                          <div key={pattern.category} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 w-16">{pattern.category}</span>
                            <div className="flex-1 mx-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${pattern.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-sm text-gray-500 w-8 text-right">{pattern.count}개</span>
                          </div>
                        ))}
                        <div className="text-xs text-gray-400 mt-2">
                          가장 많이 읽은 카테고리: {getReadingPatternByCategory()[0]?.category || '없음'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <div className="text-2xl mb-2">📂</div>
                        <p className="text-sm">카테고리 패턴을 분석할 데이터가 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 문의사항 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">❓ 문의사항</h3>
                  <button 
                    onClick={() => setIsInquiryModalOpen(true)}
                    className="bg-[#e53e3e] text-white px-4 py-2 rounded-lg hover:bg-[#c53030] transition-colors text-sm"
                  >
                    새 문의하기
                  </button>
                </div>
                
                <div className="space-y-4">
                  {!inquiries || inquiries.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">❓</div>
                      <p className="text-gray-500">문의사항이 없습니다</p>
                      <p className="text-sm text-gray-400 mt-1">궁금한 점이 있으시면 문의해주세요</p>
                    </div>
                  ) : (
                    inquiries.slice(0, 3).map(inquiry => (
                      <div key={inquiry.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{inquiry.title}</h4>
                            <div className="flex items-center mt-1">
                              <p className="text-sm text-gray-500 mr-4">{new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}</p>
                              <span className={`text-sm px-2 py-1 rounded-full ${
                                inquiry.status === 'answered' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {inquiry.status === 'answered' ? '답변완료' : '답변대기'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 문의사항 모달 */}
      {isInquiryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 문의사항</h3>
            <form onSubmit={handleInquirySubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <input
                  type="text"
                  id="title"
                  value={inquiryTitle}
                  onChange={(e) => setInquiryTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e53e3e] focus:border-transparent"
                  placeholder="문의사항 제목을 입력해주세요"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                <textarea
                  id="content"
                  value={inquiryContent}
                  onChange={(e) => setInquiryContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e53e3e] focus:border-transparent h-32"
                  placeholder="문의사항 내용을 입력해주세요"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsInquiryModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-[#e53e3e] text-white py-2 px-4 rounded-lg hover:bg-[#c53030] transition-colors"
                >
                  문의하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
