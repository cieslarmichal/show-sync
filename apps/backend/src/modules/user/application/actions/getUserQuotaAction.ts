import type { Config } from '../../../../core/config.ts';
import type { RecommendationRequestRepository } from '../../../recommendation/domain/repositories/recommendationRequestRepository.ts';

export interface GetUserQuotaActionPayload {
  userId: string;
}

export interface GetUserQuotaActionResult {
  recommendationCount: number;
  maxRecommendationCount: number;
}

export class GetUserQuotaAction {
  private readonly recommendationRequestRepository: RecommendationRequestRepository;
  private readonly config: Config;

  public constructor(recommendationRequestRepository: RecommendationRequestRepository, config: Config) {
    this.recommendationRequestRepository = recommendationRequestRepository;
    this.config = config;
  }

  public async execute(payload: GetUserQuotaActionPayload): Promise<GetUserQuotaActionResult> {
    const { userId } = payload;

    const recommendationCount = await this.recommendationRequestRepository.count(userId);
    const maxRecommendationCount = this.config.recommendations.maxRequestsPerUser;

    return {
      recommendationCount,
      maxRecommendationCount,
    };
  }
}
