import { apiRequest } from '../apiRequest.ts';

export interface UserQuota {
  recommendationCount: number;
  maxRecommendationCount: number;
}

export const getMyQuota = async (): Promise<UserQuota> => {
  const response = await apiRequest<UserQuota>('/users/me/quota', {
    method: 'GET',
  });

  return response;
};
