import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import {
  recommendations,
  recommendationRequests,
  users,
  watchroomParticipants,
  watchrooms,
} from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { WatchroomRepositoryImpl } from '../../../watchroom/infrastructure/repositories/watchroomRepositoryImpl.ts';
import { RecommendationRepositoryImpl } from '../../infrastructure/repositories/recommendationRepositoryImpl.ts';
import { RecommendationRequestRepositoryImpl } from '../../infrastructure/repositories/recommendationRequestRepositoryImpl.ts';

import { FindRecommendationsAction } from './findRecommendationsAction.ts';

describe('FindRecommendationsAction', () => {
  let testContext: TestContext;
  let findRecommendationsAction: FindRecommendationsAction;
  let watchroomRepository: WatchroomRepositoryImpl;
  let recommendationRepository: RecommendationRepositoryImpl;
  let recommendationRequestRepository: RecommendationRequestRepositoryImpl;
  let userRepository: UserRepositoryImpl;

  beforeEach(async () => {
    testContext = createTestContext();
    watchroomRepository = new WatchroomRepositoryImpl(testContext.databaseClient);
    recommendationRepository = new RecommendationRepositoryImpl(testContext.databaseClient);
    recommendationRequestRepository = new RecommendationRequestRepositoryImpl(testContext.databaseClient);
    userRepository = new UserRepositoryImpl(testContext.databaseClient);

    findRecommendationsAction = new FindRecommendationsAction(
      watchroomRepository,
      recommendationRepository,
      recommendationRequestRepository,
    );

    await testContext.databaseClient.db.delete(recommendations);
    await testContext.databaseClient.db.delete(recommendationRequests);
    await testContext.databaseClient.db.delete(watchroomParticipants);
    await testContext.databaseClient.db.delete(watchrooms);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(recommendations);
    await testContext.databaseClient.db.delete(recommendationRequests);
    await testContext.databaseClient.db.delete(watchroomParticipants);
    await testContext.databaseClient.db.delete(watchrooms);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('returns recommendations for the latest recommendation request', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const watchroomData = {
        name: Generator.words(3),
        ownerId: owner.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      await watchroomRepository.addParticipant(watchroom.id, participant.id);

      const recommendationRequest = await recommendationRequestRepository.create({
        userId: owner.id,
        watchroomId: watchroom.id,
        status: 'completed',
      });

      // Create recommendations directly in the database within a transaction
      await testContext.databaseClient.db.transaction(async (tx) => {
        await recommendationRepository.create(
          [
            {
              recommendationRequestId: recommendationRequest.id,
              seriesTmdbId: 12345,
              justification: Generator.sentences(1),
            },
            {
              recommendationRequestId: recommendationRequest.id,
              seriesTmdbId: 67890,
              justification: Generator.sentences(1),
            },
          ],
          tx,
        );
      });

      const result = await findRecommendationsAction.execute({
        watchroomId: watchroom.id,
        userId: participant.id,
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toBeDefined();
      expect(result[0]?.seriesTmdbId).toBe(12345);
      expect(result[1]).toBeDefined();
      expect(result[1]?.seriesTmdbId).toBe(67890);
    });

    it('returns recommendations for owner when they query', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const watchroomData = {
        name: Generator.words(3),
        ownerId: owner.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      const recommendationRequest = await recommendationRequestRepository.create({
        userId: owner.id,
        watchroomId: watchroom.id,
        status: 'completed',
      });

      await testContext.databaseClient.db.transaction(async (tx) => {
        await recommendationRepository.create(
          [
            {
              recommendationRequestId: recommendationRequest.id,
              seriesTmdbId: 12345,
              justification: Generator.sentences(1),
            },
          ],
          tx,
        );
      });

      const result = await findRecommendationsAction.execute({
        watchroomId: watchroom.id,
        userId: owner.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
      expect(result[0]?.seriesTmdbId).toBe(12345);
    });

    it('returns empty array when there are no recommendation requests', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const watchroomData = {
        name: Generator.words(3),
        ownerId: owner.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      await watchroomRepository.addParticipant(watchroom.id, participant.id);

      const result = await findRecommendationsAction.execute({
        watchroomId: watchroom.id,
        userId: participant.id,
      });

      expect(result).toEqual([]);
    });

    it('returns recommendations only from the latest request when multiple exist', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const watchroomData = {
        name: Generator.words(3),
        ownerId: owner.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      await watchroomRepository.addParticipant(watchroom.id, participant.id);

      // First (older) request
      const oldRequest = await recommendationRequestRepository.create({
        userId: owner.id,
        watchroomId: watchroom.id,
        status: 'completed',
      });

      await testContext.databaseClient.db.transaction(async (tx) => {
        await recommendationRepository.create(
          [
            {
              recommendationRequestId: oldRequest.id,
              seriesTmdbId: 11111,
              justification: Generator.sentences(1),
            },
          ],
          tx,
        );
      });

      // Second (latest) request - create a small delay to ensure different createdAt
      await new Promise((resolve) => setTimeout(resolve, 10));

      const latestRequest = await recommendationRequestRepository.create({
        userId: owner.id,
        watchroomId: watchroom.id,
        status: 'completed',
      });

      await testContext.databaseClient.db.transaction(async (tx) => {
        await recommendationRepository.create(
          [
            {
              recommendationRequestId: latestRequest.id,
              seriesTmdbId: 22222,
              justification: Generator.sentences(1),
            },
          ],
          tx,
        );
      });

      const result = await findRecommendationsAction.execute({
        watchroomId: watchroom.id,
        userId: participant.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
      expect(result[0]?.seriesTmdbId).toBe(22222);
    });

    it('throws ResourceNotFoundError when watchroom does not exist', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const nonExistentWatchroomId = Generator.uuid();

      await expect(
        findRecommendationsAction.execute({
          watchroomId: nonExistentWatchroomId,
          userId: user.id,
        }),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws ForbiddenAccessError when user is not a participant', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const otherUserData = Generator.userData();
      const otherUser = await userRepository.create(otherUserData);

      const watchroomData = {
        name: Generator.words(3),
        ownerId: owner.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      await expect(
        findRecommendationsAction.execute({
          watchroomId: watchroom.id,
          userId: otherUser.id,
        }),
      ).rejects.toThrow(ForbiddenAccessError);
    });
  });
});
