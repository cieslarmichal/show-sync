import { eq } from 'drizzle-orm';

import { IdService } from '../../../../common/id/idService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { users } from '../../../../infrastructure/database/schema.ts';
import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type { CreateUserData, UpdateUserData, UserRepository } from '../../domain/repositories/userRepository.ts';
import type { User } from '../../domain/types/user.ts';

export class UserRepositoryImpl implements UserRepository {
  private readonly databaseClient: DatabaseClient;

  public constructor(databaseClient: DatabaseClient) {
    this.databaseClient = databaseClient;
  }

  public async create(userData: CreateUserData): Promise<User> {
    const [newUser] = await this.databaseClient.db
      .insert(users)
      .values({
        id: IdService.generateUuid(),
        name: userData.name,
        email: userData.email,
        password: userData.password,
        isEmailVerified: userData.isEmailVerified ?? false,
      })
      .returning();

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    return this.mapToUser(newUser);
  }

  public async findById(id: string, tx?: Transaction): Promise<User | null> {
    const db = tx ?? this.databaseClient.db;

    const query = db.select().from(users).where(eq(users.id, id)).limit(1);

    const [user] = tx ? await query.for('update') : await query;

    return user ? this.mapToUser(user) : null;
  }

  public async findByEmail(email: string, tx?: Transaction): Promise<User | null> {
    const db = tx ?? this.databaseClient.db;

    const query = db.select().from(users).where(eq(users.email, email)).limit(1);

    const [record] = tx ? await query.for('update') : await query;

    return record ? this.mapToUser(record) : null;
  }

  public async delete(id: string): Promise<void> {
    await this.databaseClient.db.delete(users).where(eq(users.id, id));
  }

  public async update(id: string, data: UpdateUserData, tx?: Transaction): Promise<void> {
    const db = tx ? tx : this.databaseClient.db;

    await db.update(users).set(data).where(eq(users.id, id));
  }

  public async updatePassword(id: string, password: string, tx?: Transaction): Promise<void> {
    const db = tx ? tx : this.databaseClient.db;

    await db.update(users).set({ password }).where(eq(users.id, id));
  }

  private mapToUser(dbUser: typeof users.$inferSelect): User {
    const user: User = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      password: dbUser.password,
      isEmailVerified: dbUser.isEmailVerified,
      createdAt: dbUser.createdAt,
    };

    return user;
  }
}
