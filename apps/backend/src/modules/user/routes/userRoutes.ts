import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { createAuthenticationMiddleware } from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
import { CryptoService } from '../../../common/crypto/cryptoService.ts';
import { UnauthorizedAccessError } from '../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../common/logger/loggerService.ts';
import type { Config } from '../../../core/config.ts';
import type { DatabaseClient } from '../../../infrastructure/database/databaseClient.ts';
import { RecommendationRequestRepositoryImpl } from '../../recommendation/infrastructure/repositories/recommendationRequestRepositoryImpl.ts';
import { UserSeriesRatingRepositoryImpl } from '../../series/infrastructure/repositories/userSeriesRatingRepositoryImpl.ts';
import { UserSeriesWatchlistRepositoryImpl } from '../../series/infrastructure/repositories/userSeriesWatchlistRepositoryImpl.ts';
import { WatchroomRepositoryImpl } from '../../watchroom/infrastructure/repositories/watchroomRepositoryImpl.ts';
import { ChangePasswordAction } from '../application/actions/changePasswordAction.ts';
import { ChangePasswordByTokenAction } from '../application/actions/changePasswordByTokenAction.ts';
import { CreateUserAction } from '../application/actions/createUserAction.ts';
import { DeleteUserAction } from '../application/actions/deleteUserAction.ts';
import { FindUserAction } from '../application/actions/findUserAction.ts';
import { GetUserQuotaAction } from '../application/actions/getUserQuotaAction.ts';
import { GetUserStatsAction } from '../application/actions/getUserStatsAction.ts';
import { LoginUserAction } from '../application/actions/loginUserAction.ts';
import { LogoutUserAction } from '../application/actions/logoutUserAction.ts';
import { RefreshTokenAction } from '../application/actions/refreshTokenAction.ts';
import { ResendVerificationEmailAction } from '../application/actions/resendVerificationEmailAction.ts';
import { SendResetPasswordEmailAction } from '../application/actions/sendResetPasswordEmailAction.ts';
import { UpdateUserLanguageAction } from '../application/actions/updateUserLanguageAction.ts';
import { ValidateOneTimeTokenAction } from '../application/actions/validateOneTimeTokenAction.ts';
import { VerifyUserEmailAction } from '../application/actions/verifyUserEmailAction.ts';
import { PasswordService } from '../application/services/passwordService.ts';
import type { User } from '../domain/types/user.ts';
import { EmailRepositoryImpl } from '../infrastructure/repositories/emailRepositoryImpl.ts';
import { OneTimeTokenRepositoryImpl } from '../infrastructure/repositories/oneTimeTokenRepositoryImpl.ts';
import { UserRepositoryImpl } from '../infrastructure/repositories/userRepositoryImpl.ts';
import { UserSessionRepositoryImpl } from '../infrastructure/repositories/userSessionRepositoryImpl.ts';

import {
  changePasswordRequestSchema,
  emailSchema,
  loginRequestSchema,
  loginResponseSchema,
  passwordSchema,
  registerRequestSchema,
  updateUserLanguageRequestSchema,
  userSchema,
  type UserDto,
} from './userSchemas.ts';

const appEnvironment = process.env['NODE_ENV'];

