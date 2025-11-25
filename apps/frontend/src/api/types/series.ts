export const ratings = {
  like: 'like',
  love: 'love',
  dislike: 'dislike',
} as const;

export type Rating = (typeof ratings)[keyof typeof ratings];

export const watchlistTypes = {
  notInterested: 'notInterested',
  wantToWatch: 'wantToWatch',
} as const;

export type WatchlistType = (typeof watchlistTypes)[keyof typeof watchlistTypes];

export interface Series {
  readonly id: number;
  readonly name: string;
  readonly posterPath: string | null;
  readonly overview: string;
  readonly firstAirDate: string | null;
  readonly voteAverage: number;
  readonly genreIds: number[];
  readonly originCountry: string[];
  readonly originalLanguage: string;
}

export interface WatchProvider {
  readonly providerId: number;
  readonly providerName: string;
  readonly logoPath: string | null;
}

export interface SeriesDetails extends Series {
  readonly backdropPath: string | null;
  readonly genres: string[];
  readonly numberOfSeasons: number;
  readonly numberOfEpisodes: number;
  readonly status: string;
  readonly watchProviders: WatchProvider[];
}

export interface SeriesSearchResult {
  readonly data: Series[];
  readonly metadata: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
  };
}

export interface SeriesRating {
  readonly seriesTmdbId: number;
  readonly rating: Rating;
}

export interface SeriesRatingList {
  readonly data: SeriesRating[];
  readonly metadata: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
  };
}

export interface SeriesWatchlist {
  readonly seriesTmdbId: number;
  readonly type: WatchlistType;
}

export interface SeriesWatchlistList {
  readonly data: SeriesWatchlist[];
  readonly metadata: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
  };
}
