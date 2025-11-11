type HealthCheckStatus = 'healthy' | 'unhealthy';

type ServiceCheck = {
  status: HealthCheckStatus;
  latencyMs?: number;
};

type HealthCheckResult = {
  status: HealthCheckStatus;
  checks: Record<string, ServiceCheck>;
};

export class GetLivenessCheckAction {
  public async execute(): Promise<HealthCheckResult> {
    return {
      status: 'healthy',
      checks: {
        process: {
          status: 'healthy',
        },
      },
    };
  }
}
