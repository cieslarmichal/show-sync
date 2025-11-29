import type { EmailTemplateName } from '../../../../common/emailService/emailTemplate.ts';
import type { Language } from '../../../../common/types/language.ts';

export interface Email {
  readonly id: string;
  readonly recipient: string;
  readonly templateName: EmailTemplateName;
  readonly payload: string;
  readonly language: Language;
  readonly status: EmailStatus;
  readonly createdAt: Date;
}

export type EmailStatus = 'pending' | 'sent' | 'failed';
