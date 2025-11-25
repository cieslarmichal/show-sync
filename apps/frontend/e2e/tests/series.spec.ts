import { test, expect } from '@playwright/test';
import { LoginPageModel } from '../pages/LoginPageModel';
import { RegisterPageModel } from '../pages/RegisterPageModel';
import { SeriesPageModel } from '../pages/SeriesPageModel';
import { testData } from '../fixtures/testData';

test.describe('Series Rating System', () => {
  let loginPage: LoginPageModel;
  let registerPage: RegisterPageModel;
  let seriesPage: SeriesPageModel;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPageModel(page);
    registerPage = new RegisterPageModel(page);
    seriesPage = new SeriesPageModel(page);

    await registerPage.navigate();
    await registerPage.register(testData.user.name, testData.user.email, testData.user.password);
    await loginPage.navigate();
    await loginPage.login(testData.user.email, testData.user.password);
    await seriesPage.navigate();
  });

  test.describe('Adding Ratings', () => {
    test('should rate a series as Love', async ({ page }) => {
      await seriesPage.searchSeries('The Mandalorian');
      const loveButton = page.getByTestId('search-result-love-button-0');
      await expect(loveButton).toBeVisible({ timeout: 15000 });
      await loveButton.click();
      await expect(seriesPage.filterTabAll).toContainText('All (1)', { timeout: 10000 });
      const lovedCount = await seriesPage.getTabCount('loved');
      expect(lovedCount).toBe(1);
    });

    test('should rate a series as Like', async ({ page }) => {
      await seriesPage.searchSeries('Stranger Things');
      const likeButton = page.getByTestId('search-result-like-button-0');
      await expect(likeButton).toBeVisible({ timeout: 15000 });
      await likeButton.click();
      await expect(seriesPage.filterTabAll).toContainText('All (1)', { timeout: 10000 });
      const likedCount = await seriesPage.getTabCount('liked');
      expect(likedCount).toBe(1);
    });
  });
});
