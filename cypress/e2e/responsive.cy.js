describe('반응형 디자인 테스트', () => {
  it('모바일 화면에서 사이트가 제대로 표시되는지 확인합니다', () => {
    // 모바일 뷰포트 설정
    cy.viewport('iphone-x');
    
    // 홈페이지 방문
    cy.visit('http://localhost:3008');
    
    // 모바일 메뉴 버튼이 표시되는지 확인
    cy.get('button[aria-label="메뉴"]').should('be.visible');
    
    // 모바일 메뉴 버튼 클릭
    cy.get('button[aria-label="메뉴"]').click();
    
    // 모바일 메뉴가 열렸는지 확인
    cy.contains('MY 뉴스').should('be.visible');
    
    // 타블렛 뷰포트로 변경
    cy.viewport('ipad-2');
    
    // 레이아웃이 조정되는지 확인
    cy.get('.grid.grid-cols-3').should('not.exist');
    cy.get('.grid').should('exist');
  });
}); 