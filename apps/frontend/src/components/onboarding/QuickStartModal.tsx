import { useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Heart, ThumbsUp, Sparkles } from 'lucide-react';

import { getPopularSeries } from '../../api/queries/getPopularSeries';
import { addSeriesRating } from '../../api/queries/addSeriesRating';
import type { Series, Rating } from '../../api/types/series';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { ScrollArea } from '../ui/ScrollArea';
import { Skeleton } from '../ui/Skeleton';
import { SeriesContext } from '../../context/SeriesContext';
import { config } from '../../config';

interface QuickStartModalProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

type RatingState = Rating | null;

export function QuickStartModal({ open, onComplete, onSkip }: QuickStartModalProps) {
  const { t } = useTranslation();
  const { refreshCounts, ratings: contextRatings } = useContext(SeriesContext);
  const [popularSeries, setPopularSeries] = useState<Series[]>([]);
  const [ratings, setRatings] = useState<Map<number, RatingState>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadPopularSeries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contextRatings]);

  const loadPopularSeries = async () => {
    try {
      setIsLoading(true);
      const series = await getPopularSeries();
      setPopularSeries(series);

      // Initialize ratings map with existing ratings from context
      setRatings(new Map(contextRatings));
    } catch {
      toast.error(t('dashboard.quickStart.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = async (seriesId: number, rating: RatingState) => {
    if (isSubmitting) return;

    const previousRating = ratings.get(seriesId);

    // Don't allow same rating click (no toggle off)
    if (previousRating === rating) {
      return;
    }

    // Update local state immediately for responsive UI
    setRatings((prev) => {
      const newRatings = new Map(prev);
      newRatings.set(seriesId, rating);
      return newRatings;
    });

    try {
      // Make API call with new rating
      if (rating) {
        await addSeriesRating(seriesId, rating);

        // Positive feedback only when reaching milestone for first time
        if (rating === 'love' || rating === 'like') {
          const progress = Array.from(ratings.values()).filter((r) => r === 'like' || r === 'love').length;
          const previousProgress = previousRating === 'like' || previousRating === 'love' ? progress : progress - 1;

          if (
            progress === config.series.minRatedShowsToCreateWatchRoom &&
            previousProgress < config.series.minRatedShowsToCreateWatchRoom
          ) {
            toast.success(t('dashboard.quickStart.milestoneReached'));
          }
        }
      }
    } catch {
      // Revert on error
      setRatings((prev) => {
        const newRatings = new Map(prev);
        if (previousRating) {
          newRatings.set(seriesId, previousRating);
        } else {
          newRatings.delete(seriesId);
        }
        return newRatings;
      });
      toast.error(t('dashboard.quickStart.errorRating'));
    }
  };

  const ratedCount = Array.from(ratings.values()).filter((r) => r === 'like' || r === 'love').length;
  const canComplete = ratedCount >= config.series.minRatedShowsToCreateWatchRoom;
  const isAtGoodAccuracy = ratedCount >= config.series.goodAccuracy;

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await refreshCounts();
      const message = isAtGoodAccuracy
        ? t('dashboard.quickStart.perfectForRecs')
        : t('dashboard.quickStart.rateMoreForBetter');
      toast.success(t('dashboard.quickStart.successTitle'), {
        description: t('dashboard.quickStart.successDescription', { count: ratedCount, message }),
      });
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isSubmitting) {
          onSkip();
        }
      }}
    >
      <DialogContent className="w-[95vw] sm:max-w-[85vw] md:max-w-[80vw] lg:max-w-[75vw] xl:max-w-[70vw] max-h-[90vh] p-0 z-100 flex flex-col">
        {/* Sticky Header with Progress */}
        <DialogHeader className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 border-b shrink-0 sticky top-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 z-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <DialogTitle className="text-base sm:text-lg">{t('dashboard.quickStart.title')}</DialogTitle>
              </div>
              {/* Compact progress indicator */}
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-muted-foreground">
                  {ratedCount}/{config.series.goodAccuracy}
                </span>
                {isAtGoodAccuracy && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('dashboard.quickStart.perfect')}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <span className="sm:hidden">{t('dashboard.quickStart.instructionMobile')}</span>
              <span className="hidden sm:inline">{t('dashboard.quickStart.instruction')}</span>
            </p>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="space-y-2 pt-4">
            <Progress
              value={ratedCount}
              max={config.series.goodAccuracy}
              milestones={[
                { value: config.series.minRatedShowsToCreateWatchRoom, label: 'Min', color: 'bg-primary' },
                { value: config.series.goodAccuracy, label: 'Good', color: 'bg-emerald-500' },
              ]}
              showMilestones={true}
              className="h-2.5"
            />
            {ratedCount < config.series.minRatedShowsToCreateWatchRoom && (
              <p className="text-xs text-muted-foreground text-center">
                {t('dashboard.quickStart.rateMoreHint', {
                  count: config.series.minRatedShowsToCreateWatchRoom - ratedCount,
                })}
              </p>
            )}
          </div>
        </DialogHeader>

        {/* Series Grid */}
        <ScrollArea className="flex-1 overflow-auto px-4 sm:px-6 lg:px-10">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-5 sm:gap-6 lg:gap-8 py-8">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="space-y-3"
                >
                  <Skeleton className="aspect-2/3 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-5 sm:gap-6 lg:gap-8 py-8">
              {popularSeries.map((series) => (
                <SeriesQuickRateCard
                  key={series.id}
                  series={series}
                  currentRating={ratings.get(series.id) || null}
                  onRate={handleRate}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-t bg-muted/20 shrink-0">
          <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              onClick={onSkip}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {t('dashboard.quickStart.skipButton')}
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!canComplete || isSubmitting}
              size="lg"
              className={
                canComplete
                  ? 'w-full sm:w-auto sm:min-w-40 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200'
                  : 'w-full sm:w-auto sm:min-w-40'
              }
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {t('dashboard.quickStart.savingButton')}
                </span>
              ) : !canComplete ? (
                <>
                  {t('dashboard.quickStart.rateMore', {
                    count: config.series.minRatedShowsToCreateWatchRoom - ratedCount,
                  })}
                </>
              ) : isAtGoodAccuracy ? (
                <span className="flex items-center gap-2 animate-in fade-in duration-300">
                  {t('dashboard.quickStart.letsGo')}
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {t('dashboard.quickStart.continueButton')}
                  <Sparkles className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SeriesQuickRateCardProps {
  series: Series;
  currentRating: RatingState;
  onRate: (seriesId: number, rating: RatingState) => void;
  disabled?: boolean;
}

function SeriesQuickRateCard({ series, currentRating, onRate, disabled }: SeriesQuickRateCardProps) {
  const { t } = useTranslation();
  const posterUrl = series.posterPath ? `https://image.tmdb.org/t/p/w500${series.posterPath}` : null;

  return (
    <div className="group relative space-y-3">
      {/* Poster */}
      <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-muted shadow-sm hover:shadow-lg transition-all duration-200 ring-2 ring-transparent hover:ring-primary/20">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={series.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
            {series.name}
          </div>
        )}

        {/* Series info badge - top */}
        {series.firstAirDate && (
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-medium text-white z-10">
            {new Date(series.firstAirDate).getFullYear()}
          </div>
        )}

        {/* Bottom gradient - always visible */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/80 via-black/50 to-transparent pointer-events-none" />

        {/* Overlay with actions - simplified to 2 options */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end pb-4 sm:pb-5 px-3">
          <div className="flex gap-2 sm:gap-3 w-full justify-center">
            <Button
              size="sm"
              variant={currentRating === 'love' ? 'default' : 'secondary'}
              onClick={() => onRate(series.id, 'love')}
              className={
                currentRating === 'love'
                  ? 'h-11 w-11 sm:h-12 sm:w-12 p-0 shrink-0 bg-red-600 hover:bg-red-700 text-white border-2 border-white/30 shadow-lg scale-110 transition-transform'
                  : 'h-11 w-11 sm:h-12 sm:w-12 p-0 shrink-0 bg-red-600/80 hover:bg-red-600 text-white border-2 border-white/20 hover:scale-105 transition-transform'
              }
              disabled={disabled}
              title={t('dashboard.quickStart.loveTooltip')}
              aria-label={t('dashboard.quickStart.loveLabel')}
            >
              <Heart
                className={currentRating === 'love' ? 'w-5 h-5 sm:w-6 sm:h-6 fill-current' : 'w-5 h-5 sm:w-6 sm:h-6'}
              />
            </Button>
            <Button
              size="sm"
              variant={currentRating === 'like' ? 'default' : 'secondary'}
              onClick={() => onRate(series.id, 'like')}
              className={
                currentRating === 'like'
                  ? 'h-11 w-11 sm:h-12 sm:w-12 p-0 shrink-0 bg-primary hover:bg-primary/90 text-white border-2 border-white/30 shadow-lg scale-110 transition-transform'
                  : 'h-11 w-11 sm:h-12 sm:w-12 p-0 shrink-0 bg-white/90 hover:bg-white text-foreground border-2 border-white/20 hover:scale-105 transition-transform'
              }
              disabled={disabled}
              title={t('dashboard.quickStart.likeTooltip')}
              aria-label={t('dashboard.quickStart.likeLabel')}
            >
              <ThumbsUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>
        </div>

        {/* Current rating badge with animation */}
        {currentRating && currentRating !== 'dislike' && (
          <div className="absolute top-2 right-2 bg-linear-to-br from-primary to-primary/80 rounded-full p-2.5 shadow-xl z-10 animate-in zoom-in-50 duration-300">
            {currentRating === 'love' && (
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-white drop-shadow" />
            )}
            {currentRating === 'like' && <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow" />}
          </div>
        )}
      </div>

      {/* Series title */}
      <div className="text-center px-1">
        <h3 className="text-xs sm:text-sm font-semibold line-clamp-2 leading-tight">{series.name}</h3>
      </div>
    </div>
  );
}
