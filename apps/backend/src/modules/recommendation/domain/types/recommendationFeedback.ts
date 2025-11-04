export interface RecommendationFeedback {
  readonly id: string;
  readonly recommendationRequestId: string;
  readonly userId: string;
  readonly rating: number;
  readonly foundSomething: boolean;
  readonly comment?: string | undefined;
  readonly createdAt: Date;
}
