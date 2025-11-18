import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import {
  users,
  watchrooms,
  watchroomParticipants,
  recommendationRequests,
} from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { WatchroomRepositoryImpl } from '../../../watchroom/infrastructure/repositories/watchroomRepositoryImpl.ts';
import { RecommendationRequestRepositoryImpl } from '../../infrastructure/repositories/recommendationRequestRepositoryImpl.ts';

import { CreateRecommendationRequestAction } from './createRecommendationRequestAction.ts';

describe('CreateRecommendationRequestAction', () => {
  let testContext: TestContext;
  let watchroomRepository: WatchroomRepositoryImpl;
  let recommendationRequestRepository: RecommendationRequestRepositoryImpl;
  let userRepository: UserRepositoryImpl;
  let createRecommendationRequestAction: CreateRecommendationRequestAction;
  const maxRecommendationsPerUser = 5;

  beforeEach(async () => {
    testContext = createTestContext();
    watchroomRepository = new WatchroomRepositoryImpl(testContext.databaseClient);
    recommendationRequestRepository = new RecommendationRequestRepositoryImpl(testContext.databaseClient);
    userRepository = new UserRepositoryImpl(testContext.databaseClient);

    createRecommendationRequestAction = new CreateRecommendationRequestAction(
      watchroomRepository,
      recommendationRequestRepository,
      testContext.loggerService,
      maxRecommendationsPerUser,
    );

    await testContext.databaseClient.db.delete(recommendationRequests);
    await testContext.databaseClient.db.delete(watchroomParticipants);
    await testContext.databaseClient.db.delete(watchrooms);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(recommendationRequests);
    await testContext.databaseClient.db.delete(watchroomParticipants);
    await testContext.databaseClient.db.delete(watchrooms);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('creates a recommendation request successfully', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const watchroomData = {
        name: Generator.words(3),
        description: Generator.sentences(2),
        ownerId: user.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      const result = await createRecommendationRequestAction.execute(
        {
          watchroomId: watchroom.id,
          userId: user.id,
        },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.recommendationRequestId).toBeDefined();
      expect(typeof result.recommendationRequestId).toBe('string');
    });

    it('creates recommendation request with pending status', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const watchroomData = {
        name: Generator.words(3),
        ownerId: user.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      const result = await createRecommendationRequestAction.execute(
        {
          watchroomId: watchroom.id,
          userId: user.id,
        },
        createTestExecutionContext(),
      );

      const createdRequest = await recommendationRequestRepository.findById(result.recommendationRequestId);
      expect(createdRequest).toBeDefined();
      expect(createdRequest?.status).toBe('pending');
      expect(createdRequest?.watchroomId).toBe(watchroom.id);
    });

    it('throws ResourceNotFoundError when watchroom does not exist', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const nonExistentWatchroomId = Generator.uuid();

      await expect(
        createRecommendationRequestAction.execute(
          {
            watchroomId: nonExistentWatchroomId,
            userId: user.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws ForbiddenAccessError when user is not the watchroom owner', async () => {
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
        createRecommendationRequestAction.execute(
          {
            watchroomId: watchroom.id,
            userId: otherUser.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ForbiddenAccessError);
    });

    it('allows owner to create multiple recommendation requests', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const watchroomData = {
        name: Generator.words(3),
        ownerId: user.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      const result1 = await createRecommendationRequestAction.execute(
        {
          watchroomId: watchroom.id,
          userId: user.id,
        },
        createTestExecutionContext(),
      );

      const result2 = await createRecommendationRequestAction.execute(
        {
          watchroomId: watchroom.id,
          userId: user.id,
        },
        createTestExecutionContext(),
      );

      expect(result1.recommendationRequestId).not.toBe(result2.recommendationRequestId);
    });

    it('throws OperationNotValidError when user reaches maximum recommendation limit', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      // Create watchrooms and recommendation requests up to the limit
      for (let i = 0; i < maxRecommendationsPerUser; i++) {
        const watchroomData = {
          name: Generator.words(3),
          ownerId: user.id,
          publicLinkId: Generator.alphaString(10),
        };
        const watchroom = await watchroomRepository.create(watchroomData);

        await recommendationRequestRepository.create({
          status: 'completed',
          userId: user.id,
          watchroomId: watchroom.id,
        });
      }

      // Attempt to create one more recommendation request
      const watchroomData = {
        name: Generator.words(3),
        ownerId: user.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      await expect(
        createRecommendationRequestAction.execute(
          {
            watchroomId: watchroom.id,
            userId: user.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(OperationNotValidError);
    });

    it('allows creating recommendation when under the limit', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      // Create fewer recommendations than the limit
      for (let i = 0; i < maxRecommendationsPerUser - 1; i++) {
        const watchroomData = {
          name: Generator.words(3),
          ownerId: user.id,
          publicLinkId: Generator.alphaString(10),
        };
        const watchroom = await watchroomRepository.create(watchroomData);

        await createRecommendationRequestAction.execute(
          {
            watchroomId: watchroom.id,
            userId: user.id,
          },
          createTestExecutionContext(),
        );
      }

      // Should still allow one more
      const watchroomData = {
        name: Generator.words(3),
        ownerId: user.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      const result = await createRecommendationRequestAction.execute(
        {
          watchroomId: watchroom.id,
          userId: user.id,
        },
        createTestExecutionContext(),
      );

      expect(result.recommendationRequestId).toBeDefined();
    });
  });
});
