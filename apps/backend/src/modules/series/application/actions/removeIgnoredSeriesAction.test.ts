import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import { users, userIgnoredSeries } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { IgnoredSeriesRepositoryImpl } from '../../infrastructure/repositories/ignoredSeriesRepositoryImpl.ts';

import { RemoveIgnoredSeriesAction } from './removeIgnoredSeriesAction.ts';

describe('RemoveIgnoredSeriesAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let ignoredSeriesRepository: IgnoredSeriesRepositoryImpl;
  let removeIgnoredSeriesAction: RemoveIgnoredSeriesAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    ignoredSeriesRepository = new IgnoredSeriesRepositoryImpl(testContext.databaseClient);

    removeIgnoredSeriesAction = new RemoveIgnoredSeriesAction(ignoredSeriesRepository, testContext.loggerService);

    await testContext.databaseClient.db.delete(userIgnoredSeries);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userIgnoredSeries);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('removes a series from ignored list', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      await ignoredSeriesRepository.create({ userId: user.id, seriesTmdbId });

      await removeIgnoredSeriesAction.execute({ userId: user.id, seriesTmdbId }, createTestExecutionContext());

      const ignored = await ignoredSeriesRepository.findOne(user.id, seriesTmdbId);

      expect(ignored).toBeNull();
    });

    it('throws ResourceNotFoundError when series is not in ignored list', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      await expect(
        removeIgnoredSeriesAction.execute({ userId: user.id, seriesTmdbId }, createTestExecutionContext()),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });
});
