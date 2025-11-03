import type { TmdbService } from '../../domain/services/tmdbService.ts';
import type { TmdbSeriesDetails } from '../../domain/types/tmdbSeries.ts';

interface GetSeriesDetailsBatchPayload {
  readonly seriesIds: number[];
}

export class GetSeriesDetailsBatchAction {
  private readonly tmdbService: TmdbService;

  public constructor(tmdbService: TmdbService) {
    this.tmdbService = tmdbService;
  }

  public async execute(payload: GetSeriesDetailsBatchPayload): Promise<TmdbSeriesDetails[]> {
    const { seriesIds } = payload;

    const results = await Promise.allSettled(
      seriesIds.map((seriesTmdbId) => this.tmdbService.getSeriesDetails(seriesTmdbId)),
    );

    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<TmdbSeriesDetails> => result.status === 'fulfilled')
      .map((result) => result.value);

    return successfulResults;
  }
}
