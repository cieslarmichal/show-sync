import { eq, desc, count } from 'drizzle-orm';

import { IdService } from '../../../../common/id/idService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { recommendationRequests } from '../../../../infrastructure/database/schema.ts';
import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type {
  CreateRecommendationRequestData,
  RecommendationRequestRepository,
} from '../../domain/repositories/recommendationRequestRepository.ts';
import type { RecommendationRequest, RecommendationRequestStatus } from '../../domain/types/recommendationRequest.ts';

export class RecommendationRequestRepositoryImpl implements RecommendationRequestRepository {
  private readonly databaseClient: DatabaseClient;

  public constructor(databaseClient: DatabaseClient) {
    this.databaseClient = databaseClient;
  }

  public async create(data: CreateRecommendationRequestData): Promise<RecommendationRequest> {
    const [request] = await this.databaseClient.db
      .insert(recommendationRequests)
      .values({
        id: IdService.generateUuid(),
        userId: data.userId,
        watchroomId: data.watchroomId,
        status: data.status,
      })
      .returning();

    if (!request) {
      throw new Error('Failed to create recommendation request');
    }

    return this.mapToRecommendationRequest(request);
  }

  public async findById(id: string): Promise<RecommendationRequest | null> {
    const [request] = await this.databaseClient.db
      .select()
      .from(recommendationRequests)
      .where(eq(recommendationRequests.id, id))
      .limit(1);

    if (!request) {
      return null;
    }

    return this.mapToRecommendationRequest(request);
  }

  public async updateStatus(id: string, status: RecommendationRequestStatus, tx?: Transaction): Promise<void> {
    const db = tx ?? this.databaseClient.db;

    await db.update(recommendationRequests).set({ status }).where(eq(recommendationRequests.id, id));
  }

  public async findLatestByWatchroomId(watchroomId: string): Promise<RecommendationRequest | null> {
    const [request] = await this.databaseClient.db
      .select()
      .from(recommendationRequests)
      .where(eq(recommendationRequests.watchroomId, watchroomId))
      .orderBy(desc(recommendationRequests.createdAt))
      .limit(1);

    if (!request) {
      return null;
    }

    return this.mapToRecommendationRequest(request);
  }

  public async count(userId: string): Promise<number> {
    const [result] = await this.databaseClient.db
      .select({ count: count() })
      .from(recommendationRequests)
      .where(eq(recommendationRequests.userId, userId));

    return result?.count ?? 0;
  }

  private mapToRecommendationRequest(row: typeof recommendationRequests.$inferSelect): RecommendationRequest {
    return {
      id: row.id,
      watchroomId: row.watchroomId ?? undefined,
      userId: row.userId,
      status: row.status as RecommendationRequestStatus,
      createdAt: row.createdAt,
    };
  }
}
