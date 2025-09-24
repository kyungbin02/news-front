'use client';

import React, { useState, useEffect } from 'react';
import { getToken } from '@/utils/token';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield,
  Search
} from 'lucide-react';

export default function UsersPage() {
  // 사용자 관련 상태
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [sanctionedUsers, setSanctionedUsers] = useState<any[]>([]);
  const [sanctionedUsersLoading, setSanctionedUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 모달 열기/닫기 함수
  const openUserModal = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  // 관리자 정보 확인 (토큰 유효성 검증)
  const checkAdminInfo = async () => {
    try {
      const token = getToken();
      if (!token) {
        console.log('❌ 토큰이 없습니다.');
        return false;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const apiUrl = `${baseUrl}/api/admin/info`;
      
      console.log('🔍 관리자 정보 확인 요청:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 관리자 정보 응답 상태:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 관리자 정보 조회 성공:', data);
        return true;
      } else {
        console.log('❌ 관리자 정보 조회 실패:', response.status);
        return false;
      }
    } catch (error) {
      console.error('💥 관리자 정보 조회 오류:', error);
      return false;
    }
  };

  // 사용자 목록 가져오기
  const fetchUsers = async (page = 0, size = 10) => {
    setUsersLoading(true);
    try {
      // 먼저 관리자 정보 확인으로 토큰 유효성 검증
      console.log('🔍 1단계: 관리자 정보 확인으로 토큰 유효성 검증');
      const isAdminValid = await checkAdminInfo();
      
      if (!isAdminValid) {
        console.log('❌ 관리자 정보 조회 실패 - 토큰이 유효하지 않거나 권한이 없습니다.');
        setUsers([]);
        return;
      }
      
      console.log('✅ 관리자 정보 조회 성공 - 토큰이 유효합니다.');
      console.log('🔍 2단계: 사용자 목록 조회 시도');

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const apiUrl = `${baseUrl}/api/admin/users`;
      
      const token = getToken();
      if (!token) {
        console.log('❌ 토큰이 없습니다.');
        setUsers([]);
        return;
      }
      
      console.log('🔍 사용자 목록 요청:', apiUrl);
      console.log('🔍 Authorization 헤더:', `Bearer ${token.substring(0, 20)}...`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 사용자 목록 응답 상태:', response.status);
      console.log('🔍 사용자 목록 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ 사용자 목록 조회 성공 - 전체 응답:', data);
        console.log('🔍 응답 데이터 타입:', typeof data);
        console.log('🔍 users 필드 존재 여부:', 'users' in data);
        console.log('🔍 users 필드 타입:', typeof data.users);
        console.log('🔍 users 배열 여부:', Array.isArray(data.users));
        
        if (data.users && Array.isArray(data.users)) {
          console.log('✅ users 배열 길이:', data.users.length);
          console.log('🔍 첫 번째 사용자 데이터:', data.users[0]);
          setUsers(data.users);
        } else {
          console.log('⚠️ 예상과 다른 응답 형식:');
          console.log('   - data:', data);
          console.log('   - data.users:', data.users);
          console.log('   - data.users 타입:', typeof data.users);
          console.log('   - data.users 배열 여부:', Array.isArray(data.users));
          
          // 응답이 배열인 경우 직접 사용
          if (Array.isArray(data)) {
            console.log('✅ 응답이 직접 배열입니다. 길이:', data.length);
            setUsers(data);
          } else {
            setUsers([]);
          }
        }
      } else {
        console.log('❌ 사용자 목록 조회 실패:', response.status);
        let errorText = '';
        try {
          errorText = await response.text();
          console.log('❌ 오류 응답:', errorText);
        } catch (e) {
          console.log('❌ 오류 응답 읽기 실패:', e);
        }
        
        // API 실패 시 빈 배열로 설정
        setUsers([]);
      }
    } catch (error) {
      console.error('💥 사용자 목록 조회 오류:', error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // 제재된 사용자 목록 가져오기 (일반 사용자 목록에서 필터링)
  const fetchSanctionedUsers = async () => {
    setSanctionedUsersLoading(true);
    try {
      // 먼저 모든 사용자 목록을 가져옴
      const token = getToken();
      if (!token) {
        console.log('❌ 토큰이 없습니다.');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      const apiUrl = `${baseUrl}/api/admin/users/sanctioned`; // 큰 사이즈로 모든 사용자 가져오기
      
      console.log('🔍 제재된 사용자 필터링을 위한 전체 사용자 조회:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ 전체 사용자 목록 조회 성공 - 전체 응답:', data);
        console.log('🔍 제재된 사용자 필터링을 위한 데이터 분석:');
        console.log('   - data 타입:', typeof data);
        console.log('   - users 필드 존재:', 'users' in data);
        console.log('   - users 타입:', typeof data.users);
        console.log('   - users 배열 여부:', Array.isArray(data.users));
        
        let allUsers = [];
        
        if (data.users && Array.isArray(data.users)) {
          allUsers = data.users;
          console.log('✅ users 배열에서 데이터 추출, 길이:', allUsers.length);
        } else if (Array.isArray(data)) {
          allUsers = data;
          console.log('✅ 응답이 직접 배열, 길이:', allUsers.length);
        } else {
          console.log('⚠️ 예상과 다른 응답 형식:', data);
          setSanctionedUsers([]);
          return;
        }
        
        // 경고 또는 정지 상태인 사용자만 필터링
        const sanctionedUsers = allUsers.filter((user: any) => {
          const isSanctioned = user.user_status === 'warning' || user.user_status === 'suspended';
          if (isSanctioned) {
            console.log('🔍 제재된 사용자 발견:', user.username || user.userName, user.user_status);
          }
          return isSanctioned;
        });
        
        console.log('✅ 제재된 사용자 필터링 완료:', sanctionedUsers.length, '명');
        console.log('🔍 제재된 사용자 목록:', sanctionedUsers);
        setSanctionedUsers(sanctionedUsers);
      } else {
        console.log('❌ 전체 사용자 목록 조회 실패:', response.status);
        let errorText = '';
        try {
          errorText = await response.text();
          console.log('❌ 오류 응답:', errorText);
        } catch (e) {
          console.log('❌ 오류 응답 읽기 실패:', e);
        }
        setSanctionedUsers([]);
      }
    } catch (error) {
      console.error('💥 제재된 사용자 목록 조회 오류:', error);
      setSanctionedUsers([]);
    } finally {
      setSanctionedUsersLoading(false);
    }
  };


  useEffect(() => {
    // 사용자 데이터 로드
    fetchUsers();
    fetchSanctionedUsers();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">사용자 관리</h2>
      
      {/* 사용자 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">전체 사용자</dt>
                  <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">활성 사용자</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(user => user.user_status === 'active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">경고 사용자</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(user => user.user_status === 'warning').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">정지 사용자</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(user => user.user_status === 'suspended').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">사용자 목록</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">등록된 사용자들을 관리할 수 있습니다.</p>
        </div>
        <div className="border-t border-gray-200">
          {usersLoading ? (
            <div className="px-4 py-5 sm:px-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">사용자 목록을 불러오는 중...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 py-5 sm:px-6 text-center">
              <div className="text-gray-500">
                <p className="text-lg font-medium mb-2">등록된 사용자가 없습니다</p>
                <p className="text-sm">현재 데이터베이스에 사용자가 등록되지 않았습니다.</p>
                <button 
                  onClick={() => fetchUsers()}
                  className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  새로고침
                </button>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {(user.username || user.userName || '?').charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username || user.userName || '이름 없음'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email || '이메일 없음'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '알 수 없음'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.user_status === 'active' ? 'bg-green-100 text-green-800' :
                        user.user_status === 'warning' ? 'bg-orange-100 text-orange-800' :
                        user.user_status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.user_status === 'active' ? '활성' :
                         user.user_status === 'warning' ? '경고' :
                         user.user_status === 'suspended' ? '정지' :
                         user.user_status || '알 수 없음'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => openUserModal(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 제재된 사용자 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">제재된 사용자</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">제재를 받은 사용자들의 목록입니다.</p>
        </div>
        <div className="border-t border-gray-200">
          {sanctionedUsersLoading ? (
            <div className="px-4 py-5 sm:px-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">제재된 사용자 목록을 불러오는 중...</p>
            </div>
          ) : sanctionedUsers.length === 0 ? (
            <div className="px-4 py-5 sm:px-6 text-center">
              <p className="text-gray-500">제재된 사용자가 없습니다.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {sanctionedUsers.map((user) => (
                <li key={user.user_id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-red-700">
                              {(user.username || user.userName || '?').charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">{user.username || user.userName || '이름 없음'}</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {user.user_status === 'warning' ? '경고' : '정지'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{user.email || '이메일 없음'}</p>
                          {user.sanction_reason && (
                            <p className="text-xs text-red-600">
                              사유: {user.sanction_reason}
                            </p>
                          )}
                          <div className="text-xs text-gray-400 space-y-1">
                            <p>
                              제재 시작: {user.sanction_start_date ? new Date(user.sanction_start_date).toLocaleDateString() : '알 수 없음'}
                            </p>
                            {user.sanction_end_date && (
                              <p>
                                제재 종료: {new Date(user.sanction_end_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 사용자 상세 모달 */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">사용자 상세 정보</h3>
                <button
                  onClick={closeUserModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 사용자 정보 */}
              <div className="space-y-4">
                {/* 프로필 섹션 */}
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-2xl font-medium text-gray-700">
                      {(selectedUser.username || selectedUser.userName || '?').charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">
                      {selectedUser.username || selectedUser.userName || '이름 없음'}
                    </h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedUser.user_status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedUser.user_status === 'warning' ? 'bg-orange-100 text-orange-800' :
                      selectedUser.user_status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedUser.user_status === 'active' ? '활성' :
                       selectedUser.user_status === 'warning' ? '경고' :
                       selectedUser.user_status === 'suspended' ? '정지' :
                       selectedUser.user_status || '알 수 없음'}
                    </span>
                  </div>
                </div>

                {/* 상세 정보 */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">이메일</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email || '이메일 없음'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">가입일</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '알 수 없음'}
                    </p>
                  </div>

                  {selectedUser.user_status === 'suspended' && selectedUser.sanction_reason && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">제재 사유</label>
                      <p className="mt-1 text-sm text-red-600">{selectedUser.sanction_reason}</p>
                    </div>
                  )}

                  {selectedUser.user_status === 'suspended' && selectedUser.sanction_start_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">제재 시작일</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedUser.sanction_start_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {selectedUser.user_status === 'suspended' && selectedUser.sanction_end_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">제재 종료일</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedUser.sanction_end_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeUserModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
