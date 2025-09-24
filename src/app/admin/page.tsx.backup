'use client';

import React, { useState, useEffect } from 'react';
import ColumnDetailModal from '../column/ColumnDetailModal';
import { getToken } from '@/utils/token';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Headphones, 
  BarChart3, 
  Settings,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  UserCheck,
  Shield,
  Search,
  Image as ImageIcon,
  X
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 신고 관련 상태
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  
  // 제재 모달 상태
  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [sanctionType, setSanctionType] = useState('warning');
  const [adminComment, setAdminComment] = useState('');
  

  // 관리자 정보 가져오기
  const fetchAdminInfo = async () => {
    try {
      const token = getToken();
      if (!token) {
        console.log('토큰이 없습니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/admin/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('관리자 정보:', data);
        setAdminInfo(data);
      } else {
        console.error('관리자 정보 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('관리자 정보 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 신고 목록 가져오기
  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        console.log('토큰이 없습니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/report/admin/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('신고 목록 조회 성공:', data);
        setReports(data);
      } else {
        console.log('신고 목록 조회 실패:', response.status);
        setReports([]);
      }
    } catch (error) {
      console.log('신고 목록 조회 오류:', error);
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  // 신고 처리 함수
  const handleReportAction = async (reportId: number, action: string) => {
    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // JWT 토큰 디버깅
      console.log('🔍 JWT 토큰 길이:', token.length);
      console.log('🔍 JWT 토큰 미리보기:', token.substring(0, 50) + '...');
      
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          // Base64 URL 디코딩
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
          const payload = JSON.parse(atob(padded));
          console.log('🔍 JWT 페이로드:', payload);
          console.log('🔍 사용자 ID:', payload.user_id);
          console.log('🔍 사용자명:', payload.username);
          console.log('🔍 권한 정보:', payload.authorities || payload.roles || '권한 정보 없음');
          console.log('🔍 관리자 여부:', payload.isAdmin || payload.admin || '관리자 정보 없음');
        } else {
          console.log('🔍 JWT 형식이 올바르지 않음:', parts.length, 'parts');
        }
      } catch (e) {
        console.log('🔍 JWT 파싱 실패:', e);
        console.log('🔍 원본 토큰:', token);
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      
      const requestBody = {
        action: action,
        admin_comment: action === 'reject' ? '반려 처리' : null
      };

      console.log('🚨 반려 처리 요청:', {
        reportId,
        action,
        url: `${baseUrl}/api/report/admin/${reportId}/process`
      });
      console.log('🚨 반려 요청 본문:', requestBody);

      const response = await fetch(`${baseUrl}/api/report/admin/${reportId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🚨 응답 상태:', response.status);
      console.log('🚨 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.text();
        console.log('🚨 성공 응답:', result);
        alert('신고 처리가 완료되었습니다.');
        fetchReports();
      } else {
        const errorText = await response.text();
        console.log('🚨 오류 응답:', errorText);
        
        if (response.status === 401) {
          alert('인증이 필요합니다. 다시 로그인해주세요.');
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
          return;
        }
        
        alert(`신고 처리에 실패했습니다: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('신고 처리 중 오류:', error);
      alert('신고 처리 중 오류가 발생했습니다.');
    }
  };

  // 제재 모달 열기
  const handleOpenSanctionModal = (report: any) => {
    setSelectedReport(report);
    setSanctionType('warning');
    setAdminComment('');
    setIsSanctionModalOpen(true);
  };


  // 제재 처리
  const handleSanctionSubmit = async () => {
    if (!selectedReport || !adminComment.trim()) {
      alert('관리자 코멘트를 입력해주세요.');
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // JWT 토큰 디버깅
      console.log('🔍 제재 JWT 토큰 길이:', token.length);
      console.log('🔍 제재 JWT 토큰 미리보기:', token.substring(0, 50) + '...');
      
      // 토큰 유효성 검사
      if (!token || token.length < 10) {
        console.log('❌ 토큰이 유효하지 않습니다.');
        alert('토큰이 유효하지 않습니다. 다시 로그인해주세요.');
        return;
      }
      
      // JWT 형식 검사
      const parts = token.split('.');
      console.log('🔍 제재 JWT 파트 개수:', parts.length);
      
      if (parts.length !== 3) {
        console.log('❌ JWT 형식이 올바르지 않습니다.');
        alert('토큰 형식이 올바르지 않습니다. 다시 로그인해주세요.');
        return;
      }
      
      // 토큰이 올바른지 확인
      console.log('🔍 제재 JWT 헤더:', parts[0]);
      console.log('🔍 제재 JWT 페이로드 (인코딩됨):', parts[1]);
      console.log('🔍 제재 JWT 서명:', parts[2]);
      
      // JWT 페이로드 디코딩
      try {
        const decoded = atob(parts[1]);
        const payload = JSON.parse(decoded);
        console.log('🔍 제재 JWT 페이로드:', payload);
        console.log('🔍 제재 사용자 ID:', payload.user_id);
        console.log('🔍 제재 사용자명:', payload.username);
      } catch (e) {
        console.log('❌ JWT 페이로드 디코딩 실패:', e);
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      
      // 관리자 정보 확인을 위해 별도 API 호출
      try {
        const adminInfoResponse = await fetch(`${baseUrl}/api/admin/info`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🔍 관리자 정보 응답 상태:', adminInfoResponse.status);
        
        if (adminInfoResponse.ok) {
          const adminInfo = await adminInfoResponse.json();
          console.log('🔍 관리자 정보:', adminInfo);
        } else {
          console.log('❌ 관리자 정보 조회 실패:', adminInfoResponse.status);
        }
      } catch (e) {
        console.log('❌ 관리자 정보 조회 오류:', e);
      }
      
      const requestBody = {
        action: 'sanction',
        sanctionType: sanctionType,
        admin_comment: adminComment
      };

      console.log('🚨 제재 처리 요청:', {
        reportId: selectedReport.report_id,
        sanctionType,
        adminComment,
        url: `${baseUrl}/api/report/admin/${selectedReport.report_id}/process`
      });
      console.log('🚨 제재 요청 본문:', requestBody);
      
      const response = await fetch(`${baseUrl}/api/report/admin/${selectedReport.report_id}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🚨 제재 응답 상태:', response.status);
      console.log('🚨 제재 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.text();
        console.log('🚨 제재 성공 응답:', result);
        alert('제재 처리가 완료되었습니다.');
        setIsSanctionModalOpen(false);
        setSelectedReport(null);
        setAdminComment('');
        fetchReports();
      } else {
        const errorText = await response.text();
        console.log('🚨 제재 오류 응답:', errorText);
        
        if (response.status === 401) {
          alert('인증이 필요합니다. 다시 로그인해주세요.');
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
          return;
        }
        
        alert(`제재 처리에 실패했습니다: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('제재 처리 중 오류:', error);
      alert('제재 처리 중 오류가 발생했습니다.');
    }
  };

  // 게시물 보기
  const handleViewPost = (report: any) => {
    if (report.target_type === 'board') {
      setSelectedPost({ board_id: report.target_id });
      setIsDetailModalOpen(true);
    } else {
      // 댓글인 경우 해당 게시물로 이동
      setSelectedPost({ board_id: report.target_id });
      setIsDetailModalOpen(true);
    }
  };

  // 게시물 목록 상태
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

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
          for (const comment of comments) {
            if (comment.replies && Array.isArray(comment.replies)) {
              totalCount += comment.replies.length;
            }
          }
        }
        
        return totalCount;
      } else {
        return 0;
      }
    } catch (error) {
      return 0;
    }
  };

  // 공지사항 목록 상태
  const [notices, setNotices] = useState<any[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [isNoticeDetailModalOpen, setIsNoticeDetailModalOpen] = useState(false);
  const [deletingNoticeId, setDeletingNoticeId] = useState<number | null>(null);
  
  // 공지사항 작성/수정 모달 상태
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    isImportant: false
  });
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);
  
  // 문의사항 관련 상태
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [isInquiryDetailModalOpen, setIsInquiryDetailModalOpen] = useState(false);
  const [isInquiryReplyModalOpen, setIsInquiryReplyModalOpen] = useState(false);
  const [inquiryReplyForm, setInquiryReplyForm] = useState({
    reply_content: ''
  });
  const [inquiryReplySubmitting, setInquiryReplySubmitting] = useState(false);

  // 공지사항 삭제 함수
  const handleDeleteNotice = async (noticeId: number) => {
    if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    setDeletingNoticeId(noticeId);

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/admin/notice/${noticeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('공지사항이 성공적으로 삭제되었습니다.');
        // 공지사항 목록 새로고침
        fetchNotices();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`삭제 실패: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('공지사항 삭제 오류:', error);
      alert('공지사항 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingNoticeId(null);
    }
  };

  // 공지사항 작성/수정 모달 열기
  const openNoticeModal = (notice?: any) => {
    if (notice) {
      // 수정 모드
      console.log('🔍 수정 모드 - 원본 데이터:', {
        notice_title: notice.notice_title,
        is_important: notice.is_important,
        is_important_type: typeof notice.is_important
      });
      setEditingNotice(notice);
      const isImportant = notice.is_important === 1 || notice.is_important === "1" || notice.is_important === true;
      console.log('🔍 수정 모드 - 변환된 isImportant:', isImportant);
      setNoticeForm({
        title: notice.notice_title,
        content: notice.notice_content,
        isImportant: isImportant
      });
    } else {
      // 작성 모드
      setEditingNotice(null);
      setNoticeForm({
        title: '',
        content: '',
        isImportant: false
      });
    }
    setIsNoticeModalOpen(true);
  };

  // 공지사항 작성/수정 제출
  const handleNoticeSubmit = async () => {
    if (!noticeForm.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!noticeForm.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setNoticeSubmitting(true);

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const isEdit = !!editingNotice;
      const url = isEdit 
        ? `${baseUrl}/api/admin/notice/${editingNotice.notice_id}`
        : `${baseUrl}/api/admin/notice/create`;
      
      const method = isEdit ? 'PUT' : 'POST';

      console.log('🔍 공지사항 제출 디버깅:', {
        url,
        method,
        baseUrl,
        token: token ? `${token.substring(0, 20)}...` : '없음',
        tokenLength: token ? token.length : 0,
        requestBody: {
          notice_title: noticeForm.title,
          notice_content: noticeForm.content,
          is_important: noticeForm.isImportant
        }
      });

      const requestBody = {
        notice_title: noticeForm.title,
        notice_content: noticeForm.content,
        is_important: noticeForm.isImportant
      };

      console.log('📝 요청 본문 상세:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 응답 상태:', response.status, response.statusText);

      if (response.ok) {
        alert(isEdit ? '공지사항이 수정되었습니다.' : '공지사항이 작성되었습니다.');
        setIsNoticeModalOpen(false);
        fetchNotices(); // 목록 새로고침
      } else {
        // 응답 텍스트 먼저 확인
        const responseText = await response.text();
        console.log('📄 응답 텍스트:', responseText);
        
        let errorData = {};
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          console.log('JSON 파싱 실패, 텍스트 응답:', responseText);
        }
        
        console.error('❌ 공지사항 제출 실패:', {
          status: response.status,
          statusText: response.statusText,
          responseText,
          errorData,
          errorMessage: (errorData as any).message,
          errorDetails: errorData
        });
        console.log('🔍 errorDetails 상세:', JSON.stringify(errorData, null, 2));
        alert(`${isEdit ? '수정' : '작성'} 실패: ${(errorData as any).message || response.statusText}`);
      }
    } catch (error) {
      console.error('공지사항 제출 오류:', error);
      alert('공지사항 처리 중 오류가 발생했습니다.');
    } finally {
      setNoticeSubmitting(false);
    }
  };

  // 문의사항 답변 제출
  const handleInquiryReply = async () => {
    if (!inquiryReplyForm.reply_content.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    setInquiryReplySubmitting(true);

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/admin/inquiry/${selectedInquiry.inquiry_id}/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answer_content: inquiryReplyForm.reply_content
        })
      });

      if (response.ok) {
        alert('답변이 등록되었습니다.');
        setIsInquiryReplyModalOpen(false);
        setInquiryReplyForm({ reply_content: '' });
        fetchInquiries(); // 목록 새로고침
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`답변 등록 실패: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('답변 등록 오류:', error);
      alert('답변 등록 중 오류가 발생했습니다.');
    } finally {
      setInquiryReplySubmitting(false);
    }
  };

  // 공지사항 모달 닫기
  const closeNoticeModal = () => {
    setIsNoticeModalOpen(false);
    setEditingNotice(null);
    setNoticeForm({
      title: '',
      content: '',
      isImportant: false
    });
    setNoticeSubmitting(false);
  };

  // 문의사항 목록 가져오기
  const fetchInquiries = async () => {
    try {
      const token = getToken();
      if (!token) {
        console.log('토큰이 없습니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/admin/inquiry/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('문의사항 목록:', data);
        
        // 최신순으로 정렬
        const sortedInquiries = data.sort((a: any, b: any) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setInquiries(sortedInquiries);
      } else {
        console.error('문의사항 목록 조회 실패:', response.status);
        setInquiries([]);
      }
    } catch (error) {
      console.error('문의사항 목록 조회 오류:', error);
      setInquiries([]);
    } finally {
      setInquiriesLoading(false);
    }
  };

  // 실제 공지사항 목록 가져오기
  const fetchNotices = async () => {
    try {
      const token = getToken();
      if (!token) {
        console.log('토큰이 없습니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/admin/notice/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('공지사항 목록:', data);
        
        // 중요 공지사항을 맨 위로 정렬
        const sortedNotices = data.sort((a: any, b: any) => {
          // 중요 공지사항이 먼저
          if (a.is_important == 1 && b.is_important != 1) return -1;
          if (a.is_important != 1 && b.is_important == 1) return 1;
          
          // 중요도가 같으면 최신순
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setNotices(sortedNotices);
      } else {
        console.error('공지사항 목록 조회 실패:', response.status);
        // 실패 시 하드코딩 데이터 사용
        setNotices([
          {
            notice_id: 1,
            notice_title: "서비스 이용약관 개정 안내",
            notice_content: "서비스 이용약관이 개정되었습니다.",
            admin_id: 1,
            created_at: "2024-01-20T00:00:00Z",
            updated_at: "2024-01-20T00:00:00Z",
            is_important: 1,
            view_count: 1247
          },
          {
            notice_id: 2,
            notice_title: "개인정보처리방침 업데이트",
            notice_content: "개인정보처리방침이 업데이트되었습니다.",
            admin_id: 1,
            created_at: "2024-01-18T00:00:00Z",
            updated_at: "2024-01-18T00:00:00Z",
            is_important: 1,
            view_count: 892
          }
        ]);
      }
    } catch (error) {
      console.error('공지사항 목록 조회 오류:', error);
      // 오류 시 하드코딩 데이터 사용
      setNotices([]);
    } finally {
      setNoticesLoading(false);
    }
  };

  // 실제 게시물 목록 가져오기
  const fetchPosts = async () => {
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
        const postsWithCommentCounts = await Promise.all(
          data.map(async (post: any) => {
            const commentCount = await fetchCommentCount(post.board_id);
            return {
              ...post,
              comment_count: commentCount
            };
          })
        );
        
        setPosts(postsWithCommentCounts);
      } else {
        console.error('게시물 목록 조회 실패:', response.status);
        // 실패 시 하드코딩 데이터 사용
        setPosts([
          {
            board_id: 1,
            title: "오늘의 맛집 추천 - 강남역 맛집 5곳",
            username: "김철수",
            view: 1247,
            like_count: 89,
            comment_count: 23,
            uploaded_at: "2024-01-15",
            image_url: "/upload/sample1.jpg",
            isReported: false
          },
          {
            board_id: 2,
            title: "운동 루틴 공유 - 홈트레이닝 가이드",
            username: "최지영",
            view: 567,
            like_count: 23,
            comment_count: 8,
            uploaded_at: "2024-01-12",
            image_url: "/upload/sample2.jpg",
            isReported: true
          }
        ]);
      }
    } catch (error) {
      console.error('게시물 목록 조회 오류:', error);
      // 오류 시 하드코딩 데이터 사용
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 관리자 정보와 게시물 목록, 공지사항 목록 가져오기
  useEffect(() => {
    fetchAdminInfo();
    fetchPosts();
    fetchNotices();
    fetchInquiries();
    fetchReports();
  }, []);

  // 임시 데이터 (나중에 실제 데이터로 교체)
  const stats = {
    totalUsers: 1247,
    totalPosts: 89,
    totalComments: 342,
    totalInquiries: 23,
    activeUsers: 156,
    pendingPosts: 5,
    reportedComments: 8,
    newInquiries: 3
  };

  const recentActivities = [
    { id: 1, type: 'post', user: '김철수', action: '새 게시글 작성', time: '5분 전', status: 'pending' },
    { id: 2, type: 'comment', user: '이영희', action: '댓글 신고', time: '12분 전', status: 'reported' },
    { id: 3, type: 'user', user: '박민수', action: '회원가입', time: '1시간 전', status: 'new' },
    { id: 4, type: 'inquiry', user: '최지영', action: '문의사항 등록', time: '2시간 전', status: 'new' }
  ];

  const StatCard = ({ title, value, icon: Icon, color, change }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% 이전 대비
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ActivityCard = ({ activity }: any) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'reported': return 'bg-red-100 text-red-800';
        case 'new': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'pending': return '대기중';
        case 'reported': return '신고됨';
        case 'new': return '신규';
        default: return '완료';
      }
    };

    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            {activity.type === 'post' && <FileText className="w-5 h-5 text-gray-600" />}
            {activity.type === 'comment' && <MessageSquare className="w-5 h-5 text-gray-600" />}
            {activity.type === 'user' && <Users className="w-5 h-5 text-gray-600" />}
            {activity.type === 'inquiry' && <Headphones className="w-5 h-5 text-gray-600" />}
          </div>
          <div>
            <p className="font-medium text-gray-900">{activity.user}</p>
            <p className="text-sm text-gray-600">{activity.action}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
            {getStatusText(activity.status)}
          </span>
          <span className="text-sm text-gray-500">{activity.time}</span>
        </div>
      </div>
    );
  };

  const QuickActionButton = ({ title, icon: Icon, color, onClick }: any) => (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-${color}-300 hover:bg-${color}-50 transition-all group`}
    >
      <div className="flex flex-col items-center space-y-2">
        <div className={`p-3 rounded-lg bg-${color}-100 group-hover:bg-${color}-200 transition-colors`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {isLoading ? (
                  '로딩 중...'
                ) : adminInfo ? (
                  `${adminInfo.name || adminInfo.username || '관리자'}님, 안녕하세요!`
                ) : (
                  '관리자님, 안녕하세요!'
                )}
              </span>
             
            </div>
          </div>
        </div>
      </div>

      {/* 네비게이션 탭 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: '대시보드', icon: BarChart3 },
              { id: 'users', label: '사용자 관리', icon: Users },
              { id: 'posts', label: '게시물 관리', icon: FileText },
              { id: 'reports', label: '신고내역', icon: AlertCircle },
              { id: 'support', label: '고객센터', icon: Headphones },
              { id: 'news', label: '뉴스 통계', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  console.log('탭 클릭:', tab.id);
                  setActiveTab(tab.id);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="전체 사용자"
                value={stats.totalUsers.toLocaleString()}
                icon={Users}
                color="bg-blue-500"
                change={12}
              />
              <StatCard
                title="전체 게시글"
                value={stats.totalPosts.toLocaleString()}
                icon={FileText}
                color="bg-green-500"
                change={8}
              />
              <StatCard
                title="전체 댓글"
                value={stats.totalComments.toLocaleString()}
                icon={MessageSquare}
                color="bg-purple-500"
                change={-3}
              />
              <StatCard
                title="문의사항"
                value={stats.totalInquiries.toLocaleString()}
                icon={Headphones}
                color="bg-orange-500"
                change={15}
              />
            </div>

            {/* 상세 통계 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickActionButton
                    title="게시글 보기"
                    icon={CheckCircle}
                    color="green"
                    onClick={() => setActiveTab('posts')}
                  />
                  <QuickActionButton
                    title="댓글 검토"
                    icon={MessageSquare}
                    color="blue"
                    onClick={() => setActiveTab('comments')}
                  />
                  <QuickActionButton
                    title="사용자 관리"
                    icon={Users}
                    color="purple"
                    onClick={() => setActiveTab('users')}
                  />
                  <QuickActionButton
                    title="문의 답변"
                    icon={Headphones}
                    color="orange"
                    onClick={() => setActiveTab('support')}
                  />
                </div>
              </div>
            </div>

            {/* 알림 및 경고 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-yellow-800">주의가 필요한 항목</h3>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-yellow-700">• 승인 대기 게시글: {stats.pendingPosts}개</p>
                  <p className="text-yellow-700">• 신고된 댓글: {stats.reportedComments}개</p>
                  <p className="text-yellow-700">• 새로운 문의: {stats.newInquiries}개</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">시스템 상태</h3>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-green-700">• 서버 상태: 정상</p>
                  <p className="text-green-700">• 데이터베이스: 연결됨</p>
                  <p className="text-green-700">• 백업 상태: 최신</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 게시물 관리 탭 */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">게시물 관리</h2>
                <p className="text-gray-600 mt-1">전체 게시물 현황을 모니터링하세요</p>
              </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">신고된 게시물</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {postsLoading ? '...' : posts.filter(post => post.isReported).length}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">처리 대기 중</p>
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
                            {post.isReported && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                신고됨
                              </span>
                            )}
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
          </div>
        )}

        {/* 사용자 관리 탭 */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">사용자 관리</h2>
                <p className="text-gray-600 mt-1">전체 사용자 현황을 모니터링하세요</p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  사용자 추가
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  엑셀 다운로드
                </button>
              </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">전체 사용자</p>
                    <p className="text-3xl font-bold text-gray-900">1,247</p>
                    <p className="text-sm text-green-600 mt-1">+12% 이번 달</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">활성 사용자</p>
                    <p className="text-3xl font-bold text-gray-900">896</p>
                    <p className="text-sm text-green-600 mt-1">72% 활성도</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">신규 가입</p>
                    <p className="text-3xl font-bold text-gray-900">23</p>
                    <p className="text-sm text-gray-500 mt-1">오늘</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">정지된 사용자</p>
                    <p className="text-3xl font-bold text-gray-900">12</p>
                    <p className="text-sm text-red-600 mt-1">관리 필요</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 검색 및 필터 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">사용자 목록</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="사용자 검색..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>전체 상태</option>
                    <option>활성</option>
                    <option>비활성</option>
                    <option>정지</option>
                  </select>
                </div>
              </div>

              {/* 사용자 목록 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">활동</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      {
                        id: 1,
                        name: "김철수",
                        email: "kim@example.com",
                        joinDate: "2024-01-15",
                        posts: 23,
                        comments: 45,
                        status: "active",
                        lastLogin: "2시간 전"
                      },
                      {
                        id: 2,
                        name: "이영희",
                        email: "lee@example.com",
                        joinDate: "2024-01-10",
                        posts: 15,
                        comments: 32,
                        status: "active",
                        lastLogin: "1일 전"
                      },
                      {
                        id: 3,
                        name: "박민수",
                        email: "park@example.com",
                        joinDate: "2024-01-08",
                        posts: 8,
                        comments: 12,
                        status: "inactive",
                        lastLogin: "1주일 전"
                      },
                      {
                        id: 4,
                        name: "최지영",
                        email: "choi@example.com",
                        joinDate: "2024-01-05",
                        posts: 5,
                        comments: 8,
                        status: "suspended",
                        lastLogin: "3일 전"
                      },
                      {
                        id: 5,
                        name: "정수현",
                        email: "jung@example.com",
                        joinDate: "2024-01-20",
                        posts: 12,
                        comments: 28,
                        status: "active",
                        lastLogin: "30분 전"
                      }
                    ].map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-full"
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                                alt={user.name}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">ID: {user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">최근 로그인: {user.lastLogin}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.joinDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">게시물: {user.posts}</div>
                          <div className="text-sm text-gray-500">댓글: {user.comments}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : user.status === 'inactive'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status === 'active' ? '활성' : user.status === 'inactive' ? '비활성' : '정지'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">보기</button>
                          <button className="text-green-600 hover:text-green-900">편집</button>
                          {user.status === 'suspended' ? (
                            <button className="text-green-600 hover:text-green-900">해제</button>
                          ) : (
                            <button className="text-red-600 hover:text-red-900">정지</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  총 <span className="font-medium">1,247</span>명 중 <span className="font-medium">1-5</span>명 표시
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50">
                    이전
                  </button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">1</button>
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50">2</button>
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50">3</button>
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50">
                    다음
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 고객센터 관리 탭 */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">고객센터 관리</h2>
                <p className="text-gray-600 mt-1">공지사항과 문의사항을 관리하세요</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => openNoticeModal()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  공지사항 작성
                </button>
              </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">전체 공지사항</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {noticesLoading ? '...' : notices.length}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      중요: {noticesLoading ? '...' : notices.filter(n => n.is_important === 1).length}개
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Headphones className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">전체 문의사항</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {inquiriesLoading ? '...' : inquiries.length}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      답변 완료: {inquiriesLoading ? '...' : inquiries.filter(i => i.inquiry_status === 'answered').length}개
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">답변 대기</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {inquiriesLoading ? '...' : inquiries.filter(i => i.inquiry_status === 'pending').length}
                    </p>
                    <p className="text-sm text-yellow-600 mt-1">처리 필요</p>
                  </div>
                </div>
              </div>

            </div>

            {/* 공지사항 관리 섹션 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">

              {/* 공지사항 관리 섹션 */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">공지사항 목록</h3>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="공지사항 검색..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>전체 상태</option>
                      <option>활성</option>
                      <option>비활성</option>
                    </select>
                  </div>
                </div>

                {/* 공지사항 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조회수</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {noticesLoading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center">
                            <div className="text-gray-500">공지사항을 불러오는 중...</div>
                          </td>
                        </tr>
                      ) : notices.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center">
                            <div className="text-gray-500">공지사항이 없습니다.</div>
                          </td>
                        </tr>
                      ) : (
                        notices.map((notice) => (
                          <tr key={notice.notice_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {(() => { console.log('🔍 공지사항 데이터:', notice.notice_title, 'is_important:', notice.is_important, '타입:', typeof notice.is_important); return null; })()}
                                {(notice.is_important === 1 || notice.is_important === "1" || notice.is_important === true) && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">
                                    중요
                                  </span>
                                )}
                                <div className="text-sm font-medium text-gray-900">{notice.notice_title}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(notice.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {notice.view_count?.toLocaleString() || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                활성
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button 
                                onClick={() => {
                                  setSelectedNotice(notice);
                                  setIsNoticeDetailModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                보기
                              </button>
                              <button 
                                onClick={() => openNoticeModal(notice)}
                                className="text-green-600 hover:text-green-900"
                              >
                                편집
                              </button>
                              <button 
                                onClick={() => handleDeleteNotice(notice.notice_id)}
                                disabled={deletingNoticeId === notice.notice_id}
                                className={`${
                                  deletingNoticeId === notice.notice_id
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-red-600 hover:text-red-900'
                                }`}
                              >
                                {deletingNoticeId === notice.notice_id ? '삭제 중...' : '삭제'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    총 <span className="font-medium">{noticesLoading ? '...' : notices.length}</span>개 중 <span className="font-medium">1-{noticesLoading ? '...' : notices.length}</span>개 표시
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50">
                      이전
                    </button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">1</button>
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50">2</button>
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50">3</button>
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50">
                      다음
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 문의사항 관리 섹션 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">문의사항</h3>
                  <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                    전체 보기 →
                  </button>
                </div>

                {/* 문의사항 카드 목록 */}
                <div className="space-y-4">
                  {inquiriesLoading ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">문의사항을 불러오는 중...</div>
                    </div>
                  ) : inquiries.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">등록된 문의사항이 없습니다.</div>
                    </div>
                  ) : (
                    inquiries.slice(0, 4).map((inquiry) => (
                      <div key={inquiry.inquiry_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-sm font-medium text-gray-900">{inquiry.inquiry_title}</h4>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                inquiry.inquiry_status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {inquiry.inquiry_status === 'pending' ? '답변 대기' : '답변 완료'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{inquiry.inquiry_content}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>작성자: {inquiry.user_name || inquiry.userName || inquiry.username || inquiry.user_id || '사용자'}</span>
                              <span>작성일: {new Date(inquiry.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button 
                              onClick={() => {
                                setSelectedInquiry(inquiry);
                                setIsInquiryDetailModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              보기
                            </button>
                            {inquiry.inquiry_status === 'pending' && (
                              <button 
                                onClick={() => {
                                  setSelectedInquiry(inquiry);
                                  setIsInquiryReplyModalOpen(true);
                                }}
                                className="text-green-600 hover:text-green-900 text-sm"
                              >
                                답변
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                  ))
                )}
              </div>
              </div>
            </div>
          </div>
        )}

        {/* 신고내역 탭 */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">신고내역</h2>
            
            {/* 신고 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">전체 신고</p>
                    <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">처리 대기</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reports.filter(r => r.report_status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">처리 완료</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reports.filter(r => r.report_status === 'warning' || r.report_status === 'suspended' || r.report_status === 'rejected').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">정지된 계정</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reports.filter(r => r.report_status === 'suspended').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 신고 목록 */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">신고 목록</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">신고된 내용들을 관리할 수 있습니다.</p>
              </div>
              <div className="border-t border-gray-200">
                {reportsLoading ? (
                  <div className="px-4 py-5 sm:px-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">신고 목록을 불러오는 중...</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="px-4 py-5 sm:px-6 text-center">
                    <p className="text-gray-500">신고된 내용이 없습니다.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {reports.map((report) => (
                      <li key={report.report_id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-700">
                                    {report.reporter_username?.charAt(0) || '?'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {report.reporter_username} → {report.reported_username}
                                  </p>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    report.report_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    report.report_status === 'warning' ? 'bg-orange-100 text-orange-800' :
                                    report.report_status === 'suspended' ? 'bg-red-100 text-red-800' :
                                    report.report_status === 'rejected' ? 'bg-gray-100 text-gray-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {report.report_status === 'pending' ? '대기' :
                                     report.report_status === 'warning' ? '경고' :
                                     report.report_status === 'suspended' ? '정지' :
                                     report.report_status === 'rejected' ? '반려' :
                                     '완료'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{report.report_reason}</p>
                                {report.report_content && (
                                  <p className="text-xs text-gray-500 truncate mt-1">
                                    추가설명: {report.report_content}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  {report.target_type === 'board' ? '게시물' : '댓글'} • {new Date(report.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button 
                              onClick={() => handleViewPost(report)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              보기
                            </button>
                            {report.report_status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleOpenSanctionModal(report)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  제재
                                </button>
                                <button 
                                  onClick={() => handleReportAction(report.report_id, 'reject')}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  반려
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 다른 탭들 (나중에 구현) */}
        {activeTab !== 'dashboard' && activeTab !== 'posts' && activeTab !== 'users' && activeTab !== 'support' && activeTab !== 'reports' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'news' && '뉴스 통계'}
            </h3>
            <p className="text-gray-600">이 기능은 현재 개발 중입니다.</p>
          </div>
        )}


        {/* 제재 모달 */}
        {isSanctionModalOpen && selectedReport && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">제재 처리</h2>
                  <button 
                    onClick={() => {
                      setIsSanctionModalOpen(false);
                      setSelectedReport(null);
                      setAdminComment('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">신고 대상</p>
                    <p className="text-sm text-gray-900">
                      {selectedReport.reporter_username} → {selectedReport.reported_username}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">제재 유형</p>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sanctionType"
                          value="warning"
                          checked={sanctionType === 'warning'}
                          onChange={(e) => setSanctionType(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">경고</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sanctionType"
                          value="suspended_7days"
                          checked={sanctionType === 'suspended_7days'}
                          onChange={(e) => setSanctionType(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">7일 정지</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      관리자 코멘트 *
                    </label>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      placeholder="제재 사유를 입력해주세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setIsSanctionModalOpen(false);
                      setSelectedReport(null);
                      setAdminComment('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSanctionSubmit}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    제재 처리
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* 공지사항 상세 모달 */}
        {isNoticeDetailModalOpen && selectedNotice && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-gray-900">공지사항 상세</h2>
                    {(selectedNotice.is_important === 1 || selectedNotice.is_important === "1" || selectedNotice.is_important === true) && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        ⭐ 중요
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      setIsNoticeDetailModalOpen(false);
                      setSelectedNotice(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* 제목 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">제목</h3>
                    <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {selectedNotice.notice_title}
                    </div>
                  </div>

                  {/* 내용 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">내용</h3>
                    <div className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                      {selectedNotice.notice_content}
                    </div>
                  </div>

                  {/* 정보 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">작성일</h3>
                      <div className="text-gray-700">
                        {new Date(selectedNotice.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">조회수</h3>
                      <div className="text-gray-700">
                        {selectedNotice.view_count?.toLocaleString() || 0}회
                      </div>
                    </div>
                  </div>

                  {/* 버튼 */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setIsNoticeDetailModalOpen(false);
                        setSelectedNotice(null);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      닫기
                    </button>
                    <button
                      onClick={() => {
                        setIsNoticeDetailModalOpen(false);
                        openNoticeModal(selectedNotice);
                      }}
                      className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      수정
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 문의사항 상세 모달 */}
        {isInquiryDetailModalOpen && selectedInquiry && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-gray-900">문의사항 상세</h2>
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      selectedInquiry.inquiry_status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedInquiry.inquiry_status === 'pending' ? '답변 대기' : '답변 완료'}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsInquiryDetailModalOpen(false);
                      setSelectedInquiry(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* 제목 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">제목</h3>
                    <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {selectedInquiry.inquiry_title}
                    </div>
                  </div>

                  {/* 내용 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">내용</h3>
                    <div className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                      {selectedInquiry.inquiry_content}
                    </div>
                  </div>

                  {/* 정보 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">작성자</h3>
                      <div className="text-gray-700">
                        {selectedInquiry.user_name || '사용자'}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">작성일</h3>
                      <div className="text-gray-700">
                        {new Date(selectedInquiry.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* 답변 */}
                  {selectedInquiry.inquiry_status === 'answered' && selectedInquiry.answer && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">답변</h3>
                      <div className="text-gray-700 bg-blue-50 p-4 rounded-lg whitespace-pre-wrap border-l-4 border-blue-500">
                        {selectedInquiry.answer.answer_content}
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        답변일: {new Date(selectedInquiry.answer.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* 버튼 */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setIsInquiryDetailModalOpen(false);
                        setSelectedInquiry(null);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      닫기
                    </button>
                    {selectedInquiry.inquiry_status === 'pending' && (
                      <button
                        onClick={() => {
                          setIsInquiryDetailModalOpen(false);
                          setIsInquiryReplyModalOpen(true);
                        }}
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        답변하기
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 문의사항 답변 모달 */}
        {isInquiryReplyModalOpen && selectedInquiry && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">문의사항 답변</h2>
                  <button 
                    onClick={() => {
                      setIsInquiryReplyModalOpen(false);
                      setSelectedInquiry(null);
                      setInquiryReplyForm({ reply_content: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 문의사항 정보 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">{selectedInquiry.inquiry_title}</h3>
                    <p className="text-gray-600 text-sm">{selectedInquiry.inquiry_content}</p>
                  </div>

                  {/* 답변 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      답변 내용 *
                    </label>
                    <textarea
                      value={inquiryReplyForm.reply_content}
                      onChange={(e) => setInquiryReplyForm(prev => ({ ...prev, reply_content: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="답변 내용을 입력하세요"
                      rows={8}
                    />
                  </div>

                  {/* 버튼 */}
                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setIsInquiryReplyModalOpen(false);
                        setSelectedInquiry(null);
                        setInquiryReplyForm({ reply_content: '' });
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleInquiryReply}
                      disabled={inquiryReplySubmitting}
                      className={`px-4 py-2 text-white rounded-lg transition-colors ${
                        inquiryReplySubmitting
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {inquiryReplySubmitting ? '답변 중...' : '답변 등록'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 공지사항 작성/수정 모달 */}
        {isNoticeModalOpen && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingNotice ? '공지사항 수정' : '공지사항 작성'}
                  </h2>
                  <button 
                    onClick={closeNoticeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 제목 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목 *
                    </label>
                    <input
                      type="text"
                      value={noticeForm.title}
                      onChange={(e) => setNoticeForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="공지사항 제목을 입력하세요"
                      maxLength={255}
                    />
                  </div>

                  {/* 내용 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      내용 *
                    </label>
                    <textarea
                      value={noticeForm.content}
                      onChange={(e) => setNoticeForm(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="공지사항 내용을 입력하세요"
                      rows={8}
                    />
                  </div>

                  {/* 중요 표시 체크박스 */}
                  <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <input
                      type="checkbox"
                      id="isImportant"
                      checked={noticeForm.isImportant}
                      onChange={(e) => setNoticeForm(prev => ({ ...prev, isImportant: e.target.checked }))}
                      className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    />
                    <label htmlFor="isImportant" className="text-sm font-medium text-gray-700 cursor-pointer">
                      ⭐ 중요 공지사항으로 설정
                    </label>
                  </div>

                  {/* 버튼 */}
                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <button
                      onClick={closeNoticeModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleNoticeSubmit}
                      disabled={noticeSubmitting}
                      className={`px-4 py-2 text-white rounded-lg transition-colors ${
                        noticeSubmitting
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {noticeSubmitting 
                        ? (editingNotice ? '수정 중...' : '작성 중...')
                        : (editingNotice ? '수정' : '작성')
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
