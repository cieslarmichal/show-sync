import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { WatchroomRepository } from '../../../watchroom/domain/repositories/watchroomRepository.ts';
import type { RecommendationFeedbackRepository } from '../../domain/repositories/recommendationFeedbackRepository.ts';
import type { RecommendationRequestRepository } from '../../domain/repositories/recommendationRequestRepository.ts';
import type { RecommendationFeedback } from '../../domain/types/recommendationFeedback.ts';

export interface SubmitRecommendationFeedbackActionPayload {
  readonly recommendationRequestId: string;
  readonly watchroomId: string;
  readonly userId: string;
  readonly rating: number;
  readonly foundSomething: boolean;
  readonly comment?: string | null;
}

export class SubmitRecommendationFeedbackAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRequestRepository: RecommendationRequestRepository;
  private readonly recommendationFeedbackRepository: RecommendationFeedbackRepository;
  private readonly loggerService: LoggerService;

  public constructor(
    watchroomRepository: WatchroomRepository,
    recommendationRequestRepository: RecommendationRequestRepository,
    recommendationFeedbackRepository: RecommendationFeedbackRepository,
    loggerService: LoggerService,
  ) {
    this.watchroomRepository = watchroomRepository;
    this.recommendationRequestRepository = recommendationRequestRepository;
    this.recommendationFeedbackRepository = recommendationFeedbackRepository;
    this.loggerService = loggerService;
  }

  public async execute(
    payload: SubmitRecommendationFeedbackActionPayload,
    context: ExecutionContext,
  ): Promise<RecommendationFeedback> {
    const { recommendationRequestId, watchroomId, userId, rating, foundSomething, comment } = payload;

    this.loggerService.debug({
      message: 'Submitting recommendation group feedback',
      event: 'recommendation_group_feedback.submit.start',
      requestId: context.requestId,
      recommendationRequestId,
      watchroomId,
      userId,
      rating,
      foundSomething,
    });

    const isParticipant = await this.watchroomRepository.isParticipant(watchroomId, userId);

    if (!isParticipant) {
      this.loggerService.warn({
        message: 'User is not a participant of the watchroom',
        event: 'recommendation_group_feedback.submit.forbidden',
        requestId: context.requestId,
        watchroomId,
        userId,
      });

      throw new ForbiddenAccessError({
        reason: 'You must be a participant of this watchroom to provide feedback',
      });
    }

    const recommendationRequest = await this.recommendationRequestRepository.findById(recommendationRequestId);

    if (!recommendationRequest || recommendationRequest.watchroomId !== watchroomId) {
      this.loggerService.warn({
        message: 'Recommendation request not found or does not belong to watchroom',
        event: 'recommendation_group_feedback.submit.not_found',
        requestId: context.requestId,
        recommendationRequestId,
        watchroomId,
      });

      throw new ResourceNotFoundError({
        resource: 'Recommendation request',
        id: recommendationRequestId,
      });
    }

    const existingFeedback = await this.recommendationFeedbackRepository.findByRecommendationRequestIdAndUserId(
      recommendationRequestId,
      userId,
    );

    if (existingFeedback) {
      this.loggerService.warn({
        message: 'Feedback already submitted',
        event: 'recommendation_group_feedback.submit.already_exists',
        requestId: context.requestId,
        recommendationRequestId,
        userId,
      });

      throw new ResourceAlreadyExistsError({
        resource: 'Feedback',
        id: recommendationRequestId,
      });
    }

    const feedback = await this.recommendationFeedbackRepository.create({
      recommendationRequestId,
      userId,
      rating,
      foundSomething,
      comment: comment ?? null,
    });

    this.loggerService.info({
      message: 'Recommendation group feedback submitted successfully',
      event: 'recommendation_group_feedback.submit.success',
      requestId: context.requestId,
      feedbackId: feedback.id,
      recommendationRequestId,
      watchroomId,
      userId,
      rating,
      foundSomething,
    });

    return feedback;
  }
}
