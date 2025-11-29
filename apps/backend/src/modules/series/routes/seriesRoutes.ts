import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { createAuthenticationMiddleware } from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
import { InputNotValidError } from '../../../common/errors/inputNotValidError.ts';
import { UnauthorizedAccessError } from '../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../common/logger/loggerService.ts';
import type { Config } from '../../../core/config.ts';
import type { DatabaseClient } from '../../../infrastructure/database/databaseClient.ts';
import { AddSeriesRatingAction } from '../application/actions/addSeriesRatingAction.ts';
import { AddSeriesWatchlistAction } from '../application/actions/addSeriesWatchlistAction.ts';
import { GetPopularSeriesAction } from '../application/actions/getPopularSeriesAction.ts';
import { GetSeriesDetailsBatchAction } from '../application/actions/getSeriesDetailsBatchAction.ts';
import { GetSeriesExternalIdsAction } from '../application/actions/getSeriesExternalIdsAction.ts';
import { GetSeriesRatingsAction } from '../application/actions/getSeriesRatingsAction.ts';
import { GetSeriesWatchlistAction } from '../application/actions/getSeriesWatchlistAction.ts';
import { RemoveSeriesRatingAction } from '../application/actions/removeSeriesRatingAction.ts';
import { RemoveSeriesWatchlistAction } from '../application/actions/removeSeriesWatchlistAction.ts';
import { SearchSeriesAction } from '../application/actions/searchSeriesAction.ts';
import { UpdateSeriesRatingAction } from '../application/actions/updateSeriesRatingAction.ts';
import type { TmdbSeries, TmdbSeriesDetails, TmdbSeriesExternalIds } from '../domain/types/tmdbSeries.ts';
import type { UserSeriesRating } from '../domain/types/userSeriesRating.ts';
import type { UserSeriesWatchlist } from '../domain/types/userSeriesWatchlist.ts';
import { UserSeriesRatingRepositoryImpl } from '../infrastructure/repositories/userSeriesRatingRepositoryImpl.ts';
import { UserSeriesWatchlistRepositoryImpl } from '../infrastructure/repositories/userSeriesWatchlistRepositoryImpl.ts';
import { TmdbServiceImpl } from '../infrastructure/services/tmdbServiceImpl.ts';

import {
  addSeriesRatingRequestSchema,
  addSeriesWatchlistRequestSchema,
  batchSeriesDetailsQuerySchema,
  batchSeriesDetailsResponseSchema,
  seriesRatingListSchema,
  seriesRatingParamsSchema,
  seriesRatingQuerySchema,
  seriesRatingResponseSchema,
  seriesWatchlistListSchema,
  seriesWatchlistParamsSchema,
  seriesWatchlistQuerySchema,
  seriesWatchlistResponseSchema,
  type SeriesDto,
  type SeriesDetailsDto,
  seriesExternalIdsSchema,
  seriesParamsSchema,
  seriesSearchQuerySchema,
  seriesSearchResultSchema,
  type SeriesExternalIdsDto,
  updateSeriesRatingRequestSchema,
  updateSeriesRatingParamsSchema,
  type SeriesWatchlistDto,
  type SeriesRatingDto,
  seriesSchema,
} from './seriesSchemas.ts';

const parseLanguage = (acceptLanguageHeader: string | undefined): 'en' | 'pl' => {
  return acceptLanguageHeader === 'pl' ? 'pl' : 'en';
};

