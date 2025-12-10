import type { Config } from '../../core/config.ts';
import { OAuthError } from '../errors/oAuthError.ts';

export interface GoogleUserInfo {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly given_name?: string;
  readonly verified_email: boolean;
  readonly locale?: string;
}

interface GoogleTokenResponse {
  readonly access_token: string;
  readonly token_type: string;
  readonly expires_in?: number;
  readonly refresh_token?: string;
  readonly scope?: string;
}

export class GoogleAuthService {
  private readonly config: Config;

  public constructor(config: Config) {
    this.config = config;
  }

  public getAuthorizationUrl(language: string): string {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', this.config.oauth.google.clientId);
    authUrl.searchParams.set('redirect_uri', this.config.oauth.google.callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'profile email');
    authUrl.searchParams.set('access_type', 'online');

    // Use state parameter to pass language preference through OAuth flow
    if (language) {
      authUrl.searchParams.set('state', `lang:${language}`);
    }

    return authUrl.toString();
  }

  public async getVerifiedUserInfo(code: string): Promise<GoogleUserInfo> {
    const accessToken = await this.exchangeCodeForToken(code);
    const userInfo = await this.getUserInfo(accessToken);

    if (!userInfo.verified_email) {
      throw new OAuthError({
        provider: 'google',
        reason: 'Email not verified by Google',
      });
    }

    return userInfo;
  }

  public async exchangeCodeForToken(code: string): Promise<string> {
    const tokenResponse = await fetch('https://www.googleapis.com/oauth2/v4/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.config.oauth.google.clientId,
        client_secret: this.config.oauth.google.clientSecret,
        redirect_uri: this.config.oauth.google.callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new OAuthError({
        provider: 'google',
        reason: `Failed to exchange code for token: ${errorText}`,
      });
    }

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

    return tokenData.access_token;
  }

  public async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      throw new OAuthError({
        provider: 'google',
        reason: `Failed to fetch user info from Google: ${errorText}`,
      });
    }

    return (await userInfoResponse.json()) as GoogleUserInfo;
  }
}
