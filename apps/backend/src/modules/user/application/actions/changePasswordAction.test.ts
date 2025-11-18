import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import { users } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { ChangePasswordAction } from './changePasswordAction.ts';

describe('ChangePasswordAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let changePasswordAction: ChangePasswordAction;
  let passwordService: PasswordService;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    passwordService = new PasswordService(testContext.config);

    changePasswordAction = new ChangePasswordAction(userRepository, testContext.loggerService, passwordService);

    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('changes password successfully', async () => {
      const oldPassword = Generator.password();
      const newPassword = Generator.password();
      const userData = Generator.userData({ password: oldPassword });

      const hashedPassword = await passwordService.hashPassword(oldPassword);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      await changePasswordAction.execute(
        {
          userId: user.id,
          oldPassword,
          newPassword,
        },
        createTestExecutionContext(),
      );

      const updatedUser = await userRepository.findById(user.id);

      expect(updatedUser).toBeDefined();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      const isNewPasswordValid = await passwordService.comparePasswords(newPassword, updatedUser.password);

      expect(isNewPasswordValid).toBe(true);
    });

    it('throws ResourceNotFoundError when user does not exist', async () => {
      const nonExistentId = Generator.uuid();

      await expect(
        changePasswordAction.execute(
          {
            userId: nonExistentId,
            oldPassword: Generator.password(),
            newPassword: Generator.password(),
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws OperationNotValidError when old password is incorrect', async () => {
      const oldPassword = Generator.password();
      const userData = Generator.userData({ password: oldPassword });

      const hashedPassword = await passwordService.hashPassword(oldPassword);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      await expect(
        changePasswordAction.execute(
          {
            userId: user.id,
            oldPassword: Generator.password(),
            newPassword: Generator.password(),
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(OperationNotValidError);
    });
  });
});
