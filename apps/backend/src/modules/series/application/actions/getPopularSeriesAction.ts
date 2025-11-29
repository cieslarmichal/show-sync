import type { TmdbService } from '../../domain/services/tmdbService.ts';
import type { TmdbSeries } from '../../domain/types/tmdbSeries.ts';

export interface GetPopularSeriesPayload {
  readonly language: string;
}

export class GetPopularSeriesAction {
  private readonly tmdbService: TmdbService;

  public constructor(tmdbService: TmdbService) {
    this.tmdbService = tmdbService;
  }

  public async execute(payload: GetPopularSeriesPayload): Promise<TmdbSeries[]> {
    const { language } = payload;

    const popularSeries = await this.tmdbService.getPopularSeries(language);

    return popularSeries;
  }
}
