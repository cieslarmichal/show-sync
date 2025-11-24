import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type { UserSeriesRating, SeriesRating } from '../types/userSeriesRating.ts';

export interface CreateUserSeriesRatingData {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly rating: SeriesRating;
}

export interface UpdateUserSeriesRatingData {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly rating: SeriesRating;
}

export interface UserSeriesRatingRepository {
  create(ratingData: CreateUserSeriesRatingData, tx?: Transaction): Promise<UserSeriesRating>;
  findMany(
    userId: string,
    page: number,
    pageSize: number,
    rating?: SeriesRating,
  ): Promise<UserSeriesRating[]>;
  count(userId: string, rating?: SeriesRating): Promise<number>;
  findOne(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<UserSeriesRating | null>;
  updateRating(data: UpdateUserSeriesRatingData, tx?: Transaction): Promise<UserSeriesRating>;
  delete(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<void>;
}
