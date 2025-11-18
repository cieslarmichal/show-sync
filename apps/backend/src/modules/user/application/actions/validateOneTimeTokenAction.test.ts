import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { createTestContext, type TestContext } from '../../../../../tests/helpers/testContext.ts';
import { CryptoService } from '../../../../common/crypto/cryptoService.ts';
import { IdService } from '../../../../common/id/idService.ts';
import { oneTimeTokens, users } from '../../../../infrastructure/database/schema.ts';
import { OneTimeTokenRepositoryImpl } from '../../infrastructure/repositories/oneTimeTokenRepositoryImpl.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { ValidateOneTimeTokenAction } from './validateOneTimeTokenAction.ts';

describe('ValidateOneTimeTokenAction', () => {
  let testContext: TestContext;
  let userRepository: UserRepositoryImpl;
  let oneTimeTokenRepository: OneTimeTokenRepositoryImpl;
  let validateOneTimeTokenAction: ValidateOneTimeTokenAction;
  let passwordService: PasswordService;

  beforeEach(async () => {
    testContext = createTestContext();
    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    oneTimeTokenRepository = new OneTimeTokenRepositoryImpl(testContext.databaseClient);
    passwordService = new PasswordService(testContext.config);

    validateOneTimeTokenAction = new ValidateOneTimeTokenAction(
      userRepository,
      testContext.loggerService,
      oneTimeTokenRepository,
    );

    await testContext.databaseClient.db.delete(oneTimeTokens);
    await testContext.databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await testContext.databaseClient.db.delete(oneTimeTokens);
    await testContext.databaseClient.db.delete(users);
    await testContext.databaseClient.close();
  });

  describe('execute', () => {
    it('validates a valid reset-password token successfully', async () => {
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

      const result = await validateOneTimeTokenAction.execute({
        token,
        purpose: 'reset-password',
      });

      expect(result).toBe(true);
    });

    it('returns false for non-existent token', async () => {
      const nonExistentToken = IdService.generateNanoid();

      const result = await validateOneTimeTokenAction.execute({
        token: nonExistentToken,
        purpose: 'reset-password',
      });

      expect(result).toBe(false);
    });

    it('returns false for expired token', async () => {
      const userData = Generator.userData();
      const hashedPassword = await passwordService.hashPassword(userData.password);
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

      const result = await validateOneTimeTokenAction.execute({
        token,
        purpose: 'reset-password',
      });

      expect(result).toBe(false);
    });

    it('returns false for already used token', async () => {
      const userData = Generator.userData();
      const hashedPassword = await passwordService.hashPassword(userData.password);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      const token = IdService.generateNanoid();
      const tokenHash = CryptoService.hashData(token);
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      const oneTimeToken = await oneTimeTokenRepository.create({
        userId: user.id,
        tokenHash,
        purpose: 'reset-password',
        expiresAt,
      });

      await oneTimeTokenRepository.markUsed(oneTimeToken.id);

      const result = await validateOneTimeTokenAction.execute({
        token,
        purpose: 'reset-password',
      });

      expect(result).toBe(false);
    });

    it('returns false when token purpose does not match', async () => {
      const userData = Generator.userData();
      const hashedPassword = await passwordService.hashPassword(userData.password);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      const token = IdService.generateNanoid();
      const tokenHash = CryptoService.hashData(token);
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      await oneTimeTokenRepository.create({
        userId: user.id,
        tokenHash,
        purpose: 'email-verification',
        expiresAt,
      });

      const result = await validateOneTimeTokenAction.execute({
        token,
        purpose: 'reset-password',
      });

      expect(result).toBe(false);
    });

    it('returns false when user associated with token does not exist', async () => {
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

      const result = await validateOneTimeTokenAction.execute({
        token,
        purpose: 'reset-password',
      });

      expect(result).toBe(false);
    });

    it('returns false on database error', async () => {
      const token = IdService.generateNanoid();
      const originalDb = testContext.databaseClient.db;

      try {
        Object.defineProperty(testContext.databaseClient, 'db', {
          get: () => {
            throw new Error('Database connection error');
          },
          configurable: true,
        });

        const result = await validateOneTimeTokenAction.execute({
          token,
          purpose: 'reset-password',
        });

        expect(result).toBe(false);
      } finally {
        Object.defineProperty(testContext.databaseClient, 'db', {
          value: originalDb,
          configurable: true,
          writable: true,
        });
      }
    });
  });
});
