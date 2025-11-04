export type RecommendationRequestStatus = 'pending' | 'completed' | 'failed';

export interface RecommendationRequest {
  readonly id: string;
  readonly watchroomId: string;
  readonly status: RecommendationRequestStatus;
  readonly createdAt: Date;
}
