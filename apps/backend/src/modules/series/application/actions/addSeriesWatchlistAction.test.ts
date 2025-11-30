import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { users, userSeriesWatchlist, userSeriesRatings } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { UserSeriesWatchlistRepositoryImpl } from '../../infrastructure/repositories/userSeriesWatchlistRepositoryImpl.ts';

import { AddSeriesWatchlistAction } from './addSeriesWatchlistAction.ts';

describe('AddSeriesWatchlistAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let seriesWatchlistRepository: UserSeriesWatchlistRepositoryImpl;
  let addSeriesWatchlistAction: AddSeriesWatchlistAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    seriesWatchlistRepository = new UserSeriesWatchlistRepositoryImpl(testContext.databaseClient);
    addSeriesWatchlistAction = new AddSeriesWatchlistAction(
      seriesWatchlistRepository,
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

    it('throws ResourceAlreadyExistsError when series is already in watchlist with same type', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      await seriesWatchlistRepository.create({ userId: user.id, seriesTmdbId, type: 'notInterested' });

      await expect(
        addSeriesWatchlistAction.execute(
          { userId: user.id, seriesTmdbId, type: 'notInterested' },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceAlreadyExistsError);
    });

    it('updates watchlist type from notInterested to wantToWatch when series is already in watchlist', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      const initialWatchlist = await seriesWatchlistRepository.create({
        userId: user.id,
        seriesTmdbId,
        type: 'notInterested',
      });

      const result = await addSeriesWatchlistAction.execute(
        { userId: user.id, seriesTmdbId, type: 'wantToWatch' },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(initialWatchlist.id);
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);
      expect(result.type).toBe('wantToWatch');

      const updatedWatchlist = await seriesWatchlistRepository.findOne(user.id, seriesTmdbId);
      expect(updatedWatchlist).toBeDefined();
      expect(updatedWatchlist?.type).toBe('wantToWatch');
      expect(updatedWatchlist?.id).toBe(initialWatchlist.id);
    });

    it('updates watchlist type from wantToWatch to notInterested when series is already in watchlist', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      const initialWatchlist = await seriesWatchlistRepository.create({
        userId: user.id,
        seriesTmdbId,
        type: 'wantToWatch',
      });

      const result = await addSeriesWatchlistAction.execute(
        { userId: user.id, seriesTmdbId, type: 'notInterested' },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(initialWatchlist.id);
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);
      expect(result.type).toBe('notInterested');

      const updatedWatchlist = await seriesWatchlistRepository.findOne(user.id, seriesTmdbId);
      expect(updatedWatchlist).toBeDefined();
      expect(updatedWatchlist?.type).toBe('notInterested');
      expect(updatedWatchlist?.id).toBe(initialWatchlist.id);
    });
  });
});
