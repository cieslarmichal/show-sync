import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';

export interface RemoveParticipantActionPayload {
  readonly watchroomId: string;
  readonly participantId: string;
  readonly requesterId: string;
}

export class RemoveParticipantAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly loggerService: LoggerService;

  public constructor(watchroomRepository: WatchroomRepository, loggerService: LoggerService) {
    this.watchroomRepository = watchroomRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: RemoveParticipantActionPayload, context: ExecutionContext): Promise<void> {
    const { watchroomId, participantId, requesterId } = payload;

    this.loggerService.debug({
      message: 'Removing participant from watchroom...',
      requestId: context.requestId,
      watchroomId,
      participantId,
      requesterId,
    });

    const watchroom = await this.watchroomRepository.findOne({ id: watchroomId });

    if (!watchroom) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: watchroomId,
      });
    }

    if (watchroom.ownerId !== requesterId) {
      throw new OperationNotValidError({
        reason: 'Only the watchroom owner can remove participants',
        watchroomId,
        requesterId,
      });
    }

    if (participantId === watchroom.ownerId) {
      throw new OperationNotValidError({
        reason: 'Cannot remove the owner from the watchroom',
        watchroomId,
        participantId,
      });
    }

    const isParticipant = watchroom.participants.some((p) => p.id === participantId);

    if (!isParticipant) {
      throw new ResourceNotFoundError({
        resource: 'WatchroomParticipant',
        id: participantId,
      });
    }

    await this.watchroomRepository.removeParticipant(watchroomId, participantId);

    this.loggerService.info({
      message: 'Participant removed from watchroom successfully.',
      requestId: context.requestId,
      watchroomId,
      participantId,
      requesterId,
    });
  }
}
