import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { WatchroomRepository } from '../../../watchroom/domain/repositories/watchroomRepository.ts';
import type { RecommendationRequestRepository } from '../../domain/repositories/recommendationRequestRepository.ts';

export interface CreateRecommendationRequestActionPayload {
  readonly watchroomId: string;
  readonly userId: string;
}

export interface CreateRecommendationRequestActionResult {
  readonly recommendationRequestId: string;
}

export class CreateRecommendationRequestAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRequestRepository: RecommendationRequestRepository;
  private readonly loggerService: LoggerService;
  private readonly dailyRequests: number;

  public constructor(
    watchroomRepository: WatchroomRepository,
    recommendationRequestRepository: RecommendationRequestRepository,
    loggerService: LoggerService,
    dailyRequests: number,
  ) {
    this.watchroomRepository = watchroomRepository;
    this.recommendationRequestRepository = recommendationRequestRepository;
    this.loggerService = loggerService;
    this.dailyRequests = dailyRequests;
  }

  public async execute(
    payload: CreateRecommendationRequestActionPayload,
    context: ExecutionContext,
  ): Promise<CreateRecommendationRequestActionResult> {
    const { watchroomId, userId } = payload;

    this.loggerService.debug({
      message: 'Creating recommendation request',
      event: 'watchroom.recommendation_request.create.start',
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
      throw new ForbiddenAccessError({
        reason: 'Only the watchroom owner can generate recommendations',
      });
    }

    const currentCount = await this.recommendationRequestRepository.countCompletedTodayAndCurrentlyProcessing(userId);

    if (currentCount >= this.dailyRequests) {
      this.loggerService.warn({
        message: 'User exceeded maximum recommendation limit',
        event: 'watchroom.recommendation_request.create.limit_exceeded',
        requestId: context.requestId,
        userId,
        currentCount,
        dailyRequests: this.dailyRequests,
      });

      throw new OperationNotValidError({
        reason: `Maximum request limit reached (${String(this.dailyRequests)}).`,
      });
    }

    const recommendationRequest = await this.recommendationRequestRepository.create({
      userId,
      watchroomId,
      status: 'pending',
    });

    this.loggerService.info({
      message: 'Recommendation request created successfully',
      event: 'watchroom.recommendation_request.create.success',
      requestId: context.requestId,
      watchroomId,
      recommendationRequestId: recommendationRequest.id,
      userRecommendationCount: currentCount + 1,
    });

    return {
      recommendationRequestId: recommendationRequest.id,
    };
  }
}
