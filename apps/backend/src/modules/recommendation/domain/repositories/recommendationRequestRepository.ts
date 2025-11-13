import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type { RecommendationRequest, RecommendationRequestStatus } from '../types/recommendationRequest.ts';

export interface CreateRecommendationRequestData {
  readonly userId: string;
  readonly watchroomId: string;
  readonly status: RecommendationRequestStatus;
}

export interface RecommendationRequestRepository {
  create(data: CreateRecommendationRequestData): Promise<RecommendationRequest>;
  findById(id: string): Promise<RecommendationRequest | null>;
  updateStatus(id: string, status: RecommendationRequestStatus, tx?: Transaction): Promise<void>;
  findLatestByWatchroomId(watchroomId: string): Promise<RecommendationRequest | null>;
  count(userId: string): Promise<number>;
}
