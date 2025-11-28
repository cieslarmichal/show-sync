import type { TmdbService } from '../../domain/services/tmdbService.ts';
import type { TmdbSeriesExternalIds } from '../../domain/types/tmdbSeries.ts';

interface GetSeriesExternalIdsPayload {
  readonly seriesTmdbId: number;
  readonly language: string;
}

export class GetSeriesExternalIdsAction {
  private readonly tmdbService: TmdbService;

  public constructor(tmdbService: TmdbService) {
    this.tmdbService = tmdbService;
  }

  public async execute(payload: GetSeriesExternalIdsPayload): Promise<TmdbSeriesExternalIds> {
    const { seriesTmdbId, language } = payload;

    return this.tmdbService.getSeriesExternalIds(seriesTmdbId, language);
  }
}
