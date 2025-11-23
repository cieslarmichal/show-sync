import { Type, type Static } from '@fastify/type-provider-typebox';

export const emailSchema = Type.String({
  format: 'email',
  maxLength: 254,
});

export const passwordSchema = Type.String({
  minLength: 8,
  maxLength: 64,
});

export const userSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1, maxLength: 64 }),
  email: emailSchema,
  isEmailVerified: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
});

export const registerRequestSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 64 }),
  email: emailSchema,
  password: passwordSchema,
});

export const loginRequestSchema = Type.Object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginResponseSchema = Type.Object({
  accessToken: Type.String(),
});

export const changePasswordRequestSchema = Type.Object({
  oldPassword: Type.String(),
  newPassword: Type.String(),
});

export type UserDto = Static<typeof userSchema>;
export type RegisterRequest = Static<typeof registerRequestSchema>;
export type LoginRequest = Static<typeof loginRequestSchema>;
export type LoginResponse = Static<typeof loginResponseSchema>;
export type ChangePasswordRequest = Static<typeof changePasswordRequestSchema>;
