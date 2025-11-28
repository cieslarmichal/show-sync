import type { Language } from '../../../../common/types/language.ts';

export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly isEmailVerified: boolean;
  readonly language: Language;
  readonly createdAt: Date;
}
