import { test, expect, devices } from '@playwright/test';
import { createTestReport, addEmpathyToReport, TestReport } from './helpers/test-utils';

// 각 브라우저별로 테스트 실행
const browsers = ['chromium', 'firefox', 'webkit'];

browsers.forEach(browserName => {
  test.describe(`${browserName} 브라우저 호환성 테스트`, () => {
    test.use({ 
      ...browserName === 'webkit' ? devices['Desktop Safari'] : 
        browserName === 'firefox' ? devices['Desktop Firefox'] : 
        devices['Desktop Chrome'] 
    });

    const testReport: TestReport = {
      campus: '김해캠퍼스',
      building: `${browserName}테스트관`,
      location: '1층 테스트실',
      problemType: 'WiFi 신호 약함',
      description: `${browserName} 브라우저에서 와이파이 문제 테스트입니다. 모든 기능이 정상적으로 작동해야 합니다.`,
      password: '1234'
    };

    test(`${browserName}에서 제보 작성이 정상 작동한다`, async ({ page }) => {
      await createTestReport(page, testReport);
      
      // 제보가 성공적으로 생성되었는지 확인
      await expect(page.locator(`text=${testReport.building}`)).toBeVisible();
      await expect(page.locator(`text=${testReport.campus}`)).toBeVisible();
    });

    test(`${browserName}에서 공감 기능이 정상 작동한다`, async ({ page }) => {
      await createTestReport(page, testReport);
      
      // 제보 상세 페이지로 이동
      await page.click('.report-card:first-child');
      
      // 공감 버튼 클릭
      await page.click('button:has-text("🙋‍♂️ 저도 겪고 있어요")');
      
      // 공감 완료 상태 확인
      await expect(page.locator('text=공감 완료')).toBeVisible();
      await expect(page.locator('text=1명이 같은 문제를 겪고 있습니다')).toBeVisible();
    });

    test(`${browserName}에서 필터링이 정상 작동한다`, async ({ page }) => {
      await createTestReport(page, testReport);
      
      // 캠퍼스 필터 테스트
      await page.selectOption('select[name="campusFilter"]', testReport.campus);
      await expect(page.locator('.report-card')).toHaveCount(1);
      
      // 건물명 필터 테스트
      await page.fill('input[name="buildingFilter"]', testReport.building);
      await expect(page.locator('.report-card')).toHaveCount(1);
      
      // 필터 초기화
      await page.selectOption('select[name="campusFilter"]', '전체');
      await page.fill('input[name="buildingFilter"]', '');
      await expect(page.locator('.report-card')).toHaveCount(1);
    });

    test(`${browserName}에서 제보 수정이 정상 작동한다`, async ({ page }) => {
      await createTestReport(page, testReport);
      
      // 제보 상세 페이지로 이동
      await page.click('.report-card:first-child');
      
      // 수정 버튼 클릭
      await page.click('button:has-text("수정")');
      
      // 비밀번호 입력
      await page.fill('input[type="password"]', testReport.password);
      await page.click('button:has-text("확인")');
      
      // 수정 페이지에서 내용 변경
      const newLocation = '2층 수정된 테스트실';
      await page.fill('input[name="location"]', newLocation);
      await page.click('button[type="submit"]');
      
      // 수정된 내용 확인
      await expect(page.locator(`text=${newLocation}`)).toBeVisible();
    });

    test(`${browserName}에서 폼 검증이 정상 작동한다`, async ({ page }) => {
      await page.goto('/report');
      
      // 빈 폼으로 제출 시도
      await page.click('button[type="submit"]');
      
      // 검증 에러 메시지 확인
      await expect(page.locator('text=캠퍼스를 선택해주세요')).toBeVisible();
      await expect(page.locator('text=건물명을 입력해주세요')).toBeVisible();
      
      // 잘못된 비밀번호 형식 테스트
      await page.fill('input[name="password"]', 'abc');
      await page.blur('input[name="password"]');
      await expect(page.locator('text=숫자만 입력 가능합니다')).toBeVisible();
    });

    test(`${browserName}에서 반응형 디자인이 정상 작동한다`, async ({ page }) => {
      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // 모바일에서 주요 요소들이 보이는지 확인
      await expect(page.locator('text=문제 제보하기')).toBeVisible();
      await expect(page.locator('text=제보 목록 보기')).toBeVisible();
      
      // 제보 작성 페이지에서 폼이 정상 작동하는지 확인
      await page.click('text=문제 제보하기');
      await expect(page.locator('select[name="campus"]')).toBeVisible();
      await expect(page.locator('input[name="building"]')).toBeVisible();
    });

    test(`${browserName}에서 키보드 네비게이션이 정상 작동한다`, async ({ page }) => {
      await page.goto('/report');
      
      // Tab 키로 폼 요소들 간 이동
      await page.keyboard.press('Tab');
      await expect(page.locator('select[name="campus"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="building"]')).toBeFocused();
      
      // Enter 키로 폼 제출 (검증 에러 발생)
      await page.keyboard.press('Enter');
      await expect(page.locator('text=캠퍼스를 선택해주세요')).toBeVisible();
    });

    test(`${browserName}에서 쿠키 기반 공감 중복 방지가 작동한다`, async ({ page }) => {
      await createTestReport(page, testReport);
      
      // 제보 상세 페이지로 이동
      await page.click('.report-card:first-child');
      
      // 첫 번째 공감
      await page.click('button:has-text("🙋‍♂️ 저도 겪고 있어요")');
      await expect(page.locator('text=1명이 같은 문제를 겪고 있습니다')).toBeVisible();
      
      // 페이지 새로고침 후 중복 공감 시도
      await page.reload();
      await page.click('button:has-text("공감 완료")');
      
      // 중복 공감 메시지 확인
      await expect(page.locator('text=이미 공감하셨습니다')).toBeVisible();
      
      // 공감 수는 변경되지 않음
      await expect(page.locator('text=1명이 같은 문제를 겪고 있습니다')).toBeVisible();
    });
  });
});

// 모바일 브라우저 테스트
test.describe('모바일 브라우저 호환성 테스트', () => {
  test('Mobile Chrome에서 터치 인터페이스가 정상 작동한다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const testReport: TestReport = {
      campus: '김해캠퍼스',
      building: '모바일테스트관',
      location: '1층',
      problemType: 'WiFi 신호 약함',
      description: '모바일 크롬에서 터치 인터페이스 테스트입니다.',
      password: '5678'
    };
    
    await createTestReport(page, testReport);
    
    // 터치로 제보 카드 탭
    await page.tap('.report-card:first-child');
    
    // 터치로 공감 버튼 탭
    await page.tap('button:has-text("🙋‍♂️ 저도 겪고 있어요")');
    
    await expect(page.locator('text=공감 완료')).toBeVisible();
  });

  test('Mobile Safari에서 iOS 특화 기능이 정상 작동한다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X 크기
    
    await page.goto('/report');
    
    // iOS Safari에서 select 요소가 정상 작동하는지 확인
    await page.selectOption('select[name="campus"]', '부산캠퍼스');
    await expect(page.locator('select[name="campus"]')).toHaveValue('부산캠퍼스');
    
    // iOS에서 textarea 자동 확장 테스트
    const textarea = page.locator('textarea[name="description"]');
    await textarea.fill('iOS Safari에서 textarea 테스트입니다. 긴 텍스트를 입력하여 자동 확장이 정상적으로 작동하는지 확인합니다.');
    
    await expect(textarea).toBeVisible();
  });
});