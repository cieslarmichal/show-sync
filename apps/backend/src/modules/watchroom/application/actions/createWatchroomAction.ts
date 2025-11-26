import { IdService } from '../../../../common/id/idService.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

export interface CreateWatchroomActionPayload {
  readonly name: string;
  readonly description?: string | undefined;
  readonly availablePlatforms?: string[] | undefined;
  readonly seriesLengthPreference?: 'all' | 'excludeMiniSeries' | 'onlyMiniSeries' | undefined;
  readonly ownerId: string;
}

export class CreateWatchroomAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly loggerService: LoggerService;

  public constructor(watchroomRepository: WatchroomRepository, loggerService: LoggerService) {
    this.watchroomRepository = watchroomRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: CreateWatchroomActionPayload, context: ExecutionContext): Promise<Watchroom> {
    const { name, description, ownerId } = payload;

    const publicLinkId = IdService.generateNanoid();

    this.loggerService.debug({
      message: 'Creating watchroom',
      event: 'watchroom.create.start',
      requestId: context.requestId,
      name,
      description,
      ownerId,
      publicLinkId,
    });

    const watchroom = await this.watchroomRepository.create({
      name,
      description,
      availablePlatforms: payload.availablePlatforms,
      seriesLengthPreference: payload.seriesLengthPreference,
      ownerId,
      publicLinkId,
    });

    this.loggerService.info({
      message: 'Watchroom created successfully',
      event: 'watchroom.create.success',
      requestId: context.requestId,
      watchroomId: watchroom.id,
      name: watchroom.name,
      description: watchroom.description,
      ownerId: watchroom.ownerId,
      publicLinkId: watchroom.publicLinkId,
    });

    return watchroom;
  }
}
