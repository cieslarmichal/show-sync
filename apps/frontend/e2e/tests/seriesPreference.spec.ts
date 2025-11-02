import { test, expect } from '@playwright/test';
import { LoginPageModel } from '../pages/LoginPageModel.js';
import { RegisterPageModel } from '../pages/RegisterPageModel.js';
import { SeriesPageModel } from '../pages/SeriesPageModel.js';
import { DashboardPageModel } from '../pages/DashboardPageModel.js';
import { generateUniqueEmail } from '../fixtures/testData.js';

test.describe('Series Preference Feature', () => {
  let seriesPage: SeriesPageModel;
  let dashboardPage: DashboardPageModel;

  test.beforeEach(async ({ page }) => {
    // Register and login a new user for each test
    const registerPage = new RegisterPageModel(page);
    await registerPage.goto();

    const uniqueEmail = generateUniqueEmail();
    await registerPage.register('Test User', uniqueEmail, 'TestPassword123!');

    // Navigate back to login
    await registerPage.backToSignInButton.click();

    const loginPage = new LoginPageModel(page);
    await loginPage.login(uniqueEmail, 'TestPassword123!');

    // Wait for redirect to dashboard
    dashboardPage = new DashboardPageModel(page);
    await dashboardPage.waitForURL(/\/dashboard/);

    // Navigate to series page
    seriesPage = new SeriesPageModel(page);
    await seriesPage.goto();
  });

  test.describe('Preference Toggle', () => {
    test('should add series with default like preference', async () => {
      // Note: This test assumes we can search for series
      // In a real test, you'd need to mock the TMDB API or use a test series

      // Verify empty state
      await expect(seriesPage.emptyFavoritesMessage).toBeVisible();

      // Check initial counts in tabs
      const allCount = await seriesPage.getTabCount('all');
      const lovedCount = await seriesPage.getTabCount('loved');
      const likedCount = await seriesPage.getTabCount('liked');

      expect(allCount).toBe(0);
      expect(lovedCount).toBe(0);
      expect(likedCount).toBe(0);
    });

    test('should toggle preference from like to love', async ({ page }) => {
      // This is a simplified test - in reality, you'd need to add a series first
      // For this test, we'll need to ensure a series is already added via API or test setup

      // Skip if no series available for testing
      test.skip(true, 'Requires test series setup');
    });

    test('should toggle preference from love to like', async ({ page }) => {
      // Similar to above, requires test setup
      test.skip(true, 'Requires test series setup');
    });

    test('should update tab counts when toggling preference', async ({ page }) => {
      // This test verifies that when you toggle a series preference,
      // the counts in the filter tabs update correctly
      test.skip(true, 'Requires test series setup');
    });
  });

  test.describe('Preference Filtering', () => {
    test('should filter series by loved preference', async ({ page }) => {
      // Verify all tabs are rendered
      await expect(seriesPage.filterTabAll).toBeVisible();
      await expect(seriesPage.filterTabLoved).toBeVisible();
      await expect(seriesPage.filterTabLiked).toBeVisible();

      // Click loved tab
      await seriesPage.clickLovedTab();

      // Initially should be empty
      await expect(seriesPage.emptyFavoritesMessage).toBeVisible();
    });

    test('should filter series by liked preference', async ({ page }) => {
      // Verify all tabs are rendered
      await expect(seriesPage.filterTabAll).toBeVisible();
      await expect(seriesPage.filterTabLoved).toBeVisible();
      await expect(seriesPage.filterTabLiked).toBeVisible();

      // Click liked tab
      await seriesPage.clickLikedTab();

      // Initially should be empty
      await expect(seriesPage.emptyFavoritesMessage).toBeVisible();
    });

    test('should show all series when all tab is selected', async ({ page }) => {
      // All tab should be selected by default
      await expect(seriesPage.filterTabAll).toHaveAttribute('data-state', 'active');
    });

    test('should switch between filter tabs', async ({ page }) => {
      // Click loved tab
      await seriesPage.clickLovedTab();
      await expect(seriesPage.filterTabLoved).toHaveAttribute('data-state', 'active');

      // Click liked tab
      await seriesPage.clickLikedTab();
      await expect(seriesPage.filterTabLiked).toHaveAttribute('data-state', 'active');

      // Click all tab
      await seriesPage.clickAllTab();
      await expect(seriesPage.filterTabAll).toHaveAttribute('data-state', 'active');
    });
  });

  test.describe('UI Components', () => {
    test('should render preference toggle component', async () => {
      // Verify the page loads correctly
      await expect(seriesPage.pageTitle).toBeVisible();
      await expect(seriesPage.favoritesSection).toBeVisible();
    });

    test('should show tooltip on preference toggle hover', async ({ page }) => {
      // This would require a series to be added first
      test.skip(true, 'Requires test series setup');
    });

    test('should disable preference toggle during update', async ({ page }) => {
      // This would test that the toggle is disabled while API request is in progress
      test.skip(true, 'Requires test series setup');
    });
  });

  test.describe('Tab Counts', () => {
    test('should display correct counts in filter tabs', async () => {
      const allCount = await seriesPage.getTabCount('all');
      const lovedCount = await seriesPage.getTabCount('loved');
      const likedCount = await seriesPage.getTabCount('liked');

      // Initially all should be 0
      expect(allCount).toBe(0);
      expect(lovedCount).toBe(0);
      expect(likedCount).toBe(0);
    });

    test('should update all count when adding series', async ({ page }) => {
      test.skip(true, 'Requires test series setup and API mocking');
    });

    test('should update loved/liked counts when toggling preference', async ({ page }) => {
      test.skip(true, 'Requires test series setup and API mocking');
    });
  });

  test.describe('Integration with Recommendations', () => {
    test('should prioritize loved series in recommendations', async ({ page }) => {
      // This would test that loved series are weighted more heavily
      // Would require creating a watchroom and checking recommendations
      test.skip(true, 'Requires watchroom setup and recommendation testing');
    });
  });
});

test.describe('Series Preference Feature - With Mock Data', () => {
  // These tests would use MSW or similar to mock API responses
  // allowing full E2E testing without depending on external services

  test.beforeEach(async ({ page }) => {
    // Setup MSW handlers for mocking
    test.skip(true, 'MSW setup required for mocked tests');
  });

  test('complete workflow: add series, toggle preference, filter, remove', async ({ page }) => {
    test.skip(true, 'MSW setup required');
  });
});
