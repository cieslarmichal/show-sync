import type { TmdbSeries, TmdbSeriesDetails, TmdbSeriesExternalIds } from '../types/tmdbSeries.ts';

export interface SeriesSearchResult {
  readonly page: number;
  readonly results: TmdbSeries[];
  readonly totalPages: number;
  readonly totalResults: number;
}

export interface TmdbService {
  searchSeries(query: string, language: string): Promise<SeriesSearchResult>;
  getSeriesDetails(seriesTmdbId: number, language: string, includeProviders?: boolean): Promise<TmdbSeriesDetails>;
  getSeriesExternalIds(seriesTmdbId: number, language: string): Promise<TmdbSeriesExternalIds>;
  getPopularSeries(language: string): Promise<TmdbSeries[]>;
}
