import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { FavoriteSeriesRepository } from '../../domain/repositories/favoriteSeriesRepository.ts';

interface RemoveFavoriteSeriesPayload {
  readonly userId: string;
  readonly seriesTmdbId: number;
}

export class RemoveFavoriteSeriesAction {
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;
  private readonly loggerService: LoggerService;

  public constructor(favoriteSeriesRepository: FavoriteSeriesRepository, loggerService: LoggerService) {
    this.favoriteSeriesRepository = favoriteSeriesRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: RemoveFavoriteSeriesPayload, context: ExecutionContext): Promise<void> {
    const { userId, seriesTmdbId } = payload;

    const existing = await this.favoriteSeriesRepository.findOne(userId, seriesTmdbId);

    if (!existing) {
      throw new ResourceNotFoundError({
        resource: 'Favorite Series',
        reason: 'Series not found in favorites',
        userId,
        seriesTmdbId: seriesTmdbId.toString(),
      });
    }

    await this.favoriteSeriesRepository.delete(userId, seriesTmdbId);

    this.loggerService.info({
      message: 'Series removed from favorites',
      event: 'series.favorite.removed',
      requestId: context.requestId,
      userId,
      seriesTmdbId,
    });
  }
}
