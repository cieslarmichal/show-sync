import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';

export interface RemoveParticipantActionPayload {
  readonly watchroomId: string;
  readonly participantId: string;
  readonly requesterId: string;
}

export class RemoveParticipantAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly loggerService: LoggerService;
  private readonly databaseClient: DatabaseClient;

  public constructor(
    watchroomRepository: WatchroomRepository,
    loggerService: LoggerService,
    databaseClient: DatabaseClient,
  ) {
    this.watchroomRepository = watchroomRepository;
    this.loggerService = loggerService;
    this.databaseClient = databaseClient;
  }

  public async execute(payload: RemoveParticipantActionPayload, context: ExecutionContext): Promise<void> {
    const { watchroomId, participantId, requesterId } = payload;

    this.loggerService.debug({
      message: 'Removing participant from watchroom',
      event: 'watchroom.participant.remove.start',
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

    const startTime = Date.now();

    try {
      await this.databaseClient.db.transaction(
        async (tx) => {
          // Check if user is a participant within the transaction
          const isParticipant = await this.watchroomRepository.isParticipant(watchroomId, participantId, tx);

          if (!isParticipant) {
            throw new ResourceNotFoundError({
              resource: 'WatchroomParticipant',
              id: participantId,
            });
          }

          await this.watchroomRepository.removeParticipant(watchroomId, participantId, tx);
        },
        {
          isolationLevel: 'serializable',
        },
      );

      const duration = Date.now() - startTime;

      this.loggerService.info({
        message: 'Participant removed from watchroom successfully',
        event: 'watchroom.participant.remove.success',
        requestId: context.requestId,
        watchroomId,
        participantId,
        requesterId,
        transactionDuration: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof ResourceNotFoundError) {
        throw error;
      }

      this.loggerService.error({
        message: 'Remove participant transaction failed',
        event: 'watchroom.participant.remove.transaction.failure',
        requestId: context.requestId,
        watchroomId,
        participantId,
        requesterId,
        transactionDuration: duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}
