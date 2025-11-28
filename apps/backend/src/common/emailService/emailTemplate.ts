import type { Config } from '../../core/config.ts';
import type { Language } from '../types/language.ts';

export type EmailTemplateName = keyof Config['resend']['emails'];

interface VerifyAccountEmailTemplateData {
  readonly verificationLink: string;
}

interface ResetPasswordEmailTemplateData {
  readonly resetLink: string;
}

interface EmailTemplateDataMap extends Record<EmailTemplateName, unknown> {
  readonly verifyAccount: VerifyAccountEmailTemplateData;
  readonly resetPassword: ResetPasswordEmailTemplateData;
}

export type EmailTemplate = {
  [K in keyof EmailTemplateDataMap]: {
    readonly name: K;
    readonly language: Language;
    readonly data: EmailTemplateDataMap[K];
  };
}[keyof EmailTemplateDataMap];
