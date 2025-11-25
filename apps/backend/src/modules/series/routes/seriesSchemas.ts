import { Type, type Static } from '@fastify/type-provider-typebox';

export const seriesRatingSchema = Type.Union([Type.Literal('like'), Type.Literal('love'), Type.Literal('dislike')]);

export const watchlistTypeSchema = Type.Union([Type.Literal('notInterested'), Type.Literal('wantToWatch')]);

export const seriesSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  posterPath: Type.Union([Type.String(), Type.Null()]),
  overview: Type.String(),
  firstAirDate: Type.Union([Type.String(), Type.Null()]),
  voteAverage: Type.Number(),
});

export const watchProviderSchema = Type.Object({
  providerId: Type.Number(),
  providerName: Type.String(),
  logoPath: Type.Union([Type.String(), Type.Null()]),
});

export const seriesDetailsSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  posterPath: Type.Union([Type.String(), Type.Null()]),
  backdropPath: Type.Union([Type.String(), Type.Null()]),
  overview: Type.String(),
  firstAirDate: Type.Union([Type.String(), Type.Null()]),
  genres: Type.Array(Type.String()),
  numberOfSeasons: Type.Number(),
  numberOfEpisodes: Type.Number(),
  status: Type.String(),
  voteAverage: Type.Number(),
  watchProviders: Type.Array(watchProviderSchema),
});

export const seriesExternalIdsSchema = Type.Object({
  imdbId: Type.Union([Type.String(), Type.Null()]),
  tvdbId: Type.Union([Type.Number(), Type.Null()]),
  facebookId: Type.Union([Type.String(), Type.Null()]),
  instagramId: Type.Union([Type.String(), Type.Null()]),
  twitterId: Type.Union([Type.String(), Type.Null()]),
});

export const seriesSearchResultSchema = Type.Object({
  data: Type.Array(seriesSchema),
  metadata: Type.Object({ total: Type.Number() }),
});

export const seriesSearchQuerySchema = Type.Object({
  query: Type.String({ minLength: 1 }),
  page: Type.Optional(Type.Number({ minimum: 1, maximum: 500 })),
});

export const seriesParamsSchema = Type.Object({
  seriesTmdbId: Type.Number({ minimum: 1 }),
});

export const seriesRatingResponseSchema = Type.Object({
  seriesTmdbId: Type.Number(),
  rating: seriesRatingSchema,
});

export const seriesRatingListSchema = Type.Object({
  data: Type.Array(seriesRatingResponseSchema),
  metadata: Type.Object({ total: Type.Number() }),
});

export const seriesWatchlistResponseSchema = Type.Object({
  seriesTmdbId: Type.Number(),
  type: watchlistTypeSchema,
});

export const seriesWatchlistListSchema = Type.Object({
  data: Type.Array(seriesWatchlistResponseSchema),
  metadata: Type.Object({ total: Type.Number() }),
});

export const addSeriesRatingRequestSchema = Type.Object({
  seriesTmdbId: Type.Number(),
  rating: seriesRatingSchema,
});

export const seriesRatingParamsSchema = Type.Object({
  seriesTmdbId: Type.Number(),
});

export const updateSeriesRatingRequestSchema = Type.Object({
  rating: seriesRatingSchema,
});

export const updateSeriesRatingParamsSchema = Type.Object({
  seriesTmdbId: Type.Number(),
});

export const seriesRatingQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1 })),
  pageSize: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  rating: Type.Optional(seriesRatingSchema),
});

export const addSeriesWatchlistRequestSchema = Type.Object({
  seriesTmdbId: Type.Number(),
  type: watchlistTypeSchema,
});

export const seriesWatchlistParamsSchema = Type.Object({
  seriesTmdbId: Type.Number(),
});

export const seriesWatchlistQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1 })),
  pageSize: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  type: Type.Optional(watchlistTypeSchema),
});

export const batchSeriesDetailsQuerySchema = Type.Object({
  ids: Type.String({ minLength: 1 }),
  includeProviders: Type.Optional(Type.Boolean()),
});

export const batchSeriesDetailsResponseSchema = Type.Object({
  data: Type.Array(seriesDetailsSchema),
});

export type SeriesDto = Static<typeof seriesSchema>;
export type SeriesDetailsDto = Static<typeof seriesDetailsSchema>;
export type SeriesExternalIdsDto = Static<typeof seriesExternalIdsSchema>;
export type SeriesRatingDto = Static<typeof seriesRatingResponseSchema>;
export type SeriesWatchlistDto = Static<typeof seriesWatchlistResponseSchema>;

export type SeriesSearchResult = Static<typeof seriesSearchResultSchema>;
export type SeriesSearchQuery = Static<typeof seriesSearchQuerySchema>;
export type SeriesParams = Static<typeof seriesParamsSchema>;

export type SeriesRatingListResponse = Static<typeof seriesRatingListSchema>;
export type SeriesWatchlistListResponse = Static<typeof seriesWatchlistListSchema>;

export type AddSeriesRatingRequest = Static<typeof addSeriesRatingRequestSchema>;
export type SeriesRatingParams = Static<typeof seriesRatingParamsSchema>;
export type UpdateSeriesRatingRequest = Static<typeof updateSeriesRatingRequestSchema>;
export type UpdateSeriesRatingParams = Static<typeof updateSeriesRatingParamsSchema>;
export type SeriesRatingQuery = Static<typeof seriesRatingQuerySchema>;
export type AddSeriesWatchlistRequest = Static<typeof addSeriesWatchlistRequestSchema>;
export type SeriesWatchlistParams = Static<typeof seriesWatchlistParamsSchema>;
export type SeriesWatchlistQuery = Static<typeof seriesWatchlistQuerySchema>;
export type BatchSeriesDetailsQuery = Static<typeof batchSeriesDetailsQuerySchema>;
export type BatchSeriesDetailsResponse = Static<typeof batchSeriesDetailsResponseSchema>;
