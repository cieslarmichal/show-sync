import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { users, watchrooms, watchroomParticipants } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { WatchroomRepositoryImpl } from '../../infrastructure/repositories/watchroomRepositoryImpl.ts';

import { CreateWatchroomAction } from './createWatchroomAction.ts';
import { JoinWatchroomAction } from './joinWatchroomAction.ts';
import { RemoveParticipantAction } from './removeParticipantAction.ts';

describe('RemoveParticipantAction', () => {
  let databaseClient: DatabaseClient;
  let watchroomRepository: WatchroomRepositoryImpl;
  let userRepository: UserRepositoryImpl;
  let createWatchroomAction: CreateWatchroomAction;
  let joinWatchroomAction: JoinWatchroomAction;
  let removeParticipantAction: RemoveParticipantAction;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const config = createConfig();
    databaseClient = new DatabaseClient(config.database);
    watchroomRepository = new WatchroomRepositoryImpl(databaseClient);
    userRepository = new UserRepositoryImpl(databaseClient);

    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    createWatchroomAction = new CreateWatchroomAction(watchroomRepository, loggerService);
    joinWatchroomAction = new JoinWatchroomAction(watchroomRepository, loggerService, databaseClient, config);
    removeParticipantAction = new RemoveParticipantAction(watchroomRepository, loggerService, databaseClient);

    await databaseClient.db.delete(watchroomParticipants);
    await databaseClient.db.delete(watchrooms);
    await databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await databaseClient.db.delete(watchroomParticipants);
    await databaseClient.db.delete(watchrooms);
    await databaseClient.db.delete(users);
    await databaseClient.close();
  });

  describe('execute', () => {
    it('removes a participant successfully', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const watchroom = await createWatchroomAction.execute(
        {
          name: Generator.words(3),
          description: Generator.sentences(2),
          ownerId: owner.id,
        },
        createTestExecutionContext(),
      );

      await joinWatchroomAction.execute(
        {
          publicLinkId: watchroom.publicLinkId,
          userId: participant.id,
        },
        createTestExecutionContext(),
      );

      await removeParticipantAction.execute(
        {
          watchroomId: watchroom.id,
          participantId: participant.id,
          requesterId: owner.id,
        },
        createTestExecutionContext(),
      );

      const isParticipant = await watchroomRepository.isParticipant(watchroom.id, participant.id);
      expect(isParticipant).toBe(false);
    });

    it('removes participant from watchroom participants list', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const watchroom = await createWatchroomAction.execute(
        {
          name: Generator.words(3),
          ownerId: owner.id,
        },
        createTestExecutionContext(),
      );

      await joinWatchroomAction.execute(
        {
          publicLinkId: watchroom.publicLinkId,
          userId: participant.id,
        },
        createTestExecutionContext(),
      );

      await removeParticipantAction.execute(
        {
          watchroomId: watchroom.id,
          participantId: participant.id,
          requesterId: owner.id,
        },
        createTestExecutionContext(),
      );

      const updatedWatchroom = await watchroomRepository.findOne({ id: watchroom.id });

      expect(updatedWatchroom).toBeDefined();
      if (!updatedWatchroom) {
        throw new Error('Watchroom not found');
      }
      expect(updatedWatchroom.participants).toHaveLength(1);
      expect(updatedWatchroom.participants[0]?.id).toBe(owner.id);
    });

    it('throws ResourceNotFoundError when watchroom does not exist', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const nonExistentWatchroomId = Generator.uuid();

      await expect(
        removeParticipantAction.execute(
          {
            watchroomId: nonExistentWatchroomId,
            participantId: participant.id,
            requesterId: owner.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws OperationNotValidError when requester is not the owner', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const participant1Data = Generator.userData();
      const participant1 = await userRepository.create(participant1Data);

      const participant2Data = Generator.userData();
      const participant2 = await userRepository.create(participant2Data);

      const watchroom = await createWatchroomAction.execute(
        {
          name: Generator.words(3),
          ownerId: owner.id,
        },
        createTestExecutionContext(),
      );

      await joinWatchroomAction.execute(
        {
          publicLinkId: watchroom.publicLinkId,
          userId: participant1.id,
        },
        createTestExecutionContext(),
      );

      await joinWatchroomAction.execute(
        {
          publicLinkId: watchroom.publicLinkId,
          userId: participant2.id,
        },
        createTestExecutionContext(),
      );

      await expect(
        removeParticipantAction.execute(
          {
            watchroomId: watchroom.id,
            participantId: participant2.id,
            requesterId: participant1.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(OperationNotValidError);
    });

    it('throws OperationNotValidError when trying to remove the owner', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const watchroom = await createWatchroomAction.execute(
        {
          name: Generator.words(3),
          ownerId: owner.id,
        },
        createTestExecutionContext(),
      );

      await expect(
        removeParticipantAction.execute(
          {
            watchroomId: watchroom.id,
            participantId: owner.id,
            requesterId: owner.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(OperationNotValidError);
    });

    it('throws ResourceNotFoundError when participant does not exist in watchroom', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const nonParticipantData = Generator.userData();
      const nonParticipant = await userRepository.create(nonParticipantData);

      const watchroom = await createWatchroomAction.execute(
        {
          name: Generator.words(3),
          ownerId: owner.id,
        },
        createTestExecutionContext(),
      );

      await expect(
        removeParticipantAction.execute(
          {
            watchroomId: watchroom.id,
            participantId: nonParticipant.id,
            requesterId: owner.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('allows owner to remove multiple participants sequentially', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const participant1Data = Generator.userData();
      const participant1 = await userRepository.create(participant1Data);

      const participant2Data = Generator.userData();
      const participant2 = await userRepository.create(participant2Data);

      const watchroom = await createWatchroomAction.execute(
        {
          name: Generator.words(3),
          ownerId: owner.id,
        },
        createTestExecutionContext(),
      );

      await joinWatchroomAction.execute(
        {
          publicLinkId: watchroom.publicLinkId,
          userId: participant1.id,
        },
        createTestExecutionContext(),
      );

      await joinWatchroomAction.execute(
        {
          publicLinkId: watchroom.publicLinkId,
          userId: participant2.id,
        },
        createTestExecutionContext(),
      );

      await removeParticipantAction.execute(
        {
          watchroomId: watchroom.id,
          participantId: participant1.id,
          requesterId: owner.id,
        },
        createTestExecutionContext(),
      );

      await removeParticipantAction.execute(
        {
          watchroomId: watchroom.id,
          participantId: participant2.id,
          requesterId: owner.id,
        },
        createTestExecutionContext(),
      );

      const updatedWatchroom = await watchroomRepository.findOne({ id: watchroom.id });

      expect(updatedWatchroom).toBeDefined();
      if (!updatedWatchroom) {
        throw new Error('Watchroom not found');
      }
      expect(updatedWatchroom.participants).toHaveLength(1);
      expect(updatedWatchroom.participants[0]?.id).toBe(owner.id);
    });
  });
});
