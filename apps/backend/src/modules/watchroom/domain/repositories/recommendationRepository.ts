import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type { Recommendation } from '../types/recommendation.ts';

export interface CreateRecommendationData {
  recommendationRequestId: string;
  seriesTmdbId: number;
  justification: string;
}

export interface RecommendationRepository {
  create(data: CreateRecommendationData[], tx: Transaction): Promise<void>;
  findByRecommendationRequestId(recommendationRequestId: string): Promise<Recommendation[]>;
  findOne(recommendationId: string): Promise<Recommendation | null>;
}
