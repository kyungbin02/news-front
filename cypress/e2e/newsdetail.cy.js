describe('뉴스 상세 페이지 테스트', () => {
  it('뉴스 상세 페이지에 접속하여 주요 요소를 확인합니다', () => {
    // 뉴스 상세 페이지 방문 (id를 1로 가정)
    cy.visit('http://localhost:3008/news/1');
    
    // 헤더가 표시되는지 확인
    cy.get('header').should('be.visible');
    
    // 뉴스 제목이 표시되는지 확인
    cy.get('h1').should('be.visible');
    
    // 뉴스 본문이 표시되는지 확인
    cy.get('article').should('be.visible');
    
    // 기자 정보가 표시되는지 확인
    cy.contains('기자').should('exist');
    
    // 댓글 섹션이 표시되는지 확인
    cy.contains('댓글').should('be.visible');
    
    // 사이드바가 표시되는지 확인
    cy.get('aside').should('exist');
    
    // 푸터가 표시되는지 확인
    cy.get('footer').should('be.visible');
  });
}); 