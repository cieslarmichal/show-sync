import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { users } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { CreateUserAction } from './createUserAction.ts';

describe('CreateUserAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let createUserAction: CreateUserAction;
  let passwordService: PasswordService;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    passwordService = new PasswordService(testContext.config);

    createUserAction = new CreateUserAction(userRepository, testContext.loggerService, passwordService);

    await testContext.databaseClient.db.delete(users);
  });
  afterEach(async () => {
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('creates a new user successfully', async () => {
      const userData = Generator.userData();

      const result = await createUserAction.execute(userData, createTestExecutionContext());

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
      expect(result.createdAt).toBeDefined();

      expect(result.password).not.toBe(userData.password);
      const isPasswordValid = await passwordService.comparePasswords(userData.password, result.password);
      expect(isPasswordValid).toBe(true);
    });

    it('throws ResourceAlreadyExistsError when user with email already exists', async () => {
      const userData = Generator.userData();
      const newUserData = Generator.userData({ email: userData.email });

      await createUserAction.execute(userData, createTestExecutionContext());

      await expect(createUserAction.execute(newUserData, createTestExecutionContext())).rejects.toThrow(
        ResourceAlreadyExistsError,
      );
    });
  });
});
