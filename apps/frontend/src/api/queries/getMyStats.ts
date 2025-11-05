import { apiRequest } from '../apiRequest.ts';

export interface UserStats {
  favoriteSeriesCount: number;
  watchRoomsCount: number;
  recommendationCount: number;
}

export const getMyStats = async (): Promise<UserStats> => {
  const response = await apiRequest<UserStats>('/users/me/stats', {
    method: 'GET',
  });

  return response;
};
