import { eq, desc, and, inArray, or, count, type SQL } from 'drizzle-orm';

import { IdService } from '../../../../common/id/idService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { users, watchroomParticipants, watchrooms } from '../../../../infrastructure/database/schema.ts';
import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type {
  CreateWatchroomData,
  FindWatchroomParams,
  UpdateWatchroomData,
  WatchroomRepository,
} from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';

interface WatchroomRow {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  ownerName: string;
  publicLinkId: string;
  createdAt: Date;
}

export class WatchroomRepositoryImpl implements WatchroomRepository {
  private readonly databaseClient: DatabaseClient;

  public constructor(databaseClient: DatabaseClient) {
    this.databaseClient = databaseClient;
  }

  public async create(data: CreateWatchroomData): Promise<Watchroom> {
    const watchroomId = IdService.generateUuid();

    await this.databaseClient.db.transaction(
      async (tx) => {
        await tx.insert(watchrooms).values({
          id: watchroomId,
          name: data.name,
          description: data.description ?? null,
          ownerId: data.ownerId,
          publicLinkId: data.publicLinkId,
        });

        await tx.insert(watchroomParticipants).values({
          id: IdService.generateUuid(),
          watchroomId,
          userId: data.ownerId,
        });
      },
      {
        isolationLevel: 'serializable',
      },
    );

    const watchroom = await this.findOne({ id: watchroomId });

    if (!watchroom) {
      throw new Error('Failed to create watchroom');
    }

    return watchroom;
  }

  public async findOne(params: FindWatchroomParams, tx?: Transaction): Promise<Watchroom | null> {
    const db = tx ?? this.databaseClient.db;
    
    const conditions: SQL[] = [];

    if (params.id) {
      conditions.push(eq(watchrooms.id, params.id));
    }

    if (params.publicLinkId) {
      conditions.push(eq(watchrooms.publicLinkId, params.publicLinkId));
    }

    if (conditions.length === 0) {
      return null;
    }

    const whereClause = conditions.length === 1 ? conditions[0] : or(...conditions);

    const [watchroomData] = await db
      .select({
        id: watchrooms.id,
        name: watchrooms.name,
        description: watchrooms.description,
        ownerId: watchrooms.ownerId,
        ownerName: users.name,
        publicLinkId: watchrooms.publicLinkId,
        createdAt: watchrooms.createdAt,
      })
      .from(watchrooms)
      .innerJoin(users, eq(watchrooms.ownerId, users.id))
      .where(whereClause)
      .limit(1);

    if (!watchroomData) {
      return null;
    }

    const participants = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(watchroomParticipants)
      .innerJoin(users, eq(watchroomParticipants.userId, users.id))
      .where(eq(watchroomParticipants.watchroomId, watchroomData.id));

    return this.mapToWatchroom(watchroomData, participants);
  }

  public async findMany(userId: string, page: number, pageSize: number): Promise<Watchroom[]> {
    const userWatchroomIds = await this.databaseClient.db
      .select({ watchroomId: watchroomParticipants.watchroomId })
      .from(watchroomParticipants)
      .where(eq(watchroomParticipants.userId, userId));

    if (userWatchroomIds.length === 0) {
      return [];
    }

    const watchroomIds = userWatchroomIds.map((w) => w.watchroomId);

    const watchroomsData = await this.databaseClient.db
      .select({
        id: watchrooms.id,
        name: watchrooms.name,
        description: watchrooms.description,
        ownerId: watchrooms.ownerId,
        ownerName: users.name,
        publicLinkId: watchrooms.publicLinkId,
        createdAt: watchrooms.createdAt,
      })
      .from(watchrooms)
      .innerJoin(users, eq(watchrooms.ownerId, users.id))
      .where(inArray(watchrooms.id, watchroomIds))
      .orderBy(desc(watchrooms.id))
      .limit(pageSize)
      .offset(pageSize * (page - 1));

    if (watchroomsData.length === 0) {
      return [];
    }

    const paginatedWatchroomIds = watchroomsData.map((w) => w.id);

    const allParticipants = await this.databaseClient.db
      .select({
        watchroomId: watchroomParticipants.watchroomId,
        userId: users.id,
        userName: users.name,
      })
      .from(watchroomParticipants)
      .innerJoin(users, eq(watchroomParticipants.userId, users.id))
      .where(inArray(watchroomParticipants.watchroomId, paginatedWatchroomIds));

    const participantsByWatchroom = this.groupParticipantsByWatchroom(allParticipants);

    const watchroomsResult = watchroomsData.map((w) => this.mapToWatchroom(w, participantsByWatchroom.get(w.id) ?? []));

    return watchroomsResult;
  }

