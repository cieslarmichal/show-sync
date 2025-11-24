import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import { users, userSeriesRatings } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { seriesRatings } from '../../domain/types/userSeriesRating.ts';
import { UserSeriesRatingRepositoryImpl } from '../../infrastructure/repositories/userSeriesRatingRepositoryImpl.ts';

import { UpdateSeriesRatingAction } from './updateSeriesRatingAction.ts';

describe('UpdateSeriesRatingAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let seriesRatingRepository: UserSeriesRatingRepositoryImpl;
  let updateSeriesRatingAction: UpdateSeriesRatingAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    seriesRatingRepository = new UserSeriesRatingRepositoryImpl(testContext.databaseClient);

    updateSeriesRatingAction = new UpdateSeriesRatingAction(seriesRatingRepository, testContext.loggerService);

    await testContext.databaseClient.db.delete(userSeriesRatings);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userSeriesRatings);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('updates rating from like to love successfully', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await seriesRatingRepository.create({
        userId: user.id,
        seriesTmdbId,
        rating: seriesRatings.like,
      });

      const result = await updateSeriesRatingAction.execute(
        {
          userId: user.id,
          seriesTmdbId,
          rating: seriesRatings.love,
        },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);
      expect(result.rating).toBe(seriesRatings.love);
    });

    it('updates rating from love to dislike successfully', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await seriesRatingRepository.create({
        userId: user.id,
        seriesTmdbId,
        rating: seriesRatings.love,
      });

      const result = await updateSeriesRatingAction.execute(
        {
          userId: user.id,
          seriesTmdbId,
          rating: seriesRatings.dislike,
        },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);
      expect(result.rating).toBe(seriesRatings.dislike);
    });

    it('throws ResourceNotFoundError when series rating does not exist', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await expect(
        updateSeriesRatingAction.execute(
          {
            userId: user.id,
            seriesTmdbId,
            rating: seriesRatings.love,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws ResourceNotFoundError when updating another user series rating', async () => {
      const userData1 = Generator.userData();
      const user1 = await userRepository.create(userData1);
      const userData2 = Generator.userData();
      const user2 = await userRepository.create(userData2);
      const seriesTmdbId = Generator.number(1, 10000);

      await seriesRatingRepository.create({
        userId: user1.id,
        seriesTmdbId,
        rating: seriesRatings.like,
      });

      await expect(
        updateSeriesRatingAction.execute(
          {
            userId: user2.id,
            seriesTmdbId,
            rating: seriesRatings.love,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('allows setting same rating (idempotent)', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await seriesRatingRepository.create({
        userId: user.id,
        seriesTmdbId,
        rating: seriesRatings.like,
      });

      const result = await updateSeriesRatingAction.execute(
        {
          userId: user.id,
          seriesTmdbId,
          rating: seriesRatings.like,
        },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.rating).toBe(seriesRatings.like);
    });
  });
});
