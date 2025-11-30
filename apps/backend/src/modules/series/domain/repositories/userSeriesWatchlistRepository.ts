import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type { UserSeriesWatchlist, WatchlistType } from '../types/userSeriesWatchlist.ts';

export interface CreateUserSeriesWatchlistData {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly type: WatchlistType;
}

export interface UpdateUserSeriesWatchlistTypeData {
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly type: WatchlistType;
}

export interface UserSeriesWatchlistRepository {
  create(watchlistData: CreateUserSeriesWatchlistData, tx?: Transaction): Promise<UserSeriesWatchlist>;
  findMany(userId: string, page: number, pageSize: number, type?: WatchlistType): Promise<UserSeriesWatchlist[]>;
  count(userId: string, type?: WatchlistType): Promise<number>;
  findOne(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<UserSeriesWatchlist | null>;
  updateType(data: UpdateUserSeriesWatchlistTypeData, tx?: Transaction): Promise<UserSeriesWatchlist>;
  delete(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<void>;
}
