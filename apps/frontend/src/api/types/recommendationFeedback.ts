export interface RecommendationFeedback {
  readonly id: string;
  readonly recommendationRequestId: string;
  readonly rating: number;
  readonly foundSomething: boolean;
  readonly createdAt: string;
}

export interface SubmitRecommendationFeedbackPayload {
  readonly recommendationRequestId: string;
  readonly rating: number;
  readonly foundSomething: boolean;
  readonly comment?: string;
}
