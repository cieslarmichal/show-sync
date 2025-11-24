export interface TmdbSeries {
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

export interface TmdbSeriesDetails {
  readonly id: number;
  readonly name: string;
  readonly posterPath: string | null;
  readonly backdropPath: string | null;
  readonly overview: string;
  readonly firstAirDate: string | null;
  readonly genres: string[];
  readonly numberOfSeasons: number;
  readonly numberOfEpisodes: number;
  readonly status: string;
  readonly voteAverage: number;
  readonly watchProviders: TmdbWatchProvider[];
}

export interface TmdbWatchProvider {
  readonly providerId: number;
  readonly providerName: string;
  readonly logoPath: string | null;
}

export interface TmdbSeriesExternalIds {
  readonly imdbId: string | null;
  readonly tvdbId: number | null;
  readonly facebookId: string | null;
  readonly instagramId: string | null;
  readonly twitterId: string | null;
}
