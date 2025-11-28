import { test, expect } from '@playwright/test';
import { LoginPageModel } from '../pages/LoginPageModel.ts';
import { RegisterPageModel } from '../pages/RegisterPageModel.ts';
import { SeriesPageModel } from '../pages/SeriesPageModel.ts';
import { WatchlistPageModel } from '../pages/WatchlistPageModel.ts';
import { generateUniqueEmail } from '../fixtures/testData.ts';

test.describe('Series Rating System', () => {
  test.beforeEach(async ({ page }) => {
    const registerPage = new RegisterPageModel(page);
    const loginPage = new LoginPageModel(page);

    // Register a new user
    await registerPage.goto();
    const uniqueEmail = generateUniqueEmail();
    const password = 'TestPassword123!';
    await registerPage.register('Test User', uniqueEmail, password);

    // Wait for success and go back to sign in
    await expect(registerPage.backToSignInButton).toBeVisible({ timeout: 10000 });
    await registerPage.backToSignInButton.click();

    // Wait for navigation to login page
    await page.waitForURL(/\/login$/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Login
    await loginPage.login(uniqueEmail, password);

    // Wait for dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Navigate to series page
    const seriesPage = new SeriesPageModel(page);
    await seriesPage.goto();
  });

  test.describe('Adding Ratings', () => {
    test('should rate a series as Love', async ({ page }) => {
      const seriesPage = new SeriesPageModel(page);

      await seriesPage.searchSeries('Game of Thrones');
      const loveButton = page.getByTestId('search-result-love-button-0');
      await expect(loveButton).toBeVisible({ timeout: 15000 });
      await loveButton.click();
      await expect(seriesPage.filterTabAll).toContainText('All (1)', { timeout: 10000 });
      const lovedCount = await seriesPage.getTabCount('loved');
      expect(lovedCount).toBe(1);
    });

    test('should rate a series as Like', async ({ page }) => {
      const seriesPage = new SeriesPageModel(page);

      await seriesPage.searchSeries('Stranger Things');
      const likeButton = page.getByTestId('search-result-like-button-0');
      await expect(likeButton).toBeVisible({ timeout: 15000 });
      await likeButton.click();
      await expect(seriesPage.filterTabAll).toContainText('All (1)', { timeout: 10000 });
      const likedCount = await seriesPage.getTabCount('liked');
      expect(likedCount).toBe(1);
    });

    test('should rate a series as Dislike', async ({ page }) => {
      const seriesPage = new SeriesPageModel(page);

      await seriesPage.searchSeries('The Mandalorian');
      const dislikeButton = page.getByTestId('search-result-dislike-button-0');
      await expect(dislikeButton).toBeVisible({ timeout: 15000 });
      await dislikeButton.click();
      await expect(seriesPage.filterTabAll).toContainText('All (1)', { timeout: 10000 });
      const dislikedCount = await seriesPage.getTabCount('disliked');
      expect(dislikedCount).toBe(1);
    });
  });

  test.describe('Adding to Watchlist', () => {
    test('should add a series to Want to Watch and verify in Watchlist page', async ({ page }) => {
      const seriesPage = new SeriesPageModel(page);
      const watchlistPage = new WatchlistPageModel(page);

      await seriesPage.searchSeries('Breaking Bad');
      const wantToWatchButton = page.getByTestId('search-result-want-to-watch-button-0');
      await expect(wantToWatchButton).toBeVisible({ timeout: 15000 });
      await wantToWatchButton.click();

      // Wait for toast confirmation
      await seriesPage.waitForToast(/added to.*want to watch/i);

      // Navigate to Watchlist page
      await watchlistPage.goto();

      // Wait for cards to load
      await page.waitForLoadState('networkidle');
      await watchlistPage.watchlistCards.first().waitFor({ state: 'visible', timeout: 10000 });

      // Verify series is in watchlist
      await expect(watchlistPage.watchlistCards.filter({ hasText: 'Breaking Bad' })).toBeVisible();

      // Verify watchlist count
      const count = await watchlistPage.getWatchlistCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should add a series to Not Interested', async ({ page }) => {
      const seriesPage = new SeriesPageModel(page);

      await seriesPage.searchSeries('The Wire');
      const notInterestedButton = page.getByTestId('search-result-not-interested-button-0');
      await expect(notInterestedButton).toBeVisible({ timeout: 15000 });
      await notInterestedButton.click();

      // Wait for toast confirmation
      await seriesPage.waitForToast(/added to.*not interested/i);
    });
  });
});
