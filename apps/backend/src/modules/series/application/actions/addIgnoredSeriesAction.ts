import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import type { FavoriteSeriesRepository } from '../../domain/repositories/favoriteSeriesRepository.ts';
import type { IgnoredSeriesRepository } from '../../domain/repositories/ignoredSeriesRepository.ts';
import type { IgnoredSeries } from '../../domain/types/ignoredSeries.ts';

interface AddIgnoredSeriesPayload {
  readonly userId: string;
  readonly seriesTmdbId: number;
}

export class AddIgnoredSeriesAction {
  private readonly ignoredSeriesRepository: IgnoredSeriesRepository;
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;
  private readonly databaseClient: DatabaseClient;
  private readonly loggerService: LoggerService;

  public constructor(
    ignoredSeriesRepository: IgnoredSeriesRepository,
    favoriteSeriesRepository: FavoriteSeriesRepository,
    databaseClient: DatabaseClient,
    loggerService: LoggerService,
  ) {
    this.ignoredSeriesRepository = ignoredSeriesRepository;
    this.favoriteSeriesRepository = favoriteSeriesRepository;
    this.databaseClient = databaseClient;
    this.loggerService = loggerService;
  }

  public async execute(payload: AddIgnoredSeriesPayload, context: ExecutionContext): Promise<IgnoredSeries> {
    const { userId, seriesTmdbId } = payload;

    const existing = await this.ignoredSeriesRepository.findOne(userId, seriesTmdbId);

    if (existing) {
      throw new ResourceAlreadyExistsError({
        resource: 'Ignored Series',
        reason: 'Series is already in ignored list',
        userId,
        seriesTmdbId: seriesTmdbId.toString(),
      });
    }

    const result = await this.databaseClient.db.transaction(async (tx) => {
      const favoriteSeries = await this.favoriteSeriesRepository.findOne(userId, seriesTmdbId, tx);

      if (favoriteSeries) {
        await this.favoriteSeriesRepository.delete(userId, seriesTmdbId, tx);

        this.loggerService.info({
          message: 'Series removed from favorites before adding to ignored list',
          event: 'series.favorite.removed',
          requestId: context.requestId,
          userId,
          seriesTmdbId,
        });
      }

      return await this.ignoredSeriesRepository.create({ userId, seriesTmdbId }, tx);
    });

    this.loggerService.info({
      message: 'Series added to ignored list',
      event: 'series.ignored.added',
      requestId: context.requestId,
      userId,
      seriesTmdbId,
    });

    return result;
  }
}
