import type { Transaction } from '../../../../infrastructure/database/transaction.ts';
import type { User } from '../types/user.ts';

export interface CreateUserData {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly isEmailVerified?: boolean;
}

export interface UpdateUserData {
  readonly isEmailVerified?: boolean;
}

export interface UserRepository {
  create(userData: CreateUserData): Promise<User>;
  findById(id: string, tx?: Transaction): Promise<User | null>;
  findByEmail(email: string, tx?: Transaction): Promise<User | null>;
  delete(id: string): Promise<void>;
  update(id: string, data: UpdateUserData, tx?: Transaction): Promise<void>;
  updatePassword(id: string, password: string, tx?: Transaction): Promise<void>;
}
