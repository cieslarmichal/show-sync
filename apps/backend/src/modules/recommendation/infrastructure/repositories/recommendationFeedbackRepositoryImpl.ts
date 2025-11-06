import { and, eq } from 'drizzle-orm';

import { IdService } from '../../../../common/id/idService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { recommendationFeedback } from '../../../../infrastructure/database/schema.ts';
import type {
  CreateRecommendationFeedbackData,
  RecommendationFeedbackRepository,
} from '../../domain/repositories/recommendationFeedbackRepository.ts';
import type { RecommendationFeedback } from '../../domain/types/recommendationFeedback.ts';

export class RecommendationFeedbackRepositoryImpl implements RecommendationFeedbackRepository {
  private readonly databaseClient: DatabaseClient;

  public constructor(databaseClient: DatabaseClient) {
    this.databaseClient = databaseClient;
  }

  public async create(data: CreateRecommendationFeedbackData): Promise<RecommendationFeedback> {
    const [feedback] = await this.databaseClient.db
      .insert(recommendationFeedback)
      .values({
        id: IdService.generateUuid(),
        recommendationRequestId: data.recommendationRequestId,
        userId: data.userId,
        rating: data.rating,
        foundSomething: data.foundSomething,
        comment: data.comment ?? null,
      })
      .returning();

    if (!feedback) {
      throw new Error('Failed to create recommendation feedback');
    }

    return this.mapToRecommendationFeedback(feedback);
  }

  public async findByRecommendationRequestIdAndUserId(
    recommendationRequestId: string,
    userId: string,
  ): Promise<RecommendationFeedback | null> {
    const [feedback] = await this.databaseClient.db
      .select()
      .from(recommendationFeedback)
      .where(
        and(
          eq(recommendationFeedback.recommendationRequestId, recommendationRequestId),
          eq(recommendationFeedback.userId, userId),
        ),
      )
      .limit(1);

    if (!feedback) {
      return null;
    }

    return this.mapToRecommendationFeedback(feedback);
  }

  private mapToRecommendationFeedback(row: typeof recommendationFeedback.$inferSelect): RecommendationFeedback {
    return {
      id: row.id,
      recommendationRequestId: row.recommendationRequestId,
      userId: row.userId,
      rating: row.rating,
      foundSomething: row.foundSomething,
      comment: row.comment ?? undefined,
      createdAt: row.createdAt,
    };
  }
}
