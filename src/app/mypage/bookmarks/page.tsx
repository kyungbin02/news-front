'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { getBookmarks, removeBookmark, Bookmark } from "@/utils/myNewsApi";

export default function BookmarksPage() {
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

  // HTML 태그 제거 함수
  const stripHtml = (html: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  };

  // 뉴스 미리보기 생성 함수
  const createNewsPreview = (content: string): string => {
    if (!content) return '';
    
    const cleanContent = stripHtml(content);
    return cleanContent.length > 150 
      ? cleanContent.substring(0, 150) + '...'
      : cleanContent;
  };
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 북마크 데이터 로드
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        setLoading(true);
        console.log('📚 북마크 목록 로드 시작');
        
        const bookmarkData = await getBookmarks();
        console.log('📚 로드된 북마크 데이터:', bookmarkData);
        
        // ✅ 안전한 처리: 항상 배열 보장
        setBookmarks(bookmarkData || []);
        setError(null);
        
        console.log('📚 북마크 상태 설정 완료, 개수:', (bookmarkData || []).length);
      } catch (err) {
        console.error('❌ 북마크 로드 실패:', err);
        setError('북마크를 불러올 수 없습니다.');
        setBookmarks([]); // 오류 시 빈 배열
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  // 북마크 삭제 함수
  const handleDeleteBookmark = async (bookmark: Bookmark) => {
    try {
      console.log('🗑️ 북마크 삭제 시도:', bookmark.bookmarkId);
      
      const success = await removeBookmark(bookmark.bookmarkId);
      if (success) {
        // ✅ 안전한 업데이트: 기존 배열에서 해당 항목 제거
        setBookmarks(prev => prev.filter(b => b.bookmarkId !== bookmark.bookmarkId));
        console.log('✅ 북마크 삭제 완료');
      } else {
        console.error('❌ 북마크 삭제 실패');
        alert('북마크 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 북마크 삭제 오류:', error);
      alert('북마크 삭제 중 오류가 발생했습니다.');
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e53e3e] mx-auto mb-4"></div>
              <p className="text-gray-600">북마크를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 오류 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-[#e53e3e] text-white rounded-md hover:bg-red-600"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        {/* 헤더 섹션 */}
        <div className="text-center mb-10">
          <div className="mb-4">
            <Link href="/mypage" className="inline-flex items-center text-gray-500 hover:text-[#e53e3e] transition-colors mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              MY 뉴스로 돌아가기
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📖 북마크한 뉴스</h1>
          <p className="text-gray-600">저장한 뉴스를 확인하고 관리해보세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl mb-2">📌</div>
            <div className="text-2xl font-bold text-[#e53e3e] mb-1">{bookmarks?.length || 0}</div>
            <div className="text-sm text-gray-600">총 북마크</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {bookmarks?.filter(b => {
                const bookmarkDate = new Date(b.createdAt);
                const today = new Date();
                return bookmarkDate.toDateString() === today.toDateString();
              }).length || 0}
            </div>
            <div className="text-sm text-gray-600">오늘 추가</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl mb-2">🏷️</div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {new Set(bookmarks?.map(b => b.category)).size || 0}
            </div>
            <div className="text-sm text-gray-600">카테고리 수</div>
          </div>
        </div>
          
        {/* 북마크 리스트 */}
        <div className="bg-white rounded-lg shadow">
          {bookmarks && bookmarks.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {bookmarks.map((bookmark, index) => (
                <div key={bookmark.bookmarkId} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-6">
                    {/* 뉴스 이미지 */}
                    <div className="w-48 h-48 flex-shrink-0">
                      <Link href={`/news/${bookmark.newsId}`} className="block">
                        {bookmark.imageUrl ? (
                          <img 
                            src={bookmark.imageUrl} 
                            alt={bookmark.newsTitle}
                            className="w-full h-full object-cover rounded-lg hover:opacity-80 transition-opacity shadow-md"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center rounded-lg border-2 border-red-200">
                                    <div class="text-red-400 text-3xl">🔖</div>
                                  </div>
                                `;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center rounded-lg border-2 border-red-200">
                            <div className="text-red-400 text-3xl">🔖</div>
                          </div>
                        )}
                      </Link>
                    </div>
                    
                    {/* 뉴스 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                          #{index + 1}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          {getCategoryKorean(bookmark.category)}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                          📌 북마크
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        <Link href={`/news/${bookmark.newsId}`} className="hover:text-[#e53e3e] transition-colors">
                          {bookmark.newsTitle || '제목 없음'}
                        </Link>
                      </h3>
                      
                      {bookmark.newsContent && (
                        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                          {createNewsPreview(bookmark.newsContent)}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                            </svg>
                            {bookmark.createdAt 
                              ? new Date(bookmark.createdAt).toLocaleDateString('ko-KR') 
                              : '날짜 없음'
                            } 저장됨
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/news/${bookmark.newsId}`}
                            className="px-4 py-2 bg-[#e53e3e] text-white text-sm rounded-lg hover:bg-[#c53030] transition-colors"
                          >
                            읽어보기
                          </Link>
                          <button 
                            onClick={() => handleDeleteBookmark(bookmark)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="북마크 삭제"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 빈 상태 표시 */
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📌</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-3">북마크한 뉴스가 없습니다</h3>
              <p className="text-gray-500 mb-8 text-lg">관심있는 뉴스에서 북마크 버튼을 눌러 저장해보세요</p>
              <Link 
                href="/"
                className="inline-flex items-center px-6 py-3 bg-[#e53e3e] text-white rounded-lg hover:bg-[#c53030] transition-colors text-lg font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                뉴스 둘러보기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 