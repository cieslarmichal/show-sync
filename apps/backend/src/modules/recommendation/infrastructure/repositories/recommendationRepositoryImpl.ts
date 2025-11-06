import { eq } from 'drizzle-orm';

import { IdService } from '../../../../common/id/idService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
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
      id: IdService.generateUuid(),
      recommendationRequestId: item.recommendationRequestId,
      seriesTmdbId: item.seriesTmdbId,
      justification: item.justification,
    }));

    await tx.insert(recommendations).values(values);
  }

  public async findByRecommendationRequestId(recommendationRequestId: string): Promise<Recommendation[]> {
    const recommendationsData = await this.databaseClient.db
      .select()
      .from(recommendations)
      .where(eq(recommendations.recommendationRequestId, recommendationRequestId));

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

  private mapToRecommendation(row: typeof recommendations.$inferSelect): Recommendation {
    return {
      id: row.id,
      recommendationRequestId: row.recommendationRequestId,
      seriesTmdbId: row.seriesTmdbId,
      justification: row.justification,
    };
  }
}
