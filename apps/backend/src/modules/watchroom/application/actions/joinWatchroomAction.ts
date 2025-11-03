import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

export interface JoinWatchroomActionPayload {
  readonly publicLinkId: string;
  readonly userId: string;
}

export class JoinWatchroomAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly loggerService: LoggerService;

  public constructor(watchroomRepository: WatchroomRepository, loggerService: LoggerService) {
    this.watchroomRepository = watchroomRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: JoinWatchroomActionPayload, context: ExecutionContext): Promise<Watchroom> {
    const { publicLinkId, userId } = payload;

    this.loggerService.debug({
      message: 'Joining watchroom',
      event: 'watchroom.join.start',
      requestId: context.requestId,
      publicLinkId,
      userId,
    });

    const watchroom = await this.watchroomRepository.findOne({ publicLinkId });

    if (!watchroom) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: publicLinkId,
      });
    }

    const isParticipant = watchroom.participants.some((p) => p.id === userId);

    if (isParticipant) {
      throw new ResourceAlreadyExistsError({
        resource: 'WatchroomParticipant',
        reason: 'User is already a participant of this watchroom',
        watchroomId: watchroom.id,
        userId,
      });
    }

    await this.watchroomRepository.addParticipant(watchroom.id, userId);

    this.loggerService.info({
      message: 'Watchroom joined successfully',
      event: 'watchroom.join.success',
      requestId: context.requestId,
      watchroomId: watchroom.id,
      userId,
    });

    return watchroom;
  }
}
