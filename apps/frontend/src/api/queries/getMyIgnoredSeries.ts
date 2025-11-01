import { apiRequest } from '../apiRequest';
import { IgnoredSeriesList } from '../types/series';

export const getMyIgnoredSeries = async (page: number = 1, pageSize: number = 20): Promise<IgnoredSeriesList> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  return apiRequest<IgnoredSeriesList>(`/series/ignored?${params}`, {
    method: 'GET',
  });
};
