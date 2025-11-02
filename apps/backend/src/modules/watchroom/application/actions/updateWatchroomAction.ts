import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

export interface UpdateWatchroomActionPayload {
  readonly watchroomId: string;
  readonly userId: string;
  readonly name?: string | undefined;
  readonly description?: string | undefined;
}

export class UpdateWatchroomAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly loggerService: LoggerService;

  public constructor(watchroomRepository: WatchroomRepository, loggerService: LoggerService) {
    this.watchroomRepository = watchroomRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: UpdateWatchroomActionPayload, context: ExecutionContext): Promise<Watchroom> {
    const { watchroomId, userId, name, description } = payload;

    this.loggerService.debug({
      message: 'Updating watchroom...',
      requestId: context.requestId,
      watchroomId,
      userId,
      name,
      description,
    });

    const existingWatchroom = await this.watchroomRepository.findOne({ id: watchroomId });

    if (!existingWatchroom) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: watchroomId,
      });
    }

    if (existingWatchroom.ownerId !== userId) {
      throw new OperationNotValidError({
        reason: 'Only the owner can update the watchroom.',
        watchroomId,
        userId,
      });
    }

    const updatedWatchroom = await this.watchroomRepository.update(watchroomId, {
      name,
      description,
    });

    this.loggerService.info({
      message: 'Watchroom updated successfully.',
      requestId: context.requestId,
      watchroomId,
      userId,
    });

    return updatedWatchroom;
  }
}
