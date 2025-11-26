import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { OpenRouterService } from '../../../../common/openRouter/openRouterService.ts';
import type { ExecutionContext } from '../../../../common/types/executionContext.ts';
import type { DatabaseClient } from '../../../../infrastructure/database/databaseClient.ts';
import type { UserSeriesRatingRepository } from '../../../series/domain/repositories/userSeriesRatingRepository.ts';
import type { UserSeriesWatchlistRepository } from '../../../series/domain/repositories/userSeriesWatchlistRepository.ts';
import type { TmdbService } from '../../../series/domain/services/tmdbService.ts';
import type { WatchroomRepository } from '../../../watchroom/domain/repositories/watchroomRepository.ts';
import type { Watchroom } from '../../../watchroom/domain/types/watchroom.ts';
import type { RecommendationRepository } from '../../domain/repositories/recommendationRepository.ts';
import type { RecommendationRequestRepository } from '../../domain/repositories/recommendationRequestRepository.ts';
import { RECOMMENDATIONS_RESPONSE_FORMAT, RECOMMENDATIONS_SYSTEM_MESSAGE } from '../recommendationConfig.ts';
import type { RecommendationPromptBuilder } from '../services/recommendationPromptBuilder.ts';
import type { SeriesNameResolver } from '../services/seriesNameResolver.ts';

export interface GenerateRecommendationsActionPayload {
  readonly watchroomId: string;
  readonly userId: string;
  readonly recommendationRequestId: string;
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

interface ParticipantRatings {
  readonly participantId: string;
  readonly lovedSeriesIds: number[];
  readonly likedSeriesIds: number[];
  readonly dislikedSeriesIds: number[];
}

interface ParticipantWatchlist {
  readonly participantId: string;
  readonly notInterestedSeriesIds: number[];
  readonly wantToWatchSeriesIds: number[];
}

export class GenerateRecommendationsAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRepository: RecommendationRepository;
  private readonly recommendationRequestRepository: RecommendationRequestRepository;
  private readonly seriesRatingRepository: UserSeriesRatingRepository;
  private readonly seriesWatchlistRepository: UserSeriesWatchlistRepository;
  private readonly tmdbService: TmdbService;
  private readonly openRouterService: OpenRouterService;
  private readonly loggerService: LoggerService;
  private readonly promptBuilder: RecommendationPromptBuilder;
  private readonly seriesResolver: SeriesNameResolver;
  private readonly databaseClient: DatabaseClient;

  public constructor(
    watchroomRepository: WatchroomRepository,
    recommendationRepository: RecommendationRepository,
    recommendationRequestRepository: RecommendationRequestRepository,
    seriesRatingRepository: UserSeriesRatingRepository,
    seriesWatchlistRepository: UserSeriesWatchlistRepository,
    tmdbService: TmdbService,
    openRouterService: OpenRouterService,
    loggerService: LoggerService,
    promptBuilder: RecommendationPromptBuilder,
    seriesResolver: SeriesNameResolver,
    databaseClient: DatabaseClient,
  ) {
    this.watchroomRepository = watchroomRepository;
    this.recommendationRepository = recommendationRepository;
    this.recommendationRequestRepository = recommendationRequestRepository;
    this.seriesRatingRepository = seriesRatingRepository;
    this.seriesWatchlistRepository = seriesWatchlistRepository;
    this.tmdbService = tmdbService;
    this.openRouterService = openRouterService;
    this.loggerService = loggerService;
    this.promptBuilder = promptBuilder;
    this.seriesResolver = seriesResolver;
    this.databaseClient = databaseClient;
  }

