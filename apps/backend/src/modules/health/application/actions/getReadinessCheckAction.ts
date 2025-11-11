import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { Config } from '../../../../core/config.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';

type HealthCheckStatus = 'healthy' | 'unhealthy';

type ServiceCheck = {
  status: HealthCheckStatus;
  latencyMs?: number;
  error?: string;
};

type HealthCheckResult = {
  status: HealthCheckStatus;
  checks: Record<string, ServiceCheck>;
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
    const checks: Record<string, ServiceCheck> = {};

    await Promise.all([this.checkDatabase(checks), this.checkTmdb(checks), this.checkOpenRouter(checks)]);

    const allHealthy = Object.values(checks).every((check) => check.status === 'healthy');

    if (!allHealthy) {
      this.loggerService.warn({
        message: 'Readiness check failed - application not ready for traffic',
        event: 'health.readiness.failed',
        checks,
      });
    }

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
    };
  }

  private async checkDatabase(checks: Record<string, ServiceCheck>): Promise<void> {
    try {
      const dbStart = Date.now();
      await this.databaseClient.db.execute('SELECT 1');
      checks['database'] = { status: 'healthy', latencyMs: Date.now() - dbStart };
    } catch (error) {
      checks['database'] = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkTmdb(checks: Record<string, ServiceCheck>): Promise<void> {
    try {
      const tmdbStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 3000); // 3s timeout

      const response = await fetch(`${this.config.tmdb.baseUrl}/configuration`, {
        headers: {
          Authorization: `Bearer ${this.config.tmdb.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`TMDB API returned status ${String(response.status)}`);
      }
      checks['tmdb'] = { status: 'healthy', latencyMs: Date.now() - tmdbStart };
    } catch (error) {
      checks['tmdb'] = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkOpenRouter(checks: Record<string, ServiceCheck>): Promise<void> {
    try {
      const openRouterStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 3000); // 3s timeout

      const response = await fetch(`${this.config.openRouter.baseUrl}/models/count`, {
        headers: {
          Authorization: `Bearer ${this.config.openRouter.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenRouter API returned status ${String(response.status)}`);
      }
      checks['openRouter'] = { status: 'healthy', latencyMs: Date.now() - openRouterStart };
    } catch (error) {
      checks['openRouter'] = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
