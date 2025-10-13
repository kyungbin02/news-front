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
import { getToken, removeToken, isTokenValid } from "@/utils/token";
import LoginModal from "@/components/LoginModal";

export default function MyPage() {
  // 상태 관리
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [viewHistory, setViewHistory] = useState<ViewHistory[]>([]);
  const [myComments, setMyComments] = useState<MyComment[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 문의사항 모달 상태
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryTitle, setInquiryTitle] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');
  const [expandedInquiry, setExpandedInquiry] = useState<number | null>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  
  // 로그인 모달 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  
  // 문의사항 로드 함수 - 고객센터와 동일한 API 사용
  const loadInquiries = async () => {
    try {
      const token = getToken();
      console.log('🔍 토큰 확인:', {
        token: token ? '있음' : '없음',
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : '없음',
        isValid: token ? isTokenValid(token) : false
      });
      
      if (!token) {
        console.log('토큰이 없습니다.');
        setInquiries([]);
        return;
      }
      
      if (!isTokenValid(token)) {
        console.log('토큰 형식이 유효하지 않지만 API 호출을 시도합니다.');
        // 토큰 형식이 유효하지 않아도 API 호출을 시도해보기
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      
      console.log('🔍 사용자별 문의사항 목록 조회 API 호출:', {
        url: `${baseUrl}/api/inquiry/list`,
        token: token ? '있음' : '없음',
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : '없음',
        isValid: isTokenValid(token)
      });
      
      const response = await fetch(`${baseUrl}/api/inquiry/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 목록 조회 응답 상태:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('마이페이지 문의사항 목록:', data);
        
        // 각 문의사항의 답변 정보 확인
        data.forEach((inquiry: any, index: number) => {
          console.log(`🔍 문의사항 ${index + 1}:`, {
            id: inquiry.inquiry_id,
            title: inquiry.inquiry_title,
            status: inquiry.inquiry_status,
            answer_content: inquiry.answer_content,
            answer_created_at: inquiry.answer_created_at,
            admin_username: inquiry.admin_username
          });
        });
        
        // 최신순으로 정렬하고 마이페이지 형식으로 변환
        const sortedInquiries = data
          .sort((a: any, b: any) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .map((inquiry: any) => ({
            id: inquiry.inquiry_id,
            title: inquiry.inquiry_title,
            content: inquiry.inquiry_content,
            status: inquiry.inquiry_status,
            createdAt: inquiry.created_at,
            answer: inquiry.answer_content,
            answeredAt: inquiry.answer_created_at,
            adminUsername: inquiry.admin_username
          }));
        
        setInquiries(sortedInquiries);
      } else {
        // 401 에러인 경우 토큰 재확인
        if (response.status === 401) {
          console.error('🔐 인증 실패 - 토큰 확인 필요');
          console.log('현재 토큰:', token);
          console.log('토큰 유효성:', isTokenValid(token));
          
          // 토큰이 만료되었을 수 있으므로 토큰 제거
          removeToken();
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          setInquiries([]);
          return;
        }
        
        const errorText = await response.text();
        console.error('문의사항 목록 조회 실패:', response.status, response.statusText);
        console.error('오류 상세:', errorText);
        setInquiries([]);
      }
    } catch (error) {
      console.error('문의사항 목록 조회 오류:', error);
      setInquiries([]);
    }
  };

  // 문의사항 토글 함수
  const toggleInquiry = async (inquiryId: number) => {
    // 이미 열려있으면 닫기만
    if (expandedInquiry === inquiryId) {
      setExpandedInquiry(null);
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 사용자별 문의사항 API를 사용하여 답변 정보를 가져오기
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      
      console.log('🔍 사용자별 문의사항 목록에서 답변 정보 가져오기:', {
        url: `${baseUrl}/api/inquiry/list`,
        inquiryId: inquiryId
      });
      
      const listResponse = await fetch(`${baseUrl}/api/inquiry/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (listResponse.ok) {
        const listData = await listResponse.json();
        const foundInquiry = listData.find((item: any) => item.inquiry_id === inquiryId);
        
        if (foundInquiry) {
          console.log('🔍 목록에서 찾은 문의사항:', foundInquiry);
          console.log('🔍 답변 정보:', {
            answer_content: foundInquiry.answer_content,
            answer_created_at: foundInquiry.answer_created_at,
            admin_username: foundInquiry.admin_username,
            inquiry_status: foundInquiry.inquiry_status
          });
          
          // 목록의 해당 문의사항 업데이트 (답변 포함)
          setInquiries(prevInquiries => 
            prevInquiries.map(inquiry => 
              inquiry.id === inquiryId 
                ? { 
                    ...inquiry, 
                    answer: foundInquiry.answer_content,
                    answeredAt: foundInquiry.answer_created_at,
                    adminUsername: foundInquiry.admin_username,
                    status: foundInquiry.inquiry_status
                  }
                : inquiry
            )
          );
        } else {
          console.log('목록에서 해당 문의사항을 찾을 수 없습니다.');
        }
      } else {
        console.error('문의사항 목록 조회 실패:', listResponse.status, listResponse.statusText);
        
        // 401 에러인 경우 토큰 재확인
        if (listResponse.status === 401) {
          console.error('🔐 인증 실패 - 토큰 확인 필요');
          removeToken();
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          return;
        }
      }
      
      // 모달 열기
      setExpandedInquiry(inquiryId);
    } catch (error) {
      console.error('문의사항 상세 조회 오류:', error);
      // 오류가 있어도 모달은 열기
      setExpandedInquiry(inquiryId);
    }
  };
  
  // 사용자 정보 - 백업 파일의 상세한 프로필 기능 추가
  const [user, setUser] = useState<{
    name: string;
    username?: string;
    email?: string;
    sns_type?: string;
    user_id?: number;
    joinDate?: string;
    profileImg?: string;
  } | null>(null);

  // 카테고리 한글 변환 함수
  const getCategoryKorean = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'general': '일반',
      'tech': '기술',
      'technology': '기술',
      'it': 'IT',
      'economy': '경제',
      'sports': '스포츠',
      'politics': '정치',
      'entertainment': '연예',
      'health': '건강',
      'science': '과학',
      'business': '비즈니스',
      'world': '국제',
      'society': '사회',
      'culture': '문화',
      'education': '교육',
      'environment': '환경',
      'lifestyle': '라이프스타일'
    };
    
    return categoryMap[category?.toLowerCase()] || category || '기타';
  };

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
      const category = getCategoryKorean(history.category || '기타');
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

  // 사용자 정보 로드 - 백업 파일의 상세한 프로필 기능 추가
  const loadUserInfo = async () => {
    try {
      // Header와 동일한 방식으로 토큰 가져오기
      const token = getToken();
      console.log("🔍 토큰 존재 여부:", token ? "있음" : "없음");
      console.log("🔍 토큰 값:", token ? `${token.substring(0, 20)}...` : "null");
      
      if (!token) {
        console.log("❌ 토큰이 없어서 사용자 정보를 가져올 수 없습니다.");
        return;
      }

      console.log("📡 새로운 사용자 정보 API 호출 시작: /api/user/info");
      const apiUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${apiUrl}/api/user/info`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log("📡 API 응답 상태:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("📡 백엔드 응답 전체:", result);
        
        if (result.success) {
          console.log("✅ 사용자 정보 파싱 성공:", result);
          
          setUser({
            name: result.username,
            username: result.username,
            email: result.email || `${result.snsType} 로그인`,
            sns_type: result.snsType,
            user_id: result.userId,
            joinDate: result.createdAt ? new Date(result.createdAt).toLocaleDateString('ko-KR') : "정보 없음",
            profileImg: result.profileImg
          });
          
          console.log("✅ 사용자 상태 업데이트 완료");
        } else {
          console.error("❌ API 응답에서 success가 false:", result);
        }
      } else {
        console.error("❌ 사용자 정보 API 호출 실패:", response.status);
        const errorText = await response.text();
        console.error("❌ 에러 응답 내용:", errorText);
      }
    } catch (error) {
      console.error("❌ 사용자 정보 로드 중 오류:", error);
    }
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

      // 사용자 정보와 마이페이지 데이터를 병렬로 로드
      await Promise.all([
        loadUserInfo(),
        (async () => {
          const [bookmarksData, historyData, commentsData] = await Promise.all([
            getBookmarks(),
            getViewHistory(),
            getMyComments()
          ]);

          setBookmarks(bookmarksData);
          setViewHistory(historyData);
          setMyComments(commentsData);
          
          // 문의사항은 별도로 로드 (고객센터와 동일한 API 사용)
          loadInquiries();
        })()
      ]);

    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 문의사항 제출 - 고객센터와 동일한 API 사용
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inquiryTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!inquiryContent.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/inquiry/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inquiry_title: inquiryTitle,
          inquiry_content: inquiryContent
        })
      });

      if (response.ok) {
        alert('문의사항이 접수되었습니다.');
        setInquiryTitle('');
        setInquiryContent('');
        setIsInquiryModalOpen(false);
        // 문의사항 목록 새로고침
        loadInquiries();
      } else {
        // 401 에러인 경우 토큰 재확인
        if (response.status === 401) {
          removeToken();
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        alert(`문의사항 접수 실패: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('문의사항 접수 오류:', error);
      alert('문의사항 접수 중 오류가 발생했습니다.');
    }
  };

  // 로그인 상태 확인
  useEffect(() => {
    const token = getToken();
    if (token && isTokenValid(token)) {
      setIsLoggedIn(true);
      loadData();
    } else {
      setIsLoggedIn(false);
      setShowLoginModal(true);
      setLoading(false);
    }
  }, []);

  // 로그인 성공 핸들러
  const handleLoginSuccess = (userData: { name: string }) => {
    console.log('로그인 성공:', userData);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    // 로그인 후 데이터 다시 로드
    loadData();
  };

  // 회원가입 모달 열기
  const handleSignupClick = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

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

  // 로그인하지 않은 경우 로그인 모달 표시
  if (!isLoggedIn) {
    return (
      <>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => window.history.back()}
          onSignupClick={handleSignupClick}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
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
            {/* 왼쪽 사이드바 - 유용한 기능들 */}
            <div className="w-full lg:w-1/4">
              {/* 사용자 정보 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                              <div className="text-center">
                  {/* 사용자 정보 */}
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    {user?.name || '사용자'}
                  </h2>
                  <p className="text-gray-600 text-sm mb-3">
                    {user?.email || 'user@example.com'}
                  </p>
                  
                  {/* 가입일 */}
                  <div className="text-xs text-gray-500">
                    가입일: {user?.joinDate || '2024.01.01'}
                              </div>
                            </div>
                          </div>

              {/* 빠른 메뉴 토글 버튼 - 사이드바 상단에 배치 */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">🔗 빠른 메뉴</h3>
                  <button
                    onClick={() => setShowQuickMenu(!showQuickMenu)}
                    className="w-8 h-8 bg-[#e53e3e] text-white rounded-full flex items-center justify-center hover:bg-[#c53030] transition-colors duration-200 shadow-md"
                    title="메뉴 열기/닫기"
                  >
                    <svg className={`w-4 h-4 transform transition-transform duration-200 ${showQuickMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  </div>
                
                {/* 빠른 메뉴 드롭다운 */}
                {showQuickMenu && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <nav className="grid grid-cols-2 gap-2">
                      <Link href="/mypage/bookmarks" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        📖 북마크 ({bookmarks?.length || 0})
                      </Link>
                      <Link href="/mypage/history" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        👁️ 열람기록 ({viewHistory?.length || 0})
                      </Link>
                      <Link href="/mypage/comments" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        💬 내 댓글 ({myComments?.length || 0})
                      </Link>
                    </nav>
                  </div>
                )}
                </div>
                
              {/* 오늘의 뉴스 요약 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📰 오늘의 뉴스 요약</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">읽은 뉴스</span>
                      <span className="text-lg font-bold text-blue-600">{viewHistory?.length || 0}</span>
                    </div>
                    <div className="text-xs text-blue-600">
                      오늘 {new Date().toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">작성한 댓글</span>
                      <span className="text-lg font-bold text-green-600">{myComments?.length || 0}</span>
                    </div>
                    <div className="text-xs text-green-600">
                      활발한 참여 중!
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-800">북마크</span>
                      <span className="text-lg font-bold text-purple-600">{bookmarks?.length || 0}</span>
                    </div>
                    <div className="text-xs text-purple-600">
                      관심 뉴스 저장
                    </div>
                    </div>
                  </div>
                </div>
                
              {/* 뉴스 읽기 목표 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 읽기 목표</h3>
                
                <div className="space-y-4">
                  {/* 일일 목표 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">일일 목표</span>
                      <span className="text-sm text-gray-500">5개</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((viewHistory?.length || 0) / 5) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {viewHistory?.length || 0}/5개 완료
                    </div>
                  </div>
                  
                  {/* 주간 목표 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">주간 목표</span>
                      <span className="text-sm text-gray-500">30개</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((viewHistory?.length || 0) / 30) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {viewHistory?.length || 0}/30개 완료
                    </div>
                  </div>
                  
                  {/* 달성률 표시 */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#e53e3e]">
                        {Math.round(((viewHistory?.length || 0) / 5) * 100)}%
                    </div>
                      <div className="text-xs text-gray-500">일일 달성률</div>
                    </div>
                    </div>
                  </div>
                </div>
                
              {/* 뉴스 추천 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">💡 맞춤 추천</h3>
                    <div className="space-y-3">
                  {getReadingPatternByCategory().slice(0, 3).map((pattern, index) => (
                    <div key={pattern.category} className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-800">{pattern.category}</div>
                          <div className="text-xs text-gray-500">{pattern.count}개 읽음</div>
                          </div>
                        <div className="text-lg font-bold text-[#e53e3e]">
                          {Math.round(pattern.percentage)}%
                        </div>
                          </div>
                        </div>
                      ))}
                  {getReadingPatternByCategory().length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <div className="text-2xl mb-2">📊</div>
                      <p className="text-sm">읽기 패턴을 분석해보세요</p>
                  </div>
                )}
                  </div>
              </div>

            </div>
            
            {/* 오른쪽 메인 콘텐츠 */}
            <div className="w-full lg:w-3/4">
              {/* 최근 활동 요약 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">🕒 최근 활동 요약</h3>
                
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
                                <span className="mr-2">{getCategoryKorean(news.category)}</span>
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
                    className="text-[#e53e3e] text-sm hover:underline"
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
                      <div key={inquiry.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleInquiry(inquiry.id)}
                          className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-2">{inquiry.title}</h4>
                              <div className="flex items-center">
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
                            <svg
                              className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ml-4 ${
                                expandedInquiry === inquiry.id ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                        {expandedInquiry === inquiry.id && (
                          <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                            {/* 질문 내용 */}
                            <div className="py-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-2">📝 질문 내용</h5>
                              <p className="text-gray-700 text-sm whitespace-pre-wrap bg-white p-3 rounded-lg border">
                                {inquiry.content}
                              </p>
                                    </div>
                            
                            {/* 답변 내용 */}
                            {inquiry.status === 'answered' && inquiry.answer ? (
                              <div className="py-4">
                                <h5 className="text-sm font-semibold text-gray-700 mb-2">💬 답변</h5>
                                <div className="bg-white p-3 rounded-lg border">
                                  <div className="flex items-center text-sm text-gray-600 mb-2">
                                    <span className="font-semibold mr-2">관리자:</span>
                                    <span>{(inquiry as any).adminUsername || '관리자'}</span>
                                    <span className="ml-auto">{inquiry.answeredAt ? new Date(inquiry.answeredAt).toLocaleDateString('ko-KR') : '정보 없음'}</span>
                                    </div>
                                  <p className="text-gray-800 text-sm whitespace-pre-wrap">{inquiry.answer}</p>
                                </div>
                              </div>
                            ) : inquiry.status === 'answered' ? (
                              <div className="py-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <p className="text-blue-800 text-sm">답변은 완료되었지만 내용을 불러올 수 없습니다. 관리자에게 문의해주세요.</p>
                                </div>
                              </div>
                            ) : (
                              <div className="py-4">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                  <p className="text-yellow-800 text-sm">⏳ 답변 대기 중입니다. 빠른 시일 내에 답변드리겠습니다.</p>
                                  </div>
                              </div>
                            )}
                          </div>
                        )}
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
          <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">새 문의하기</h3>
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
