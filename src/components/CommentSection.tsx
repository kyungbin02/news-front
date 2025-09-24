'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Comment } from '@/types/comment';
import { getComments, createComment, updateComment, deleteComment, toggleCommentLike, getCommentLikeCount, } from '@/utils/commentApi';
import { ensureNewsExistsInBackend } from '@/utils/newsStorage';
import { getArticleById } from '@/utils/articleStorage';

type Props = {
  newsId: string | number;
};

export default function CommentSection({ newsId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [liked, setLiked] = useState<Set<number>>(new Set()); // 로컬 토글 상태

  const isAuthed = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!(
      localStorage.getItem('jwt_token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('bearerToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('id_token') ||
      localStorage.getItem('refresh_token') ||
      localStorage.getItem('user') ||
      localStorage.getItem('userInfo') ||
      localStorage.getItem('currentUser') ||
      localStorage.getItem('userData')
    );
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getComments(newsId);
      setComments(data);
      
      // 초기 좋아요 수 로딩
      const counts = await Promise.all(
        data.map(async (c) => [c.commentId, await getCommentLikeCount(c.commentId)] as const)
      );
      setLikeCounts(Object.fromEntries(counts));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [newsId]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      console.log('💬 댓글 작성 시작:', newsId);
      
      // 1. 먼저 뉴스가 백엔드에 있는지 확인하고 없으면 저장
      const article = getArticleById(newsId.toString());
      if (article) {
        console.log('📰 뉴스 데이터 찾음, 백엔드 저장 확인 중:', article.title);
        const newsEnsured = await ensureNewsExistsInBackend(article);
        
        if (!newsEnsured) {
          console.error('❌ 뉴스를 백엔드에 저장할 수 없음');
          alert('뉴스 정보를 저장하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          return;
        }
        console.log('✅ 뉴스 백엔드 저장 확인 완료');
      }
      
      // 2. 댓글 작성 (백엔드 API 사용)
      const created = await createComment({
        newsId: newsId,
        content: newComment.trim()
      });
      
      console.log('✅ 댓글 작성 성공:', created);
      setComments((prev) => [created, ...prev]);
      setNewComment('');
      // 새로 만든 댓글의 좋아요 수 0으로 초기화
      setLikeCounts((prev) => ({ ...prev, [created.commentId]: 0 }));
    } catch (err) {
      console.error('댓글 작성 중 오류:', err);
      alert('댓글 작성 실패. 로그인/권한을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }

  async function onUpdate(commentId: number) {
    if (!editContent.trim()) return;
    setLoading(true);
    try {
      const ok = await updateComment(commentId, editContent.trim());
      if (ok) {
        setComments((prev) => prev.map((c) => 
          c.commentId === commentId ? { ...c, content: editContent.trim() } : c
        ));
        setEditingId(null);
        setEditContent('');
      } else {
        alert('수정 권한이 없거나 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(commentId: number) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    setLoading(true);
    try {
      const ok = await deleteComment(commentId);
      if (ok) {
        setComments((prev) => prev.filter((c) => c.commentId !== commentId));
        setLikeCounts(({ [commentId]: _, ...rest }) => rest);
        setLiked((prev) => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
      } else {
        alert('삭제 권한이 없거나 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function onToggleLike(commentId: number) {
    try {
      const ok = await toggleCommentLike(commentId);
      if (!ok) return;
      
      const isLiked = liked.has(commentId);
      setLiked((prev) => {
        const next = new Set(prev);
        if (isLiked) next.delete(commentId);
        else next.add(commentId);
        return next;
      });
      
      setLikeCounts((prev) => ({
        ...prev,
        [commentId]: Math.max(0, (prev[commentId] ?? 0) + (isLiked ? -1 : 1)),
      }));
    } catch (e) {
      console.error(e);
      alert('좋아요 처리 실패. 로그인/권한을 확인해주세요.');
    }
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border border-gray-200">
      <div className="p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="text-3xl mr-3">💬</span>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            댓글 ({comments.length})
          </span>
        </h3>

        {/* 댓글 작성 폼 */}
        <form onSubmit={onCreate} className="mb-8">
          <div className="flex gap-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isAuthed ? '댓글을 입력하세요...' : '로그인 후 댓글 작성 가능합니다.'}
              disabled={loading || !isAuthed}
              rows={3}
              className="flex-1 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={loading || !isAuthed || !newComment.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? '작성 중...' : '등록'}
            </button>
          </div>
        </form>

        {/* 댓글 목록 */}
        {loading && comments.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">댓글을 불러오는 중...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="text-5xl mb-4">💭</div>
            <h4 className="text-xl font-bold text-gray-700 mb-3">첫 댓글을 남겨보세요!</h4>
            <p className="text-gray-600">이 뉴스에 대한 여러분의 생각을 공유해주세요.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((c) => (
              <div key={c.commentId} className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {c.userName ? c.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        {c.userName || `사용자 ${c.userId}`}
                      </div>
                      <div className="text-gray-500 text-sm">{fmt(c.createdAt)}</div>
                    </div>
                  </div>
                </div>

                {editingId === c.commentId ? (
                  <div className="space-y-4">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => onUpdate(c.commentId)}
                        disabled={!editContent.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditContent('');
                        }}
                        type="button"
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">
                      {c.content}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => onToggleLike(c.commentId)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                          liked.has(c.commentId)
                            ? 'bg-red-100 text-red-600 border border-red-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        <span className="text-lg">
                          {liked.has(c.commentId) ? '❤️' : '🤍'}
                        </span>
                        <span className="font-medium">
                          {likeCounts[c.commentId] ?? 0}
                        </span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(c.commentId);
                          setEditContent(c.content);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                      >
                        <span>✏️</span>
                        <span>수정</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => onDelete(c.commentId)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                      >
                        <span>🗑️</span>
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




