import { and, eq } from 'drizzle-orm';

import type { EmailTemplateName } from '../../../../common/emailService/emailTemplate.ts';
import { RepositoryError } from '../../../../common/errors/repositoryError.ts';
import { IdService } from '../../../../common/id/idService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { emails } from '../../../../infrastructure/database/schema.ts';
import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type { EmailRepository, CreateEmailData, FindEmailParams } from '../../domain/repositories/emailRepository.ts';
import type { Email, EmailStatus } from '../../domain/types/email.ts';

export class EmailRepositoryImpl implements EmailRepository {
  private readonly databaseClient: DatabaseClient;

  public constructor(databaseClient: DatabaseClient) {
    this.databaseClient = databaseClient;
  }

  public async create(payload: CreateEmailData, tx?: Transaction): Promise<void> {
    const db = tx ?? this.databaseClient.db;

    try {
      await db.insert(emails).values({
        id: IdService.generateUuid(),
        recipient: payload.recipient,
        payload: payload.payload,
        templateName: payload.templateName,
        status: 'pending',
      });
    } catch (error) {
      throw new RepositoryError({
        entity: 'Email',
        operation: 'create',
        originalError: error,
      });
    }
  }

  public async findEmail(payload: FindEmailParams): Promise<Email | null> {
    const { recipient, templateName } = payload;

    try {
      const conditions = [];
      if (recipient) {
        conditions.push(eq(emails.recipient, recipient));
      }
      if (templateName) {
        conditions.push(eq(emails.templateName, templateName));
      }

      const [record] = await this.databaseClient.db
        .select()
        .from(emails)
        .where(and(...conditions))
        .limit(1);

      if (!record) {
        return null;
      }

      return this.map(record);
    } catch (error) {
      throw new RepositoryError({
        entity: 'Email',
        operation: 'find',
        originalError: error,
      });
    }
  }

  public async findAllPending(): Promise<Email[]> {
    try {
      const result = await this.databaseClient.db.select().from(emails).where(eq(emails.status, 'pending'));

      return result.map((rawEntity) => this.map(rawEntity));
    } catch (error) {
      throw new RepositoryError({
        entity: 'Email',
        operation: 'find',
        originalError: error,
      });
    }
  }

  public async updateStatus(id: string, status: EmailStatus): Promise<void> {
    try {
      await this.databaseClient.db.update(emails).set({ status }).where(eq(emails.id, id));
    } catch (error) {
      throw new RepositoryError({
        entity: 'Email',
        operation: 'update',
        originalError: error,
      });
    }
  }

  private map(rawEntity: typeof emails.$inferSelect): Email {
    const { createdAt, id, payload, status, templateName, recipient } = rawEntity;

    return {
      createdAt,
      id,
      payload,
      status: status as EmailStatus,
      templateName: templateName as EmailTemplateName,
      recipient,
    };
  }
}
