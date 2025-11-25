import { apiRequest } from '../apiRequest';
import { SeriesWatchlistList } from '../types/series';

export const getMySeriesWatchlist = async (
  page: number = 1,
  pageSize: number = 20,
): Promise<SeriesWatchlistList> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  return apiRequest<SeriesWatchlistList>(`/series/watchlist?${params}`, {
    method: 'GET',
  });
};
