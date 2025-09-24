'use client';

import React, { useState, useEffect } from 'react';
import ColumnDetailModal from '../../column/ColumnDetailModal';
import { getToken } from '@/utils/token';
import { 
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  X
} from 'lucide-react';

export default function ReportsPage() {
  // 신고 관련 상태
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  
  // 제재 모달 상태
  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [sanctionType, setSanctionType] = useState('warning');
  const [adminComment, setAdminComment] = useState('');

  // 게시물 상세 모달 상태
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  useEffect(() => {
    fetchReports();
  }, []);

  // 신고 처리 함수
  const handleReportAction = async (reportId: number, action: string) => {
    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
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

      if (response.ok) {
        alert('신고 처리가 완료되었습니다.');
        fetchReports();
      } else {
        const errorText = await response.text();
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

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      
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

      if (response.ok) {
        alert('제재 처리가 완료되었습니다.');
        setIsSanctionModalOpen(false);
        setSelectedReport(null);
        setAdminComment('');
        fetchReports();
      } else {
        const errorText = await response.text();
        console.log('🚨 제재 오류 응답:', errorText);
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">신고내역</h2>
      
      {/* 신고 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                              신고자 사유: {report.report_content}
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
                            <AlertCircle className="h-3 w-3 mr-1" />
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
            fetchReports();
          }}
        />
      )}
    </div>
  );
}

