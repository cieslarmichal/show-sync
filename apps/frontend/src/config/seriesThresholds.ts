/**
 * Series rating thresholds for the application.
 * These values control when users can access certain features and the quality of AI recommendations.
 */

export const SERIES_THRESHOLDS = {
  // Minimum requirements to create a watch room
  MIN_TOTAL_FOR_ROOM: 5,
  MIN_LOVED_FOR_ROOM: 2,

  // Accuracy tiers for recommendations
  BASIC_ACCURACY: 5, // Minimum to get recommendations
  GOOD_ACCURACY: 8, // Good quality matches
  MAX_ACCURACY: 15, // Best possible matches

  // Setup requirements (shown in onboarding flow)
  MIN_LOVED_SETUP: 3, // Required loved series
  MIN_LIKED_SETUP: 8, // Required liked series
} as const;

export type SeriesThresholds = typeof SERIES_THRESHOLDS;
