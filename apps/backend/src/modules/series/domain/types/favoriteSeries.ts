export const preferenceLevels = {
  like: 'like',
  love: 'love',
} as const;

export type PreferenceLevel = (typeof preferenceLevels)[keyof typeof preferenceLevels];

export interface FavoriteSeries {
  readonly id: string;
  readonly userId: string;
  readonly seriesTmdbId: number;
  readonly preferenceLevel: PreferenceLevel;
}
