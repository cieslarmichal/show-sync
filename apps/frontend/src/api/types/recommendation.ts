export interface Recommendation {
  readonly id: string;
  readonly requestId: string;
  readonly seriesTmdbId: number;
  readonly justification: string;
}
