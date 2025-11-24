import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import { users, userSeriesRatings } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { UserSeriesRatingRepositoryImpl } from '../../infrastructure/repositories/userSeriesRatingRepositoryImpl.ts';

import { RemoveSeriesRatingAction } from './removeSeriesRatingAction.ts';

describe('RemoveSeriesRatingAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let seriesRatingRepository: UserSeriesRatingRepositoryImpl;
  let removeSeriesRatingAction: RemoveSeriesRatingAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    seriesRatingRepository = new UserSeriesRatingRepositoryImpl(testContext.databaseClient);

    removeSeriesRatingAction = new RemoveSeriesRatingAction(seriesRatingRepository, testContext.loggerService);

    await testContext.databaseClient.db.delete(userSeriesRatings);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userSeriesRatings);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('removes a series rating successfully', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await seriesRatingRepository.create({ userId: user.id, seriesTmdbId, rating: 'like' });

      await removeSeriesRatingAction.execute({ userId: user.id, seriesTmdbId }, createTestExecutionContext());

      const ratingAfterRemoval = await seriesRatingRepository.findOne(user.id, seriesTmdbId);

      expect(ratingAfterRemoval).toBeNull();
    });

    it('throws ResourceNotFoundError when series rating does not exist', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await expect(
        removeSeriesRatingAction.execute({ userId: user.id, seriesTmdbId }, createTestExecutionContext()),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });
});
