import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import { users, userSeriesWatchlist } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { UserSeriesWatchlistRepositoryImpl } from '../../infrastructure/repositories/userSeriesWatchlistRepositoryImpl.ts';

import { RemoveSeriesWatchlistAction } from './removeSeriesWatchlistAction.ts';

describe('RemoveSeriesWatchlistAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let seriesWatchlistRepository: UserSeriesWatchlistRepositoryImpl;
  let removeSeriesWatchlistAction: RemoveSeriesWatchlistAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    seriesWatchlistRepository = new UserSeriesWatchlistRepositoryImpl(testContext.databaseClient);

    removeSeriesWatchlistAction = new RemoveSeriesWatchlistAction(seriesWatchlistRepository, testContext.loggerService);

    await testContext.databaseClient.db.delete(userSeriesWatchlist);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userSeriesWatchlist);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('removes a series from watchlist', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      await seriesWatchlistRepository.create({ userId: user.id, seriesTmdbId, type: 'notInterested' });

      await removeSeriesWatchlistAction.execute({ userId: user.id, seriesTmdbId }, createTestExecutionContext());

      const watchlist = await seriesWatchlistRepository.findOne(user.id, seriesTmdbId);

      expect(watchlist).toBeNull();
    });

    it('throws ResourceNotFoundError when series is not in watchlist', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      await expect(
        removeSeriesWatchlistAction.execute({ userId: user.id, seriesTmdbId }, createTestExecutionContext()),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });
});
