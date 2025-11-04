import type { RecommendationFeedback } from '../types/recommendationFeedback.ts';

export interface CreateRecommendationFeedbackData {
  recommendationRequestId: string;
  userId: string;
  rating: number;
  foundSomething: boolean;
  comment: string | null;
}

export interface RecommendationFeedbackRepository {
  create(data: CreateRecommendationFeedbackData): Promise<RecommendationFeedback>;
  findByRecommendationRequestIdAndUserId(
    recommendationRequestId: string,
    userId: string,
  ): Promise<RecommendationFeedback | null>;
}
