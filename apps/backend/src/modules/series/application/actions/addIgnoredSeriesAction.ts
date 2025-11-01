import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/database.ts';
import type { FavoriteSeriesRepository } from '../../domain/repositories/favoriteSeriesRepository.ts';
import type { IgnoredSeriesRepository } from '../../domain/repositories/ignoredSeriesRepository.ts';
import type { IgnoredSeries } from '../../domain/types/ignoredSeries.ts';

export class AddIgnoredSeriesAction {
  private readonly ignoredSeriesRepository: IgnoredSeriesRepository;
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;
  private readonly database: DatabaseClient;
  private readonly loggerService: LoggerService;

  public constructor(
    ignoredSeriesRepository: IgnoredSeriesRepository,
    favoriteSeriesRepository: FavoriteSeriesRepository,
    database: DatabaseClient,
    loggerService: LoggerService,
  ) {
    this.ignoredSeriesRepository = ignoredSeriesRepository;
    this.favoriteSeriesRepository = favoriteSeriesRepository;
    this.database = database;
    this.loggerService = loggerService;
  }

  public async execute(userId: string, seriesTmdbId: number): Promise<IgnoredSeries> {
    const existing = await this.ignoredSeriesRepository.findOne(userId, seriesTmdbId);

    if (existing) {
      throw new ResourceAlreadyExistsError({
        resource: 'Ignored Series',
        reason: 'Series is already in ignored list',
        userId,
        seriesTmdbId: seriesTmdbId.toString(),
      });
    }

    const result = await this.database.db.transaction(async (tx) => {
      const favoriteSeries = await this.favoriteSeriesRepository.findOne(userId, seriesTmdbId, tx);

      if (favoriteSeries) {
        await this.favoriteSeriesRepository.delete(userId, seriesTmdbId, tx);

        this.loggerService.info({
          message: 'Series removed from favorites before adding to ignored list',
          userId,
          seriesTmdbId,
        });
      }

      return await this.ignoredSeriesRepository.create({ userId, seriesTmdbId }, tx);
    });

    this.loggerService.info({
      message: 'Series added to ignored list',
      userId,
      seriesTmdbId,
    });

    return result;
  }
}
