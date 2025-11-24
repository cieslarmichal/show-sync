import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { users, userSeriesWatchlist, userSeriesRatings } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { UserSeriesRatingRepositoryImpl } from '../../infrastructure/repositories/userSeriesRatingRepositoryImpl.ts';
import { UserSeriesWatchlistRepositoryImpl } from '../../infrastructure/repositories/userSeriesWatchlistRepositoryImpl.ts';

import { AddSeriesWatchlistAction } from './addSeriesWatchlistAction.ts';

describe('AddSeriesWatchlistAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let seriesWatchlistRepository: UserSeriesWatchlistRepositoryImpl;
  let seriesRatingRepository: UserSeriesRatingRepositoryImpl;
  let addSeriesWatchlistAction: AddSeriesWatchlistAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    seriesWatchlistRepository = new UserSeriesWatchlistRepositoryImpl(testContext.databaseClient);
    seriesRatingRepository = new UserSeriesRatingRepositoryImpl(testContext.databaseClient);
    addSeriesWatchlistAction = new AddSeriesWatchlistAction(
      seriesWatchlistRepository,
      seriesRatingRepository,
      testContext.databaseClient,
      testContext.loggerService,
    );

    await testContext.databaseClient.db.delete(userSeriesRatings);
    await testContext.databaseClient.db.delete(userSeriesWatchlist);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userSeriesRatings);
    await testContext.databaseClient.db.delete(userSeriesWatchlist);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('adds a series to watchlist', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      const watchlist = await addSeriesWatchlistAction.execute(
        { userId: user.id, seriesTmdbId, type: 'wantToWatch' },
        createTestExecutionContext(),
      );

      expect(watchlist.userId).toBe(user.id);
      expect(watchlist.seriesTmdbId).toBe(seriesTmdbId);
      expect(watchlist.type).toBe('wantToWatch');
      expect(watchlist.id).toBeDefined();
    });

    it('throws ResourceAlreadyExistsError when series is already in watchlist', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      await seriesWatchlistRepository.create({ userId: user.id, seriesTmdbId, type: 'notInterested' });

      await expect(
        addSeriesWatchlistAction.execute({ userId: user.id, seriesTmdbId, type: 'notInterested' }, createTestExecutionContext()),
      ).rejects.toThrow(ResourceAlreadyExistsError);
    });

    it('removes series rating when adding to watchlist', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await seriesRatingRepository.create({ userId: user.id, seriesTmdbId, rating: 'like' });

      const ratingBefore = await seriesRatingRepository.findOne(user.id, seriesTmdbId);
      expect(ratingBefore).toBeDefined();

      const result = await addSeriesWatchlistAction.execute(
        { userId: user.id, seriesTmdbId, type: 'notInterested' },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);

      const ratingAfter = await seriesRatingRepository.findOne(user.id, seriesTmdbId);
      expect(ratingAfter).toBeNull();
    });
  });
});