export const seriesRoutes: FastifyPluginAsyncTypebox<{
  config: Config;
  loggerService: LoggerService;
  tokenService: TokenService;
  databaseClient: DatabaseClient;
}> = async function (fastify, opts) {
  const { config, loggerService, tokenService, databaseClient } = opts;

  const mapSeriesToResponse = (series: TmdbSeries): SeriesDto => ({
    id: series.id,
    name: series.name,
    posterPath: series.posterPath,
    overview: series.overview,
    firstAirDate: series.firstAirDate,
    voteAverage: series.voteAverage,
  });

  const mapSeriesDetailsToResponse = (details: TmdbSeriesDetails): SeriesDetailsDto => ({
    id: details.id,
    name: details.name,
    posterPath: details.posterPath,
    backdropPath: details.backdropPath,
    overview: details.overview,
    firstAirDate: details.firstAirDate,
    genres: details.genres,
    numberOfSeasons: details.numberOfSeasons,
    numberOfEpisodes: details.numberOfEpisodes,
    status: details.status,
    voteAverage: details.voteAverage,
    watchProviders: details.watchProviders,
  });

  const mapSeriesExternalIdsToResponse = (externalIds: TmdbSeriesExternalIds): SeriesExternalIdsDto => ({
    imdbId: externalIds.imdbId,
    tvdbId: externalIds.tvdbId,
    facebookId: externalIds.facebookId,
    instagramId: externalIds.instagramId,
    twitterId: externalIds.twitterId,
  });

  const mapSeriesWatchlistToResponse = (watchlist: UserSeriesWatchlist): SeriesWatchlistDto => ({
    seriesTmdbId: watchlist.seriesTmdbId,
    type: watchlist.type,
  });

  const mapSeriesRatingToResponse = (rating: UserSeriesRating): SeriesRatingDto => ({
    seriesTmdbId: rating.seriesTmdbId,
    rating: rating.rating,
  });

  const tmdbService = new TmdbServiceImpl(config.tmdb.apiKey, config.tmdb.baseUrl, loggerService);
  const searchSeriesAction = new SearchSeriesAction(tmdbService);
  const getPopularSeriesAction = new GetPopularSeriesAction(tmdbService);
  const getSeriesDetailsBatchAction = new GetSeriesDetailsBatchAction(tmdbService);
  const getSeriesExternalIdsAction = new GetSeriesExternalIdsAction(tmdbService);
  const seriesRatingRepository = new UserSeriesRatingRepositoryImpl(databaseClient);
  const getSeriesRatingsAction = new GetSeriesRatingsAction(seriesRatingRepository);
  const seriesWatchlistRepository = new UserSeriesWatchlistRepositoryImpl(databaseClient);
  const getSeriesWatchlistAction = new GetSeriesWatchlistAction(seriesWatchlistRepository);
  const addSeriesRatingAction = new AddSeriesRatingAction(
    seriesRatingRepository,
    seriesWatchlistRepository,
    databaseClient,
    loggerService,
  );
  const removeSeriesRatingAction = new RemoveSeriesRatingAction(seriesRatingRepository, loggerService);
  const updateSeriesRatingAction = new UpdateSeriesRatingAction(seriesRatingRepository, loggerService);
  const addSeriesWatchlistAction = new AddSeriesWatchlistAction(
    seriesWatchlistRepository,
    seriesRatingRepository,
    databaseClient,
    loggerService,
  );
  const removeSeriesWatchlistAction = new RemoveSeriesWatchlistAction(seriesWatchlistRepository, loggerService);

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);

  fastify.get('/series/popular', {
    schema: {
      response: {
        200: Type.Object({
          data: Type.Array(seriesSchema),
        }),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const language = parseLanguage(request.headers['accept-language']);

      const popularSeries = await getPopularSeriesAction.execute({ language });

      const responseData = {
        data: popularSeries.map(mapSeriesToResponse),
      };

      reply.header('Cache-Control', 'public, max-age=3600, s-maxage=604800, must-revalidate');
      reply.header('Vary', 'Accept-Language');

      return reply.send(responseData);
    },
  });

  fastify.get('/series/search', {
    schema: {
      querystring: seriesSearchQuerySchema,
      response: {
        200: seriesSearchResultSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const { query } = request.query;
      const language = parseLanguage(request.headers['accept-language']);

      const result = await searchSeriesAction.execute({ query, language });

      const responseData = {
        data: result.results.map(mapSeriesToResponse),
        metadata: { total: result.totalResults },
      };

      reply.header('Cache-Control', 'public, max-age=3600, s-maxage=604800, must-revalidate');
      reply.header('Vary', 'Accept-Language');

      return reply.send(responseData);
    },
  });

  fastify.get('/series/:seriesTmdbId/external-ids', {
    schema: {
      params: seriesParamsSchema,
      response: {
        200: seriesExternalIdsSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const { seriesTmdbId } = request.params;
      const language = parseLanguage(request.headers['accept-language']);

      const externalIds = await getSeriesExternalIdsAction.execute({ seriesTmdbId, language });

      const responseData = mapSeriesExternalIdsToResponse(externalIds);

      reply.header('Cache-Control', 'public, max-age=3600, s-maxage=604800, must-revalidate');
      reply.header('Vary', 'Accept-Language');

      return reply.send(responseData);
    },
  });

  fastify.get('/series/batch/details', {
    schema: {
      querystring: batchSeriesDetailsQuerySchema,
      response: {
        200: batchSeriesDetailsResponseSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const { ids, includeProviders = false } = request.query;
      const language = parseLanguage(request.headers['accept-language']);

      const seriesIds = ids
        .split(',')
        .map((id) => Number.parseInt(id.trim(), 10))
        .filter((id) => !Number.isNaN(id) && id > 0);

      if (seriesIds.length === 0 || seriesIds.length > 20) {
        throw new InputNotValidError({
          reason: 'Invalid series IDs. Must provide between 1 and 20 valid IDs.',
          value: ids,
        });
      }

      const results = await getSeriesDetailsBatchAction.execute({ seriesIds, language, includeProviders });

      const responseData = results.map(mapSeriesDetailsToResponse);

      reply.header('Cache-Control', 'public, max-age=3600, s-maxage=604800, must-revalidate');
      reply.header('Vary', 'Accept-Language');

      return reply.send({ data: responseData });
    },
  });

  fastify.get('/series/ratings', {
    schema: {
      querystring: seriesRatingQuerySchema,
      response: {
        200: seriesRatingListSchema,
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
      const { page = 1, pageSize = 20, rating } = request.query;

      const { data, total } = await getSeriesRatingsAction.execute({ userId, page, pageSize, rating });

      return reply.send({
        data: data.map(mapSeriesRatingToResponse),
        metadata: { total },
      });
    },
  });

  fastify.post('/series/ratings', {
    schema: {
      body: addSeriesRatingRequestSchema,
      response: {
        201: seriesRatingResponseSchema,
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
      const { seriesTmdbId, rating } = request.body;

      const seriesRating = await addSeriesRatingAction.execute(
        { userId, seriesTmdbId, rating },
        {
          requestId: request.id,
          userId,
        },
      );

      return reply.status(201).send(mapSeriesRatingToResponse(seriesRating));
    },
  });

  fastify.delete('/series/ratings/:seriesTmdbId', {
    schema: {
      params: seriesRatingParamsSchema,
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
      const { seriesTmdbId } = request.params;

      await removeSeriesRatingAction.execute(
        { userId, seriesTmdbId },
        {
          requestId: request.id,
          userId,
        },
      );

      return reply.status(204).send();
    },
  });

  fastify.patch('/series/ratings/:seriesTmdbId', {
    schema: {
      params: updateSeriesRatingParamsSchema,
      body: updateSeriesRatingRequestSchema,
      response: {
        200: seriesRatingResponseSchema,
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
      const { seriesTmdbId } = request.params;
      const { rating } = request.body;

      const updated = await updateSeriesRatingAction.execute(
        {
          userId,
          seriesTmdbId,
          rating,
        },
        {
          requestId: request.id,
          userId,
        },
      );

      return reply.send(mapSeriesRatingToResponse(updated));
    },
  });

  fastify.get('/series/watchlist', {
    schema: {
      querystring: seriesWatchlistQuerySchema,
      response: {
        200: seriesWatchlistListSchema,
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
      const { page = 1, pageSize = 20, type } = request.query;

      const { data, total } = await getSeriesWatchlistAction.execute({ userId, page, pageSize, type });

      return reply.send({
        data: data.map(mapSeriesWatchlistToResponse),
        metadata: { total },
      });
    },
  });

  fastify.post('/series/watchlist', {
    schema: {
      body: addSeriesWatchlistRequestSchema,
      response: {
        201: seriesWatchlistResponseSchema,
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
      const { seriesTmdbId, type } = request.body;

      const watchlist = await addSeriesWatchlistAction.execute(
        { userId, seriesTmdbId, type },
        {
          requestId: request.id,
          userId,
        },
      );

      return reply.status(201).send(mapSeriesWatchlistToResponse(watchlist));
    },
  });

  fastify.delete('/series/watchlist/:seriesTmdbId', {
    schema: {
      params: seriesWatchlistParamsSchema,
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
      const { seriesTmdbId } = request.params;

      await removeSeriesWatchlistAction.execute(
        { userId, seriesTmdbId },
        {
          requestId: request.id,
          userId,
        },
      );

      return reply.status(204).send();
    },
  });
};
