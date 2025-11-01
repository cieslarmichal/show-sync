import { apiRequest } from '../apiRequest';
import { IgnoredSeries } from '../types/series';

export const addIgnoredSeries = async (seriesTmdbId: number): Promise<IgnoredSeries> => {
  return apiRequest<IgnoredSeries>('/series/ignored', {
    method: 'POST',
    body: { seriesTmdbId },
  });
};
