import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { FavoriteSeriesRepository } from '../../domain/repositories/favoriteSeriesRepository.ts';
import type { FavoriteSeries, PreferenceLevel } from '../../domain/types/favoriteSeries.ts';

export interface UpdateFavoriteSeriesPreferencePayload {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly preferenceLevel: PreferenceLevel;
}

export class UpdateFavoriteSeriesPreferenceAction {
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;
  private readonly loggerService: LoggerService;

  public constructor(favoriteSeriesRepository: FavoriteSeriesRepository, loggerService: LoggerService) {
    this.favoriteSeriesRepository = favoriteSeriesRepository;
    this.loggerService = loggerService;
  }

  public async execute(
    payload: UpdateFavoriteSeriesPreferencePayload,
    context: ExecutionContext,
  ): Promise<FavoriteSeries> {
    const { userId, seriesTmdbId, preferenceLevel } = payload;

    const updated = await this.favoriteSeriesRepository.updatePreferenceLevel({
      userId,
      seriesTmdbId,
      preferenceLevel,
    });

    this.loggerService.info({
      message: 'Series preference level updated',
      requestId: context.requestId,
      userId,
      seriesTmdbId,
      preferenceLevel,
    });

    return updated;
  }
}
