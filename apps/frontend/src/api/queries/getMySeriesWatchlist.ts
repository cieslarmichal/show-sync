import { apiRequest } from '../apiRequest';
import { SeriesWatchlistList, WatchlistType } from '../types/series';

export const getMySeriesWatchlist = async (
  page: number = 1,
  pageSize: number = 20,
  type?: WatchlistType,
): Promise<SeriesWatchlistList> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (type) {
    params.append('type', type);
  }

  return apiRequest<SeriesWatchlistList>(`/series/watchlist?${params}`, {
    method: 'GET',
  });
};
