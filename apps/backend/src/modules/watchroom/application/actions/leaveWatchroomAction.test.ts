import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
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
  let database: DatabaseClient;
  let watchroomRepository: WatchroomRepositoryImpl;
  let userRepository: UserRepositoryImpl;
  let createWatchroomAction: CreateWatchroomAction;
  let joinWatchroomAction: JoinWatchroomAction;
  let leaveWatchroomAction: LeaveWatchroomAction;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const config = createConfig();
    database = new DatabaseClient({ url: config.database.url });
    watchroomRepository = new WatchroomRepositoryImpl(database);
    userRepository = new UserRepositoryImpl(database);

    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    createWatchroomAction = new CreateWatchroomAction(watchroomRepository, loggerService);
    joinWatchroomAction = new JoinWatchroomAction(watchroomRepository, loggerService);
    leaveWatchroomAction = new LeaveWatchroomAction(watchroomRepository, loggerService);

    await database.db.delete(watchroomParticipants);
    await database.db.delete(watchrooms);
    await database.db.delete(users);
  });

  afterEach(async () => {
    await database.db.delete(watchroomParticipants);
    await database.db.delete(watchrooms);
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('leaves a watchroom successfully', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const watchroom = await createWatchroomAction.execute({
        name: Generator.words(3),
        description: Generator.sentences(2),
        ownerId: owner.id,
      });

      await joinWatchroomAction.execute({
        publicLinkId: watchroom.publicLinkId,
        userId: participant.id,
      });

      await leaveWatchroomAction.execute({
        watchroomId: watchroom.id,
        userId: participant.id,
      });

      const isParticipant = await watchroomRepository.isParticipant(watchroom.id, participant.id);
      expect(isParticipant).toBe(false);
    });

    it('removes participant from watchroom participants list', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const watchroom = await createWatchroomAction.execute({
        name: Generator.words(3),
        ownerId: owner.id,
      });

      await joinWatchroomAction.execute({
        publicLinkId: watchroom.publicLinkId,
        userId: participant.id,
      });

      await leaveWatchroomAction.execute({
        watchroomId: watchroom.id,
        userId: participant.id,
      });

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
        leaveWatchroomAction.execute({
          watchroomId: nonExistentWatchroomId,
          userId: participant.id,
        }),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws OperationNotValidError when owner tries to leave watchroom', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const watchroom = await createWatchroomAction.execute({
        name: Generator.words(3),
        ownerId: owner.id,
      });

      await expect(
        leaveWatchroomAction.execute({
          watchroomId: watchroom.id,
          userId: owner.id,
        }),
      ).rejects.toThrow(OperationNotValidError);
    });

    it('throws ResourceNotFoundError when user is not a participant', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const nonParticipantData = Generator.userData();
      const nonParticipant = await userRepository.create(nonParticipantData);

      const watchroom = await createWatchroomAction.execute({
        name: Generator.words(3),
        ownerId: owner.id,
      });

      await expect(
        leaveWatchroomAction.execute({
          watchroomId: watchroom.id,
          userId: nonParticipant.id,
        }),
      ).rejects.toThrow(ResourceNotFoundError);
    });
  });
});
