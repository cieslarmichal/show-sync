import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import type { UserSeriesRatingRepository } from '../../domain/repositories/userSeriesRatingRepository.ts';
import type { UserSeriesRating, SeriesRating } from '../../domain/types/userSeriesRating.ts';

interface AddSeriesRatingPayload {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly rating: SeriesRating;
}

export class AddSeriesRatingAction {
  private readonly seriesRatingRepository: UserSeriesRatingRepository;
  private readonly databaseClient: DatabaseClient;
  private readonly loggerService: LoggerService;

  public constructor(
    seriesRatingRepository: UserSeriesRatingRepository,
    databaseClient: DatabaseClient,
    loggerService: LoggerService,
  ) {
    this.seriesRatingRepository = seriesRatingRepository;
    this.databaseClient = databaseClient;
    this.loggerService = loggerService;
  }

  public async execute(payload: AddSeriesRatingPayload, context: ExecutionContext): Promise<UserSeriesRating> {
    const { userId, seriesTmdbId, rating } = payload;

    const startTime = Date.now();

    try {
      const seriesRating = await this.databaseClient.db.transaction(
        async (tx) => {
          const existing = await this.seriesRatingRepository.findOne(userId, seriesTmdbId);

          if (!existing) {
            return await this.seriesRatingRepository.create({ userId, seriesTmdbId, rating }, tx);
          }

          if (existing.rating === rating) {
            throw new ResourceAlreadyExistsError({
              resource: 'Series Rating',
              reason: 'Series is already rated with the same rating',
              userId,
              seriesTmdbId,
              rating,
            });
          }

          return await this.seriesRatingRepository.updateRating({ userId, seriesTmdbId, rating }, tx);
        },
        {
          isolationLevel: 'serializable',
        },
      );

      const duration = Date.now() - startTime;

      this.loggerService.info({
        message: 'Series rating added',
        event: 'series.rating.added',
        requestId: context.requestId,
        userId,
        seriesTmdbId,
        rating,
        transactionDuration: duration,
      });

      return seriesRating;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.loggerService.error({
        message: 'Add series rating transaction failed',
        event: 'series.rating.transaction.failure',
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
