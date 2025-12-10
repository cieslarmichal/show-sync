import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Generator } from '../../../../../tests/generator.ts';
import { truncateTables } from '../../../../../tests/helpers/dbCleanup.ts';
import { createTestContext } from '../../../../../tests/helpers/testContext.ts';
import type { TestContext } from '../../../../../tests/helpers/testContext.ts';
import { TokenService } from '../../../../common/auth/tokenService.ts';
import { IdService } from '../../../../common/id/idService.ts';
import { UserRepositoryImpl } from '../../infrastructure/repositories/userRepositoryImpl.ts';
import { UserSessionRepositoryImpl } from '../../infrastructure/repositories/userSessionRepositoryImpl.ts';

import { LoginWithOAuthAction } from './loginWithOAuthAction.ts';

// Mock fetch globally
global.fetch = vi.fn();

describe('LoginWithOAuthAction', () => {
  let testContext: TestContext;
  let loginWithOAuthAction: LoginWithOAuthAction;
  let userRepository: UserRepositoryImpl;
  let userSessionRepository: UserSessionRepositoryImpl;
  let tokenService: TokenService;

  beforeEach(async () => {
    testContext = createTestContext();

    userRepository = new UserRepositoryImpl(testContext.databaseClient);
    userSessionRepository = new UserSessionRepositoryImpl(testContext.databaseClient);
    tokenService = new TokenService(testContext.config);

    loginWithOAuthAction = new LoginWithOAuthAction(
      userRepository,
      testContext.loggerService,
      tokenService,
      testContext.databaseClient,
      userSessionRepository,
      testContext.config,
    );

    await truncateTables(testContext.databaseClient);

    // Reset mock before each test
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await truncateTables(testContext.databaseClient);
    await testContext.databaseClient.close();
  });

  const mockGoogleOAuthSuccess = (userInfo: {
    id: string;
    email: string;
    name: string;
    verified_email: boolean;
    locale?: string;
  }): void => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'mock_access_token',
          token_type: 'Bearer',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => userInfo,
      });
  };

  describe('execute', () => {
    it('should create new user and return tokens when OAuth user does not exist', async () => {
      const googleUser = {
        id: 'google-123',
        email: 'newuser@example.com',
        name: 'New User',
        verified_email: true,
      };

      mockGoogleOAuthSuccess(googleUser);

      const result = await loginWithOAuthAction.execute(
        {
          provider: 'google',
          code: 'mock_auth_code',
        },
        {
          requestId: IdService.generateUuid(),
        },
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');

      // Verify user was created
      const user = await userRepository.findByEmail(googleUser.email);
      expect(user).toBeDefined();
      expect(user?.email).toBe(googleUser.email.toLowerCase());
      expect(user?.name).toBe(googleUser.name);
      expect(user?.oauthProvider).toBe('google');
      expect(user?.oauthProviderId).toBe('google-123');
      expect(user?.password).toBeNull();
      expect(user?.isEmailVerified).toBe(true);
    });

    it('should login existing OAuth user', async () => {
      const existingUser = await Generator.user({
        databaseClient: testContext.databaseClient,
        email: 'oauth@example.com',
        password: null,
        oauthProvider: 'google',
        oauthProviderId: 'google-456',
        isEmailVerified: true,
      });

      const googleUser = {
        id: 'google-456',
        email: 'oauth@example.com',
        name: 'OAuth User',
        verified_email: true,
      };

      mockGoogleOAuthSuccess(googleUser);

      const result = await loginWithOAuthAction.execute(
        {
          provider: 'google',
          code: 'mock_auth_code',
        },
        {
          requestId: IdService.generateUuid(),
        },
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');

      // Verify it's the same user
      const user = await userRepository.findByEmail(googleUser.email);
      expect(user?.id).toBe(existingUser.id);
    });

    it('should link OAuth to existing email user', async () => {
      const existingUser = await Generator.user({
        databaseClient: testContext.databaseClient,
        email: 'existing@example.com',
        password: 'hashedPassword123',
      });

      const googleUser = {
        id: 'google-789',
        email: 'existing@example.com',
        name: 'Existing User',
        verified_email: true,
      };

      mockGoogleOAuthSuccess(googleUser);

      const result = await loginWithOAuthAction.execute(
        {
          provider: 'google',
          code: 'mock_auth_code',
        },
        {
          requestId: IdService.generateUuid(),
        },
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');

      // Verify OAuth was linked to existing user
      const user = await userRepository.findByEmail(googleUser.email);
      expect(user?.id).toBe(existingUser.id);
      expect(user?.oauthProvider).toBe('google');
      expect(user?.oauthProviderId).toBe(googleUser.id);
      expect(user?.password).toBe('hashedPassword123'); // Password should remain
    });

    it('should create session for OAuth user', async () => {
      const googleUser = {
        id: 'google-session',
        email: 'session@example.com',
        name: 'Session User',
        verified_email: true,
      };

      mockGoogleOAuthSuccess(googleUser);

      const result = await loginWithOAuthAction.execute(
        {
          provider: 'google',
          code: 'mock_auth_code',
        },
        {
          requestId: IdService.generateUuid(),
        },
      );

      // Verify session was created by checking if refresh token is valid
      const payload = tokenService.verifyRefreshToken(result.refreshToken);
      expect(payload).toHaveProperty('userId');
      expect(payload).toHaveProperty('sessionId');
    });

    it('should set isEmailVerified to true for new OAuth users', async () => {
      const googleUser = {
        id: 'google-verified',
        email: 'verified@example.com',
        name: 'Verified User',
        verified_email: true,
        locale: 'pl',
      };

      mockGoogleOAuthSuccess(googleUser);

      await loginWithOAuthAction.execute(
        {
          provider: 'google',
          code: 'mock_auth_code',
        },
        {
          requestId: IdService.generateUuid(),
        },
      );

      const user = await userRepository.findByEmail(googleUser.email);
      expect(user?.isEmailVerified).toBe(true);
      expect(user?.language).toBe('pl');
    });

    it('should handle case-insensitive email matching', async () => {
      // Create user with normalized email (as it would be stored in DB)
      const existingUser = await Generator.user({
        databaseClient: testContext.databaseClient,
        email: 'casesensitive@example.com',
        password: 'password123',
      });

      const googleUser = {
        id: 'google-case',
        email: 'CaseSensitive@Example.Com', // OAuth returns mixed case
        name: 'Case User',
        verified_email: true,
      };

      mockGoogleOAuthSuccess(googleUser);

      const result = await loginWithOAuthAction.execute(
        {
          provider: 'google',
          code: 'mock_auth_code',
        },
        {
          requestId: IdService.generateUuid(),
        },
      );

      expect(result).toHaveProperty('accessToken');

      // Verify it linked to the existing user
      const user = await userRepository.findByEmail('casesensitive@example.com');
      expect(user?.id).toBe(existingUser.id);
      expect(user?.oauthProvider).toBe('google');
    });

    it('should use preferred language from frontend when provided', async () => {
      const googleUser = {
        id: 'google-lang-override',
        email: 'langtest@example.com',
        name: 'Language Test User',
        verified_email: true,
        locale: 'en-US', // Google returns en-US
      };

      mockGoogleOAuthSuccess(googleUser);

      await loginWithOAuthAction.execute(
        {
          provider: 'google',
          code: 'mock_auth_code',
          language: 'pl', // Frontend prefers Polish
        },
        {
          requestId: IdService.generateUuid(),
        },
      );

      const user = await userRepository.findByEmail(googleUser.email);
      expect(user?.language).toBe('pl'); // Should use frontend preference, not Google locale
    });

    it('should fall back to Google locale when no preferred language provided', async () => {
      const googleUser = {
        id: 'google-locale-fallback',
        email: 'localefallback@example.com',
        name: 'Locale Fallback User',
        verified_email: true,
        locale: 'pl-PL',
      };

      mockGoogleOAuthSuccess(googleUser);

      await loginWithOAuthAction.execute(
        {
          provider: 'google',
          code: 'mock_auth_code',
          // No language parameter provided
        },
        {
          requestId: IdService.generateUuid(),
        },
      );

      const user = await userRepository.findByEmail(googleUser.email);
      expect(user?.language).toBe('pl'); // Should extract 'pl' from 'pl-PL'
    });

    it('should default to en when no language or locale provided', async () => {
      const googleUser = {
        id: 'google-default-lang',
        email: 'defaultlang@example.com',
        name: 'Default Language User',
        verified_email: true,
        // No locale provided
      };

      mockGoogleOAuthSuccess(googleUser);

      await loginWithOAuthAction.execute(
        {
          provider: 'google',
          code: 'mock_auth_code',
          // No language parameter provided
        },
        {
          requestId: IdService.generateUuid(),
        },
      );

      const user = await userRepository.findByEmail(googleUser.email);
      expect(user?.language).toBe('en'); // Should default to 'en'
    });
  });
});
