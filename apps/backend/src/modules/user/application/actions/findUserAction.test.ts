import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import { users } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';

import { FindUserAction } from './findUserAction.ts';

describe('FindUserAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let findUserAction: FindUserAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);

    findUserAction = new FindUserAction(userRepository);

    await testContext.databaseClient.db.delete(users);
  });
  afterEach(async () => {
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('returns user when found', async () => {
      const userData = Generator.userData();

      const createdUser = await userRepository.create(userData);
      const result = await findUserAction.execute(createdUser.id);

      expect(result.id).toBe(createdUser.id);
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
    });

    it('throws ResourceNotFoundError when user does not exist', async () => {
      const nonExistentId = Generator.uuid();

      await expect(findUserAction.execute(nonExistentId)).rejects.toThrow(ResourceNotFoundError);
    });
  });
});
