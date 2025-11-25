import { apiRequest } from '../apiRequest';
import { SeriesRating, Rating } from '../types/series';

export const updateSeriesRating = async (seriesTmdbId: number, rating: Rating): Promise<SeriesRating> => {
  return apiRequest<SeriesRating>(`/series/ratings/${seriesTmdbId}`, {
    method: 'PATCH',
    body: { rating },
  });
};
