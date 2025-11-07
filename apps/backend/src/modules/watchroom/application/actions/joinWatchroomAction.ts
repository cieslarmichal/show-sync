import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { Config } from '../../../../core/config.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { type WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

export interface JoinWatchroomActionPayload {
  readonly publicLinkId: string;
  readonly userId: string;
}

export class JoinWatchroomAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly loggerService: LoggerService;
  private readonly databaseClient: DatabaseClient;
  private readonly config: Config;

  public constructor(
    watchroomRepository: WatchroomRepository,
    loggerService: LoggerService,
    databaseClient: DatabaseClient,
    config: Config,
  ) {
    this.watchroomRepository = watchroomRepository;
    this.loggerService = loggerService;
    this.databaseClient = databaseClient;
    this.config = config;
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

    const startTime = Date.now();

    try {
      await this.databaseClient.db.transaction(
        async (tx) => {
          // Check if already a participant within the transaction
          const isParticipant = await this.watchroomRepository.isParticipant(watchroom.id, userId, tx);

          if (isParticipant) {
            throw new ResourceAlreadyExistsError({
              resource: 'WatchroomParticipant',
              reason: 'User is already a participant of this watchroom',
              watchroomId: watchroom.id,
              userId,
            });
          }

          // Check if watchroom has reached maximum participants
          const participantCount = await this.watchroomRepository.countParticipants(watchroom.id, tx);
          const maxParticipants = this.config.watchroom.maxParticipants;

          if (participantCount >= maxParticipants) {
            throw new OperationNotValidError({
              reason: `Watchroom has reached maximum capacity of ${maxParticipants.toString()} participants`,
              watchroomId: watchroom.id,
              currentParticipants: participantCount,
              maxParticipants,
            });
          }

          await this.watchroomRepository.addParticipant(watchroom.id, userId, tx);
        },
        {
          isolationLevel: 'serializable',
        },
      );

      const duration = Date.now() - startTime;

      this.loggerService.info({
        message: 'Watchroom joined successfully',
        event: 'watchroom.join.success',
        requestId: context.requestId,
        watchroomId: watchroom.id,
        userId,
        transactionDuration: duration,
      });

      return watchroom;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof ResourceAlreadyExistsError || error instanceof OperationNotValidError) {
        throw error;
      }

      this.loggerService.error({
        message: 'Join watchroom transaction failed',
        event: 'watchroom.join.transaction.failure',
        requestId: context.requestId,
        watchroomId: watchroom.id,
        userId,
        transactionDuration: duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}
