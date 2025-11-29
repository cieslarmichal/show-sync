import { apiRequest } from '../apiRequest';
import type { Series } from '../types/series';

interface GetPopularSeriesResponse {
  data: Series[];
}

export async function getPopularSeries(): Promise<Series[]> {
  const response = await apiRequest<GetPopularSeriesResponse>('/series/popular', {
    method: 'GET',
  });

  return response.data;
}
