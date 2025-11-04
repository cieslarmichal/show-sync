export interface Recommendation {
  readonly id: string;
  readonly recommendationRequestId: string;
  readonly seriesTmdbId: number;
  readonly justification: string;
}
