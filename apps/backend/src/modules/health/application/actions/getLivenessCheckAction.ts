import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';

type HealthCheckResult = {
  status: 'healthy' | 'unhealthy';
};

export class GetLivenessCheckAction {
  private readonly databaseClient: DatabaseClient;
  private readonly loggerService: LoggerService;

  public constructor(databaseClient: DatabaseClient, loggerService: LoggerService) {
    this.databaseClient = databaseClient;
    this.loggerService = loggerService;
  }

  public async execute(): Promise<HealthCheckResult> {
    try {
      await this.databaseClient.testConnection();
      return { status: 'healthy' };
    } catch (error) {
      this.loggerService.error({
        message: 'Liveness check failed',
        event: 'health.liveness.failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { status: 'unhealthy' };
    }
  }
}
