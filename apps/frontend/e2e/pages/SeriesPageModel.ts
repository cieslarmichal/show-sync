import { type Locator, type Page } from '@playwright/test';
import { BasePageModel } from './BasePageModel.js';

export class SeriesPageModel extends BasePageModel {
  // Page elements
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly searchResults: Locator;
  readonly favoritesSection: Locator;
  readonly ignoredSection: Locator;
  readonly filterTabAll: Locator;
  readonly filterTabLoved: Locator;
  readonly filterTabLiked: Locator;
  readonly emptyFavoritesMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByRole('heading', { name: /rate tv shows/i });
    this.searchInput = page.getByPlaceholder(/search for a tv show by title/i);
    this.searchResults = page.getByTestId('search-results');
    this.favoritesSection = page.getByRole('heading', { name: /your rated shows/i });
    this.ignoredSection = page.getByRole('heading', { name: /skipped shows/i });
    this.filterTabAll = page.getByRole('tab', { name: /all \(/i });
    this.filterTabLoved = page.getByRole('tab', { name: /loved \(/i });
    this.filterTabLiked = page.getByRole('tab', { name: /liked \(/i });
    this.emptyFavoritesMessage = page.getByText(/no favorite shows yet|no loved shows yet|no liked shows yet/i);
  }

  override async goto(): Promise<void> {
    await super.goto('/series');
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  async searchSeries(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for debounce
  }

  async addSeriesFromSearch(seriesName: string): Promise<void> {
    const seriesCard = this.page.locator(`[data-testid="series-card"]`, { hasText: seriesName });
    const addButton = seriesCard.getByRole('button', { name: /add to favorites/i });
    await addButton.click();
  }

  async clickAllTab(): Promise<void> {
    await this.filterTabAll.click();
  }

  async clickLovedTab(): Promise<void> {
    await this.filterTabLoved.click();
  }

  async clickLikedTab(): Promise<void> {
    await this.filterTabLiked.click();
  }

  async getTabCount(tab: 'all' | 'loved' | 'liked'): Promise<number> {
    const tabElement = tab === 'all' ? this.filterTabAll : tab === 'loved' ? this.filterTabLoved : this.filterTabLiked;
    const text = await tabElement.textContent();
    const match = text?.match(/\((\d+)\)/);
    return match && match[1] ? parseInt(match[1], 10) : 0;
  }

  async togglePreference(seriesName: string): Promise<void> {
    const seriesCard = this.page.locator('[data-series-name]', { hasText: seriesName }).first();
    const preferenceToggle = seriesCard.getByRole('button', { name: /mark as (loved|liked)/i });
    await preferenceToggle.click();
  }

  async getPreferenceLevel(seriesName: string): Promise<'like' | 'love' | null> {
    const seriesCard = this.page.locator('[data-series-name]', { hasText: seriesName }).first();
    const loveButton = seriesCard.getByRole('button', { name: /mark as liked/i });
    const likeButton = seriesCard.getByRole('button', { name: /mark as loved/i });

    const isLove = await loveButton.isVisible().catch(() => false);
    if (isLove) return 'love';

    const isLike = await likeButton.isVisible().catch(() => false);
    if (isLike) return 'like';

    return null;
  }

  async removeFavoriteSeries(seriesName: string): Promise<void> {
    const seriesCard = this.page.locator('[data-series-name]', { hasText: seriesName }).first();
    const removeButton = seriesCard.getByRole('button', { name: /remove.*from favorites/i });
    await removeButton.click();
  }

  async getFavoriteSeriesCount(): Promise<number> {
    const cards = await this.page.locator('[data-series-name]').count();
    return cards;
  }

  async waitForToast(message: string | RegExp): Promise<void> {
    const toast = this.page.locator('[data-sonner-toast]').filter({ hasText: message });
    await toast.waitFor({ state: 'visible', timeout: 5000 });
  }
}
