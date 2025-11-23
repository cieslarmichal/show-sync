export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly isEmailVerified: boolean;
  readonly createdAt: string;
}
