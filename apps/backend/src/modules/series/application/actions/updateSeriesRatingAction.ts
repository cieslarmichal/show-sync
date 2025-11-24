import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { UserSeriesRatingRepository } from '../../domain/repositories/userSeriesRatingRepository.ts';
import type { UserSeriesRating, SeriesRating } from '../../domain/types/userSeriesRating.ts';

export interface UpdateSeriesRatingPayload {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly rating: SeriesRating;
}

export class UpdateSeriesRatingAction {
  private readonly seriesRatingRepository: UserSeriesRatingRepository;
  private readonly loggerService: LoggerService;

  public constructor(seriesRatingRepository: UserSeriesRatingRepository, loggerService: LoggerService) {
    this.seriesRatingRepository = seriesRatingRepository;
    this.loggerService = loggerService;
  }

  public async execute(
    payload: UpdateSeriesRatingPayload,
    context: ExecutionContext,
  ): Promise<UserSeriesRating> {
    const { userId, seriesTmdbId, rating } = payload;

    const updated = await this.seriesRatingRepository.updateRating({
      userId,
      seriesTmdbId,
      rating,
    });

    this.loggerService.info({
      message: 'Series rating updated',
      event: 'series.rating.updated',
      requestId: context.requestId,
      userId,
      seriesTmdbId,
      rating,
    });

    return updated;
  }
}
