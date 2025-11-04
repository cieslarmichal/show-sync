import type { TmdbService } from '../../../series/domain/services/tmdbService.ts';

interface AIRecommendation {
  readonly seriesName: string;
  readonly justification: string;
}

interface ResolvedRecommendation {
  readonly seriesTmdbId: number;
  readonly justification: string;
}

interface ResolutionResult {
  readonly resolved: ResolvedRecommendation[];
  readonly failed: string[];
  readonly skipped: string[];
}

export class SeriesNameResolver {
  private readonly tmdbService: TmdbService;

  public constructor(tmdbService: TmdbService) {
    this.tmdbService = tmdbService;
  }

  public async resolve(
    recommendations: AIRecommendation[],
    favoriteSeriesIds: number[],
    ignoredSeriesIds: number[],
  ): Promise<ResolutionResult> {
    const results = await Promise.allSettled(
      recommendations.map(async (recommendation) => {
        const searchResult = await this.tmdbService.searchSeries({
          query: recommendation.seriesName,
          page: 1,
        });

        const firstResult = searchResult.results[0];

        if (!firstResult) {
          return { type: 'failed' as const, seriesName: recommendation.seriesName };
        }

        const isAlreadyProcessed =
          favoriteSeriesIds.includes(firstResult.id) || ignoredSeriesIds.includes(firstResult.id);

        if (isAlreadyProcessed) {
          return { type: 'skipped' as const, seriesName: recommendation.seriesName };
        }

        return {
          type: 'resolved' as const,
          seriesTmdbId: firstResult.id,
          justification: recommendation.justification,
        };
      }),
    );

    const resolved: ResolvedRecommendation[] = [];
    const failed: string[] = [];
    const skipped: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const outcome = result.value;
        switch (outcome.type) {
          case 'resolved':
            resolved.push({
              seriesTmdbId: outcome.seriesTmdbId,
              justification: outcome.justification,
            });
            break;
          case 'failed':
            failed.push(outcome.seriesName);
            break;
          case 'skipped':
            skipped.push(outcome.seriesName);
            break;
        }
      } else {
        const recommendation = recommendations[index];
        if (recommendation) {
          failed.push(recommendation.seriesName);
        }
      }
    });

    return { resolved, failed, skipped };
  }
}
