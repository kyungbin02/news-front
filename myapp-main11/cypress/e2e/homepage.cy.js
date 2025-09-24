describe('홈페이지 테스트', () => {
  it('홈페이지에 접속하여 주요 요소를 확인합니다', () => {
    // 홈페이지 방문
    cy.visit('http://localhost:3008');
    
    // 헤더가 표시되는지 확인
    cy.get('header').should('be.visible');
    
    // 헤더에 로고가 있는지 확인
    cy.get('header').contains('뉴스포털').should('be.visible');
    
    // 사이드바가 표시되는지 확인 (div 태그로 수정)
    cy.get('.w-80').should('exist');
    
    // 인기 뉴스 섹션이 있는지 확인 - 먼저 뷰에 스크롤
    cy.contains('인기뉴스').scrollIntoView().should('be.visible');
    
    // 푸터가 표시되는지 확인 (div 태그로 수정)
    cy.get('.bg-white.border-t').scrollIntoView().should('be.visible');
  });
}); 