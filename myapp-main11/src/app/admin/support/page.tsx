'use client';

import React, { useState, useEffect } from 'react';
import { getToken } from '@/utils/token';
import { 
  Headphones, 
  FileText,
  Clock,
  Search
} from 'lucide-react';

export default function SupportPage() {
  // 공지사항 목록 상태
  const [notices, setNotices] = useState<any[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [isNoticeDetailModalOpen, setIsNoticeDetailModalOpen] = useState(false);
  const [deletingNoticeId, setDeletingNoticeId] = useState<number | null>(null);
  
  // 공지사항 작성/수정 모달 상태
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [noticeForm, setNoticeForm] = useState({
    notice_title: '',
    notice_content: '',
    is_important: false
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

  // 공지사항 목록 가져오기
  const fetchNotices = async () => {
    setNoticesLoading(true);
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
        setNotices(data);
      } else {
        console.log('공지사항 목록 조회 실패:', response.status);
        setNotices([]);
      }
    } catch (error) {
      console.log('공지사항 목록 조회 오류:', error);
      setNotices([]);
    } finally {
      setNoticesLoading(false);
    }
  };

  // 문의사항 목록 가져오기
  const fetchInquiries = async () => {
    setInquiriesLoading(true);
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
        setInquiries(data);
      } else {
        console.log('문의사항 목록 조회 실패:', response.status);
        setInquiries([]);
      }
    } catch (error) {
      console.log('문의사항 목록 조회 오류:', error);
      setInquiries([]);
    } finally {
      setInquiriesLoading(false);
    }
  };

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
        notice_content: notice.notice_content
      });
      
      setNoticeForm({
        notice_title: notice.notice_title || '',
        notice_content: notice.notice_content || '',
        is_important: notice.is_important === 1 || notice.is_important === "1" || notice.is_important === true
      });
      setIsEditingNotice(true);
      setEditingNotice(notice);
    } else {
      // 새로 작성 모드
      setNoticeForm({
        notice_title: '',
        notice_content: '',
        is_important: false
      });
      setIsEditingNotice(false);
      setEditingNotice(null);
    }
    setIsNoticeModalOpen(true);
  };

  // 공지사항 제출 함수
  const handleNoticeSubmit = async () => {
    if (!noticeForm.notice_title.trim() || !noticeForm.notice_content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
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

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notice_title: noticeForm.notice_title,
          notice_content: noticeForm.notice_content,
          is_important: noticeForm.is_important ? 1 : 0
        })
      });

      if (response.ok) {
        alert(isEdit ? '공지사항이 수정되었습니다.' : '공지사항이 작성되었습니다.');
        setIsNoticeModalOpen(false);
        fetchNotices(); // 목록 새로고침
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`공지사항 ${isEdit ? '수정' : '작성'} 실패: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('공지사항 제출 오류:', error);
      alert('공지사항 제출 중 오류가 발생했습니다.');
    } finally {
      setNoticeSubmitting(false);
    }
  };

  // 문의사항 답변 제출 함수
  const handleInquiryReplySubmit = async () => {
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

  useEffect(() => {
    fetchNotices();
    fetchInquiries();
  }, []);

  return (
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
                  notices
                    .sort((a, b) => {
                      // 중요 공지사항을 먼저 정렬
                      const aImportant = a.is_important === 1 || a.is_important === "1" || a.is_important === true;
                      const bImportant = b.is_important === 1 || b.is_important === "1" || b.is_important === true;
                      
                      if (aImportant && !bImportant) return -1;
                      if (!aImportant && bImportant) return 1;
                      
                      // 중요도가 같으면 최신순으로 정렬
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    })
                    .map((notice) => (
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 문의사항</h3>
          
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
              inquiries
                .sort((a, b) => {
                  // 답변 대기(pending)인 것들을 먼저 정렬
                  if (a.inquiry_status === 'pending' && b.inquiry_status !== 'pending') return -1;
                  if (a.inquiry_status !== 'pending' && b.inquiry_status === 'pending') return 1;
                  // 같은 상태라면 최신순으로 정렬
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .slice(0, 4).map((inquiry) => (
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
                      <p className="text-sm text-gray-600 mb-2">{inquiry.inquiry_content}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>작성자: {inquiry.username}</span>
                        <span>{new Date(inquiry.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedInquiry(inquiry);
                          setIsInquiryDetailModalOpen(true);
                        }}
                        className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        보기
                      </button>
                      {inquiry.inquiry_status === 'pending' && (
                        <button 
                          onClick={() => {
                            setSelectedInquiry(inquiry);
                            setIsInquiryReplyModalOpen(true);
                          }}
                          className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
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

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedNotice.notice_title}</h3>
                  <div className="text-sm text-gray-500 mb-4">
                    작성일: {new Date(selectedNotice.created_at).toLocaleDateString()}
                    {selectedNotice.view_count && (
                      <span className="ml-4">조회수: {selectedNotice.view_count}</span>
                    )}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {selectedNotice.notice_content}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
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
      )}

      {/* 공지사항 작성/수정 모달 */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditingNotice ? '공지사항 수정' : '공지사항 작성'}
                </h2>
                <button 
                  onClick={() => {
                    setIsNoticeModalOpen(false);
                    setEditingNotice(null);
                    setNoticeForm({
                      notice_title: '',
                      notice_content: '',
                      is_important: false
                    });
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
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={noticeForm.notice_title}
                    onChange={(e) => setNoticeForm({...noticeForm, notice_title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="공지사항 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용 *
                  </label>
                  <textarea
                    value={noticeForm.notice_content}
                    onChange={(e) => setNoticeForm({...noticeForm, notice_content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={8}
                    placeholder="공지사항 내용을 입력하세요"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_important"
                    checked={noticeForm.is_important}
                    onChange={(e) => setNoticeForm({...noticeForm, is_important: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_important" className="ml-2 text-sm text-gray-700">
                    중요 공지사항으로 설정
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setIsNoticeModalOpen(false);
                    setEditingNotice(null);
                    setNoticeForm({
                      notice_title: '',
                      notice_content: '',
                      is_important: false
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleNoticeSubmit}
                  disabled={noticeSubmitting}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {noticeSubmitting ? '처리 중...' : (isEditingNotice ? '수정' : '작성')}
                </button>
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

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedInquiry.inquiry_title}</h3>
                  <div className="text-sm text-gray-500 mb-4">
                    작성자: {selectedInquiry.username} | 작성일: {new Date(selectedInquiry.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">문의 내용</h4>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {selectedInquiry.inquiry_content}
                    </div>
                  </div>
                </div>

                {selectedInquiry.answer_content && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">답변 내용</h4>
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700">
                        {selectedInquiry.answer_content}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
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
                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    답변하기
                  </button>
                )}
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedInquiry.inquiry_title}</h3>
                  <div className="text-sm text-gray-500 mb-4">
                    작성자: {selectedInquiry.username} | 작성일: {new Date(selectedInquiry.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">문의 내용</h4>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {selectedInquiry.inquiry_content}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    답변 내용 *
                  </label>
                  <textarea
                    value={inquiryReplyForm.reply_content}
                    onChange={(e) => setInquiryReplyForm({...inquiryReplyForm, reply_content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    placeholder="답변 내용을 입력하세요"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
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
                  onClick={handleInquiryReplySubmit}
                  disabled={inquiryReplySubmitting}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {inquiryReplySubmitting ? '처리 중...' : '답변 등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
