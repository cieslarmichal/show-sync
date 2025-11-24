import type { TmdbSeries, TmdbSeriesDetails, TmdbSeriesExternalIds } from '../types/tmdbSeries.ts';

export interface SearchSeriesParams {
  readonly query: string;
  readonly page: number;
}

export interface SeriesSearchResult {
  readonly page: number;
  readonly results: TmdbSeries[];
  readonly totalPages: number;
  readonly totalResults: number;
}

export interface TmdbService {
  searchSeries(params: SearchSeriesParams): Promise<SeriesSearchResult>;
  getSeriesDetails(seriesTmdbId: number, includeProviders?: boolean): Promise<TmdbSeriesDetails>;
  getSeriesExternalIds(seriesTmdbId: number): Promise<TmdbSeriesExternalIds>;
}
