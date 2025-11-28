import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { Language } from '../../../../common/types/language.ts';
import type { UserRepository } from '../../domain/repositories/userRepository.ts';

export interface UpdateUserLanguageActionPayload {
  readonly userId: string;
  readonly language: Language;
}

export class UpdateUserLanguageAction {
  private readonly userRepository: UserRepository;
  private readonly loggerService: LoggerService;

  public constructor(userRepository: UserRepository, loggerService: LoggerService) {
    this.userRepository = userRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: UpdateUserLanguageActionPayload, context: ExecutionContext): Promise<void> {
    const { userId, language } = payload;

    this.loggerService.debug({
      message: 'Updating user language preference',
      event: 'user.language.update.start',
      requestId: context.requestId,
      userId,
      language,
    });

    await this.userRepository.update(userId, { language });

    this.loggerService.info({
      message: 'User language preference updated successfully',
      event: 'user.language.update.success',
      requestId: context.requestId,
      userId,
      language,
    });
  }
}
