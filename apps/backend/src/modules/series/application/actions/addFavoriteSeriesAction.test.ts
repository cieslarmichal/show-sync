import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { DatabaseClient } from '../../../../infrastructure/database/database.ts';
import { users, userFavoriteSeries, userIgnoredSeries } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { FavoriteSeriesRepositoryImpl } from '../../infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';
import { IgnoredSeriesRepositoryImpl } from '../../infrastructure/repositories/ignoredSeriesRepositoryImpl.ts';

import { AddFavoriteSeriesAction } from './addFavoriteSeriesAction.ts';

describe('AddFavoriteSeriesAction', () => {
  let database: DatabaseClient;
  let userRepository: UserRepositoryImpl;
  let favoriteSeriesRepository: FavoriteSeriesRepositoryImpl;
  let ignoredSeriesRepository: IgnoredSeriesRepositoryImpl;
  let addFavoriteSeriesAction: AddFavoriteSeriesAction;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const config = createConfig();
    database = new DatabaseClient({ url: config.database.url });
    userRepository = new UserRepositoryImpl(database);
    favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(database);
    ignoredSeriesRepository = new IgnoredSeriesRepositoryImpl(database);
    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    addFavoriteSeriesAction = new AddFavoriteSeriesAction(
      favoriteSeriesRepository,
      ignoredSeriesRepository,
      database,
      loggerService,
    );

    await database.db.delete(userIgnoredSeries);
    await database.db.delete(userFavoriteSeries);
    await database.db.delete(users);
  });

  afterEach(async () => {
    await database.db.delete(userIgnoredSeries);
    await database.db.delete(userFavoriteSeries);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('adds a favorite series successfully', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      const result = await addFavoriteSeriesAction.execute(user.id, seriesTmdbId);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);
      expect(result.addedAt).toBeDefined();
    });

    it('throws ResourceAlreadyExistsError when series is already in favorites', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await favoriteSeriesRepository.create({ userId: user.id, seriesTmdbId });

      await expect(addFavoriteSeriesAction.execute(user.id, seriesTmdbId)).rejects.toThrow(ResourceAlreadyExistsError);
    });

    it('removes series from ignored list when adding to favorites', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      // First add to ignored list
      await ignoredSeriesRepository.create({ userId: user.id, seriesTmdbId });

      // Verify it's in ignored list
      const ignoredBefore = await ignoredSeriesRepository.findOne(user.id, seriesTmdbId);
      expect(ignoredBefore).toBeDefined();

      // Add to favorites (should remove from ignored)
      const result = await addFavoriteSeriesAction.execute(user.id, seriesTmdbId);

      // Verify it's in favorites
      expect(result).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);

      // Verify it's no longer in ignored list
      const ignoredAfter = await ignoredSeriesRepository.findOne(user.id, seriesTmdbId);
      expect(ignoredAfter).toBeNull();
    });
  });
});
