import type { Page } from '@playwright/test';
import { BasePageModel } from './BasePageModel.ts';

export class DashboardPageModel extends BasePageModel {
  override readonly page: Page;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }

  get welcomeMessage() {
    return this.page.locator('h1, h2').filter({ hasText: /welcome|dashboard|profile/i });
  }

  get addSeriesButton() {
    return this.page.getByTestId('rate-more-series-button');
  }

  get seriesList() {
    return this.page.locator('[data-testid="favorite-series-list"], .series-list');
  }

  get createRoomButton() {
    return this.page.getByTestId('create-room-button');
  }

  get watchRoomsList() {
    return this.page.locator('[data-testid="watchrooms-list"], .watchrooms-list');
  }

  get logoutButton() {
    return this.page.getByRole('button', { name: /logout|sign out/i });
  }

  // Actions
  override async goto(): Promise<void> {
    await super.goto('/profile');
  }

  async clickAddSeries(): Promise<void> {
    await this.addSeriesButton.click();
  }

  async clickCreateRoom(): Promise<void> {
    await this.createRoomButton.click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  async getFavoriteSeriesCount(): Promise<number> {
    const items = await this.seriesList.locator('> *').count();
    return items;
  }

  async getWatchRoomsCount(): Promise<number> {
    const items = await this.watchRoomsList.locator('> *').count();
    return items;
  }
}
