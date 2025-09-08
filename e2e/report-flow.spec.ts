import { test, expect } from '@playwright/test';

test.describe('제보 작성부터 조회까지 전체 플로우', () => {
  test('사용자가 제보를 작성하고 목록에서 확인할 수 있다', async ({ page }) => {
    // 홈페이지 접속
    await page.goto('/');
    await expect(page).toHaveTitle(/와이파이 문제 제보/);

    // 제보 작성 페이지로 이동
    await page.click('text=문제 제보하기');
    await expect(page).toHaveURL('/report');

    // 제보 폼 작성
    await page.selectOption('select[name="campus"]', '김해캠퍼스');
    await page.fill('input[name="building"]', '공학관');
    await page.fill('input[name="location"]', '3층 301호');
    
    // 문제 유형 선택
    await page.check('input[value="WiFi 신호 약함"]');
    await page.check('input[value="인터넷 속도 느림"]');
    
    // 상세 설명 작성
    await page.fill('textarea[name="description"]', '공학관 3층 301호에서 와이파이 신호가 매우 약하고 인터넷 속도가 느려서 온라인 수업 수강에 어려움이 있습니다.');
    
    // 비밀번호 입력
    await page.fill('input[name="password"]', '1234');
    
    // 제보 제출
    await page.click('button[type="submit"]');
    
    // 성공 메시지 확인
    await expect(page.locator('text=제보가 완료되었습니다')).toBeVisible();
    
    // 제보 목록 페이지로 이동 확인
    await expect(page).toHaveURL('/reports');
    
    // 작성한 제보가 목록에 표시되는지 확인
    await expect(page.locator('text=공학관')).toBeVisible();
    await expect(page.locator('text=김해캠퍼스')).toBeVisible();
    await expect(page.locator('text=WiFi 신호 약함')).toBeVisible();
  });

  test('필수 정보 누락 시 에러 메시지가 표시된다', async ({ page }) => {
    await page.goto('/report');
    
    // 필수 정보 없이 제출 시도
    await page.click('button[type="submit"]');
    
    // 에러 메시지 확인
    await expect(page.locator('text=캠퍼스를 선택해주세요')).toBeVisible();
    await expect(page.locator('text=건물명을 입력해주세요')).toBeVisible();
    await expect(page.locator('text=최소 20자 이상 입력해주세요')).toBeVisible();
    await expect(page.locator('text=4자리 숫자를 입력해주세요')).toBeVisible();
  });

  test('비밀번호 형식 검증이 작동한다', async ({ page }) => {
    await page.goto('/report');
    
    // 잘못된 비밀번호 형식 입력
    await page.fill('input[name="password"]', '12a4');
    await page.blur('input[name="password"]');
    await expect(page.locator('text=숫자만 입력 가능합니다')).toBeVisible();
    
    // 3자리 비밀번호 입력
    await page.fill('input[name="password"]', '123');
    await page.blur('input[name="password"]');
    await expect(page.locator('text=4자리 숫자를 입력해주세요')).toBeVisible();
    
    // 올바른 비밀번호 입력
    await page.fill('input[name="password"]', '1234');
    await page.blur('input[name="password"]');
    await expect(page.locator('text=숫자만 입력 가능합니다')).not.toBeVisible();
    await expect(page.locator('text=4자리 숫자를 입력해주세요')).not.toBeVisible();
  });
});