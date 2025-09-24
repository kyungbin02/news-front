"use client";

import React, { useState, useEffect } from 'react';
import { getToken, isTokenValid, removeToken } from '@/utils/token';

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

interface Notice {
  notice_id: number;
  notice_title: string;
  notice_content: string;
  created_at: string;
  is_important: number;
  view_count: number;
}

interface Inquiry {
  inquiry_id: number;
  inquiry_title: string;
  inquiry_content: string;
  inquiry_status: 'pending' | 'answered';
  created_at: string;
  // 답변 관련 필드들 (백엔드 응답 구조에 맞춤)
  answer_content?: string;
  answer_created_at?: string;
  admin_username?: string;
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: "회원가입은 어떻게 하나요?",
    answer: "홈페이지 우측 상단의 '회원가입' 버튼을 클릭하시면 회원가입 페이지로 이동합니다. 이메일 인증 후 가입이 완료됩니다."
  },
  {
    id: 2,
    question: "비밀번호를 잊어버렸어요.",
    answer: "로그인 페이지의 '비밀번호 찾기' 링크를 클릭하시면 이메일로 비밀번호 재설정 링크를 보내드립니다."
  },
  {
    id: 3,
    question: "칼럼 작성은 어떻게 하나요?",
    answer: "로그인 후 상단 메뉴의 '칼럼 작성' 버튼을 클릭하시면 칼럼 작성 페이지로 이동합니다. 제목과 내용을 입력하시면 됩니다."
  },
  {
    id: 4,
    question: "댓글 작성이 안돼요.",
    answer: "로그인이 필요한 서비스입니다. 로그인 후 다시 시도해주세요."
  },
  {
    id: 5,
    question: "계정을 삭제하고 싶어요.",
    answer: "마이페이지의 '계정 설정'에서 계정 삭제가 가능합니다. 삭제된 계정은 복구가 불가능하니 신중하게 결정해주세요."
  }
];





