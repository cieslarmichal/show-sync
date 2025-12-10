import { type BaseErrorContext, BaseError } from './baseError.ts';

interface Context extends BaseErrorContext {
  readonly provider: string;
  readonly reason: string;
  readonly code?: string;
}

export class OAuthError extends BaseError<Context> {
  public constructor(context: Context) {
    super('OAuthError', `OAuth authentication failed: ${context.reason}`, context);
  }
}
