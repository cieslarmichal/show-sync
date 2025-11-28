import { InMemoryCache } from '../../../../common/cache/inMemoryCache.ts';
import { ExternalServiceError } from '../../../../common/errors/externalServiceError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { SeriesSearchResult, TmdbService } from '../../domain/services/tmdbService.ts';
import type {
  TmdbSeries,
  TmdbSeriesDetails,
  TmdbSeriesExternalIds,
  TmdbWatchProvider,
} from '../../domain/types/tmdbSeries.ts';

interface TmdbApiSeriesResponse {
  readonly id: number;
  readonly name: string;
  readonly poster_path: string | null;
  readonly overview: string;
  readonly first_air_date?: string;
  readonly vote_average: number;
  readonly genre_ids?: number[];
  readonly origin_country?: string[];
  readonly original_language?: string;
}

interface TmdbApiSearchResponse {
  readonly page: number;
  readonly results: TmdbApiSeriesResponse[];
  readonly total_pages: number;
  readonly total_results: number;
}

interface TmdbApiGenre {
  readonly name: string;
}

interface TmdbApiSeriesDetailsResponse {
  readonly id: number;
  readonly name: string;
  readonly poster_path: string | null;
  readonly backdrop_path: string | null;
  readonly overview: string;
  readonly first_air_date: string | null;
  readonly genres: TmdbApiGenre[];
  readonly number_of_seasons: number;
  readonly number_of_episodes: number;
  readonly status: string;
  readonly vote_average: number;
}

interface TmdbApiWatchProvider {
  readonly provider_id: number;
  readonly provider_name: string;
  readonly logo_path: string | null;
}

interface TmdbApiCountryProviders {
  readonly flatrate?: TmdbApiWatchProvider[];
  readonly buy?: TmdbApiWatchProvider[];
  readonly rent?: TmdbApiWatchProvider[];
}

interface TmdbApiWatchProvidersResponse {
  readonly results: {
    readonly PL?: TmdbApiCountryProviders;
    readonly [key: string]: TmdbApiCountryProviders | undefined;
  };
}

interface TmdbApiExternalIdsResponse {
  readonly imdb_id: string | null;
  readonly tvdb_id: number | null;
  readonly facebook_id: string | null;
  readonly instagram_id: string | null;
  readonly twitter_id: string | null;
}

