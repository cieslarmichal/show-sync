import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { users, userIgnoredSeries } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { IgnoredSeriesRepositoryImpl } from '../../infrastructure/repositories/ignoredSeriesRepositoryImpl.ts';

import { GetIgnoredSeriesAction } from './getIgnoredSeriesAction.ts';

describe('GetIgnoredSeriesAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let ignoredSeriesRepository: IgnoredSeriesRepositoryImpl;
  let getIgnoredSeriesAction: GetIgnoredSeriesAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    ignoredSeriesRepository = new IgnoredSeriesRepositoryImpl(testContext.databaseClient);

    getIgnoredSeriesAction = new GetIgnoredSeriesAction(ignoredSeriesRepository);

    await testContext.databaseClient.db.delete(userIgnoredSeries);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userIgnoredSeries);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('returns user ignored series with pagination', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId1 = Generator.number(1, 10000);
      const seriesTmdbId2 = Generator.number(10001, 20000);

      await ignoredSeriesRepository.create({ userId: user.id, seriesTmdbId: seriesTmdbId1 });
      await ignoredSeriesRepository.create({ userId: user.id, seriesTmdbId: seriesTmdbId2 });

      const result = await getIgnoredSeriesAction.execute({
        userId: user.id,
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0]?.userId).toBe(user.id);
    });

    it('returns empty array when user has no ignored series', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const result = await getIgnoredSeriesAction.execute({
        userId: user.id,
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
