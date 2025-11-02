import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { createAuthenticationMiddleware } from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
import { UnauthorizedAccessError } from '../../../common/errors/unathorizedAccessError.ts';
import type { LoggerService } from '../../../common/logger/loggerService.ts';
import type { Config } from '../../../core/config.ts';
import type { DatabaseClient } from '../../../infrastructure/database/database.ts';
import { AddFavoriteSeriesAction } from '../application/actions/addFavoriteSeriesAction.ts';
import { AddIgnoredSeriesAction } from '../application/actions/addIgnoredSeriesAction.ts';
import { GetFavoriteSeriesAction } from '../application/actions/getFavoriteSeriesAction.ts';
import { GetIgnoredSeriesAction } from '../application/actions/getIgnoredSeriesAction.ts';
import { GetSeriesDetailsAction } from '../application/actions/getSeriesDetailsAction.ts';
import { GetSeriesExternalIdsAction } from '../application/actions/getSeriesExternalIdsAction.ts';
import { RemoveFavoriteSeriesAction } from '../application/actions/removeFavoriteSeriesAction.ts';
import { RemoveIgnoredSeriesAction } from '../application/actions/removeIgnoredSeriesAction.ts';
import { SearchSeriesAction } from '../application/actions/searchSeriesAction.ts';
import { UpdateFavoriteSeriesPreferenceAction } from '../application/actions/updateFavoriteSeriesPreferenceAction.ts';
import type { FavoriteSeries } from '../domain/types/favoriteSeries.ts';
import type { IgnoredSeries } from '../domain/types/ignoredSeries.ts';
import type { TmdbSeries, TmdbSeriesDetails, TmdbSeriesExternalIds } from '../domain/types/tmdbSeries.ts';
import { FavoriteSeriesRepositoryImpl } from '../infrastructure/repositories/favoriteSeriesRepositoryImpl.ts';
import { IgnoredSeriesRepositoryImpl } from '../infrastructure/repositories/ignoredSeriesRepositoryImpl.ts';
import { TmdbServiceImpl } from '../infrastructure/services/tmdbServiceImpl.ts';

