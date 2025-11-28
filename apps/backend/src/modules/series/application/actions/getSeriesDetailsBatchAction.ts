import type { TmdbService } from '../../domain/services/tmdbService.ts';
import type { TmdbSeriesDetails } from '../../domain/types/tmdbSeries.ts';

interface GetSeriesDetailsBatchPayload {
  readonly seriesIds: number[];
  readonly language: string;
  readonly includeProviders?: boolean;
}

export class GetSeriesDetailsBatchAction {
  private readonly tmdbService: TmdbService;

  public constructor(tmdbService: TmdbService) {
    this.tmdbService = tmdbService;
  }

  public async execute(payload: GetSeriesDetailsBatchPayload): Promise<TmdbSeriesDetails[]> {
    const { seriesIds, language, includeProviders = false } = payload;

    const results = await Promise.allSettled(
      seriesIds.map((seriesTmdbId) => this.tmdbService.getSeriesDetails(seriesTmdbId, language, includeProviders)),
    );

    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<TmdbSeriesDetails> => result.status === 'fulfilled')
      .map((result) => result.value);

    return successfulResults;
  }
}
