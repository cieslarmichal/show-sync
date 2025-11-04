import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { WatchroomRepository } from '../../../watchroom/domain/repositories/watchroomRepository.ts';
import type { RecommendationRequestRepository } from '../../domain/repositories/recommendationRequestRepository.ts';

export interface CheckRecommendationRequestStatusActionPayload {
  readonly recommendationRequestId: string;
  readonly watchroomId: string;
  readonly userId: string;
}

export interface CheckRecommendationRequestStatusActionResult {
  readonly status: 'pending' | 'completed' | 'failed';
}

export class CheckRecommendationRequestStatusAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRequestRepository: RecommendationRequestRepository;

  public constructor(
    watchroomRepository: WatchroomRepository,
    recommendationRequestRepository: RecommendationRequestRepository,
  ) {
    this.watchroomRepository = watchroomRepository;
    this.recommendationRequestRepository = recommendationRequestRepository;
  }

  public async execute(
    payload: CheckRecommendationRequestStatusActionPayload,
  ): Promise<CheckRecommendationRequestStatusActionResult> {
    const { recommendationRequestId, watchroomId, userId } = payload;

    const watchroom = await this.watchroomRepository.findOne({ id: watchroomId });

    if (!watchroom) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: watchroomId,
      });
    }

    const isOwner = watchroom.ownerId === userId;

    if (!isOwner) {
      throw new ForbiddenAccessError({
        reason: 'User is not the owner of this watchroom',
      });
    }

    const recommendationRequest = await this.recommendationRequestRepository.findById(recommendationRequestId);

    if (!recommendationRequest) {
      throw new ResourceNotFoundError({
        resource: 'RecommendationRequest',
        id: recommendationRequestId,
      });
    }

    if (recommendationRequest.watchroomId !== watchroomId) {
      throw new ForbiddenAccessError({
        reason: 'Recommendation request does not belong to this watchroom',
      });
    }

    return {
      status: recommendationRequest.status,
    };
  }
}
