import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { users, watchrooms, watchroomParticipants } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { WatchroomRepositoryImpl } from '../../infrastructure/repositories/watchroomRepositoryImpl.ts';

import { CreateWatchroomAction } from './createWatchroomAction.ts';

describe('CreateWatchroomAction', () => {
  let testContext: TestContext;
  let watchroomRepository: WatchroomRepositoryImpl;
  let userRepository: UserRepositoryImpl;
  let createWatchroomAction: CreateWatchroomAction;

  beforeEach(async () => {
    testContext = createTestContext();
    watchroomRepository = new WatchroomRepositoryImpl(testContext.databaseClient);
    userRepository = new UserRepositoryImpl(testContext.databaseClient);

    createWatchroomAction = new CreateWatchroomAction(watchroomRepository, testContext.loggerService);

    await testContext.databaseClient.db.delete(watchroomParticipants);
    await testContext.databaseClient.db.delete(watchrooms);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(watchroomParticipants);
    await testContext.databaseClient.db.delete(watchrooms);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('creates a new watchroom successfully', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const watchroomData = {
        name: Generator.words(3),
        description: Generator.sentences(2),
        ownerId: user.id,
      };

      const result = await createWatchroomAction.execute(watchroomData, createTestExecutionContext());

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(watchroomData.name);
      expect(result.description).toBe(watchroomData.description);
      expect(result.ownerId).toBe(user.id);
      expect(result.ownerName).toBe(user.name);
      expect(result.publicLinkId).toBeDefined();
      expect(result.publicLinkId).toHaveLength(10);
      expect(result.createdAt).toBeDefined();
      expect(result.participants).toHaveLength(1);
      expect(result.participants[0]?.id).toBe(user.id);
      expect(result.participants[0]?.name).toBe(user.name);
    });

    it('creates a watchroom without description', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const watchroomData = {
        name: Generator.words(3),
        ownerId: user.id,
      };

      const result = await createWatchroomAction.execute(watchroomData, createTestExecutionContext());

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(watchroomData.name);
      expect(result.description).toBeUndefined();
      expect(result.ownerId).toBe(user.id);
      expect(result.ownerName).toBe(user.name);
      expect(result.publicLinkId).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.participants).toHaveLength(1);
    });

    it('automatically adds owner as participant', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const watchroomData = {
        name: Generator.words(3),
        description: Generator.sentences(2),
        ownerId: user.id,
      };

      const result = await createWatchroomAction.execute(watchroomData, createTestExecutionContext());

      const isParticipant = await watchroomRepository.isParticipant(result.id, user.id);
      expect(isParticipant).toBe(true);
    });

    it('generates unique publicLinkId for each watchroom', async () => {
      const userData = Generator.userData();
      const user = await userRepository.create(userData);

      const watchroomData1 = {
        name: Generator.words(3),
        ownerId: user.id,
      };

      const watchroomData2 = {
        name: Generator.words(3),
        ownerId: user.id,
      };

      const result1 = await createWatchroomAction.execute(watchroomData1, createTestExecutionContext());
      const result2 = await createWatchroomAction.execute(watchroomData2, createTestExecutionContext());

      expect(result1.publicLinkId).not.toBe(result2.publicLinkId);
      expect(result1.publicLinkId).toHaveLength(10);
      expect(result2.publicLinkId).toHaveLength(10);
    });
  });
});
