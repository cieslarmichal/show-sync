import { apiRequest } from '../apiRequest';
import { FavoriteSeriesList } from '../types/series';

export const getMyFavoriteSeries = async (page: number = 1, pageSize: number = 20): Promise<FavoriteSeriesList> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  return apiRequest<FavoriteSeriesList>(`/series/favorites?${params}`, {
    method: 'GET',
  });
};
