export type RecommendationRequestStatus = 'pending' | 'completed' | 'failed';

export interface RecommendationRequest {
  readonly id: string;
  readonly watchroomId?: string | undefined;
  readonly status: RecommendationRequestStatus;
  readonly createdAt: Date;
}
