import type { TokenService } from '../../../../common/auth/tokenService.ts';
import { CryptoService } from '../../../../common/crypto/cryptoService.ts';
import { IdService } from '../../../../common/id/idService.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import { GoogleAuthService } from '../../../../common/oauth/googleAuthService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { Language } from '../../../../common/types/language.ts';
import type { Config } from '../../../../core/config.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import type { UserRepository } from '../../domain/repositories/userRepository.ts';
import type { UserSessionRepository } from '../../domain/repositories/userSessionRepository.ts';
import type { User } from '../../domain/types/user.ts';

interface LoginWithOAuthData {
  readonly provider: 'google';
  readonly code: string;
  readonly language?: 'en' | 'pl';
}

interface LoginWithOAuthResult {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export class LoginWithOAuthAction {
  private readonly userRepository: UserRepository;
  private readonly loggerService: LoggerService;
  private readonly tokenService: TokenService;
  private readonly databaseClient: DatabaseClient;
  private readonly googleAuthService: GoogleAuthService;
  private readonly userSessionRepository: UserSessionRepository;

  public constructor(
    userRepository: UserRepository,
    loggerService: LoggerService,
    tokenService: TokenService,
    databaseClient: DatabaseClient,
    userSessionRepository: UserSessionRepository,
    config: Config,
  ) {
    this.userRepository = userRepository;
    this.loggerService = loggerService;
    this.tokenService = tokenService;
    this.databaseClient = databaseClient;
    this.userSessionRepository = userSessionRepository;
    this.googleAuthService = new GoogleAuthService(config);
  }

  public async execute(oauthData: LoginWithOAuthData, context: ExecutionContext): Promise<LoginWithOAuthResult> {
    const { provider, code, language: preferredLanguage } = oauthData;

    this.loggerService.debug({
      message: 'Starting OAuth login',
      event: 'user.oauth.login.start',
      requestId: context.requestId,
      provider,
    });

    const googleUser = await this.googleAuthService.getVerifiedUserInfo(code);

    const normalizedEmail = googleUser.email.toLowerCase().trim();
    const providerId = googleUser.id;
    const name = googleUser.name || googleUser.given_name || 'User';

    // Prioritize language from frontend (state parameter), fallback to Google locale
    let language: Language;
    if (preferredLanguage) {
      language = preferredLanguage;
    } else if (googleUser.locale) {
      const locale = googleUser.locale.toLowerCase().split('-')[0];
      language = locale === 'pl' || locale === 'en' ? (locale as Language) : 'en';
    } else {
      language = 'en';
    }

    this.loggerService.info({
      message: 'Processing OAuth user authentication',
      event: 'user.oauth.login.processing',
      requestId: context.requestId,
      email: normalizedEmail,
      provider,
      language,
    });

    const result = await this.databaseClient.db.transaction(async (tx) => {
      const existingOAuthUser = await this.userRepository.findByOAuthProvider(provider, providerId, tx);

      let user: User;

      if (existingOAuthUser) {
        user = existingOAuthUser;
      } else {
        // Try to find user by email (for linking existing accounts)
        const existingEmailUser = await this.userRepository.findByEmail(normalizedEmail, tx);

        if (existingEmailUser) {
          this.loggerService.info({
            message: 'Linking OAuth provider to existing user',
            event: 'user.oauth.link',
            requestId: context.requestId,
            userId: existingEmailUser.id,
            provider,
          });

          await this.userRepository.updateOAuthProvider(
            {
              id: existingEmailUser.id,
              oauthProvider: provider,
              oauthProviderId: providerId,
            },
            tx,
          );

          user = { ...existingEmailUser, oauthProvider: provider, oauthProviderId: providerId };
        } else {
          // Create new user with OAuth
          this.loggerService.info({
            message: 'Creating new user with OAuth',
            event: 'user.oauth.create',
            requestId: context.requestId,
            email: normalizedEmail,
            provider,
          });

          user = await this.userRepository.create(
            {
              name,
              email: normalizedEmail,
              oauthProvider: provider,
              oauthProviderId: providerId,
              isEmailVerified: true,
              language,
            },
            tx,
          );
        }
      }

      // Create session
      const sessionId = IdService.generateUuid();
      const accessPayload = { userId: user.id, email: user.email };
      const refreshPayload = { userId: user.id, email: user.email, sessionId };

      const accessToken = this.tokenService.generateAccessToken(accessPayload);
      const refreshToken = this.tokenService.generateRefreshToken(refreshPayload);

      const tokenHash = CryptoService.hashData(refreshToken);

      await this.userSessionRepository.create({ id: sessionId, userId: user.id, currentRefreshHash: tokenHash }, tx);

      this.loggerService.info({
        message: 'User logged in successfully via OAuth',
        event: 'user.oauth.login.success',
        requestId: context.requestId,
        userId: user.id,
      });

      return { accessToken, refreshToken };
    });

    return result;
  }
}
