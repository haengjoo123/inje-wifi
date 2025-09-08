import { test, expect } from '@playwright/test';

test.describe('반응형 디자인 및 다양한 브라우저 호환성', () => {
  test('모바일 화면에서 제보 작성이 정상 작동한다', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/report');
    
    // 모바일에서 폼 요소들이 적절히 표시되는지 확인
    await expect(page.locator('select[name="campus"]')).toBeVisible();
    await expect(page.locator('input[name="building"]')).toBeVisible();
    
    // 터치 친화적 버튼 크기 확인
    const submitButton = page.locator('button[type="submit"]');
    const buttonBox = await submitButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThan(44); // 최소 터치 타겟 크기
    
    // 제보 작성 플로우 테스트
    await page.selectOption('select[name="campus"]', '김해캠퍼스');
    await page.fill('input[name="building"]', '모바일테스트관');
    await page.fill('input[name="location"]', '1층');
    await page.check('input[value="WiFi 신호 약함"]');
    await page.fill('textarea[name="description"]', '모바일에서 제보 작성 테스트입니다. 화면이 작아도 정상적으로 작동해야 합니다.');
    await page.fill('input[name="password"]', '1234');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=제보가 완료되었습니다')).toBeVisible();
  });

  test('태블릿 화면에서 제보 목록이 적절히 표시된다', async ({ page }) => {
    // 태블릿 뷰포트 설정
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // 테스트 제보 생성
    await page.goto('/report');
    await page.selectOption('select[name="campus"]', '김해캠퍼스');
    await page.fill('input[name="building"]', '태블릿테스트관');
    await page.fill('input[name="location"]', '2층');
    await page.check('input[value="인터넷 속도 느림"]');
    await page.fill('textarea[name="description"]', '태블릿에서 제보 목록 표시 테스트입니다.');
    await page.fill('input[name="password"]', '5678');
    await page.click('button[type="submit"]');
    
    // 제보 목록 확인
    await expect(page.locator('.report-card')).toBeVisible();
    
    // 태블릿에서 카드 레이아웃이 적절한지 확인
    const reportCard = page.locator('.report-card:first-child');
    const cardBox = await reportCard.boundingBox();
    expect(cardBox?.width).toBeLessThan(768); // 화면 너비보다 작아야 함
    expect(cardBox?.width).toBeGreaterThan(300); // 최소 너비 확보
  });

  test('데스크톱 화면에서 전체 레이아웃이 올바르게 표시된다', async ({ page }) => {
    // 데스크톱 뷰포트 설정
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/');
    
    // 헤더가 적절히 표시되는지 확인
    await expect(page.locator('header')).toBeVisible();
    
    // 메인 콘텐츠 영역 확인
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // 데스크톱에서 최대 너비 제한 확인
    const contentBox = await mainContent.boundingBox();
    expect(contentBox?.width).toBeLessThan(1200); // 최대 너비 제한
  });

  test('가로 모드 모바일에서 정상 작동한다', async ({ page }) => {
    // 가로 모드 모바일 뷰포트 설정
    await page.setViewportSize({ width: 667, height: 375 });
    
    await page.goto('/reports');
    
    // 가로 모드에서도 제보 카드들이 적절히 표시되는지 확인
    await expect(page.locator('.report-card')).toBeVisible();
    
    // 필터 컨트롤들이 접근 가능한지 확인
    await expect(page.locator('select[name="campusFilter"]')).toBeVisible();
    await expect(page.locator('input[name="buildingFilter"]')).toBeVisible();
  });

  test('키보드 네비게이션이 정상 작동한다', async ({ page }) => {
    await page.goto('/report');
    
    // Tab 키로 폼 요소들 간 이동
    await page.keyboard.press('Tab');
    await expect(page.locator('select[name="campus"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="building"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="location"]')).toBeFocused();
    
    // Enter 키로 체크박스 선택
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space'); // 첫 번째 체크박스 선택
    
    const firstCheckbox = page.locator('input[type="checkbox"]:first-child');
    await expect(firstCheckbox).toBeChecked();
  });

  test('고대비 모드에서 접근성이 유지된다', async ({ page }) => {
    // 고대비 모드 시뮬레이션을 위한 CSS 추가
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            background-color: white !important;
            color: black !important;
            border: 1px solid black !important;
          }
        }
      `
    });
    
    await page.goto('/');
    
    // 주요 요소들이 여전히 보이는지 확인
    await expect(page.locator('text=문제 제보하기')).toBeVisible();
    await expect(page.locator('text=제보 목록 보기')).toBeVisible();
  });

  test('폰트 크기 확대 시 레이아웃이 깨지지 않는다', async ({ page }) => {
    // 폰트 크기 150%로 확대
    await page.addStyleTag({
      content: `
        html {
          font-size: 150% !important;
        }
      `
    });
    
    await page.goto('/report');
    
    // 확대된 상태에서도 폼이 정상 작동하는지 확인
    await page.selectOption('select[name="campus"]', '김해캠퍼스');
    await page.fill('input[name="building"]', '확대테스트관');
    await page.fill('input[name="location"]', '1층');
    await page.check('input[value="WiFi 신호 약함"]');
    await page.fill('textarea[name="description"]', '폰트 크기 확대 상태에서의 테스트입니다.');
    await page.fill('input[name="password"]', '9999');
    
    // 제출 버튼이 여전히 클릭 가능한지 확인
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await page.click('button[type="submit"]');
    await expect(page.locator('text=제보가 완료되었습니다')).toBeVisible();
  });
});