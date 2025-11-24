import { apiRequest } from '../apiRequest';
import { SeriesDetails } from '../types/series';

export const getSeriesDetailsBatch = async (
  seriesIds: number[],
  includeProviders = false,
): Promise<SeriesDetails[]> => {
  const idsParam = seriesIds.join(',');
  const providersParam = includeProviders ? '&includeProviders=true' : '';

  const response = await apiRequest<{ data: SeriesDetails[] }>(
    `/series/batch/details?ids=${idsParam}${providersParam}`,
    {
      method: 'GET',
    },
  );

  return response.data;
};
