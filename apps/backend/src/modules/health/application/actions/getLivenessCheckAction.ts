import type { LoggerService } from '../../../../common/logger/loggerService.ts';
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

export class GetLivenessCheckAction {
  private readonly databaseClient: DatabaseClient;
  private readonly loggerService: LoggerService;

  public constructor(databaseClient: DatabaseClient, loggerService: LoggerService) {
    this.databaseClient = databaseClient;
    this.loggerService = loggerService;
  }

  public async execute(): Promise<HealthCheckResult> {
    const checks: Record<string, ServiceCheck> = {
      process: {
        status: 'healthy',
      },
    };

    // Lightweight database check with timeout
    await this.checkDatabaseLiveness(checks);

    const allHealthy = Object.values(checks).every((check) => check.status === 'healthy');

    if (!allHealthy) {
      this.loggerService.error({
        message: 'Liveness check failed - application not alive',
        event: 'health.liveness.failed',
        checks,
      });
    }

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
    };
  }

  private async checkDatabaseLiveness(checks: Record<string, ServiceCheck>): Promise<void> {
    try {
      const dbStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 3000);

      await Promise.race([
        this.databaseClient.testConnection(),
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Database liveness check timeout'));
          });
        }),
      ]);

      clearTimeout(timeoutId);
      checks['database'] = { status: 'healthy', latencyMs: Date.now() - dbStart };
    } catch (error) {
      checks['database'] = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.loggerService.error({
        message: 'Database liveness check failed',
        event: 'health.liveness.database.failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
