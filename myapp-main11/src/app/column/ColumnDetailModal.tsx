'use client';

import React, { useEffect, useState } from 'react';
import { getToken, removeToken } from '@/utils/token';
import { parseTitleAndContent } from '@/utils/articleStorage';
import ImageGallery from '@/components/ImageGallery';

interface ColumnDetail {
  id: number;
  title: string;
  author: string;
  date: string;
  views: number;
  comments: number;
  likes: number;
  content: string;
  image_url?: string;
  imageUrls?: string; // 여러 이미지를 위한 필드 추가
  isLiked?: boolean; // 좋아요 상태 추가
  commentList?: any[]; // 댓글 목록 필드 추가
}

interface ColumnDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: number | null;
  onLikeChange?: (columnId: number, isLiked: boolean, likeCount: number) => void; // 좋아요 상태 변경 콜백 추가
}

export default function ColumnDetailModal({ isOpen, onClose, columnId, onLikeChange }: ColumnDetailModalProps) {
  const [column, setColumn] = useState<ColumnDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentInput, setCommentInput] = useState(''); // 댓글 입력 상태
  
  // 댓글 수정 관련 상태
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState<string>('');
  
  // 대댓글 관련 상태
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);
  const [replyInput, setReplyInput] = useState<string>('');
  
  // 답글 표시 상태 관리
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  
  // 현재 사용자 정보
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null);
  
  // 댓글 액션 메뉴 상태
  const [openCommentActionMenu, setOpenCommentActionMenu] = useState<number | null>(null);
  
  // 신고 관련 상태
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedTargetForReport, setSelectedTargetForReport] = useState<{
    type: 'board' | 'comment';
    id: number;
    title?: string;
    content?: string;
    userId?: number;
  } | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [reportAdditionalComment, setReportAdditionalComment] = useState('');

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

  // 좋아요 상태 확인 함수
  const fetchLikeStatus = async (boardId: number) => {
    try {
      const token = getToken();
      if (!token) {
        console.log('💖 토큰이 없어서 좋아요 상태를 가져올 수 없습니다.');
        return null;
      }
      
      // 토큰 유효성 검사
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.log('💖 토큰 형식이 올바르지 않습니다.');
        return null;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/board/${boardId}/like-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('💖 좋아요 상태 확인:', data);
        return data;
      } else {
        console.log('좋아요 상태 확인 실패:', response.status);
        return null;
      }
    } catch (error) {
      console.error('좋아요 상태 확인 오류:', error);
      return null;
    }
  };

  // 좋아요 토글 함수
  const handleLikeToggle = async () => {
    if (!column) {
      console.error('❌ column이 없습니다.');
      return;
    }
    
    try {
      const token = getToken();
      console.log('🔍 좋아요 토글 디버깅:', {
        columnId: column.id,
        columnTitle: column.title,
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : '없음'
      });
      
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }
      
      // 토큰 유효성 검사
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        alert('토큰이 유효하지 않습니다. 다시 로그인해주세요.');
        removeToken();
        return;
      }
      
      // JWT 토큰 내용 디버깅
      try {
        const header = JSON.parse(atob(tokenParts[0]));
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('🔍 JWT 토큰 분석:', {
          header: header,
          payload: payload,
          exp: payload.exp,
          iat: payload.iat,
          currentTime: Math.floor(Date.now() / 1000),
          isExpired: payload.exp ? (Date.now() / 1000) > payload.exp : 'exp 없음'
        });
      } catch (e) {
        console.log('❌ JWT 토큰 파싱 실패:', e);
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const requestUrl = `${baseUrl}/api/board/board/${column.id}/like`;
      
      console.log('🌐 API 요청 정보:', {
        url: requestUrl,
        method: 'POST',
        columnId: column.id,
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      const resp = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 응답 상태:', resp.status, resp.statusText);
      console.log('📡 응답 헤더:', Object.fromEntries(resp.headers.entries()));

      if (resp.ok) {
        const data = await resp.json();
        console.log('📡 응답 데이터:', data);
        
        const newIsLiked = data.isLiked;
        const newCount = data.likeCount || data.like_count || data.likes || 0;

        // 컬럼 상태 업데이트
        setColumn(prev => prev ? {
          ...prev,
          isLiked: newIsLiked,
          likes: newCount
        } : null);

        // 부모 컴포넌트에 좋아요 상태 변경 알림
        if (onLikeChange) {
          onLikeChange(column.id, newIsLiked, newCount);
          console.log('📢 부모 컴포넌트에 좋아요 상태 변경 알림:', { columnId: column.id, isLiked: newIsLiked, count: newCount });
        }

        console.log('✅ 좋아요 토글 성공:', { columnId: column.id, isLiked: newIsLiked, count: newCount });
      } else {
        const responseText = await resp.text();
        console.error('❌ 좋아요 토글 실패:', {
          status: resp.status,
          statusText: resp.statusText,
          responseText: responseText
        });
        
        // 400 오류 상세 정보 표시
        if (resp.status === 400) {
          try {
            const errorData = JSON.parse(responseText);
            console.error('📝 400 오류 상세:', errorData);
            alert(`좋아요 처리에 실패했습니다: ${errorData.error || responseText}`);
          } catch (e) {
            console.error('📝 400 오류 응답 파싱 실패:', e);
            alert(`좋아요 처리에 실패했습니다: ${responseText}`);
          }
        }
        
        if (resp.status === 401) {
          console.log('🚨 백엔드 인증 문제 감지 - 임시로 프론트엔드에서만 처리');
          
          // 임시로 프론트엔드에서만 좋아요 상태 변경
          const newIsLiked = !column.isLiked;
          const newCount = newIsLiked ? column.likeCount + 1 : column.likeCount - 1;
          
          // 로컬 상태 업데이트
          setColumn(prevColumn => ({
            ...prevColumn,
            isLiked: newIsLiked,
            likeCount: newCount
          }));
          
          // 부모 컴포넌트에 알림
          if (onLikeChange) {
            onLikeChange(column.id, newIsLiked, newCount);
          }
          
          console.log('✅ 임시 처리 완료:', { columnId: column.id, isLiked: newIsLiked, count: newCount });
          alert('백엔드 인증 문제로 임시 처리되었습니다.\n페이지 새로고침 시 원래 상태로 돌아갑니다.');
        } else {
          alert(`좋아요 처리에 실패했습니다.\n상태: ${resp.status}\n메시지: ${responseText}`);
        }
      }
    } catch (error) {
      console.error('💥 좋아요 토글 오류:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // 게시물 신고하기 함수
  const handleReportBoard = () => {
    if (!column) return;
    
    setSelectedTargetForReport({
      type: 'board',
      id: column.id,
      title: column.title,
      content: column.content,
      userId: column.user_id
    });
    setShowReportModal(true);
  };

  // 댓글 신고하기 함수
  const handleReportComment = (commentId: number, commentContent: string, userId: number) => {
    setSelectedTargetForReport({
      type: 'comment',
      id: commentId,
      content: commentContent,
      userId: userId
    });
    setShowReportModal(true);
    setOpenCommentActionMenu(null);
  };

  // 신고 제출 함수
  const handleReportSubmit = async () => {
    if (!selectedTargetForReport) return;
    
    if (!selectedReportReason) {
      alert('신고 사유를 선택해주세요.');
      return;
    }
    
    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      
      console.log('🚨 신고 정보:', {
        targetType: selectedTargetForReport.type,
        targetId: selectedTargetForReport.id,
        reason: selectedReportReason,
        additionalComment: reportAdditionalComment,
        reporterToken: token ? `${token.substring(0, 20)}...` : '없음'
      });
      
      // 실제 신고 API 호출
      const response = await fetch(`${baseUrl}/api/report/user`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reported_user_id: selectedTargetForReport.userId,
          report_reason: selectedReportReason,
          report_content: reportAdditionalComment || '',
          target_type: selectedTargetForReport.type === 'board' ? 'board' : 'board_comment',
          target_id: selectedTargetForReport.type === 'board' ? selectedTargetForReport.id : columnId, // 게시물인 경우 게시물 ID, 댓글인 경우 게시물 ID
          comment_id: selectedTargetForReport.type === 'comment' ? selectedTargetForReport.id : null, // 댓글인 경우 댓글 ID
          target_title: selectedTargetForReport.title || selectedTargetForReport.content, // 게시글 제목 또는 댓글 내용
          target_content: selectedTargetForReport.content // 게시글/댓글 내용
        })
      });
      
      console.log('🔍 API 응답 상태:', response.status, response.statusText);
      console.log('🔍 응답 헤더:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        try {
          const result = await response.json();
          console.log('신고 접수 성공:', result);
          alert('신고가 접수되었습니다. 검토 후 처리하겠습니다.');
          
          // 모달 닫기 및 상태 초기화
          setShowReportModal(false);
          setSelectedTargetForReport(null);
          setSelectedReportReason('');
          setReportAdditionalComment('');
        } catch (jsonError) {
          console.log('JSON 파싱 오류 (하지만 신고는 성공):', jsonError);
          // JSON 파싱 오류가 있어도 신고는 성공했을 수 있음
          alert('신고가 접수되었습니다. 검토 후 처리하겠습니다.');
          
          // 모달 닫기 및 상태 초기화
          setShowReportModal(false);
          setSelectedTargetForReport(null);
          setSelectedReportReason('');
          setReportAdditionalComment('');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('신고 접수 실패:', response.status, errorData);
        alert(`신고 접수에 실패했습니다: ${errorData.message || response.statusText}`);
      }
      
    } catch (err) {
      console.error('신고 오류:', err);
      alert('신고 처리 중 오류가 발생했습니다.');
    }
  };


  // 댓글 수정 함수
  const handleCommentEdit = async (commentId: number) => {
    if (!editCommentContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const requestUrl = `${baseUrl}/api/board/comment/${commentId}`;
      
      console.log('✏️ 댓글 수정 API 호출:', requestUrl);
      console.log('📝 수정할 내용:', editCommentContent);

      const resp = await fetch(requestUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: new URLSearchParams({
          comment_content: editCommentContent
        })
      });

      if (resp.ok) {
        const responseText = await resp.text();
        console.log('✅ 댓글 수정 성공:', responseText);
        
        // 수정 모드 종료
        setEditingCommentId(null);
        setEditCommentContent('');
        
        // 댓글 목록 새로고침
        await loadColumnDetail();
        
        alert('댓글이 수정되었습니다.');
      } else {
        console.error('❌ 댓글 수정 실패:', resp.status);
        if (resp.status === 401) {
          alert('권한이 없습니다.');
        } else if (resp.status === 400) {
          alert('댓글 내용을 입력해주세요.');
        } else {
          alert('댓글 수정에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('💥 댓글 수정 오류:', error);
      alert('댓글 수정 중 오류가 발생했습니다.');
    }
  };

  // 댓글 수정 취소 함수
  const handleCommentEditCancel = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
  };

  // 댓글 수정 모드 시작 함수
  const handleCommentEditStart = (comment: any) => {
    setEditingCommentId(comment.comment_id);
    setEditCommentContent(comment.comment_content);
  };

  // 대댓글 작성 함수
  const handleReplySubmit = async (parentCommentId: number) => {
    if (!replyInput.trim()) {
      alert('대댓글 내용을 입력해주세요.');
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const requestUrl = `${baseUrl}/api/board/comment/${column?.id}/reply`;
      
      console.log('💬 대댓글 작성 API 호출:', requestUrl);
      console.log('📝 대댓글 내용:', replyInput);
      console.log('👥 부모 댓글 ID:', parentCommentId);

      const resp = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: new URLSearchParams({
          parent_id: parentCommentId.toString(),
          comment_content: replyInput
        })
      });

      if (resp.ok) {
        const responseText = await resp.text();
        console.log('✅ 대댓글 작성 성공:', responseText);
        
        // 입력 필드 초기화 및 대댓글 모드 종료
        setReplyInput('');
        setReplyingToCommentId(null);
        
        // 댓글 목록 새로고침
        await loadColumnDetail();
        
        alert('대댓글이 작성되었습니다.');
      } else {
        console.error('❌ 대댓글 작성 실패:', resp.status);
        if (resp.status === 401) {
          alert('권한이 없습니다.');
        } else if (resp.status === 400) {
          alert('대댓글 내용을 입력해주세요.');
        } else {
          alert('대댓글 작성에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('💥 대댓글 작성 오류:', error);
      alert('대댓글 작성 중 오류가 발생했습니다.');
    }
  };

  // 대댓글 작성 모드 시작
  const handleReplyStart = (commentId: number) => {
    setReplyingToCommentId(commentId);
    setReplyInput('');
  };

  // 대댓글 작성 모드 취소
  const handleReplyCancel = () => {
    setReplyingToCommentId(null);
    setReplyInput('');
  };

  // 답글 표시/숨김 토글
  const toggleReplies = (commentId: number) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // 대댓글 수정 함수
  const handleReplyEdit = async (replyId: number) => {
    if (!editCommentContent.trim()) {
      alert('대댓글 내용을 입력해주세요.');
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const requestUrl = `${baseUrl}/api/board/comment/reply/${replyId}`;
      
      console.log('✏️ 대댓글 수정 API 호출:', requestUrl);
      console.log('📝 수정할 내용:', editCommentContent);

      const resp = await fetch(requestUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: new URLSearchParams({
          comment_content: editCommentContent
        })
      });

      if (resp.ok) {
        const responseText = await resp.text();
        console.log('✅ 대댓글 수정 성공:', responseText);
        
        // 수정 모드 종료
        setEditingCommentId(null);
        setEditCommentContent('');
        
        // 댓글 목록 새로고침
        await loadColumnDetail();
        
        alert('대댓글이 수정되었습니다.');
      } else {
        console.error('❌ 대댓글 수정 실패:', resp.status);
        if (resp.status === 401) {
          alert('권한이 없습니다.');
        } else if (resp.status === 400) {
          alert('대댓글 내용을 입력해주세요.');
        } else {
          alert('대댓글 수정에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('💥 대댓글 수정 오류:', error);
      alert('대댓글 수정 중 오류가 발생했습니다.');
    }
  };

  // 대댓글 삭제 함수
  const handleReplyDelete = async (replyId: number) => {
    // 삭제 확인
    if (!confirm('정말로 이 대댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const requestUrl = `${baseUrl}/api/board/comment/reply/${replyId}`;
      
      console.log('🗑️ 대댓글 삭제 API 호출:', requestUrl);

      const resp = await fetch(requestUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (resp.ok) {
        const responseText = await resp.text();
        console.log('✅ 대댓글 삭제 성공:', responseText);
        
        // 댓글 목록 새로고침
        await loadColumnDetail();
        
        alert('대댓글이 삭제되었습니다.');
      } else {
        console.error('❌ 대댓글 삭제 실패:', resp.status);
        if (resp.status === 401) {
          alert('권한이 없습니다.');
        } else if (resp.status === 404) {
          alert('대댓글을 찾을 수 없습니다.');
        } else {
          alert('대댓글 삭제에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('💥 대댓글 삭제 오류:', error);
      alert('대댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  // 댓글 삭제 함수
  const handleCommentDelete = async (commentId: number) => {
    // 삭제 확인
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const requestUrl = `${baseUrl}/api/board/comment/${commentId}`;
      
      console.log('🗑️ 댓글 삭제 API 호출:', requestUrl);

      const resp = await fetch(requestUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (resp.ok) {
        const responseText = await resp.text();
        console.log('✅ 댓글 삭제 성공:', responseText);
        
        // 댓글 목록 새로고침
        await loadColumnDetail();
        
        alert('댓글이 삭제되었습니다.');
      } else {
        console.error('❌ 댓글 삭제 실패:', resp.status);
        if (resp.status === 401) {
          alert('권한이 없습니다.');
        } else if (resp.status === 404) {
          alert('댓글을 찾을 수 없습니다.');
        } else {
          alert('댓글 삭제에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('💥 댓글 삭제 오류:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  // 현재 사용자 정보 가져오기
  const loadCurrentUser = async () => {
    try {
      const token = getToken();
      if (!token) {
        setCurrentUser(null);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/user`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('👤 /api/user 응답 데이터:', userData);
        
        if (userData.isAuthenticated) {
          // 여러 가능한 필드에서 사용자 ID 찾기
          const userId = userData.userId || userData.id || userData.user_id || userData.userId;
          const username = userData.username || userData.name;
          
          console.log('👤 추출된 사용자 정보:', { userId, username });
          
          if (userId) {
            setCurrentUser({
              id: userId,
              username: username
            });
            console.log('✅ 현재 사용자 정보 설정 완료:', { id: userId, username });
          } else {
            console.error('❌ 사용자 ID를 찾을 수 없음:', userData);
            setCurrentUser(null);
          }
        }
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      setCurrentUser(null);
    }
  };

  // 댓글 작성 함수
  const handleCommentSubmit = async () => {
    if (!column || !commentInput.trim()) return;

    try {
      const token = getToken();
      console.log('🔍 댓글 작성 디버깅:', {
        columnId: column.id,
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : '없음'
      });
      
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      // 올바른 API 엔드포인트로 수정
      const requestUrl = `${baseUrl}/api/board/comment/${column.id}`;
      
      console.log('🌐 댓글 작성 API 호출:', requestUrl);
      console.log('🔑 요청 헤더:', {
        'Authorization': `Bearer ${token.substring(0, 20)}...`,
        // 'Content-Type' 헤더 제거됨
      });
      console.log('📝 요청 본문:', { comment_content: commentInput });

      const resp = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type' 헤더 제거 (브라우저가 자동 설정)
        },
        body: new URLSearchParams({
          comment_content: commentInput // 백엔드 필드명에 맞춤
        })
      });

      console.log('📡 응답 상태:', resp.status, resp.statusText);

      if (resp.ok) {
        // 백엔드 응답이 한글 텍스트이므로 text()로 처리
        const responseText = await resp.text();
        setCommentInput(''); // 입력 필드 초기화
        await loadColumnDetail(); // 댓글 목록 다시 로드
        console.log('✅ 댓글 작성 성공:', responseText);
      } else {
        console.error('❌ 댓글 작성 실패:', resp.status);
        
        // 401 오류 상세 정보
        if (resp.status === 401) {
          console.error('🔒 401 오류 상세:', {
            status: resp.status,
            statusText: resp.statusText,
            requestUrl: requestUrl,
            hasToken: !!token
          });
          
          // 응답 본문 확인
          try {
            const errorText = await resp.text();
            console.error('📝 오류 응답 본문:', errorText);
          } catch (e) {
            console.error('📝 응답 본문 읽기 실패:', e);
          }
          
          alert('인증이 필요합니다. 다시 로그인해주세요.');
        } else {
          alert('댓글 작성에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('💥 댓글 작성 오류:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    }
  };

  // 이미지 URL 변환 함수
  const transformImageUrl = (imageUrl: string): string => {
    console.log('🖼️ 원본 이미지 URL:', imageUrl);
    
    if (imageUrl.startsWith('/upload/')) {
      // /upload/파일명.png → /api/board/image/파일명.png
      const filename = imageUrl.replace('/upload/', '');
      const transformedUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'}/api/board/image/${filename}`;
      console.log('🖼️ 변환된 이미지 URL:', transformedUrl);
      return transformedUrl;
    } else if (!imageUrl.startsWith('http')) {
      // 상대 경로인 경우
      const transformedUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'}${imageUrl}`;
      console.log('🖼️ 상대 경로 변환된 URL:', transformedUrl);
      return transformedUrl;
    } else {
      // 이미 전체 URL인 경우
      console.log('🖼️ 전체 URL 그대로 사용:', imageUrl);
      return imageUrl;
    }
  };

  useEffect(() => {
    if (isOpen && columnId) {
      loadColumnDetail();
      loadCurrentUser();
    }
  }, [isOpen, columnId]);

  const loadColumnDetail = async () => {
    if (!columnId) return;
    
    setLoading(true);
    try {
      const token = getToken();
      const baseUrl = 'http://localhost:8080';
      
      console.log('상세 정보 로드 시작 - columnId:', columnId);
      console.log('토큰 상태:', token ? '있음' : '없음');
      console.log('토큰 값:', token ? token.substring(0, 20) + '...' : '없음');
      
      // 글 상세 정보 가져오기
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Authorization 헤더 추가됨');
      } else {
        console.log('토큰이 없어서 Authorization 헤더를 추가하지 않음');
      }

      // 실제 백엔드 API 호출
      console.log('백엔드 API 호출 시도 - columnId:', columnId);
      console.log('요청 헤더:', headers);
      
      // 다른 가능한 경로들을 시도
      const detailResponse = await fetch(`${baseUrl}/api/board/board/detail/${columnId}`, {
        method: 'GET',
        headers
      });

      console.log('API 응답 상태:', detailResponse.status);

      if (detailResponse.ok) {
        let data;
        try {
          const responseText = await detailResponse.text();
          console.log('API 응답 텍스트:', responseText);
          data = responseText ? JSON.parse(responseText) : {};
        } catch (jsonError) {
          console.error('JSON 파싱 오류:', jsonError);
          console.log('응답 상태:', detailResponse.status);
          console.log('응답 헤더:', detailResponse.headers);
          throw new Error('서버 응답을 파싱할 수 없습니다.');
        }
        console.log('글 상세 정보:', data);
        console.log('board_content:', data.board_content);
        console.log('content:', data.content);
        console.log('title:', data.title);
        console.log('board_title:', data.board_title);
        
        // 제목과 내용을 파싱
        let title, content;
        
        // 1. 먼저 직접 title 필드가 있는지 확인
        if (data.title || data.board_title) {
          title = data.title || data.board_title;
          content = data.board_content || data.content || '';
        } 
        // 2. board_content에서 [제목] 형식으로 파싱 시도
        else if (data.board_content && data.board_content.includes('[') && data.board_content.includes(']')) {
          const parsed = parseTitleAndContent(data.board_content);
          title = parsed.title;
          content = parsed.content;
        }
        // 3. content에서 [제목] 형식으로 파싱 시도
        else if (data.content && data.content.includes('[') && data.content.includes(']')) {
          const parsed = parseTitleAndContent(data.content);
          title = parsed.title;
          content = parsed.content;
        }
        // 4. 모든 방법이 실패하면 기본값 사용
        else {
          const fullContent = data.board_content || data.content || '';
          title = fullContent.length > 50 ? fullContent.substring(0, 50) + '...' : fullContent || '제목 없음';
          content = fullContent;
        }
        
        console.log('파싱된 제목:', title);
        console.log('파싱된 내용:', content);
        
        // 좋아요 상태 확인
        let isLiked = false;
        if (token) {
          const likeStatus = await fetchLikeStatus(columnId);
          if (likeStatus) {
            isLiked = likeStatus.isLiked || likeStatus.is_liked || false;
            console.log('💖 좋아요 상태 API에서 가져옴:', isLiked);
          } else {
            // 좋아요 상태 API 실패 시 전체목록에서 가져오기 (fallback)
            try {
              const listResponse = await fetch(`${baseUrl}/api/board/board/authenticated`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (listResponse.ok) {
                let listData;
                try {
                  const responseText = await listResponse.text();
                  listData = responseText ? JSON.parse(responseText) : [];
                } catch (jsonError) {
                  console.error('전체목록 JSON 파싱 오류:', jsonError);
                  listData = [];
                }
                const columnFromList = listData.find((item: any) => 
                  (item.board_id || item.id) === columnId
                );
                
                if (columnFromList) {
                  isLiked = columnFromList.is_liked || columnFromList.isLiked || false;
                  console.log('📋 전체목록에서 좋아요 상태 가져옴 (fallback):', isLiked);
                }
              }
            } catch (error) {
              console.log('전체목록에서 좋아요 상태 가져오기 실패:', error);
            }
          }
        }
        
        // 댓글 목록 가져오기 (기존 API로 복구)
        let commentList = [];
        try {
          console.log('🔍 댓글 목록 로드 시작 - columnId:', columnId);
          
          // 기존 댓글 API 사용 (복구)
          const commentsResponse = await fetch(`${baseUrl}/api/board/comment/${columnId}`, {
            method: 'GET'
            // 인증 헤더 제거 - 모든 사용자가 댓글을 볼 수 있음
          });
          console.log('📡 댓글 API 응답 상태:', commentsResponse.status);
          
          if (commentsResponse.ok) {
            let comments;
            try {
              const responseText = await commentsResponse.text();
              console.log('댓글 API 응답 텍스트:', responseText);
              comments = responseText ? JSON.parse(responseText) : [];
            } catch (jsonError) {
              console.error('댓글 JSON 파싱 오류:', jsonError);
              comments = [];
            }
            console.log('📝 댓글 목록 로드 성공:', comments);
            console.log('📝 댓글 개수:', comments.length);
            console.log('📝 댓글 데이터 구조:', comments[0] ? Object.keys(comments[0]) : '댓글 없음');
            console.log('📝 첫 번째 댓글 상세:', comments[0] || '댓글 없음');
            
            // 각 댓글에 대댓글 로드
            const commentsWithReplies = await Promise.all(
              comments.map(async (comment: any) => {
                if (comment.parent_id === null) { // 최상위 댓글만
                  try {
                    const repliesResponse = await fetch(`${baseUrl}/api/board/comment/replies/${comment.comment_id}`, {
                      method: 'GET'
                      // 인증 헤더 제거 - 모든 사용자가 대댓글을 볼 수 있음
                    });
                    if (repliesResponse.ok) {
                      let replies;
                      try {
                        const responseText = await repliesResponse.text();
                        replies = responseText ? JSON.parse(responseText) : [];
                      } catch (jsonError) {
                        console.error('대댓글 JSON 파싱 오류:', jsonError);
                        replies = [];
                      }
                      return { ...comment, replies };
                    }
                  } catch (error) {
                    console.error('대댓글 로드 실패:', error);
                  }
                }
                return comment;
              })
            );
            
            commentList = commentsWithReplies;
            console.log('🔄 댓글과 대댓글 로드 완료:', commentList);
            console.log('🔄 commentList 길이:', commentList.length);
          }
        } catch (error) {
          console.error('댓글 목록 로드 실패:', error);
        }
        
        // 최종 제목 검증 및 개선
        let finalTitle = title;
        if (!finalTitle || finalTitle === '제목 없음' || finalTitle.trim() === '') {
          // 제목이 없으면 내용의 첫 부분을 제목으로 사용
          const firstLine = content.split('\n')[0] || content;
          finalTitle = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
          if (!finalTitle || finalTitle.trim() === '') {
            finalTitle = `게시물 ${data.board_id || data.id || columnId}`;
          }
        }
        
        console.log('최종 제목:', finalTitle);
        
        const columnDetail: ColumnDetail = {
          id: data.board_id || data.id,
          title: finalTitle,
          author: data.username || data.author || '작성자',
          date: data.uploaded_at || data.date || '2024.03.21',
          views: data.view || data.views || 0,
          comments: data.comment_count || data.comments || 0,
          likes: data.like_count || data.likes || 0,
          content: content || '내용 없음',
          image_url: data.image_url ? transformImageUrl(data.image_url) : undefined,
          imageUrls: data.imageUrls ? (Array.isArray(data.imageUrls) ? data.imageUrls.join(',') : data.imageUrls).split(',').map(transformImageUrl).join(',') : undefined,
          isLiked: isLiked, // 임시 해결책으로 가져온 좋아요 상태 사용
          commentList: commentList // 댓글 목록 추가
        };
        
        console.log('🏗️ columnDetail 객체 생성 완료:', columnDetail);
        console.log('🏗️ commentList 포함 여부:', !!columnDetail.commentList);
        console.log('🏗️ commentList 길이:', columnDetail.commentList?.length || 0);
        
        setColumn(columnDetail);
      } else {
        console.error('글 상세 정보 가져오기 실패:', detailResponse.status);
        // 실패 시 임시 데이터로 설정
        const columnDetail: ColumnDetail = {
          id: columnId,
          title: `칼럼 제목 ${columnId} (API 실패)`,
          author: '작성자',
          date: '2024.03.21',
          views: 100 + (columnId * 10),
          comments: 5 + columnId,
          likes: 20 + (columnId * 5),
          content: `API 호출 실패 (${detailResponse.status}). 이것은 ${columnId}번째 칼럼의 임시 내용입니다.`
        };
        
        setColumn(columnDetail);
      }
    } catch (error) {
      console.error('글 상세 정보 로드 오류:', error);
      // 오류 시 기본 데이터로 설정
      setColumn({
        id: columnId!,
        title: '오류가 발생했습니다',
        author: '작성자',
        date: '2024.03.21',
        views: 0,
        comments: 0,
        likes: 0,
        content: '내용을 불러올 수 없습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className={`bg-white/95 rounded-lg w-full max-w-7xl h-[90vh] flex overflow-hidden transform transition-all duration-500 ease-in-out ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        {/* 왼쪽: 이미지 섹션 */}
        <div className="w-1/2 h-full bg-gray-100 rounded-l-lg overflow-hidden flex items-center justify-center"> {/* 가운데 정렬을 위한 flex 추가 */}
          {(column?.imageUrls || column?.image_url) ? (
            <div className="w-full h-full flex items-center justify-center">
              <ImageGallery imageUrl={column.imageUrls || column.image_url || ''} size="large" />
            </div>
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <div className="text-white text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg">이미지 없음</p>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 상세 섹션 */}
        <div className="w-1/2 flex flex-col"> {/* w-1/4에서 w-1/2로 변경 */}
          {/* 작성자/닫기/제목/통계 - 댓글 모달 상단과 유사 */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
                    {column?.author ? column.author[0] : '?'}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">{column?.author ?? '작성자'}</div>
                  <div className="text-sm text-gray-500">{column?.date ?? '날짜'}</div>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-700 transform transition-transform duration-300 hover:scale-110"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between mt-4 mb-2">
              <h1 className="text-xl font-semibold">{loading ? '불러오는 중...' : (column?.title ?? '제목')}</h1>
              <button
                onClick={handleReportBoard}
                className="text-gray-400 hover:text-red-500 transition-colors p-2"
                title="게시글 신고하기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button 
                  onClick={handleLikeToggle}
                  className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <svg 
                    className={`w-5 h-5 transition-all duration-200 ${
                      column?.isLiked ? 'fill-current text-red-500' : 'fill-none'
                    }`}
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                    />
                  </svg>
                </button>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {(() => {
                      const commentListLength = column?.commentList?.length || 0;
                      const backendComments = column?.comments || 0;
                      const finalCount = commentListLength || backendComments || 0;
                      
                      console.log('🔍 댓글 개수 디버깅:', {
                        commentListLength,
                        backendComments,
                        finalCount,
                        hasCommentList: !!column?.commentList,
                        commentListType: typeof column?.commentList
                      });
                      
                      return finalCount;
                    })()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium">{column?.views?.toLocaleString?.() ?? 0}</span>
                </div>
              </div>
              
              {/* 신고하기 버튼 */}
              <button 
                onClick={handleReportBoard}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>신고</span>
              </button>
            </div>
          </div>

          {/* 본문 (고정 높이) */}
          <div className="p-4 border-b border-gray-200">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {column?.content ?? ''}
              </div>
            )}
          </div>

          {/* 댓글 섹션 (별도 스크롤) */}
          <div className="flex-1 overflow-y-auto border-t border-gray-200">
            <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">댓글</h3>
            
            {/* 댓글 입력 폼 */}
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="댓글을 입력하세요..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={commentInput || ''}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCommentSubmit();
                    }
                  }}
                />
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  onClick={handleCommentSubmit}
                >
                  작성
                </button>
              </div>
            </div>
            
            {/* 댓글 목록 */}
            {column?.commentList && column.commentList.length > 0 ? (
              <div className="space-y-4">
                {column.commentList.map((comment) => (
                  <div key={comment.comment_id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0">
                        <div className="w-full h-full flex items-center justify-center text-sm text-gray-600">
                          {comment.username.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold text-gray-900">{comment.username}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {/* 액션 메뉴 버튼 */}
                          {!editingCommentId && (
                            <div className="relative action-menu">
                              <button
                                onClick={() => setOpenCommentActionMenu(openCommentActionMenu === comment.comment_id ? null : comment.comment_id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                              
                              {/* 액션 메뉴 드롭다운 */}
                              {openCommentActionMenu === comment.comment_id && (
                                <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                  {/* 작성자에게만 수정/삭제 표시 */}
                                  {currentUser && currentUser.id === comment.user_id && (
                                    <>
                                      <button
                                        onClick={() => {
                                          handleCommentEditStart(comment);
                                          setOpenCommentActionMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                      >
                                        수정
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleCommentDelete(comment.comment_id);
                                          setOpenCommentActionMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                      >
                                        삭제
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* 모든 사용자에게 신고하기 표시 */}
                                  <button
                                    onClick={() => {
                                      handleReportComment(comment.comment_id, comment.comment_content, comment.user_id);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                                  >
                                    신고하기
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                                                {/* 댓글 내용 (수정 모드 또는 일반 모드) */}
                        {editingCommentId === comment.comment_id ? (
                          <div className="mb-3">
                            <input
                              type="text"
                              value={editCommentContent}
                              onChange={(e) => setEditCommentContent(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="댓글을 입력하세요..."
                            />
                            <div className="flex items-center space-x-2 mt-2">
                              <button
                                onClick={() => handleCommentEdit(comment.comment_id)}
                                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                              >
                                저장
                              </button>
                              <button
                                onClick={handleCommentEditCancel}
                                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 mb-3">{comment.comment_content}</p>
                        )}
                        
                        {/* 대댓글 작성 버튼 */}
                        {!editingCommentId && (
                          <div className="mb-3">
                            <button
                              onClick={() => handleReplyStart(comment.comment_id)}
                              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                            >
                              💬 답글 작성
                            </button>
                          </div>
                        )}
                        
                        {/* 대댓글 작성 입력창 */}
                        {replyingToCommentId === comment.comment_id && (
                          <div className="mb-3 ml-6 border-l-2 border-blue-200 pl-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                placeholder="대댓글을 입력하세요..."
                                value={replyInput}
                                onChange={(e) => setReplyInput(e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleReplySubmit(comment.comment_id);
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleReplySubmit(comment.comment_id)}
                                className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                              >
                                작성
                              </button>
                              <button
                                onClick={handleReplyCancel}
                                className="px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* 답글 토글 버튼 */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-2">
                            <button
                              onClick={() => toggleReplies(comment.comment_id)}
                              className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
                            >
                              <span>
                                {expandedReplies.has(comment.comment_id) ? '답글 숨기기' : `답글 ${comment.replies.length}개 보기`}
                              </span>
                              <svg 
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  expandedReplies.has(comment.comment_id) ? 'rotate-180' : ''
                                }`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        )}

                        {/* 대댓글 표시 (토글 가능) */}
                        {comment.replies && comment.replies.length > 0 && expandedReplies.has(comment.comment_id) && (
                          <div className="ml-6 space-y-3 border-l-2 border-blue-200 pl-4 mt-3">
                            {comment.replies.map((reply: any) => (
                              <div key={reply.comment_id} className="bg-white rounded p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm font-semibold text-gray-900">{reply.username}</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(reply.uploaded_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  
                                  {/* 대댓글 액션 메뉴 버튼 */}
                                  <div className="relative action-menu">
                                    <button
                                      onClick={() => setOpenCommentActionMenu(openCommentActionMenu === reply.comment_id ? null : reply.comment_id)}
                                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                      </svg>
                                    </button>
                                    
                                    {/* 대댓글 액션 메뉴 드롭다운 */}
                                    {openCommentActionMenu === reply.comment_id && (
                                      <div className="absolute right-0 top-6 w-28 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                        {/* 작성자에게만 수정/삭제 표시 */}
                                        {currentUser && currentUser.id === reply.user_id && (
                                          <>
                                            <button
                                              onClick={() => {
                                                handleCommentEditStart(reply);
                                                setOpenCommentActionMenu(null);
                                              }}
                                              className="w-full text-left px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                                            >
                                              수정
                                            </button>
                                            <button
                                              onClick={() => {
                                                handleReplyDelete(reply.comment_id);
                                                setOpenCommentActionMenu(null);
                                              }}
                                              className="w-full text-left px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                              삭제
                                            </button>
                                          </>
                                        )}
                                        
                                        {/* 모든 사용자에게 신고하기 표시 */}
                                        <button
                                          onClick={() => {
                                            handleReportComment(reply.comment_id, reply.comment_content, reply.user_id);
                                          }}
                                          className="w-full text-left px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 transition-colors"
                                        >
                                          신고하기
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* 대댓글 내용 (수정 모드 또는 일반 모드) */}
                                {editingCommentId === reply.comment_id ? (
                                  <div className="mb-2">
                                    <input
                                      type="text"
                                      value={editCommentContent}
                                      onChange={(e) => setEditCommentContent(e.target.value)}
                                      className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="대댓글을 입력하세요..."
                                    />
                                    <div className="flex items-center space-x-2 mt-2">
                                      <button
                                        onClick={() => handleReplyEdit(reply.comment_id)}
                                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                      >
                                        저장
                                      </button>
                                      <button
                                        onClick={handleCommentEditCancel}
                                        className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-700">{reply.comment_content}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>아직 댓글이 없습니다.</p>
                <p className="text-sm">첫 번째 댓글을 작성해보세요!</p>
              </div>
            )}
            </div>
          </div>

          {/* 하단 액션 (선택) */}
          <div className="border-t border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-blue-600 transition-colors">공유</button>
            </div>
            <button className="text-gray-600 hover:text-blue-600 transition-colors">북마크</button>
          </div>
        </div>
      </div>

      {/* 신고 모달 */}
      {showReportModal && selectedTargetForReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedTargetForReport.type === 'board' ? '게시글 신고' : '댓글 신고'}
              </h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedTargetForReport(null);
                  setSelectedReportReason('');
                  setReportAdditionalComment('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedTargetForReport.type === 'board' ? '신고할 게시글' : '신고할 댓글'}
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedTargetForReport.type === 'board' 
                    ? selectedTargetForReport.title 
                    : selectedTargetForReport.content}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">신고 사유</label>
                <div className="space-y-2">
                  {[
                    '욕설/비방성 댓글',
                    '스팸/광고성 댓글',
                    '욕설/비방성 게시물',
                    '부적절한 게시물',
                    '기타'
                  ].map((reason, index) => (
                    <label key={index} className="flex items-center">
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason}
                        checked={selectedReportReason === reason}
                        onChange={(e) => setSelectedReportReason(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">추가 설명 (선택사항)</label>
                <textarea
                  value={reportAdditionalComment}
                  onChange={(e) => setReportAdditionalComment(e.target.value)}
                  placeholder="신고 사유에 대한 추가 설명을 입력해주세요..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setSelectedTargetForReport(null);
                    setSelectedReportReason('');
                    setReportAdditionalComment('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleReportSubmit}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  신고하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



