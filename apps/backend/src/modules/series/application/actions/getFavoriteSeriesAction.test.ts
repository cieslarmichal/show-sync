import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { users, userFavoriteSeries } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { FavoriteSeriesRepositoryImpl } from '../../infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';

import { GetFavoriteSeriesAction } from './getFavoriteSeriesAction.ts';

describe('GetFavoriteSeriesAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let favoriteSeriesRepository: FavoriteSeriesRepositoryImpl;
  let getFavoriteSeriesAction: GetFavoriteSeriesAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(testContext.databaseClient);

    getFavoriteSeriesAction = new GetFavoriteSeriesAction(favoriteSeriesRepository);

    await testContext.databaseClient.db.delete(userFavoriteSeries);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userFavoriteSeries);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('returns user favorite series with pagination', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId1 = Generator.number(1, 10000);
      const seriesTmdbId2 = Generator.number(10001, 20000);

      await favoriteSeriesRepository.create({ userId: user.id, seriesTmdbId: seriesTmdbId1, preferenceLevel: 'like' });
      await favoriteSeriesRepository.create({ userId: user.id, seriesTmdbId: seriesTmdbId2, preferenceLevel: 'love' });

      const result = await getFavoriteSeriesAction.execute({
        userId: user.id,
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0]?.userId).toBe(user.id);
    });

    it('returns empty array when user has no favorite series', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const result = await getFavoriteSeriesAction.execute({
        userId: user.id,
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
