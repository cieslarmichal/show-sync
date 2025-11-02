import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type { FavoriteSeries, PreferenceLevel } from '../types/favoriteSeries.ts';

export interface CreateFavoriteSeriesData {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly preferenceLevel: PreferenceLevel;
}

export interface UpdateFavoriteSeriesPreferenceData {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly preferenceLevel: PreferenceLevel;
}

export interface FavoriteSeriesRepository {
  create(favoriteSeriesData: CreateFavoriteSeriesData, tx?: Transaction): Promise<FavoriteSeries>;
  findMany(
    userId: string,
    page: number,
    pageSize: number,
    preferenceLevel?: PreferenceLevel,
  ): Promise<FavoriteSeries[]>;
  count(userId: string, preferenceLevel?: PreferenceLevel): Promise<number>;
  findOne(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<FavoriteSeries | null>;
  updatePreferenceLevel(data: UpdateFavoriteSeriesPreferenceData, tx?: Transaction): Promise<FavoriteSeries>;
  delete(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<void>;
}
