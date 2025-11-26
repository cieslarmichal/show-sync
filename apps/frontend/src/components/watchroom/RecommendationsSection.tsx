import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Sparkles, TvMinimalPlay, Info } from 'lucide-react';

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
  const [watchlistSeriesIds, setWatchlistSeriesIds] = useState<Set<number>>(new Set());
  const [ratedSeriesIds, setRatedSeriesIds] = useState<Set<number>>(new Set());
  const [fadingOutCards, setFadingOutCards] = useState<Set<string>>(new Set());
  const [quota, setQuota] = useState<{ current: number; max: number } | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);
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
  const remainingGenerations = quota ? Math.max(0, quota.max - quota.current) : null;

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-linear-to-br from-primary to-primary/70 flex items-center justify-center">
                <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-primary-foreground" />
              </div>
              <CardTitle className="text-sm sm:text-lg font-bold">{t('watchroom.recommendations.title')}</CardTitle>
            </div>
            <CardDescription className="text-[11px] sm:text-xs hidden sm:block">
              {t('watchroom.recommendations.description')}
            </CardDescription>
          </div>
          {isOwner && (
            <div className="flex flex-col items-end gap-1.5">
              <Button
                onClick={handleGenerateRecommendations}
                disabled={isGenerating || isQuotaExhausted}
                className="shadow-sm hover:shadow-md transition-all disabled:opacity-50 h-8 text-xs"
                data-testid="generate-recommendations-button"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    {t('watchroom.recommendations.generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    {t('watchroom.recommendations.generate')}
                  </>
                )}
              </Button>
              {!isLoadingQuota && quota && (
                <div className="flex items-center gap-1 text-xs">
                  {isQuotaExhausted ? (
                    <>
                      <span className="text-destructive font-medium">
                        {t('watchroom.recommendations.limitReached', { current: quota.current, max: quota.max })}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="inline-flex">
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('watchroom.recommendations.limitInfo')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  ) : isNearLimit ? (
                    <>
                      <span className="text-amber-600 dark:text-amber-500 font-medium">
                        {t('watchroom.recommendations.remaining', { count: remainingGenerations ?? 0 })}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="inline-flex">
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('watchroom.recommendations.nearLimitInfo', { max: quota.max })}</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground">
                        {t('watchroom.recommendations.used', { current: quota.current, max: quota.max })}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="inline-flex">
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('watchroom.recommendations.usedInfo', { max: quota.max })}</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2 sm:pt-3">
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
          <div className="text-center py-8 sm:py-12 md:py-16 px-3 sm:px-6">
            <div className="w-14 sm:w-20 md:w-24 h-14 sm:h-20 md:h-24 rounded-2xl bg-linear-to-br from-primary/20 via-primary/10 to-primary/5 mx-auto mb-3 sm:mb-6 md:mb-8 flex items-center justify-center shadow-inner">
              <TvMinimalPlay className="w-7 sm:w-10 md:w-12 h-7 sm:h-10 md:h-12 text-primary animate-pulse" />
            </div>
            <h3 className="text-sm sm:text-lg md:text-xl font-bold text-foreground mb-2 sm:mb-3">
              {t('watchroom.recommendations.noRecommendations')}
            </h3>
            <p className="text-[11px] sm:text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {isOwner ? (
                participantCount < 2 ? (
                  <>
                    {t('watchroom.recommendations.inviteMore')}{' '}
                    <button
                      onClick={onCopyLink}
                      className="text-primary hover:text-primary/80 underline underline-offset-2 font-semibold transition-colors inline-flex items-center gap-1"
                    >
                      {t('watchroom.recommendations.copyInvite')}
                    </button>
                  </>
                ) : (
                  t('watchroom.recommendations.clickGenerate')
                )
              ) : (
                t('watchroom.recommendations.ownerGenerates')
              )}
            </p>
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

            {/* Instructions Callout - at bottom after seeing recommendations */}
            <div className="rounded-lg border border-muted bg-muted/30 p-2.5 sm:p-3 space-y-1">
              <div className="flex items-start gap-1.5 sm:gap-2">
                <Info className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-xs">
                  <p className="font-semibold text-foreground text-xs sm:text-sm">
                    {t('watchroom.recommendations.howItWorks')}
                  </p>
                  <ul className="space-y-0.5 text-muted-foreground leading-relaxed">
                    <li>{t('watchroom.recommendations.loveAction')}</li>
                    <li>{t('watchroom.recommendations.watchlistAction')}</li>
                    <li>{t('watchroom.recommendations.notInterestedAction')}</li>
                    <li className="text-[10px] sm:text-[11px] italic pt-0.5">
                      {t('watchroom.recommendations.actionInfo')}
                    </li>
                    <li className="text-[10px] sm:text-[11px] italic pt-0.5">
                      {t('watchroom.recommendations.descriptionTip')}
                    </li>
                  </ul>
                </div>
              </div>
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
