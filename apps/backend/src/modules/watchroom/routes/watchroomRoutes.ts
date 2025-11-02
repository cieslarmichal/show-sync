import { Type, type Static, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { createAuthenticationMiddleware } from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
import { UnauthorizedAccessError } from '../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../common/logger/loggerService.ts';
import type { OpenRouterService } from '../../../common/openRouter/openRouterService.ts';
import { UuidService } from '../../../common/uuid/uuidService.ts';
import type { Config } from '../../../core/config.ts';
import type { DatabaseClient } from '../../../infrastructure/database/database.ts';
import { FavoriteSeriesRepositoryImpl } from '../../series/infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';
import { IgnoredSeriesRepositoryImpl } from '../../series/infrastructure/repositories/ignoredSeriesRepositoryImpl.ts';
import { TmdbServiceImpl } from '../../series/infrastructure/services/tmdbServiceImpl.ts';
import { CheckRecommendationStatusAction } from '../application/actions/checkRecommendationStatusAction.ts';
import { CreateWatchroomAction } from '../application/actions/createWatchroomAction.ts';
import { DeleteWatchroomAction } from '../application/actions/deleteWatchroomAction.ts';
import { FindPublicWatchroomDetailsAction } from '../application/actions/findPublicWatchroomDetailsAction.ts';
import { FindRecommendationsAction } from '../application/actions/findRecommendationsAction.ts';
import { FindUserWatchroomsAction } from '../application/actions/findUserWatchroomsAction.ts';
import { FindWatchroomDetailsAction } from '../application/actions/findWatchroomDetailsAction.ts';
import { GenerateRecommendationsAction } from '../application/actions/generateRecommendationsAction.ts';
import { JoinWatchroomAction } from '../application/actions/joinWatchroomAction.ts';
import { LeaveWatchroomAction } from '../application/actions/leaveWatchroomAction.ts';
import { RemoveParticipantAction } from '../application/actions/removeParticipantAction.ts';
import { UpdateWatchroomAction } from '../application/actions/updateWatchroomAction.ts';
import { RecommendationPromptBuilder } from '../application/services/recommendationPromptBuilder.ts';
import { SeriesNameResolver } from '../application/services/seriesNameResolver.ts';
import type { Recommendation } from '../domain/types/recommendation.ts';
import type { Watchroom } from '../domain/types/watchroom.ts';
import { RecommendationRepositoryImpl } from '../infrastructure/repositories/recommendationRepositoryImpl.ts';
import { WatchroomRepositoryImpl } from '../infrastructure/repositories/watchroomRepositoryImpl.ts';

const watchroomNameSchema = Type.String({ minLength: 1, maxLength: 64 });
const watchroomDescriptionSchema = Type.String({ maxLength: 256 });

const recommendationSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  seriesTmdbId: Type.Integer(),
  justification: Type.String(),
});

const watchroomSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: watchroomNameSchema,
  description: Type.Optional(watchroomDescriptionSchema),
  ownerId: Type.String({ format: 'uuid' }),
  publicLinkId: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
  participants: Type.Array(
    Type.Object({
      id: Type.String({ format: 'uuid' }),
      name: Type.String(),
    }),
  ),
});

