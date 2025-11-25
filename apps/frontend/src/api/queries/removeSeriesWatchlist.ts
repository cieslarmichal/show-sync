import { apiRequest } from '../apiRequest';

export const removeSeriesWatchlist = async (seriesTmdbId: number): Promise<void> => {
  return apiRequest<void>(`/series/watchlist/${seriesTmdbId}`, {
    method: 'DELETE',
  });
};
