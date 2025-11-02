import { ForbiddenAccessError } from '../../../../common/errors/forbiddenAccessError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { OpenRouterService } from '../../../../common/openRouter/openRouterService.ts';
import type { ResponseFormat } from '../../../../common/openRouter/types.ts';
import type { FavoriteSeriesRepository } from '../../../series/domain/repositories/favoriteSeriesRepository.ts';
import type { IgnoredSeriesRepository } from '../../../series/domain/repositories/ignoredSeriesRepository.ts';
import type { TmdbService } from '../../../series/domain/services/tmdbService.ts';
import type { RecommendationRepository } from '../../domain/repositories/recommendationRepository.ts';
import type { WatchroomRepository } from '../../domain/repositories/watchroomRepository.ts';

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

const recommendationsResponseFormat: ResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'recommendations_response',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              seriesName: {
                type: 'string',
                description: 'The name of the recommended series',
              },
              justification: {
                type: 'string',
                description: 'Explanation of why this series fits the group',
              },
            },
            required: ['seriesName', 'justification'],
            additionalProperties: false,
          },
        },
      },
      required: ['recommendations'],
      additionalProperties: false,
    },
  },
} as const;

const systemMessage = `You are an expert TV series recommender AI specializing in group recommendations.

Your expertise includes:
- Deep knowledge of TV series across all genres, eras, and platforms
- Understanding of thematic connections, narrative styles, and tonal similarities between shows
- Ability to identify common ground among diverse viewer preferences
- Recognition of emerging trends and hidden gems that match specific tastes

Core principles:
1. NEVER recommend series that are already in the user's favorites or ignored lists
2. PRIORITIZE matching LOVED series (❤️) over LIKED series (👍)
3. LOVED series represent core preferences - these are the most important signals
4. LIKED series provide context but shouldn't dominate the recommendation logic
5. When multiple participants LOVE similar themes/genres, that's your strongest signal
6. Consider both obvious and subtle connections (themes, mood, pacing, character types)
7. Balance popular acclaimed series with lesser-known quality recommendations
8. Ensure all recommended titles exist and use their exact TMDB names

Your recommendations should be thoughtful, well-justified, and demonstrate clear understanding of why each series would resonate with the group based on their collective preferences, especially their LOVED series.`;

export class GenerateRecommendationsAction {
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRepository: RecommendationRepository;
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;
  private readonly ignoredSeriesRepository: IgnoredSeriesRepository;
  private readonly tmdbService: TmdbService;
  private readonly openRouterService: OpenRouterService;
  private readonly loggerService: LoggerService;

  public constructor(
    watchroomRepository: WatchroomRepository,
    recommendationRepository: RecommendationRepository,
    favoriteSeriesRepository: FavoriteSeriesRepository,
    ignoredSeriesRepository: IgnoredSeriesRepository,
    tmdbService: TmdbService,
    openRouterService: OpenRouterService,
    loggerService: LoggerService,
  ) {
    this.watchroomRepository = watchroomRepository;
    this.recommendationRepository = recommendationRepository;
    this.favoriteSeriesRepository = favoriteSeriesRepository;
    this.ignoredSeriesRepository = ignoredSeriesRepository;
    this.tmdbService = tmdbService;
    this.openRouterService = openRouterService;
    this.loggerService = loggerService;
  }

