import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { IgnoredSeriesRepository } from '../../domain/repositories/ignoredSeriesRepository.ts';

interface RemoveIgnoredSeriesPayload {
  readonly userId: string;
  readonly seriesTmdbId: number;
}

export class RemoveIgnoredSeriesAction {
  private readonly ignoredSeriesRepository: IgnoredSeriesRepository;
  private readonly loggerService: LoggerService;

  public constructor(ignoredSeriesRepository: IgnoredSeriesRepository, loggerService: LoggerService) {
    this.ignoredSeriesRepository = ignoredSeriesRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: RemoveIgnoredSeriesPayload, context: ExecutionContext): Promise<void> {
    const { userId, seriesTmdbId } = payload;

    const existing = await this.ignoredSeriesRepository.findOne(userId, seriesTmdbId);

    if (!existing) {
      throw new ResourceNotFoundError({
        resource: 'Ignored Series',
        userId,
        seriesTmdbId: seriesTmdbId.toString(),
      });
    }

    await this.ignoredSeriesRepository.delete(userId, seriesTmdbId);

    this.loggerService.info({
      message: 'Series removed from ignored list',
      event: 'series.ignored.removed',
      requestId: context.requestId,
      userId,
      seriesTmdbId,
    });
  }
}
