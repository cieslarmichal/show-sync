import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { users } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { UpdateUserLanguageAction } from './updateUserLanguageAction.ts';

describe('UpdateUserLanguageAction', () => {
  let testContext: TestContext;
  let updateUserLanguageAction: UpdateUserLanguageAction;
  let userRepository: UserRepositoryImpl;
  let passwordService: PasswordService;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    passwordService = new PasswordService(testContext.config);

    updateUserLanguageAction = new UpdateUserLanguageAction(userRepository, testContext.loggerService);

    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('should update user language preference to English', async () => {
      const password = Generator.password();
      const userData = Generator.userData({ password });

      const hashedPassword = await passwordService.hashPassword(password);
      const user = await userRepository.create({ ...userData, password: hashedPassword, language: 'pl' });

      await updateUserLanguageAction.execute(
        {
          userId: user.id,
          language: 'en',
        },
        createTestExecutionContext(),
      );

      const updatedUser = await userRepository.findById(user.id);

      expect(updatedUser?.language).toBe('en');
    });

    it('should update user language preference to Polish', async () => {
      const password = Generator.password();
      const userData = Generator.userData({ password });

      const hashedPassword = await passwordService.hashPassword(password);
      const user = await userRepository.create({ ...userData, password: hashedPassword, language: 'en' });

      await updateUserLanguageAction.execute(
        {
          userId: user.id,
          language: 'pl',
        },
        createTestExecutionContext(),
      );

      const updatedUser = await userRepository.findById(user.id);

      expect(updatedUser?.language).toBe('pl');
    });
  });
});
