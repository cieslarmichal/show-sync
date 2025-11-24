import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { users, userSeriesWatchlist } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { UserSeriesWatchlistRepositoryImpl } from '../../infrastructure/repositories/userSeriesWatchlistRepositoryImpl.ts';

import { GetSeriesWatchlistAction } from './getSeriesWatchlistAction.ts';

describe('GetSeriesWatchlistAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let seriesWatchlistRepository: UserSeriesWatchlistRepositoryImpl;
  let getSeriesWatchlistAction: GetSeriesWatchlistAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    seriesWatchlistRepository = new UserSeriesWatchlistRepositoryImpl(testContext.databaseClient);

    getSeriesWatchlistAction = new GetSeriesWatchlistAction(seriesWatchlistRepository);

    await testContext.databaseClient.db.delete(userSeriesWatchlist);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userSeriesWatchlist);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('returns user watchlist with pagination', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId1 = Generator.number(1, 10000);
      const seriesTmdbId2 = Generator.number(10001, 20000);

      await seriesWatchlistRepository.create({ userId: user.id, seriesTmdbId: seriesTmdbId1, type: 'notInterested' });
      await seriesWatchlistRepository.create({ userId: user.id, seriesTmdbId: seriesTmdbId2, type: 'wantToWatch' });

      const result = await getSeriesWatchlistAction.execute({
        userId: user.id,
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0]?.userId).toBe(user.id);
    });

    it('returns empty array when user has no watchlist items', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const result = await getSeriesWatchlistAction.execute({
        userId: user.id,
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