  public async execute(payload: GenerateRecommendationsActionPayload, context: ExecutionContext): Promise<void> {
    const { watchroomId, userId, recommendationRequestId } = payload;

    this.loggerService.info({
      message: 'Generating recommendations for watchroom',
      event: 'watchroom.recommendations.generate.start',
      requestId: context.requestId,
      watchroomId,
      recommendationRequestId,
    });

    try {
      const watchroom = await this.getWatchroom(watchroomId, userId);
      const participantIds = [watchroom.ownerId, ...watchroom.participants.map((p) => p.id)];

      const [participantRatings, participantWatchlists] = await Promise.all([
        this.fetchParticipantRatings(participantIds),
        this.fetchParticipantWatchlists(participantIds),
      ]);

      const allNotInterestedSeriesIds = [...new Set(participantWatchlists.flatMap((p) => p.notInterestedSeriesIds))];
      const allDislikedSeriesIds = [...new Set(participantRatings.flatMap((p) => p.dislikedSeriesIds))];
      const allRatedSeriesIds = [
        ...new Set(
          participantRatings.flatMap((p) => [...p.lovedSeriesIds, ...p.likedSeriesIds, ...p.dislikedSeriesIds]),
        ),
      ];
      const allWantToWatchSeriesIds = [...new Set(participantWatchlists.flatMap((p) => p.wantToWatchSeriesIds))];

      const seriesInfoMap = await this.fetchSeriesInfo([
        ...allRatedSeriesIds,
        ...allNotInterestedSeriesIds,
        ...allWantToWatchSeriesIds,
      ]);

      const totalSeries = allRatedSeriesIds.length + allNotInterestedSeriesIds.length + allWantToWatchSeriesIds.length;
      const failedCount = totalSeries - seriesInfoMap.size;
      if (failedCount > 0) {
        this.loggerService.warn({
          message: 'Some series details could not be fetched from TMDB',
          event: 'watchroom.recommendations.tmdb.fetch.partial_failure',
          requestId: context.requestId,
          watchroomId,
          recommendationRequestId,
          failedCount,
          totalSeries,
        });
      }

      const aiRecommendations = await this.generateAIRecommendations(
        participantRatings,
        allNotInterestedSeriesIds,
        allDislikedSeriesIds,
        allWantToWatchSeriesIds,
        seriesInfoMap,
        watchroom.name,
        watchroom.description,
        watchroom.availablePlatforms,
        watchroom.seriesLengthPreference,
      );

      const excludedSeriesIds = [...allRatedSeriesIds, ...allNotInterestedSeriesIds];

      const resolutionResult = await this.seriesResolver.resolve(aiRecommendations, excludedSeriesIds, []);

      if (resolutionResult.failed.length > 0 || resolutionResult.skipped.length > 0) {
        this.loggerService.warn({
          message: 'Some AI recommendations were skipped or failed to be resolved to TMDB series',
          event: 'watchroom.recommendations.resolution.partial_failure',
          requestId: context.requestId,
          watchroomId,
          recommendationRequestId,
          aiRecommendationCount: aiRecommendations.length,
          resolvedCount: resolutionResult.resolved.length,
          failedCount: resolutionResult.failed.length,
          failedTitles: resolutionResult.failed,
          skippedCount: resolutionResult.skipped.length,
          skippedTitles: resolutionResult.skipped,
        });
      }

      const transactionStartTime = Date.now();

      try {
        await this.databaseClient.db.transaction(
          async (tx) => {
            await this.recommendationRepository.create(
              resolutionResult.resolved.map((r) => ({
                recommendationRequestId,
                seriesTmdbId: r.seriesTmdbId,
                justification: r.justification,
              })),
              tx,
            );

            await this.recommendationRequestRepository.updateStatus(recommendationRequestId, 'completed', tx);
          },
          {
            isolationLevel: 'serializable',
          },
        );

        const transactionDuration = Date.now() - transactionStartTime;

        this.loggerService.info({
          message: 'Recommendations generated and saved successfully',
          event: 'watchroom.recommendations.generate.success',
          requestId: context.requestId,
          watchroomId,
          recommendationRequestId,
          resolvedCount: resolutionResult.resolved.length,
          transactionDuration,
        });
      } catch (error) {
        const transactionDuration = Date.now() - transactionStartTime;

        this.loggerService.error({
          message: 'Recommendation transaction failed',
          event: 'watchroom.recommendations.transaction.failure',
          requestId: context.requestId,
          watchroomId,
          recommendationRequestId,
          transactionDuration,
          err: error,
        });

        throw error;
      }
    } catch (error: unknown) {
      this.loggerService.error({
        message: 'Failed to generate recommendations',
        event: 'watchroom.recommendations.generate.error',
        requestId: context.requestId,
        watchroomId,
        recommendationRequestId,
        err: error,
      });

      await this.recommendationRequestRepository.updateStatus(recommendationRequestId, 'failed');

      throw error;
    }
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

  private async fetchParticipantRatings(participantIds: string[]): Promise<ParticipantRatings[]> {
    return Promise.all(
      participantIds.map(async (participantId) => {
        const ratings = await this.seriesRatingRepository.findMany(participantId, 1, 100);

        const lovedSeriesIds = ratings.filter((r) => r.rating === 'love').map((r) => r.seriesTmdbId);

        const likedSeriesIds = ratings.filter((r) => r.rating === 'like').map((r) => r.seriesTmdbId);

        const dislikedSeriesIds = ratings.filter((r) => r.rating === 'dislike').map((r) => r.seriesTmdbId);

        return {
          participantId,
          lovedSeriesIds,
          likedSeriesIds,
          dislikedSeriesIds,
        };
      }),
    );
  }

  private async fetchParticipantWatchlists(participantIds: string[]): Promise<ParticipantWatchlist[]> {
    return Promise.all(
      participantIds.map(async (participantId) => {
        const watchlist = await this.seriesWatchlistRepository.findMany(participantId, 1, 100);

        const notInterestedSeriesIds = watchlist.filter((w) => w.type === 'notInterested').map((w) => w.seriesTmdbId);

        const wantToWatchSeriesIds = watchlist.filter((w) => w.type === 'wantToWatch').map((w) => w.seriesTmdbId);

        return {
          participantId,
          notInterestedSeriesIds,
          wantToWatchSeriesIds,
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
    participantRatings: ParticipantRatings[],
    notInterestedSeriesIds: number[],
    dislikedSeriesIds: number[],
    wantToWatchSeriesIds: number[],
    seriesInfoMap: Map<number, SeriesInfo>,
    watchroomName: string,
    watchroomDescription: string | undefined,
    availablePlatforms: string[],
    seriesLengthPreference: 'all' | 'excludeMiniSeries' | 'onlyMiniSeries',
  ): Promise<AIRecommendation[]> {
    const userMessage = this.promptBuilder.build(
      participantRatings,
      notInterestedSeriesIds,
      dislikedSeriesIds,
      wantToWatchSeriesIds,
      seriesInfoMap,
      watchroomName,
      watchroomDescription,
      availablePlatforms,
      seriesLengthPreference,
    );

    const response = await this.openRouterService.sendRequest<AIRecommendationsResponse>({
      userMessage,
      systemMessage: RECOMMENDATIONS_SYSTEM_MESSAGE,
      responseFormat: RECOMMENDATIONS_RESPONSE_FORMAT,
    });

    return response.data.recommendations;
  }
}
