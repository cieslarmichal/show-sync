import { apiRequest } from '../apiRequest';

export const removeSeriesRating = async (seriesTmdbId: number): Promise<void> => {
  return apiRequest<void>(`/series/ratings/${seriesTmdbId}`, {
    method: 'DELETE',
  });
};
