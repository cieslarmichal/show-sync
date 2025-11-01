import { apiRequest } from '../apiRequest';

export const removeFavoriteSeries = async (seriesTmdbId: number): Promise<void> => {
  return apiRequest<void>(`/series/favorites/${seriesTmdbId}`, {
    method: 'DELETE',
  });
};
