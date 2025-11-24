import { eq, and, desc, count } from 'drizzle-orm';

import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import { IdService } from '../../../../common/id/idService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { userSeriesRatings } from '../../../../infrastructure/database/schema.ts';
import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type {
  CreateUserSeriesRatingData,
  UserSeriesRatingRepository,
  UpdateUserSeriesRatingData,
} from '../../domain/repositories/userSeriesRatingRepository.ts';
import type { UserSeriesRating, SeriesRating } from '../../domain/types/userSeriesRating.ts';

export class UserSeriesRatingRepositoryImpl implements UserSeriesRatingRepository {
  private readonly databaseClient: DatabaseClient;

  public constructor(databaseClient: DatabaseClient) {
    this.databaseClient = databaseClient;
  }

  public async create(ratingData: CreateUserSeriesRatingData, tx?: Transaction): Promise<UserSeriesRating> {
    const db = tx ? tx : this.databaseClient.db;

    const [newRating] = await db
      .insert(userSeriesRatings)
      .values({
        id: IdService.generateUuid(),
        userId: ratingData.userId,
        seriesTmdbId: ratingData.seriesTmdbId,
        rating: ratingData.rating,
      })
      .returning();

    if (!newRating) {
      throw new Error('Failed to create series rating');
    }

    return this.mapToUserSeriesRating(newRating);
  }

  public async count(userId: string, rating?: SeriesRating): Promise<number> {
    const conditions = [eq(userSeriesRatings.userId, userId)];

    if (rating !== undefined) {
      conditions.push(eq(userSeriesRatings.rating, rating));
    }

    const [countResult] = await this.databaseClient.db
      .select({ count: count() })
      .from(userSeriesRatings)
      .where(and(...conditions));

    return countResult?.count ?? 0;
  }

  public async findMany(
    userId: string,
    page: number,
    pageSize: number,
    rating?: SeriesRating,
  ): Promise<UserSeriesRating[]> {
    const conditions = [eq(userSeriesRatings.userId, userId)];

    if (rating !== undefined) {
      conditions.push(eq(userSeriesRatings.rating, rating));
    }

    const ratings = await this.databaseClient.db
      .select()
      .from(userSeriesRatings)
      .where(and(...conditions))
      .orderBy(desc(userSeriesRatings.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return ratings.map(this.mapToUserSeriesRating);
  }

  public async findOne(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<UserSeriesRating | null> {
    const db = tx ? tx : this.databaseClient.db;

    const query = db
      .select()
      .from(userSeriesRatings)
      .where(and(eq(userSeriesRatings.userId, userId), eq(userSeriesRatings.seriesTmdbId, seriesTmdbId)))
      .limit(1);

    const [rating] = tx ? await query.for('update') : await query;

    return rating ? this.mapToUserSeriesRating(rating) : null;
  }

  public async delete(userId: string, seriesTmdbId: number, tx?: Transaction): Promise<void> {
    const db = tx ? tx : this.databaseClient.db;

    await db
      .delete(userSeriesRatings)
      .where(and(eq(userSeriesRatings.userId, userId), eq(userSeriesRatings.seriesTmdbId, seriesTmdbId)));
  }

  public async updateRating(
    data: UpdateUserSeriesRatingData,
    tx?: Transaction,
  ): Promise<UserSeriesRating> {
    const db = tx ? tx : this.databaseClient.db;

    const [updated] = await db
      .update(userSeriesRatings)
      .set({ rating: data.rating })
      .where(and(eq(userSeriesRatings.userId, data.userId), eq(userSeriesRatings.seriesTmdbId, data.seriesTmdbId)))
      .returning();

    if (!updated) {
      throw new ResourceNotFoundError({
        resource: 'User Series Rating',
        userId: data.userId,
        seriesTmdbId: data.seriesTmdbId.toString(),
      });
    }

    return this.mapToUserSeriesRating(updated);
  }

  private readonly mapToUserSeriesRating = (dbRating: typeof userSeriesRatings.$inferSelect): UserSeriesRating => {
    const rating: UserSeriesRating = {
      id: dbRating.id,
      userId: dbRating.userId,
      seriesTmdbId: dbRating.seriesTmdbId,
      rating: dbRating.rating as SeriesRating,
    };

    return rating;
  };
}
