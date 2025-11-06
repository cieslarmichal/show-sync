import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { users, userFavoriteSeries, userIgnoredSeries } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { FavoriteSeriesRepositoryImpl } from '../../infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';
import { IgnoredSeriesRepositoryImpl } from '../../infrastructure/repositories/ignoredSeriesRepositoryImpl.ts';

import { AddFavoriteSeriesAction } from './addFavoriteSeriesAction.ts';

describe('AddFavoriteSeriesAction', () => {
  let databaseClient: DatabaseClient;
  let userRepository: UserRepositoryImpl;
  let favoriteSeriesRepository: FavoriteSeriesRepositoryImpl;
  let ignoredSeriesRepository: IgnoredSeriesRepositoryImpl;
  let addFavoriteSeriesAction: AddFavoriteSeriesAction;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const config = createConfig();
    databaseClient = new DatabaseClient({ url: config.database.url });
    userRepository = new UserRepositoryImpl(databaseClient);
    favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(databaseClient);
    ignoredSeriesRepository = new IgnoredSeriesRepositoryImpl(databaseClient);
    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    addFavoriteSeriesAction = new AddFavoriteSeriesAction(
      favoriteSeriesRepository,
      ignoredSeriesRepository,
      databaseClient,
      loggerService,
    );

    await databaseClient.db.delete(userIgnoredSeries);
    await databaseClient.db.delete(userFavoriteSeries);
    await databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await databaseClient.db.delete(userIgnoredSeries);
    await databaseClient.db.delete(userFavoriteSeries);
    await databaseClient.db.delete(users);
    await databaseClient.close();
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