  public async execute(payload: GenerateRecommendationsActionPayload): Promise<GenerateRecommendationsActionResult> {
    const { watchroomId, userId, requestId } = payload;

    this.loggerService.info({
      message: 'Generating recommendations for watchroom',
      watchroomId,
      requestId,
    });

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

    const participantIds = [watchroom.ownerId, ...watchroom.participants.map((p) => p.id)];

    const participantFavorites = await this.fetchParticipantFavorites(participantIds);
    const participantIgnored = await this.fetchParticipantIgnored(participantIds);

    const allIgnoredSeriesIds = [...new Set(participantIgnored.flatMap((p) => p.seriesTmdbIds))];
    const allSeriesIds = [
      ...new Set([...participantFavorites.flatMap((p) => [...p.lovedSeriesIds, ...p.likedSeriesIds])]),
    ];

    const seriesInfoMap = await this.fetchSeriesInfo(allSeriesIds);

    if (allSeriesIds.length - seriesInfoMap.size > 0) {
      this.loggerService.warn({
        message: 'Some series details could not be fetched from TMDB',
        watchroomId,
        requestId,
        failedCount: allSeriesIds.length - seriesInfoMap.size,
        totalSeries: allSeriesIds.length,
      });
    }

    const aiRecommendations = await this.generateAIRecommendations(
      participantFavorites,
      allIgnoredSeriesIds,
      seriesInfoMap,
      watchroom.name,
      watchroom.description,
    );

    const {
      resolved: resolvedRecommendations,
      failed: failedTitles,
      skipped: skippedTitles,
    } = await this.resolveSeriesNames(aiRecommendations, allSeriesIds, allIgnoredSeriesIds);

    if (failedTitles.length > 0 || skippedTitles.length > 0) {
      this.loggerService.warn({
        message: 'Some AI recommendations were skipped or failed to be resolved to TMDB series',
        watchroomId,
        requestId,
        aiRecommendationCount: aiRecommendations.length,
        resolvedCount: resolvedRecommendations.length,
        failedCount: failedTitles.length,
        failedTitles,
        skippedCount: skippedTitles.length,
        skippedTitles,
      });
    }

    await this.recommendationRepository.deleteAllByWatchroomId(watchroomId);

    const recommendations = await Promise.all(
      resolvedRecommendations.map((rec) =>
        this.recommendationRepository.create({
          watchroomId,
          requestId,
          seriesTmdbId: rec.seriesTmdbId,
          justification: rec.justification,
        }),
      ),
    );

    this.loggerService.info({
      message: 'Recommendations generated and saved successfully',
      watchroomId,
      requestId,
      resolvedCount: recommendations.length,
    });

    return { requestId };
  }

