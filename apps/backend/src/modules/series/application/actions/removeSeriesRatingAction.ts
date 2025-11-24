import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { UserSeriesRatingRepository } from '../../domain/repositories/userSeriesRatingRepository.ts';

interface RemoveSeriesRatingPayload {
  readonly userId: string;
  readonly seriesTmdbId: number;
}

export class RemoveSeriesRatingAction {
  private readonly seriesRatingRepository: UserSeriesRatingRepository;
  private readonly loggerService: LoggerService;

  public constructor(seriesRatingRepository: UserSeriesRatingRepository, loggerService: LoggerService) {
    this.seriesRatingRepository = seriesRatingRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: RemoveSeriesRatingPayload, context: ExecutionContext): Promise<void> {
    const { userId, seriesTmdbId } = payload;

    const existing = await this.seriesRatingRepository.findOne(userId, seriesTmdbId);

    if (!existing) {
      throw new ResourceNotFoundError({
        resource: 'Series Rating',
        reason: 'Series rating not found',
        userId,
        seriesTmdbId: seriesTmdbId.toString(),
      });
    }

    await this.seriesRatingRepository.delete(userId, seriesTmdbId);

    this.loggerService.info({
      message: 'Series rating removed',
      event: 'series.rating.removed',
      requestId: context.requestId,
      userId,
      seriesTmdbId,
    });
  }
}
