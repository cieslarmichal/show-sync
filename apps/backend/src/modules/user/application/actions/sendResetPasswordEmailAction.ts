import { CryptoService } from '../../../../common/crypto/cryptoService.ts';
import type { EmailTemplate } from '../../../../common/emailService/emailTemplate.ts';
import { IdService } from '../../../../common/id/idService.ts';
import { type LoggerService } from '../../../../common/logger/loggerService.ts';
import { type Config } from '../../../../core/config.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import type { EmailRepository } from '../../domain/repositories/emailRepository.ts';
import type { OneTimeTokenRepository } from '../../domain/repositories/oneTimeTokenRepository.ts';
import { type UserRepository } from '../../domain/repositories/userRepository.ts';

export interface ExecutePayload {
  readonly email: string;
}

export class SendResetPasswordEmailAction {
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

  public async execute(payload: ExecutePayload): Promise<void> {
    const { email: emailInput } = payload;

    const email = emailInput.toLowerCase();

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      this.loggerService.debug({
        message: 'User not found.',
        event: 'password.reset.email.userNotFound',
        email,
      });

      return;
    }

    const resetPasswordToken = IdService.generateNanoid();
    const tokenHash = CryptoService.hashData(resetPasswordToken);
    const expiresAt = new Date(Date.now() + this.config.token.resetPassword.expiresIn * 1000);

    const resetLink = `${this.config.frontendUrl}/new-password?token=${resetPasswordToken}`;

    const emailTemplate: EmailTemplate = {
      name: 'resetPassword',
      data: { resetLink },
    };

    const startTime = Date.now();

    try {
      await this.databaseClient.db.transaction(
        async (tx) => {
          await this.oneTimeTokenRepository.create(
            {
              userId: user.id,
              tokenHash,
              purpose: 'reset-password',
              expiresAt,
            },
            tx,
          );

          await this.emailRepository.create(
            {
              recipient: user.email,
              templateName: emailTemplate.name,
              payload: JSON.stringify(emailTemplate.data),
            },
            tx,
          );
        },
        {
          isolationLevel: 'read committed',
        },
      );

      const duration = Date.now() - startTime;

      this.loggerService.info({
        message: 'Password reset email requested',
        event: 'password.reset.email.requested',
        userId: user.id,
        transactionDuration: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.loggerService.error({
        message: 'Failed to create password reset token and email',
        event: 'password.reset.email.transaction.failure',
        userId: user.id,
        transactionDuration: duration,
        err: error,
      });

      throw error;
    }
  }
}
