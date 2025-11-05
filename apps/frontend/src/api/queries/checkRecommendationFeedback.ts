import { apiRequest } from '../apiRequest';

export const checkRecommendationFeedback = async (
  watchroomId: string,
  recommendationRequestId: string,
): Promise<{ exists: boolean }> => {
  return apiRequest<{ exists: boolean }>(
    `/watchrooms/${watchroomId}/recommendations/${recommendationRequestId}/feedback`,
    {
      method: 'GET',
    },
  );
};
