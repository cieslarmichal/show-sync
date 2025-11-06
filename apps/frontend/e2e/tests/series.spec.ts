import { test, expect } from '@playwright/test';
import { LoginPageModel } from '../pages/LoginPageModel.ts';
import { RegisterPageModel } from '../pages/RegisterPageModel.ts';
import { SeriesPageModel } from '../pages/SeriesPageModel.ts';
import { DashboardPageModel } from '../pages/DashboardPageModel.ts';
import { generateUniqueEmail } from '../fixtures/testData.ts';

test.describe('Series Flow', () => {
  let seriesPage: SeriesPageModel;

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
    const dashboardPage = new DashboardPageModel(page);
    await dashboardPage.waitForURL(/\/dashboard/);

    // Navigate to series page
    seriesPage = new SeriesPageModel(page);
    await seriesPage.goto();
  });

  test.describe('Search and Add Series', () => {
    test('should search for a series and display results', async ({ page }) => {
      // Type in search box
      await seriesPage.searchInput.fill('Breaking Bad');

      // Wait for search results - look for Love button which appears in results
      const loveButton = page.locator('button').filter({ hasText: 'Love' }).first();
      await expect(loveButton).toBeVisible({ timeout: 20000 });
    });

    test('should add a series with "Love" preference', async ({ page }) => {
      // Search for a series
      await seriesPage.searchSeries('Breaking Bad');

      // Wait for and click the "Love" button on the first result
      const firstLoveButton = page.locator('button:has-text("Love")').first();
      await expect(firstLoveButton).toBeVisible({ timeout: 15000 });
      await firstLoveButton.click();

      // Verify the series appears in the favorites list
      const allCount = await seriesPage.getTabCount('all');
      const lovedCount = await seriesPage.getTabCount('loved');

      expect(allCount).toBe(1);
      expect(lovedCount).toBe(1);

      // Verify it appears in the "Loved" tab
      await seriesPage.clickLovedTab();

      const favoriteCards = page.locator('[data-testid="favorite-series-card"]');
      await expect(favoriteCards.first()).toBeVisible({ timeout: 5000 });
      const favoriteCount = await favoriteCards.count();
      expect(favoriteCount).toBe(1);
    });

    test('should add a series with "Like" preference', async ({ page }) => {
      // Search for a series
      await seriesPage.searchSeries('Friends');

      // Wait for and click the "Like" button on the first result
      const firstLikeButton = page.locator('button:has-text("Like")').first();
      await expect(firstLikeButton).toBeVisible({ timeout: 15000 });
      await firstLikeButton.click();

      // Verify counts
      const allCount = await seriesPage.getTabCount('all');
      const likedCount = await seriesPage.getTabCount('liked');

      expect(allCount).toBe(1);
      expect(likedCount).toBe(1);

      // Verify it appears in the "Liked" tab
      await seriesPage.clickLikedTab();

      const favoriteCards = page.locator('[data-testid="favorite-series-card"]');
      await expect(favoriteCards.first()).toBeVisible({ timeout: 5000 });
      const favoriteCount = await favoriteCards.count();
      expect(favoriteCount).toBe(1);
    });

    test('should skip a series (add to ignored list)', async ({ page }) => {
      // Search for a series
      await seriesPage.searchSeries('Game of Thrones');

      // Wait for and click the "Skip" button on the first result
      const firstSkipButton = page.locator('button:has-text("Skip")').first();
      await expect(firstSkipButton).toBeVisible({ timeout: 15000 });
      await firstSkipButton.click();

      // Verify the series does NOT appear in favorites
      const allCount = await seriesPage.getTabCount('all');
      expect(allCount).toBe(0);

      // Scroll down to the ignored series section
      const ignoredSection = page.getByRole('heading', { name: /ignored series/i });
      await ignoredSection.scrollIntoViewIfNeeded();

      // Verify it appears in the ignored series section
      const ignoredCards = page.locator('[data-testid="ignored-series-card"]');
      await expect(ignoredCards.first()).toBeVisible({ timeout: 5000 });
      const ignoredCount = await ignoredCards.count();
      expect(ignoredCount).toBe(1);
    });

    test('should display empty state when no search results found', async ({ page }) => {
      // Search for a non-existent series
      await seriesPage.searchSeries('zxcvbnmasdfghjkl123456789');

      // Verify empty state message is shown
      const emptyMessage = page.getByText(/no series found for/i);
      await expect(emptyMessage).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Preference Management', () => {
    test('should toggle preference from "Like" to "Love"', async ({ page }) => {
      // Add a series with "Like" preference
      await seriesPage.searchSeries('Stranger Things');

      const likeButton = page.locator('button:has-text("Like")').first();
      await expect(likeButton).toBeVisible({ timeout: 15000 });
      await likeButton.click();

      // Find the series card in favorites and toggle to "Love"
      const preferenceToggle = page.locator('[data-testid="preference-toggle"]').first();
      await expect(preferenceToggle).toBeVisible({ timeout: 10000 });
      await preferenceToggle.click();

      // Verify counts updated
      const lovedCount = await seriesPage.getTabCount('loved');
      const likedCount = await seriesPage.getTabCount('liked');

      expect(lovedCount).toBe(1);
      expect(likedCount).toBe(0);
    });

    test('should toggle preference from "Love" to "Like"', async ({ page }) => {
      // Add a series with "Love" preference
      await seriesPage.searchSeries('The Mandalorian');

      const loveButton = page.locator('button:has-text("Love")').first();
      await expect(loveButton).toBeVisible({ timeout: 15000 });
      await loveButton.click();

      // Find the series card and toggle to "Like"
      const preferenceToggle = page.locator('[data-testid="preference-toggle"]').first();
      await expect(preferenceToggle).toBeVisible({ timeout: 10000 });
      await preferenceToggle.click();

      // Verify counts updated
      const lovedCount = await seriesPage.getTabCount('loved');
      const likedCount = await seriesPage.getTabCount('liked');

      expect(lovedCount).toBe(0);
      expect(likedCount).toBe(1);
    });

    test('should remove a series from favorites', async ({ page }) => {
      // Add a series
      await seriesPage.searchSeries('The Witcher');

      const loveButton = page.locator('button:has-text("Love")').first();
      await expect(loveButton).toBeVisible({ timeout: 15000 });
      await loveButton.click();

      // Remove the series
      const removeButton = page.locator('button[aria-label*="Remove"]').first();
      await expect(removeButton).toBeVisible({ timeout: 10000 });
      await removeButton.click();

      // Verify counts are back to 0
      const allCount = await seriesPage.getTabCount('all');
      expect(allCount).toBe(0);
    });
  });

  test.describe('Filter Tabs', () => {
    test('should filter series by "Loved" preference', async ({ page }) => {
      // Add two series: one loved, one liked
      await seriesPage.searchSeries('The Boys');
      const loveButton1 = page.locator('button:has-text("Love")').first();
      await expect(loveButton1).toBeVisible({ timeout: 15000 });
      await loveButton1.click();

      await seriesPage.searchSeries('House');
      const likeButton1 = page.locator('button:has-text("Like")').first();
      await expect(likeButton1).toBeVisible({ timeout: 15000 });
      await likeButton1.click();

      // Click the "Loved" tab
      await seriesPage.clickLovedTab();

      // Should only show 1 series
      const favoriteCards = page.locator('[data-testid="favorite-series-card"]');
      await expect(favoriteCards.first()).toBeVisible({ timeout: 5000 });
      const count = await favoriteCards.count();
      expect(count).toBe(1);
    });

    test('should filter series by "Liked" preference', async ({ page }) => {
      // Add two series: one loved, one liked
      await seriesPage.searchSeries('Peaky Blinders');
      const loveButton1 = page.locator('button:has-text("Love")').first();
      await expect(loveButton1).toBeVisible({ timeout: 15000 });
      await loveButton1.click();

      await seriesPage.searchSeries('Sherlock');
      const likeButton1 = page.locator('button:has-text("Like")').first();
      await expect(likeButton1).toBeVisible({ timeout: 15000 });
      await likeButton1.click();

      // Click the "Liked" tab
      await seriesPage.clickLikedTab();

      // Should only show 1 series
      const favoriteCards = page.locator('[data-testid="favorite-series-card"]');
      await expect(favoriteCards.first()).toBeVisible({ timeout: 5000 });
      const count = await favoriteCards.count();
      expect(count).toBe(1);
    });

    test('should show all series in "All" tab', async ({ page }) => {
      // Add two series with different preferences
      await seriesPage.searchSeries('Lost');
      const loveButton1 = page.locator('button:has-text("Love")').first();
      await expect(loveButton1).toBeVisible({ timeout: 15000 });
      await loveButton1.click();

      await seriesPage.searchSeries('Prison Break');
      const likeButton1 = page.locator('button:has-text("Like")').first();
      await expect(likeButton1).toBeVisible({ timeout: 15000 });
      await likeButton1.click();

      // Verify counts
      const allCount = await seriesPage.getTabCount('all');
      const lovedCount = await seriesPage.getTabCount('loved');
      const likedCount = await seriesPage.getTabCount('liked');

      expect(allCount).toBe(2);
      expect(lovedCount).toBe(1);
      expect(likedCount).toBe(1);

      // All tab should show both
      const favoriteCards = page.locator('[data-testid="favorite-series-card"]');
      await expect(favoriteCards.first()).toBeVisible({ timeout: 5000 });
      const count = await favoriteCards.count();
      expect(count).toBe(2);
    });
  });

  test.describe('Empty States', () => {
    test('should display empty state when no favorites', async () => {
      // Verify empty state message
      await expect(seriesPage.emptyFavoritesMessage).toBeVisible();
    });

    test('should display empty state for "Loved" tab when no loved series', async ({ page }) => {
      // Add a liked series
      await seriesPage.searchSeries('Vikings');
      const likeButton = page.locator('button:has-text("Like")').first();
      await expect(likeButton).toBeVisible({ timeout: 15000 });
      await likeButton.click();

      // Click loved tab
      await seriesPage.clickLovedTab();

      // Should show empty message for loved
      const emptyMessage = page.getByText(/no loved series yet/i);
      await expect(emptyMessage).toBeVisible();
    });

    test('should display empty state for "Liked" tab when no liked series', async ({ page }) => {
      // Add a loved series
      await seriesPage.searchSeries('Westworld');
      const loveButton = page.locator('button:has-text("Love")').first();
      await expect(loveButton).toBeVisible({ timeout: 15000 });
      await loveButton.click();

      // Click liked tab
      await seriesPage.clickLikedTab();

      // Should show empty message for liked
      const emptyMessage = page.getByText(/no liked series yet/i);
      await expect(emptyMessage).toBeVisible();
    });
  });
});
