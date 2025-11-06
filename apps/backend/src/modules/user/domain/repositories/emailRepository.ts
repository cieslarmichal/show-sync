import type { EmailTemplateName } from '../../../../common/emailService/emailTemplate.ts';
import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type { Email, EmailStatus } from '../types/email.ts';

export interface CreateEmailData {
  readonly recipient: string;
  readonly templateName: EmailTemplateName;
  readonly payload: string;
}

export interface FindEmailParams {
  readonly recipient?: string;
  readonly templateName?: string;
}

export interface EmailRepository {
  create(data: CreateEmailData, tx?: Transaction): Promise<void>;
  findEmail(params: FindEmailParams): Promise<Email | null>;
  findAllPending(): Promise<Email[]>;
  updateStatus(id: string, status: EmailStatus): Promise<void>;
}
