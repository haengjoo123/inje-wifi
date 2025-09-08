import { Page, expect } from '@playwright/test';

export interface TestReport {
  campus: string;
  building: string;
  location: string;
  problemType: string;
  description: string;
  password: string;
}

/**
 * 테스트용 제보를 생성하는 헬퍼 함수
 */
export async function createTestReport(page: Page, report: TestReport) {
  await page.goto('/report');
  await page.selectOption('select[name="campus"]', report.campus);
  await page.fill('input[name="building"]', report.building);
  await page.fill('input[name="location"]', report.location);
  await page.check(`input[value="${report.problemType}"]`);
  await page.fill('textarea[name="description"]', report.description);
  await page.fill('input[name="password"]', report.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/reports');
}

/**
 * 제보에 공감을 추가하는 헬퍼 함수
 */
export async function addEmpathyToReport(page: Page, reportIndex: number = 0) {
  const reportCards = page.locator('.report-card');
  await reportCards.nth(reportIndex).click();
  await page.click('button:has-text("🙋‍♂️ 저도 겪고 있어요")');
  await expect(page.locator('text=공감 완료')).toBeVisible();
  await page.click('text=제보 목록');
}

/**
 * 비밀번호 인증 후 제보 수정하는 헬퍼 함수
 */
export async function editReportWithPassword(page: Page, password: string, newData: Partial<TestReport>) {
  await page.click('button:has-text("수정")');
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("확인")');
  
  if (newData.building) {
    await page.fill('input[name="building"]', newData.building);
  }
  if (newData.location) {
    await page.fill('input[name="location"]', newData.location);
  }
  if (newData.description) {
    await page.fill('textarea[name="description"]', newData.description);
  }
  
  await page.click('button:has-text("수정 완료")');
}

/**
 * 비밀번호 인증 후 제보 삭제하는 헬퍼 함수
 */
export async function deleteReportWithPassword(page: Page, password: string) {
  await page.click('button:has-text("삭제")');
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("삭제")');
  await expect(page).toHaveURL('/reports');
}

/**
 * 필터 적용하는 헬퍼 함수
 */
export async function applyFilters(page: Page, campus?: string, building?: string, sort?: string) {
  if (campus) {
    await page.selectOption('select[name="campusFilter"]', campus);
  }
  if (building) {
    await page.fill('input[name="buildingFilter"]', building);
  }
  if (sort) {
    await page.selectOption('select[name="sort"]', sort);
  }
}

/**
 * 폼 검증 에러 확인하는 헬퍼 함수
 */
export async function expectValidationErrors(page: Page, errors: string[]) {
  for (const error of errors) {
    await expect(page.locator(`text=${error}`)).toBeVisible();
  }
}

/**
 * 제보 카드 개수 확인하는 헬퍼 함수
 */
export async function expectReportCount(page: Page, count: number) {
  await expect(page.locator('.report-card')).toHaveCount(count);
}

/**
 * 모바일 뷰포트로 설정하는 헬퍼 함수
 */
export async function setMobileViewport(page: Page) {
  await page.setViewportSize({ width: 375, height: 667 });
}

/**
 * 태블릿 뷰포트로 설정하는 헬퍼 함수
 */
export async function setTabletViewport(page: Page) {
  await page.setViewportSize({ width: 768, height: 1024 });
}

/**
 * 데스크톱 뷰포트로 설정하는 헬퍼 함수
 */
export async function setDesktopViewport(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
}