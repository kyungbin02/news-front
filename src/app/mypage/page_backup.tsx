'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { 
  getBookmarks, 
  addBookmark, 
  removeBookmark, 
  getViewHistory, 
  getMyComments, 
  getInquiries, 
  createInquiry, 
  getUserStats,
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
  const [userStats, setUserStats] = useState({
    totalBookmarks: 0,
    totalViews: 0,
    totalComments: 0,
    categoryStats: [] as { category: string; count: number; percentage: number }[]
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookmarks');
  
  // 문의사항 모달 상태
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryTitle, setInquiryTitle] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');
  const [expandedInquiry, setExpandedInquiry] = useState<number | null>(null);
  
  // 문의사항 페이징 상태
  const [currentInquiryPage, setCurrentInquiryPage] = useState(1);
  const inquiriesPerPage = 3;
  
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
  
  
  // 실제 로그인한 사용자 정보 - 새로운 백엔드 API 응답 형식
  const [user, setUser] = useState<{
    name: string;
    username?: string;
    email?: string;
    sns_type?: string;
    user_id?: number;
    joinDate?: string;
    profileImg?: string;
  } | null>(null);

  // 사용자 정보 로드 - 새로운 백엔드 API 사용
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
  useEffect(() => {
    const loadData = async () => {
      console.log("🚀 마이페이지 데이터 로드 시작");
      setLoading(true);
      
      try {
        // 사용자 정보와 마이페이지 데이터를 병렬로 로드
        await Promise.all([
          loadUserInfo(),
          (async () => {
            const [bookmarksData, viewHistoryData, commentsData, statsData] = await Promise.all([
              getBookmarks(),
              getViewHistory(),
              getMyComments(),
              getUserStats()
            ]);
            
            // 문의사항은 별도로 로드 (고객센터 방식 사용)
            await fetchInquiries();
        
            // ✅ 안전한 처리: data || [] 방식 적용
            setBookmarks(bookmarksData || []);
            setViewHistory(viewHistoryData || []);
            setMyComments(commentsData || []);
            setUserStats(statsData || {
              totalBookmarks: 0,
              totalViews: 0,
              totalComments: 0,
              categoryStats: []
            });
            
            // 조회 기록에 메인페이지 방식으로 기본 이미지 적용됨
            
            console.log("✅ 마이페이지 데이터 로드 완료");
          })()
        ]);
      } catch (error) {
        console.error('❌ 데이터 로드 실패:', error);
        // ✅ 오류 시 안전한 기본값 설정
        setBookmarks([]);
        setViewHistory([]);
        setMyComments([]);
        setInquiries([]);
        setUserStats({
          totalBookmarks: 0,
          totalViews: 0,
          totalComments: 0,
          categoryStats: []
        });
      }
      setLoading(false);
    };

    loadData();
  }, []);

  // 북마크 토글
  const toggleBookmark = async (newsId: string, newsTitle: string, category: string) => {
    // ✅ 안전한 처리: bookmarks가 배열인지 확인
    const safeBookmarks = bookmarks || [];
    const existingBookmark = safeBookmarks.find(b => String(b.newsId) === String(newsId));
    
    if (existingBookmark) {
      const success = await removeBookmark(existingBookmark.bookmarkId);
      if (success) {
        setBookmarks(safeBookmarks.filter(b => b.bookmarkId !== existingBookmark.bookmarkId));
      }
    } else {
      const success = await addBookmark(newsId, newsTitle, category);
      if (success) {
        // 데이터 새로고침
        const updatedBookmarks = await getBookmarks();
        setBookmarks(updatedBookmarks || []);
      }
    }
  };

  // 문의사항 목록 가져오기 (고객센터와 동일한 방식)
  const fetchInquiries = async () => {
    try {
      const token = getToken();
      console.log('🔍 토큰 확인:', {
        token: token ? '있음' : '없음',
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : '없음'
      });
      
      if (!token) {
        console.log('토큰이 없습니다.');
        setInquiries([]);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      
      console.log('🔍 사용자 문의사항 목록 조회 API 호출:', {
        url: `${baseUrl}/api/inquiry/list`,
        token: token ? '있음' : '없음'
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
        
        // 사용자용 API 응답을 Inquiry 인터페이스에 맞게 변환
        const mappedInquiries = data.map((item: any) => ({
          id: item.id || item.inquiry_id,
          title: item.title || item.inquiry_title,
          content: item.content || item.inquiry_content,
          status: item.status || item.inquiry_status,
          createdAt: item.createdAt || item.created_at,
          answer: item.answer || item.answer_content,
          answeredAt: item.answeredAt || item.answer_created_at,
          adminUsername: item.adminUsername || item.admin_username
        }));
        
        // 최신순으로 정렬
        const sortedInquiries = mappedInquiries.sort((a: Inquiry, b: Inquiry) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setInquiries(sortedInquiries);
      } else {
        // 401 에러인 경우 토큰 재확인
        if (response.status === 401) {
          console.error('🔐 인증 실패 - 토큰 확인 필요');
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

  // 문의사항 생성
  const handleCreateInquiry = async (title: string, content: string) => {
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
          inquiry_title: title,
          inquiry_content: content
        })
      });

      if (response.ok) {
        alert('문의사항이 접수되었습니다.');
        setInquiryTitle('');
        setInquiryContent('');
        setIsInquiryModalOpen(false);
        // 문의사항 목록 새로고침
        fetchInquiries();
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

  // 문의사항 페이징 계산
  const totalInquiryPages = Math.ceil((inquiries?.length || 0) / inquiriesPerPage);
  const startIndex = (currentInquiryPage - 1) * inquiriesPerPage;
  const endIndex = startIndex + inquiriesPerPage;
  const currentInquiries = inquiries?.slice(startIndex, endIndex) || [];

  // 문의사항 페이지 변경
  const handleInquiryPageChange = (page: number) => {
    setCurrentInquiryPage(page);
    setExpandedInquiry(null); // 페이지 변경 시 열린 문의사항 닫기
  };

  // 문의사항 상세 토글
  const toggleInquiry = async (id: number) => {
    // 이미 열려있으면 닫기만
    if (expandedInquiry === id) {
      setExpandedInquiry(null);
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 사용자용 API를 사용하여 답변 정보를 가져오기
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      
      console.log('🔍 사용자 문의사항 목록에서 답변 정보 가져오기:', {
        url: `${baseUrl}/api/inquiry/list`,
        inquiryId: id
      });
      
      const listResponse = await fetch(`${baseUrl}/api/inquiry/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (listResponse.ok) {
        const listData = await listResponse.json();
        const foundInquiry = listData.find((item: any) => (item.id || item.inquiry_id) === id);
        
        if (foundInquiry) {
          console.log('🔍 목록에서 찾은 문의사항:', foundInquiry);
          console.log('🔍 답변 정보:', {
            answer: foundInquiry.answer || foundInquiry.answer_content,
            answeredAt: foundInquiry.answeredAt || foundInquiry.answer_created_at,
            adminUsername: foundInquiry.adminUsername || foundInquiry.admin_username,
            status: foundInquiry.status || foundInquiry.inquiry_status
          });
          
          // 목록의 해당 문의사항 업데이트 (답변 포함)
          setInquiries(prevInquiries => 
            prevInquiries.map(inquiry => 
              inquiry.id === id 
                ? { 
                    ...inquiry, 
                    answer: foundInquiry.answer || foundInquiry.answer_content,
                    answeredAt: foundInquiry.answeredAt || foundInquiry.answer_created_at,
                    adminUsername: foundInquiry.adminUsername || foundInquiry.admin_username,
                    status: foundInquiry.status || foundInquiry.inquiry_status
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
      setExpandedInquiry(id);
    } catch (error) {
      console.error('문의사항 상세 조회 오류:', error);
      // 오류가 있어도 모달은 열기
      setExpandedInquiry(id);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-6 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">마이페이지</h1>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* 왼쪽 사이드바 - 프로필 정보 */}
            <div className="w-full md:w-1/4">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex flex-col items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {user ? user.name : "로딩중..."}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {user ? user.email : "정보를 불러오는 중..."}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    가입일: {user ? user.joinDate : "정보 없음"}
                  </p>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <nav className="flex flex-col space-y-2">
                    <Link href="/mypage" className="px-3 py-2 text-[#e53e3e] font-medium rounded bg-red-50">
                      내 프로필
                    </Link>
                    <Link href="/mypage/bookmarks" className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                      북마크한 뉴스
                    </Link>
                    <Link href="/mypage/history" className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                      열람 기록
                    </Link>
                    <Link href="/mypage/preferences" className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                      관심사 설정
                    </Link>
                  </nav>
                </div>
              </div>
              
              {/* 뉴스 소비 통계 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-medium text-gray-900 mb-6">내 뉴스 통계</h3>
                
                {/* 도넛 차트 스타일 통계 */}
                <div className="flex justify-center mb-8">
                  <div className="relative w-48 h-48">
                    {(() => {
                      const total = (bookmarks?.length || 0) + (viewHistory?.length || 0) + (myComments?.length || 0);
                      if (total === 0) {
                        return (
                          <div className="w-full h-full rounded-full border-8 border-gray-200 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl text-gray-400 mb-1">📊</div>
                              <div className="text-xs text-gray-400">데이터 없음</div>
                            </div>
                          </div>
                        );
                      }
                      
                      const bookmarkPercentage = ((bookmarks?.length || 0) / total) * 100;
                      const viewPercentage = ((viewHistory?.length || 0) / total) * 100;
                      const commentPercentage = ((myComments?.length || 0) / total) * 100;
                      
                      return (
                        <>
                          {/* 외부 원 */}
                          <div className="absolute inset-0 rounded-full" style={{
                            background: `conic-gradient(
                              from 0deg,
                              #ef4444 0deg ${bookmarkPercentage * 3.6}deg,
                              #3b82f6 ${bookmarkPercentage * 3.6}deg ${(bookmarkPercentage + viewPercentage) * 3.6}deg,
                              #10b981 ${(bookmarkPercentage + viewPercentage) * 3.6}deg 360deg
                            )`
                          }}>
                            {/* 내부 흰색 원 */}
                            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-800">{total}</div>
                                <div className="text-xs text-gray-500">총 활동</div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                {/* 범례 및 수치 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-gray-700">북마크</span>
                    </div>
                    <div className="text-2xl font-bold text-red-500">{bookmarks?.length || 0}</div>
                    <div className="text-xs text-gray-500">
                      {(() => {
                        const total = (bookmarks?.length || 0) + (viewHistory?.length || 0) + (myComments?.length || 0);
                        return total > 0 ? `${Math.round(((bookmarks?.length || 0) / total) * 100)}%` : '0%';
                      })()}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-gray-700">조회</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-500">{viewHistory?.length || 0}</div>
                    <div className="text-xs text-gray-500">
                      {(() => {
                        const total = (bookmarks?.length || 0) + (viewHistory?.length || 0) + (myComments?.length || 0);
                        return total > 0 ? `${Math.round(((viewHistory?.length || 0) / total) * 100)}%` : '0%';
                      })()}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-gray-700">댓글</span>
                    </div>
                    <div className="text-2xl font-bold text-green-500">{myComments?.length || 0}</div>
                    <div className="text-xs text-gray-500">
                      {(() => {
                        const total = (bookmarks?.length || 0) + (viewHistory?.length || 0) + (myComments?.length || 0);
                        return total > 0 ? `${Math.round(((myComments?.length || 0) / total) * 100)}%` : '0%';
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* 프로그레스 바 차트 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">활동 분포</h4>
                  
                  {/* 북마크 바 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                        북마크
                      </span>
                      <span className="font-medium text-gray-900">{bookmarks?.length || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-red-400 to-red-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                        style={{ 
                          width: `${(() => {
                            const max = Math.max(bookmarks?.length || 0, viewHistory?.length || 0, myComments?.length || 0);
                            return max > 0 ? ((bookmarks?.length || 0) / max) * 100 : 0;
                          })()}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* 조회 바 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                        조회
                      </span>
                      <span className="font-medium text-gray-900">{viewHistory?.length || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                        style={{ 
                          width: `${(() => {
                            const max = Math.max(bookmarks?.length || 0, viewHistory?.length || 0, myComments?.length || 0);
                            return max > 0 ? ((viewHistory?.length || 0) / max) * 100 : 0;
                          })()}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* 댓글 바 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        댓글
                      </span>
                      <span className="font-medium text-gray-900">{myComments?.length || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                        style={{ 
                          width: `${(() => {
                            const max = Math.max(bookmarks?.length || 0, viewHistory?.length || 0, myComments?.length || 0);
                            return max > 0 ? ((myComments?.length || 0) / max) * 100 : 0;
                          })()}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* 카테고리별 관심도 (기존 유지) */}
                {userStats?.categoryStats && userStats.categoryStats.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">카테고리별 관심도</h4>
                    <div className="space-y-3">
                      {userStats.categoryStats.map((stat, index) => (
                        <div key={`category-${stat.category}-${index}`}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{stat.category}</span>
                            <span className="text-gray-900 font-medium">{stat.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${stat.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 데이터 없을 때 */}
                {(bookmarks?.length || 0) + (viewHistory?.length || 0) + (myComments?.length || 0) === 0 && (
                  <div className="text-center py-6 mt-4 border-t border-gray-100">
                    <div className="text-gray-400 text-sm">뉴스 활동을 시작해보세요!</div>
                    <div className="text-xs text-gray-400 mt-1">북마크, 조회, 댓글로 통계를 쌓아가세요</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 오른쪽 메인 콘텐츠 */}
            <div className="w-full md:w-3/4">
              {/* 북마크한 뉴스 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">북마크한 뉴스</h3>
                  <Link href="/mypage/bookmarks" className="text-[#e53e3e] text-sm hover:underline">
                    모두 보기
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {/* ✅ 안전한 처리: bookmarks && bookmarks.length */}
                  {!bookmarks || bookmarks.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🔖</div>
                      <p className="text-gray-500">북마크한 뉴스가 없습니다</p>
                      <p className="text-sm text-gray-400 mt-1">관심있는 뉴스를 북마크해보세요</p>
                    </div>
                  ) : (
                    bookmarks.slice(0, 3).map(bookmark => (
                      <div key={bookmark.bookmarkId} className="flex items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        {/* 뉴스 이미지 */}
                        <div className="w-16 h-16 mr-4 flex-shrink-0">
                          <Link href={`/news/${bookmark.newsId}`}>
                            {bookmark.imageUrl ? (
                              <img 
                                src={bookmark.imageUrl} 
                                alt={bookmark.newsTitle}
                                className="w-full h-full object-cover rounded-lg hover:opacity-80 transition-opacity"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center rounded-lg">
                                        <div class="text-red-500 text-xl">🔖</div>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center rounded-lg">
                                <div className="text-red-500 text-xl">🔖</div>
                              </div>
                            )}
                          </Link>
                        </div>
                        
                        {/* 뉴스 정보 */}
                      <div className="flex-1">
                          <Link href={`/news/${bookmark.newsId}`} className="font-medium text-gray-900 hover:text-[#e53e3e] block line-clamp-2">
                            {bookmark.newsTitle}
                        </Link>
                        <div className="flex text-xs text-gray-500 mt-1">
                            <span className="mr-2">{bookmark.category || '일반'}</span>
                            <span>{new Date(bookmark.createdAt).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* 최근 본 뉴스 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">최근 본 뉴스</h3>
                  <Link href="/mypage/history" className="text-[#e53e3e] text-sm hover:underline">
                    모두 보기
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* ✅ 안전한 처리: viewHistory && viewHistory.length */}
                  {!viewHistory || viewHistory.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <div className="text-4xl mb-4">👁️</div>
                      <p className="text-gray-500">최근 본 뉴스가 없습니다</p>
                      <p className="text-sm text-gray-400 mt-1">뉴스를 읽어보세요</p>
                    </div>
                  ) : (
                    viewHistory.slice(0, 3).map((history, index) => (
                      <Link 
                        key={history.viewId}
                        href={`/news/${history.newsId}`}
                        className="group block transform hover:scale-[1.01] transition-all duration-300"
                      >
                        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 h-full">
                          <div className="relative h-48 overflow-hidden">
                            {/* 순위 배지 */}
                            <div className="absolute top-3 left-3 bg-[#e53e3e] text-white px-2 py-1 rounded font-bold text-xs z-10">
                              {index + 1}
                            </div>
                            
                            {/* 이미지 또는 카테고리 배경 */}
                            {history.newsImageUrl ? (
                              <img 
                                src={history.newsImageUrl} 
                                alt={history.newsTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  console.log(`❌ 이미지 로드 실패: ${history.newsImageUrl}, 기본 이미지로 대체`);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                        <div class="text-center">
                                          <div class="text-2xl mb-2">📰</div>
                                          <div class="text-sm text-gray-600 px-4">${history.category || '뉴스'}</div>
                                        </div>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-2xl mb-2">📰</div>
                                  <div className="text-sm text-gray-600 px-4">{history.category || '뉴스'}</div>
                                </div>
                              </div>
                            )}
                            
                            {/* 카테고리 태그 */}
                            <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                              {history.category || '일반'}
                        </div>
                      </div>
                          
                          <div className="p-4">
                            <h3 className="font-medium text-gray-900 group-hover:text-[#e53e3e] transition-colors line-clamp-2 text-sm mb-2">
                              {history.newsTitle}
                            </h3>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>조회: {new Date(history.viewedAt).toLocaleDateString('ko-KR')}</span>
                              {history.readTime > 0 && (
                                <span>읽은 시간: {Math.floor(history.readTime / 60)}분</span>
                              )}
                        </div>
                      </div>
                    </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
              
              {/* 내가 쓴 댓글 */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">내가 쓴 댓글</h3>
                  <Link href="/mypage/comments" className="text-[#e53e3e] text-sm hover:underline">
                    모두 보기
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {/* ✅ 안전한 처리: myComments && myComments.length */}
                  {!myComments || myComments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">💬</div>
                      <p className="text-gray-500">작성한 댓글이 없습니다</p>
                      <p className="text-sm text-gray-400 mt-1">뉴스에 댓글을 남겨보세요</p>
                    </div>
                  ) : (
                    myComments.slice(0, 3).map(comment => (
                      <div key={comment.id} className="flex items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        {/* 댓글 아이콘 */}
                        <div className="w-12 h-12 mr-4 flex-shrink-0 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                          <div className="text-green-600 text-xl">💬</div>
                        </div>
                        
                        {/* 댓글 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <Link 
                              href={`/news/${comment.newsId}`} 
                              className="font-medium text-gray-900 hover:text-[#e53e3e] text-sm line-clamp-1"
                            >
                              {comment.newsTitle}
                            </Link>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          
                          <p className="text-gray-700 text-sm mb-2 line-clamp-2 leading-relaxed">
                            {comment.content}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-gray-500">
                              {comment.parentCommentId && (
                                <span className="flex items-center text-blue-500">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0L2.586 11l3.707-3.707a1 1 0 011.414 1.414L5.414 11l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M4 11a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-xs">답글</span>
                                </span>
                              )}
                            </div>
                            
                            <Link 
                              href={`/news/${comment.newsId}#comment-${comment.id}`}
                              className="text-xs text-[#e53e3e] hover:underline"
                            >
                              댓글 보기
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                    </div>
                </div>
                
              {/* 문의사항 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">문의사항</h3>
                  <button 
                    onClick={() => setIsInquiryModalOpen(true)}
                    className="text-[#e53e3e] text-sm hover:underline"
                  >
                    새 문의하기
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* 문의사항 개수 및 페이지 정보 표시 */}
                  {inquiries && inquiries.length > 0 && (
                    <div className="text-sm text-gray-500 mb-2">
                      총 {inquiries.length}개의 문의사항 ({currentInquiryPage}/{totalInquiryPages} 페이지)
                    </div>
                  )}
                  
                  {/* ✅ 안전한 처리: inquiries && inquiries.length */}
                  {!inquiries || inquiries.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">❓</div>
                      <p className="text-gray-500">문의사항이 없습니다</p>
                      <p className="text-sm text-gray-400 mt-1">궁금한 점이 있으시면 문의해주세요</p>
                    </div>
                  ) : (
                    currentInquiries.map(inquiry => (
                      <div key={inquiry.id} className="border border-gray-200 rounded-lg p-4">
                        <button
                          onClick={() => toggleInquiry(inquiry.id)}
                          className="w-full text-left"
                        >
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
                            <svg
                              className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
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
                          <div className="mt-4 text-gray-600 bg-gray-50 p-4 rounded-lg">
                            <div className="whitespace-pre-wrap">{inquiry.content}</div>
                            {inquiry.status === 'answered' && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2">답변</h4>
                                {inquiry.answer && inquiry.answer.trim() ? (
                                  <>
                                    <div className="text-gray-600 bg-blue-50 p-3 rounded-lg whitespace-pre-wrap">
                                      {inquiry.answer}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-2 flex items-center justify-between">
                                      <span>답변일: {inquiry.answeredAt ? new Date(inquiry.answeredAt).toLocaleDateString('ko-KR') : ''}</span>
                                      {inquiry.adminUsername && (
                                        <span>답변자: {inquiry.adminUsername}</span>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-gray-500 italic">
                                    답변 내용을 불러오는 중입니다...
                                  </div>
                                )}
                              </div>
                            )}
                            {inquiry.status === 'pending' && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-500 italic">
                                  답변을 기다리고 있습니다. 빠른 시일 내에 답변드리겠습니다.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  
                  {/* 문의사항 페이징 컨트롤 */}
                  {inquiries && inquiries.length > inquiriesPerPage && (
                    <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleInquiryPageChange(currentInquiryPage - 1)}
                        disabled={currentInquiryPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      
                      {/* 페이지 번호들 */}
                      {Array.from({ length: totalInquiryPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handleInquiryPageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentInquiryPage === page
                              ? 'bg-[#e53e3e] text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handleInquiryPageChange(currentInquiryPage + 1)}
                        disabled={currentInquiryPage === totalInquiryPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </div>
                  )}
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 문의사항 작성 모달 */}
      {isInquiryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#e53e3e]">문의사항 작성</h2>
              <button
                onClick={() => setIsInquiryModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (inquiryTitle.trim() && inquiryContent.trim()) {
                handleCreateInquiry(inquiryTitle, inquiryContent);
              }
            }} className="p-6">
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
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
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
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

      {/* 읽기 패턴 분석 섹션 */}
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

      {/* 최근 활동 요약 섹션 */}
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
    </>
  );
} 