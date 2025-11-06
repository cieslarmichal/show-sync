import type { EmailTemplateName } from '../../../../common/emailService/emailTemplate.ts';

export interface Email {
  readonly id: string;
  readonly recipient: string;
  readonly templateName: EmailTemplateName;
  readonly payload: string;
  readonly status: EmailStatus;
  readonly createdAt: Date;
}

export type EmailStatus = 'pending' | 'sent' | 'failed';
