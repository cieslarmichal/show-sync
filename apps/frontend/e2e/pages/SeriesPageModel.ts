import { type Locator, type Page } from '@playwright/test';
import { BasePageModel } from './BasePageModel.js';

export class SeriesPageModel extends BasePageModel {
  // Page elements
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly searchResults: Locator;
  readonly ratingsSection: Locator;
  readonly watchlistSection: Locator;
  readonly filterTabAll: Locator;
  readonly filterTabLoved: Locator;
  readonly filterTabLiked: Locator;
  readonly filterTabDisliked: Locator;
  readonly emptyRatingsMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByRole('heading', { name: /rate your shows/i });
    this.searchInput = page.getByPlaceholder(/search for a tv show by title/i);
    this.searchResults = page.getByTestId('search-results');
    this.ratingsSection = page.getByRole('heading', { name: /your ratings/i });
    this.watchlistSection = page.getByRole('heading', { name: /your watchlist/i });
    this.filterTabAll = page.getByRole('tab', { name: /all \(/i });
    this.filterTabLoved = page.getByRole('tab', { name: /loved \(/i });
    this.filterTabLiked = page.getByRole('tab', { name: /liked \(/i });
    this.filterTabDisliked = page.getByRole('tab', { name: /disliked \(/i });
    this.emptyRatingsMessage = page.getByText(
      /no rated shows yet|no loved shows yet|no liked shows yet|no disliked shows yet/i,
    );
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
    const addButton = seriesCard.getByRole('button', { name: /add to rated series/i });
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

  async clickDislikedTab(): Promise<void> {
    await this.filterTabDisliked.click();
  }

  async getTabCount(tab: 'all' | 'loved' | 'liked' | 'disliked'): Promise<number> {
    const tabElement =
      tab === 'all'
        ? this.filterTabAll
        : tab === 'loved'
          ? this.filterTabLoved
          : tab === 'liked'
            ? this.filterTabLiked
            : this.filterTabDisliked;
    const text = await tabElement.textContent();
    const match = text?.match(/\((\d+)\)/);
    return match && match[1] ? parseInt(match[1], 10) : 0;
  }

  async cycleRating(seriesName: string): Promise<void> {
    const seriesCard = this.page.locator('[data-testid="series-rating-card"]', { hasText: seriesName }).first();
    const ratingSelector = seriesCard.getByTestId('rating-selector');
    await ratingSelector.click();
  }

  async getRating(seriesName: string): Promise<'like' | 'love' | 'dislike' | null> {
    const seriesCard = this.page.locator('[data-testid="series-rating-card"]', { hasText: seriesName }).first();
    const ratingSelector = seriesCard.getByTestId('rating-selector');

    const ariaLabel = await ratingSelector.getAttribute('aria-label');
    if (!ariaLabel) return null;

    if (ariaLabel.includes('Love')) return 'love';
    if (ariaLabel.includes('Like')) return 'like';
    if (ariaLabel.includes('Dislike')) return 'dislike';

    return null;
  }

  async removeSeriesRating(seriesName: string): Promise<void> {
    const seriesCard = this.page.locator('[data-testid="series-rating-card"]', { hasText: seriesName }).first();
    const removeButton = seriesCard.getByRole('button', { name: /remove.*from ratings/i });
    await removeButton.click();
  }

  async getSeriesRatingsCount(): Promise<number> {
    const cards = await this.page.locator('[data-testid="series-rating-card"]').count();
    return cards;
  }

  async waitForToast(message: string | RegExp): Promise<void> {
    const toast = this.page.locator('[data-sonner-toast]').filter({ hasText: message });
    await toast.waitFor({ state: 'visible', timeout: 5000 });
  }
}
