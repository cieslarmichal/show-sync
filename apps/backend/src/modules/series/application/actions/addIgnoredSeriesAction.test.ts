import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { DatabaseClient } from '../../../../infrastructure/database/database.ts';
import { users, userIgnoredSeries, userFavoriteSeries } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { FavoriteSeriesRepositoryImpl } from '../../infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';
import { IgnoredSeriesRepositoryImpl } from '../../infrastructure/repositories/ignoredSeriesRepositoryImpl.ts';

import { AddIgnoredSeriesAction } from './addIgnoredSeriesAction.ts';

describe('AddIgnoredSeriesAction', () => {
  let database: DatabaseClient;
  let userRepository: UserRepositoryImpl;
  let ignoredSeriesRepository: IgnoredSeriesRepositoryImpl;
  let favoriteSeriesRepository: FavoriteSeriesRepositoryImpl;
  let addIgnoredSeriesAction: AddIgnoredSeriesAction;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const config = createConfig();
    database = new DatabaseClient({ url: config.database.url });
    userRepository = new UserRepositoryImpl(database);
    ignoredSeriesRepository = new IgnoredSeriesRepositoryImpl(database);
    favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(database);
    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;
    addIgnoredSeriesAction = new AddIgnoredSeriesAction(
      ignoredSeriesRepository,
      favoriteSeriesRepository,
      database,
      loggerService,
    );

    await database.db.delete(userFavoriteSeries);
    await database.db.delete(userIgnoredSeries);
    await database.db.delete(users);
  });

  afterEach(async () => {
    await database.db.delete(userFavoriteSeries);
    await database.db.delete(userIgnoredSeries);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('adds a series to ignored list', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      const ignored = await addIgnoredSeriesAction.execute(user.id, seriesTmdbId);

      expect(ignored.userId).toBe(user.id);
      expect(ignored.seriesTmdbId).toBe(seriesTmdbId);
      expect(ignored.id).toBeDefined();
      expect(ignored.ignoredAt).toBeInstanceOf(Date);
    });

    it('throws ResourceAlreadyExistsError when series is already ignored', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      await ignoredSeriesRepository.create({ userId: user.id, seriesTmdbId });

      await expect(addIgnoredSeriesAction.execute(user.id, seriesTmdbId)).rejects.toThrow(ResourceAlreadyExistsError);
    });

    it('removes series from favorites when adding to ignored list', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      // First add to favorites
      await favoriteSeriesRepository.create({ userId: user.id, seriesTmdbId });

      // Verify it's in favorites
      const favoriteBefore = await favoriteSeriesRepository.findOne(user.id, seriesTmdbId);
      expect(favoriteBefore).toBeDefined();

      // Add to ignored list (should remove from favorites)
      const result = await addIgnoredSeriesAction.execute(user.id, seriesTmdbId);

      // Verify it's in ignored list
      expect(result).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);

      // Verify it's no longer in favorites
      const favoriteAfter = await favoriteSeriesRepository.findOne(user.id, seriesTmdbId);
      expect(favoriteAfter).toBeNull();
    });
  });
});
