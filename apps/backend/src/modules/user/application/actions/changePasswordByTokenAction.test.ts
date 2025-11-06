import { eq } from 'drizzle-orm';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { CryptoService } from '../../../../common/crypto/cryptoService.ts';
import { InputNotValidError } from '../../../../common/errors/inputNotValidError.ts';
import { IdService } from '../../../../common/id/idService.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { oneTimeTokens, users } from '../../../../infrastructure/database/schema.ts';
import { OneTimeTokenRepositoryImpl } from '../../infrastructure/repositories/oneTimeTokenRepositoryImpl.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { ChangePasswordByTokenAction } from './changePasswordByTokenAction.ts';

describe('ChangePasswordByTokenAction', () => {
  let databaseClient: DatabaseClient;
  let userRepository: UserRepositoryImpl;
  let oneTimeTokenRepository: OneTimeTokenRepositoryImpl;
  let changePasswordByTokenAction: ChangePasswordByTokenAction;
  let loggerService: LoggerService;
  let passwordService: PasswordService;

  beforeEach(async () => {
    const config = createConfig();
    databaseClient = new DatabaseClient({ url: config.database.url });
    userRepository = new UserRepositoryImpl(databaseClient);
    oneTimeTokenRepository = new OneTimeTokenRepositoryImpl(databaseClient);
    passwordService = new PasswordService(config);

    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    changePasswordByTokenAction = new ChangePasswordByTokenAction(
      userRepository,
      loggerService,
      passwordService,
      oneTimeTokenRepository,
      databaseClient,
    );

    await databaseClient.db.delete(oneTimeTokens);
    await databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await databaseClient.db.delete(oneTimeTokens);
    await databaseClient.db.delete(users);
    await databaseClient.close();
  });

  describe('execute', () => {
    it('changes password successfully with valid token', async () => {
      const oldPassword = Generator.password();
      const newPassword = Generator.password();
      const userData = Generator.userData({ password: oldPassword });

      const hashedPassword = await passwordService.hashPassword(oldPassword);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      const token = IdService.generateNanoid();
      const tokenHash = CryptoService.hashData(token);
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      await oneTimeTokenRepository.create({
        userId: user.id,
        tokenHash,
        purpose: 'reset-password',
        expiresAt,
      });

      await changePasswordByTokenAction.execute({
        token,
        newPassword,
      });

      const updatedUser = await userRepository.findById(user.id);

      expect(updatedUser).toBeDefined();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      const isNewPasswordValid = await passwordService.comparePasswords(newPassword, updatedUser.password);
      expect(isNewPasswordValid).toBe(true);

      const isOldPasswordStillValid = await passwordService.comparePasswords(oldPassword, updatedUser.password);
      expect(isOldPasswordStillValid).toBe(false);
    });

    it('marks token as used after successful password change', async () => {
      const oldPassword = Generator.password();
      const newPassword = Generator.password();
      const userData = Generator.userData({ password: oldPassword });

      const hashedPassword = await passwordService.hashPassword(oldPassword);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      const token = IdService.generateNanoid();
      const tokenHash = CryptoService.hashData(token);
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      const createdToken = await oneTimeTokenRepository.create({
        userId: user.id,
        tokenHash,
        purpose: 'reset-password',
        expiresAt,
      });

      await changePasswordByTokenAction.execute({
        token,
        newPassword,
      });

      const usedToken = await oneTimeTokenRepository.findValidByHash(tokenHash, 'reset-password');

      expect(usedToken).toBeNull();

      const allTokens = await databaseClient.db
        .select()
        .from(oneTimeTokens)
        .where(eq(oneTimeTokens.id, createdToken.id));

      expect(allTokens[0]?.usedAt).not.toBeNull();
    });

    it('throws InputNotValidError when token does not exist', async () => {
      const nonExistentToken = IdService.generateNanoid();
      const newPassword = Generator.password();

      await expect(
        changePasswordByTokenAction.execute({
          token: nonExistentToken,
          newPassword,
        }),
      ).rejects.toThrow(InputNotValidError);
    });

    it('throws InputNotValidError when token is expired', async () => {
      const oldPassword = Generator.password();
      const newPassword = Generator.password();
      const userData = Generator.userData({ password: oldPassword });

      const hashedPassword = await passwordService.hashPassword(oldPassword);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      const token = IdService.generateNanoid();
      const tokenHash = CryptoService.hashData(token);
      const expiresAt = new Date(Date.now() - 1000);

      await oneTimeTokenRepository.create({
        userId: user.id,
        tokenHash,
        purpose: 'reset-password',
        expiresAt,
      });

      await expect(
        changePasswordByTokenAction.execute({
          token,
          newPassword,
        }),
      ).rejects.toThrow(InputNotValidError);
    });

    it('throws InputNotValidError when token has already been used', async () => {
      const oldPassword = Generator.password();
      const newPassword = Generator.password();
      const userData = Generator.userData({ password: oldPassword });

      const hashedPassword = await passwordService.hashPassword(oldPassword);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      const token = IdService.generateNanoid();
      const tokenHash = CryptoService.hashData(token);
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      const createdToken = await oneTimeTokenRepository.create({
        userId: user.id,
        tokenHash,
        purpose: 'reset-password',
        expiresAt,
      });

      await oneTimeTokenRepository.markUsed(createdToken.id);

      await expect(
        changePasswordByTokenAction.execute({
          token,
          newPassword,
        }),
      ).rejects.toThrow(InputNotValidError);
    });

    it('throws InputNotValidError when user does not exist (cascading token deletion)', async () => {
      const userData = Generator.userData();
      const hashedPassword = await passwordService.hashPassword(userData.password);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      const token = IdService.generateNanoid();
      const tokenHash = CryptoService.hashData(token);
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      await oneTimeTokenRepository.create({
        userId: user.id,
        tokenHash,
        purpose: 'reset-password',
        expiresAt,
      });

      await userRepository.delete(user.id);

      const newPassword = Generator.password();

      await expect(
        changePasswordByTokenAction.execute({
          token,
          newPassword,
        }),
      ).rejects.toThrow(InputNotValidError);
    });

    it('validates new password strength', async () => {
      const oldPassword = Generator.password();
      const userData = Generator.userData({ password: oldPassword });

      const hashedPassword = await passwordService.hashPassword(oldPassword);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      const token = IdService.generateNanoid();
      const tokenHash = CryptoService.hashData(token);
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      await oneTimeTokenRepository.create({
        userId: user.id,
        tokenHash,
        purpose: 'reset-password',
        expiresAt,
      });

      const weakPassword = 'weak';

      await expect(
        changePasswordByTokenAction.execute({
          token,
          newPassword: weakPassword,
        }),
      ).rejects.toThrow();
    });

    it('does not change password if transaction fails', async () => {
      const oldPassword = Generator.password();
      const newPassword = Generator.password();
      const userData = Generator.userData({ password: oldPassword });

      const hashedPassword = await passwordService.hashPassword(oldPassword);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      const token = IdService.generateNanoid();
      const tokenHash = CryptoService.hashData(token);
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      await oneTimeTokenRepository.create({
        userId: user.id,
        tokenHash,
        purpose: 'reset-password',
        expiresAt,
      });

      const invalidToken = IdService.generateNanoid();

      await expect(
        changePasswordByTokenAction.execute({
          token: invalidToken,
          newPassword,
        }),
      ).rejects.toThrow(InputNotValidError);

      const unchangedUser = await userRepository.findById(user.id);

      expect(unchangedUser).toBeDefined();

      if (!unchangedUser) {
        throw new Error('User not found');
      }

      const isOldPasswordValid = await passwordService.comparePasswords(oldPassword, unchangedUser.password);
      expect(isOldPasswordValid).toBe(true);
    });
  });
});
