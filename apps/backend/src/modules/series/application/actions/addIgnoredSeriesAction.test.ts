import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { users, userIgnoredSeries, userFavoriteSeries } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { FavoriteSeriesRepositoryImpl } from '../../infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';
import { IgnoredSeriesRepositoryImpl } from '../../infrastructure/repositories/ignoredSeriesRepositoryImpl.ts';

import { AddIgnoredSeriesAction } from './addIgnoredSeriesAction.ts';

describe('AddIgnoredSeriesAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let ignoredSeriesRepository: IgnoredSeriesRepositoryImpl;
  let favoriteSeriesRepository: FavoriteSeriesRepositoryImpl;
  let addIgnoredSeriesAction: AddIgnoredSeriesAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    ignoredSeriesRepository = new IgnoredSeriesRepositoryImpl(testContext.databaseClient);
    favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(testContext.databaseClient);
    addIgnoredSeriesAction = new AddIgnoredSeriesAction(
      ignoredSeriesRepository,
      favoriteSeriesRepository,
      testContext.databaseClient,
      testContext.loggerService,
    );

    await testContext.databaseClient.db.delete(userFavoriteSeries);
    await testContext.databaseClient.db.delete(userIgnoredSeries);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userFavoriteSeries);
    await testContext.databaseClient.db.delete(userIgnoredSeries);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('adds a series to ignored list', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      const ignored = await addIgnoredSeriesAction.execute(
        { userId: user.id, seriesTmdbId },
        createTestExecutionContext(),
      );

      expect(ignored.userId).toBe(user.id);
      expect(ignored.seriesTmdbId).toBe(seriesTmdbId);
      expect(ignored.id).toBeDefined();
    });

    it('throws ResourceAlreadyExistsError when series is already ignored', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      await ignoredSeriesRepository.create({ userId: user.id, seriesTmdbId });

      await expect(
        addIgnoredSeriesAction.execute({ userId: user.id, seriesTmdbId }, createTestExecutionContext()),
      ).rejects.toThrow(ResourceAlreadyExistsError);
    });

    it('removes series from favorites when adding to ignored list', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await favoriteSeriesRepository.create({ userId: user.id, seriesTmdbId, preferenceLevel: 'like' });

      const favoriteBefore = await favoriteSeriesRepository.findOne(user.id, seriesTmdbId);
      expect(favoriteBefore).toBeDefined();

      const result = await addIgnoredSeriesAction.execute(
        { userId: user.id, seriesTmdbId },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);

      const favoriteAfter = await favoriteSeriesRepository.findOne(user.id, seriesTmdbId);
      expect(favoriteAfter).toBeNull();
    });
  });
});
