import { test, expect } from '@playwright/test';

test.describe('공감 기능 전체 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트용 제보 생성
    await page.goto('/report');
    await page.selectOption('select[name="campus"]', '김해캠퍼스');
    await page.fill('input[name="building"]', '도서관');
    await page.fill('input[name="location"]', '2층 열람실');
    await page.check('input[value="WiFi 연결 끊김"]');
    await page.fill('textarea[name="description"]', '도서관 2층 열람실에서 와이파이가 자주 끊어져서 공부하기 어렵습니다. 특히 오후 시간대에 더 심합니다.');
    await page.fill('input[name="password"]', '5678');
    await page.click('button[type="submit"]');
    await page.waitForURL('/reports');
  });

  test('사용자가 제보에 공감을 표시할 수 있다', async ({ page }) => {
    // 제보 목록에서 첫 번째 제보 클릭
    await page.click('.report-card:first-child');
    
    // 제보 상세 페이지 확인
    await expect(page.locator('text=도서관')).toBeVisible();
    await expect(page.locator('text=WiFi 연결 끊김')).toBeVisible();
    
    // 초기 공감 수 확인 (0명)
    await expect(page.locator('text=0명이 같은 문제를 겪고 있습니다')).toBeVisible();
    
    // 공감 버튼 클릭
    const empathyButton = page.locator('button:has-text("🙋‍♂️ 저도 겪고 있어요")');
    await expect(empathyButton).toBeVisible();
    await empathyButton.click();
    
    // 공감 완료 상태 확인
    await expect(page.locator('text=공감 완료')).toBeVisible();
    await expect(page.locator('text=1명이 같은 문제를 겪고 있습니다')).toBeVisible();
    
    // 버튼 색상 변경 확인 (클래스 변경)
    await expect(empathyButton).toHaveClass(/bg-blue-600/);
  });

  test('중복 공감 시도 시 메시지가 표시된다', async ({ page }) => {
    // 제보 상세 페이지로 이동
    await page.click('.report-card:first-child');
    
    // 첫 번째 공감
    await page.click('button:has-text("🙋‍♂️ 저도 겪고 있어요")');
    await expect(page.locator('text=1명이 같은 문제를 겪고 있습니다')).toBeVisible();
    
    // 두 번째 공감 시도
    await page.click('button:has-text("공감 완료")');
    
    // 중복 공감 메시지 확인
    await expect(page.locator('text=이미 공감하셨습니다')).toBeVisible();
    
    // 공감 수는 변경되지 않음
    await expect(page.locator('text=1명이 같은 문제를 겪고 있습니다')).toBeVisible();
  });

  test('제보 목록에서 공감 수가 실시간으로 업데이트된다', async ({ page }) => {
    // 제보 상세 페이지에서 공감
    await page.click('.report-card:first-child');
    await page.click('button:has-text("🙋‍♂️ 저도 겪고 있어요")');
    
    // 제보 목록으로 돌아가기
    await page.click('text=제보 목록');
    await expect(page).toHaveURL('/reports');
    
    // 목록에서 공감 수 업데이트 확인
    await expect(page.locator('.report-card:first-child').locator('text=공감 1')).toBeVisible();
  });

  test('공감순 정렬이 올바르게 작동한다', async ({ page }) => {
    // 여러 제보에 다른 수의 공감 추가
    // 첫 번째 제보에 공감
    await page.click('.report-card:first-child');
    await page.click('button:has-text("🙋‍♂️ 저도 겪고 있어요")');
    
    // 목록으로 돌아가서 공감순 정렬
    await page.click('text=제보 목록');
    await page.selectOption('select[name="sort"]', 'empathy');
    
    // 공감 수가 높은 제보가 먼저 표시되는지 확인
    const firstCard = page.locator('.report-card:first-child');
    await expect(firstCard.locator('text=공감 1')).toBeVisible();
  });
});