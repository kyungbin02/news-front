describe('사용자 흐름 테스트', () => {
  it('뉴스 기사를 클릭하고 댓글을 작성하는 전체 흐름을 테스트합니다', () => {
    // 홈페이지 방문
    cy.visit('http://localhost:3008');
    
    // 첫 번째 뉴스 카드 클릭
    cy.get('.grid.grid-cols-3 .bg-white.rounded').first().click();
    
    // 상세 페이지로 이동했는지 확인
    cy.url().should('include', '/news/');
    
    // 제목 확인
    cy.get('h1').should('be.visible');
    
    // 기사 내용 확인
    cy.get('article').should('be.visible');
    
    // 댓글 영역으로 스크롤
    cy.contains('댓글').scrollIntoView();
    
    // 댓글 입력
    cy.get('textarea').type('사이프레스로 작성한 테스트 댓글입니다.');
    
    // 등록 버튼 클릭
    cy.contains('등록').click();
    
    // 댓글이 추가되었는지 확인
    cy.contains('사이프레스로 작성한 테스트 댓글입니다.').should('be.visible');
  });
}); 