import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
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

import { CheckRecommendationRequestStatusAction } from './checkRecommendationRequestStatusAction.ts';

describe('CheckRecommendationRequestStatusAction', () => {
  let testContext: TestContext;
  let watchroomRepository: WatchroomRepositoryImpl;
  let recommendationRequestRepository: RecommendationRequestRepositoryImpl;
  let userRepository: UserRepositoryImpl;
  let checkRecommendationRequestStatusAction: CheckRecommendationRequestStatusAction;

  beforeEach(async () => {
    testContext = createTestContext();
    watchroomRepository = new WatchroomRepositoryImpl(testContext.databaseClient);
    recommendationRequestRepository = new RecommendationRequestRepositoryImpl(testContext.databaseClient);
    userRepository = new UserRepositoryImpl(testContext.databaseClient);

    checkRecommendationRequestStatusAction = new CheckRecommendationRequestStatusAction(
      watchroomRepository,
      recommendationRequestRepository,
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
    it('returns pending status for a newly created recommendation request', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const watchroomData = {
        name: Generator.words(3),
        ownerId: user.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      const recommendationRequest = await recommendationRequestRepository.create({
        userId: user.id,
        watchroomId: watchroom.id,
        status: 'pending',
      });

      const result = await checkRecommendationRequestStatusAction.execute({
        recommendationRequestId: recommendationRequest.id,
        watchroomId: watchroom.id,
        userId: user.id,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('pending');
    });

    it('returns completed status for a completed recommendation request', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const watchroomData = {
        name: Generator.words(3),
        ownerId: user.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      const recommendationRequest = await recommendationRequestRepository.create({
        userId: user.id,
        watchroomId: watchroom.id,
        status: 'pending',
      });

      await recommendationRequestRepository.updateStatus(recommendationRequest.id, 'completed');

      const result = await checkRecommendationRequestStatusAction.execute({
        recommendationRequestId: recommendationRequest.id,
        watchroomId: watchroom.id,
        userId: user.id,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
    });

    it('returns failed status for a failed recommendation request', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const watchroomData = {
        name: Generator.words(3),
        ownerId: user.id,
        publicLinkId: Generator.alphaString(10),
      };
      const watchroom = await watchroomRepository.create(watchroomData);

      const recommendationRequest = await recommendationRequestRepository.create({
        userId: user.id,
        watchroomId: watchroom.id,
        status: 'pending',
      });

      await recommendationRequestRepository.updateStatus(recommendationRequest.id, 'failed');

      const result = await checkRecommendationRequestStatusAction.execute({
        recommendationRequestId: recommendationRequest.id,
        watchroomId: watchroom.id,
        userId: user.id,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('failed');
    });

    it('throws ResourceNotFoundError when watchroom does not exist', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const nonExistentWatchroomId = Generator.uuid();
      const fakeRequestId = Generator.uuid();

      await expect(
        checkRecommendationRequestStatusAction.execute({
          recommendationRequestId: fakeRequestId,
          watchroomId: nonExistentWatchroomId,
          userId: user.id,
        }),
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

      const recommendationRequest = await recommendationRequestRepository.create({
        userId: owner.id,
        watchroomId: watchroom.id,
        status: 'pending',
      });

      await expect(
        checkRecommendationRequestStatusAction.execute({
          recommendationRequestId: recommendationRequest.id,
          watchroomId: watchroom.id,
          userId: otherUser.id,
        }),
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
        checkRecommendationRequestStatusAction.execute({
          recommendationRequestId: nonExistentRequestId,
          watchroomId: watchroom.id,
          userId: owner.id,
        }),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws ForbiddenAccessError when recommendation request belongs to different watchroom', async () => {
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
        status: 'pending',
      });

      await expect(
        checkRecommendationRequestStatusAction.execute({
          recommendationRequestId: recommendationRequest.id,
          watchroomId: watchroom2.id,
          userId: owner.id,
        }),
      ).rejects.toThrow(ForbiddenAccessError);
    });
  });
});