  private async fetchParticipantFavorites(
    participantIds: string[],
  ): Promise<Array<{ participantId: string; lovedSeriesIds: number[]; likedSeriesIds: number[] }>> {
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

  private async fetchParticipantIgnored(
    participantIds: string[],
  ): Promise<Array<{ participantId: string; seriesTmdbIds: number[] }>> {
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

  private async resolveSeriesNames(
    recommendations: AIRecommendation[],
    favoritesSeriesIds: number[],
    ignoredSeriesIds: number[],
  ): Promise<{
    resolved: Array<{ seriesTmdbId: number; justification: string }>;
    failed: string[];
    skipped: string[];
  }> {
    const results = await Promise.allSettled(
      recommendations.map(async (recommendation) => {
        const searchResult = await this.tmdbService.searchSeries({
          query: recommendation.seriesName,
          page: 1,
        });

        if (searchResult.results.length === 0) {
          return { type: 'failed' as const, seriesName: recommendation.seriesName };
        }

        const firstResult = searchResult.results[0];

        if (!firstResult) {
          return { type: 'failed' as const, seriesName: recommendation.seriesName };
        }

        if (favoritesSeriesIds.includes(firstResult.id) || ignoredSeriesIds.includes(firstResult.id)) {
          return { type: 'skipped' as const, seriesName: recommendation.seriesName };
        }

        return {
          type: 'resolved' as const,
          seriesTmdbId: firstResult.id,
          justification: recommendation.justification,
        };
      }),
    );

    const resolvedRecommendations: Array<{ seriesTmdbId: number; justification: string }> = [];
    const failedTitles: string[] = [];
    const skippedTitles: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.type === 'resolved') {
          resolvedRecommendations.push({
            seriesTmdbId: result.value.seriesTmdbId,
            justification: result.value.justification,
          });
        } else if (result.value.type === 'failed') {
          failedTitles.push(result.value.seriesName);
        } else {
          skippedTitles.push(result.value.seriesName);
        }
      } else {
        const recommendation = recommendations[index];
        if (recommendation) {
          failedTitles.push(recommendation.seriesName);
        }
      }
    });

    return { resolved: resolvedRecommendations, failed: failedTitles, skipped: skippedTitles };
  }

  private async generateAIRecommendations(
    participantFavorites: Array<{ participantId: string; lovedSeriesIds: number[]; likedSeriesIds: number[] }>,
    ignoredSeriesIds: number[],
    seriesInfoMap: Map<number, SeriesInfo>,
    watchroomName: string,
    watchroomDescription: string | undefined,
  ): Promise<AIRecommendation[]> {
    const userMessage = this.buildPromptMessage(
      participantFavorites,
      ignoredSeriesIds,
      seriesInfoMap,
      watchroomName,
      watchroomDescription,
    );

    const response = await this.openRouterService.sendRequest<AIRecommendationsResponse>({
      userMessage,
      systemMessage,
      responseFormat: recommendationsResponseFormat,
    });

    return response.data.recommendations;
  }

  private buildPromptMessage(
    participantFavorites: Array<{ participantId: string; lovedSeriesIds: number[]; likedSeriesIds: number[] }>,
    ignoredSeriesIds: number[],
    seriesInfoMap: Map<number, SeriesInfo>,
    watchroomName: string,
    watchroomDescription: string | undefined,
  ): string {
    const participantsWithFavorites = participantFavorites.filter(
      (p) => p.lovedSeriesIds.length > 0 || p.likedSeriesIds.length > 0,
    );

    let message = `WATCH ROOM: "${watchroomName}"\n`;
    if (watchroomDescription) {
      message += `Description: ${watchroomDescription}\n`;
      message += `Use this description to understand the group's overall vibe and preferences.\n`;
    }

    message += `\n---\n`;
    message += `PARTICIPANTS AND THEIR SERIES PREFERENCES:\n`;
    message += `These series are ALREADY WATCHED. DO NOT recommend any of these.\n`;
    message += `Pay special attention to LOVED series - these represent the strongest preferences.\n\n`;

    participantsWithFavorites.forEach((participant, index) => {
      message += `Participant ${(index + 1).toString()}:\n\n`;

      if (participant.lovedSeriesIds.length > 0) {
        message += `  ❤️ LOVED (HIGHEST PRIORITY - Core preferences):\n`;
        participant.lovedSeriesIds.forEach((tmdbId) => {
          const seriesInfo = seriesInfoMap.get(tmdbId);
          if (seriesInfo) {
            const firstOverviewSentence = seriesInfo.overview.split(/[.!?]/)[0];
            const summary = firstOverviewSentence ? firstOverviewSentence + '.' : '';

            message += `  - ${seriesInfo.name}\n`;
            message += `    Genres: ${seriesInfo.genres.join(', ')}\n`;
            message += `    Summary: ${summary}\n`;
            message += `    Rating: ${seriesInfo.voteAverage.toFixed(1)}/10\n`;
          }
        });
        message += '\n';
      }

      if (participant.likedSeriesIds.length > 0) {
        message += `  👍 LIKED (Secondary preferences):\n`;
        participant.likedSeriesIds.forEach((tmdbId) => {
          const seriesInfo = seriesInfoMap.get(tmdbId);
          if (seriesInfo) {
            message += `  - ${seriesInfo.name} (${seriesInfo.genres.join(', ')})\n`;
          }
        });
        message += '\n';
      }

      message += '\n';
    });

    message += `\n---\n`;
    if (ignoredSeriesIds.length > 0) {
      const ignoredNames: string[] = [];
      for (const tmdbId of ignoredSeriesIds) {
        const seriesInfo = seriesInfoMap.get(tmdbId);
        if (seriesInfo) {
          ignoredNames.push(seriesInfo.name);
        }
      }
      if (ignoredNames.length > 0) {
        message += `SERIES MARKED AS NOT INTERESTED:\n`;
        message += `These series are explicitly NOT wanted. DO NOT recommend any of these.\n`;
        message += `${ignoredNames.join(', ')}\n`;
        message += `\n---\n`;
      }
    }

    message += `TASK:\n`;
    message += `Recommend 5-10 BRAND NEW TV series that this group would likely enjoy watching together.\n`;
    message += `\n`;
    message += `CRITICAL REQUIREMENTS:\n`;
    message += `1. Do NOT include ANY series from the "FAVORITE SERIES" lists above\n`;
    message += `2. Do NOT include ANY series from the "NOT INTERESTED" list above\n`;
    message += `3. Only recommend series that are DIFFERENT from those already listed\n`;
    message += `4. Focus on finding shows that reflect shared themes, genres, tones, or storytelling styles\n`;
    message += `5. Return the EXACT TITLE of each series as it appears in TMDB (The Movie Database)\n`;
    message += `6. Provide a brief justification for each recommendation explaining why it fits the group's taste\n`;
    message += `\n`;
    message += `RECOMMENDATION STRATEGY:\n`;
    message += `1. PRIORITIZE finding shows similar to ❤️ LOVED series - these are the strongest signals\n`;
    message += `2. Use 👍 LIKED series as secondary signals to understand broader taste\n`;
    message += `3. Look for thematic overlaps in LOVED series across participants\n`;
    message += `4. When multiple participants LOVE similar genres/themes, that's a very strong signal\n`;
    message += `5. LIKED series help understand edge cases but shouldn't dominate recommendations\n`;
    message += `\n`;
    message += `Remember: The goal is to find NEW series, not to repeat what they already know or dislike.`;

    return message;
  }
}
