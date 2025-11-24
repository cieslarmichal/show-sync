import type { UserSeriesWatchlistRepository } from '../../domain/repositories/userSeriesWatchlistRepository.ts';
import type { UserSeriesWatchlist, WatchlistType } from '../../domain/types/userSeriesWatchlist.ts';

export interface GetSeriesWatchlistPayload {
  readonly userId: string;
  readonly page: number;
  readonly pageSize: number;
  readonly type?: WatchlistType | undefined;
}

export interface GetSeriesWatchlistResult {
  readonly data: UserSeriesWatchlist[];
  readonly total: number;
}

export class GetSeriesWatchlistAction {
  private readonly seriesWatchlistRepository: UserSeriesWatchlistRepository;

  public constructor(seriesWatchlistRepository: UserSeriesWatchlistRepository) {
    this.seriesWatchlistRepository = seriesWatchlistRepository;
  }

  public async execute(payload: GetSeriesWatchlistPayload): Promise<GetSeriesWatchlistResult> {
    const { userId, page, pageSize, type } = payload;

    const [data, total] = await Promise.all([
      this.seriesWatchlistRepository.findMany(userId, page, pageSize, type),
      this.seriesWatchlistRepository.count(userId, type),
    ]);

    return { data, total };
  }
}