export class TmdbServiceImpl implements TmdbService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly searchCache: InMemoryCache<SeriesSearchResult>;
  private readonly detailsCache: InMemoryCache<TmdbSeriesDetails>;
  private readonly externalIdsCache: InMemoryCache<TmdbSeriesExternalIds>;
  private readonly watchProvidersCache: InMemoryCache<TmdbWatchProvider[]>;

  public constructor(apiKey: string, baseUrl: string, logger: LoggerService) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;

    // Cache search results for 60 minutes (less volatile than details)
    this.searchCache = new InMemoryCache<SeriesSearchResult>(60 * 60 * 1000, 500, logger);

    // Cache series details for 24 hours (relatively stable data)
    this.detailsCache = new InMemoryCache<TmdbSeriesDetails>(24 * 60 * 60 * 1000, 1000, logger);

    // Cache external IDs for 24 hours (very stable data)
    this.externalIdsCache = new InMemoryCache<TmdbSeriesExternalIds>(24 * 60 * 60 * 1000, 1000, logger);

    // Cache watch providers for 7 days (very stable data)
    this.watchProvidersCache = new InMemoryCache<TmdbWatchProvider[]>(7 * 24 * 60 * 60 * 1000, 1000, logger);
  }

  public async searchSeries(query: string, language: string): Promise<SeriesSearchResult> {
    const cacheKey = `search:${query}:${language}`;

    const cachedResult = this.searchCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const url = new URL(`${this.baseUrl}/search/tv`);
    url.searchParams.append('query', query);
    url.searchParams.append('page', '1');
    url.searchParams.append('language', language);
    url.searchParams.append('include_adult', 'false');

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ExternalServiceError({
          service: 'TMDB API',
          reason: `TMDB API request failed with status ${response.status.toString()}`,
          responseBody: errorBody,
        });
      }

      const data = (await response.json()) as TmdbApiSearchResponse;

      const result = this.mapToSeriesSearchResult(data);

      this.searchCache.set(cacheKey, result);

      return result;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }

      throw new ExternalServiceError({
        service: 'TMDB API',
        reason: 'Failed to fetch data from TMDB API',
        originalError: error,
      });
    }
  }

  public async getSeriesDetails(
    seriesTmdbId: number,
    language: string,
    includeProviders = false,
  ): Promise<TmdbSeriesDetails> {
    const cacheKey = `details:${seriesTmdbId.toString()}:${language}:${includeProviders.toString()}`;

    const cachedDetails = this.detailsCache.get(cacheKey);
    if (cachedDetails) {
      return cachedDetails;
    }

    const url = new URL(`${this.baseUrl}/tv/${seriesTmdbId.toString()}`);
    url.searchParams.append('language', language);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (response.status === 404) {
        throw new ResourceNotFoundError({
          resource: 'Series',
          reason: `Series with TMDB ID ${seriesTmdbId.toString()} not found`,
          seriesTmdbId,
        });
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ExternalServiceError({
          service: 'TMDB API',
          reason: `TMDB API request failed with status ${response.status.toString()}`,
          responseBody: errorBody,
        });
      }

      const data = (await response.json()) as TmdbApiSeriesDetailsResponse;

      let watchProviders: TmdbWatchProvider[] = [];
      if (includeProviders) {
        watchProviders = await this.getWatchProviders(seriesTmdbId, language);
      }

      const result = this.mapToSeriesDetails(data, watchProviders);

      this.detailsCache.set(cacheKey, result);

      return result;
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof ResourceNotFoundError) {
        throw error;
      }

      throw new ExternalServiceError({
        service: 'TMDB API',
        reason: 'Failed to fetch series details from TMDB API',
        originalError: error,
      });
    }
  }

  private async getWatchProviders(seriesTmdbId: number, language: string): Promise<TmdbWatchProvider[]> {
    const cacheKey = `watchProviders:${seriesTmdbId.toString()}:${language}`;

    const cachedProviders = this.watchProvidersCache.get(cacheKey);
    if (cachedProviders) {
      return cachedProviders;
    }

    const url = new URL(`${this.baseUrl}/tv/${seriesTmdbId.toString()}/watch/providers`);
    url.searchParams.append('language', language);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as TmdbApiWatchProvidersResponse;

      const plProviders = data.results['PL'];
      if (!plProviders) {
        return [];
      }

      // Only include streaming platforms (flatrate)
      const allProviders = [...(plProviders.flatrate || [])];

      // Filter to popular providers in Poland and remove duplicates
      const popularProviderIds = new Set([
        8, // Netflix
        337, // Disney+
        531, // Paramount+
        350, // Apple TV+
        119, // Amazon Prime Video (Poland)
        1899, // Max (HBO Max successor)
        2, // Apple iTunes
        3, // Google Play Movies
        10, // Amazon Video
      ]);

      const uniqueProviders = new Map<number, TmdbWatchProvider>();

      for (const provider of allProviders) {
        if (popularProviderIds.has(provider.provider_id) && !uniqueProviders.has(provider.provider_id)) {
          uniqueProviders.set(provider.provider_id, {
            providerId: provider.provider_id,
            providerName: provider.provider_name,
            logoPath: provider.logo_path,
          });
        }
      }

      const result = Array.from(uniqueProviders.values()).slice(0, 5);

      this.watchProvidersCache.set(cacheKey, result);

      return result;
    } catch {
      return [];
    }
  }

  public async getSeriesExternalIds(seriesTmdbId: number, language: string): Promise<TmdbSeriesExternalIds> {
    const cacheKey = `externalIds:${seriesTmdbId.toString()}:${language}`;

    const cachedExternalIds = this.externalIdsCache.get(cacheKey);
    if (cachedExternalIds) {
      return cachedExternalIds;
    }

    const url = new URL(`${this.baseUrl}/tv/${seriesTmdbId.toString()}/external_ids`);
    url.searchParams.append('language', language);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (response.status === 404) {
        throw new ResourceNotFoundError({
          resource: 'Series',
          reason: `Series with TMDB ID ${seriesTmdbId.toString()} not found`,
          seriesTmdbId,
        });
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ExternalServiceError({
          service: 'TMDB API',
          reason: `TMDB API request failed with status ${response.status.toString()}`,
          responseBody: errorBody,
        });
      }

      const data = (await response.json()) as TmdbApiExternalIdsResponse;

      const result = this.mapToSeriesExternalIds(data);

      this.externalIdsCache.set(cacheKey, result);

      return result;
    } catch (error) {
      if (error instanceof ExternalServiceError || error instanceof ResourceNotFoundError) {
        throw error;
      }

      throw new ExternalServiceError({
        service: 'TMDB API',
        reason: 'Failed to fetch series external IDs from TMDB API',
        originalError: error,
      });
    }
  }

  private mapToSeriesSearchResult(apiResponse: TmdbApiSearchResponse): SeriesSearchResult {
    const result: SeriesSearchResult = {
      page: apiResponse.page,
      results: apiResponse.results.map((item) => this.mapToSeries(item)),
      totalPages: apiResponse.total_pages,
      totalResults: apiResponse.total_results,
    };

    return result;
  }

  private mapToSeries(apiSeries: TmdbApiSeriesResponse): TmdbSeries {
    const series: TmdbSeries = {
      id: apiSeries.id,
      name: apiSeries.name,
      posterPath: apiSeries.poster_path,
      overview: apiSeries.overview,
      firstAirDate: apiSeries.first_air_date || null,
      voteAverage: apiSeries.vote_average,
      genreIds: apiSeries.genre_ids || [],
      originCountry: apiSeries.origin_country || [],
      originalLanguage: apiSeries.original_language || 'en',
    };

    return series;
  }

  private mapToSeriesDetails(
    apiDetails: TmdbApiSeriesDetailsResponse,
    watchProviders: TmdbWatchProvider[] = [],
  ): TmdbSeriesDetails {
    return {
      id: apiDetails.id,
      name: apiDetails.name,
      posterPath: apiDetails.poster_path,
      backdropPath: apiDetails.backdrop_path,
      overview: apiDetails.overview,
      firstAirDate: apiDetails.first_air_date,
      genres: apiDetails.genres.map((genre) => genre.name),
      numberOfSeasons: apiDetails.number_of_seasons,
      numberOfEpisodes: apiDetails.number_of_episodes,
      status: apiDetails.status,
      voteAverage: apiDetails.vote_average,
      watchProviders,
    };
  }

  private mapToSeriesExternalIds(apiExternalIds: TmdbApiExternalIdsResponse): TmdbSeriesExternalIds {
    return {
      imdbId: apiExternalIds.imdb_id,
      tvdbId: apiExternalIds.tvdb_id,
      facebookId: apiExternalIds.facebook_id,
      instagramId: apiExternalIds.instagram_id,
      twitterId: apiExternalIds.twitter_id,
    };
  }
}
