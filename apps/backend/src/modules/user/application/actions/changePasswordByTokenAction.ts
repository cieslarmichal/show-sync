import { CryptoService } from '../../../../common/crypto/cryptoService.ts';
import { InputNotValidError } from '../../../../common/errors/inputNotValidError.ts';
import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { type DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import type { OneTimeTokenRepository } from '../../domain/repositories/oneTimeTokenRepository.ts';
import type { UserRepository } from '../../domain/repositories/userRepository.ts';
import type { PasswordService } from '../services/passwordService.ts';

interface ChangePasswordByTokenData {
  readonly token: string;
  readonly newPassword: string;
}

export class ChangePasswordByTokenAction {
  private readonly userRepository: UserRepository;
  private readonly loggerService: LoggerService;
  private readonly passwordService: PasswordService;
  private readonly oneTimeTokenRepository: OneTimeTokenRepository;
  private readonly databaseClient: DatabaseClient;

  public constructor(
    userRepository: UserRepository,
    loggerService: LoggerService,
    passwordService: PasswordService,
    oneTimeTokenRepository: OneTimeTokenRepository,
    databaseClient: DatabaseClient,
  ) {
    this.userRepository = userRepository;
    this.loggerService = loggerService;
    this.passwordService = passwordService;
    this.oneTimeTokenRepository = oneTimeTokenRepository;
    this.databaseClient = databaseClient;
  }

  public async execute(changePasswordData: ChangePasswordByTokenData): Promise<void> {
    const { token, newPassword } = changePasswordData;

    const tokenHash = CryptoService.hashData(token);

    const startTime = Date.now();

    try {
      await this.databaseClient.db.transaction(
        async (tx) => {
          const oneTimeToken = await this.oneTimeTokenRepository.findValidByHash(tokenHash, 'reset-password', tx);

          if (!oneTimeToken) {
            throw new InputNotValidError({
              reason: 'Reset password token is invalid or has been used',
              value: token,
            });
          }

          this.loggerService.debug({
            message: 'Starting password change with token...',
            userId: oneTimeToken.userId,
          });

          const user = await this.userRepository.findById(oneTimeToken.userId, tx);

          if (!user) {
            throw new OperationNotValidError({
              reason: 'User not found',
              userId: oneTimeToken.userId,
            });
          }

          this.passwordService.validatePassword(newPassword);

          const hashedPassword = await this.passwordService.hashPassword(newPassword);

          await this.userRepository.updatePassword(user.id, hashedPassword, tx);

          await this.oneTimeTokenRepository.markUsed(oneTimeToken.id, tx);

          const duration = Date.now() - startTime;

          this.loggerService.info({
            message: 'Password changed successfully',
            event: 'password.change.success',
            userId: user.id,
            email: user.email,
            transactionDuration: duration,
          });
        },
        {
          isolationLevel: 'serializable',
        },
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      this.loggerService.error({
        message: 'Password change with token transaction failed',
        event: 'password.change.transaction.failure',
        transactionDuration: duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}
