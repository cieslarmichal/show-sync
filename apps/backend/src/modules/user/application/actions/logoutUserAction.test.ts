import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { TokenService } from '../../../../common/auth/tokenService.ts';
import { userSessions, users } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { UserSessionRepositoryImpl } from '../../infrastructure/repositories/userSessionRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { LoginUserAction } from './loginUserAction.ts';
import { LogoutUserAction } from './logoutUserAction.ts';

describe('LogoutUserAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let userSessionRepository: UserSessionRepositoryImpl;
  let loginUserAction: LoginUserAction;
  let logoutUserAction: LogoutUserAction;
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
    );
    logoutUserAction = new LogoutUserAction(userSessionRepository, tokenService);

    await testContext.databaseClient.db.delete(userSessions);
    await testContext.databaseClient.db.delete(users);
  });
  afterEach(async () => {
    await testContext.databaseClient.db.delete(userSessions);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('revokes session successfully', async () => {
      const password = Generator.password();

      const userData = Generator.userData({
        password: await passwordService.hashPassword(password),
      });

      await userRepository.create(userData);

      const loginResult = await loginUserAction.execute(
        {
          email: userData.email,
          password,
        },
        createTestExecutionContext(),
      );

      await logoutUserAction.execute({ refreshToken: loginResult.refreshToken });

      const { sessionId } = tokenService.verifyRefreshToken(loginResult.refreshToken);
      const session = await userSessionRepository.findById(sessionId);
      expect(session?.status).toBe('revoked');
    });

    it('does not throw UnauthorizedAccessError when refresh token is not provided', async () => {
      try {
        await logoutUserAction.execute({ refreshToken: undefined });
      } catch (error) {
        expect.fail('Expected no error to be thrown');
      }
    });

    it('does not throw error when refresh token is invalid', async () => {
      try {
        await logoutUserAction.execute({ refreshToken: 'invalid-token' });
      } catch (error) {
        expect.fail('Expected no error to be thrown');
      }
    });
  });
});
