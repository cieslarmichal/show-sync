import type { RecommendationRequestRepository } from '../../../recommendation/domain/repositories/recommendationRequestRepository.ts';
import type { UserSeriesRatingRepository } from '../../../series/domain/repositories/userSeriesRatingRepository.ts';
import type { UserSeriesWatchlistRepository } from '../../../series/domain/repositories/userSeriesWatchlistRepository.ts';
import type { WatchroomRepository } from '../../../watchroom/domain/repositories/watchroomRepository.ts';

export interface GetUserStatsActionPayload {
  userId: string;
}

export interface GetUserStatsActionResult {
  ratingsCount: number;
  wantToWatchCount: number;
  watchRoomsCount: number;
  recommendationCount: number;
}

export class GetUserStatsAction {
  private readonly userSeriesRatingRepository: UserSeriesRatingRepository;
  private readonly userSeriesWatchlistRepository: UserSeriesWatchlistRepository;
  private readonly watchroomRepository: WatchroomRepository;
  private readonly recommendationRequestRepository: RecommendationRequestRepository;

  public constructor(
    userSeriesRatingRepository: UserSeriesRatingRepository,
    userSeriesWatchlistRepository: UserSeriesWatchlistRepository,
    watchroomRepository: WatchroomRepository,
    recommendationRequestRepository: RecommendationRequestRepository,
  ) {
    this.userSeriesRatingRepository = userSeriesRatingRepository;
    this.userSeriesWatchlistRepository = userSeriesWatchlistRepository;
    this.watchroomRepository = watchroomRepository;
    this.recommendationRequestRepository = recommendationRequestRepository;
  }

  public async execute(payload: GetUserStatsActionPayload): Promise<GetUserStatsActionResult> {
    const { userId } = payload;

    const [ratingsCount, wantToWatchCount, watchRoomsCount, recommendationCount] = await Promise.all([
      this.userSeriesRatingRepository.count(userId),
      this.userSeriesWatchlistRepository.count(userId, 'wantToWatch'),
      this.watchroomRepository.count(userId),
      this.recommendationRequestRepository.countCompleted(userId),
    ]);

    return {
      ratingsCount,
      wantToWatchCount,
      watchRoomsCount,
      recommendationCount,
    };
  }
}
