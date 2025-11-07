import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';

export interface LeaveWatchroomActionPayload {
  readonly watchroomId: string;
  readonly userId: string;
}

export class LeaveWatchroomAction {
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

  public async execute(payload: LeaveWatchroomActionPayload, context: ExecutionContext): Promise<void> {
    const { watchroomId, userId } = payload;

    this.loggerService.debug({
      message: 'Leaving watchroom',
      event: 'watchroom.leave.start',
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

    const startTime = Date.now();

    try {
      await this.databaseClient.db.transaction(
        async (tx) => {
          // Check if user is a participant within the transaction
          const isParticipant = await this.watchroomRepository.isParticipant(watchroomId, userId, tx);

          if (!isParticipant) {
            throw new ResourceNotFoundError({
              resource: 'WatchroomParticipant',
              id: userId,
            });
          }

          await this.watchroomRepository.removeParticipant(watchroomId, userId, tx);
        },
        {
          isolationLevel: 'serializable',
        },
      );

      const duration = Date.now() - startTime;

      this.loggerService.info({
        message: 'Left watchroom successfully',
        event: 'watchroom.leave.success',
        requestId: context.requestId,
        watchroomId,
        userId,
        transactionDuration: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof ResourceNotFoundError) {
        throw error;
      }

      this.loggerService.error({
        message: 'Leave watchroom transaction failed',
        event: 'watchroom.leave.transaction.failure',
        requestId: context.requestId,
        watchroomId,
        userId,
        transactionDuration: duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}
