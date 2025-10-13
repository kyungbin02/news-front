'use client';

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState('');
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [currentCompany, setCurrentCompany] = useState('');

  const policies = {
    terms: {
      title: '이용약관',
      content: `
제1조 (목적)
이 약관은 뉴스포털(이하 "회사")이 제공하는 온라인 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"란 회사가 제공하는 뉴스, 정보 및 기타 온라인 서비스를 의미합니다.
2. "이용자"란 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 의미합니다.

제3조 (약관의 효력 및 변경)
1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력을 발생합니다.
2. 회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 화면에 공지함으로써 효력을 발생합니다.

제4조 (서비스의 제공)
1. 회사는 다음과 같은 업무를 수행합니다:
   - 뉴스 및 정보 제공
   - 칼럼 및 오피니언 제공
   - 기타 회사가 정하는 업무

제5조 (서비스의 중단)
1. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.
      `
    },
    privacy: {
      title: '개인정보처리방침',
      content: `
제1조 (개인정보의 처리목적)
뉴스포털은 다음의 목적을 위하여 개인정보를 처리합니다:
1. 회원 가입 및 관리
2. 서비스 제공 및 개선
3. 고객 상담 및 문의 처리
4. 마케팅 및 광고 활용

제2조 (개인정보의 처리 및 보유기간)
1. 회사는 정보주체로부터 개인정보를 수집할 때 동의받은 보유·이용기간 또는 법령에 따른 보유·이용기간 내에서 개인정보를 처리·보유합니다.
2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
   - 회원 정보: 회원 탈퇴 시까지
   - 서비스 이용 기록: 3년

제3조 (개인정보의 제3자 제공)
회사는 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.

제4조 (개인정보처리의 위탁)
회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
- 위탁받는 자: (위탁업체명)
- 위탁하는 업무의 내용: 서버 운영 및 관리
      `
    },
    youth: {
      title: '청소년보호정책',
      content: `
제1조 (목적)
뉴스포털은 청소년이 건전한 인터넷 환경에서 안전하게 인터넷을 이용할 수 있도록 청소년 보호를 위한 정책을 수립하여 시행하고 있습니다.

제2조 (청소년 보호를 위한 노력)
1. 청소년에게 유해한 정보에 대한 접근을 제한하는 기술적 조치를 취합니다.
2. 청소년 보호를 위한 교육 및 캠페인을 실시합니다.
3. 청소년 유해매체물에 대한 신고를 접수하고 처리합니다.

제3조 (청소년 유해정보 차단)
1. 회사는 청소년에게 유해한 정보가 포함된 콘텐츠를 차단하거나 제한합니다.
2. 이용자가 청소년 유해정보를 신고할 수 있는 시스템을 운영합니다.

제4조 (청소년 보호 책임자)
청소년 보호를 위한 책임자 정보:
- 성명: 문민원 소경빈
- 소속: 뉴스포털 청소년보호팀
- 연락처: 02-1234-5678
- 이메일: thrudqls13@naver.com
      `
    },
    copyright: {
      title: '저작권정책',
      content: `
제1조 (저작권의 귀속)
1. 뉴스포털이 제공하는 서비스의 저작권은 회사에 귀속됩니다.
2. 이용자가 서비스 내에 게시한 게시물의 저작권은 이용자에게 귀속됩니다.

제2조 (게시물의 저작권)
1. 이용자는 서비스를 이용하여 취득한 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.

제3조 (저작권 침해 신고)
저작권 침해 신고는 다음 연락처로 접수해 주시기 바랍니다:
- 이메일: thrudqls13@naver.com
- 전화: 02-1234-5678
- 담당자: 문민원 소경빈

제4조 (면책조항)
1. 회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않습니다.
2. 회사는 이용자 상호간 또는 이용자와 제3자 상호간에 서비스를 매개로 하여 발생한 분쟁에 대해서는 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임도 없습니다.
      `
    }
  };

  const openPolicyModal = (policyType: keyof typeof policies) => {
    setCurrentPolicy(policyType);
    setShowPolicyModal(true);
  };

  const closePolicyModal = () => {
    setShowPolicyModal(false);
    setCurrentPolicy('');
  };

  const companyInfo = {
    about: {
      title: '회사 소개',
      content: `
뉴스포털은 대한민국을 대표하는 종합 뉴스 플랫폼입니다.

📰 주요 서비스
• 실시간 뉴스 제공
• 카테고리별 뉴스 분류 (정치, 경제, 사회, 스포츠, IT 등)
• 칼럼 및 오피니언 제공
• 사용자 댓글 및 소통 기능
• 북마크 및 개인화 서비스

🎯 비전
신뢰할 수 있는 뉴스와 정보를 통해 시민들의 올바른 판단을 돕고, 
민주주의 발전에 기여하는 것을 목표로 합니다.

📈 성장 과정
• 2025년 5월: 뉴스포털 서비스 런칭
• 2025년 6월: AI 뉴스 요약 서비스 도입
• 2025년 7월: 사용자 맞춤형 뉴스 추천 시스템 구축
• 2025년 8월: 글로벌 뉴스 서비스 확장

🏢 회사 정보
• 설립일: 2025년 5월
• 본사: 미공개
• 직원 수: 2명
• 연매출: 미공개

📞 연락처
• 대표전화: 02-1234-5678
• 이메일: thrudqls13@naver.com
• 홈페이지: www.newsportal.com
      `
    },
    careers: {
      title: '채용 정보',
      content: `
뉴스포털과 함께 미래를 만들어갈 인재를 찾습니다.

🚀 채용 분야
• 프론트엔드 개발자 (React, Next.js)
• 백엔드 개발자 (Node.js, Java, Spring)
• 데이터 엔지니어 (Python, Big Data)
• AI/ML 엔지니어 (Machine Learning, NLP)
• UI/UX 디자이너
• 콘텐츠 에디터
• 마케팅 전문가
• 영업 담당자

💼 근무 환경
• 근무시간: 주 5일, 09:00-18:00 (유연근무제)
• 휴가: 연차, 경조휴가, 리프레시 휴가
• 복리후생: 4대보험, 건강검진, 교육비 지원
• 근무지: 서울 본사 (재택근무 가능)

📋 채용 절차
1. 서류 전형 (온라인 지원)
2. 코딩 테스트 / 포트폴리오 검토
3. 1차 면접 (직무 역량)
4. 2차 면접 (인성 및 적합성)
5. 최종 합격

🎯 우리가 찾는 인재
• 혁신적인 아이디어로 서비스를 개선할 수 있는 분
• 사용자 중심의 사고를 가진 분
• 팀워크를 중시하는 분
• 지속적인 학습 의지가 있는 분

📧 지원 방법
• 이메일: thrudqls13@naver.com
• 홈페이지: www.newsportal.com/careers
• 지원서 양식 다운로드 후 제출

💡 문의사항
채용 관련 문의는 언제든 연락주세요.
• 채용담당자: 문민원 소경빈 (02-1234-5679)
• 이메일: thrudqls13@naver.com
      `
    }
  };

  const openCompanyModal = (companyType: keyof typeof companyInfo) => {
    setCurrentCompany(companyType);
    setShowCompanyModal(true);
  };

  const closeCompanyModal = () => {
    setShowCompanyModal(false);
    setCurrentCompany('');
  };
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        {/* 메인 푸터 콘텐츠 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          {/* 회사 정보 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">뉴스포털</h3>
            <p className="text-sm text-gray-600 mb-4">
              신뢰할 수 있는 뉴스와 정보를 제공하는 종합 뉴스 플랫폼입니다.
            </p>
          </div>

          {/* 서비스 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">서비스</h3>
            <ul className="space-y-2">
              <li><Link href="/customer" className="text-sm text-gray-600 hover:text-[#e53e3e] transition-colors">고객센터</Link></li>
              <li><Link href="/customer" className="text-sm text-gray-600 hover:text-[#e53e3e] transition-colors">문의하기</Link></li>
              <li><Link href="/column" className="text-sm text-gray-600 hover:text-[#e53e3e] transition-colors">칼럼</Link></li>
            </ul>
          </div>

          {/* 정책 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">정책</h3>
            <ul className="space-y-2">
              <li><button onClick={() => openPolicyModal('terms')} className="text-sm text-gray-600 hover:text-[#e53e3e] transition-colors text-left">이용약관</button></li>
              <li><button onClick={() => openPolicyModal('privacy')} className="text-sm text-gray-600 hover:text-[#e53e3e] transition-colors text-left">개인정보처리방침</button></li>
              <li><button onClick={() => openPolicyModal('youth')} className="text-sm text-gray-600 hover:text-[#e53e3e] transition-colors text-left">청소년보호정책</button></li>
              <li><button onClick={() => openPolicyModal('copyright')} className="text-sm text-gray-600 hover:text-[#e53e3e] transition-colors text-left">저작권정책</button></li>
            </ul>
          </div>

          {/* 회사 정보 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">회사</h3>
            <ul className="space-y-2">
              <li><button onClick={() => openCompanyModal('about')} className="text-sm text-gray-600 hover:text-[#e53e3e] transition-colors text-left">회사 소개</button></li>
              <li><button onClick={() => openCompanyModal('careers')} className="text-sm text-gray-600 hover:text-[#e53e3e] transition-colors text-left">채용 정보</button></li>
            </ul>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 mb-4 md:mb-0">
              <p>© 2024 뉴스포털. All rights reserved.</p>
              <p className="mt-1">사업자등록번호: 123-45-67890 | 대표: 문민원 소경빈</p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>대한민국 서울특별시</span>
              <span>•</span>
              <span>Tel: 02-1234-5678</span>
            </div>
          </div>
        </div>
      </div>

      {/* 정책 모달 */}
      {showPolicyModal && currentPolicy && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">
                {policies[currentPolicy as keyof typeof policies].title}
              </h2>
              <button
                onClick={closePolicyModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-white">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                  {policies[currentPolicy as keyof typeof policies].content}
                </pre>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closePolicyModal}
                className="px-6 py-2 bg-[#e53e3e] text-white rounded-lg hover:bg-[#c53030] transition-colors font-medium"
              >
                확인
              </button>
        </div>
          </div>
        </div>
      )}

      {/* 회사 정보 모달 */}
      {showCompanyModal && currentCompany && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">
                {companyInfo[currentCompany as keyof typeof companyInfo].title}
              </h2>
              <button
                onClick={closeCompanyModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-white">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                  {companyInfo[currentCompany as keyof typeof companyInfo].content}
                </pre>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeCompanyModal}
                className="px-6 py-2 bg-[#e53e3e] text-white rounded-lg hover:bg-[#c53030] transition-colors font-medium"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}