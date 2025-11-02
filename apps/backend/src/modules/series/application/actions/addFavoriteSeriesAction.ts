import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/database.ts';
import type { FavoriteSeriesRepository } from '../../domain/repositories/favoriteSeriesRepository.ts';
import type { IgnoredSeriesRepository } from '../../domain/repositories/ignoredSeriesRepository.ts';
import type { FavoriteSeries, PreferenceLevel } from '../../domain/types/favoriteSeries.ts';

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

  public async execute(
    userId: string,
    seriesTmdbId: number,
    preferenceLevel: PreferenceLevel,
  ): Promise<FavoriteSeries> {
    const existing = await this.favoriteSeriesRepository.findOne(userId, seriesTmdbId);

    if (existing) {
      throw new ResourceAlreadyExistsError({
        resource: 'Favorite Series',
        reason: 'Series is already in favorites',
        userId,
        seriesTmdbId: seriesTmdbId.toString(),
      });
    }

    const favoriteSeries = await this.databaseClient.db.transaction(async (tx) => {
      const ignoredSeries = await this.ignoredSeriesRepository.findOne(userId, seriesTmdbId, tx);

      if (ignoredSeries) {
        await this.ignoredSeriesRepository.delete(userId, seriesTmdbId, tx);

        this.loggerService.info({
          message: 'Series removed from ignored list before adding to favorites',
          userId,
          seriesTmdbId,
        });
      }

      return await this.favoriteSeriesRepository.create({ userId, seriesTmdbId, preferenceLevel }, tx);
    });

    this.loggerService.info({
      message: 'Series added to favorites',
      userId,
      seriesTmdbId,
      preferenceLevel,
    });

    return favoriteSeries;
  }
}
