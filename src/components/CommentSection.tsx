'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Comment } from '@/types/comment';
import { getComments, createComment, updateComment, deleteComment, getReplies } from '@/utils/commentApi';
import { ensureNewsExistsInBackend } from '@/utils/newsStorage';
import { getArticleById } from '@/utils/articleStorage';

type Props = {
  newsId: string | number;
  onLoginRequired?: () => void;
};

export default function CommentSection({ newsId, onLoginRequired }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replies, setReplies] = useState<Record<number, Comment[]>>({});
  const [openCommentActionMenu, setOpenCommentActionMenu] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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

  // 현재 사용자 정보 가져오기
  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/user/info`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCurrentUserId(result.userId);
        }
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  async function load() {
    setLoading(true);
    try {
      const data = await getComments(newsId);
      setComments(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadCurrentUser();
  }, [newsId]);

  // 액션 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.action-menu')) {
        setOpenCommentActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        setReplies((prev) => {
          const { [commentId]: _, ...rest } = prev;
          return rest;
        });
        
        // 대댓글인 경우 부모 댓글의 replies에서도 제거
        setReplies((prev) => {
          const newReplies = { ...prev };
          Object.keys(newReplies).forEach(parentId => {
            newReplies[Number(parentId)] = newReplies[Number(parentId)].filter(
              reply => reply.commentId !== commentId
            );
          });
          return newReplies;
        });
      } else {
        alert('삭제 권한이 없거나 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function onCreateReply(parentId: number) {
    if (!replyContent.trim()) return;
    setLoading(true);
    try {
      console.log('💬 대댓글 작성 시작:', parentId);
      
      const created = await createComment({
        newsId: newsId,
        content: replyContent.trim(),
        parentId: parentId
      });
      
      console.log('✅ 대댓글 작성 성공:', created);
      setReplies((prev) => ({
        ...prev,
        [parentId]: [...(prev[parentId] || []), created]
      }));
      setReplyContent('');
      setReplyingTo(null);
    } catch (err) {
      console.error('대댓글 작성 중 오류:', err);
      alert('대댓글 작성 실패. 로그인/권한을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }

  async function loadReplies(commentId: number) {
    try {
      const data = await getReplies(commentId);
      setReplies((prev) => ({
        ...prev,
        [commentId]: data
      }));
    } catch (err) {
      console.error('대댓글 로딩 실패:', err);
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
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="댓글을 입력하세요..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (!isAuthed && onLoginRequired) {
                    onLoginRequired();
                    return;
                  }
                  onCreate(e);
                }
              }}
              onClick={() => {
                if (!isAuthed && onLoginRequired) {
                  onLoginRequired();
                }
              }}
            />
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              onClick={(e) => {
                if (!isAuthed && onLoginRequired) {
                  onLoginRequired();
                  return;
                }
                onCreate(e);
              }}
            >
              작성
            </button>
          </div>
        </div>

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
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.commentId} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-900">{c.userName || `사용자 ${c.userId}`}</span>
                        <span className="text-sm text-gray-500">
                          {fmt(c.createdAt)}
                        </span>
                      </div>
                      
                      {/* 액션 메뉴 버튼 - 본인의 댓글에만 표시 */}
                      {!editingId && currentUserId && c.userId === currentUserId && (
                        <div className="relative action-menu">
                          <button
                            onClick={() => setOpenCommentActionMenu(openCommentActionMenu === c.commentId ? null : c.commentId)}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          
                          {/* 액션 메뉴 드롭다운 */}
                          {openCommentActionMenu === c.commentId && (
                            <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <button
                                onClick={() => {
                                  setEditingId(c.commentId);
                                  setEditContent(c.content);
                                  setOpenCommentActionMenu(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => {
                                  onDelete(c.commentId);
                                  setOpenCommentActionMenu(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {editingId === c.commentId ? (
                      <div className="mb-3">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="댓글을 입력하세요..."
                        />
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            onClick={() => onUpdate(c.commentId)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditContent('');
                            }}
                            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 mb-3">{c.content}</p>
                    )}
                    
                    {/* 대댓글 작성 버튼 */}
                    {!editingId && (
                      <div className="mb-3">
                        <button
                          onClick={() => {
                            if (!isAuthed && onLoginRequired) {
                              onLoginRequired();
                              return;
                            }
                            if (replies[c.commentId]) {
                              setReplyingTo(null);
                            } else {
                              setReplyingTo(c.commentId);
                              loadReplies(c.commentId);
                            }
                          }}
                          className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          💬 답글 작성
                        </button>
                      </div>
                    )}
                    
                    {/* 대댓글 작성 입력창 */}
                    {replyingTo === c.commentId && (
                      <div className="mb-3 ml-6 border-l-2 border-blue-200 pl-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="대댓글을 입력하세요..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                if (!isAuthed && onLoginRequired) {
                                  onLoginRequired();
                                  return;
                                }
                                onCreateReply(c.commentId);
                              }
                            }}
                            onClick={() => {
                              if (!isAuthed && onLoginRequired) {
                                onLoginRequired();
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              if (!isAuthed && onLoginRequired) {
                                onLoginRequired();
                                return;
                              }
                              onCreateReply(c.commentId);
                            }}
                            className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                          >
                            작성
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent('');
                            }}
                            className="px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* 대댓글 목록 */}
                    {replies[c.commentId] && replies[c.commentId].length > 0 && (
                      <div className="ml-6 space-y-3 border-l-2 border-blue-200 pl-4 mt-3">
                        {replies[c.commentId].map((reply) => (
                          <div key={reply.commentId} className="bg-white rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-semibold text-gray-900">
                                  {reply.userName || `사용자 ${reply.userId}`}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {fmt(reply.createdAt)}
                                </span>
                              </div>
                              
                              {/* 대댓글 액션 메뉴 버튼 - 본인의 댓글에만 표시 */}
                              {currentUserId && reply.userId === currentUserId && (
                                <div className="relative action-menu">
                                <button
                                  onClick={() => setOpenCommentActionMenu(openCommentActionMenu === reply.commentId ? null : reply.commentId)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                                
                                {/* 대댓글 액션 메뉴 드롭다운 */}
                                {openCommentActionMenu === reply.commentId && (
                                  <div className="absolute right-0 top-6 w-28 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <button
                                      onClick={() => {
                                        setEditingId(reply.commentId);
                                        setEditContent(reply.content);
                                        setOpenCommentActionMenu(null);
                                      }}
                                      className="w-full text-left px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={() => {
                                        onDelete(reply.commentId);
                                        setOpenCommentActionMenu(null);
                                      }}
                                      className="w-full text-left px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                )}
                                </div>
                              )}
                            </div>
                            <div className="text-gray-700 text-sm">
                              {reply.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




