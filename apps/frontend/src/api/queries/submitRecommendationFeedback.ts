import { apiRequest } from '../apiRequest';
import type { RecommendationFeedback, SubmitRecommendationFeedbackPayload } from '../types/recommendationFeedback';

export const submitRecommendationFeedback = async (
  watchroomId: string,
  payload: SubmitRecommendationFeedbackPayload,
): Promise<RecommendationFeedback> => {
  return apiRequest<RecommendationFeedback>(`/watchrooms/${watchroomId}/recommendations/feedback`, {
    method: 'POST',
    body: payload,
  });
};
