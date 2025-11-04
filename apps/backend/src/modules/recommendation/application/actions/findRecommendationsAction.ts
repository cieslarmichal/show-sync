import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { WatchroomRepository } from '../../../watchroom/domain/repositories/watchroomRepository.ts';
import type { RecommendationRepository } from '../../domain/repositories/recommendationRepository.ts';
import type { RecommendationRequestRepository } from '../../domain/repositories/recommendationRequestRepository.ts';
import type { Recommendation } from '../../domain/types/recommendation.ts';

export interface FindRecommendationsActionPayload {
  readonly watchroomId: string;
  readonly userId: string;
}

export class FindRecommendationsAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRepository: RecommendationRepository;
  private readonly recommendationRequestRepository: RecommendationRequestRepository;

  public constructor(
    watchroomRepository: WatchroomRepository,
    recommendationRepository: RecommendationRepository,
    recommendationRequestRepository: RecommendationRequestRepository,
  ) {
    this.watchroomRepository = watchroomRepository;
    this.recommendationRepository = recommendationRepository;
    this.recommendationRequestRepository = recommendationRequestRepository;
  }

  public async execute(payload: FindRecommendationsActionPayload): Promise<Recommendation[]> {
    const { watchroomId, userId } = payload;

    const watchroom = await this.watchroomRepository.findOne({ id: watchroomId });

    if (!watchroom) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: watchroomId,
      });
    }

    const isParticipant = watchroom.participants.some((p) => p.id === userId);

    if (!isParticipant) {
      throw new ForbiddenAccessError({
        reason: 'Only watchroom participants can view recommendations',
      });
    }

    const latestRequest = await this.recommendationRequestRepository.findLatestByWatchroomId(watchroomId);

    if (!latestRequest) {
      return [];
    }

    const recommendations = await this.recommendationRepository.findByRecommendationRequestId(latestRequest.id);

    return recommendations;
  }
}
