import { test, expect } from '@playwright/test';

test.describe('제보 수정/삭제 플로우', () => {
  const testPassword = '9876';
  
  test.beforeEach(async ({ page }) => {
    // 테스트용 제보 생성
    await page.goto('/report');
    await page.selectOption('select[name="campus"]', '부산캠퍼스');
    await page.fill('input[name="building"]', '학생회관');
    await page.fill('input[name="location"]', '1층 카페테리아');
    await page.check('input[value="특정 사이트 접속 불가"]');
    await page.fill('textarea[name="description"]', '학생회관 1층 카페테리아에서 특정 사이트에 접속이 안 됩니다. 유튜브와 넷플릭스 접속이 차단되어 있는 것 같습니다.');
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/reports');
  });

  test('올바른 비밀번호로 제보를 수정할 수 있다', async ({ page }) => {
    // 제보 상세 페이지로 이동
    await page.click('.report-card:first-child');
    
    // 수정 버튼 클릭
    await page.click('button:has-text("수정")');
    
    // 비밀번호 모달 확인
    await expect(page.locator('text=비밀번호를 입력해주세요')).toBeVisible();
    
    // 올바른 비밀번호 입력
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("확인")');
    
    // 수정 페이지로 이동 확인
    await expect(page).toHaveURL(/\/reports\/.*\/edit/);
    
    // 기존 데이터가 로드되었는지 확인
    await expect(page.locator('select[name="campus"]')).toHaveValue('부산캠퍼스');
    await expect(page.locator('input[name="building"]')).toHaveValue('학생회관');
    await expect(page.locator('input[name="location"]')).toHaveValue('1층 카페테리아');
    
    // 내용 수정
    await page.fill('input[name="location"]', '1층 카페테리아 (창가 쪽)');
    await page.fill('textarea[name="description"]', '학생회관 1층 카페테리아 창가 쪽에서 특정 사이트 접속이 안 됩니다. 유튜브와 넷플릭스뿐만 아니라 인스타그램도 접속이 어렵습니다.');
    
    // 수정 완료
    await page.click('button:has-text("수정 완료")');
    
    // 상세 페이지로 돌아가서 수정된 내용 확인
    await expect(page.locator('text=1층 카페테리아 (창가 쪽)')).toBeVisible();
    await expect(page.locator('text=인스타그램도 접속이 어렵습니다')).toBeVisible();
  });

  test('잘못된 비밀번호로 수정 시도 시 에러 메시지가 표시된다', async ({ page }) => {
    // 제보 상세 페이지로 이동
    await page.click('.report-card:first-child');
    
    // 수정 버튼 클릭
    await page.click('button:has-text("수정")');
    
    // 잘못된 비밀번호 입력
    await page.fill('input[type="password"]', '0000');
    await page.click('button:has-text("확인")');
    
    // 에러 메시지 확인
    await expect(page.locator('text=비밀번호가 일치하지 않습니다')).toBeVisible();
    
    // 수정 페이지로 이동하지 않음
    await expect(page).not.toHaveURL(/\/reports\/.*\/edit/);
  });

  test('올바른 비밀번호로 제보를 삭제할 수 있다', async ({ page }) => {
    // 제보 상세 페이지로 이동
    await page.click('.report-card:first-child');
    
    // 삭제 버튼 클릭
    await page.click('button:has-text("삭제")');
    
    // 삭제 확인 모달
    await expect(page.locator('text=정말로 삭제하시겠습니까?')).toBeVisible();
    
    // 비밀번호 입력
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("삭제")');
    
    // 제보 목록으로 이동 확인
    await expect(page).toHaveURL('/reports');
    
    // 삭제된 제보가 목록에 없는지 확인
    await expect(page.locator('text=학생회관')).not.toBeVisible();
  });

  test('잘못된 비밀번호로 삭제 시도 시 에러 메시지가 표시된다', async ({ page }) => {
    // 제보 상세 페이지로 이동
    await page.click('.report-card:first-child');
    
    // 삭제 버튼 클릭
    await page.click('button:has-text("삭제")');
    
    // 잘못된 비밀번호 입력
    await page.fill('input[type="password"]', '1111');
    await page.click('button:has-text("삭제")');
    
    // 에러 메시지 확인
    await expect(page.locator('text=비밀번호가 일치하지 않습니다')).toBeVisible();
    
    // 제보가 삭제되지 않음 (모달이 여전히 열려있음)
    await expect(page.locator('text=정말로 삭제하시겠습니까?')).toBeVisible();
  });

  test('수정 페이지에서 취소 시 원래 페이지로 돌아간다', async ({ page }) => {
    // 제보 상세 페이지로 이동
    await page.click('.report-card:first-child');
    const reportUrl = page.url();
    
    // 수정 페이지로 이동
    await page.click('button:has-text("수정")');
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("확인")');
    
    // 수정 페이지에서 취소
    await page.click('button:has-text("취소")');
    
    // 원래 제보 상세 페이지로 돌아감
    await expect(page).toHaveURL(reportUrl);
  });
});