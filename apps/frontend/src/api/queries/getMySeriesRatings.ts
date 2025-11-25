import { apiRequest } from '../apiRequest';
import { SeriesRatingList, Rating } from '../types/series';

export const getMySeriesRatings = async (
  page: number = 1,
  pageSize: number = 20,
  rating?: Rating,
): Promise<SeriesRatingList> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (rating) {
    params.append('rating', rating);
  }

  return apiRequest<SeriesRatingList>(`/series/ratings?${params}`, {
    method: 'GET',
  });
};
