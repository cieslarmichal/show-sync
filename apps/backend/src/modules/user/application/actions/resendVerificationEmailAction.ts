import { CryptoService } from '../../../../common/crypto/cryptoService.ts';
import type { EmailTemplate } from '../../../../common/emailService/emailTemplate.ts';
import { IdService } from '../../../../common/id/idService.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { Config } from '../../../../core/config.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import type { EmailRepository } from '../../domain/repositories/emailRepository.ts';
import type { OneTimeTokenRepository } from '../../domain/repositories/oneTimeTokenRepository.ts';
import type { UserRepository } from '../../domain/repositories/userRepository.ts';

export interface ResendVerificationEmailActionPayload {
  readonly email: string;
}

export class ResendVerificationEmailAction {
  private readonly userRepository: UserRepository;
  private readonly loggerService: LoggerService;
  private readonly config: Config;
  private readonly emailRepository: EmailRepository;
  private readonly oneTimeTokenRepository: OneTimeTokenRepository;
  private readonly databaseClient: DatabaseClient;

  public constructor(
    userRepository: UserRepository,
    loggerService: LoggerService,
    config: Config,
    emailRepository: EmailRepository,
    oneTimeTokenRepository: OneTimeTokenRepository,
    databaseClient: DatabaseClient,
  ) {
    this.userRepository = userRepository;
    this.loggerService = loggerService;
    this.config = config;
    this.emailRepository = emailRepository;
    this.oneTimeTokenRepository = oneTimeTokenRepository;
    this.databaseClient = databaseClient;
  }

  public async execute(payload: ResendVerificationEmailActionPayload, context: ExecutionContext): Promise<void> {
    const { email: emailInput } = payload;

    const { requestId } = context;

    this.loggerService.debug({
      message: 'Resending verification email',
      event: 'user.resendVerificationEmail.start',
      email: emailInput,
      requestId,
    });

    const email = emailInput.toLowerCase().trim();

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      this.loggerService.debug({
        message: 'User not found',
        event: 'user.resendVerificationEmail.userNotFound',
        email,
        requestId,
      });

      return;
    }

    if (user.isEmailVerified) {
      this.loggerService.debug({
        message: 'User email already verified',
        event: 'user.resendVerificationEmail.alreadyVerified',
        userId: user.id,
        email: user.email,
        requestId,
      });

      return;
    }

    const emailVerificationToken = IdService.generateNanoid();

    const tokenHash = CryptoService.hashData(emailVerificationToken);
    const expiresAt = new Date(Date.now() + this.config.token.accountVerification.expiresIn * 1000);

    await this.databaseClient.db.transaction(async (tx) => {
      await this.oneTimeTokenRepository.create(
        {
          userId: user.id,
          tokenHash,
          purpose: 'email-verification',
          expiresAt,
        },
        tx,
      );

      const verificationLink = `${this.config.frontendUrl}/verify-email?token=${emailVerificationToken}`;

      const emailTemplate: EmailTemplate = {
        name: 'verifyAccount',
        language: user.language,
        data: { verificationLink },
      };

      await this.emailRepository.create(
        {
          recipient: user.email,
          templateName: emailTemplate.name,
          payload: JSON.stringify(emailTemplate.data),
          language: emailTemplate.language,
        },
        tx,
      );

      this.loggerService.info({
        message: 'Account verification email requested',
        event: 'user.resendVerificationEmail.success',
        userId: user.id,
        email: user.email,
        requestId,
      });
    });
  }
}
