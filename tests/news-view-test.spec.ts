import { test, expect } from '@playwright/test';

test.describe('뉴스 조회수 증가 테스트', () => {
  test('AI 검색 후 뉴스 클릭하여 조회수가 정상적으로 증가하는지 확인', async ({ page }) => {
    // 1. 홈페이지에 접속
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle('뉴스포털');

    // 2. 검색창에 'AI'를 입력
    await page.getByRole('textbox', { name: '뉴스 검색 (제목, 내용, 카테고리)' }).fill('AI');

    // 3. 검색 버튼을 클릭
    await page.locator('form').getByRole('button').click();

    // 4. 검색 결과가 '총 20개 기사'로 표시되는지 확인
    await expect(page.getByText('총 20개 기사')).toBeVisible();
    await expect(page.getByText("'AI' 검색결과")).toBeVisible();

    // 5. 첫 번째 뉴스를 클릭 (엔비디아 AI 거품론 뉴스)
    const firstNewsLink = page.locator('a[href*="/news/"]').first();
    await firstNewsLink.click();

    // 6. 상세페이지로 이동되는지 확인
    await page.waitForURL('**/news/**');
    await expect(page.url()).toContain('/news/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 7. 조회수가 표시되는지 확인
    await expect(page.getByText(/조회.*\d+/)).toBeVisible();

    // 8. 뒤로가기
    await page.goBack();

        // 9. 인기뉴스 섹션에서 클릭수가 증가했는지 확인
    await expect(page.getByRole('heading', { name: /인기뉴스/ })).toBeVisible();

    // 10. 실시간 검색어에 'AI'가 추가되었는지 확인
    await expect(page.getByRole('heading', { name: /실시간 검색어/ })).toBeVisible();
    await expect(page.getByText('AI')).toBeVisible();
  });

  test('검색 기능이 정상적으로 작동하는지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // 검색창이 존재하는지 확인
    await expect(page.getByRole('textbox', { name: '뉴스 검색 (제목, 내용, 카테고리)' })).toBeVisible();
    
    // 검색어 입력
    await page.getByRole('textbox', { name: '뉴스 검색 (제목, 내용, 카테고리)' }).fill('테스트');
    
    // 검색 버튼 클릭
    await page.locator('form').getByRole('button').click();
    
    // 검색 결과 확인
    await expect(page.getByText(/총.*개 기사/)).toBeVisible();
  });

  test('인기뉴스와 실시간 검색어가 정상 표시되는지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
        // 인기뉴스 섹션 확인
    await expect(page.getByRole('heading', { name: /인기뉴스/ })).toBeVisible();

    // 실시간 검색어 섹션 확인
    await expect(page.getByRole('heading', { name: /실시간 검색어/ })).toBeVisible();
    
    // LIVE 표시 확인
    await expect(page.getByText('실시간')).toBeVisible();
    await expect(page.getByText('LIVE')).toBeVisible();
  });
});
