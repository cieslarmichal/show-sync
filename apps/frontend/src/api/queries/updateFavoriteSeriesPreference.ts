import { apiRequest } from '../apiRequest';
import { FavoriteSeries, PreferenceLevel } from '../types/series';

export const updateFavoriteSeriesPreference = async (
  seriesTmdbId: number,
  preferenceLevel: PreferenceLevel,
): Promise<FavoriteSeries> => {
  return apiRequest<FavoriteSeries>(`/series/favorites/${seriesTmdbId}/preference`, {
    method: 'PATCH',
    body: { preferenceLevel },
  });
};
