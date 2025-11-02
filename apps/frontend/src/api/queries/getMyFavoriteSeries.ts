import { apiRequest } from '../apiRequest';
import { FavoriteSeriesList, PreferenceLevel } from '../types/series';

export const getMyFavoriteSeries = async (
  page: number = 1,
  pageSize: number = 20,
  preferenceLevel?: PreferenceLevel,
): Promise<FavoriteSeriesList> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (preferenceLevel) {
    params.append('preferenceLevel', preferenceLevel);
  }

  return apiRequest<FavoriteSeriesList>(`/series/favorites?${params}`, {
    method: 'GET',
  });
};
