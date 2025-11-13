import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Sparkles, TvMinimalPlay, ThumbsUp, Heart, EyeOff, Info } from 'lucide-react';

import { generateRecommendations, checkRecommendationStatus, getRecommendations } from '../../api/queries/watchroom.ts';
import { getSeriesDetailsBatch } from '../../api/queries/getSeriesDetailsBatch.ts';
import { getMyIgnoredSeries } from '../../api/queries/getMyIgnoredSeries.ts';
import { getMyFavoriteSeries } from '../../api/queries/getMyFavoriteSeries.ts';
import { getMyQuota } from '../../api/queries/getMyQuota.ts';
import type { Recommendation } from '../../api/types/recommendation.ts';
import type { SeriesDetails } from '../../api/types/series.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Skeleton } from '../ui/Skeleton.tsx';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/Tooltip.tsx';
import { RecommendationCard } from './RecommendationCard.tsx';
import { RecommendationFeedbackForm } from '../RecommendationFeedbackForm.tsx';

interface RecommendationWithDetails extends Recommendation {
  seriesDetails?: SeriesDetails;
}

interface RecommendationsSectionProps {
  watchroomId: string;
  isOwner: boolean;
  participantCount: number;
  onCopyLink: () => void;
}

export function RecommendationsSection({
  watchroomId,
  isOwner,
  participantCount,
  onCopyLink,
}: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<RecommendationWithDetails[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ignoredSeriesIds, setIgnoredSeriesIds] = useState<Set<number>>(new Set());
  const [profileSeriesIds, setProfileSeriesIds] = useState<Set<number>>(new Set());
  const [fadingOutCards, setFadingOutCards] = useState<Set<string>>(new Set());
  const [quota, setQuota] = useState<{ current: number; max: number } | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setIsLoadingRecommendations(true);
      const fetchedRecommendations = await getRecommendations(watchroomId);

      if (fetchedRecommendations.length === 0) {
        setRecommendations([]);
        return fetchedRecommendations;
      }

      const seriesIds = fetchedRecommendations.map((rec) => rec.seriesTmdbId);
      const batchDetails = await getSeriesDetailsBatch(seriesIds);
      const detailsMap = new Map(batchDetails.map((details) => [details.id, details]));

      const recommendationsWithDetails = fetchedRecommendations.map((rec) => ({
        ...rec,
        seriesDetails: detailsMap.get(rec.seriesTmdbId),
      }));

      setRecommendations(recommendationsWithDetails);
      return fetchedRecommendations;
    } catch {
      // Silently fail - recommendations might not exist yet
      setRecommendations([]);
      return [];
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchroomId]);

  useEffect(() => {
    const fetchQuota = async () => {
      if (!isOwner) return;

      try {
        setIsLoadingQuota(true);
        const quotaData = await getMyQuota();
        setQuota({
          current: quotaData.recommendationCount,
          max: quotaData.maxRecommendationCount,
        });
      } catch {
        // Silently fail - not critical
      } finally {
        setIsLoadingQuota(false);
      }
    };

    fetchQuota();
  }, [isOwner]);

  useEffect(() => {
    const loadIgnoredSeries = async () => {
      try {
        const response = await getMyIgnoredSeries();
        const ignoredIds = new Set(response.data.map((item) => item.seriesTmdbId));
        setIgnoredSeriesIds(ignoredIds);
      } catch {
        // Silently fail - not critical
      }
    };

    loadIgnoredSeries();
  }, []);

  useEffect(() => {
    const loadFavoriteSeries = async () => {
      try {
        const response = await getMyFavoriteSeries();
        const favoriteIds = new Set(response.data.map((item) => item.seriesTmdbId));
        setProfileSeriesIds(favoriteIds);
      } catch {
        // Silently fail - not critical
      }
    };

    loadFavoriteSeries();
  }, []);

  const handleGenerateRecommendations = async () => {
    // Check quota before attempting
    if (isQuotaExhausted) {
      toast.error('Recommendation limit reached', {
        description: `You've used all ${quota?.max} available generations. This limit helps us manage AI costs.`,
      });
      return;
    }

    try {
      setIsGenerating(true);

      const { recommendationRequestId } = await generateRecommendations(watchroomId);

      toast.success('Generating suggestions...', {
        description: 'This will take a moment. Results will be ready shortly.',
      });

      // Poll for status using requestId every 2 seconds, max 30 attempts (60 seconds total)
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = 2000;

      const pollForStatus = async (): Promise<void> => {
        attempts++;

        try {
          const statusResult = await checkRecommendationStatus(watchroomId, recommendationRequestId);

          if (statusResult.status === 'completed') {
            const fetchedRecommendations = await fetchRecommendations();

            // Refresh quota after successful generation
            try {
              const quotaData = await getMyQuota();
              setQuota({
                current: quotaData.recommendationCount,
                max: quotaData.maxRecommendationCount,
              });
            } catch {
              // Silently fail - not critical
            }

            toast.success('Suggestions ready!', {
              description: `Found ${fetchedRecommendations.length} shows for your watch room.`,
            });
            setIsGenerating(false);
            return;
          }

          if (statusResult.status === 'failed') {
            toast.error('Could not generate suggestions', {
              description: 'Something went wrong. Please try again.',
            });
            setIsGenerating(false);
            return;
          }
        } catch {
          // Silently fail and continue polling
        }

        if (attempts >= maxAttempts) {
          toast.error('This is taking longer than usual', {
            description: 'Give it a minute, then refresh the page.',
          });
          setIsGenerating(false);
          return;
        }

        setTimeout(() => pollForStatus(), pollInterval);
      };

      setTimeout(() => pollForStatus(), pollInterval);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not generate suggestions.';

      if (errorMessage.includes('Too many requests') || errorMessage.includes('Rate limit')) {
        toast.error('Slow down!', {
          description: 'Wait a moment before generating again (limit: 5 times per minute).',
        });
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit exceeded')) {
        toast.error('Recommendation limit reached', {
          description: 'You have reached your maximum number of recommendation generations.',
        });
        // Refresh quota to update UI
        try {
          const quotaData = await getMyQuota();
          setQuota({
            current: quotaData.recommendationCount,
            max: quotaData.maxRecommendationCount,
          });
        } catch {
          // Silently fail
        }
      } else {
        toast.error('Could not generate suggestions. Please try again.');
      }
      setIsGenerating(false);
    }
  };

  const handleIgnoreSeries = (seriesTmdbId: number, recommendationId: string) => {
    setFadingOutCards((prev) => new Set(prev).add(recommendationId));
    setIgnoredSeriesIds((prev) => new Set(prev).add(seriesTmdbId));

    setTimeout(() => {
      setFadingOutCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recommendationId);
        return newSet;
      });
    }, 300);
  };

  const handleFavoriteSeries = (seriesTmdbId: number, recommendationId: string) => {
    setFadingOutCards((prev) => new Set(prev).add(recommendationId));
    setProfileSeriesIds((prev) => new Set(prev).add(seriesTmdbId));

    setTimeout(() => {
      setFadingOutCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recommendationId);
        return newSet;
      });
    }, 300);
  };

  const visibleRecommendations = recommendations.filter(
    (rec) => !ignoredSeriesIds.has(rec.seriesTmdbId) && !profileSeriesIds.has(rec.seriesTmdbId),
  );

  const isQuotaExhausted = quota ? quota.current >= quota.max : false;
  const isNearLimit = quota ? quota.current >= quota.max - 2 : false;
  const remainingGenerations = quota ? Math.max(0, quota.max - quota.current) : null;

  return (
    <Card className="border shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <CardHeader className="relative pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Recommendations</CardTitle>
            </div>
            <CardDescription className="text-base">
              Get show suggestions based on what everyone likes.
              {isOwner && (
                <span className="block text-xs mt-1.5 text-muted-foreground/80">
                  Each generation creates fresh recommendations based on current preferences.
                </span>
              )}
            </CardDescription>
          </div>
          {isOwner && (
            <div className="sm:self-start flex flex-col items-end gap-2">
              <Button
                onClick={handleGenerateRecommendations}
                disabled={isGenerating || isQuotaExhausted}
                className="shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                data-testid="generate-recommendations-button"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
              {!isLoadingQuota && quota && (
                <div className="flex items-center gap-1.5 text-xs">
                  {isQuotaExhausted ? (
                    <span className="text-destructive font-medium flex items-center gap-1">
                      <span>
                        Limit reached ({quota.current}/{quota.max})
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="inline-flex">
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Limit helps manage AI costs</p>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  ) : isNearLimit ? (
                    <span className="text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1">
                      <span>
                        {remainingGenerations} {remainingGenerations === 1 ? 'generation' : 'generations'} left
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="inline-flex">
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Close to your {quota.max} generation limit</p>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <span>
                        {quota.current}/{quota.max} generations used
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="inline-flex">
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{quota.max} total generations across all watch rooms</p>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingRecommendations ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground px-1">Loading recommendations...</p>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border bg-card p-5"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <Skeleton className="h-36 w-full sm:w-24 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-primary/20 via-primary/10 to-primary/5 mx-auto mb-8 flex items-center justify-center shadow-inner">
              <TvMinimalPlay className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">No recommendations yet</h3>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {isOwner ? (
                participantCount < 2 ? (
                  <>
                    Invite at least one more person to generate recommendations.{' '}
                    <Button
                      variant="link"
                      onClick={onCopyLink}
                      className="text-primary hover:text-primary/80 underline underline-offset-2 font-semibold p-0 h-auto"
                    >
                      Copy invite link
                    </Button>
                  </>
                ) : (
                  'Click the "Generate" button above to get show suggestions for your group!'
                )
              ) : (
                'The room owner will generate recommendations when everyone has joined.'
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Instructions Callout */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                <ThumbsUp className="w-4 h-4 text-primary" />
                <span>Like or</span>
                <Heart className="w-4 h-4 text-red-600" />
                <span>Love the shows you enjoy</span>
                <span className="text-muted-foreground/50">•</span>
                <EyeOff className="w-4 h-4 text-muted-foreground" />
                <span>Skip to exclude them from future recommendations</span>
              </p>
            </div>

            {/* Recommendations Count Badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-sm font-semibold"
              >
                {visibleRecommendations.length}{' '}
                {visibleRecommendations.length === 1 ? 'recommendation' : 'recommendations'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                showing {visibleRecommendations.length} of {recommendations.length} total
              </span>
            </div>

            <div className="grid gap-8">
              {visibleRecommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  isIgnored={ignoredSeriesIds.has(recommendation.seriesTmdbId)}
                  isFavorite={profileSeriesIds.has(recommendation.seriesTmdbId)}
                  isFadingOut={fadingOutCards.has(recommendation.id)}
                  onIgnore={(seriesTmdbId) => handleIgnoreSeries(seriesTmdbId, recommendation.id)}
                  onFavorite={(seriesTmdbId) => handleFavoriteSeries(seriesTmdbId, recommendation.id)}
                />
              ))}
            </div>

            {/* Feedback Form */}
            {recommendations.length > 0 && recommendations[0]?.requestId && (
              <div className="mt-8">
                <RecommendationFeedbackForm
                  watchroomId={watchroomId}
                  recommendationRequestId={recommendations[0].requestId}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
