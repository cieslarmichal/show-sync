import { type Locator, type Page } from '@playwright/test';
import { BasePageModel } from './BasePageModel.ts';

export class WatchlistPageModel extends BasePageModel {
  // Page elements
  readonly pageTitle: Locator;
  readonly wantToWatchSection: Locator;
  readonly watchlistCards: Locator;
  readonly emptyWatchlistMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByRole('heading', { name: /watchlist/i, level: 1 });
    this.wantToWatchSection = page.getByRole('heading', { name: /want to watch/i, level: 2 });
    this.watchlistCards = page.locator('[data-testid="series-watchlist-card"]');
    this.emptyWatchlistMessage = page.getByText(/no shows in your watchlist yet/i);
  }

  override async goto(): Promise<void> {
    await super.goto('/watchlist');
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  async getWatchlistCount(): Promise<number> {
    const countBadge = this.page
      .locator('.text-sm.font-semibold.text-muted-foreground')
      .filter({ hasText: /^\d+ shows?$/i });
    const countText = await countBadge.textContent();
    const match = countText?.match(/(\d+)/);
    return match ? parseInt(match[1] as string, 10) : 0;
  }

  async hasSeriesInWatchlist(seriesName: string): Promise<boolean> {
    const card = this.watchlistCards.filter({ hasText: seriesName });
    return (await card.count()) > 0;
  }

  async removeSeriesFromWatchlist(seriesName: string): Promise<void> {
    const card = this.watchlistCards.filter({ hasText: seriesName }).first();
    const removeButton = card.getByRole('button', { name: /remove.*from watchlist/i });
    await removeButton.click();
  }

  async waitForToast(message: string | RegExp): Promise<void> {
    const toast = this.page.locator('[data-sonner-toast]').filter({ hasText: message });
    await toast.waitFor({ state: 'visible', timeout: 5000 });
  }
}
