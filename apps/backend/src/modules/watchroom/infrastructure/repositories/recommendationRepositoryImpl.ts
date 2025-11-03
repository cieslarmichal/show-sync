import { eq, desc } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/database.ts';
import { recommendations } from '../../../../infrastructure/database/schema.ts';
import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type {
  CreateRecommendationData,
  RecommendationRepository,
} from '../../domain/repositories/recommendationRepository.ts';
import type { Recommendation } from '../../domain/types/recommendation.ts';

export class RecommendationRepositoryImpl implements RecommendationRepository {
  private readonly databaseClient: DatabaseClient;

  public constructor(databaseClient: DatabaseClient) {
    this.databaseClient = databaseClient;
  }

  public async create(data: CreateRecommendationData[], tx: Transaction): Promise<void> {
    const values = data.map((item) => ({
      id: UuidService.generateUuid(),
      watchroomId: item.watchroomId,
      requestId: item.requestId,
      seriesTmdbId: item.seriesTmdbId,
      justification: item.justification,
    }));

    await tx.insert(recommendations).values(values);
  }

  public async findByWatchroomId(watchroomId: string): Promise<Recommendation[]> {
    const recommendationsData = await this.databaseClient.db
      .select()
      .from(recommendations)
      .where(eq(recommendations.watchroomId, watchroomId))
      .orderBy(desc(recommendations.seriesTmdbId));

    return recommendationsData.map((r) => this.mapToRecommendation(r));
  }

  public async findByRequestId(requestId: string): Promise<Recommendation[]> {
    const recommendationsData = await this.databaseClient.db
      .select()
      .from(recommendations)
      .where(eq(recommendations.requestId, requestId))
      .orderBy(desc(recommendations.seriesTmdbId));

    return recommendationsData.map((r) => this.mapToRecommendation(r));
  }

  public async findOne(recommendationId: string): Promise<Recommendation | null> {
    const [recommendation] = await this.databaseClient.db
      .select()
      .from(recommendations)
      .where(eq(recommendations.id, recommendationId))
      .limit(1);

    if (!recommendation) {
      return null;
    }

    return this.mapToRecommendation(recommendation);
  }

  public async deleteAllByWatchroomId(watchroomId: string, tx: Transaction): Promise<void> {
    await tx.delete(recommendations).where(eq(recommendations.watchroomId, watchroomId));
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