export const watchroomRoutes: FastifyPluginAsyncTypebox<{
  databaseClient: DatabaseClient;
  tokenService: TokenService;
  loggerService: LoggerService;
  openRouterService: OpenRouterService;
  config: Config;
}> = async function (fastify, opts) {
  const { databaseClient, tokenService, loggerService, openRouterService, config } = opts;

  const watchroomRepository = new WatchroomRepositoryImpl(databaseClient);
  const recommendationRepository = new RecommendationRepositoryImpl(databaseClient);
  const favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(databaseClient);
  const ignoredSeriesRepository = new IgnoredSeriesRepositoryImpl(databaseClient);
  const tmdbService = new TmdbServiceImpl(config.tmdb.apiKey, config.tmdb.baseUrl);

  const createWatchroomAction = new CreateWatchroomAction(watchroomRepository, loggerService);
  const findUserWatchroomsAction = new FindUserWatchroomsAction(watchroomRepository);
  const findPublicWatchroomDetailsAction = new FindPublicWatchroomDetailsAction(watchroomRepository);
  const joinWatchroomAction = new JoinWatchroomAction(watchroomRepository, loggerService);
  const findWatchroomDetailsAction = new FindWatchroomDetailsAction(watchroomRepository);
  const updateWatchroomAction = new UpdateWatchroomAction(watchroomRepository, loggerService);
  const deleteWatchroomAction = new DeleteWatchroomAction(watchroomRepository, loggerService);
  const removeParticipantAction = new RemoveParticipantAction(watchroomRepository, loggerService);
  const leaveWatchroomAction = new LeaveWatchroomAction(watchroomRepository, loggerService);

  const recommendationPromptBuilder = new RecommendationPromptBuilder();
  const seriesNameResolver = new SeriesNameResolver(tmdbService);

  const generateRecommendationsAction = new GenerateRecommendationsAction(
    watchroomRepository,
    recommendationRepository,
    favoriteSeriesRepository,
    ignoredSeriesRepository,
    tmdbService,
    openRouterService,
    loggerService,
    recommendationPromptBuilder,
    seriesNameResolver,
    databaseClient,
  );
  const findRecommendationsAction = new FindRecommendationsAction(watchroomRepository, recommendationRepository);
  const checkRecommendationStatusAction = new CheckRecommendationStatusAction(
    watchroomRepository,
    recommendationRepository,
  );

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);

  const mapWatchroomToResponse = (watchroom: Watchroom): Static<typeof watchroomSchema> => {
    const response: Static<typeof watchroomSchema> = {
      id: watchroom.id,
      name: watchroom.name,
      ownerId: watchroom.ownerId,
      publicLinkId: watchroom.publicLinkId,
      createdAt: watchroom.createdAt.toISOString(),
      participants: watchroom.participants,
    };

    if (watchroom.description) {
      response.description = watchroom.description;
    }

    return response;
  };

  const mapRecommendationToResponse = (recommendation: Recommendation): Static<typeof recommendationSchema> => {
    return {
      id: recommendation.id,
      seriesTmdbId: recommendation.seriesTmdbId,
      justification: recommendation.justification,
    };
  };

  fastify.post('/watchrooms', {
    schema: {
      body: Type.Object({
        name: watchroomNameSchema,
        description: Type.Optional(watchroomDescriptionSchema),
      }),
      response: {
        201: watchroomSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;
      const { name, description } = request.body;

      const watchroom = await createWatchroomAction.execute(
        {
          name,
          description,
          ownerId: userId,
        },
        {
          requestId: request.id,
          userId,
        },
      );

      return reply.status(201).send(mapWatchroomToResponse(watchroom));
    },
  });

  fastify.get('/watchrooms', {
    schema: {
      querystring: Type.Object({
        page: Type.Optional(Type.Integer({ minimum: 1 })),
        pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
      }),
      response: {
        200: Type.Object({
          data: Type.Array(watchroomSchema),
          metadata: Type.Object({
            page: Type.Integer(),
            pageSize: Type.Integer(),
            total: Type.Integer(),
          }),
        }),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;
      const { page = 1, pageSize = 20 } = request.query;

      const result = await findUserWatchroomsAction.execute({
        userId,
        page,
        pageSize,
      });

      return reply.send({
        data: result.data.map(mapWatchroomToResponse),
        metadata: {
          page,
          pageSize,
          total: result.total,
        },
      });
    },
  });

  fastify.get('/watchrooms/by-link/:publicLinkId', {
    schema: {
      params: Type.Object({
        publicLinkId: Type.String({ minLength: 1 }),
      }),
      response: {
        200: watchroomSchema,
      },
    },
    handler: async (request, reply) => {
      const { publicLinkId } = request.params;

      const watchroom = await findPublicWatchroomDetailsAction.execute(publicLinkId);

      return reply.send(mapWatchroomToResponse(watchroom));
    },
  });

  fastify.post('/watchrooms/by-link/:publicLinkId/participants', {
    schema: {
      params: Type.Object({
        publicLinkId: Type.String({ minLength: 1 }),
      }),
      response: {
        201: watchroomSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;
      const { publicLinkId } = request.params;

      const watchroom = await joinWatchroomAction.execute(
        {
          publicLinkId,
          userId,
        },
        {
          requestId: request.id,
          userId,
        },
      );

      return reply.status(201).send(mapWatchroomToResponse(watchroom));
    },
  });

  fastify.get('/watchrooms/:watchroomId', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: watchroomSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { watchroomId } = request.params;
      const { userId } = request.user;

      const watchroom = await findWatchroomDetailsAction.execute({ watchroomId, userId });

      return reply.send(mapWatchroomToResponse(watchroom));
    },
  });

  fastify.patch('/watchrooms/:watchroomId', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        name: Type.Optional(watchroomNameSchema),
        description: Type.Optional(watchroomDescriptionSchema),
      }),
      response: {
        200: watchroomSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { watchroomId } = request.params;
      const { userId } = request.user;
      const { name, description } = request.body;

      const watchroom = await updateWatchroomAction.execute(
        {
          watchroomId,
          userId,
          name,
          description,
        },
        {
          requestId: request.id,
          userId,
        },
      );

      return reply.send(mapWatchroomToResponse(watchroom));
    },
  });

  fastify.delete('/watchrooms/:watchroomId', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
      }),
      response: {
        204: Type.Null(),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { watchroomId } = request.params;
      const { userId } = request.user;

      await deleteWatchroomAction.execute(
        { watchroomId, userId },
        {
          requestId: request.id,
          userId,
        },
      );

      return reply.status(204).send();
    },
  });

  fastify.delete('/watchrooms/:watchroomId/participants/:participantId', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
        participantId: Type.String({ format: 'uuid' }),
      }),
      response: {
        204: Type.Null(),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const requesterId = request.user.userId;
      const { watchroomId, participantId } = request.params;

      await removeParticipantAction.execute(
        {
          watchroomId,
          participantId,
          requesterId,
        },
        {
          requestId: request.id,
          userId: requesterId,
        },
      );

      return reply.status(204).send();
    },
  });

  fastify.post('/watchrooms/:watchroomId/leave', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
      }),
      response: {
        204: Type.Null(),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;
      const { watchroomId } = request.params;

      await leaveWatchroomAction.execute(
        {
          watchroomId,
          userId,
        },
        {
          requestId: request.id,
          userId,
        },
      );

      return reply.status(204).send();
    },
  });

  fastify.post('/watchrooms/:watchroomId/recommendations', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
      }),
      response: {
        202: Type.Object({
          requestId: Type.String({ format: 'uuid' }),
          message: Type.String(),
        }),
      },
    },
    config: {
      rateLimit: config.rateLimit.ai,
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;
      const { watchroomId } = request.params;

      const requestId = UuidService.generateUuid();

      // Execute in background and capture requestId
      generateRecommendationsAction
        .execute(
          {
            requestId,
            watchroomId,
            userId,
          },
          {
            requestId: request.id,
            userId,
          },
        )
        .catch((error: unknown) => {
          loggerService.error({
            message: 'Failed to generate recommendations in background',
            requestId: request.id,
            watchroomId,
            userId,
            error: error instanceof Error ? error.message : String(error),
          });
        });

      return reply.status(202).send({
        requestId,
        message: 'Recommendation generation started. Results will be available shortly.',
      });
    },
  });

  fastify.get('/watchrooms/:watchroomId/recommendations/status/:requestId', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
        requestId: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          status: Type.Union([Type.Literal('pending'), Type.Literal('completed')]),
          count: Type.Integer(),
        }),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;
      const { watchroomId, requestId } = request.params;

      const status = await checkRecommendationStatusAction.execute({
        requestId,
        watchroomId,
        userId,
      });

      return reply.send(status);
    },
  });

  fastify.get('/watchrooms/:watchroomId/recommendations', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Array(recommendationSchema),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedAccessError({
          reason: 'User not authenticated',
        });
      }

      const { userId } = request.user;
      const { watchroomId } = request.params;

      const recommendations = await findRecommendationsAction.execute({
        watchroomId,
        userId,
      });

      return reply.send(recommendations.map(mapRecommendationToResponse));
    },
  });
};
