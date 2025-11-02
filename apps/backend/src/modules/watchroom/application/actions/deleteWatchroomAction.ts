import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';

export interface DeleteWatchroomActionPayload {
  readonly watchroomId: string;
  readonly userId: string;
}

export class DeleteWatchroomAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly loggerService: LoggerService;

  public constructor(watchroomRepository: WatchroomRepository, loggerService: LoggerService) {
    this.watchroomRepository = watchroomRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: DeleteWatchroomActionPayload, context: ExecutionContext): Promise<void> {
    const { watchroomId, userId } = payload;

    this.loggerService.debug({
      message: 'Deleting watchroom...',
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

    if (watchroom.ownerId !== userId) {
      throw new OperationNotValidError({
        reason: 'Only the owner can delete the watchroom.',
        watchroomId,
        userId,
      });
    }

    await this.watchroomRepository.delete(watchroomId);

    this.loggerService.info({
      message: 'Watchroom deleted successfully.',
      requestId: context.requestId,
      watchroomId,
      userId,
    });
  }
}
