import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Sparkles, Info, Eye, EyeOff, X, Users } from 'lucide-react';

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog.tsx';

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

export function RecommendationsSection({ watchroomId, isOwner, participantCount }: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<RecommendationWithDetails[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [watchlistSeriesIds, setWatchlistSeriesIds] = useState<Set<number>>(new Set());
  const [ratedSeriesIds, setRatedSeriesIds] = useState<Set<number>>(new Set());
  const [fadingOutCards, setFadingOutCards] = useState<Set<string>>(new Set());
  const [quota, setQuota] = useState<{ current: number; max: number } | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);
  const [showNewRecommendations, setShowNewRecommendations] = useState(false);
  const [inviteHintDismissed, setInviteHintDismissed] = useState(() => {
    return localStorage.getItem('invite-hint-dismissed') === 'true';
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
            setShowNewRecommendations(true);
            setTimeout(() => setShowNewRecommendations(false), 1000);
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

  return (
    <Card className="border shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <CardHeader className="relative pb-4 sm:pb-5">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-lg bg-linear-to-br from-primary to-primary/70 flex items-center justify-center">
                <Sparkles className="w-4 sm:w-4.5 h-4 sm:h-4.5 text-primary-foreground" />
              </div>
              <CardTitle className="text-base sm:text-xl font-bold">{t('watchroom.recommendations.title')}</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-primary/10"
                  >
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold">{t('watchroom.recommendations.guideTitle')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{t('watchroom.recommendations.guideSubtitle')}</p>

                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3">
                        <span className="text-xl shrink-0">❤️</span>
                        <div>
                          <p className="text-sm font-semibold">{t('watchroom.recommendations.guideLoveTitle')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('watchroom.recommendations.guideLoveDesc')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="text-xl shrink-0">👍</span>
                        <div>
                          <p className="text-sm font-semibold">{t('watchroom.recommendations.guideLikeTitle')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('watchroom.recommendations.guideLikeDesc')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="text-xl shrink-0">👎</span>
                        <div>
                          <p className="text-sm font-semibold">{t('watchroom.recommendations.guideDislikeTitle')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('watchroom.recommendations.guideDislikeDesc')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Eye className="w-5 h-5 shrink-0 mt-0.5 text-foreground" />
                        <div>
                          <p className="text-sm font-semibold">{t('watchroom.recommendations.guideWatchlistTitle')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('watchroom.recommendations.guideWatchlistDesc')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <EyeOff className="w-5 h-5 shrink-0 mt-0.5 text-foreground" />
                        <div>
                          <p className="text-sm font-semibold">
                            {t('watchroom.recommendations.guideNotInterestedTitle')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('watchroom.recommendations.guideNotInterestedDesc')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs font-semibold text-foreground mb-1">
                        {t('watchroom.recommendations.guideProTip')}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t('watchroom.recommendations.guideProTipDesc')}
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              {t('watchroom.recommendations.description')}
            </CardDescription>
          </div>
          {isOwner && (
            <div className="flex flex-col items-end gap-2">
              <div className="relative inline-block">
                {!isGenerating && !isQuotaExhausted && recommendations.length === 0 && (
                  <div className="absolute -inset-0.5 bg-linear-to-r from-purple-600 via-pink-600 to-purple-600 rounded-lg blur-sm animate-pulse" />
                )}
                <Button
                  onClick={handleGenerateRecommendations}
                  disabled={isGenerating || isQuotaExhausted}
                  className={`shadow-lg hover:shadow-xl transition-all disabled:opacity-50 h-10 sm:h-11 text-sm px-6 relative min-w-[220px] ${
                    !isGenerating && !isQuotaExhausted && recommendations.length === 0
                      ? 'bg-linear-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary hover:to-primary'
                      : ''
                  }`}
                  data-testid="generate-recommendations-button"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin shrink-0" />
                      {t('watchroom.recommendations.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 shrink-0" />
                      {t('watchroom.recommendations.generate')}
                    </>
                  )}
                </Button>
              </div>
              {!isLoadingQuota && quota && (
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span
                      className={`${
                        isQuotaExhausted
                          ? 'text-destructive font-medium'
                          : isNearLimit
                            ? 'text-amber-600 dark:text-amber-500 font-medium'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {t('watchroom.recommendations.dailyQuota', { current: quota.current, max: quota.max })}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isQuotaExhausted ? 'bg-destructive' : isNearLimit ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{ width: `${(quota.current / quota.max) * 100}%` }}
                    />
                  </div>
                </div>
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

              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {isOwner
                  ? t('watchroom.recommendations.clickGenerateDesc')
                  : t('watchroom.recommendations.ownerWillGenerate')}
              </p>

              {participantCount < 2 && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-4">
                  {t('watchroom.recommendations.inviteOptional')}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Invite hint for solo users */}
            {participantCount === 1 && !inviteHintDismissed && (
              <div className="relative flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20">
                <Users className="w-5 h-5 text-primary shrink-0" />
                <p className="text-xs sm:text-sm text-muted-foreground flex-1">
                  {t('watchroom.recommendations.inviteHint')}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setInviteHintDismissed(true);
                    localStorage.setItem('invite-hint-dismissed', 'true');
                  }}
                  className="h-6 w-6 shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
            <div className={`space-y-4 ${showNewRecommendations ? 'animate-fade-in' : ''}`}>
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
