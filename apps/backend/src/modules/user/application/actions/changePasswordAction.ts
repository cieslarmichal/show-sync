import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { UserRepository } from '../../domain/repositories/userRepository.ts';
import type { PasswordService } from '../services/passwordService.ts';

export interface ChangePasswordPayload {
  readonly userId: string;
  readonly oldPassword: string;
  readonly newPassword: string;
}

export class ChangePasswordAction {
  private readonly userRepository: UserRepository;
  private readonly loggerService: LoggerService;
  private readonly passwordService: PasswordService;

  public constructor(userRepository: UserRepository, loggerService: LoggerService, passwordService: PasswordService) {
    this.userRepository = userRepository;
    this.loggerService = loggerService;
    this.passwordService = passwordService;
  }

  public async execute(payload: ChangePasswordPayload, context: ExecutionContext): Promise<void> {
    const { userId, oldPassword, newPassword } = payload;

    this.loggerService.debug({
      message: 'Changing user password',
      event: 'user.password.change.start',
      requestId: context.requestId,
      userId,
    });

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new ResourceNotFoundError({
        resource: 'User',
      });
    }

    // Block password change for OAuth-only users (no password set)
    if (user.oauthProvider && !user.password) {
      throw new OperationNotValidError({
        reason: 'This account uses OAuth authentication and has no password.',
      });
    }

    if (!user.password) {
      throw new OperationNotValidError({
        reason: 'User has no password set.',
      });
    }

    const arePasswordsEqual = await this.passwordService.comparePasswords(oldPassword, user.password);

    if (!arePasswordsEqual) {
      throw new OperationNotValidError({
        reason: 'Invalid old password',
      });
    }

    this.passwordService.validatePassword(newPassword);

    const hashedPassword = await this.passwordService.hashPassword(newPassword);

    await this.userRepository.updatePassword(userId, hashedPassword);

    this.loggerService.info({
      message: 'User password changed successfully',
      event: 'user.password.change.success',
      requestId: context.requestId,
      userId,
    });
  }
}
