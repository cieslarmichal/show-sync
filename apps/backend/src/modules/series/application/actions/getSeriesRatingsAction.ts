import type { UserSeriesRatingRepository } from '../../domain/repositories/userSeriesRatingRepository.ts';
import type { UserSeriesRating, SeriesRating } from '../../domain/types/userSeriesRating.ts';

export interface GetSeriesRatingsPayload {
  readonly userId: string;
  readonly page: number;
  readonly pageSize: number;
  readonly rating?: SeriesRating | undefined;
}

export interface GetSeriesRatingsResult {
  readonly data: UserSeriesRating[];
  readonly total: number;
}

export class GetSeriesRatingsAction {
  private readonly seriesRatingRepository: UserSeriesRatingRepository;

  public constructor(seriesRatingRepository: UserSeriesRatingRepository) {
    this.seriesRatingRepository = seriesRatingRepository;
  }

  public async execute(payload: GetSeriesRatingsPayload): Promise<GetSeriesRatingsResult> {
    const { userId, rating, page, pageSize } = payload;

    const [ratings, total] = await Promise.all([
      this.seriesRatingRepository.findMany(userId, page, pageSize, rating),
      this.seriesRatingRepository.count(userId, rating),
    ]);

    return {
      data: ratings,
      total,
    };
  }
}
