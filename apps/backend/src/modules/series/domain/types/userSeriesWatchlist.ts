export const watchlistTypes = {
  notInterested: 'notInterested',
  wantToWatch: 'wantToWatch',
} as const;

export type WatchlistType = (typeof watchlistTypes)[keyof typeof watchlistTypes];

export interface UserSeriesWatchlist {
  readonly id: string;
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly type: WatchlistType;
}
