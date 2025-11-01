import { apiRequest } from '../apiRequest';

export const removeIgnoredSeries = async (seriesTmdbId: number): Promise<void> => {
  return apiRequest<void>(`/series/ignored/${seriesTmdbId}`, {
    method: 'DELETE',
  });
};
