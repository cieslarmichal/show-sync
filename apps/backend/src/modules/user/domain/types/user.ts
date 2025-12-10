import type { Language } from '../../../../common/types/language.ts';

export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly password: string | null;
  readonly oauthProvider: string | null;
  readonly oauthProviderId: string | null;
  readonly isEmailVerified: boolean;
  readonly language: Language;
  readonly createdAt: Date;
}
