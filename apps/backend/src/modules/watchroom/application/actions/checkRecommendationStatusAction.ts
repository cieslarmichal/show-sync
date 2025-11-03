import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { RecommendationRepository } from '../../domain/repositories/recommendationRepository.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';

export interface CheckRecommendationStatusActionPayload {
  readonly recommendationRequestId: string;
  readonly watchroomId: string;
  readonly userId: string;
}

export interface CheckRecommendationStatusActionResult {
  readonly status: 'pending' | 'completed';
  readonly count: number;
}

export class CheckRecommendationStatusAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRepository: RecommendationRepository;

  public constructor(watchroomRepository: WatchroomRepository, recommendationRepository: RecommendationRepository) {
    this.watchroomRepository = watchroomRepository;
    this.recommendationRepository = recommendationRepository;
  }

  public async execute(
    payload: CheckRecommendationStatusActionPayload,
  ): Promise<CheckRecommendationStatusActionResult> {
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

    const recommendations = await this.recommendationRepository.findByRequestId(recommendationRequestId);

    return {
      status: recommendations.length > 0 ? 'completed' : 'pending',
      count: recommendations.length,
    };
  }
}
