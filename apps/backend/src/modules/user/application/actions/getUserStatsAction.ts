import type { RecommendationRequestRepository } from '../../../recommendation/domain/repositories/recommendationRequestRepository.ts';
import type { FavoriteSeriesRepository } from '../../../series/domain/repositories/favoriteSeriesRepository.ts';
import type { WatchroomRepository } from '../../../watchroom/domain/repositories/watchroomRepository.ts';

export interface GetUserStatsActionPayload {
  userId: string;
}

export interface GetUserStatsActionResult {
  favoriteSeriesCount: number;
  watchRoomsCount: number;
  recommendationCount: number;
}

export class GetUserStatsAction {
  private readonly favoriteSeriesRepository: FavoriteSeriesRepository;
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRequestRepository: RecommendationRequestRepository;

  public constructor(
    favoriteSeriesRepository: FavoriteSeriesRepository,
    watchroomRepository: WatchroomRepository,
    recommendationRequestRepository: RecommendationRequestRepository,
  ) {
    this.favoriteSeriesRepository = favoriteSeriesRepository;
    this.watchroomRepository = watchroomRepository;
    this.recommendationRequestRepository = recommendationRequestRepository;
  }

  public async execute(payload: GetUserStatsActionPayload): Promise<GetUserStatsActionResult> {
    const { userId } = payload;

    const [favoriteSeriesCount, watchRoomsCount, recommendationCount] = await Promise.all([
      this.favoriteSeriesRepository.count(userId),
      this.watchroomRepository.count(userId),
      this.recommendationRequestRepository.countByUserId(userId),
    ]);

    return {
      favoriteSeriesCount,
      watchRoomsCount,
      recommendationCount,
    };
  }
}
