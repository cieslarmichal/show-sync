import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { DatabaseClient } from '../../../../infrastructure/database/database.ts';
import { users } from '../../../../infrastructure/database/schema.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { ChangePasswordAction } from './changePasswordAction.ts';

describe('ChangePasswordAction', () => {
  let database: DatabaseClient;
  let userRepository: UserRepositoryImpl;
  let changePasswordAction: ChangePasswordAction;
  let loggerService: LoggerService;
  let passwordService: PasswordService;

  beforeEach(async () => {
    const config = createConfig();
    database = new DatabaseClient({ url: config.database.url });
    userRepository = new UserRepositoryImpl(database);
    passwordService = new PasswordService(config);

    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    changePasswordAction = new ChangePasswordAction(userRepository, loggerService, passwordService);

    await database.db.delete(users);
  });

  afterEach(async () => {
    await database.db.delete(users);
    await database.close();
  });

  describe('execute', () => {
    it('changes password successfully', async () => {
      const oldPassword = Generator.password();
      const newPassword = Generator.password();
      const userData = Generator.userData({ password: oldPassword });

      const hashedPassword = await passwordService.hashPassword(oldPassword);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      await changePasswordAction.execute({
        userId: user.id,
        oldPassword,
        newPassword,
      });

      const updatedUser = await userRepository.findById(user.id);

      expect(updatedUser).toBeDefined();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      const isNewPasswordValid = await passwordService.comparePasswords(newPassword, updatedUser.password);

      expect(isNewPasswordValid).toBe(true);
    });

    it('throws ResourceNotFoundError when user does not exist', async () => {
      const nonExistentId = Generator.uuid();

      await expect(
        changePasswordAction.execute({
          userId: nonExistentId,
          oldPassword: Generator.password(),
          newPassword: Generator.password(),
        }),
      ).rejects.toThrow(ResourceNotFoundError);
    });

    it('throws OperationNotValidError when old password is incorrect', async () => {
      const oldPassword = Generator.password();
      const userData = Generator.userData({ password: oldPassword });

      const hashedPassword = await passwordService.hashPassword(oldPassword);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      await expect(
        changePasswordAction.execute({
          userId: user.id,
          oldPassword: Generator.password(),
          newPassword: Generator.password(),
        }),
      ).rejects.toThrow(OperationNotValidError);
    });
  });
});
