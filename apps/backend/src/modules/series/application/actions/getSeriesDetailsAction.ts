import type { TmdbService } from '../../domain/services/tmdbService.ts';
import type { TmdbSeriesDetails } from '../../domain/types/tmdbSeries.ts';

interface GetSeriesDetailsPayload {
  readonly seriesTmdbId: number;
}

export class GetSeriesDetailsAction {
  private readonly tmdbService: TmdbService;

  public constructor(tmdbService: TmdbService) {
    this.tmdbService = tmdbService;
  }

  public async execute(payload: GetSeriesDetailsPayload): Promise<TmdbSeriesDetails> {
    const { seriesTmdbId } = payload;

    const details = await this.tmdbService.getSeriesDetails(seriesTmdbId);

    return details;
  }
}
