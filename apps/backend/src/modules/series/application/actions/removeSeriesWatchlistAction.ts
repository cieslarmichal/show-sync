import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { UserSeriesWatchlistRepository } from '../../domain/repositories/userSeriesWatchlistRepository.ts';

interface RemoveSeriesWatchlistPayload {
  readonly userId: string;
  readonly seriesTmdbId: number;
}

export class RemoveSeriesWatchlistAction {
  private readonly seriesWatchlistRepository: UserSeriesWatchlistRepository;
  private readonly loggerService: LoggerService;

  public constructor(seriesWatchlistRepository: UserSeriesWatchlistRepository, loggerService: LoggerService) {
    this.seriesWatchlistRepository = seriesWatchlistRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: RemoveSeriesWatchlistPayload, context: ExecutionContext): Promise<void> {
    const { userId, seriesTmdbId } = payload;

    const existing = await this.seriesWatchlistRepository.findOne(userId, seriesTmdbId);

    if (!existing) {
      throw new ResourceNotFoundError({
        resource: 'Series Watchlist',
        userId,
        seriesTmdbId: seriesTmdbId.toString(),
      });
    }

    await this.seriesWatchlistRepository.delete(userId, seriesTmdbId);

    this.loggerService.info({
      message: 'Series removed from watchlist',
      event: 'series.watchlist.removed',
      requestId: context.requestId,
      userId,
      seriesTmdbId,
    });
  }
}
