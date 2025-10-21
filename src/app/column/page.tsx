"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import CommentModal from "@/components/CommentModal";
import ColumnWriteModal from './ColumnWriteModal';
import ColumnEditModal, { ColumnEditData } from './ColumnEditModal';
import ColumnDetailModal from './ColumnDetailModal';
import { getToken, removeToken } from '@/utils/token';
import { parseTitleAndContent } from '@/utils/articleStorage';
import ImageGallery from '@/components/ImageGallery'; // 이미지 갤러리 컴포넌트 추가

interface Column {
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
  imageIds?: string; // 이미지 ID들을 위한 필드 추가
  user_id?: number; // 사용자 ID 필드 추가
  isLiked?: boolean; // 좋아요 상태 추가
  commentInput?: string; // 댓글 입력 필드 상태
  commentList?: Comment[]; // 댓글 목록 추가
}

// 댓글 인터페이스 추가
interface Comment {
  comment_id: number;
  user_id: number;
  board_id: number;
  comment_content: string;
  parent_id: number | null;
  uploaded_at: string;
  username: string;
  user_profile_image?: string;
  replies?: Comment[]; // 대댓글 목록
}

// Mock data for columns with fixed values
const mockColumns: Column[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  title: `칼럼 제목 ${i + 1}`,
  author: `작성자 ${i + 1}`,
  date: '2024.03.21',
  views: 100 + (i * 50),
  comments: 10 + (i * 2),
  likes: 20 + (i * 5),
  content: '칼럼 내용이 여기에 들어갑니다. 칼럼 내용이 여기에 들어갑니다. 칼럼 내용이 여기에 들어갑니다. 칼럼 내용이 여기에 들어갑니다. 칼럼 내용이 여기에 들어갑니다. 칼럼 내용이 여기에 들어갑니다. 칼럼 내용이 여기에 들어갑니다. 칼럼 내용이 여기에 들어갑니다. 칼럼 내용이 여기에 들어갑니다. 칼럼 내용이 여기에 들어갑니다.'
}));

