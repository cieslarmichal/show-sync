import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import { users } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';

import { DeleteUserAction } from './deleteUserAction.ts';

describe('DeleteUserAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let deleteUserAction: DeleteUserAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);

    deleteUserAction = new DeleteUserAction(userRepository, testContext.loggerService);

    await testContext.databaseClient.db.delete(users);
  });
  afterEach(async () => {
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('marks user as deleted successfully', async () => {
      const userData = Generator.userData();

      const user = await userRepository.create(userData);

      await deleteUserAction.execute(user.id, createTestExecutionContext({ userId: user.id }));

      const deletedUser = await userRepository.findById(user.id);
      expect(deletedUser).toBeNull();
    });

    it('throws ResourceNotFoundError when user does not exist', async () => {
      const nonExistentId = Generator.uuid();

      await expect(deleteUserAction.execute(nonExistentId, createTestExecutionContext())).rejects.toThrow(
        ResourceNotFoundError,
      );
    });
  });
});
