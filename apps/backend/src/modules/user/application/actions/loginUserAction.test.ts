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

describe('LoginUserAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let loginUserAction: LoginUserAction;
  let tokenService: TokenService;
  let passwordService: PasswordService;
  let userSessionRepository: UserSessionRepositoryImpl;

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
    it('logs in user successfully with valid credentials', async () => {
      const password = Generator.password();

      const userData = Generator.userData({ password: await passwordService.hashPassword(password) });

      const user = await userRepository.create(userData);

      const result = await loginUserAction.execute(
        {
          email: userData.email,
          password,
        },
        createTestExecutionContext(),
      );

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      const decodedAccess = tokenService.verifyAccessToken(result.accessToken);
      expect(decodedAccess.userId).toBe(user.id);
      expect(decodedAccess.email).toBe(user.email);

      const decodedRefresh = tokenService.verifyRefreshToken(result.refreshToken);
      expect(decodedRefresh.userId).toBe(user.id);
      expect(decodedRefresh.email).toBe(user.email);
    });

    it('throws UnauthorizedAccessError when user does not exist', async () => {
      await expect(
        loginUserAction.execute(
          {
            email: 'nonexistent@example.com',
            password: 'anypassword',
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(UnauthorizedAccessError);
    });

    it('throws UnauthorizedAccessError when password is incorrect', async () => {
      const userData = Generator.userData({ password: await passwordService.hashPassword(Generator.password()) });

      await userRepository.create(userData);

      await expect(
        loginUserAction.execute(
          {
            email: userData.email,
            password: 'wrongpassword',
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(UnauthorizedAccessError);
    });
  });
});