export default function Column() {
  // 인기 칼럼 슬라이더 상태
  const [currentSliderPage, setCurrentSliderPage] = useState(0);
  const sliderItemsPerPage = 3;

  // 전체 칼럼 무한 스크롤 상태
  const [displayedItemsCount, setDisplayedItemsCount] = useState(20);
  const itemsPerLoad = 20;

  // 더보기 상태 관리
  const [expandedColumns, setExpandedColumns] = useState<number[]>([]);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedColumnForReport, setSelectedColumnForReport] = useState<Column | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [reportAdditionalComment, setReportAdditionalComment] = useState('');
  const [editTarget, setEditTarget] = useState<ColumnEditData | null>(null);
  
  // 글쓰기 모달 상태
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [columns, setColumns] = useState(mockColumns);
  
  // columns 상태가 선언된 후에 hasMore 계산
  const hasMore = displayedItemsCount < columns.length;

  // 댓글 개수 계산 함수 (백엔드 필드 우선 사용)
  const calculateCommentCount = (item: any): number => {
    console.log('🔍 댓글 개수 계산 - 전체 item:', item);
    console.log('🔍 댓글 개수 계산 - 댓글 관련 필드들:', {
      itemId: item.board_id || item.id,
      comment_count: item.comment_count,
      comments: item.comments,
      commentCount: item.commentCount,
      comment_list: item.comment_list,
      commentList: item.commentList,
      allKeys: Object.keys(item)
    });
    
    // 1. 백엔드에서 제공하는 카운트 필드 사용 (다양한 필드명 확인)
    if (item.comment_count !== undefined && item.comment_count !== null) {
      console.log('✅ comment_count 사용:', item.comment_count);
      return Number(item.comment_count);
    }
    if (item.comments !== undefined && item.comments !== null) {
      console.log('✅ comments 사용:', item.comments);
      return Number(item.comments);
    }
    if (item.commentCount !== undefined && item.commentCount !== null) {
      console.log('✅ commentCount 사용:', item.commentCount);
      return Number(item.commentCount);
    }
    if (item.comment_list !== undefined && item.comment_list !== null) {
      console.log('✅ comment_list 사용:', item.comment_list);
      return Number(item.comment_list);
    }
    
    // 2. commentList가 있으면 실제 길이 사용
    if (item.commentList && Array.isArray(item.commentList)) {
      const count = item.commentList.length;
      console.log('✅ commentList 길이 사용:', count);
      return count;
    }
    
    // 3. 기본값 0
    console.log('❌ 기본값 0 사용 - 댓글 관련 필드를 찾을 수 없음');
    return 0;
  };

  // 댓글 개수를 백엔드에서 가져오는 함수
  const fetchCommentCount = async (boardId: number): Promise<number> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/board/comment/${boardId}`);
      
      console.log(`🔍 ${boardId}번 게시물 댓글 API 호출:`, response.status);
      
      if (response.ok) {
        const comments = await response.json();
        console.log(`📝 ${boardId}번 게시물 댓글 응답:`, comments);
        
        // 댓글 개수 계산 (대댓글 포함)
        let totalCount = 0;
        if (Array.isArray(comments)) {
          totalCount = comments.length;
          
          // 대댓글 개수도 계산
          for (const comment of comments) {
            if (comment.replies && Array.isArray(comment.replies)) {
              totalCount += comment.replies.length;
            }
          }
        }
        
        console.log(`📊 ${boardId}번 게시물 총 댓글 개수: ${totalCount}`);
        return totalCount;
      } else {
        console.log(`❌ ${boardId}번 게시물 댓글 API 실패:`, response.status);
        return 0;
      }
    } catch (error) {
      console.log(`💥 ${boardId}번 게시물 댓글 API 오류:`, error);
      return 0;
    }
  };

  // 서버 아이템을 화면 모델로 변환
  const mapServerItemToColumn = (item: any): Column => {
    const title = item.board_title || '';
    const content = item.board_content || item.content || '';
    
    // 디버깅: 백엔드 응답 구조 확인
    console.log('🔍 게시물 데이터 분석:');
    console.log('- 전체 item:', item);
    console.log('- board_title:', item.board_title);
    console.log('- board_content:', item.board_content);
    console.log('- content:', item.content);
    console.log('- 최종 title:', title);
    console.log('- 최종 content:', content);
    console.log('이미지 URL (image_path):', item.image_path);
    console.log('이미지 URL (attachment_url):', item.attachment_url);
    
    // 가능한 모든 이미지 필드명 시도
    const imageUrl = item.image_url || item.imageUrl || item.image_path || item.attachment_url || item.file_url;
    
    // 백엔드 이미지 API 엔드포인트로 URL 변환
    let fullImageUrl = null;
    let multipleImageUrls = null;
    
    if (imageUrl) {
      if (imageUrl.startsWith('/upload/')) {
        // /upload/파일명.png → /api/board/image/파일명.png
        const filename = imageUrl.replace('/upload/', '');
        fullImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'}/api/board/image/${filename}`;
      } else if (!imageUrl.startsWith('http')) {
        // 상대 경로인 경우
        fullImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'}${imageUrl}`;
      } else {
        // 이미 전체 URL인 경우
        fullImageUrl = imageUrl;
      }
    }
    
    // imageUrls 필드 처리 (여러 이미지) - 백엔드 요청에 따라 우선 사용
    if (item.imageUrls) {
      console.log('백엔드에서 imageUrls 필드 발견:', item.imageUrls);
      console.log('imageUrls 타입:', typeof item.imageUrls);
      
      // imageUrls 배열을 우선 사용하되, URL 변환 필요
      if (typeof item.imageUrls === 'string') {
        // 쉼표로 구분된 문자열인 경우
        const urls = item.imageUrls.split(',').map((url: string) => {
          const trimmedUrl = url.trim();
          console.log('처리 중인 URL:', trimmedUrl);
          
          if (trimmedUrl.startsWith('/upload/')) {
            // /upload/파일명.png → /api/board/image/파일명.png
            const filename = trimmedUrl.replace('/upload/', '');
            const transformedUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'}/api/board/image/${filename}`;
            console.log('URL 변환:', trimmedUrl, '→', transformedUrl);
            return transformedUrl;
          } else if (!trimmedUrl.startsWith('http')) {
            // 상대 경로인 경우
            const transformedUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'}${trimmedUrl}`;
            console.log('상대 경로 변환:', trimmedUrl, '→', transformedUrl);
            return transformedUrl;
          } else {
            // 이미 전체 URL인 경우
            console.log('전체 URL 유지:', trimmedUrl);
            return trimmedUrl;
          }
        });
        multipleImageUrls = urls.join(',');
        console.log('최종 변환된 multipleImageUrls:', multipleImageUrls);
      } else if (Array.isArray(item.imageUrls)) {
        // 이미 배열인 경우
        console.log('imageUrls가 이미 배열입니다:', item.imageUrls);
        multipleImageUrls = item.imageUrls.map((url: string) => {
          if (url.startsWith('/upload/')) {
            const filename = url.replace('/upload/', '');
            return `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'}/api/board/image/${filename}`;
          }
          return url;
        }).join(',');
      }
    } else {
      console.log('백엔드에 imageUrls 필드가 없음');
    }
    
    // imageUrls가 없으면 image_url을 fallback으로 사용
    if (!multipleImageUrls && imageUrl) {
      console.log('image_url을 fallback으로 사용:', imageUrl);
      multipleImageUrls = imageUrl;
    }
    
    // 디버깅: URL 변환 과정 확인
    console.log('원본 imageUrl:', imageUrl);
    console.log('원본 imageUrls:', item.imageUrls);
    console.log('최종 multipleImageUrls:', multipleImageUrls);
    console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
    
    // 디버깅: 좋아요 수 매핑 과정 확인
    console.log('🔍 좋아요 수 매핑 디버깅:', {
      itemId: item.board_id || item.id,
      like_count: item.like_count,
      likes: item.likes,
      likeCount: item.likeCount,
      finalLikes: Number(item.like_count || item.likes || 0)
    });
    
    return {
      id: item.board_id || item.id || 0,
      title: title || '제목 없음',
      author: item.username || item.author || '익명',
      date: item.uploaded_at || item.date || new Date().toISOString(),
      views: Number(item.view || item.views || 0),
      comments: 0, // 초기값 0으로 설정, 나중에 fetchCommentCount로 업데이트
      likes: Number(item.like_count || item.likes || 0),
      content: content || '내용 없음',
      image_url: fullImageUrl || undefined,
      imageUrls: multipleImageUrls || undefined, // 여러 이미지를 위한 필드
      imageIds: item.imageIds || item.image_ids || undefined, // 이미지 ID들을 위한 필드
      user_id: item.user_id || item.userId, // 사용자 ID 필드
      isLiked: Boolean(item.is_liked || item.isLiked || false) // 좋아요 상태 필드
    };
  };

  const toggleExpand = (columnId: number) => {
    setExpandedColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  // 외부 클릭 시 액션 메뉴 닫기 (메뉴/버튼 내부 클릭은 유지)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (openActionMenuId == null) return;
      const root = document.querySelector(`[data-action-root="${openActionMenuId}"]`) as HTMLElement | null;
      if (root && e.target instanceof Node && root.contains(e.target)) return;
      setOpenActionMenuId(null);
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenActionMenuId(null); };
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [openActionMenuId]);

  const toggleActionMenu = (e: React.MouseEvent, columnId: number) => {
    e.stopPropagation();
    setOpenActionMenuId(prev => (prev === columnId ? null : columnId));
  };

  const handleEditColumn = (e: React.MouseEvent, column: Column) => {
    e.stopPropagation();
    setOpenActionMenuId(null);
    
    // 작성자 확인
    if (!currentUserId || column.user_id !== currentUserId) {
      alert('작성자만 수정할 수 있습니다.');
      return;
    }
    
    // Column 객체의 필드 사용 (board_content, board_title은 API 응답에만 있음)
    setEditTarget({ 
      id: column.id, 
      content: column.content,
      title: column.title,
      imageUrls: column.imageUrls,
      image_url: column.image_url
    });
  };

  const handleDeleteColumn = async (e: React.MouseEvent, columnId: number) => {
    e.stopPropagation();
    setOpenActionMenuId(null);
    
    // 삭제할 컬럼 정보 확인
    const columnToDelete = columns.find(c => c.id === columnId);
    
    // 작성자 확인
    if (!columnToDelete || !currentUserId || columnToDelete.user_id !== currentUserId) {
      alert('작성자만 삭제할 수 있습니다.');
      return;
    }
    
    // 삭제 확인
    if (!confirm('정말 이 칼럼을 삭제하시겠습니까?')) {
      return;
    }
    
    console.log('삭제할 컬럼 정보:', {
      id: columnToDelete.id,
      title: columnToDelete.title,
      imageUrls: columnToDelete.imageUrls,
      image_url: columnToDelete.image_url
    });
    
    // 이미지가 포함된 컬럼인지 확인
    if (columnToDelete.imageUrls || columnToDelete.image_url) {
      console.log('⚠️ 이미지가 포함된 컬럼 삭제 - 백엔드에서 이미지 파일은 삭제되지 않을 수 있습니다');
    }
    
    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const resp = await fetch(`${baseUrl}/api/board/board/delete/${columnId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (resp.status === 204 || resp.status === 200) {
        // 컬럼 삭제
        setColumns(prev => prev.filter(c => c.id !== columnId));
        
        // 삭제 성공 로그
        console.log(`✅ 컬럼 ID ${columnId} 삭제 완료`);
        
        // 삭제된 컬럼이 현재 선택된 컬럼인 경우 상태 정리
        if (selectedColumnId === columnId) {
          setSelectedColumnId(null);
          setIsDetailModalOpen(false);
          console.log('삭제된 컬럼이 선택된 상태였으므로 선택 상태 정리');
        }
        
        // 삭제된 컬럼이 수정 대상인 경우 상태 정리
        if (editTarget && editTarget.id === columnId) {
          setEditTarget(null);
          console.log('삭제된 컬럼이 수정 대상이었으므로 수정 상태 정리');
        }
        
        // 삭제된 컬럼이 댓글 모달 대상인 경우 상태 정리
        if (isCommentModalOpen && selectedColumnId === columnId) {
          setIsCommentModalOpen(false);
          setSelectedColumnId(null);
          console.log('삭제된 컬럼이 댓글 모달 대상이었으므로 댓글 상태 정리');
        }
        
        // 강제 리렌더링으로 화면 갱신
        setForceRefresh(prev => prev + 1);
        console.log('삭제 후 강제 리렌더링 완료');
        
      } else if (resp.status === 403) {
        alert('작성자만 삭제할 수 있습니다.');
      } else if (resp.status === 401) {
        alert('로그인이 필요합니다. 다시 로그인해주세요.');
      } else if (resp.status === 404) {
        alert('게시글을 찾을 수 없습니다.');
      } else {
        const text = await resp.text().catch(() => '');
        console.error('삭제 실패:', resp.status, text);
        alert('삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('삭제 오류:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 신고하기 함수
  const handleReportColumn = async (e: React.MouseEvent, columnId: number) => {
    e.stopPropagation();
    setOpenActionMenuId(null);
    
    // 신고할 컬럼 정보 확인
    const columnToReport = columns.find(c => c.id === columnId);
    if (!columnToReport) {
      alert('게시글을 찾을 수 없습니다.');
      return;
    }
    
    // 신고 모달 열기
    setSelectedColumnForReport(columnToReport);
    setShowReportModal(true);
  };

  // 신고 제출 함수
  const handleReportSubmit = async () => {
    if (!selectedColumnForReport) return;
    
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
        columnId: selectedColumnForReport.id,
        title: selectedColumnForReport.title,
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
          reported_user_id: selectedColumnForReport.user_id, // 게시글 작성자 ID
          report_reason: selectedReportReason,
          report_content: reportAdditionalComment || '',
          target_type: 'board',
          target_id: selectedColumnForReport.id,
          target_title: selectedColumnForReport.title, // 게시글 제목
          target_content: selectedColumnForReport.content // 게시글 내용 (일부)
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
          setSelectedColumnForReport(null);
          setSelectedReportReason('');
          setReportAdditionalComment('');
        } catch (jsonError) {
          console.log('JSON 파싱 오류 (하지만 신고는 성공):', jsonError);
          // JSON 파싱 오류가 있어도 신고는 성공했을 수 있음
          alert('신고가 접수되었습니다. 검토 후 처리하겠습니다.');
          
          // 모달 닫기 및 상태 초기화
          setShowReportModal(false);
          setSelectedColumnForReport(null);
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

  // 좋아요 토글 함수
  const handleLikeToggle = async (columnId: number) => {
    try {
      const token = getToken();
      console.log('🔍 좋아요 토글 디버깅:', {
        columnId,
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : '없음',
        tokenType: token ? (token.startsWith('Bearer ') ? 'Bearer 포함' : 'Bearer 없음') : '토큰 없음'
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

      // 토큰 형식 확인
      const authHeader = `Bearer ${token}`;
      console.log('🔑 Authorization 헤더:', {
        fullHeader: authHeader,
        headerLength: authHeader.length,
        startsWithBearer: authHeader.startsWith('Bearer ')
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const requestUrl = `${baseUrl}/api/board/board/${columnId}/like`;
      
      // 백엔드 API 테스트를 위한 대안 URL들
      const alternativeUrls = [
        `${baseUrl}/api/board/board/${columnId}/like`,
        `${baseUrl}/api/board/like/${columnId}`,
        `${baseUrl}/api/like/board/${columnId}`
      ];
      
      console.log('🔄 대안 API URL들:', alternativeUrls);
      
      console.log('🌐 API 요청 정보:', {
        url: requestUrl,
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        fullHeaders: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      const resp = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 응답 상태:', resp.status, resp.statusText);
      console.log('📡 응답 헤더:', Object.fromEntries(resp.headers.entries()));
      
      if (resp.ok) {
        const data = await resp.json();
        console.log('📊 백엔드 응답 데이터:', data);
        console.log('🔍 응답 데이터 구조:', {
          hasData: !!data,
          dataKeys: Object.keys(data),
          isLiked: data.isLiked,
          likeCount: data.likeCount,
          like_count: data.like_count,
          likes: data.likes
        });
        
        const newIsLiked = data.isLiked;
        const newCount = data.likeCount || 0;
        
        console.log('🎯 파싱된 값:', {
          newIsLiked,
          newCount,
          originalLikeCount: data.likeCount,
          originalLike_count: data.like_count,
          originalLikes: data.likes
        });

        // 컬럼 상태 업데이트
        setColumns(prev => prev.map(col => {
          if (col.id === columnId) {
            const updatedColumn = {
              ...col,
              isLiked: newIsLiked,
              likes: newCount
            };
            console.log('🔄 컬럼 상태 업데이트:', {
              columnId,
              before: { isLiked: col.isLiked, likes: col.likes },
              after: { isLiked: updatedColumn.isLiked, likes: updatedColumn.likes }
            });
            
            // 로컬스토리지에 좋아요 상태 저장 (임시 해결책)
            if (typeof window !== 'undefined') {
              const likeKey = `like_${columnId}`;
              localStorage.setItem(likeKey, JSON.stringify({
                isLiked: newIsLiked,
                count: newCount,
                timestamp: Date.now()
              }));
              console.log('💾 로컬스토리지에 좋아요 상태 저장:', likeKey, { isLiked: newIsLiked, count: newCount });
            }
            
            return updatedColumn;
          }
          return col;
        }));

        // 강제 리렌더링으로 memoizedColumns 즉시 업데이트
        setForceRefresh(prev => prev + 1);

        console.log('✅ 좋아요 토글 성공:', { columnId, isLiked: newIsLiked, count: newCount });
      } else {
        console.error('❌ 좋아요 토글 실패:', resp.status);
        
        // 401 오류 상세 정보
        if (resp.status === 401) {
          console.error('🔒 401 오류 상세:', {
            status: resp.status,
            statusText: resp.statusText,
            headers: Object.fromEntries(resp.headers.entries()),
            requestUrl: requestUrl,
            authHeader: authHeader
          });
          
          // 응답 본문 확인
          try {
            const errorText = await resp.text();
            console.error('📝 오류 응답 본문:', errorText);
          } catch (e) {
            console.error('📝 응답 본문 읽기 실패:', e);
          }
          
          console.log('🚨 백엔드 인증 문제 감지 - 임시로 프론트엔드에서만 처리');
          
          // 임시로 프론트엔드에서만 좋아요 상태 변경
          const currentColumn = columns.find(c => c.id === columnId);
          if (!currentColumn) return;
          
          const newIsLiked = !currentColumn.isLiked;
          const newCount = newIsLiked ? currentColumn.likes + 1 : currentColumn.likes - 1;
          
          // 로컬 상태 업데이트
          setColumns(prevColumns => 
            prevColumns.map(col => 
              col.id === columnId 
                ? { ...col, isLiked: newIsLiked, likes: newCount }
                : col
            )
          );
          
          console.log('✅ 임시 처리 완료:', { columnId, isLiked: newIsLiked, count: newCount });
          alert('백엔드 인증 문제로 임시 처리되었습니다.\n페이지 새로고침 시 원래 상태로 돌아갑니다.');
        } else {
          // 400 오류 상세 정보 확인
          try {
            const errorText = await resp.text();
            console.error('📝 400 오류 응답 본문:', errorText);
            alert(`좋아요 처리에 실패했습니다: ${errorText}`);
          } catch (e) {
            console.error('📝 응답 본문 읽기 실패:', e);
            alert('좋아요 처리에 실패했습니다.');
          }
        }
      }
    } catch (error) {
      console.error('💥 좋아요 토글 오류:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // 인기 칼럼 슬라이더 함수
  const getTotalSliderPages = () => {
    const sortedByViewsDesc = [...memoizedColumns].sort((a, b) => (b.views || 0) - (a.views || 0));
    const topTen = sortedByViewsDesc.slice(0, 10);
    return Math.ceil(topTen.length / sliderItemsPerPage) || 1;
  };

  const nextSliderPage = () => {
    const pages = getTotalSliderPages();
    setCurrentSliderPage((prev) => (prev + 1) % pages);
  };

  const prevSliderPage = () => {
    const pages = getTotalSliderPages();
    setCurrentSliderPage((prev) => (prev - 1 + pages) % pages);
  };

  const getVisibleTopColumns = () => {
    const sortedByViewsDesc = [...memoizedColumns].sort((a, b) => (b.views || 0) - (a.views || 0));
    const topTen = sortedByViewsDesc.slice(0, 10);
    const startIndex = currentSliderPage * sliderItemsPerPage;
    const endIndex = startIndex + sliderItemsPerPage;
    return topTen.slice(startIndex, endIndex);
  };

  // 전체 칼럼 무한 스크롤 함수
  const getVisibleColumns = () => {
    return memoizedColumns.slice(0, displayedItemsCount);
  };

  const handleLoadMore = () => {
    setDisplayedItemsCount(prev => prev + itemsPerLoad);
  };

  const handleColumnClick = (columnId: number) => {
    console.log('글 클릭됨 - columnId:', columnId);
    setSelectedColumnId(columnId);
    setIsDetailModalOpen(true);
    // 상세에서 조회수가 증가하므로 UX를 위해 낙관적 증가
    setColumns(prev => prev.map(c => c.id === columnId ? { ...c, views: (c.views || 0) + 1 } : c));
    
    // 댓글 목록 자동 로드
    // loadComments(columnId); // 상세페이지로 이동
  };

  const handleAddColumn = async (newColumn: Column) => {
    console.log('📝 새 칼럼 추가 시작:', newColumn);
    console.log('새 칼럼 이미지 정보:', newColumn.imageUrls);
    
    // 글 작성 후 서버에서 최신 목록을 다시 가져오기
    try {
      const token = getToken();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      let apiUrl = `${baseUrl}/api/board/board`;
      
      // 로그인한 사용자는 좋아요 상태가 포함된 API 호출
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        apiUrl = `${baseUrl}/api/board/board/authenticated`;
        console.log('🔐 글 작성 후: 좋아요 상태 포함 API 호출');
      } else {
        console.log('👤 글 작성 후: 기본 API 호출');
      }
      
      console.log('API 호출 URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('글 작성 후 최신 목록:', data);
        console.log('서버 응답 데이터 개수:', data.length);
        
        const serverColumns: Column[] = data.map(mapServerItemToColumn);
        console.log('변환된 칼럼 개수:', serverColumns.length);
        
        // 새로 추가된 칼럼의 이미지 정보 확인
        const latestColumn = serverColumns[0];
        if (latestColumn) {
          console.log('최신 칼럼 이미지 정보:', {
            id: latestColumn.id,
            imageUrls: latestColumn.imageUrls,
            image_url: latestColumn.image_url
          });
        }
        
        setColumns(serverColumns);
        console.log('칼럼 목록 업데이트 완료');
      } else {
        console.error('글 작성 후 목록 새로고침 실패:', response.status);
        // 실패 시 기존 방식으로 추가
        console.log('기존 방식으로 칼럼 추가:', newColumn);
        setColumns(prev => [newColumn, ...prev]);
      }
    } catch (error) {
      console.error('글 작성 후 목록 새로고침 오류:', error);
      // 오류 시 기존 방식으로 추가
      console.log('오류로 인한 기존 방식 칼럼 추가:', newColumn);
      setColumns(prev => [newColumn, ...prev]);
    }
  };

  // 클라이언트 사이드에서만 실행되도록 useEffect 사용
  const [mounted, setMounted] = useState(false);
  
  // URL 파라미터 확인하여 특정 게시물 모달 열기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const openModalId = urlParams.get('openModal');
      if (openModalId) {
        const columnId = parseInt(openModalId);
        if (!isNaN(columnId)) {
          // 해당 게시물 모달 열기
          setSelectedColumnId(columnId);
          setIsDetailModalOpen(true);
        }
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // 로그인 상태 확인
    const token = getToken();
    setIsLoggedIn(!!token);
    // 현재 사용자 정보 로드 (user_id 확인)
    const loadMe = async () => {
      if (!token) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${apiUrl}/api/user`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user_id) setCurrentUserId(data.user_id);
          else if (data.id) setCurrentUserId(data.id);
        }
      } catch (e) {
        console.error('내 정보 로드 실패', e);
      }
    };
    loadMe();
    
    // 백엔드에서 글 목록 가져오기
    const fetchColumns = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        let apiUrl = `${baseUrl}/api/board/board`;
        
        // 로그인한 사용자는 좋아요 상태가 포함된 API 호출
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          apiUrl = `${baseUrl}/api/board/board/authenticated`;
          console.log('🔐 로그인 사용자: 좋아요 상태 포함 API 호출');
        } else {
          console.log('👤 비로그인 사용자: 기본 API 호출');
        }
        
        console.log('🌐 API 호출:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('서버에서 받은 글 목록:', data);
          
          // 응답 데이터 구조 확인
          if (data.length > 0) {
            const firstItem = data[0];
            console.log('🔍 첫 번째 아이템 구조:', {
              hasIsLiked: 'isLiked' in firstItem,
              hasLikeCount: 'likeCount' in firstItem,
              hasLike_count: 'like_count' in firstItem,
              hasCommentList: 'commentList' in firstItem,
              hasCommentCount: 'comment_count' in firstItem,
              hasComments: 'comments' in firstItem,
              keys: Object.keys(firstItem)
            });
            
            // 댓글 관련 필드 상세 확인
            console.log('🔍 댓글 관련 필드 상세:', {
              commentList: firstItem.commentList,
              comment_count: firstItem.comment_count,
              comments: firstItem.comments,
              commentCount: firstItem.commentCount
            });
          }
          
          const serverColumns: Column[] = data.map(mapServerItemToColumn);
          
          // 각 게시글의 댓글 개수를 가져와서 업데이트
          const columnsWithCommentCounts = await Promise.all(
            serverColumns.map(async (column) => {
              try {
                const commentCount = await fetchCommentCount(column.id);
                console.log(`✅ ${column.id}번 게시물 댓글 개수: ${commentCount}`);
                return {
                  ...column,
                  comments: commentCount
                };
              } catch (error) {
                console.log(`❌ ${column.id}번 게시물 댓글 개수 가져오기 실패, 기본값 0 사용`);
                return {
                  ...column,
                  comments: 0
                };
              }
            })
          );
          
          setColumns(columnsWithCommentCounts);
        } else {
          console.error('글 목록 가져오기 실패:', response.status);
          // 실패 시 기존 mock 데이터 사용
          setColumns(mockColumns);
        }
      } catch (error) {
        console.error('글 목록 가져오기 오류:', error);
        // 오류 시 기존 mock 데이터 사용
        setColumns(mockColumns);
      }
    };
    
    fetchColumns();
  }, []);

  // 수정 완료 후 전체목록 자동 새로고침
  const [lastEditTime, setLastEditTime] = useState<number>(0);
  const [forceRefresh, setForceRefresh] = useState<number>(0);
  
  // React.StrictMode 우회를 위한 추가 상태
  const [strictModeKey, setStrictModeKey] = useState(0);
  
  // React.StrictMode 우회를 위한 강제 리렌더링
  const forceRerender = useCallback(() => {
    setStrictModeKey(prev => prev + 1);
    setForceRefresh(prev => prev + 1);
    console.log('강제 리렌더링 실행됨');
  }, []);
  
  // 컬럼 데이터를 useMemo로 최적화
  const memoizedColumns = useMemo(() => {
    return columns;
  }, [columns, forceRefresh]);
  
  // 댓글 개수 업데이트 함수
  const updateCommentCount = async (columnId: number) => {
    try {
      const commentCount = await fetchCommentCount(columnId);
      setColumns(prev => prev.map(col => 
        col.id === columnId 
          ? { ...col, comments: commentCount }
          : col
      ));
    } catch (error) {
      // 에러 발생 시 무시 (기본값 0 유지)
    }
  };

  // onUpdated 콜백을 useCallback으로 최적화
  const handleEditUpdated = useCallback(async (updated: { id: number; content: string; shouldRefresh?: boolean; newImageUrls?: string }) => {
    if (updated.shouldRefresh) {
      // 새로고침 없이 즉시 상태 업데이트
      try {
        console.log('수정 완료! 즉시 상태를 업데이트합니다...');
        
        // 새로운 이미지 URL이 있다면 즉시 사용
        if (updated.newImageUrls) {
          console.log('새로운 이미지 URL 즉시 사용:', updated.newImageUrls);
          
          // 기존 컬럼에서 수정된 컬럼을 찾아서 이미지 URL 업데이트
          setColumns(prev => prev.map(col => {
            if (col.id === updated.id) {
              return {
                ...col,
                content: updated.content,
                imageUrls: updated.newImageUrls,
                image_url: updated.newImageUrls
              };
            }
            return col;
          }));
          
          // 강제 리렌더링으로 화면 갱신
          setForceRefresh(prev => prev + 1);
          console.log('새로운 이미지 URL로 즉시 상태 업데이트 완료');
          return; // 서버 데이터 재조회 불필요
        }
        
        const token = getToken();
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        let apiUrl = `${baseUrl}/api/board/board`;
        
        // 로그인한 사용자는 좋아요 상태가 포함된 API 호출
        if (token) {
          headers.Authorization = `Bearer ${token}`;
          apiUrl = `${baseUrl}/api/board/board/authenticated`;
          console.log('🔐 수정 후: 좋아요 상태 포함 API 호출');
        } else {
          console.log('👤 수정 후: 기본 API 호출');
        }
        
        const resp = await fetch(apiUrl, {
          method: 'GET',
          headers,
        });
        
        if (resp.ok) {
          const data = await resp.json();
          if (data.success && data.data) {
            const newColumns = data.data.map(mapServerItemToColumn);
            
            console.log('기존 컬럼 수:', columns.length);
            console.log('새 컬럼 수:', newColumns.length);
            
            // 이미지 URL 변경 확인
            const updatedColumn = newColumns.find((col: any) => col.id === updated.id);
            if (updatedColumn) {
              console.log('수정된 컬럼의 새로운 이미지 URL:', updatedColumn.imageUrls || updatedColumn.image_url);
              console.log('수정된 컬럼 전체 정보:', updatedColumn);
            }
            
            // 모든 컬럼의 이미지 URL 확인
            console.log('모든 컬럼의 이미지 URL:');
            newColumns.forEach((col: any, index: number) => {
              console.log(`컬럼 ${index}:`, {
                id: col.id,
                title: col.title,
                imageUrls: col.imageUrls,
                image_url: col.image_url
              });
            });
            
            // 즉시 상태 업데이트 (새로고침 없이)
            setColumns(newColumns);
            console.log('상태 즉시 업데이트 완료');
            
            // 이미지 수정 후 추가 검증
            if (updatedColumn && (updatedColumn.imageUrls || updatedColumn.image_url)) {
              console.log('이미지가 포함된 수정 - 추가 검증 실행');
              
              // 이미지 URL 유효성 검증
              const imageUrls = updatedColumn.imageUrls ? updatedColumn.imageUrls.split(',') : [updatedColumn.image_url];
              console.log('검증할 이미지 URL들:', imageUrls);
              
              // 이미지 접근 가능 여부 확인 (선택적)
              imageUrls.forEach((url: string, index: number) => {
                if (url) {
                  const fullUrl = url.startsWith('http') ? url : `http://localhost:8080${url}`;
                  console.log(`이미지 ${index + 1} URL: ${fullUrl}`);
                }
              });
            }
            
            // 강제 리렌더링으로 화면 갱신
            setForceRefresh(prev => prev + 1);
            console.log('강제 리렌더링 완료');
            
            // 추가 보장을 위한 한 번 더 리렌더링
            setTimeout(() => {
              setForceRefresh(prev => prev + 1);
              console.log('추가 리렌더링 완료');
            }, 100);
            
            console.log('수정 후 서버 데이터로 화면 업데이트 완료');
          }
        }
      } catch (error) {
        console.error('수정 후 데이터 재조회 실패:', error);
        // 실패 시 로컬 상태만 업데이트
        setColumns(prev => prev.map(c => c.id === updated.id ? { ...c, content: updated.content } : c));
      }
    } else {
      // 로컬 상태만 업데이트
      setColumns(prev => prev.map(c => c.id === updated.id ? { ...c, content: updated.content } : c));
    }
  }, [columns.length]);
  
  // forceRefresh 상태 변경 시 추가 처리
  useEffect(() => {
    if (forceRefresh > 0) {
      console.log('강제 리렌더링 실행:', forceRefresh);
      
      // 상태가 제대로 반영되었는지 확인하고 추가 처리
      setTimeout(() => {
        console.log('현재 컬럼 상태 확인:', columns.length);
        
        // 상태가 비어있다면 추가 처리
        if (columns.length === 0) {
          console.log('컬럼 상태가 비어있음 - 추가 처리 필요');
          // 강제로 한 번 더 리렌더링
          setForceRefresh(prev => prev + 1);
        }
      }, 200);
    }
  }, [forceRefresh, columns.length]);
  
  // columns 상태 변경 시 추가 처리
  useEffect(() => {
    console.log('columns 상태 변경됨:', columns.length);
    
    // 상태가 변경되었을 때 추가 리렌더링
    if (columns.length > 0) {
      setForceRefresh(prev => prev + 1);
      console.log('columns 상태 변경으로 추가 리렌더링 실행');
      
      // 이미지가 포함된 컬럼이 있는지 확인
      const hasImageColumns = columns.some((col: any) => col.imageUrls || col.image_url);
      if (hasImageColumns) {
        console.log('이미지가 포함된 컬럼 발견 - 추가 검증 실행');
        // 이미지 로딩 상태 확인
        setTimeout(() => {
          setForceRefresh(prev => prev + 1);
          console.log('이미지 컬럼을 위한 추가 리렌더링 실행');
        }, 200);
      }
    }
  }, [columns.length]);

  if (!mounted) {
    return null; // 서버 사이드 렌더링 시에는 아무것도 렌더링하지 않음
  }

  const selectedColumn = memoizedColumns.find(c => c.id === selectedColumnId);

  // 댓글 제출 함수 - 상세페이지로 이동
  // const handleCommentSubmit = async (columnId: number) => { ... };

  // 댓글 목록 로드 함수 - 상세페이지로 이동  
  // const loadComments = async (columnId: number) => { ... };

  return (
    <div className="min-h-screen pt-4 bg-gray-50" key={strictModeKey}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
             {/* 인기 칼럼 섹션 */}
             <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 mb-8">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center space-x-4">
                   <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                     <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                     </svg>
                   </div>
                   <div>
                     <h2 className="text-3xl font-bold text-gray-900">🔥 인기 칼럼</h2>
                     <p className="text-gray-600">지금 가장 핫한 칼럼들을 확인해보세요</p>
                   </div>
                 </div>
                 <div className="flex items-center space-x-2">
                   <button
                     onClick={prevSliderPage}
                     className="w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-600 hover:text-blue-600"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                     </svg>
                   </button>
                   <button
                     onClick={nextSliderPage}
                     className="w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-600 hover:text-blue-600"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                     </svg>
                   </button>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {getVisibleTopColumns().map((column, index) => (
                   <div 
                     key={column.id} 
                     className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group transform hover:scale-105"
                     onClick={() => handleColumnClick(column.id)}
                   >
                     {/* 순위 배지 */}
                     <div className="relative">
                       <div className="absolute top-4 left-4 z-10">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                           index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                           index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                           'bg-gradient-to-r from-orange-400 to-red-500'
                         }`}>
                           {currentSliderPage * sliderItemsPerPage + index + 1}
                         </div>
                       </div>
                       
                       {/* 이미지 영역 */}
                       <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                         {(column.imageUrls || column.image_url) ? (
                           <div className="w-full h-full">
                             <ImageGallery imageUrl={column.imageUrls || column.image_url || ''} size="small" />
                           </div>
                         ) : (
                           <div className="w-full h-full flex items-center justify-center">
                             <div className="text-center">
                               <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                                 index === 0 ? 'bg-gradient-to-r from-yellow-100 to-orange-100' :
                                 index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200' :
                                 'bg-gradient-to-r from-orange-100 to-red-100'
                               }`}>
                                 <span className={`text-2xl ${
                                   index === 0 ? 'text-yellow-600' :
                                   index === 1 ? 'text-gray-600' :
                                   'text-orange-600'
                                 }`}>
                                   {index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'}
                                 </span>
                               </div>
                               <p className="text-sm text-gray-500">이미지 없음</p>
                             </div>
                           </div>
                         )}
                         
                         {/* 그라데이션 오버레이 */}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                       </div>
                     </div>

                     {/* 카드 내용 */}
                     <div className="p-6">
                       <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center space-x-2">
                           <span className="text-sm font-semibold text-blue-600">
                             👁️ {column.views?.toLocaleString() || '0'} views
                           </span>
                         </div>
                         <div className="flex items-center space-x-1 text-sm text-gray-500">
                           <span>💬 {column.comments || 0}</span>
                         </div>
                       </div>
                       
                       <h3 className="font-bold text-lg mb-3 line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                         {column.title}
                       </h3>
                       
                       <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                         {column.content && column.content.length > 150 
                           ? column.content.substring(0, 150) + '...' 
                           : column.content}
                       </p>
                       
                       <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                         <div className="flex items-center space-x-2">
                           <span className="text-sm font-medium text-gray-700">{column.author}</span>
                         </div>
                         <div className="text-xs text-gray-500">
                           {column.date.replace('T', ' ').substring(0, 16)}
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>

               {/* 페이지 인디케이터 */}
               <div className="flex justify-center mt-8">
                 <div className="flex space-x-3">
                   {Array.from({ length: getTotalSliderPages() }, (_, i) => (
                     <button
                       key={i}
                       onClick={() => setCurrentSliderPage(i)}
                       className={`w-3 h-3 rounded-full transition-all duration-200 ${
                         currentSliderPage === i 
                           ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg' 
                           : 'bg-gray-300 hover:bg-gray-400'
                       }`}
                     />
                   ))}
                 </div>
               </div>
             </div>

            {/* 전체 칼럼 목록 */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-2xl font-bold">전체 칼럼</h2>
                {isLoggedIn && (
                  <button 
                    onClick={() => setIsWriteModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    ✍️ 글쓰기
                  </button>
                )}
              </div>
               {/* 갤러리 그리드 레이아웃 */}
               {getVisibleColumns().length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" key={`columns-${forceRefresh}-${columns.length}-${Date.now()}-${Math.random()}`}>
                   {getVisibleColumns().map((column) => (
                   <div 
                     key={column.id} 
                     className="bg-white rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-out overflow-hidden group"
                     onClick={() => handleColumnClick(column.id)}
                   >
                     {/* 메뉴 버튼 */}
                     <div className="relative p-6" data-action-root={column.id}>
                       <button
                         onClick={(e) => toggleActionMenu(e, column.id)}
                         className="absolute top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 shadow-sm opacity-0 group-hover:opacity-100"
                         aria-haspopup="menu"
                         aria-expanded={openActionMenuId === column.id}
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                         </svg>
                       </button>

                       {openActionMenuId === column.id && (
                         <div
                           onClick={(e) => e.stopPropagation()}
                           role="menu"
                           className="absolute right-3 top-12 z-20 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                         >
                           {currentUserId && column.user_id === currentUserId && (
                             <button
                               role="menuitem"
                               onClick={(e) => handleEditColumn(e, column)}
                               className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                             >
                               수정
                             </button>
                           )}
                           {currentUserId && column.user_id === currentUserId && (
                             <button
                               role="menuitem"
                               onClick={(e) => handleDeleteColumn(e, column.id)}
                               className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                             >
                               삭제
                             </button>
                           )}
                           <div className="border-t border-gray-100 my-1"></div>
                           <button
                             role="menuitem"
                             onClick={(e) => handleReportColumn(e, column.id)}
                             className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50"
                           >
                             신고하기
                           </button>
                         </div>
                       )}

                       {/* 작성자 정보 */}
                       <div className="flex items-center mb-4">
                         <div className="flex-1">
                           <span className="text-sm font-semibold text-gray-800">{column.author}</span>
                           <div className="text-xs text-gray-500">{column.date.replace('T', ' ').substring(0, 16)}</div>
                         </div>
                         <div className="text-xs text-gray-400">
                           👁️ {column.views?.toLocaleString() || '0'}
                         </div>
                       </div>

                       {/* 제목 */}
                       <h2 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                         {column.title}
                       </h2>
                       
                       {/* 내용 */}
                       <p className="text-sm text-gray-600 mb-4 line-clamp-4 leading-relaxed">
                         {column.content && column.content.length > 200 
                           ? column.content.substring(0, 200) + '...' 
                           : column.content}
                       </p>

                       {/* 하단 통계 */}
                       <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                         <div className="flex items-center space-x-4">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleLikeToggle(column.id);
                             }}
                             className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                           >
                             <svg 
                               className={`w-4 h-4 ${column.isLiked ? 'fill-current text-red-500' : 'fill-none'}`}
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
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleColumnClick(column.id);
                             }}
                             className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                             </svg>
                             <span className="text-xs">{column.comments || 0}</span>
                           </button>
                         </div>
                         <div className="text-xs text-gray-400">
                           {column.date.replace('T', ' ').substring(0, 16)}
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
               ) : (
                 /* 빈 상태 안내 메시지 */
                 <div className="text-center py-16">
                   <div className="max-w-md mx-auto">
                     <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                       <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                       </svg>
                     </div>
                     <h3 className="text-xl font-semibold text-gray-900 mb-2">아직 작성된 칼럼이 없습니다</h3>
                     <p className="text-gray-600 mb-6">첫 번째 칼럼을 작성해보세요!</p>
                     {isLoggedIn && (
                       <button 
                         onClick={() => setIsWriteModalOpen(true)}
                         className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                       >
                         ✍️ 첫 칼럼 작성하기
                       </button>
                     )}
                   </div>
                 </div>
               )}

              {/* More 버튼 */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button 
                    onClick={handleLoadMore}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    📖 더 보기
                  </button>
                </div>
              )}
              
            </div>

            {/* 글쓰기 모달 */}
            {isWriteModalOpen && (
              <ColumnWriteModal
                onClose={() => setIsWriteModalOpen(false)}
                onSubmit={handleAddColumn}
              />
            )}

            {/* 수정 모달 */}
            {editTarget && (
              <ColumnEditModal
                isOpen={!!editTarget}
                onClose={() => setEditTarget(null)}
                column={editTarget}
                onUpdated={handleEditUpdated}
              />
            )}

            {/* 댓글 모달 */}
            {isCommentModalOpen && selectedColumnId && (
              <CommentModal
                isOpen={isCommentModalOpen}
                onClose={() => {
                  setIsCommentModalOpen(false);
                  setSelectedColumnId(null);
                }}
                columnInfo={selectedColumn ? {
                  title: selectedColumn.title,
                  author: selectedColumn.author,
                  date: selectedColumn.date,
                  content: selectedColumn.content,
                  likes: selectedColumn.likes,
                  commentsCount: selectedColumn.comments,
                } : undefined}
                comments={[]}
              />
            )}

            {/* 상세 페이지 모달 */}
            <ColumnDetailModal
              isOpen={isDetailModalOpen}
              onClose={() => {
                setIsDetailModalOpen(false);
                setSelectedColumnId(null);
              }}
              columnId={selectedColumnId}
              onLikeChange={(columnId, isLiked, likeCount) => {
                // 상세페이지에서 좋아요 상태 변경 시 컬럼페이지 상태도 동기화
                setColumns(prev => prev.map(col => {
                  if (col.id === columnId) {
                    return {
                      ...col,
                      isLiked,
                      likes: likeCount
                    };
                  }
                  return col;
                }));
                
                // 강제 리렌더링으로 화면 갱신
                setForceRefresh(prev => prev + 1);
                
                console.log('🔄 상세페이지 좋아요 상태 변경으로 컬럼페이지 상태 동기화:', {
                  columnId,
                  isLiked,
                  likeCount
                });
              }}
            />

          </div>

        </div>
      </div>

      {/* 신고 모달 */}
      {showReportModal && selectedColumnForReport && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">게시글 신고</h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedColumnForReport(null);
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
                <label className="block text-sm font-medium text-gray-700 mb-2">신고할 게시글</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedColumnForReport.title}
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
                    setSelectedColumnForReport(null);
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

      {/* 푸터 위 공간 */}
      <div className="h-20"></div>
    </div>
  );
} 