import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import { users, userFavoriteSeries } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { FavoriteSeriesRepositoryImpl } from '../../infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';

import { RemoveFavoriteSeriesAction } from './removeFavoriteSeriesAction.ts';

describe('RemoveFavoriteSeriesAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let favoriteSeriesRepository: FavoriteSeriesRepositoryImpl;
  let removeFavoriteSeriesAction: RemoveFavoriteSeriesAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(testContext.databaseClient);

    removeFavoriteSeriesAction = new RemoveFavoriteSeriesAction(favoriteSeriesRepository, testContext.loggerService);

    await testContext.databaseClient.db.delete(userFavoriteSeries);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userFavoriteSeries);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('removes a favorite series successfully', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await favoriteSeriesRepository.create({ userId: user.id, seriesTmdbId, preferenceLevel: 'like' });

      await removeFavoriteSeriesAction.execute({ userId: user.id, seriesTmdbId }, createTestExecutionContext());

      const favoriteAfterRemoval = await favoriteSeriesRepository.findOne(user.id, seriesTmdbId);

      expect(favoriteAfterRemoval).toBeNull();
    });

    it('throws ResourceNotFoundError when series is not in favorites', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await expect(
        removeFavoriteSeriesAction.execute({ userId: user.id, seriesTmdbId }, createTestExecutionContext()),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });
});
