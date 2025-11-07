import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type { Watchroom } from '../types/watchroom.ts';

export interface CreateWatchroomData {
  readonly name: string;
  readonly description?: string | undefined;
  readonly ownerId: string;
  readonly publicLinkId: string;
}

export interface UpdateWatchroomData {
  readonly name?: string | undefined;
  readonly description?: string | undefined;
}

export interface FindWatchroomParams {
  readonly id?: string | undefined;
  readonly publicLinkId?: string | undefined;
}

export type WatchroomRepository = {
  create(data: CreateWatchroomData): Promise<Watchroom>;
  findOne(params: FindWatchroomParams, tx?: Transaction): Promise<Watchroom | null>;
  findMany(userId: string, page: number, pageSize: number): Promise<Watchroom[]>;
  count(userId: string): Promise<number>;
  delete(watchroomId: string): Promise<void>;
  update(watchroomId: string, data: UpdateWatchroomData): Promise<Watchroom>;
  addParticipant(watchroomId: string, userId: string, tx?: Transaction): Promise<void>;
  removeParticipant(watchroomId: string, userId: string, tx?: Transaction): Promise<void>;
  isParticipant(watchroomId: string, userId: string, tx?: Transaction): Promise<boolean>;
};