export const userRoutes: FastifyPluginAsyncTypebox<{
  databaseClient: DatabaseClient;
  config: Config;
  loggerService: LoggerService;
  tokenService: TokenService;
}> = async function (fastify, opts) {
  const { config, databaseClient, loggerService, tokenService } = opts;

  // Idempotency window and single-flight coordination for refresh calls
  // Keyed by refresh token hash to avoid storing sensitive data.
  const inFlightRefreshes = new Map<string, Promise<{ accessToken: string; refreshToken: string }>>();
  const recentRefreshes = new Map<
    string,
    { result: { accessToken: string; refreshToken: string }; timestamp: number }
  >();

  const mapUserToDto = (user: User): UserDto => {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      language: user.language,
      createdAt: user.createdAt.toISOString(),
    };
  };

  const refreshTokenCookie = {
    name: 'refresh-token',
    config: {
      httpOnly: true,
      secure: true,
      sameSite: appEnvironment === 'production' ? ('lax' as const) : ('none' as const),
      path: '/',
      maxAge: config.token.refresh.expiresIn,
      ...(appEnvironment === 'production' ? { domain: '.show-sync.com' } : {}),
    },
  };

  const userRepository = new UserRepositoryImpl(databaseClient);
  const userSessionRepository = new UserSessionRepositoryImpl(databaseClient);
  const passwordService = new PasswordService(config);
  const recommendationRequestRepository = new RecommendationRequestRepositoryImpl(databaseClient);
  const userSeriesRatingRepository = new UserSeriesRatingRepositoryImpl(databaseClient);
  const userSeriesWatchlistRepository = new UserSeriesWatchlistRepositoryImpl(databaseClient);
  const watchroomRepository = new WatchroomRepositoryImpl(databaseClient);
  const emailRepository = new EmailRepositoryImpl(databaseClient);
  const oneTimeTokenRepository = new OneTimeTokenRepositoryImpl(databaseClient);

  const createUserAction = new CreateUserAction(
    userRepository,
    loggerService,
    passwordService,
    config,
    emailRepository,
    oneTimeTokenRepository,
    databaseClient,
  );
  const findUserAction = new FindUserAction(userRepository);
  const deleteUserAction = new DeleteUserAction(userRepository, loggerService);
  const loginUserAction = new LoginUserAction(
    userRepository,
    loggerService,
    tokenService,
    passwordService,
    userSessionRepository,
    config,
  );
  const refreshTokenAction = new RefreshTokenAction(
    userRepository,
    userSessionRepository,
    loggerService,
    tokenService,
    config,
    databaseClient,
  );
  const logoutUserAction = new LogoutUserAction(userSessionRepository, tokenService);
  const getUserStatsAction = new GetUserStatsAction(
    userSeriesRatingRepository,
    userSeriesWatchlistRepository,
    watchroomRepository,
    recommendationRequestRepository,
  );
  const getUserQuotaAction = new GetUserQuotaAction(recommendationRequestRepository, config);
  const resetUserPasswordAction = new SendResetPasswordEmailAction(
    userRepository,
    loggerService,
    config,
    emailRepository,
    oneTimeTokenRepository,
    databaseClient,
  );
  const changePasswordAction = new ChangePasswordAction(userRepository, loggerService, passwordService);
  const changePasswordByTokenAction = new ChangePasswordByTokenAction(
    userRepository,
    loggerService,
    passwordService,
    oneTimeTokenRepository,
    databaseClient,
  );
  const validateOneTimeTokenAction = new ValidateOneTimeTokenAction(
    userRepository,
    loggerService,
    oneTimeTokenRepository,
  );
  const verifyUserEmailAction = new VerifyUserEmailAction(
    userRepository,
    loggerService,
    oneTimeTokenRepository,
    databaseClient,
  );
  const resendVerificationEmailAction = new ResendVerificationEmailAction(
    userRepository,
    loggerService,
    config,
    emailRepository,
    oneTimeTokenRepository,
    databaseClient,
  );
  const updateUserLanguageAction = new UpdateUserLanguageAction(userRepository, loggerService);

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);

  fastify.post('/users/register', {
    schema: {
      body: registerRequestSchema,
      response: {
        201: userSchema,
      },
    },
    config: {
      rateLimit: config.rateLimit.register,
    },
    handler: async (request, reply) => {
      const user = await createUserAction.execute(
        {
          name: request.body.name,
          email: request.body.email,
          password: request.body.password,
          language: request.body.language || 'pl',
        },
        {
          requestId: request.id,
        },
      );

      return reply.status(201).send(mapUserToDto(user));
    },
  });

  fastify.post('/users/login', {
    schema: {
      body: loginRequestSchema,
      response: {
        200: loginResponseSchema,
      },
    },
    config: {
      rateLimit: config.rateLimit.login,
    },
    handler: async (request, reply) => {
      const { email, password } = request.body;

      const result = await loginUserAction.execute(
        { email, password },
        {
          requestId: request.id,
        },
      );

      reply.setCookie(refreshTokenCookie.name, result.refreshToken, refreshTokenCookie.config);

      return reply.send({ accessToken: result.accessToken });
    },
  });

  fastify.post('/users/logout', {
    schema: {
      response: {
        204: Type.Null(),
      },
    },
    config: {
      rateLimit: config.rateLimit.logout,
    },
    handler: async (request, reply) => {
      const refreshToken = request.cookies[refreshTokenCookie.name];

      await logoutUserAction.execute({ refreshToken });

      reply.clearCookie(refreshTokenCookie.name, { path: refreshTokenCookie.config.path });

      return reply.status(204).send();
    },
  });

  fastify.post('/users/refresh-token', {
    schema: {
      response: {
        200: Type.Object({ accessToken: Type.String() }),
        401: Type.Object({
          name: Type.String(),
          message: Type.String(),
        }),
      },
    },
    config: {
      rateLimit: config.rateLimit.refreshToken,
    },
    handler: async (request, reply) => {
      const refreshToken = request.cookies[refreshTokenCookie.name];

      if (!refreshToken) {
        // Don't log this as an error - it's expected for unauthenticated users
        // Just return 401 silently
        return reply.status(401).send({
          name: 'UnauthorizedAccessError',
          message: 'Refresh token not found',
        });
      }

      const tokenHash = CryptoService.hashData(refreshToken);

      // Short-circuit for very recent duplicate refresh attempts (e.g., rapid page reloads)
      const recent = recentRefreshes.get(tokenHash);
      const now = Date.now();
      if (recent && now - recent.timestamp <= config.token.refresh.idempotencyMs) {
        reply.setCookie(refreshTokenCookie.name, recent.result.refreshToken, refreshTokenCookie.config);
        return reply.send({ accessToken: recent.result.accessToken });
      }

      // Ensure single-flight per tokenHash
      let promise = inFlightRefreshes.get(tokenHash);
      if (!promise) {
        promise = refreshTokenAction.execute(
          { refreshToken },
          {
            requestId: request.id,
          },
        );
        inFlightRefreshes.set(tokenHash, promise);
      }

      let result: { accessToken: string; refreshToken: string };
      try {
        result = await promise;

        // Cache result briefly for idempotency window
        recentRefreshes.set(tokenHash, { result, timestamp: now });

        // Opportunistic cleanup of stale recent entries
        for (const [key, entry] of recentRefreshes) {
          if (now - entry.timestamp > config.token.refresh.idempotencyMs) {
            recentRefreshes.delete(key);
          }
        }
      } finally {
        inFlightRefreshes.delete(tokenHash);
      }

      reply.setCookie(refreshTokenCookie.name, result.refreshToken, refreshTokenCookie.config);
      return reply.send({ accessToken: result.accessToken });
    },
  });

  fastify.get('/users/me', {
    schema: {
      response: {
        200: userSchema,
      },
    },
    config: {
      rateLimit: config.rateLimit.profile,
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;

      const user = await findUserAction.execute(userId);

      return reply.send(mapUserToDto(user));
    },
  });

  fastify.delete('/users/me', {
    schema: {
      response: {
        204: Type.Null(),
      },
    },
    config: {
      rateLimit: config.rateLimit.accountDeletion,
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;

      await deleteUserAction.execute(userId, {
        requestId: request.id,
        userId,
      });

      const refreshToken = request.cookies[refreshTokenCookie.name];

      if (refreshToken) {
        reply.clearCookie(refreshTokenCookie.name, { path: refreshTokenCookie.config.path });
      }

      return reply.status(204).send();
    },
  });

  fastify.post('/users/reset-password', {
    schema: {
      body: Type.Object({
        email: emailSchema,
      }),
      response: {
        204: Type.Null(),
      },
    },
    config: {
      rateLimit: config.rateLimit.passwordChange,
    },
    handler: async (request, reply) => {
      const { email } = request.body;

      await resetUserPasswordAction.execute({ email });

      return reply.status(204).send();
    },
  });

  fastify.post('/one-time-tokens/validate', {
    schema: {
      body: Type.Object({
        token: Type.String({ minLength: 1 }),
        purpose: Type.Union([Type.Literal('reset-password')]),
      }),
      response: {
        200: Type.Object({ valid: Type.Boolean() }),
      },
    },
    config: {
      rateLimit: config.rateLimit.oneTimeToken,
    },
    handler: async (request, reply) => {
      const { token, purpose } = request.body;

      const valid = await validateOneTimeTokenAction.execute({ token, purpose });

      return reply.send({ valid });
    },
  });

  fastify.post('/users/change-password', {
    schema: {
      body: Type.Object({
        token: Type.String({ minLength: 1 }),
        newPassword: passwordSchema,
      }),
      response: {
        204: Type.Null(),
      },
    },
    config: {
      rateLimit: config.rateLimit.passwordChange,
    },
    handler: async (request, reply) => {
      const { token, newPassword } = request.body;

      await changePasswordByTokenAction.execute({ token, newPassword });

      return reply.status(204).send();
    },
  });

  fastify.patch('/users/me/language', {
    schema: {
      body: updateUserLanguageRequestSchema,
      response: {
        204: Type.Null(),
      },
    },
    config: {
      rateLimit: config.rateLimit.profile,
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;
      const { language } = request.body;

      await updateUserLanguageAction.execute(
        { userId, language },
        {
          requestId: request.id,
          userId,
        },
      );

      return reply.status(204).send();
    },
  });

  fastify.patch('/users/me/password', {
    schema: {
      body: changePasswordRequestSchema,
      response: {
        204: Type.Null(),
      },
    },
    config: {
      rateLimit: config.rateLimit.passwordChange,
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;
      const { oldPassword, newPassword } = request.body;

      await changePasswordAction.execute(
        { userId, oldPassword, newPassword },
        {
          requestId: request.id,
          userId,
        },
      );

      return reply.status(204).send();
    },
  });

  fastify.get('/users/me/stats', {
    schema: {
      response: {
        200: Type.Object({
          ratingsCount: Type.Integer(),
          wantToWatchCount: Type.Integer(),
          watchRoomsCount: Type.Integer(),
          recommendationCount: Type.Integer(),
        }),
      },
    },
    config: {
      rateLimit: config.rateLimit.profile,
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;

      const stats = await getUserStatsAction.execute({ userId });

      return reply.send(stats);
    },
  });

  fastify.get('/users/me/quota', {
    schema: {
      response: {
        200: Type.Object({
          recommendationCount: Type.Integer(),
          maxRecommendationCount: Type.Integer(),
        }),
      },
    },
    config: {
      rateLimit: config.rateLimit.profile,
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;

      const quota = await getUserQuotaAction.execute({ userId });

      return reply.send(quota);
    },
  });

  fastify.post('/users/verify-email', {
    schema: {
      body: Type.Object({
        token: Type.String({ minLength: 1 }),
      }),
      response: {
        204: Type.Null(),
      },
    },
    handler: async (request, reply) => {
      const { token } = request.body;

      await verifyUserEmailAction.execute(
        { emailVerificationToken: token },
        {
          requestId: request.id,
        },
      );

      return reply.status(204).send();
    },
  });

  fastify.post('/users/resend-verification-email', {
    schema: {
      body: Type.Object({
        email: emailSchema,
      }),
      response: {
        204: Type.Null(),
      },
    },
    config: {
      rateLimit: config.rateLimit.login,
    },
    handler: async (request, reply) => {
      const { email } = request.body;

      await resendVerificationEmailAction.execute(
        { email },
        {
          requestId: request.id,
        },
      );

      return reply.status(204).send();
    },
  });
};
