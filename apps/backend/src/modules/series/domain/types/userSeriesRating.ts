export const seriesRatings = {
  like: 'like',
  love: 'love',
  dislike: 'dislike',
} as const;

export type SeriesRating = (typeof seriesRatings)[keyof typeof seriesRatings];

export interface UserSeriesRating {
  readonly id: string;
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly rating: SeriesRating;
}
