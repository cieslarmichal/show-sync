import { apiRequest } from '../apiRequest';
import { FavoriteSeries } from '../types/series';

export const addFavoriteSeries = async (seriesTmdbId: number): Promise<FavoriteSeries> => {
  return apiRequest<FavoriteSeries>('/series/favorites', {
    method: 'POST',
    body: { seriesTmdbId },
  });
};
