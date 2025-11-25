import { apiRequest } from '../apiRequest';
import { SeriesRating, Rating } from '../types/series';

export const addSeriesRating = async (seriesTmdbId: number, rating: Rating): Promise<SeriesRating> => {
  return apiRequest<SeriesRating>('/series/ratings', {
    method: 'POST',
    body: { seriesTmdbId, rating },
  });
};
