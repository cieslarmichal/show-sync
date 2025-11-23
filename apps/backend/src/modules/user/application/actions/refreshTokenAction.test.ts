import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { TokenService } from '../../../../common/auth/tokenService.ts';
import { UnauthorizedAccessError } from '../../../../common/errors/unathorizedAccessError.ts';
import { userSessions, users } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { UserSessionRepositoryImpl } from '../../infrastructure/repositories/userSessionRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { LoginUserAction } from './loginUserAction.ts';
import { RefreshTokenAction } from './refreshTokenAction.ts';

describe('RefreshTokenAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let userSessionRepository: UserSessionRepositoryImpl;
  let loginUserAction: LoginUserAction;
  let refreshTokenAction: RefreshTokenAction;
  let tokenService: TokenService;
  let passwordService: PasswordService;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    userSessionRepository = new UserSessionRepositoryImpl(testContext.databaseClient);
    tokenService = new TokenService(testContext.config);
    passwordService = new PasswordService(testContext.config);

    loginUserAction = new LoginUserAction(
      userRepository,
      testContext.loggerService,
      tokenService,
      passwordService,
      userSessionRepository,
      testContext.config,
    );
    refreshTokenAction = new RefreshTokenAction(
      userRepository,
      userSessionRepository,
      testContext.loggerService,
      tokenService,
      testContext.config,
      testContext.databaseClient,
    );

    await testContext.databaseClient.db.delete(userSessions);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userSessions);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('refreshes token successfully with valid refresh token and rotates session hash', async () => {
      const password = Generator.password();

      const userData = Generator.userData({ password: await passwordService.hashPassword(password) });

      await userRepository.create(userData);

      const loginResult = await loginUserAction.execute(
        {
          email: userData.email,
          password,
        },
        createTestExecutionContext(),
      );

      const { sessionId } = tokenService.verifyRefreshToken(loginResult.refreshToken);
      const sessionBefore = await userSessionRepository.findById(sessionId);
      expect(sessionBefore?.currentRefreshHash).toBeDefined();

      // Wait 1 second to ensure different token generation time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await refreshTokenAction.execute(
        { refreshToken: loginResult.refreshToken },
        createTestExecutionContext(),
      );

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(loginResult.refreshToken);

      const sessionAfter = await userSessionRepository.findById(sessionId);
      expect(sessionAfter?.currentRefreshHash).toBeDefined();
      expect(sessionAfter?.currentRefreshHash).not.toBe(sessionBefore?.currentRefreshHash);
      expect(sessionAfter?.prevRefreshHash).toBe(sessionBefore?.currentRefreshHash ?? null);
    });

    it('throws UnauthorizedAccessError when refresh token is invalid', async () => {
      await expect(
        refreshTokenAction.execute({ refreshToken: 'invalid-token' }, createTestExecutionContext()),
      ).rejects.toThrow(UnauthorizedAccessError);
    });
  });
});