  public async count(userId: string): Promise<number> {
    const [countResult] = await this.databaseClient.db
      .select({ count: count() })
      .from(watchroomParticipants)
      .where(eq(watchroomParticipants.userId, userId));

    return countResult?.count ?? 0;
  }

  public async delete(watchroomId: string): Promise<void> {
    await this.databaseClient.db.delete(watchrooms).where(eq(watchrooms.id, watchroomId));
  }

  public async update(watchroomId: string, data: UpdateWatchroomData): Promise<Watchroom> {
    let updateData = {};

    if (data.name !== undefined) {
      updateData = { ...updateData, name: data.name };
    }

    if (data.description !== undefined) {
      updateData = { ...updateData, description: data.description };
    }

    await this.databaseClient.db.update(watchrooms).set(updateData).where(eq(watchrooms.id, watchroomId));

    const updatedWatchroom = await this.findOne({ id: watchroomId });

    if (!updatedWatchroom) {
      throw new Error('Failed to update watchroom');
    }

    return updatedWatchroom;
  }

  public async addParticipant(watchroomId: string, userId: string, tx?: Transaction): Promise<void> {
    const db = tx ?? this.databaseClient.db;
    
    await db.insert(watchroomParticipants).values({
      id: IdService.generateUuid(),
      watchroomId,
      userId,
    });
  }

  public async removeParticipant(watchroomId: string, userId: string, tx?: Transaction): Promise<void> {
    const db = tx ?? this.databaseClient.db;
    
    await db
      .delete(watchroomParticipants)
      .where(and(eq(watchroomParticipants.watchroomId, watchroomId), eq(watchroomParticipants.userId, userId)));
  }

  public async isParticipant(watchroomId: string, userId: string, tx?: Transaction): Promise<boolean> {
    const db = tx ?? this.databaseClient.db;
    
    const [participant] = await db
      .select()
      .from(watchroomParticipants)
      .where(and(eq(watchroomParticipants.watchroomId, watchroomId), eq(watchroomParticipants.userId, userId)))
      .limit(1);

    return !!participant;
  }

  private mapToWatchroom(watchroomData: WatchroomRow, participants: Array<{ id: string; name: string }>): Watchroom {
    return {
      id: watchroomData.id,
      name: watchroomData.name,
      description: watchroomData.description ?? undefined,
      ownerId: watchroomData.ownerId,
      ownerName: watchroomData.ownerName,
      publicLinkId: watchroomData.publicLinkId,
      createdAt: watchroomData.createdAt,
      participants: participants.map((p) => ({
        id: p.id,
        name: p.name,
      })),
    };
  }

  private groupParticipantsByWatchroom(
    participants: Array<{ watchroomId: string; userId: string; userName: string }>,
  ): Map<string, Array<{ id: string; name: string }>> {
    const participantsByWatchroom = new Map<string, Array<{ id: string; name: string }>>();

    for (const participant of participants) {
      if (!participantsByWatchroom.has(participant.watchroomId)) {
        participantsByWatchroom.set(participant.watchroomId, []);
      }
      participantsByWatchroom.get(participant.watchroomId)?.push({
        id: participant.userId,
        name: participant.userName,
      });
    }

    return participantsByWatchroom;
  }
}
