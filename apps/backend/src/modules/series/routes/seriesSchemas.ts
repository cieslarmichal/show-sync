import { Type, type Static } from '@fastify/type-provider-typebox';

export const preferenceLevelSchema = Type.Union([Type.Literal('like'), Type.Literal('love')]);

export const seriesSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  posterPath: Type.Union([Type.String(), Type.Null()]),
  overview: Type.String(),
  firstAirDate: Type.Union([Type.String(), Type.Null()]),
  voteAverage: Type.Number(),
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
  metadata: Type.Object({
    page: Type.Number(),
    pageSize: Type.Number(),
    total: Type.Number(),
  }),
});

export const seriesSearchQuerySchema = Type.Object({
  query: Type.String({ minLength: 1 }),
  page: Type.Optional(Type.Number({ minimum: 1, maximum: 500 })),
});

export const seriesParamsSchema = Type.Object({
  seriesTmdbId: Type.Number({ minimum: 1 }),
});

export const favoriteSeriesSchema = Type.Object({
  seriesTmdbId: Type.Number(),
  preferenceLevel: preferenceLevelSchema,
});

export const favoriteSeriesListSchema = Type.Object({
  data: Type.Array(favoriteSeriesSchema),
  metadata: Type.Object({
    page: Type.Number(),
    pageSize: Type.Number(),
    total: Type.Number(),
  }),
});

export const ignoredSeriesSchema = Type.Object({
  seriesTmdbId: Type.Number(),
});

export const ignoredSeriesListSchema = Type.Object({
  data: Type.Array(ignoredSeriesSchema),
  metadata: Type.Object({
    page: Type.Number(),
    pageSize: Type.Number(),
    total: Type.Number(),
  }),
});

export const addFavoriteSeriesRequestSchema = Type.Object({
  seriesTmdbId: Type.Number(),
  preferenceLevel: preferenceLevelSchema,
});

export const favoriteSeriesParamsSchema = Type.Object({
  seriesTmdbId: Type.Number(),
});

export const updateFavoriteSeriesPreferenceRequestSchema = Type.Object({
  preferenceLevel: preferenceLevelSchema,
});

export const updateFavoriteSeriesPreferenceParamsSchema = Type.Object({
  seriesTmdbId: Type.Number(),
});

export const favoriteSeriesQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1 })),
  pageSize: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  preferenceLevel: Type.Optional(preferenceLevelSchema),
});

export const addIgnoredSeriesRequestSchema = Type.Object({
  seriesTmdbId: Type.Number(),
});

export const ignoredSeriesParamsSchema = Type.Object({
  seriesTmdbId: Type.Number(),
});

export const ignoredSeriesQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1 })),
  pageSize: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
});

export type SeriesDto = Static<typeof seriesSchema>;
export type SeriesDetailsDto = Static<typeof seriesDetailsSchema>;
export type SeriesExternalIdsDto = Static<typeof seriesExternalIdsSchema>;
export type FavoriteSeriesDto = Static<typeof favoriteSeriesSchema>;
export type IgnoredSeriesDto = Static<typeof ignoredSeriesSchema>;

export type SeriesSearchResult = Static<typeof seriesSearchResultSchema>;
export type SeriesSearchQuery = Static<typeof seriesSearchQuerySchema>;
export type SeriesParams = Static<typeof seriesParamsSchema>;

export type FavoriteSeriesListResponse = Static<typeof favoriteSeriesListSchema>;
export type IgnoredSeriesListResponse = Static<typeof ignoredSeriesListSchema>;

export type AddFavoriteSeriesRequest = Static<typeof addFavoriteSeriesRequestSchema>;
export type FavoriteSeriesParams = Static<typeof favoriteSeriesParamsSchema>;
export type UpdateFavoriteSeriesPreferenceRequest = Static<typeof updateFavoriteSeriesPreferenceRequestSchema>;
export type UpdateFavoriteSeriesPreferenceParams = Static<typeof updateFavoriteSeriesPreferenceParamsSchema>;
export type FavoriteSeriesQuery = Static<typeof favoriteSeriesQuerySchema>;
export type AddIgnoredSeriesRequest = Static<typeof addIgnoredSeriesRequestSchema>;
export type IgnoredSeriesParams = Static<typeof ignoredSeriesParamsSchema>;
export type IgnoredSeriesQuery = Static<typeof ignoredSeriesQuerySchema>;
