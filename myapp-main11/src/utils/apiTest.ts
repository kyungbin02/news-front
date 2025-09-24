// API 테스트 유틸리티
import { getToken } from './token';

export interface ApiTestResult {
  endpoint: string;
  status: number;
  success: boolean;
  error?: string;
  data?: any;
}

// 단일 API 엔드포인트 테스트
export const testApiEndpoint = async (endpoint: string, method: string = 'GET', body?: any): Promise<ApiTestResult> => {
  try {
    const token = getToken();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
    const fullUrl = `${baseUrl}${endpoint}`;
    
    console.log(`🔍 API 테스트: ${method} ${fullUrl}`);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    }).catch(error => {
      console.log(`❌ API 테스트 네트워크 오류: ${fullUrl}`, error.message);
      return {
        ok: false,
        status: 0,
        text: () => Promise.resolve('Network error'),
        headers: new Headers()
      } as Response;
    });
    
    const result: ApiTestResult = {
      endpoint: fullUrl,
      status: response.status,
      success: response.ok
    };
    
    if (response.ok) {
      try {
        result.data = await response.json();
      } catch (e) {
        try {
          result.data = await response.text();
        } catch (textError) {
          result.data = 'Response body could not be read';
        }
      }
    } else {
      try {
        result.error = await response.text();
      } catch (e) {
        result.error = 'Error response could not be read';
      }
    }
    
    // 401 오류는 예상된 결과이므로 조용히 처리
    if (result.status === 401) {
      console.log(`⚠️ API 테스트 401 (예상됨): ${fullUrl}`);
    } else {
      console.log(`📊 API 테스트 결과: ${fullUrl}`, result);
    }
    return result;
    
  } catch (error) {
    console.error(`💥 API 테스트 오류: ${endpoint}`, error);
    return {
      endpoint: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'}${endpoint}`,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// 여러 API 엔드포인트 일괄 테스트
export const testMultipleEndpoints = async (endpoints: string[], method: string = 'GET'): Promise<ApiTestResult[]> => {
  console.log(`🔍 다중 API 테스트 시작: ${endpoints.length}개 엔드포인트`);
  
  const results: ApiTestResult[] = [];
  
  for (const endpoint of endpoints) {
    const result = await testApiEndpoint(endpoint, method);
    results.push(result);
    
    // 요청 간 간격 (서버 부하 방지)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`📊 다중 API 테스트 완료:`, results);
  return results;
};

// 관리자 API 엔드포인트 테스트
export const testAdminEndpoints = async (): Promise<ApiTestResult[]> => {
  const adminEndpoints = [
    '/api/admin/info',
    '/api/admin/users',
    '/api/admin/users/sanctioned',
    '/api/admin/user/1/status', // 특정 사용자 상태 조회 (테스트용 user_id: 1)
    '/api/admin/posts',
    '/api/admin/reports',
    '/api/admin/notices',
    '/api/admin/inquiries'
  ];
  
  return testMultipleEndpoints(adminEndpoints);
};

// 사용자 API 엔드포인트 테스트
export const testUserEndpoints = async (): Promise<ApiTestResult[]> => {
  const userEndpoints = [
    '/api/users',
    '/api/user/list',
    '/api/user/status',
    '/api/user/info'
  ];
  
  return testMultipleEndpoints(userEndpoints);
};

// 헬스체크 엔드포인트 테스트
export const testHealthEndpoints = async (): Promise<ApiTestResult[]> => {
  const healthEndpoints = [
    '/api/health',
    '/api/status',
    '/health',
    '/status',
    '/api/admin/health',
    '/api/admin/status'
  ];
  
  return testMultipleEndpoints(healthEndpoints);
};
