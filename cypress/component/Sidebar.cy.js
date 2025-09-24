import React from 'react';
import Sidebar from '../../src/components/Sidebar';
import { mount } from 'cypress/react18';

describe('사이드바 컴포넌트 테스트', () => {
  it('사이드바 컴포넌트가 올바르게 렌더링됩니다', () => {
    // 컴포넌트 마운트
    mount(<Sidebar />);
    
    // 인기뉴스 섹션이 있는지 확인
    cy.contains('인기뉴스').should('be.visible');
    
    // 실시간 검색어 섹션이 있는지 확인
    cy.contains('실시간 검색어').should('be.visible');
    
    // 뉴스 항목이 표시되는지 확인
    cy.get('li').should('have.length.at.least', 1);
  });
}); 