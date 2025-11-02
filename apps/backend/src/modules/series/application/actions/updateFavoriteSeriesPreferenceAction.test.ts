import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { DatabaseClient } from '../../../../infrastructure/database/database.ts';
import { users, userFavoriteSeries } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { preferenceLevels } from '../../domain/types/favoriteSeries.ts';
import { FavoriteSeriesRepositoryImpl } from '../../infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';

import { UpdateFavoriteSeriesPreferenceAction } from './updateFavoriteSeriesPreferenceAction.ts';

describe('UpdateFavoriteSeriesPreferenceAction', () => {
  let database: DatabaseClient;
  let userRepository: UserRepositoryImpl;
  let favoriteSeriesRepository: FavoriteSeriesRepositoryImpl;
  let updateFavoriteSeriesPreferenceAction: UpdateFavoriteSeriesPreferenceAction;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const config = createConfig();
    database = new DatabaseClient({ url: config.database.url });
    userRepository = new UserRepositoryImpl(database);
    favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(database);
    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    updateFavoriteSeriesPreferenceAction = new UpdateFavoriteSeriesPreferenceAction(
      favoriteSeriesRepository,
      loggerService,
    );

    await database.db.delete(userFavoriteSeries);
    await database.db.delete(users);
  });

  afterEach(async () => {
    await database.db.delete(userFavoriteSeries);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('updates preference level from like to love successfully', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await favoriteSeriesRepository.create({
        userId: user.id,
        seriesTmdbId,
        preferenceLevel: preferenceLevels.like,
      });

      const result = await updateFavoriteSeriesPreferenceAction.execute({
        userId: user.id,
        seriesTmdbId,
        preferenceLevel: preferenceLevels.love,
      });

      expect(result).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);
      expect(result.preferenceLevel).toBe(preferenceLevels.love);
    });

    it('updates preference level from love to like successfully', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await favoriteSeriesRepository.create({
        userId: user.id,
        seriesTmdbId,
        preferenceLevel: preferenceLevels.love,
      });

      const result = await updateFavoriteSeriesPreferenceAction.execute({
        userId: user.id,
        seriesTmdbId,
        preferenceLevel: preferenceLevels.like,
      });

      expect(result).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);
      expect(result.preferenceLevel).toBe(preferenceLevels.like);
    });

    it('throws ResourceNotFoundError when favorite series does not exist', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await expect(
        updateFavoriteSeriesPreferenceAction.execute({
          userId: user.id,
          seriesTmdbId,
          preferenceLevel: preferenceLevels.love,
        }),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws ResourceNotFoundError when updating another user favorite series', async () => {
      const userData1 = Generator.userData();
      const user1 = await userRepository.create(userData1);
      const userData2 = Generator.userData();
      const user2 = await userRepository.create(userData2);
      const seriesTmdbId = Generator.number(1, 10000);

      await favoriteSeriesRepository.create({
        userId: user1.id,
        seriesTmdbId,
        preferenceLevel: preferenceLevels.like,
      });

      await expect(
        updateFavoriteSeriesPreferenceAction.execute({
          userId: user2.id,
          seriesTmdbId,
          preferenceLevel: preferenceLevels.love,
        }),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('allows setting same preference level (idempotent)', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await favoriteSeriesRepository.create({
        userId: user.id,
        seriesTmdbId,
        preferenceLevel: preferenceLevels.like,
      });

      const result = await updateFavoriteSeriesPreferenceAction.execute({
        userId: user.id,
        seriesTmdbId,
        preferenceLevel: preferenceLevels.like,
      });

      expect(result).toBeDefined();
      expect(result.preferenceLevel).toBe(preferenceLevels.like);
    });
  });
});
