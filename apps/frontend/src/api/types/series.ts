export const preferenceLevels = {
  like: 'like',
  love: 'love',
} as const;

export type PreferenceLevel = (typeof preferenceLevels)[keyof typeof preferenceLevels];

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

export interface SeriesDetails extends Series {
  readonly backdropPath: string | null;
  readonly genres: string[];
  readonly numberOfSeasons: number;
  readonly numberOfEpisodes: number;
  readonly status: string;
}

export interface SeriesSearchResult {
  readonly data: Series[];
  readonly metadata: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
  };
}

export interface FavoriteSeries {
  readonly seriesTmdbId: number;
  readonly preferenceLevel: PreferenceLevel;
}

export interface FavoriteSeriesList {
  readonly data: FavoriteSeries[];
  readonly metadata: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
  };
}

export interface IgnoredSeries {
  readonly seriesTmdbId: number;
}

export interface IgnoredSeriesList {
  readonly data: IgnoredSeries[];
  readonly metadata: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
  };
}
