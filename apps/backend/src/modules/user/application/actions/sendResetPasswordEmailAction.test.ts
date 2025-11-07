import { eq } from 'drizzle-orm';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { CryptoService } from '../../../../common/crypto/cryptoService.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { createConfig } from '../../../../core/config.ts';
import { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import { emails, oneTimeTokens, users } from '../../../../infrastructure/database/schema.ts';
import { EmailRepositoryImpl } from '../../infrastructure/repositories/emailRepositoryImpl.ts';
import { OneTimeTokenRepositoryImpl } from '../../infrastructure/repositories/oneTimeTokenRepositoryImpl.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { PasswordService } from '../services/passwordService.ts';

import { SendResetPasswordEmailAction } from './sendResetPasswordEmailAction.ts';

describe('SendResetPasswordEmailAction', () => {
  let databaseClient: DatabaseClient;
  let userRepository: UserRepositoryImpl;
  let emailRepository: EmailRepositoryImpl;
  let oneTimeTokenRepository: OneTimeTokenRepositoryImpl;
  let sendResetPasswordEmailAction: SendResetPasswordEmailAction;
  let loggerService: LoggerService;
  let passwordService: PasswordService;

  beforeEach(async () => {
    const config = createConfig();
    databaseClient = new DatabaseClient({ url: config.database.url });
    userRepository = new UserRepositoryImpl(databaseClient);
    emailRepository = new EmailRepositoryImpl(databaseClient);
    oneTimeTokenRepository = new OneTimeTokenRepositoryImpl(databaseClient);
    passwordService = new PasswordService(config);

    loggerService = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    } as unknown as LoggerService;

    sendResetPasswordEmailAction = new SendResetPasswordEmailAction(
      userRepository,
      loggerService,
      config,
      emailRepository,
      oneTimeTokenRepository,
      databaseClient,
    );

    await databaseClient.db.delete(emails);
    await databaseClient.db.delete(oneTimeTokens);
    await databaseClient.db.delete(users);
  });

  afterEach(async () => {
    await databaseClient.db.delete(emails);
    await databaseClient.db.delete(oneTimeTokens);
    await databaseClient.db.delete(users);
    await databaseClient.close();
  });

  describe('execute', () => {
    it('sends reset password email successfully for existing user', async () => {
      const userData = Generator.userData();
      const hashedPassword = await passwordService.hashPassword(userData.password);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      await sendResetPasswordEmailAction.execute({ email: user.email });

      const createdEmail = await emailRepository.findEmail({
        recipient: user.email,
        templateName: 'resetPassword',
      });

      expect(createdEmail).toBeDefined();
      expect(createdEmail?.recipient).toBe(user.email);
      expect(createdEmail?.templateName).toBe('resetPassword');
      expect(createdEmail?.status).toBe('pending');

      const payload = JSON.parse(createdEmail?.payload ?? '{}') as { resetLink: string };
      expect(payload.resetLink).toBeDefined();
      expect(payload.resetLink).toContain('/new-password?token=');

      const tokenRecords = await databaseClient.db
        .select()
        .from(oneTimeTokens)
        .where(eq(oneTimeTokens.userId, user.id));

      expect(tokenRecords).toHaveLength(1);
      expect(tokenRecords[0]?.purpose).toBe('reset-password');
      expect(tokenRecords[0]?.usedAt).toBeNull();
      expect(tokenRecords[0]?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('handles case insensitive email addresses', async () => {
      const userData = Generator.userData({ email: 'Test.User@Example.COM' });
      const hashedPassword = await passwordService.hashPassword(userData.password);
      await userRepository.create({ ...userData, password: hashedPassword });

      await sendResetPasswordEmailAction.execute({ email: 'test.user@example.com' });

      const createdEmail = await emailRepository.findEmail({
        recipient: 'test.user@example.com',
        templateName: 'resetPassword',
      });

      expect(createdEmail).toBeDefined();
    });

    it('does not throw error when user does not exist', async () => {
      const nonExistentEmail = Generator.email();

      await expect(sendResetPasswordEmailAction.execute({ email: nonExistentEmail })).resolves.not.toThrow();

      const createdEmail = await emailRepository.findEmail({
        recipient: nonExistentEmail,
        templateName: 'resetPassword',
      });

      expect(createdEmail).toBeNull();
    });

    it('creates token with correct expiration time', async () => {
      const config = createConfig();
      const userData = Generator.userData();
      const hashedPassword = await passwordService.hashPassword(userData.password);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      const beforeExecution = Date.now();
      await sendResetPasswordEmailAction.execute({ email: user.email });
      const afterExecution = Date.now();

      const tokenRecords = await databaseClient.db
        .select()
        .from(oneTimeTokens)
        .where(eq(oneTimeTokens.userId, user.id));

      expect(tokenRecords).toHaveLength(1);

      const expectedMinExpiration = beforeExecution + config.token.resetPassword.expiresIn * 1000;
      const expectedMaxExpiration = afterExecution + config.token.resetPassword.expiresIn * 1000;

      expect(tokenRecords[0]?.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiration);
      expect(tokenRecords[0]?.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiration);
    });

    it('stores hashed token in database', async () => {
      const userData = Generator.userData();
      const hashedPassword = await passwordService.hashPassword(userData.password);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      await sendResetPasswordEmailAction.execute({ email: user.email });

      const createdEmail = await emailRepository.findEmail({
        recipient: user.email,
        templateName: 'resetPassword',
      });

      const payload = JSON.parse(createdEmail?.payload ?? '{}') as { resetLink: string };
      const resetLink = payload.resetLink;
      const token = new URL(resetLink).searchParams.get('token');

      expect(token).toBeDefined();

      if (!token) {
        throw new Error('Token not found in reset link');
      }

      const tokenHash = CryptoService.hashData(token);

      const tokenRecords = await databaseClient.db
        .select()
        .from(oneTimeTokens)
        .where(eq(oneTimeTokens.userId, user.id));

      expect(tokenRecords[0]?.tokenHash).toBe(tokenHash);
    });

    it('creates multiple tokens for multiple reset requests', async () => {
      const userData = Generator.userData();
      const hashedPassword = await passwordService.hashPassword(userData.password);
      const user = await userRepository.create({ ...userData, password: hashedPassword });

      await sendResetPasswordEmailAction.execute({ email: user.email });
      await sendResetPasswordEmailAction.execute({ email: user.email });

      const tokenRecords = await databaseClient.db
        .select()
        .from(oneTimeTokens)
        .where(eq(oneTimeTokens.userId, user.id));

      expect(tokenRecords).toHaveLength(2);
    });
  });
});
