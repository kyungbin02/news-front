describe('오류 처리 테스트', () => {
  it('API 오류 발생 시 적절한 처리를 하는지 테스트합니다', () => {
    // API 요청 가로채기 및 오류 응답 반환
    cy.intercept('GET', '/api/news/*', {
      statusCode: 500,
      body: { error: '서버 오류' }
    }).as('newsApiError');
    
    // 뉴스 상세 페이지 방문
    cy.visit('http://localhost:3008/news/1');
    
    // API 요청이 실패했는지 확인
    cy.wait('@newsApiError');
    
    // 오류 메시지가 표시되는지 확인
    cy.contains('불러오기 실패').should('be.visible');
    
    // 재시도 버튼이 표시되는지 확인
    cy.contains('다시 시도').should('be.visible');
    
    // 재시도 버튼 클릭 시 API를 다시 호출하는지 확인
    cy.contains('다시 시도').click();
    cy.wait('@newsApiError');
  });
}); 