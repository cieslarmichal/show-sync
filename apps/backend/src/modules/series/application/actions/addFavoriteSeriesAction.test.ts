import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { users, userFavoriteSeries, userIgnoredSeries } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { FavoriteSeriesRepositoryImpl } from '../../infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';
import { IgnoredSeriesRepositoryImpl } from '../../infrastructure/repositories/ignoredSeriesRepositoryImpl.ts';

import { AddFavoriteSeriesAction } from './addFavoriteSeriesAction.ts';

describe('AddFavoriteSeriesAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let favoriteSeriesRepository: FavoriteSeriesRepositoryImpl;
  let ignoredSeriesRepository: IgnoredSeriesRepositoryImpl;
  let addFavoriteSeriesAction: AddFavoriteSeriesAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(testContext.databaseClient);
    ignoredSeriesRepository = new IgnoredSeriesRepositoryImpl(testContext.databaseClient);

    addFavoriteSeriesAction = new AddFavoriteSeriesAction(
      favoriteSeriesRepository,
      ignoredSeriesRepository,
      testContext.databaseClient,
      testContext.loggerService,
    );

    await testContext.databaseClient.db.delete(userIgnoredSeries);
    await testContext.databaseClient.db.delete(userFavoriteSeries);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userIgnoredSeries);
    await testContext.databaseClient.db.delete(userFavoriteSeries);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('adds a favorite series successfully', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      const result = await addFavoriteSeriesAction.execute(
        { userId: user.id, seriesTmdbId, preferenceLevel: 'like' },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);
      expect(result.preferenceLevel).toBe('like');
    });

    it('throws ResourceAlreadyExistsError when series is already in favorites', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await favoriteSeriesRepository.create({ userId: user.id, seriesTmdbId, preferenceLevel: 'like' });

      await expect(
        addFavoriteSeriesAction.execute(
          { userId: user.id, seriesTmdbId, preferenceLevel: 'like' },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceAlreadyExistsError);
    });

    it('removes series from ignored list when adding to favorites', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await ignoredSeriesRepository.create({ userId: user.id, seriesTmdbId });

      const ignoredBefore = await ignoredSeriesRepository.findOne(user.id, seriesTmdbId);
      expect(ignoredBefore).toBeDefined();

      const result = await addFavoriteSeriesAction.execute(
        { userId: user.id, seriesTmdbId, preferenceLevel: 'like' },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);

      const ignoredAfter = await ignoredSeriesRepository.findOne(user.id, seriesTmdbId);
      expect(ignoredAfter).toBeNull();
    });
  });
});