export default function CustomerService() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedNotice, setExpandedNotice] = useState<number | null>(null);
  const [expandedInquiry, setExpandedInquiry] = useState<number | null>(null);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryTitle, setInquiryTitle] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);

  // 공지사항 목록 가져오기
  const fetchNotices = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      
      // 토큰이 있으면 헤더에 추가, 없으면 빈 헤더
      const token = localStorage.getItem('jwt_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('🔍 공지사항 API 호출:', {
        url: `${baseUrl}/api/notice/list`,
        token: token ? '있음' : '없음'
      });
      
      // 사용자용 API는 인증 없이도 접근 가능해야 함
      const response = await fetch(`${baseUrl}/api/notice/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('고객센터 공지사항 목록:', data);
        
        // 중요 공지사항을 맨 위로 정렬
        const sortedNotices = data.sort((a: Notice, b: Notice) => {
          // 중요 공지사항이 먼저
          if (a.is_important == 1 && b.is_important != 1) return -1;
          if (a.is_important != 1 && b.is_important == 1) return 1;
          
          // 중요도가 같으면 최신순
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setNotices(sortedNotices);
      } else {
        console.error('공지사항 목록 조회 실패:', response.status, response.statusText);
        setNotices([]);
      }
    } catch (error) {
      console.error('공지사항 목록 조회 오류:', error);
      setNotices([]);
    } finally {
      setNoticesLoading(false);
    }
  };

  // 문의사항 목록 가져오기
  const fetchInquiries = async () => {
    try {
      const token = getToken();
      console.log('🔍 토큰 확인:', {
        token: token ? '있음' : '없음',
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : '없음',
        isValid: token ? isTokenValid(token) : false
      });
      
      if (!token) {
        console.log('토큰이 없습니다.');
        setInquiries([]);
        setInquiriesLoading(false);
        return;
      }
      
      if (!isTokenValid(token)) {
        console.log('토큰 형식이 유효하지 않지만 API 호출을 시도합니다.');
        // 토큰 형식이 유효하지 않아도 API 호출을 시도해보기
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      
      console.log('🔍 관리자용 문의사항 목록 조회 API 호출:', {
        url: `${baseUrl}/api/admin/inquiry/list`,
        token: token ? '있음' : '없음',
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : '없음',
        isValid: isTokenValid(token)
      });
      
      const response = await fetch(`${baseUrl}/api/admin/inquiry/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 목록 조회 응답 상태:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('고객센터 문의사항 목록:', data);
        
        // 각 문의사항의 답변 정보 확인
        data.forEach((inquiry: any, index: number) => {
          console.log(`🔍 문의사항 ${index + 1}:`, {
            id: inquiry.inquiry_id,
            title: inquiry.inquiry_title,
            status: inquiry.inquiry_status,
            answer_content: inquiry.answer_content,
            answer_created_at: inquiry.answer_created_at,
            admin_username: inquiry.admin_username
          });
        });
        
        // 최신순으로 정렬
        const sortedInquiries = data.sort((a: Inquiry, b: Inquiry) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setInquiries(sortedInquiries);
      } else {
        // 401 에러인 경우 토큰 재확인
        if (response.status === 401) {
          console.error('🔐 인증 실패 - 토큰 확인 필요');
          console.log('현재 토큰:', token);
          console.log('토큰 유효성:', isTokenValid(token));
          
          // 토큰이 만료되었을 수 있으므로 토큰 제거
          removeToken();
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          setInquiries([]);
          return;
        }
        
        const errorText = await response.text();
        console.error('문의사항 목록 조회 실패:', response.status, response.statusText);
        console.error('오류 상세:', errorText);
        setInquiries([]);
      }
    } catch (error) {
      console.error('문의사항 목록 조회 오류:', error);
      setInquiries([]);
    } finally {
      setInquiriesLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchNotices();
    fetchInquiries();
  }, []);

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const toggleNotice = async (id: number) => {
    // 이미 열려있으면 닫기만
    if (expandedNotice === id) {
      setExpandedNotice(null);
      return;
    }

    try {
      // 공지사항 상세 조회 (조회수 증가)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/notice/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const noticeDetail = await response.json();
        console.log('공지사항 상세 조회:', noticeDetail);
        console.log('업데이트 전 조회수:', noticeDetail.view_count);
        
        // 목록의 해당 공지사항 업데이트 (조회수 포함)
        setNotices(prevNotices => {
          const updatedNotices = prevNotices.map(notice => {
            if (notice.notice_id === id) {
              console.log('업데이트 중:', notice.notice_title, '기존 조회수:', notice.view_count, '새 조회수:', noticeDetail.view_count);
              return { ...notice, view_count: noticeDetail.view_count };
            }
            return notice;
          });
          console.log('업데이트된 목록:', updatedNotices);
          return updatedNotices;
        });
        
        // 모달 열기
        setExpandedNotice(id);
      } else {
        console.error('공지사항 상세 조회 실패:', response.status);
        // 실패해도 모달은 열기
        setExpandedNotice(id);
      }
    } catch (error) {
      console.error('공지사항 상세 조회 오류:', error);
      // 오류가 있어도 모달은 열기
      setExpandedNotice(id);
    }
  };

  const toggleInquiry = async (id: number) => {
    // 이미 열려있으면 닫기만
    if (expandedInquiry === id) {
      setExpandedInquiry(null);
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 관리자용 API를 사용하여 답변 정보를 가져오기
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      
      console.log('🔍 관리자용 문의사항 목록에서 답변 정보 가져오기:', {
        url: `${baseUrl}/api/admin/inquiry/list`,
        inquiryId: id
      });
      
      const listResponse = await fetch(`${baseUrl}/api/admin/inquiry/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (listResponse.ok) {
        const listData = await listResponse.json();
        const foundInquiry = listData.find((item: any) => item.inquiry_id === id);
        
        if (foundInquiry) {
          console.log('🔍 목록에서 찾은 문의사항:', foundInquiry);
          console.log('🔍 답변 정보:', {
            answer_content: foundInquiry.answer_content,
            answer_created_at: foundInquiry.answer_created_at,
            admin_username: foundInquiry.admin_username,
            inquiry_status: foundInquiry.inquiry_status
          });
          
          // 목록의 해당 문의사항 업데이트 (답변 포함)
          setInquiries(prevInquiries => 
            prevInquiries.map(inquiry => 
              inquiry.inquiry_id === id 
                ? { ...inquiry, ...foundInquiry }
                : inquiry
            )
          );
        } else {
          console.log('목록에서 해당 문의사항을 찾을 수 없습니다.');
        }
      } else {
        console.error('문의사항 목록 조회 실패:', listResponse.status, listResponse.statusText);
        
        // 401 에러인 경우 토큰 재확인
        if (listResponse.status === 401) {
          console.error('🔐 인증 실패 - 토큰 확인 필요');
          removeToken();
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          return;
        }
      }
      
      // 모달 열기
      setExpandedInquiry(id);
    } catch (error) {
      console.error('문의사항 상세 조회 오류:', error);
      // 오류가 있어도 모달은 열기
      setExpandedInquiry(id);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inquiryTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!inquiryContent.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/inquiry/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inquiry_title: inquiryTitle,
          inquiry_content: inquiryContent
        })
      });

      if (response.ok) {
        alert('문의사항이 접수되었습니다.');
        setInquiryTitle('');
        setInquiryContent('');
        setIsInquiryModalOpen(false);
        // 문의사항 목록 새로고침
        fetchInquiries();
      } else {
        // 401 에러인 경우 토큰 재확인
        if (response.status === 401) {
          removeToken();
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        alert(`문의사항 접수 실패: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('문의사항 접수 오류:', error);
      alert('문의사항 접수 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">고객센터</h1>

        {/* 자주 묻는 질문 섹션 */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-[#e53e3e]">자주 묻는 질문</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {faqs.map((faq) => (
              <div key={faq.id} className="px-6 py-4">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full text-left flex items-center justify-between"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                      expandedFaq === faq.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFaq === faq.id && (
                  <div className="mt-4 text-gray-600 bg-gray-50 p-4 rounded-lg">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 공지사항 섹션 */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-[#e53e3e]">공지사항</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {noticesLoading ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500">공지사항을 불러오는 중...</div>
              </div>
            ) : notices.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500">등록된 공지사항이 없습니다.</div>
              </div>
            ) : (
              notices.map((notice) => (
                <div key={notice.notice_id} className="px-6 py-4">
                  <button
                    onClick={() => toggleNotice(notice.notice_id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{notice.notice_title}</h3>
                          {(notice.is_important == 1) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ⭐ 중요
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(notice.created_at).toLocaleDateString()} • 조회수 {notice.view_count?.toLocaleString() || 0}회
                        </p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                          expandedNotice === notice.notice_id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expandedNotice === notice.notice_id && (
                    <div className="mt-4 text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                      {notice.notice_content}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 문의사항 섹션 */}
        <div className="bg-white rounded-lg shadow-sm mb-8 mt-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-[#e53e3e]">문의사항</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {inquiriesLoading ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500">문의사항을 불러오는 중...</div>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500">문의하신 문의사항이 없습니다.</div>
              </div>
            ) : (
              inquiries.map((inquiry) => (
                <div key={inquiry.inquiry_id} className="px-6 py-4">
                  <button
                    onClick={() => toggleInquiry(inquiry.inquiry_id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{inquiry.inquiry_title}</h3>
                        <div className="flex items-center mt-1">
                          <p className="text-sm text-gray-500 mr-4">{new Date(inquiry.created_at).toLocaleDateString()}</p>
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            inquiry.inquiry_status === 'answered' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {inquiry.inquiry_status === 'answered' ? '답변완료' : '답변대기'}
                          </span>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                          expandedInquiry === inquiry.inquiry_id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expandedInquiry === inquiry.inquiry_id && (
                    <div className="mt-4 text-gray-600 bg-gray-50 p-4 rounded-lg">
                      {(() => { console.log('🔍 문의사항 상세 데이터:', {
                        inquiry_id: inquiry.inquiry_id,
                        status: inquiry.inquiry_status,
                        answer_content: inquiry.answer_content,
                        answer_created_at: inquiry.answer_created_at,
                        admin_username: inquiry.admin_username,
                        hasAnswer: !!inquiry.answer_content
                      }); return null; })()}
                      <div className="whitespace-pre-wrap">{inquiry.inquiry_content}</div>
                      {inquiry.inquiry_status === 'answered' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2">답변</h4>
                          {inquiry.answer_content && inquiry.answer_content.trim() ? (
                            <>
                              <div className="text-gray-600 bg-blue-50 p-3 rounded-lg whitespace-pre-wrap">
                                {inquiry.answer_content}
                              </div>
                              <div className="text-sm text-gray-500 mt-2 flex items-center justify-between">
                                <span>답변일: {inquiry.answer_created_at ? new Date(inquiry.answer_created_at).toLocaleDateString() : ''}</span>
                                {inquiry.admin_username && (
                                  <span>답변자: {inquiry.admin_username}</span>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="text-gray-500 italic">
                              답변 내용을 불러오는 중입니다...
                            </div>
                          )}
                        </div>
                      )}
                      {inquiry.inquiry_status === 'pending' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-500 italic">
                            답변을 기다리고 있습니다. 빠른 시일 내에 답변드리겠습니다.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setIsInquiryModalOpen(true)}
              className="bg-[#e53e3e] text-white py-1.5 px-4 rounded-lg hover:bg-[#c53030] transition-colors text-sm"
            >
              문의하기
            </button>
          </div>
        </div>
      </div>

      {/* 문의사항 작성 모달 */}
      {isMounted && isInquiryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#e53e3e]">문의사항 작성</h2>
              <button
                onClick={() => setIsInquiryModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleInquirySubmit} className="p-6">
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  id="title"
                  value={inquiryTitle}
                  onChange={(e) => setInquiryTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e53e3e] focus:border-transparent"
                  placeholder="문의사항 제목을 입력해주세요"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  id="content"
                  value={inquiryContent}
                  onChange={(e) => setInquiryContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e53e3e] focus:border-transparent h-32"
                  placeholder="문의사항 내용을 입력해주세요"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsInquiryModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-[#e53e3e] text-white py-2 px-4 rounded-lg hover:bg-[#c53030] transition-colors"
                >
                  문의하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 