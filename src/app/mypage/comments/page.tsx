'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { getMyComments, MyComment, getImageFromStoredNews } from "@/utils/myNewsApi";

export default function MyCommentsPage() {
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
  const [comments, setComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNews, setExpandedNews] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        const commentsData = await getMyComments();
        setComments(commentsData || []);
      } catch (error) {
        console.error('댓글 로드 실패:', error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, []);

  // 댓글을 뉴스별로 그룹화
  const groupedComments = comments.reduce((acc, comment) => {
    const key = `${comment.newsId}-${comment.newsTitle}`;
    if (!acc[key]) {
      acc[key] = {
        newsId: comment.newsId,
        newsTitle: comment.newsTitle,
        comments: []
      };
    }
    acc[key].comments.push(comment);
    return acc;
  }, {} as Record<string, { newsId: string; newsTitle: string; comments: MyComment[] }>);

  const toggleExpanded = (newsKey: string) => {
    const newExpanded = new Set(expandedNews);
    if (newExpanded.has(newsKey)) {
      newExpanded.delete(newsKey);
    } else {
      newExpanded.add(newsKey);
    }
    setExpandedNews(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-6 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-gray-500">댓글을 불러오는 중...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💬 내가 쓴 댓글</h1>
          <p className="text-gray-600">작성한 댓글을 확인하고 관리해보세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-2xl font-bold text-[#e53e3e] mb-1">{comments?.length || 0}</div>
            <div className="text-sm text-gray-600">총 댓글</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {comments?.filter(c => {
                const commentDate = new Date(c.createdAt);
                const today = new Date();
                return commentDate.toDateString() === today.toDateString();
              }).length || 0}
            </div>
            <div className="text-sm text-gray-600">오늘 작성</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl mb-2">📰</div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {new Set(comments?.map(c => c.newsId)).size || 0}
            </div>
            <div className="text-sm text-gray-600">댓글 단 뉴스</div>
          </div>
        </div>

        {/* 댓글 목록 */}
        <div className="bg-white rounded-lg shadow">
          {comments.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">💬</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-3">작성한 댓글이 없습니다</h3>
              <p className="text-gray-500 mb-8 text-lg">뉴스에 댓글을 남겨보세요</p>
              <Link 
                href="/" 
                className="inline-flex items-center px-6 py-3 bg-[#e53e3e] text-white rounded-lg hover:bg-[#c53030] transition-colors text-lg font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                뉴스 보러 가기
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {Object.entries(groupedComments).map(([newsKey, newsGroup], groupIndex) => {
                const isExpanded = expandedNews.has(newsKey);
                const hasMultipleComments = newsGroup.comments.length > 1;
                
                return (
                  <div key={newsKey} className="p-6">
                    {/* 뉴스 헤더 */}
                    <div className="flex items-start gap-6 mb-4">
                      {/* 뉴스 이미지 */}
                      <div className="w-32 h-32 flex-shrink-0">
                        <Link href={`/news/${newsGroup.newsId}`} className="block">
                          {(() => {
                            const imageUrl = getImageFromStoredNews(newsGroup.newsId, newsGroup.newsTitle);
                            return imageUrl !== '/image/news.webp' ? (
                              <img 
                                src={imageUrl} 
                                alt={newsGroup.newsTitle}
                                className="w-full h-full object-cover rounded-lg hover:opacity-80 transition-opacity shadow-md"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-full bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center rounded-lg border-2 border-green-200">
                                        <div class="text-green-400 text-3xl">💬</div>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center rounded-lg border-2 border-green-200">
                                <div className="text-green-400 text-3xl">💬</div>
                              </div>
                            );
                          })()}
                        </Link>
                      </div>
                      
                      {/* 뉴스 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            📰 뉴스 #{groupIndex + 1}
                          </span>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                            💬 {newsGroup.comments.length}개 댓글
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                          <Link href={`/news/${newsGroup.newsId}`} className="hover:text-[#e53e3e] transition-colors">
                            {newsGroup.newsTitle || '제목 없음'}
                          </Link>
                        </h3>
                        
                        {hasMultipleComments && (
                          <button
                            onClick={() => toggleExpanded(newsKey)}
                            className="flex items-center text-sm text-gray-600 hover:text-[#e53e3e] transition-colors"
                          >
                            <svg 
                              className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            {isExpanded ? '댓글 접기' : '댓글 펼치기'}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* 댓글 목록 */}
                    <div className="ml-40">
                      {hasMultipleComments && !isExpanded ? (
                        // 접힌 상태: 첫 번째 댓글만 표시
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              최신 댓글
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(newsGroup.comments[0].createdAt).toLocaleDateString('ko-KR')} {new Date(newsGroup.comments[0].createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-gray-800 leading-relaxed">
                            {newsGroup.comments[0].content}
                          </p>
                        </div>
                      ) : (
                        // 펼친 상태: 모든 댓글 표시
                        <div className="space-y-3">
                          {newsGroup.comments.map((comment, commentIndex) => (
                            <div key={comment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                  #{commentIndex + 1}
                                </span>
                                {comment.parentCommentId && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center">
                                    <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0L2.586 11l3.707-3.707a1 1 0 011.414 1.414L5.414 11l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                      <path fillRule="evenodd" d="M4 11a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                    답글
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString('ko-KR')} {new Date(comment.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-gray-800 leading-relaxed mb-3">
                                {comment.content}
                              </p>
                              <Link 
                                href={`/news/${comment.newsId}#comment-${comment.id}`}
                                className="inline-flex items-center px-3 py-1 bg-[#e53e3e] text-white text-xs rounded-lg hover:bg-[#c53030] transition-colors"
                              >
                                댓글 보기
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}