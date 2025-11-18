import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import {
  recommendationFeedback,
  recommendationRequests,
  users,
  watchroomParticipants,
  watchrooms,
} from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { WatchroomRepositoryImpl } from '../../../watchroom/infrastructure/repositories/watchroomRepositoryImpl.ts';
import { RecommendationFeedbackRepositoryImpl } from '../../infrastructure/repositories/recommendationFeedbackRepositoryImpl.ts';
import { RecommendationRequestRepositoryImpl } from '../../infrastructure/repositories/recommendationRequestRepositoryImpl.ts';

import { SubmitRecommendationFeedbackAction } from './submitRecommendationFeedbackAction.ts';

describe('SubmitRecommendationFeedbackAction', () => {
  let testContext: TestContext;
  let watchroomRepository: WatchroomRepositoryImpl;
  let recommendationRequestRepository: RecommendationRequestRepositoryImpl;
  let recommendationFeedbackRepository: RecommendationFeedbackRepositoryImpl;
  let userRepository: UserRepositoryImpl;
  let submitRecommendationFeedbackAction: SubmitRecommendationFeedbackAction;

  beforeEach(async () => {
    testContext = createTestContext();
    watchroomRepository = new WatchroomRepositoryImpl(testContext.databaseClient);
    recommendationRequestRepository = new RecommendationRequestRepositoryImpl(testContext.databaseClient);
    recommendationFeedbackRepository = new RecommendationFeedbackRepositoryImpl(testContext.databaseClient);
    userRepository = new UserRepositoryImpl(testContext.databaseClient);

    submitRecommendationFeedbackAction = new SubmitRecommendationFeedbackAction(
      watchroomRepository,
      recommendationRequestRepository,
      recommendationFeedbackRepository,
      testContext.loggerService,
    );

    await testContext.databaseClient.db.delete(recommendationFeedback);
    await testContext.databaseClient.db.delete(recommendationRequests);
    await testContext.databaseClient.db.delete(watchroomParticipants);
    await testContext.databaseClient.db.delete(watchrooms);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(recommendationFeedback);
    await testContext.databaseClient.db.delete(recommendationRequests);
    await testContext.databaseClient.db.delete(watchroomParticipants);
    await testContext.databaseClient.db.delete(watchrooms);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('submits feedback successfully', async () => {
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

      const result = await submitRecommendationFeedbackAction.execute(
        {
          recommendationRequestId: recommendationRequest.id,
          watchroomId: watchroom.id,
          userId: participant.id,
          rating: 4,
          foundSomething: true,
          comment: 'Great recommendations!',
        },
        createTestExecutionContext(),
      );

      expect(result.id).toBeDefined();
      expect(result.recommendationRequestId).toBe(recommendationRequest.id);
      expect(result.userId).toBe(participant.id);
      expect(result.rating).toBe(4);
      expect(result.foundSomething).toBe(true);
      expect(result.comment).toBe('Great recommendations!');
    });

    it('submits feedback without optional comment', async () => {
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

      const result = await submitRecommendationFeedbackAction.execute(
        {
          recommendationRequestId: recommendationRequest.id,
          watchroomId: watchroom.id,
          userId: participant.id,
          rating: 3,
          foundSomething: false,
        },
        createTestExecutionContext(),
      );

      expect(result.id).toBeDefined();
      expect(result.rating).toBe(3);
      expect(result.foundSomething).toBe(false);
      expect(result.comment).toBeUndefined();
    });

    it('owner can submit feedback', async () => {
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

      const result = await submitRecommendationFeedbackAction.execute(
        {
          recommendationRequestId: recommendationRequest.id,
          watchroomId: watchroom.id,
          userId: owner.id,
          rating: 5,
          foundSomething: true,
        },
        createTestExecutionContext(),
      );

      expect(result.id).toBeDefined();
      expect(result.userId).toBe(owner.id);
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

      const recommendationRequest = await recommendationRequestRepository.create({
        userId: owner.id,
        watchroomId: watchroom.id,
        status: 'completed',
      });

      await expect(
        submitRecommendationFeedbackAction.execute(
          {
            recommendationRequestId: recommendationRequest.id,
            watchroomId: watchroom.id,
            userId: otherUser.id,
            rating: 4,
            foundSomething: true,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ForbiddenAccessError);
    });

    it('throws ResourceNotFoundError when recommendation request does not exist', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const watchroomData = {
        name: Generator.words(3),
        ownerId: owner.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      const nonExistentRequestId = Generator.uuid();

      await expect(
        submitRecommendationFeedbackAction.execute(
          {
            recommendationRequestId: nonExistentRequestId,
            watchroomId: watchroom.id,
            userId: owner.id,
            rating: 4,
            foundSomething: true,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws ResourceNotFoundError when recommendation request belongs to different watchroom', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const watchroom1Data = {
        name: Generator.words(3),
        ownerId: owner.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom1 = await watchroomRepository.create(watchroom1Data);

      const watchroom2Data = {
        name: Generator.words(3),
        ownerId: owner.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom2 = await watchroomRepository.create(watchroom2Data);

      const recommendationRequest = await recommendationRequestRepository.create({
        userId: owner.id,
        watchroomId: watchroom1.id,
        status: 'completed',
      });

      await expect(
        submitRecommendationFeedbackAction.execute(
          {
            recommendationRequestId: recommendationRequest.id,
            watchroomId: watchroom2.id,
            userId: owner.id,
            rating: 4,
            foundSomething: true,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws ResourceAlreadyExistsError when feedback already submitted', async () => {
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

      // Submit feedback first time
      await submitRecommendationFeedbackAction.execute(
        {
          recommendationRequestId: recommendationRequest.id,
          watchroomId: watchroom.id,
          userId: participant.id,
          rating: 4,
          foundSomething: true,
        },
        createTestExecutionContext(),
      );

      // Try to submit again
      await expect(
        submitRecommendationFeedbackAction.execute(
          {
            recommendationRequestId: recommendationRequest.id,
            watchroomId: watchroom.id,
            userId: participant.id,
            rating: 5,
            foundSomething: false,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceAlreadyExistsError);
    });
  });
});
