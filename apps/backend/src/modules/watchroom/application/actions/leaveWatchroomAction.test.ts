import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { DatabaseClient } from '../../../../infrastructure/database/database.ts';
import { users, watchrooms, watchroomParticipants } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { WatchroomRepositoryImpl } from '../../infrastructure/repositories/watchroomRepositoryImpl.ts';

import { CreateWatchroomAction } from './createWatchroomAction.ts';
import { JoinWatchroomAction } from './joinWatchroomAction.ts';
import { LeaveWatchroomAction } from './leaveWatchroomAction.ts';

describe('LeaveWatchroomAction', () => {
  let databaseClient: DatabaseClient;
  let watchroomRepository: WatchroomRepositoryImpl;
  let userRepository: UserRepositoryImpl;
  let createWatchroomAction: CreateWatchroomAction;
  let joinWatchroomAction: JoinWatchroomAction;
  let leaveWatchroomAction: LeaveWatchroomAction;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const config = createConfig();
    databaseClient = new DatabaseClient({ url: config.database.url });
    watchroomRepository = new WatchroomRepositoryImpl(databaseClient);
    userRepository = new UserRepositoryImpl(databaseClient);

    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    createWatchroomAction = new CreateWatchroomAction(watchroomRepository, loggerService);
    joinWatchroomAction = new JoinWatchroomAction(watchroomRepository, loggerService);
    leaveWatchroomAction = new LeaveWatchroomAction(watchroomRepository, loggerService);

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
    it('leaves a watchroom successfully', async () => {
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

      await leaveWatchroomAction.execute(
        {
          watchroomId: watchroom.id,
          userId: participant.id,
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

      await leaveWatchroomAction.execute(
        {
          watchroomId: watchroom.id,
          userId: participant.id,
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
      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const nonExistentWatchroomId = Generator.uuid();

      await expect(
        leaveWatchroomAction.execute(
          {
            watchroomId: nonExistentWatchroomId,
            userId: participant.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws OperationNotValidError when owner tries to leave watchroom', async () => {
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
        leaveWatchroomAction.execute(
          {
            watchroomId: watchroom.id,
            userId: owner.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(OperationNotValidError);
    });

    it('throws ResourceNotFoundError when user is not a participant', async () => {
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
        leaveWatchroomAction.execute(
          {
            watchroomId: watchroom.id,
            userId: nonParticipant.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });
});
