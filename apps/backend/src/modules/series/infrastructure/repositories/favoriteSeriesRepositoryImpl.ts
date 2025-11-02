import { eq, and, desc, count } from 'drizzle-orm';

import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/database.ts';
import { userFavoriteSeries } from '../../../../infrastructure/database/schema.ts';
import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type {
  CreateFavoriteSeriesData,
  FavoriteSeriesRepository,
  UpdateFavoriteSeriesPreferenceData,
} from '../../domain/repositories/favoriteSeriesRepository.ts';
import type { FavoriteSeries, PreferenceLevel } from '../../domain/types/favoriteSeries.ts';

export class FavoriteSeriesRepositoryImpl implements FavoriteSeriesRepository {
  private readonly database: DatabaseClient;

  public constructor(database: DatabaseClient) {
    this.database = database;
  }

  public async create(favoriteSeriesData: CreateFavoriteSeriesData, tx?: Transaction): Promise<FavoriteSeries> {
    const db = tx ? tx : this.database.db;

    const [newFavorite] = await db
      .insert(userFavoriteSeries)
      .values({
        id: UuidService.generateUuid(),
        userId: favoriteSeriesData.userId,
        seriesTmdbId: favoriteSeriesData.seriesTmdbId,
        preferenceLevel: favoriteSeriesData.preferenceLevel,
      })
      .returning();

    if (!newFavorite) {
      throw new Error('Failed to create favorite series');
    }

    return this.mapToFavoriteSeries(newFavorite);
  }

  public async count(userId: string, preferenceLevel?: PreferenceLevel): Promise<number> {
    const conditions = [eq(userFavoriteSeries.userId, userId)];

    if (preferenceLevel !== undefined) {
      conditions.push(eq(userFavoriteSeries.preferenceLevel, preferenceLevel));
    }

    const [countResult] = await this.database.db
      .select({ count: count() })
      .from(userFavoriteSeries)
      .where(and(...conditions));

    return countResult?.count ?? 0;
  }

  public async findMany(
    userId: string,
    page: number,
    pageSize: number,
    preferenceLevel?: PreferenceLevel,
  ): Promise<FavoriteSeries[]> {
    const conditions = [eq(userFavoriteSeries.userId, userId)];

    if (preferenceLevel !== undefined) {
      conditions.push(eq(userFavoriteSeries.preferenceLevel, preferenceLevel));
    }

    const favorites = await this.database.db
      .select()
      .from(userFavoriteSeries)
      .where(and(...conditions))
      .orderBy(desc(userFavoriteSeries.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return favorites.map(this.mapToFavoriteSeries);
  }

  public async findOne(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<FavoriteSeries | null> {
    const db = tx ? tx : this.database.db;

    const query = db
      .select()
      .from(userFavoriteSeries)
      .where(and(eq(userFavoriteSeries.userId, userId), eq(userFavoriteSeries.seriesTmdbId, seriesTmdbId)))
      .limit(1);

    const [favorite] = tx ? await query.for('update') : await query;

    return favorite ? this.mapToFavoriteSeries(favorite) : null;
  }

  public async delete(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<void> {
    const db = tx ? tx : this.database.db;

    await db
      .delete(userFavoriteSeries)
      .where(and(eq(userFavoriteSeries.userId, userId), eq(userFavoriteSeries.seriesTmdbId, seriesTmdbId)));
  }

  public async updatePreferenceLevel(
    data: UpdateFavoriteSeriesPreferenceData,
    tx?: Transaction,
  ): Promise<FavoriteSeries> {
    const db = tx ? tx : this.database.db;

    const [updated] = await db
      .update(userFavoriteSeries)
      .set({ preferenceLevel: data.preferenceLevel })
      .where(and(eq(userFavoriteSeries.userId, data.userId), eq(userFavoriteSeries.seriesTmdbId, data.seriesTmdbId)))
      .returning();

    if (!updated) {
      throw new ResourceNotFoundError({
        resource: 'Favorite Series',
        userId: data.userId,
        seriesTmdbId: data.seriesTmdbId.toString(),
      });
    }

    return this.mapToFavoriteSeries(updated);
  }

  private readonly mapToFavoriteSeries = (dbFavorite: typeof userFavoriteSeries.$inferSelect): FavoriteSeries => {
    const favorite: FavoriteSeries = {
      id: dbFavorite.id,
      userId: dbFavorite.userId,
      seriesTmdbId: dbFavorite.seriesTmdbId,
      preferenceLevel: dbFavorite.preferenceLevel as PreferenceLevel,
    };

    return favorite;
  };
}
