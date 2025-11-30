import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { users, userSeriesRatings, userSeriesWatchlist } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { UserSeriesRatingRepositoryImpl } from '../../infrastructure/repositories/userSeriesRatingRepositoryImpl.ts';

import { AddSeriesRatingAction } from './addSeriesRatingAction.ts';

describe('AddSeriesRatingAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let seriesRatingRepository: UserSeriesRatingRepositoryImpl;
  let addSeriesRatingAction: AddSeriesRatingAction;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    seriesRatingRepository = new UserSeriesRatingRepositoryImpl(testContext.databaseClient);

    addSeriesRatingAction = new AddSeriesRatingAction(
      seriesRatingRepository,
      testContext.databaseClient,
      testContext.loggerService,
    );

    await testContext.databaseClient.db.delete(userSeriesWatchlist);
    await testContext.databaseClient.db.delete(userSeriesRatings);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(userSeriesWatchlist);
    await testContext.databaseClient.db.delete(userSeriesRatings);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('adds a series rating successfully', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      const result = await addSeriesRatingAction.execute(
        { userId: user.id, seriesTmdbId, rating: 'like' },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);
      expect(result.rating).toBe('like');
    });

    it('throws ResourceAlreadyExistsError when series is already rated with same rating', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      await seriesRatingRepository.create({ userId: user.id, seriesTmdbId, rating: 'like' });

      await expect(
        addSeriesRatingAction.execute({ userId: user.id, seriesTmdbId, rating: 'like' }, createTestExecutionContext()),
      ).rejects.toThrow(ResourceAlreadyExistsError);
    });

    it('updates rating from like to love when series is already rated with different rating', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      const initialRating = await seriesRatingRepository.create({ userId: user.id, seriesTmdbId, rating: 'like' });

      const result = await addSeriesRatingAction.execute(
        { userId: user.id, seriesTmdbId, rating: 'love' },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(initialRating.id);
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);
      expect(result.rating).toBe('love');

      const updatedRating = await seriesRatingRepository.findOne(user.id, seriesTmdbId);
      expect(updatedRating).toBeDefined();
      expect(updatedRating?.rating).toBe('love');
      expect(updatedRating?.id).toBe(initialRating.id);
    });

    it('updates rating from love to dislike when series is already rated with different rating', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      const initialRating = await seriesRatingRepository.create({ userId: user.id, seriesTmdbId, rating: 'love' });

      const result = await addSeriesRatingAction.execute(
        { userId: user.id, seriesTmdbId, rating: 'dislike' },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(initialRating.id);
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);
      expect(result.rating).toBe('dislike');

      const updatedRating = await seriesRatingRepository.findOne(user.id, seriesTmdbId);
      expect(updatedRating).toBeDefined();
      expect(updatedRating?.rating).toBe('dislike');
      expect(updatedRating?.id).toBe(initialRating.id);
    });

    it('updates rating from dislike to like when series is already rated with different rating', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);
      const seriesTmdbId = Generator.number(1, 10000);

      const initialRating = await seriesRatingRepository.create({ userId: user.id, seriesTmdbId, rating: 'dislike' });

      const result = await addSeriesRatingAction.execute(
        { userId: user.id, seriesTmdbId, rating: 'like' },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(initialRating.id);
      expect(result.userId).toBe(user.id);
      expect(result.seriesTmdbId).toBe(seriesTmdbId);
      expect(result.rating).toBe('like');

      const updatedRating = await seriesRatingRepository.findOne(user.id, seriesTmdbId);
      expect(updatedRating).toBeDefined();
      expect(updatedRating?.rating).toBe('like');
      expect(updatedRating?.id).toBe(initialRating.id);
    });
  });
});
