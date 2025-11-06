import { Type, type Static, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { createAuthenticationMiddleware } from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
import { UnauthorizedAccessError } from '../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../common/logger/loggerService.ts';
import type { OpenRouterService } from '../../../common/openRouter/openRouterService.ts';
import type { Config } from '../../../core/config.ts';
import type { DatabaseClient } from '../../../infrastructure/database/databaseClient.ts';
import { FavoriteSeriesRepositoryImpl } from '../../series/infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';
import { IgnoredSeriesRepositoryImpl } from '../../series/infrastructure/repositories/ignoredSeriesRepositoryImpl.ts';
import { TmdbServiceImpl } from '../../series/infrastructure/services/tmdbServiceImpl.ts';
import { WatchroomRepositoryImpl } from '../../watchroom/infrastructure/repositories/watchroomRepositoryImpl.ts';
import { CheckRecommendationFeedbackExistsAction } from '../application/actions/checkRecommendationFeedbackExistsAction.ts';
import { CheckRecommendationRequestStatusAction } from '../application/actions/checkRecommendationRequestStatusAction.ts';
import { CreateRecommendationRequestAction } from '../application/actions/createRecommendationRequestAction.ts';
import { FindRecommendationsAction } from '../application/actions/findRecommendationsAction.ts';
import { GenerateRecommendationsAction } from '../application/actions/generateRecommendationsAction.ts';
import { SubmitRecommendationFeedbackAction } from '../application/actions/submitRecommendationFeedbackAction.ts';
import { RecommendationPromptBuilder } from '../application/services/recommendationPromptBuilder.ts';
import { SeriesNameResolver } from '../application/services/seriesNameResolver.ts';
import type { Recommendation } from '../domain/types/recommendation.ts';
import { RecommendationFeedbackRepositoryImpl } from '../infrastructure/repositories/recommendationFeedbackRepositoryImpl.ts';
import { RecommendationRepositoryImpl } from '../infrastructure/repositories/recommendationRepositoryImpl.ts';
import { RecommendationRequestRepositoryImpl } from '../infrastructure/repositories/recommendationRequestRepositoryImpl.ts';

const recommendationSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  requestId: Type.String({ format: 'uuid' }),
  seriesTmdbId: Type.Integer(),
  justification: Type.String(),
});

