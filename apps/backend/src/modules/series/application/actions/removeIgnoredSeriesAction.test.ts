import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { DatabaseClient } from '../../../../infrastructure/database/database.ts';
import { users, userIgnoredSeries } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { IgnoredSeriesRepositoryImpl } from '../../infrastructure/repositories/ignoredSeriesRepositoryImpl.ts';

import { RemoveIgnoredSeriesAction } from './removeIgnoredSeriesAction.ts';

describe('RemoveIgnoredSeriesAction', () => {
  let database: DatabaseClient;
  let userRepository: UserRepositoryImpl;
  let ignoredSeriesRepository: IgnoredSeriesRepositoryImpl;
  let loggerService: LoggerService;
  let removeIgnoredSeriesAction: RemoveIgnoredSeriesAction;

  beforeEach(async () => {
    const config = createConfig();
    database = new DatabaseClient({ url: config.database.url });
    userRepository = new UserRepositoryImpl(database);
    ignoredSeriesRepository = new IgnoredSeriesRepositoryImpl(database);
    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    removeIgnoredSeriesAction = new RemoveIgnoredSeriesAction(ignoredSeriesRepository, loggerService);

    await database.db.delete(userIgnoredSeries);
    await database.db.delete(users);
  });

  afterEach(async () => {
    await database.db.delete(userIgnoredSeries);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('removes a series from ignored list', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      await ignoredSeriesRepository.create({ userId: user.id, seriesTmdbId });

      await removeIgnoredSeriesAction.execute(user.id, seriesTmdbId);

      const ignored = await ignoredSeriesRepository.findOne(user.id, seriesTmdbId);

      expect(ignored).toBeNull();
    });

    it('throws ResourceNotFoundError when series is not in ignored list', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId = Generator.number(1, 10000);

      await expect(removeIgnoredSeriesAction.execute(user.id, seriesTmdbId)).rejects.toThrow(ResourceNotFoundError);
    });
  });
});
