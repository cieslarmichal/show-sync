import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestExecutionContext } from '../../../../../tests/helpers/executionContext.ts';
import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig, type Config } from '../../../../core/config.ts';
import { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { users, watchrooms, watchroomParticipants } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../../user/infrastructure/repositories/userRepositoryImpl.ts';
import { WatchroomRepositoryImpl } from '../../infrastructure/repositories/watchroomRepositoryImpl.ts';

import { CreateWatchroomAction } from './createWatchroomAction.ts';
import { JoinWatchroomAction } from './joinWatchroomAction.ts';

describe('JoinWatchroomAction', () => {
  let databaseClient: DatabaseClient;
  let watchroomRepository: WatchroomRepositoryImpl;
  let userRepository: UserRepositoryImpl;
  let createWatchroomAction: CreateWatchroomAction;
  let joinWatchroomAction: JoinWatchroomAction;
  let loggerService: LoggerService;
  let config: Config;

  beforeEach(async () => {
    config = createConfig();
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
    it('joins a watchroom successfully', async () => {
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

      const result = await joinWatchroomAction.execute(
        {
          publicLinkId: watchroom.publicLinkId,
          userId: participant.id,
        },
        createTestExecutionContext(),
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(watchroom.id);
      expect(result.name).toBe(watchroom.name);

      const isParticipant = await watchroomRepository.isParticipant(watchroom.id, participant.id);
      expect(isParticipant).toBe(true);
    });

    it('adds participant to watchroom participants list', async () => {
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

      const updatedWatchroom = await watchroomRepository.findOne({ id: watchroom.id });

      expect(updatedWatchroom).toBeDefined();
      if (!updatedWatchroom) {
        throw new Error('Watchroom not found');
      }
      expect(updatedWatchroom.participants).toHaveLength(2);
      expect(updatedWatchroom.participants.some((p) => p.id === participant.id)).toBe(true);
      expect(updatedWatchroom.participants.some((p) => p.id === owner.id)).toBe(true);
    });

    it('throws ResourceNotFoundError when watchroom does not exist', async () => {
      const participantData = Generator.userData();
      const participant = await userRepository.create(participantData);

      const nonExistentPublicLinkId = Generator.alphaString(10);

      await expect(
        joinWatchroomAction.execute(
          {
            publicLinkId: nonExistentPublicLinkId,
            userId: participant.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws ResourceAlreadyExistsError when user is already a participant', async () => {
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

      await expect(
        joinWatchroomAction.execute(
          {
            publicLinkId: watchroom.publicLinkId,
            userId: participant.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceAlreadyExistsError);
    });

    it('throws ResourceAlreadyExistsError when owner tries to join their own watchroom', async () => {
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
        joinWatchroomAction.execute(
          {
            publicLinkId: watchroom.publicLinkId,
            userId: owner.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(ResourceAlreadyExistsError);
    });

    it('throws OperationNotValidError when watchroom has reached maximum participants', async () => {
      const ownerData = Generator.userData();
      const owner = await userRepository.create(ownerData);

      const watchroom = await createWatchroomAction.execute(
        {
          name: Generator.words(3),
          ownerId: owner.id,
        },
        createTestExecutionContext(),
      );

      // Add participants up to the maximum (maxParticipants - 1 since owner is already a participant)
      for (let i = 0; i < config.watchroom.maxParticipants - 1; i++) {
        const participantData = Generator.userData();
        const participant = await userRepository.create(participantData);

        await joinWatchroomAction.execute(
          {
            publicLinkId: watchroom.publicLinkId,
            userId: participant.id,
          },
          createTestExecutionContext(),
        );
      }

      // Try to add one more participant beyond the limit
      const extraParticipantData = Generator.userData();
      const extraParticipant = await userRepository.create(extraParticipantData);

      await expect(
        joinWatchroomAction.execute(
          {
            publicLinkId: watchroom.publicLinkId,
            userId: extraParticipant.id,
          },
          createTestExecutionContext(),
        ),
      ).rejects.toThrow(OperationNotValidError);
    });
  });
});