export const recommendationRoutes: FastifyPluginAsyncTypebox<{
  databaseClient: DatabaseClient;
  tokenService: TokenService;
  loggerService: LoggerService;
  openRouterService: OpenRouterService;
  config: Config;
}> = async function (fastify, opts) {
  const { databaseClient, tokenService, loggerService, openRouterService, config } = opts;

  const watchroomRepository = new WatchroomRepositoryImpl(databaseClient);
  const recommendationRepository = new RecommendationRepositoryImpl(databaseClient);
  const recommendationRequestRepository = new RecommendationRequestRepositoryImpl(databaseClient);
  const recommendationFeedbackRepository = new RecommendationFeedbackRepositoryImpl(databaseClient);
  const favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(databaseClient);
  const ignoredSeriesRepository = new IgnoredSeriesRepositoryImpl(databaseClient);
  const tmdbService = new TmdbServiceImpl(config.tmdb.apiKey, config.tmdb.baseUrl);

  const recommendationPromptBuilder = new RecommendationPromptBuilder();
  const seriesNameResolver = new SeriesNameResolver(tmdbService);

  const createRecommendationRequestAction = new CreateRecommendationRequestAction(
    watchroomRepository,
    recommendationRequestRepository,
    loggerService,
    config.recommendations.maxRequestsPerUser,
  );
  const generateRecommendationsAction = new GenerateRecommendationsAction(
    watchroomRepository,
    recommendationRepository,
    recommendationRequestRepository,
    favoriteSeriesRepository,
    ignoredSeriesRepository,
    tmdbService,
    openRouterService,
    loggerService,
    recommendationPromptBuilder,
    seriesNameResolver,
    databaseClient,
  );
  const findRecommendationsAction = new FindRecommendationsAction(
    watchroomRepository,
    recommendationRepository,
    recommendationRequestRepository,
  );
  const checkRecommendationStatusAction = new CheckRecommendationRequestStatusAction(
    watchroomRepository,
    recommendationRequestRepository,
  );
  const checkRecommendationFeedbackExistsAction = new CheckRecommendationFeedbackExistsAction(
    watchroomRepository,
    recommendationRequestRepository,
    recommendationFeedbackRepository,
  );
  const submitRecommendationFeedbackAction = new SubmitRecommendationFeedbackAction(
    watchroomRepository,
    recommendationRequestRepository,
    recommendationFeedbackRepository,
    loggerService,
  );

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);

  const mapRecommendationToResponse = (recommendation: Recommendation): Static<typeof recommendationSchema> => {
    return {
      id: recommendation.id,
      requestId: recommendation.recommendationRequestId,
      seriesTmdbId: recommendation.seriesTmdbId,
      justification: recommendation.justification,
    };
  };

  fastify.post('/watchrooms/:watchroomId/recommendations/generate', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
      }),
      response: {
        202: Type.Object({
          recommendationRequestId: Type.String({ format: 'uuid' }),
        }),
      },
    },
    config: {
      rateLimit: config.rateLimit.recommendations,
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

      const { recommendationRequestId } = await createRecommendationRequestAction.execute(
        {
          watchroomId,
          userId,
        },
        {
          requestId: request.id,
        },
      );

      // trigger the async generation process
      generateRecommendationsAction
        .execute(
          {
            recommendationRequestId,
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
            event: 'watchroom.recommendations.generate.background_error',
            requestId: request.id,
            watchroomId,
            recommendationRequestId,
            userId,
            err: error,
          });
        });

      return reply.status(202).send({
        recommendationRequestId,
      });
    },
  });

  fastify.get('/watchrooms/:watchroomId/recommendations/status/:recommendationRequestId', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
        recommendationRequestId: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          status: Type.Union([Type.Literal('pending'), Type.Literal('completed'), Type.Literal('failed')]),
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
      const { watchroomId, recommendationRequestId } = request.params;

      const status = await checkRecommendationStatusAction.execute({
        recommendationRequestId,
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

  fastify.get('/watchrooms/:watchroomId/recommendations/:recommendationRequestId/feedback', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
        recommendationRequestId: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          exists: Type.Boolean(),
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
      const { watchroomId, recommendationRequestId } = request.params;

      const result = await checkRecommendationFeedbackExistsAction.execute({
        recommendationRequestId,
        watchroomId,
        userId,
      });

      return reply.send(result);
    },
  });

  fastify.post('/watchrooms/:watchroomId/recommendations/feedback', {
    schema: {
      params: Type.Object({
        watchroomId: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        recommendationRequestId: Type.String({ format: 'uuid' }),
        rating: Type.Integer({ minimum: 1, maximum: 5 }),
        foundSomething: Type.Boolean(),
        comment: Type.Optional(Type.String({ maxLength: 1000 })),
      }),
      response: {
        201: Type.Object({
          id: Type.String({ format: 'uuid' }),
          recommendationRequestId: Type.String({ format: 'uuid' }),
          rating: Type.Integer(),
          foundSomething: Type.Boolean(),
          createdAt: Type.String({ format: 'date-time' }),
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
      const { watchroomId } = request.params;
      const { recommendationRequestId, rating, foundSomething, comment } = request.body;

      const feedback = await submitRecommendationFeedbackAction.execute(
        {
          recommendationRequestId,
          watchroomId,
          userId,
          rating,
          foundSomething,
          comment: comment ?? null,
        },
        {
          requestId: request.id,
        },
      );

      return reply.status(201).send({
        id: feedback.id,
        recommendationRequestId: feedback.recommendationRequestId,
        rating: feedback.rating,
        foundSomething: feedback.foundSomething,
        createdAt: feedback.createdAt.toISOString(),
      });
    },
  });
};
