import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { users, userSeriesRatings } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { UserSeriesRatingRepositoryImpl } from '../../infrastructure/repositories/userSeriesRatingRepositoryImpl.ts';

import { GetSeriesRatingsAction } from './getSeriesRatingsAction.ts';

describe('GetSeriesRatingsAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let seriesRatingRepository: UserSeriesRatingRepositoryImpl;
  let getSeriesRatingsAction: GetSeriesRatingsAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    seriesRatingRepository = new UserSeriesRatingRepositoryImpl(testContext.databaseClient);

    getSeriesRatingsAction = new GetSeriesRatingsAction(seriesRatingRepository);

    await testContext.databaseClient.db.delete(userSeriesRatings);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userSeriesRatings);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('returns user series ratings with pagination', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const seriesTmdbId1 = Generator.number(1, 10000);
      const seriesTmdbId2 = Generator.number(10001, 20000);

      await seriesRatingRepository.create({ userId: user.id, seriesTmdbId: seriesTmdbId1, rating: 'like' });
      await seriesRatingRepository.create({ userId: user.id, seriesTmdbId: seriesTmdbId2, rating: 'love' });

      const result = await getSeriesRatingsAction.execute({
        userId: user.id,
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0]?.userId).toBe(user.id);
    });

    it('returns empty array when user has no series ratings', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const result = await getSeriesRatingsAction.execute({
        userId: user.id,
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
