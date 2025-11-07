import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import type { FavoriteSeriesRepository } from '../../domain/repositories/favoriteSeriesRepository.ts';
import type { IgnoredSeriesRepository } from '../../domain/repositories/ignoredSeriesRepository.ts';
import type { FavoriteSeries, PreferenceLevel } from '../../domain/types/favoriteSeries.ts';

interface AddFavoriteSeriesPayload {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly preferenceLevel: PreferenceLevel;
}

export class AddFavoriteSeriesAction {
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;
  private readonly ignoredSeriesRepository: IgnoredSeriesRepository;
  private readonly databaseClient: DatabaseClient;
  private readonly loggerService: LoggerService;

  public constructor(
    favoriteSeriesRepository: FavoriteSeriesRepository,
    ignoredSeriesRepository: IgnoredSeriesRepository,
    databaseClient: DatabaseClient,
    loggerService: LoggerService,
  ) {
    this.favoriteSeriesRepository = favoriteSeriesRepository;
    this.ignoredSeriesRepository = ignoredSeriesRepository;
    this.databaseClient = databaseClient;
    this.loggerService = loggerService;
  }

  public async execute(payload: AddFavoriteSeriesPayload, context: ExecutionContext): Promise<FavoriteSeries> {
    const { userId, seriesTmdbId, preferenceLevel } = payload;

    const existing = await this.favoriteSeriesRepository.findOne(userId, seriesTmdbId);

    if (existing) {
      throw new ResourceAlreadyExistsError({
        resource: 'Favorite Series',
        reason: 'Series is already in favorites',
        userId,
        seriesTmdbId: seriesTmdbId.toString(),
      });
    }

    const startTime = Date.now();

    try {
      const favoriteSeries = await this.databaseClient.db.transaction(
        async (tx) => {
          const ignoredSeries = await this.ignoredSeriesRepository.findOne(userId, seriesTmdbId, tx);

          if (ignoredSeries) {
            await this.ignoredSeriesRepository.delete(userId, seriesTmdbId, tx);

            this.loggerService.info({
              message: 'Series removed from ignored list before adding to favorites',
              event: 'series.ignored.removed',
              requestId: context.requestId,
              userId,
              seriesTmdbId,
            });
          }

          return await this.favoriteSeriesRepository.create({ userId, seriesTmdbId, preferenceLevel }, tx);
        },
        {
          isolationLevel: 'read committed',
        },
      );

      const duration = Date.now() - startTime;

      this.loggerService.info({
        message: 'Series added to favorites',
        event: 'series.favorite.added',
        requestId: context.requestId,
        userId,
        seriesTmdbId,
        preferenceLevel,
        transactionDuration: duration,
      });

      return favoriteSeries;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.loggerService.error({
        message: 'Add favorite series transaction failed',
        event: 'series.favorite.transaction.failure',
        requestId: context.requestId,
        userId,
        seriesTmdbId,
        transactionDuration: duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}
