import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type, type Static } from '@fastify/type-provider-typebox';

import type { LoggerService } from '../../../common/logger/loggerService.ts';
import type { Config } from '../../../core/config.ts';
import type { DatabaseClient } from '../../../infrastructure/database/databaseClient.ts';
import { GetLivenessCheckAction } from '../application/actions/getLivenessCheckAction.ts';
import { GetReadinessCheckAction } from '../application/actions/getReadinessCheckAction.ts';

const serviceCheckSchema = Type.Object({
  status: Type.Union([Type.Literal('healthy'), Type.Literal('unhealthy')]),
  latencyMs: Type.Optional(Type.Number()),
  error: Type.Optional(Type.String()),
});

export const healthCheckResponseSchema = Type.Object({
  status: Type.Union([Type.Literal('healthy'), Type.Literal('unhealthy')]),
  checks: Type.Record(Type.String(), serviceCheckSchema),
});

export type HealthCheckResponse = Static<typeof healthCheckResponseSchema>;

export const healthRoutes: FastifyPluginAsyncTypebox<{
  config: Config;
  loggerService: LoggerService;
  databaseClient: DatabaseClient;
}> = async function (fastify, opts) {
  const { config, loggerService, databaseClient } = opts;

  const getLivenessCheckAction = new GetLivenessCheckAction();
  const getReadinessCheckAction = new GetReadinessCheckAction(databaseClient, config, loggerService);

  fastify.get('/health/live', {
    schema: {
      response: {
        200: healthCheckResponseSchema,
        503: healthCheckResponseSchema,
      },
    },
    handler: async (_request, reply) => {
      const result = await getLivenessCheckAction.execute();

      const statusCode = result.status === 'healthy' ? 200 : 503;

      return reply.status(statusCode).send(result);
    },
  });

  fastify.get('/health/ready', {
    schema: {
      response: {
        200: healthCheckResponseSchema,
        503: healthCheckResponseSchema,
      },
    },
    handler: async (_request, reply) => {
      const result = await getReadinessCheckAction.execute();

      const statusCode = result.status === 'healthy' ? 200 : 503;

      return reply.status(statusCode).send(result);
    },
  });
};
