import type { TmdbService } from '../../domain/services/tmdbService.ts';
import type { TmdbSeries } from '../../domain/types/tmdbSeries.ts';

export interface SearchSeriesActionPayload {
  readonly query: string;
  readonly language: string;
}

export interface SeriesSearchActionResult {
  readonly page: number;
  readonly results: TmdbSeries[];
  readonly totalPages: number;
  readonly totalResults: number;
}

export class SearchSeriesAction {
  private readonly tmdbService: TmdbService;

  public constructor(tmdbService: TmdbService) {
    this.tmdbService = tmdbService;
  }

  public async execute(payload: SearchSeriesActionPayload): Promise<SeriesSearchActionResult> {
    const { query, language } = payload;

    const result = await this.tmdbService.searchSeries(query, language);

    return result;
  }
}
