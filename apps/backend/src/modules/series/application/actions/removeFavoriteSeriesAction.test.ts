import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { DatabaseClient } from '../../../../infrastructure/database/database.ts';
import { users, userFavoriteSeries } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { FavoriteSeriesRepositoryImpl } from '../../infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';

import { RemoveFavoriteSeriesAction } from './removeFavoriteSeriesAction.ts';

describe('RemoveFavoriteSeriesAction', () => {
  let database: DatabaseClient;
  let userRepository: UserRepositoryImpl;
  let favoriteSeriesRepository: FavoriteSeriesRepositoryImpl;
  let loggerService: LoggerService;
  let removeFavoriteSeriesAction: RemoveFavoriteSeriesAction;

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

    removeFavoriteSeriesAction = new RemoveFavoriteSeriesAction(favoriteSeriesRepository, loggerService);

    await database.db.delete(userFavoriteSeries);
    await database.db.delete(users);
  });

  afterEach(async () => {
    await database.db.delete(userFavoriteSeries);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('removes a favorite series successfully', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await favoriteSeriesRepository.create({ userId: user.id, seriesTmdbId, preferenceLevel: 'like' });

      await removeFavoriteSeriesAction.execute(user.id, seriesTmdbId);

      const favoriteAfterRemoval = await favoriteSeriesRepository.findOne(user.id, seriesTmdbId);

      expect(favoriteAfterRemoval).toBeNull();
    });

    it('throws ResourceNotFoundError when series is not in favorites', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await expect(removeFavoriteSeriesAction.execute(user.id, seriesTmdbId)).rejects.toThrow(ResourceNotFoundError);
    });
  });
});
