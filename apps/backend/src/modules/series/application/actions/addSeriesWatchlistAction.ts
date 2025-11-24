import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import type { UserSeriesRatingRepository } from '../../domain/repositories/userSeriesRatingRepository.ts';
import type { UserSeriesWatchlistRepository } from '../../domain/repositories/userSeriesWatchlistRepository.ts';
import type { UserSeriesWatchlist, WatchlistType } from '../../domain/types/userSeriesWatchlist.ts';

interface AddSeriesWatchlistPayload {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly type: WatchlistType;
}

export class AddSeriesWatchlistAction {
  private readonly seriesWatchlistRepository: UserSeriesWatchlistRepository;
  private readonly seriesRatingRepository: UserSeriesRatingRepository;
  private readonly databaseClient: DatabaseClient;
  private readonly loggerService: LoggerService;

  public constructor(
    seriesWatchlistRepository: UserSeriesWatchlistRepository,
    seriesRatingRepository: UserSeriesRatingRepository,
    databaseClient: DatabaseClient,
    loggerService: LoggerService,
  ) {
    this.seriesWatchlistRepository = seriesWatchlistRepository;
    this.seriesRatingRepository = seriesRatingRepository;
    this.databaseClient = databaseClient;
    this.loggerService = loggerService;
  }

  public async execute(payload: AddSeriesWatchlistPayload, context: ExecutionContext): Promise<UserSeriesWatchlist> {
    const { userId, seriesTmdbId, type } = payload;

    const existing = await this.seriesWatchlistRepository.findOne(userId, seriesTmdbId);

    if (existing) {
      throw new ResourceAlreadyExistsError({
        resource: 'Series Watchlist',
        reason: 'Series is already in watchlist',
        userId,
        seriesTmdbId: seriesTmdbId.toString(),
      });
    }

    const startTime = Date.now();

    try {
      const result = await this.databaseClient.db.transaction(
        async (tx) => {
          const seriesRating = await this.seriesRatingRepository.findOne(userId, seriesTmdbId, tx);

          if (seriesRating) {
            await this.seriesRatingRepository.delete(userId, seriesTmdbId, tx);

            this.loggerService.info({
              message: 'Series rating removed before adding to watchlist',
              event: 'series.rating.removed',
              requestId: context.requestId,
              userId,
              seriesTmdbId,
            });
          }

          return await this.seriesWatchlistRepository.create({ userId, seriesTmdbId, type }, tx);
        },
        {
          isolationLevel: 'read committed',
        },
      );

      const duration = Date.now() - startTime;

      this.loggerService.info({
        message: 'Series added to watchlist',
        event: 'series.watchlist.added',
        requestId: context.requestId,
        userId,
        seriesTmdbId,
        type,
        transactionDuration: duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.loggerService.error({
        message: 'Add series watchlist transaction failed',
        event: 'series.watchlist.transaction.failure',
        requestId: context.requestId,
        userId,
        seriesTmdbId,
        transactionDuration: duration,
        err: error,
      });

      throw error;
    }
  }
}
