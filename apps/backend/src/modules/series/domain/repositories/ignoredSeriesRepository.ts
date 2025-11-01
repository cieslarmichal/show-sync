import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type { IgnoredSeries } from '../types/ignoredSeries.ts';

export interface CreateIgnoredSeriesData {
  readonly userId: string;
  readonly seriesTmdbId: number;
}

export interface IgnoredSeriesRepository {
  create(ignoredSeriesData: CreateIgnoredSeriesData, tx?: Transaction): Promise<IgnoredSeries>;
  findMany(userId: string, page: number, pageSize: number): Promise<IgnoredSeries[]>;
  count(userId: string): Promise<number>;
  findOne(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<IgnoredSeries | null>;
  delete(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<void>;
}
