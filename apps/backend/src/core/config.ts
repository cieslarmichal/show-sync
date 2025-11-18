import { type Static, Type } from '@sinclair/typebox';
import { TransformDecodeCheckError, Value } from '@sinclair/typebox/value';
import config from 'config';

import { ConfigurationError } from '../common/errors/configurationError.ts';
import { type LogLevel, logLevels } from '../common/logger/logLevel.ts';

const configSchema = Type.Object({
  database: Type.Object({
    url: Type.String({ minLength: 1 }),
    ssl: Type.Boolean(),
    pool: Type.Object({
      min: Type.Number({ minimum: 1, maximum: 50 }),
      max: Type.Number({ minimum: 10, maximum: 200 }),
      idleTimeoutMillis: Type.Number({ minimum: 10000, maximum: 120000 }),
      connectionTimeoutMillis: Type.Number({ minimum: 2000, maximum: 30000 }),
      keepAlive: Type.Boolean(),
      keepAliveInitialDelayMillis: Type.Number({ minimum: 0, maximum: 60000 }),
    }),
  }),
  cookie: Type.Object({ secret: Type.String({ minLength: 1 }) }),
  frontendUrl: Type.String({ minLength: 1 }),
  hashSaltRounds: Type.Number({ minimum: 10, maximum: 15 }),
  logLevel: Type.Union([...Object.values(logLevels).map((level) => Type.Literal(level as LogLevel))]),
  token: Type.Object({
    access: Type.Object({
      secret: Type.String({ minLength: 1 }),
      expiresIn: Type.Number({ minimum: 1 }),
    }),
    refresh: Type.Object({
      secret: Type.String({ minLength: 1 }),
      expiresIn: Type.Number({ minimum: 86400 }),
      graceMs: Type.Number({ minimum: 1000, maximum: 10000 }),
      // Short client/API idempotency window for coalescing duplicate refresh requests
      idempotencyMs: Type.Number({ minimum: 100, maximum: 5000 }),
    }),
    resetPassword: Type.Object({
      expiresIn: Type.Number({ minimum: 1800 }),
    }),
  }),
  server: Type.Object({
    host: Type.String({ minLength: 1 }),
    port: Type.Number({ minimum: 1, maximum: 65535 }),
  }),
  rateLimit: Type.Object({
    global: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    register: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    login: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    logout: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    refreshToken: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    profile: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    passwordChange: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    oneTimeToken: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    accountDeletion: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
    recommendations: Type.Object({
      max: Type.Number({ minimum: 1 }),
      timeWindow: Type.Number({ minimum: 1000 }),
    }),
  }),
  resend: Type.Object({
    apiKey: Type.String({ minLength: 1 }),
    fromEmail: Type.String({ minLength: 1 }),
    emails: Type.Object({
      resetPassword: Type.Object({
        templateFile: Type.String({ minLength: 1 }),
        subject: Type.String({ minLength: 1 }),
      }),
    }),
  }),
  tmdb: Type.Object({
    apiKey: Type.String({ minLength: 1 }),
    baseUrl: Type.String({ minLength: 1 }),
  }),
  openRouter: Type.Object({
    apiKey: Type.String({ minLength: 1 }),
    baseUrl: Type.String({ minLength: 1 }),
    model: Type.String({ minLength: 1 }),
    temperature: Type.Number({ minimum: 0, maximum: 2 }),
    maxTokens: Type.Number({ minimum: 1 }),
    maxMessageLength: Type.Number({ minimum: 1000, maximum: 1000000 }),
    maxRetries: Type.Number({ minimum: 1, maximum: 10 }),
    retryDelayMs: Type.Number({ minimum: 100, maximum: 10000 }),
    requestTimeoutMs: Type.Number({ minimum: 5000, maximum: 120000 }),
    maxRetryDelayMs: Type.Number({ minimum: 5000, maximum: 120000 }),
  }),
  recommendations: Type.Object({
    maxRequestsPerUser: Type.Number({ minimum: 1, maximum: 1000 }),
  }),
  watchroom: Type.Object({
    maxParticipants: Type.Number({ minimum: 1, maximum: 10 }),
  }),
});

export type Config = Static<typeof configSchema>;

export function createConfig(): Config {
  try {
    return Value.Decode(configSchema, config);
  } catch (error) {
    if (error instanceof TransformDecodeCheckError) {
      throw new ConfigurationError({ originalError: error });
    }

    throw error;
  }
}
