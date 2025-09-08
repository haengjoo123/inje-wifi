import { test, expect } from '@playwright/test';

test.describe('필터링 및 정렬 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 다양한 테스트 데이터 생성
    const testReports = [
      {
        campus: '김해캠퍼스',
        building: '공학관',
        location: '3층',
        problemType: 'WiFi 신호 약함',
        description: '공학관 3층에서 와이파이 신호가 약합니다. 수업 중에 연결이 자주 끊어져서 불편합니다.',
        password: '1111'
      },
      {
        campus: '부산캠퍼스',
        building: '의과대학',
        location: '2층 강의실',
        problemType: '인터넷 속도 느림',
        description: '의과대학 2층 강의실에서 인터넷 속도가 매우 느립니다. 동영상 시청이 어렵습니다.',
        password: '2222'
      },
      {
        campus: '김해캠퍼스',
        building: '도서관',
        location: '1층 열람실',
        problemType: 'WiFi 연결 끊김',
        description: '도서관 1층 열람실에서 와이파이가 자주 끊어집니다. 공부하기 어려운 상황입니다.',
        password: '3333'
      }
    ];

    // 테스트 제보들 생성
    for (const report of testReports) {
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
  });

  test('캠퍼스별 필터링이 올바르게 작동한다', async ({ page }) => {
    await page.goto('/reports');
    
    // 전체 제보 확인 (3개)
    await expect(page.locator('.report-card')).toHaveCount(3);
    
    // 김해캠퍼스 필터 적용
    await page.selectOption('select[name="campusFilter"]', '김해캠퍼스');
    
    // 김해캠퍼스 제보만 표시되는지 확인 (2개)
    await expect(page.locator('.report-card')).toHaveCount(2);
    await expect(page.locator('text=공학관')).toBeVisible();
    await expect(page.locator('text=도서관')).toBeVisible();
    await expect(page.locator('text=의과대학')).not.toBeVisible();
    
    // 부산캠퍼스 필터 적용
    await page.selectOption('select[name="campusFilter"]', '부산캠퍼스');
    
    // 부산캠퍼스 제보만 표시되는지 확인 (1개)
    await expect(page.locator('.report-card')).toHaveCount(1);
    await expect(page.locator('text=의과대학')).toBeVisible();
    await expect(page.locator('text=공학관')).not.toBeVisible();
    await expect(page.locator('text=도서관')).not.toBeVisible();
    
    // 전체 필터로 복원
    await page.selectOption('select[name="campusFilter"]', '전체');
    await expect(page.locator('.report-card')).toHaveCount(3);
  });

  test('건물명 검색 필터링이 올바르게 작동한다', async ({ page }) => {
    await page.goto('/reports');
    
    // 건물명으로 검색
    await page.fill('input[name="buildingFilter"]', '공학관');
    
    // 공학관 제보만 표시되는지 확인
    await expect(page.locator('.report-card')).toHaveCount(1);
    await expect(page.locator('text=공학관')).toBeVisible();
    await expect(page.locator('text=의과대학')).not.toBeVisible();
    await expect(page.locator('text=도서관')).not.toBeVisible();
    
    // 부분 검색 테스트
    await page.fill('input[name="buildingFilter"]', '대학');
    await expect(page.locator('.report-card')).toHaveCount(1);
    await expect(page.locator('text=의과대학')).toBeVisible();
    
    // 검색어 지우기
    await page.fill('input[name="buildingFilter"]', '');
    await expect(page.locator('.report-card')).toHaveCount(3);
  });

  test('최신순 정렬이 올바르게 작동한다', async ({ page }) => {
    await page.goto('/reports');
    
    // 기본 정렬은 최신순
    await expect(page.locator('select[name="sort"]')).toHaveValue('latest');
    
    // 가장 최근에 작성된 제보가 첫 번째에 표시
    const firstCard = page.locator('.report-card:first-child');
    await expect(firstCard.locator('text=도서관')).toBeVisible();
  });

  test('공감순 정렬이 올바르게 작동한다', async ({ page }) => {
    await page.goto('/reports');
    
    // 첫 번째 제보에 공감 추가
    await page.click('.report-card:first-child');
    await page.click('button:has-text("🙋‍♂️ 저도 겪고 있어요")');
    
    // 목록으로 돌아가서 공감순 정렬
    await page.click('text=제보 목록');
    await page.selectOption('select[name="sort"]', 'empathy');
    
    // 공감이 있는 제보가 첫 번째에 표시
    const firstCard = page.locator('.report-card:first-child');
    await expect(firstCard.locator('text=공감 1')).toBeVisible();
  });

  test('필터와 정렬을 함께 사용할 수 있다', async ({ page }) => {
    await page.goto('/reports');
    
    // 김해캠퍼스 필터 + 최신순 정렬
    await page.selectOption('select[name="campusFilter"]', '김해캠퍼스');
    await page.selectOption('select[name="sort"]', 'latest');
    
    // 김해캠퍼스 제보만 표시되고 최신순으로 정렬
    await expect(page.locator('.report-card')).toHaveCount(2);
    
    // 건물명 검색 추가
    await page.fill('input[name="buildingFilter"]', '도서관');
    
    // 김해캠퍼스 + 도서관 제보만 표시
    await expect(page.locator('.report-card')).toHaveCount(1);
    await expect(page.locator('text=도서관')).toBeVisible();
    await expect(page.locator('text=김해캠퍼스')).toBeVisible();
  });

  test('필터 상태가 시각적으로 표시된다', async ({ page }) => {
    await page.goto('/reports');
    
    // 필터 적용
    await page.selectOption('select[name="campusFilter"]', '김해캠퍼스');
    await page.fill('input[name="buildingFilter"]', '공학관');
    
    // 적용된 필터가 시각적으로 표시되는지 확인
    await expect(page.locator('select[name="campusFilter"]')).toHaveValue('김해캠퍼스');
    await expect(page.locator('input[name="buildingFilter"]')).toHaveValue('공학관');
    
    // 필터 결과 개수 표시 확인
    await expect(page.locator('text=1개의 제보')).toBeVisible();
  });
});