import { CryptoService } from '../../../../common/crypto/cryptoService.ts';
import type { EmailTemplate } from '../../../../common/emailService/emailTemplate.ts';
import { ResourceAlreadyExistsError } from '../../../../common/errors/resourceAlreadyExistsError.ts';
import { IdService } from '../../../../common/id/idService.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { Language } from '../../../../common/types/language.ts';
import type { Config } from '../../../../core/config.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import type { EmailRepository } from '../../domain/repositories/emailRepository.ts';
import type { OneTimeTokenRepository } from '../../domain/repositories/oneTimeTokenRepository.ts';
import type { UserRepository } from '../../domain/repositories/userRepository.ts';
import type { User } from '../../domain/types/user.ts';
import type { PasswordService } from '../services/passwordService.ts';

export interface CreateUserActionPayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly language: Language;
}

export class CreateUserAction {
  private readonly userRepository: UserRepository;
  private readonly loggerService: LoggerService;
  private readonly passwordService: PasswordService;
  private readonly config: Config;
  private readonly emailRepository: EmailRepository;
  private readonly oneTimeTokenRepository: OneTimeTokenRepository;
  private readonly databaseClient: DatabaseClient;

  public constructor(
    userRepository: UserRepository,
    loggerService: LoggerService,
    passwordService: PasswordService,
    config: Config,
    emailRepository: EmailRepository,
    oneTimeTokenRepository: OneTimeTokenRepository,
    databaseClient: DatabaseClient,
  ) {
    this.userRepository = userRepository;
    this.loggerService = loggerService;
    this.passwordService = passwordService;
    this.config = config;
    this.emailRepository = emailRepository;
    this.oneTimeTokenRepository = oneTimeTokenRepository;
    this.databaseClient = databaseClient;
  }

  public async execute(payload: CreateUserActionPayload, context: ExecutionContext): Promise<User> {
    const { name, email: emailInput, password, language } = payload;

    const email = emailInput.toLowerCase().trim();

    this.loggerService.debug({
      message: 'Creating user',
      event: 'user.create.start',
      requestId: context.requestId,
      email,
      language,
    });

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new ResourceAlreadyExistsError({
        resource: 'User',
        reason: 'User with this email already exists',
        email,
      });
    }

    this.passwordService.validatePassword(password);

    const hashedPassword = await this.passwordService.hashPassword(password);

    const user = await this.databaseClient.db.transaction(async (tx) => {
      const createdUser = await this.userRepository.create({
        email,
        password: hashedPassword,
        name,
        isEmailVerified: !this.config.emailVerification.enabled,
        language,
      });

      // Send verification email only if feature is enabled
      if (this.config.emailVerification.enabled) {
        const emailVerificationToken = IdService.generateNanoid();
        const tokenHash = CryptoService.hashData(emailVerificationToken);
        const expiresAt = new Date(Date.now() + this.config.token.accountVerification.expiresIn * 1000);

        await this.oneTimeTokenRepository.create(
          {
            userId: createdUser.id,
            tokenHash,
            purpose: 'email-verification',
            expiresAt,
          },
          tx,
        );

        const verificationLink = `${this.config.frontendUrl}/verify-email?token=${emailVerificationToken}`;

        const emailTemplate: EmailTemplate = {
          name: 'verifyAccount',
          language: createdUser.language,
          data: { verificationLink },
        };

        await this.emailRepository.create(
          {
            recipient: createdUser.email,
            templateName: emailTemplate.name,
            payload: JSON.stringify(emailTemplate.data),
            language: emailTemplate.language,
          },
          tx,
        );
      }

      return createdUser;
    });

    this.loggerService.info({
      message: 'User created successfully',
      event: 'user.create.success',
      requestId: context.requestId,
      userId: user.id,
      email: user.email,
    });

    return user;
  }
}
