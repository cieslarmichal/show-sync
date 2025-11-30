import { eq, and, desc, count } from 'drizzle-orm';

import { IdService } from '../../../../common/id/idService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { userSeriesWatchlist } from '../../../../infrastructure/database/schema.ts';
import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type {
  CreateUserSeriesWatchlistData,
  UserSeriesWatchlistRepository,
} from '../../domain/repositories/userSeriesWatchlistRepository.ts';
import type { UserSeriesWatchlist, WatchlistType } from '../../domain/types/userSeriesWatchlist.ts';

export class UserSeriesWatchlistRepositoryImpl implements UserSeriesWatchlistRepository {
  private readonly databaseClient: DatabaseClient;

  public constructor(databaseClient: DatabaseClient) {
    this.databaseClient = databaseClient;
  }

  public async create(watchlistData: CreateUserSeriesWatchlistData, tx?: Transaction): Promise<UserSeriesWatchlist> {
    const db = tx ? tx : this.databaseClient.db;

    const [newWatchlist] = await db
      .insert(userSeriesWatchlist)
      .values({
        id: IdService.generateUuid(),
        userId: watchlistData.userId,
        seriesTmdbId: watchlistData.seriesTmdbId,
        type: watchlistData.type,
      })
      .returning();

    if (!newWatchlist) {
      throw new Error('Failed to create watchlist entry');
    }

    return this.mapToUserSeriesWatchlist(newWatchlist);
  }

  public async count(userId: string, type?: WatchlistType): Promise<number> {
    const conditions = [eq(userSeriesWatchlist.userId, userId)];

    if (type !== undefined) {
      conditions.push(eq(userSeriesWatchlist.type, type));
    }

    const [countResult] = await this.databaseClient.db
      .select({ count: count() })
      .from(userSeriesWatchlist)
      .where(and(...conditions));

    return countResult?.count ?? 0;
  }

  public async findMany(
    userId: string,
    page: number,
    pageSize: number,
    type?: WatchlistType,
  ): Promise<UserSeriesWatchlist[]> {
    const conditions = [eq(userSeriesWatchlist.userId, userId)];

    if (type !== undefined) {
      conditions.push(eq(userSeriesWatchlist.type, type));
    }

    const watchlist = await this.databaseClient.db
      .select()
      .from(userSeriesWatchlist)
      .where(and(...conditions))
      .orderBy(desc(userSeriesWatchlist.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return watchlist.map(this.mapToUserSeriesWatchlist);
  }

  public async findOne(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<UserSeriesWatchlist | null> {
    const db = tx ? tx : this.databaseClient.db;

    const query = db
      .select()
      .from(userSeriesWatchlist)
      .where(and(eq(userSeriesWatchlist.userId, userId), eq(userSeriesWatchlist.seriesTmdbId, seriesTmdbId)))
      .limit(1);

    const [watchlist] = tx ? await query.for('update') : await query;

    return watchlist ? this.mapToUserSeriesWatchlist(watchlist) : null;
  }

  public async updateType(
    data: { userId: string; seriesTmdbId: number; type: WatchlistType },
    tx?: Transaction,
  ): Promise<UserSeriesWatchlist> {
    const db = tx ? tx : this.databaseClient.db;

    const [updatedWatchlist] = await db
      .update(userSeriesWatchlist)
      .set({ type: data.type })
      .where(and(eq(userSeriesWatchlist.userId, data.userId), eq(userSeriesWatchlist.seriesTmdbId, data.seriesTmdbId)))
      .returning();

    if (!updatedWatchlist) {
      throw new Error('Failed to update watchlist type');
    }

    return this.mapToUserSeriesWatchlist(updatedWatchlist);
  }

  public async delete(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<void> {
    const db = tx ? tx : this.databaseClient.db;

    await db
      .delete(userSeriesWatchlist)
      .where(and(eq(userSeriesWatchlist.userId, userId), eq(userSeriesWatchlist.seriesTmdbId, seriesTmdbId)));
  }

  private readonly mapToUserSeriesWatchlist = (
    dbWatchlist: typeof userSeriesWatchlist.$inferSelect,
  ): UserSeriesWatchlist => {
    const watchlist: UserSeriesWatchlist = {
      id: dbWatchlist.id,
      userId: dbWatchlist.userId,
      seriesTmdbId: dbWatchlist.seriesTmdbId,
      type: dbWatchlist.type as WatchlistType,
    };

    return watchlist;
  };
}
