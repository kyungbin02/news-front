'use client';

import React, { useState, useEffect } from 'react';
import ColumnDetailModal from '../../column/ColumnDetailModal';
import { getToken } from '@/utils/token';
import { 
  FileText, 
  Eye,
  Heart,
  MessageCircle,
  Image as ImageIcon
} from 'lucide-react';

export default function PostsPage() {
  // 게시물 관련 상태
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  // 게시물 목록 가져오기
  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/board/board`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('게시물 목록:', data);
        
        // 각 게시글의 댓글 개수를 가져와서 업데이트
        const postsWithCommentCount = await Promise.all(
          data.map(async (post: any) => {
            try {
              const commentCount = await fetchCommentCount(post.board_id || post.id);
              return {
                ...post,
                comment_count: commentCount
              };
            } catch (error) {
              console.error(`게시물 ${post.board_id || post.id}의 댓글 개수 조회 실패:`, error);
              return {
                ...post,
                comment_count: 0
              };
            }
          })
        );
        
        setPosts(postsWithCommentCount);
      } else {
        console.log('게시물 목록 조회 실패:', response.status);
        setPosts([]);
      }
    } catch (error) {
      console.log('게시물 목록 조회 오류:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // 댓글 개수를 백엔드에서 가져오는 함수
  const fetchCommentCount = async (boardId: number): Promise<number> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/board/comment/${boardId}`);
      
      if (response.ok) {
        const comments = await response.json();
        
        // 댓글 개수 계산 (대댓글 포함)
        let totalCount = 0;
        if (Array.isArray(comments)) {
          totalCount = comments.length;
          
          // 대댓글 개수도 계산
          comments.forEach((comment: any) => {
            if (comment.replies && Array.isArray(comment.replies)) {
              totalCount += comment.replies.length;
            }
          });
        }
        
        return totalCount;
      } else {
        console.error(`댓글 조회 실패: ${response.status}`);
        return 0;
      }
    } catch (error) {
      console.error('댓글 조회 오류:', error);
      return 0;
    }
  };

  // 게시물 삭제 함수
  const handleDeletePost = async (postId: number) => {
    if (!confirm('정말 이 게시물을 삭제하시겠습니까?')) {
      return;
    }

    setDeletingPostId(postId);

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/admin/board/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('게시물이 성공적으로 삭제되었습니다.');
        // 게시물 목록 새로고침
        fetchPosts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`삭제 실패: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      alert('게시물 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingPostId(null);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">게시물 관리</h2>
          <p className="text-gray-600 mt-1">전체 게시물 현황을 모니터링하세요</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 게시물</p>
              <p className="text-3xl font-bold text-gray-900">
                {postsLoading ? '...' : posts.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">총 게시물 수</p>
            </div>
          </div>
        </div>
      </div>

      {/* 간단한 게시물 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">최근 게시물</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {postsLoading ? (
            <div className="px-6 py-8 text-center">
              <div className="text-gray-500">게시물을 불러오는 중...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="text-gray-500">게시물이 없습니다.</div>
            </div>
          ) : (
            posts.map((post) => (
            <div key={post.board_id || post.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      {post.image_url ? (
                        <ImageIcon className="w-5 h-5 text-gray-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{post.title}</h4>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">작성자: {post.username}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>조회 {post.view?.toLocaleString() || 0}</span>
                    <span>댓글 {post.comment_count?.toLocaleString() || 0}</span>
                    <span>{post.uploaded_at}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedPost(post);
                        setIsDetailModalOpen(true);
                      }}
                      className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      보기
                    </button>
                    <button 
                      onClick={() => handleDeletePost(post.board_id || post.id)}
                      disabled={deletingPostId === (post.board_id || post.id)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        deletingPostId === (post.board_id || post.id)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                      }`}
                    >
                      {deletingPostId === (post.board_id || post.id) ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* 게시물 상세 모달 */}
      {isDetailModalOpen && selectedPost && (
        <ColumnDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedPost(null);
          }}
          columnId={selectedPost.board_id || selectedPost.id}
          onLikeChange={() => {
            // 좋아요 상태 변경 시 게시물 목록 새로고침
            fetchPosts();
          }}
        />
      )}
    </div>
  );
}
