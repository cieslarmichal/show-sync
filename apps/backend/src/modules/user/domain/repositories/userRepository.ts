import type { Language } from '../../../../common/types/language.ts';
import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type { User } from '../types/user.ts';

export interface CreateUserData {
  readonly name: string;
  readonly email: string;
  readonly password?: string | undefined;
  readonly oauthProvider?: string | undefined;
  readonly oauthProviderId?: string | undefined;
  readonly isEmailVerified?: boolean;
  readonly language: Language;
}

export interface UpdateUserData {
  readonly isEmailVerified?: boolean;
  readonly language?: Language;
}

export interface UpdateOAuthProviderData {
  readonly id: string;
  readonly oauthProvider: string;
  readonly oauthProviderId: string;
}

export interface UserRepository {
  create(userData: CreateUserData, tx?: Transaction): Promise<User>;
  findById(id: string, tx?: Transaction): Promise<User | null>;
  findByEmail(email: string, tx?: Transaction): Promise<User | null>;
  findByOAuthProvider(provider: string, providerId: string, tx?: Transaction): Promise<User | null>;
  delete(id: string): Promise<void>;
  update(id: string, data: UpdateUserData, tx?: Transaction): Promise<void>;
  updatePassword(id: string, password: string, tx?: Transaction): Promise<void>;
  updateOAuthProvider(data: UpdateOAuthProviderData, tx?: Transaction): Promise<void>;
}
