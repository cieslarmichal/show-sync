export interface WatchroomParticipant {
  readonly id: string;
  readonly name: string;
}

export interface Watchroom {
  readonly id: string;
  readonly name: string;
  readonly description?: string | undefined;
  readonly ownerId: string;
  readonly ownerName: string;
  readonly publicLinkId: string;
  readonly availablePlatforms: string[];
  readonly seriesLengthPreference: 'all' | 'excludeMiniSeries' | 'onlyMiniSeries';
  readonly createdAt: Date;
  readonly participants: WatchroomParticipant[];
}
