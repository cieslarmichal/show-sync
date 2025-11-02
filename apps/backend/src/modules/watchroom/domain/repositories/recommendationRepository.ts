import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type { Recommendation } from '../types/recommendation.ts';

export interface CreateRecommendationData {
  watchroomId: string;
  requestId: string;
  seriesTmdbId: number;
  justification: string;
}

export interface RecommendationRepository {
  create(data: CreateRecommendationData[], tx: Transaction): Promise<void>;
  findByWatchroomId(watchroomId: string): Promise<Recommendation[]>;
  findByRequestId(requestId: string): Promise<Recommendation[]>;
  deleteAllByWatchroomId(watchroomId: string, tx: Transaction): Promise<void>;
  findOne(recommendationId: string): Promise<Recommendation | null>;
}
