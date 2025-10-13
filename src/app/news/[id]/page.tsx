'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { getArticleById } from '@/utils/articleStorage';
import { RSSArticle } from '@/utils/rssApi';
import { trackNewsClick } from '@/utils/popularNewsApi';
import { addBookmark, removeBookmark, checkBookmark, addViewHistory } from '@/utils/myNewsApi';
import CommentSection from '@/components/CommentSection';
import { getToken, isTokenValid } from '@/utils/token';
import LoginModal from '@/components/LoginModal';
import SignupModal from '@/components/SignupModal';

interface NewsDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = use(params);
  const [article, setArticle] = useState<RSSArticle | null>(null);
  const [fullContent, setFullContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [isTrackingInProgress, setIsTrackingInProgress] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // useRef로 추적 상태 관리 (무한 렌더링 방지)
  const hasTrackedViewRef = useRef(false);
  const isTrackingInProgressRef = useRef(false);

  // 로그인 성공 핸들러
  const handleLoginSuccess = (userData: { name: string }) => {
    console.log('로그인 성공:', userData);
    setShowLoginModal(false);
    // 로그인 성공 후 북마크 상태 다시 확인
    if (article) {
      checkBookmark(article.id).then(bookmarkStatus => {
        setIsBookmarked(bookmarkStatus.isBookmarked);
        setBookmarkId(bookmarkStatus.bookmark?.bookmarkId || null);
      }).catch(error => {
        console.error('북마크 상태 확인 실패:', error);
      });
    }
  };

  // 카테고리 한글 변환 함수
  const getCategoryKorean = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'general': '전체',
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

  // 언론사 색상 매핑
  const getSourceColor = (source: string) => {
    const colorMap: { [key: string]: string } = {
      '동아일보': 'bg-blue-100 text-blue-800',
      '조선일보': 'bg-red-100 text-red-800',
      '중앙일보': 'bg-purple-100 text-purple-800',
      '경향신문': 'bg-orange-100 text-orange-800',
      '연합뉴스': 'bg-indigo-100 text-indigo-800',
      '매일경제': 'bg-yellow-100 text-yellow-800',
      '한국경제': 'bg-pink-100 text-pink-800',
      '오마이뉴스': 'bg-cyan-100 text-cyan-800',
      '전자신문': 'bg-green-100 text-green-800'
    };
    return colorMap[source] || 'bg-gray-100 text-gray-800';
  };
  
  useEffect(() => {
    let isMounted = true;
    
    const loadArticle = async () => {
      console.log('=== loadArticle 함수 시작 ===');
      console.log('🔍 받은 ID:', id, '(타입:', typeof id, ')');
      
      if (!isMounted) return;
      setLoading(true);
      
      const isNumericId = /^\d+$/.test(id);
      console.log('🔍 숫자 ID 여부:', isNumericId);
      
      if (isNumericId) {
        console.log('✅ 숫자 ID 확인됨, 백엔드 API 호출 진행');
        try {
          const apiUrl = `http://localhost:8080/api/news/${id}`;
          console.log('🔍 뉴스 상세 API 호출 URL:', apiUrl);
          
          const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
        });
        
          console.log('🔍 API 응답 상태:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('🔍 API 응답 데이터:', data);
            
            if (data.success && data.data) {
            const newsData = data.data;
              console.log('🔍 뉴스 데이터:', newsData);
              console.log('🔍 원문 URL:', newsData.url);
              
              const mappedArticle: RSSArticle = {
                id: newsData.newsId ? newsData.newsId.toString() : id,
                title: newsData.title || '제목 없음',
                description: '', // 백엔드 뉴스는 fullContent 사용하므로 비워둠
                link: `/news/${newsData.newsId || id}`,
                url: newsData.url || newsData.link || '', // 백엔드에서 정상적인 URL 제공
                category: newsData.category || 'general',
                source: newsData.source || '알 수 없는 출처',
                imageUrl: newsData.imageUrl || '/image/news.webp',
                pubDate: newsData.createdAt || newsData.publishedAt || new Date().toISOString()
              };
              
              console.log('🔍 매핑된 아티클:', mappedArticle);
              
              if (isMounted) {
                setArticle(mappedArticle);
                setFullContent(newsData.content || '');
                
                // 북마크 상태 확인
                try {
                  const bookmarkStatus = await checkBookmark(id);
                  if (isMounted) {
                    setIsBookmarked(bookmarkStatus.isBookmarked);
                    setBookmarkId(bookmarkStatus.bookmark?.bookmarkId || null);
                  }
                  console.log('🔍 북마크 상태:', bookmarkStatus);
                } catch (bookmarkError) {
                  console.error('북마크 상태 확인 실패:', bookmarkError);
                }
                
      setLoading(false);
              }
      return;
    }
        }
      } catch (error) {
          console.error('❌ 백엔드 API 호출 실패:', error);
        }
      }
      
      // RSS 폴백 또는 숫자가 아닌 ID 처리
      console.log('🔄 RSS 폴백 또는 로컬 스토리지에서 로드');
      try {
        const storedArticle = getArticleById(id);
        if (storedArticle && isMounted) {
          console.log('✅ 로컬 스토리지에서 아티클 발견:', storedArticle);
          
          // RSS 뉴스는 백엔드에서 URL을 제공하므로 별도 처리 불필요
          
          setArticle(storedArticle);
          // fullContent는 별도로 설정하지 않음 (article.description과 중복 방지)
        } else {
          console.log('❌ 로컬 스토리지에서 아티클을 찾을 수 없음');
        }
      } catch (error) {
        console.error('❌ 로컬 스토리지 로드 실패:', error);
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    loadArticle();
    
    return () => {
      isMounted = false;
    };
  }, [id]);

  // 조회수 추적 및 읽기 시간 측정
  useEffect(() => {
    if (!article || hasTrackedViewRef.current || isTrackingInProgressRef.current) return;

    let isMounted = true;
    const globalTrackingKey = `tracking_${article.id}`;
    
    // 이미 추적 중인지 확인
    if ((window as any)[globalTrackingKey]) {
      console.log('이미 추적 중입니다.');
      hasTrackedViewRef.current = true;
      setHasTrackedView(true);
      return;
    }

    const trackView = async () => {
      console.log('=== trackView 함수 호출됨 ===');
      
      if (!isMounted || hasTrackedViewRef.current || isTrackingInProgressRef.current || (window as any)[globalTrackingKey]) {
        console.log('조건에 의해 추적이 중단됨');
        return;
      }
      
      const isNumericId = /^\d+$/.test(article.id);
      if (!isNumericId) {
        console.log(`RSS 뉴스 조회수 추적 건너뛰기: ${article.title} (ID: ${article.id})`);
        hasTrackedViewRef.current = true;
        setHasTrackedView(true);
        return;
      }
      
      console.log('조회수 추적 시작!');
      isTrackingInProgressRef.current = true;
      setIsTrackingInProgress(true);
      (window as any)[globalTrackingKey] = true;
      
      try {
        const success = await trackNewsClick(
          article.id,
          article.title,
          article.category,
          article.link
        );
        
        // 🔥 조회 기록 저장 추가
        try {
          const viewHistorySuccess = await addViewHistory(
            article.id,
            article.title,
            article.category,
            0
          );
          console.log('📖 조회 기록 저장:', viewHistorySuccess ? '성공' : '실패');
        } catch (viewError) {
          console.error('❌ 조회 기록 저장 실패:', viewError);
        }
        
        if (success && isMounted) {
          hasTrackedViewRef.current = true;
          setHasTrackedView(true);
          const now = Date.now().toString();
          sessionStorage.setItem(`viewed_${article.id}`, now);
          localStorage.setItem(`viewed_${article.id}`, now);
          console.log('✅ 뉴스 조회 추적 완료:', article.title);
        }
      } catch (error) {
        console.error('❌ 조회수 추적 실패:', error);
      } finally {
        if (isMounted) {
          isTrackingInProgressRef.current = false;
        setIsTrackingInProgress(false);
        }
        setTimeout(() => {
          delete (window as any)[globalTrackingKey];
        }, 5000);
      }
    };

    const timer = setTimeout(trackView, 5000);
    const scrollHandler = () => {
      if (window.scrollY > 100) {
        trackView();
        window.removeEventListener('scroll', scrollHandler);
      }
    };
    window.addEventListener('scroll', scrollHandler);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      window.removeEventListener('scroll', scrollHandler);
    };
  }, [article]);


  // 북마크 토글
  const handleBookmarkToggle = async () => {
    if (!article) return;

    // 로그인 체크
    const token = getToken();
    if (!token || !isTokenValid(token)) {
      setShowLoginModal(true);
      return;
    }

    const isNumericId = /^\d+$/.test(article.id);
    if (!isNumericId) {
      alert('RSS 뉴스는 북마크할 수 없습니다.');
      return;
    }

    try {
      if (isBookmarked) {
        if (bookmarkId) {
          await removeBookmark(bookmarkId);
          setIsBookmarked(false);
          setBookmarkId(null);
          console.log('북마크 제거 완료');
          }
        } else {
        const result = await addBookmark(article.id, article.title, article.category);
        if (result) {
          setIsBookmarked(true);
          console.log('북마크 추가 완료');
        }
      }
    } catch (error) {
      console.error('북마크 토글 실패:', error);
    }
  };

  // 공유하기
  const handleShare = async () => {
    if (!article) return;

    const shareData = {
      title: article.title,
      text: article.description || article.title,
      url: `${window.location.origin}/news/${article.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('공유 성공');
        } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('링크가 클립보드에 복사되었습니다.');
      }
    } catch (error) {
      console.error('공유 실패:', error);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded mb-8"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">뉴스를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">요청하신 뉴스가 존재하지 않거나 삭제되었습니다.</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
                홈으로 돌아가기
              </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              홈으로 돌아가기
            </Link>
                  
                  <div className="flex items-center space-x-4">
                    <button
                onClick={handleBookmarkToggle}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                        isBookmarked 
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                        {isBookmarked ? '북마크됨' : '북마크'}
                    </button>
              
              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                공유
              </button>
            </div>
                    </div>
                  </div>
                </div>
                
      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 뉴스 메타 정보 */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSourceColor(article.source)}`}>
                {article.source}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {getCategoryKorean(article.category)}
              </span>
              <span className="text-gray-500 text-sm">
                {new Date(article.pubDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
              {article.title}
            </h1>
            
            {article.description && (
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                {article.description}
              </p>
            )}
          </div>

          {/* 뉴스 이미지 */}
          {article.imageUrl && (
            <div className="mb-8">
              <div className="relative w-full h-64 lg:h-96 rounded-2xl overflow-hidden shadow-lg">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/image/news.webp';
                  }}
                      />
                  </div>
                </div>
          )}

          {/* 뉴스 본문 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="prose prose-lg max-w-none text-center">
              {fullContent ? (
                <div 
                  className="text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: fullContent }}
                />
              ) : (
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {article.description}
                </div>
              )}
            </div>
            
            {/* 원문보기 버튼 */}
            <div className="mt-8 text-center">
              <a
                href={article.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  console.log('🔍 원문보기 클릭 - URL:', article.url);
                  console.log('🔍 전체 아티클:', article);
                  
                  // URL이 없거나 #이면 기본 동작 방지
                  if (!article.url || article.url === '#') {
                    e.preventDefault();
                    console.log('❌ 유효한 URL이 없어서 클릭 방지됨');
                    return;
                  }
                  
                  console.log('✅ 유효한 URL로 이동:', article.url);
                }}
                className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold ${
                  article.url 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700' 
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
              >
                <span>🔗</span>
                <span>원문 보기</span>
                <span>↗</span>
              </a>
            </div>
          </div>
            
          {/* 댓글 섹션 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <CommentSection 
              newsId={id} 
              onLoginRequired={() => setShowLoginModal(true)}
            />
          </div>
        </div>
      </div>
      
      {/* 로그인 모달 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSignupClick={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 회원가입 모달 */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onLoginClick={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
        onSignupSuccess={() => {
          setShowSignupModal(false);
          // 회원가입 성공 후 로그인 모달 표시
          setShowLoginModal(true);
        }}
      />
    </div>
  );
} 