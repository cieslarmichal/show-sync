import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Sparkles, X } from 'lucide-react';

import { generateRecommendations, checkRecommendationStatus, getRecommendations } from '../../api/queries/watchroom.ts';
import { getSeriesDetailsBatch } from '../../api/queries/getSeriesDetailsBatch.ts';
import { getMySeriesWatchlist } from '../../api/queries/getMySeriesWatchlist.ts';
import { getMySeriesRatings } from '../../api/queries/getMySeriesRatings.ts';
import { getMyQuota } from '../../api/queries/getMyQuota.ts';
import type { Recommendation } from '../../api/types/recommendation.ts';
import type { SeriesDetails } from '../../api/types/series.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { Skeleton } from '../ui/Skeleton.tsx';

import { RecommendationCard } from './RecommendationCard.tsx';
import { RecommendationFeedbackForm } from '../RecommendationFeedbackForm.tsx';

interface RecommendationWithDetails extends Recommendation {
  seriesDetails?: SeriesDetails;
}

interface RecommendationsSectionProps {
  watchroomId: string;
  isOwner: boolean;
  participantCount: number;
}

export function RecommendationsSection({
  watchroomId,
  isOwner,
  participantCount,
}: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<RecommendationWithDetails[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [watchlistSeriesIds, setWatchlistSeriesIds] = useState<Set<number>>(new Set());
  const [ratedSeriesIds, setRatedSeriesIds] = useState<Set<number>>(new Set());
  const [fadingOutCards, setFadingOutCards] = useState<Set<string>>(new Set());
  const [quota, setQuota] = useState<{ current: number; max: number } | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);
  const [isGuideDismissed, setIsGuideDismissed] = useState(() => {
    const dismissed = localStorage.getItem('recommendations-guide-dismissed');
    return dismissed === 'true';
  });
  const { t } = useTranslation();

  const fetchRecommendations = async () => {
    try {
      setIsLoadingRecommendations(true);
      const fetchedRecommendations = await getRecommendations(watchroomId);

      if (fetchedRecommendations.length === 0) {
        setRecommendations([]);
        return fetchedRecommendations;
      }

      const seriesIds = fetchedRecommendations.map((rec) => rec.seriesTmdbId);
      const batchDetails = await getSeriesDetailsBatch(seriesIds, true);
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
    const loadWatchlist = async () => {
      try {
        const response = await getMySeriesWatchlist();
        const watchlistIds = new Set(response.data.map((item) => item.seriesTmdbId));
        setWatchlistSeriesIds(watchlistIds);
      } catch {
        // Silently fail - not critical
      }
    };

    loadWatchlist();
  }, []);

  useEffect(() => {
    const loadRatings = async () => {
      try {
        const response = await getMySeriesRatings();
        const ratingIds = new Set(response.data.map((item) => item.seriesTmdbId));
        setRatedSeriesIds(ratingIds);
      } catch {
        // Silently fail - not critical
      }
    };

    loadRatings();
  }, []);

  const handleGenerateRecommendations = async () => {
    // Check quota before attempting
    if (isQuotaExhausted) {
      toast.error(t('watchroom.recommendations.toast.limitReached'), {
        description: t('watchroom.recommendations.toast.limitReachedDesc', { max: quota?.max }),
      });
      return;
    }

    try {
      setIsGenerating(true);

      const { recommendationRequestId } = await generateRecommendations(watchroomId);

      toast.success(t('watchroom.recommendations.toast.generatingSuccess'), {
        description: t('watchroom.recommendations.toast.generatingSuccessDesc'),
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

            toast.success(t('watchroom.recommendations.toast.readySuccess'), {
              description: t('watchroom.recommendations.toast.readySuccessDesc', {
                count: fetchedRecommendations.length,
              }),
            });
            setIsGenerating(false);
            return;
          }

          if (statusResult.status === 'failed') {
            toast.error(t('watchroom.recommendations.toast.generateError'), {
              description: t('watchroom.recommendations.toast.generateErrorDesc'),
            });
            setIsGenerating(false);
            return;
          }
        } catch {
          // Silently fail and continue polling
        }

        if (attempts >= maxAttempts) {
          toast.error(t('watchroom.recommendations.toast.takingLong'), {
            description: t('watchroom.recommendations.toast.takingLongDesc'),
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
        toast.error(t('watchroom.recommendations.toast.slowDown'), {
          description: t('watchroom.recommendations.toast.slowDownDesc'),
        });
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit exceeded')) {
        toast.error(t('watchroom.recommendations.toast.quotaError'), {
          description: t('watchroom.recommendations.toast.quotaErrorDesc'),
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
        toast.error(t('watchroom.recommendations.toast.generalError'));
      }
      setIsGenerating(false);
    }
  };

  const handleAddToWatchlist = (seriesTmdbId: number, recommendationId: string) => {
    setFadingOutCards((prev) => new Set(prev).add(recommendationId));
    setWatchlistSeriesIds((prev) => new Set(prev).add(seriesTmdbId));

    setTimeout(() => {
      setFadingOutCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recommendationId);
        return newSet;
      });
    }, 300);
  };

  const handleAddRating = (seriesTmdbId: number, recommendationId: string) => {
    setFadingOutCards((prev) => new Set(prev).add(recommendationId));
    setRatedSeriesIds((prev) => new Set(prev).add(seriesTmdbId));

    setTimeout(() => {
      setFadingOutCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recommendationId);
        return newSet;
      });
    }, 300);
  };

  const visibleRecommendations = recommendations.filter(
    (rec) => !watchlistSeriesIds.has(rec.seriesTmdbId) && !ratedSeriesIds.has(rec.seriesTmdbId),
  );

  const isQuotaExhausted = quota ? quota.current >= quota.max : false;
  const isNearLimit = quota ? quota.current >= quota.max - 2 : false;

  const handleDismissGuide = () => {
    setIsGuideDismissed(true);
    localStorage.setItem('recommendations-guide-dismissed', 'true');
  };

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="relative pb-4 sm:pb-5">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-lg bg-linear-to-br from-primary to-primary/70 flex items-center justify-center">
                <Sparkles className="w-4 sm:w-4.5 h-4 sm:h-4.5 text-primary-foreground" />
              </div>
              <CardTitle className="text-base sm:text-xl font-bold">{t('watchroom.recommendations.title')}</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              {t('watchroom.recommendations.description')}
            </CardDescription>
          </div>
          {isOwner && (
            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={handleGenerateRecommendations}
                disabled={isGenerating || isQuotaExhausted}
                className="shadow-sm hover:shadow-md transition-all disabled:opacity-50 h-9 sm:h-10 text-sm px-4"
                data-testid="generate-recommendations-button"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    {t('watchroom.recommendations.generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t('watchroom.recommendations.generate')}
                  </>
                )}
              </Button>
              {!isLoadingQuota && quota && (
                <span className={`text-xs sm:text-sm ${
                  isQuotaExhausted
                    ? 'text-destructive font-medium'
                    : isNearLimit
                    ? 'text-amber-600 dark:text-amber-500 font-medium'
                    : 'text-muted-foreground'
                }`}>
                  {t('watchroom.recommendations.dailyQuota', { current: quota.current, max: quota.max })}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-3 sm:pt-4">
        {isLoadingRecommendations ? (
          <div className="space-y-3 sm:space-y-4">
            <p className="text-[11px] sm:text-sm text-muted-foreground px-1">
              {t('watchroom.recommendations.loading')}
            </p>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border bg-card overflow-hidden"
              >
                {/* Mobile: Banner skeleton */}
                <Skeleton className="h-48 w-full sm:hidden" />
                {/* Desktop: Side-by-side skeleton */}
                <div className="flex gap-3 sm:gap-5 p-3 sm:p-5">
                  <Skeleton className="h-64 w-44 shrink-0 rounded-lg hidden sm:block" />
                  <div className="flex-1 space-y-1.5 sm:space-y-3">
                    <Skeleton className="h-4 sm:h-6 w-3/4" />
                    <div className="flex gap-1.5 sm:gap-2">
                      <Skeleton className="h-3 sm:h-5 w-12 sm:w-16" />
                      <Skeleton className="h-3 sm:h-5 w-10 sm:w-12" />
                      <Skeleton className="h-3 sm:h-5 w-12 sm:w-16" />
                    </div>
                    <Skeleton className="h-3 sm:h-4 w-full" />
                    <Skeleton className="h-3 sm:h-4 w-full hidden sm:block" />
                    <Skeleton className="h-3 sm:h-4 w-2/3 hidden sm:block" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="space-y-6">
            {/* Main CTA - Generate Recommendations */}
            <div className="text-center py-12 sm:py-16 md:py-20 px-4 sm:px-6">
              <div className="w-20 sm:w-28 md:w-32 h-20 sm:h-28 md:h-32 rounded-2xl bg-linear-to-br from-primary/30 via-primary/20 to-primary/10 mx-auto mb-6 sm:mb-8 flex items-center justify-center shadow-lg">
                <Sparkles className="w-10 sm:w-14 md:w-16 h-10 sm:h-14 md:h-16 text-primary animate-pulse" />
              </div>
              
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                {isOwner
                  ? t('watchroom.recommendations.readyToGenerate')
                  : t('watchroom.recommendations.waitingForOwner')}
              </h3>
              
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
                {isOwner ? (
                  t('watchroom.recommendations.clickGenerateDesc')
                ) : (
                  t('watchroom.recommendations.ownerWillGenerate')
                )}
              </p>

              {isOwner && (
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <p className="text-sm sm:text-base font-medium text-foreground">
                    {t('watchroom.recommendations.useButtonAbove')}
                  </p>
                </div>
              )}

              {participantCount < 2 && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-4">
                  {t('watchroom.recommendations.inviteOptional')}
                </p>
              )}
            </div>

            {/* Rating Guide - closable */}
            {!isGuideDismissed && (
              <div className="rounded-lg border-2 border-primary/20 bg-linear-to-br from-primary/5 via-primary/3 to-background p-4 sm:p-5 space-y-3 sm:space-y-4 relative">
                <Button
                  onClick={handleDismissGuide}
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 h-8 w-8"
                  aria-label="Dismiss guide"
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="space-y-1.5">
                  <h4 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                    {t('watchroom.recommendations.guideTitle')}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    {t('watchroom.recommendations.guideSubtitle')}
                  </p>
                </div>

                <div className="grid gap-2.5 sm:gap-3">
                  {/* Love Action */}
                  <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-background/60 border border-muted">
                    <span className="text-lg sm:text-xl shrink-0 mt-0.5">❤️</span>
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        {t('watchroom.recommendations.guideLoveTitle')}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                        {t('watchroom.recommendations.guideLoveDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Like Action */}
                  <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-background/60 border border-muted">
                    <span className="text-lg sm:text-xl shrink-0 mt-0.5">👍</span>
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        {t('watchroom.recommendations.guideLikeTitle')}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                        {t('watchroom.recommendations.guideLikeDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Dislike Action */}
                  <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-background/60 border border-muted">
                    <span className="text-lg sm:text-xl shrink-0 mt-0.5">👎</span>
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        {t('watchroom.recommendations.guideDislikeTitle')}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                        {t('watchroom.recommendations.guideDislikeDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Watchlist Action */}
                  <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-background/60 border border-muted">
                    <span className="text-lg sm:text-xl shrink-0 mt-0.5">🎬</span>
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        {t('watchroom.recommendations.guideWatchlistTitle')}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                        {t('watchroom.recommendations.guideWatchlistDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Not Interested Action */}
                  <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-background/60 border border-muted">
                    <span className="text-lg sm:text-xl shrink-0 mt-0.5">⏭️</span>
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        {t('watchroom.recommendations.guideNotInterestedTitle')}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                        {t('watchroom.recommendations.guideNotInterestedDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-2.5 sm:p-3 space-y-1">
                  <p className="text-xs sm:text-sm font-semibold text-primary flex items-center gap-1.5">
                    {t('watchroom.recommendations.guideProTip')}
                  </p>
                  <p className="text-[10px] sm:text-xs text-foreground/80 leading-relaxed">
                    {t('watchroom.recommendations.guideProTipDesc')}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-4">
              {visibleRecommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  isInWatchlist={watchlistSeriesIds.has(recommendation.seriesTmdbId)}
                  isRated={ratedSeriesIds.has(recommendation.seriesTmdbId)}
                  isFadingOut={fadingOutCards.has(recommendation.id)}
                  onAddToWatchlist={(seriesTmdbId) => handleAddToWatchlist(seriesTmdbId, recommendation.id)}
                  onAddRating={(seriesTmdbId) => handleAddRating(seriesTmdbId, recommendation.id)}
                />
              ))}
            </div>

            {/* Feedback Form */}
            {recommendations.length > 0 && recommendations[0]?.requestId && (
              <div className="mt-2">
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