import {
  addFavoriteSeriesRequestSchema,
  addIgnoredSeriesRequestSchema,
  favoriteSeriesListSchema,
  favoriteSeriesParamsSchema,
  favoriteSeriesQuerySchema,
  favoriteSeriesSchema,
  ignoredSeriesListSchema,
  ignoredSeriesParamsSchema,
  ignoredSeriesQuerySchema,
  ignoredSeriesSchema,
  type SeriesDto,
  type SeriesDetailsDto,
  seriesDetailsSchema,
  seriesExternalIdsSchema,
  seriesParamsSchema,
  seriesSearchQuerySchema,
  seriesSearchResultSchema,
  type SeriesExternalIdsDto,
  updateFavoriteSeriesPreferenceRequestSchema,
  updateFavoriteSeriesPreferenceParamsSchema,
  type IgnoredSeriesDto,
  type FavoriteSeriesDto,
} from './seriesSchemas.ts';

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
  });

  const mapSeriesExternalIdsToResponse = (externalIds: TmdbSeriesExternalIds): SeriesExternalIdsDto => ({
    imdbId: externalIds.imdbId,
    tvdbId: externalIds.tvdbId,
    facebookId: externalIds.facebookId,
    instagramId: externalIds.instagramId,
    twitterId: externalIds.twitterId,
  });

  const mapIgnoredSeriesToResponse = (ignored: IgnoredSeries): IgnoredSeriesDto => ({
    seriesTmdbId: ignored.seriesTmdbId,
  });

  const mapFavoriteSeriesToResponse = (favorite: FavoriteSeries): FavoriteSeriesDto => ({
    seriesTmdbId: favorite.seriesTmdbId,
    preferenceLevel: favorite.preferenceLevel,
  });

  const tmdbService = new TmdbServiceImpl(config.tmdb.apiKey, config.tmdb.baseUrl);
  const searchSeriesAction = new SearchSeriesAction(tmdbService);
  const getSeriesDetailsAction = new GetSeriesDetailsAction(tmdbService);
  const getSeriesExternalIdsAction = new GetSeriesExternalIdsAction(tmdbService);
  const favoriteSeriesRepository = new FavoriteSeriesRepositoryImpl(databaseClient);
  const getUserFavoriteSeriesAction = new GetFavoriteSeriesAction(favoriteSeriesRepository);
  const ignoredSeriesRepository = new IgnoredSeriesRepositoryImpl(databaseClient);
  const getUserIgnoredSeriesAction = new GetIgnoredSeriesAction(ignoredSeriesRepository);
  const addFavoriteSeriesAction = new AddFavoriteSeriesAction(
    favoriteSeriesRepository,
    ignoredSeriesRepository,
    databaseClient,
    loggerService,
  );
  const removeFavoriteSeriesAction = new RemoveFavoriteSeriesAction(favoriteSeriesRepository, loggerService);
  const updateFavoriteSeriesPreferenceAction = new UpdateFavoriteSeriesPreferenceAction(
    favoriteSeriesRepository,
    loggerService,
  );
  const addIgnoredSeriesAction = new AddIgnoredSeriesAction(
    ignoredSeriesRepository,
    favoriteSeriesRepository,
    databaseClient,
    loggerService,
  );
  const removeIgnoredSeriesAction = new RemoveIgnoredSeriesAction(ignoredSeriesRepository, loggerService);

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);

  fastify.get('/series/search', {
    schema: {
      querystring: seriesSearchQuerySchema,
      response: {
        200: seriesSearchResultSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const { query, page = 1 } = request.query;

      const result = await searchSeriesAction.execute({ query, page });

      return reply.send({
        data: result.results.map(mapSeriesToResponse),
        metadata: {
          page: result.page,
          pageSize: 20,
          total: result.totalResults,
        },
      });
    },
  });

  fastify.get('/series/:seriesTmdbId', {
    schema: {
      params: seriesParamsSchema,
      response: {
        200: seriesDetailsSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const { seriesTmdbId } = request.params;

      const details = await getSeriesDetailsAction.execute(seriesTmdbId);

      return reply.send(mapSeriesDetailsToResponse(details));
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

      const externalIds = await getSeriesExternalIdsAction.execute(seriesTmdbId);

      return reply.send(mapSeriesExternalIdsToResponse(externalIds));
    },
  });

  fastify.get('/series/favorites', {
    schema: {
      querystring: favoriteSeriesQuerySchema,
      response: {
        200: favoriteSeriesListSchema,
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
      const { page = 1, pageSize = 20, preferenceLevel } = request.query;

      const { data, total } = await getUserFavoriteSeriesAction.execute({ userId, page, pageSize, preferenceLevel });

      return reply.send({
        data: data.map(mapFavoriteSeriesToResponse),
        metadata: {
          page,
          pageSize,
          total,
        },
      });
    },
  });

  fastify.post('/series/favorites', {
    schema: {
      body: addFavoriteSeriesRequestSchema,
      response: {
        201: favoriteSeriesSchema,
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
      const { seriesTmdbId, preferenceLevel } = request.body;

      const favorite = await addFavoriteSeriesAction.execute(userId, seriesTmdbId, preferenceLevel, {
        requestId: request.id,
        userId,
      });

      return reply.status(201).send(mapFavoriteSeriesToResponse(favorite));
    },
  });

  fastify.delete('/series/favorites/:seriesTmdbId', {
    schema: {
      params: favoriteSeriesParamsSchema,
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

      await removeFavoriteSeriesAction.execute(userId, seriesTmdbId, {
        requestId: request.id,
        userId,
      });

      return reply.status(204).send();
    },
  });

  fastify.patch('/series/favorites/:seriesTmdbId/preference', {
    schema: {
      params: updateFavoriteSeriesPreferenceParamsSchema,
      body: updateFavoriteSeriesPreferenceRequestSchema,
      response: {
        200: favoriteSeriesSchema,
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
      const { preferenceLevel } = request.body;

      const updated = await updateFavoriteSeriesPreferenceAction.execute(
        {
          userId,
          seriesTmdbId,
          preferenceLevel,
        },
        {
          requestId: request.id,
          userId,
        },
      );

      return reply.send(mapFavoriteSeriesToResponse(updated));
    },
  });

  fastify.get('/series/ignored', {
    schema: {
      querystring: ignoredSeriesQuerySchema,
      response: {
        200: ignoredSeriesListSchema,
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

      const { data, total } = await getUserIgnoredSeriesAction.execute({ userId, page, pageSize });

      return reply.send({
        data: data.map(mapIgnoredSeriesToResponse),
        metadata: {
          page,
          pageSize,
          total,
        },
      });
    },
  });

  fastify.post('/series/ignored', {
    schema: {
      body: addIgnoredSeriesRequestSchema,
      response: {
        201: ignoredSeriesSchema,
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
      const { seriesTmdbId } = request.body;

      const ignored = await addIgnoredSeriesAction.execute(userId, seriesTmdbId, {
        requestId: request.id,
        userId,
      });

      return reply.status(201).send(mapIgnoredSeriesToResponse(ignored));
    },
  });

  fastify.delete('/series/ignored/:seriesTmdbId', {
    schema: {
      params: ignoredSeriesParamsSchema,
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

      await removeIgnoredSeriesAction.execute(userId, seriesTmdbId, {
        requestId: request.id,
        userId,
      });

      return reply.status(204).send();
    },
  });
};
