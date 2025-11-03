import { apiRequest } from '../apiRequest';
import { SeriesDetails } from '../types/series';

export const getSeriesDetailsBatch = async (seriesIds: number[]): Promise<SeriesDetails[]> => {
  const idsParam = seriesIds.join(',');

  const response = await apiRequest<{ data: SeriesDetails[] }>(`/series/batch/details?ids=${idsParam}`, {
    method: 'GET',
  });

  return response.data;
};
