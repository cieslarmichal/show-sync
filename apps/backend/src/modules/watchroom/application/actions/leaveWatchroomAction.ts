import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';

export interface LeaveWatchroomActionPayload {
  readonly watchroomId: string;
  readonly userId: string;
}

export class LeaveWatchroomAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly loggerService: LoggerService;

  public constructor(watchroomRepository: WatchroomRepository, loggerService: LoggerService) {
    this.watchroomRepository = watchroomRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: LeaveWatchroomActionPayload, context: ExecutionContext): Promise<void> {
    const { watchroomId, userId } = payload;

    this.loggerService.debug({
      message: 'Leaving watchroom...',
      requestId: context.requestId,
      watchroomId,
      userId,
    });

    const watchroom = await this.watchroomRepository.findOne({ id: watchroomId });

    if (!watchroom) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: watchroomId,
      });
    }

    if (watchroom.ownerId === userId) {
      throw new OperationNotValidError({
        reason: 'Owner cannot leave the watchroom. Transfer ownership or delete the watchroom instead.',
        watchroomId,
        userId,
      });
    }

    const isParticipant = watchroom.participants.some((p) => p.id === userId);

    if (!isParticipant) {
      throw new ResourceNotFoundError({
        resource: 'WatchroomParticipant',
        id: userId,
      });
    }

    await this.watchroomRepository.removeParticipant(watchroomId, userId);

    this.loggerService.info({
      message: 'Left watchroom successfully.',
      requestId: context.requestId,
      watchroomId,
      userId,
    });
  }
}
