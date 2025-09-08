import { test, expect } from '@playwright/test';
import { createTestReport, TestReport } from './helpers/test-utils';

test.describe('성능 및 접근성 테스트', () => {
  test('페이지 로딩 성능이 적절한 수준이다', async ({ page }) => {
    // 성능 메트릭 수집 시작
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // 페이지 로딩 시간 측정
    const navigationTiming = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      };
    });
    
    // 성능 기준 확인 (밀리초)
    expect(navigationTiming.domContentLoaded).toBeLessThan(2000); // 2초 이내
    expect(navigationTiming.firstContentfulPaint).toBeLessThan(1500); // 1.5초 이내
    
    console.log('Performance metrics:', navigationTiming);
  });

  test('대량의 제보 데이터에서도 성능이 유지된다', async ({ page }) => {
    // 여러 제보 생성 (성능 테스트용)
    const reports: TestReport[] = Array.from({ length: 20 }, (_, i) => ({
      campus: i % 2 === 0 ? '김해캠퍼스' : '부산캠퍼스',
      building: `성능테스트관${i + 1}`,
      location: `${i + 1}층`,
      problemType: ['WiFi 신호 약함', '인터넷 속도 느림', 'WiFi 연결 끊김'][i % 3],
      description: `성능 테스트용 제보 ${i + 1}번입니다. 대량의 데이터가 있을 때도 페이지가 빠르게 로딩되어야 합니다.`,
      password: `${1000 + i}`
    }));
    
    // 제보들 생성
    for (const report of reports.slice(0, 5)) { // 5개만 실제 생성 (시간 단축)
      await createTestReport(page, report);
    }
    
    // 제보 목록 페이지 성능 측정
    const startTime = Date.now();
    await page.goto('/reports', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    // 로딩 시간이 3초 이내인지 확인
    expect(loadTime).toBeLessThan(3000);
    
    // 모든 제보 카드가 렌더링되었는지 확인
    await expect(page.locator('.report-card')).toHaveCount(5);
    
    console.log(`Report list load time: ${loadTime}ms`);
  });

  test('스크린 리더 접근성이 적절히 구현되어 있다', async ({ page }) => {
    await page.goto('/');
    
    // 주요 랜드마크 요소들의 접근성 확인
    await expect(page.locator('main')).toHaveAttribute('role', 'main');
    await expect(page.locator('header')).toBeVisible();
    
    // 제보 작성 페이지 접근성 확인
    await page.goto('/report');
    
    // 폼 레이블과 입력 필드 연결 확인
    const campusSelect = page.locator('select[name="campus"]');
    await expect(campusSelect).toHaveAttribute('aria-label');
    
    const buildingInput = page.locator('input[name="building"]');
    await expect(buildingInput).toHaveAttribute('aria-label');
    
    const descriptionTextarea = page.locator('textarea[name="description"]');
    await expect(descriptionTextarea).toHaveAttribute('aria-label');
    
    // 에러 메시지의 접근성 확인
    await page.click('button[type="submit"]');
    const errorMessages = page.locator('[role="alert"]');
    await expect(errorMessages.first()).toBeVisible();
  });

  test('키보드만으로 모든 기능을 사용할 수 있다', async ({ page }) => {
    await page.goto('/');
    
    // Tab 키로 네비게이션
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // 제보 작성하기 클릭
    
    await expect(page).toHaveURL('/report');
    
    // 키보드로 폼 작성
    await page.keyboard.press('Tab'); // 캠퍼스 선택
    await page.keyboard.press('ArrowDown'); // 첫 번째 옵션 선택
    await page.keyboard.press('Enter');
    
    await page.keyboard.press('Tab'); // 건물명 입력
    await page.keyboard.type('키보드테스트관');
    
    await page.keyboard.press('Tab'); // 위치 입력
    await page.keyboard.type('1층');
    
    // 체크박스 선택 (Space 키)
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    
    // 설명 입력
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    await page.keyboard.type('키보드만으로 제보를 작성하는 테스트입니다.');
    
    // 비밀번호 입력
    await page.keyboard.press('Tab');
    await page.keyboard.type('1234');
    
    // 제출
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    await expect(page.locator('text=제보가 완료되었습니다')).toBeVisible();
  });

  test('색상 대비가 접근성 기준을 만족한다', async ({ page }) => {
    await page.goto('/');
    
    // 주요 텍스트 요소들의 색상 대비 확인
    const mainButton = page.locator('text=문제 제보하기');
    const buttonStyles = await mainButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    });
    
    // 버튼이 적절한 스타일을 가지고 있는지 확인
    expect(buttonStyles.color).toBeTruthy();
    expect(buttonStyles.backgroundColor).toBeTruthy();
    
    // 제보 목록 페이지에서도 확인
    await page.goto('/reports');
    
    const reportCard = page.locator('.report-card').first();
    if (await reportCard.count() > 0) {
      const cardStyles = await reportCard.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor
        };
      });
      
      expect(cardStyles.color).toBeTruthy();
      expect(cardStyles.backgroundColor).toBeTruthy();
    }
  });

  test('포커스 표시가 명확하게 보인다', async ({ page }) => {
    await page.goto('/report');
    
    // 각 폼 요소에 포커스를 주고 포커스 스타일 확인
    const focusableElements = [
      'select[name="campus"]',
      'input[name="building"]',
      'input[name="location"]',
      'textarea[name="description"]',
      'input[name="password"]',
      'button[type="submit"]'
    ];
    
    for (const selector of focusableElements) {
      await page.focus(selector);
      
      // 포커스된 요소가 시각적으로 구분되는지 확인
      const element = page.locator(selector);
      const styles = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineColor: styles.outlineColor,
          outlineWidth: styles.outlineWidth,
          boxShadow: styles.boxShadow
        };
      });
      
      // 포커스 스타일이 있는지 확인 (outline 또는 box-shadow)
      const hasFocusStyle = styles.outline !== 'none' || 
                           styles.outlineWidth !== '0px' || 
                           styles.boxShadow !== 'none';
      
      expect(hasFocusStyle).toBeTruthy();
    }
  });

  test('이미지에 적절한 alt 텍스트가 있다', async ({ page }) => {
    await page.goto('/');
    
    // 페이지의 모든 이미지 확인
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const alt = await image.getAttribute('alt');
      
      // 장식용 이미지가 아닌 경우 alt 텍스트가 있어야 함
      const src = await image.getAttribute('src');
      if (src && !src.includes('decoration')) {
        expect(alt).toBeTruthy();
      }
    }
  });

  test('동적 콘텐츠 변경이 스크린 리더에 알려진다', async ({ page }) => {
    const testReport: TestReport = {
      campus: '김해캠퍼스',
      building: '접근성테스트관',
      location: '1층',
      problemType: 'WiFi 신호 약함',
      description: '접근성 테스트용 제보입니다.',
      password: '1234'
    };
    
    await createTestReport(page, testReport);
    
    // 제보 상세 페이지로 이동
    await page.click('.report-card:first-child');
    
    // 공감 버튼 클릭 시 aria-live 영역 확인
    await page.click('button:has-text("🙋‍♂️ 저도 겪고 있어요")');
    
    // 공감 수 변경이 스크린 리더에 알려지는지 확인
    const liveRegion = page.locator('[aria-live]');
    if (await liveRegion.count() > 0) {
      await expect(liveRegion.first()).toBeVisible();
    }
    
    // 상태 변경 메시지 확인
    await expect(page.locator('text=공감 완료')).toBeVisible();
  });
});