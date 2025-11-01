import { eq } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/database.ts';
import { recommendations } from '../../../../infrastructure/database/schema.ts';
import type {
  CreateRecommendationData,
  RecommendationRepository,
} from '../../domain/repositories/recommendationRepository.ts';
import type { Recommendation } from '../../domain/types/recommendation.ts';

export class RecommendationRepositoryImpl implements RecommendationRepository {
  private readonly database: DatabaseClient;

  public constructor(database: DatabaseClient) {
    this.database = database;
  }

  public async create(data: CreateRecommendationData): Promise<Recommendation> {
    const recommendationId = UuidService.generateUuid();

    const [recommendation] = await this.database.db
      .insert(recommendations)
      .values({
        id: recommendationId,
        watchroomId: data.watchroomId,
        requestId: data.requestId,
        seriesTmdbId: data.seriesTmdbId,
        justification: data.justification,
      })
      .returning();

    if (!recommendation) {
      throw new Error('Failed to create recommendation');
    }

    return this.mapToRecommendation(recommendation);
  }

  public async findByWatchroomId(watchroomId: string): Promise<Recommendation[]> {
    const recommendationsData = await this.database.db
      .select()
      .from(recommendations)
      .where(eq(recommendations.watchroomId, watchroomId));

    return recommendationsData.map((r) => this.mapToRecommendation(r));
  }

  public async findByRequestId(requestId: string): Promise<Recommendation[]> {
    const recommendationsData = await this.database.db
      .select()
      .from(recommendations)
      .where(eq(recommendations.requestId, requestId));

    return recommendationsData.map((r) => this.mapToRecommendation(r));
  }

  public async findOne(recommendationId: string): Promise<Recommendation | null> {
    const [recommendation] = await this.database.db
      .select()
      .from(recommendations)
      .where(eq(recommendations.id, recommendationId))
      .limit(1);

    if (!recommendation) {
      return null;
    }

    return this.mapToRecommendation(recommendation);
  }

  public async delete(recommendationId: string): Promise<void> {
    await this.database.db.delete(recommendations).where(eq(recommendations.id, recommendationId));
  }

  public async deleteAllByWatchroomId(watchroomId: string): Promise<void> {
    await this.database.db.delete(recommendations).where(eq(recommendations.watchroomId, watchroomId));
  }

  private mapToRecommendation(row: typeof recommendations.$inferSelect): Recommendation {
    return {
      id: row.id,
      watchroomId: row.watchroomId,
      requestId: row.requestId,
      seriesTmdbId: row.seriesTmdbId,
      justification: row.justification,
    };
  }
}
