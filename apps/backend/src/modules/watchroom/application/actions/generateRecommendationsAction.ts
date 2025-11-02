import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { OpenRouterService } from '../../../../common/openRouter/openRouterService.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/database.ts';
import type { FavoriteSeriesRepository } from '../../../series/domain/repositories/favoriteSeriesRepository.ts';
import type { IgnoredSeriesRepository } from '../../../series/domain/repositories/ignoredSeriesRepository.ts';
import type { TmdbService } from '../../../series/domain/services/tmdbService.ts';
import type { RecommendationRepository } from '../../domain/repositories/recommendationRepository.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../domain/types/watchroom.ts';
import { RECOMMENDATIONS_RESPONSE_FORMAT, RECOMMENDATIONS_SYSTEM_MESSAGE } from '../recommendationConfig.ts';
import type { RecommendationPromptBuilder } from '../services/recommendationPromptBuilder.ts';
import type { SeriesNameResolver } from '../services/seriesNameResolver.ts';

export interface GenerateRecommendationsActionPayload {
  readonly watchroomId: string;
  readonly userId: string;
  readonly requestId: string;
}

export interface GenerateRecommendationsActionResult {
  readonly requestId: string;
}

interface AIRecommendation {
  readonly seriesName: string;
  readonly justification: string;
}

interface AIRecommendationsResponse {
  readonly recommendations: AIRecommendation[];
}

interface SeriesInfo {
  readonly tmdbId: number;
  readonly name: string;
  readonly overview: string;
  readonly genres: string[];
  readonly voteAverage: number;
  readonly firstAirDate: string | null;
}

interface ParticipantFavorites {
  readonly participantId: string;
  readonly lovedSeriesIds: number[];
  readonly likedSeriesIds: number[];
}

interface ParticipantIgnored {
  readonly participantId: string;
  readonly seriesTmdbIds: number[];
}

