import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { Config } from '../../../../core/config.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';

type HealthCheckResult = {
  status: 'healthy' | 'unhealthy';
};

export class GetReadinessCheckAction {
  private readonly databaseClient: DatabaseClient;
  private readonly config: Config;
  private readonly loggerService: LoggerService;

  public constructor(databaseClient: DatabaseClient, config: Config, loggerService: LoggerService) {
    this.databaseClient = databaseClient;
    this.config = config;
    this.loggerService = loggerService;
  }

  public async execute(): Promise<HealthCheckResult> {
    try {
      await Promise.all([this.checkDatabase(), this.checkTmdb(), this.checkOpenRouter()]);
      return { status: 'healthy' };
    } catch (error) {
      this.loggerService.warn({
        message: 'Readiness check failed',
        event: 'health.readiness.failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { status: 'unhealthy' };
    }
  }

  private async checkDatabase(): Promise<void> {
    await this.databaseClient.testConnection();
  }

  private async checkTmdb(): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 3000);

    const response = await fetch(`${this.config.tmdb.baseUrl}/configuration`, {
      headers: { Authorization: `Bearer ${this.config.tmdb.apiKey}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`TMDB API returned status ${String(response.status)}`);
    }
  }

  private async checkOpenRouter(): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 3000);

    const response = await fetch(`${this.config.openRouter.baseUrl}/models/count`, {
      headers: { Authorization: `Bearer ${this.config.openRouter.apiKey}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenRouter API returned status ${String(response.status)}`);
    }
  }
}
