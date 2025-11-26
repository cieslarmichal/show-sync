export interface Watchroom {
  readonly id: string;
  readonly name: string;
  readonly description?: string | undefined;
  readonly ownerId: string;
  readonly ownerName: string;
  readonly publicLinkId: string;
  readonly availablePlatforms: string[];
  readonly seriesLengthPreference: 'all' | 'excludeMiniSeries' | 'onlyMiniSeries';
  readonly createdAt: string;
  readonly participants: WatchroomParticipant[];
}

export interface WatchroomParticipant {
  readonly id: string;
  readonly name: string;
}

export interface WatchroomDetails extends Watchroom {
  readonly participants: WatchroomParticipant[];
}

export interface WatchroomWithParticipantCount extends Watchroom {
  readonly participantCount: number;
}

export interface PublicWatchroomDetails {
  readonly name: string;
  readonly description?: string | undefined;
  readonly ownerName: string;
  readonly participantCount: number;
}