export class GenerateRecommendationsAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRepository: RecommendationRepository;
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;
  private readonly ignoredSeriesRepository: IgnoredSeriesRepository;
  private readonly tmdbService: TmdbService;
  private readonly openRouterService: OpenRouterService;
  private readonly loggerService: LoggerService;
  private readonly promptBuilder: RecommendationPromptBuilder;
  private readonly seriesResolver: SeriesNameResolver;
  private readonly databaseClient: DatabaseClient;

  public constructor(
    watchroomRepository: WatchroomRepository,
    recommendationRepository: RecommendationRepository,
    favoriteSeriesRepository: FavoriteSeriesRepository,
    ignoredSeriesRepository: IgnoredSeriesRepository,
    tmdbService: TmdbService,
    openRouterService: OpenRouterService,
    loggerService: LoggerService,
    promptBuilder: RecommendationPromptBuilder,
    seriesResolver: SeriesNameResolver,
    databaseClient: DatabaseClient,
  ) {
    this.watchroomRepository = watchroomRepository;
    this.recommendationRepository = recommendationRepository;
    this.favoriteSeriesRepository = favoriteSeriesRepository;
    this.ignoredSeriesRepository = ignoredSeriesRepository;
    this.tmdbService = tmdbService;
    this.openRouterService = openRouterService;
    this.loggerService = loggerService;
    this.promptBuilder = promptBuilder;
    this.seriesResolver = seriesResolver;
    this.databaseClient = databaseClient;
  }

  public async execute(payload: GenerateRecommendationsActionPayload): Promise<GenerateRecommendationsActionResult> {
    const { watchroomId, userId, requestId } = payload;

    this.loggerService.info({
      message: 'Generating recommendations for watchroom',
      watchroomId,
      requestId,
    });

    const watchroom = await this.getWatchroom(watchroomId, userId);
    const participantIds = [watchroom.ownerId, ...watchroom.participants.map((p) => p.id)];

    const [participantFavorites, participantIgnored] = await Promise.all([
      this.fetchParticipantFavorites(participantIds),
      this.fetchParticipantIgnored(participantIds),
    ]);

    const allIgnoredSeriesIds = [...new Set(participantIgnored.flatMap((p) => p.seriesTmdbIds))];
    const allFavoriteSeriesIds = [
      ...new Set(participantFavorites.flatMap((p) => [...p.lovedSeriesIds, ...p.likedSeriesIds])),
    ];

    const seriesInfoMap = await this.fetchSeriesInfo([...allFavoriteSeriesIds, ...allIgnoredSeriesIds]);

    const totalSeries = allFavoriteSeriesIds.length + allIgnoredSeriesIds.length;
    const failedCount = totalSeries - seriesInfoMap.size;
    if (failedCount > 0) {
      this.loggerService.warn({
        message: 'Some series details could not be fetched from TMDB',
        watchroomId,
        requestId,
        failedCount,
        totalSeries,
      });
    }

    const aiRecommendations = await this.generateAIRecommendations(
      participantFavorites,
      allIgnoredSeriesIds,
      seriesInfoMap,
      watchroom.name,
      watchroom.description,
    );

    const resolutionResult = await this.seriesResolver.resolve(
      aiRecommendations,
      allFavoriteSeriesIds,
      allIgnoredSeriesIds,
    );

    if (resolutionResult.failed.length > 0 || resolutionResult.skipped.length > 0) {
      this.loggerService.warn({
        message: 'Some AI recommendations were skipped or failed to be resolved to TMDB series',
        watchroomId,
        requestId,
        aiRecommendationCount: aiRecommendations.length,
        resolvedCount: resolutionResult.resolved.length,
        failedCount: resolutionResult.failed.length,
        failedTitles: resolutionResult.failed,
        skippedCount: resolutionResult.skipped.length,
        skippedTitles: resolutionResult.skipped,
      });
    }

    await this.databaseClient.db.transaction(async (tx) => {
      await this.recommendationRepository.deleteAllByWatchroomId(watchroomId, tx);
      await this.recommendationRepository.create(
        resolutionResult.resolved.map((r) => ({
          watchroomId,
          requestId,
          seriesTmdbId: r.seriesTmdbId,
          justification: r.justification,
        })),
        tx,
      );
    });

    this.loggerService.info({
      message: 'Recommendations generated and saved successfully',
      watchroomId,
      requestId,
      resolvedCount: resolutionResult.resolved.length,
    });

    return { requestId };
  }

  private async getWatchroom(watchroomId: string, userId: string): Promise<Watchroom> {
    const watchroom = await this.watchroomRepository.findOne({ id: watchroomId });

    if (!watchroom) {
      throw new ResourceNotFoundError({
        resource: 'Watchroom',
        id: watchroomId,
      });
    }

    if (watchroom.ownerId !== userId) {
      throw new ForbiddenAccessError({
        reason: 'Only the watchroom owner can generate recommendations',
      });
    }

    return watchroom;
  }

  private async fetchParticipantFavorites(participantIds: string[]): Promise<ParticipantFavorites[]> {
    return Promise.all(
      participantIds.map(async (participantId) => {
        const favorites = await this.favoriteSeriesRepository.findMany(participantId, 1, 100);

        const lovedSeriesIds = favorites.filter((f) => f.preferenceLevel === 'love').map((f) => f.seriesTmdbId);

        const likedSeriesIds = favorites.filter((f) => f.preferenceLevel === 'like').map((f) => f.seriesTmdbId);

        return {
          participantId,
          lovedSeriesIds,
          likedSeriesIds,
        };
      }),
    );
  }

  private async fetchParticipantIgnored(participantIds: string[]): Promise<ParticipantIgnored[]> {
    return Promise.all(
      participantIds.map(async (participantId) => {
        const ignored = await this.ignoredSeriesRepository.findMany(participantId, 1, 100);
        return {
          participantId,
          seriesTmdbIds: ignored.map((i) => i.seriesTmdbId),
        };
      }),
    );
  }

  private async fetchSeriesInfo(seriesIds: number[]): Promise<Map<number, SeriesInfo>> {
    const seriesInfoMap = new Map<number, SeriesInfo>();

    await Promise.allSettled(
      seriesIds.map(async (tmdbId) => {
        try {
          const details = await this.tmdbService.getSeriesDetails(tmdbId);
          seriesInfoMap.set(tmdbId, {
            tmdbId,
            name: details.name,
            overview: details.overview,
            genres: details.genres,
            voteAverage: details.voteAverage,
            firstAirDate: details.firstAirDate,
          });
        } catch (error) {
          // Skip - failures are reported in aggregate
        }
      }),
    );

    return seriesInfoMap;
  }

  private async generateAIRecommendations(
    participantFavorites: ParticipantFavorites[],
    ignoredSeriesIds: number[],
    seriesInfoMap: Map<number, SeriesInfo>,
    watchroomName: string,
    watchroomDescription: string | undefined,
  ): Promise<AIRecommendation[]> {
    const userMessage = this.promptBuilder.build(
      participantFavorites,
      ignoredSeriesIds,
      seriesInfoMap,
      watchroomName,
      watchroomDescription,
    );

    const response = await this.openRouterService.sendRequest<AIRecommendationsResponse>({
      userMessage,
      systemMessage: RECOMMENDATIONS_SYSTEM_MESSAGE,
      responseFormat: RECOMMENDATIONS_RESPONSE_FORMAT,
    });

    return response.data.recommendations;
  }
}
