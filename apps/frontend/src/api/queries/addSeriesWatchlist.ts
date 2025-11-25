import { apiRequest } from '../apiRequest';
import { SeriesWatchlist, WatchlistType } from '../types/series';

export const addSeriesWatchlist = async (
  seriesTmdbId: number,
  type: WatchlistType,
): Promise<SeriesWatchlist> => {
  return apiRequest<SeriesWatchlist>('/series/watchlist', {
    method: 'POST',
    body: { seriesTmdbId, type },
  });
};
