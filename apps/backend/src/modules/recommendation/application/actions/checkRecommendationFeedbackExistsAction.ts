import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { WatchroomRepository } from '../../../watchroom/domain/repositories/watchroomRepository.ts';
import type { RecommendationFeedbackRepository } from '../../domain/repositories/recommendationFeedbackRepository.ts';
import type { RecommendationRequestRepository } from '../../domain/repositories/recommendationRequestRepository.ts';

export interface CheckRecommendationFeedbackExistsActionPayload {
  readonly recommendationRequestId: string;
  readonly watchroomId: string;
  readonly userId: string;
}

export interface CheckRecommendationFeedbackExistsActionResult {
  readonly exists: boolean;
}

export class CheckRecommendationFeedbackExistsAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRequestRepository: RecommendationRequestRepository;
  private readonly recommendationFeedbackRepository: RecommendationFeedbackRepository;

  public constructor(
    watchroomRepository: WatchroomRepository,
    recommendationRequestRepository: RecommendationRequestRepository,
    recommendationFeedbackRepository: RecommendationFeedbackRepository,
  ) {
    this.watchroomRepository = watchroomRepository;
    this.recommendationRequestRepository = recommendationRequestRepository;
    this.recommendationFeedbackRepository = recommendationFeedbackRepository;
  }

  public async execute(
    payload: CheckRecommendationFeedbackExistsActionPayload,
  ): Promise<CheckRecommendationFeedbackExistsActionResult> {
    const { recommendationRequestId, watchroomId, userId } = payload;

    const isParticipant = await this.watchroomRepository.isParticipant(watchroomId, userId);

    if (!isParticipant) {
      throw new ForbiddenAccessError({
        reason: 'User is not a participant of this watchroom',
      });
    }

    const recommendationRequest = await this.recommendationRequestRepository.findById(recommendationRequestId);

    if (!recommendationRequest) {
      throw new ResourceNotFoundError({
        resource: 'RecommendationRequest',
        resourceId: recommendationRequestId,
      });
    }

    if (recommendationRequest.watchroomId !== watchroomId) {
      throw new ForbiddenAccessError({
        reason: 'Recommendation request does not belong to this watchroom',
      });
    }

    const feedback = await this.recommendationFeedbackRepository.findByRecommendationRequestIdAndUserId(
      recommendationRequestId,
      userId,
    );

    return {
      exists: feedback !== null,
    };
  }
}
