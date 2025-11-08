import { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, TvMinimalPlay, EyeOff, ThumbsUp, Heart, Star, ExternalLink } from 'lucide-react';

import { getSeriesExternalIds } from '../../api/queries/getSeriesExternalIds.ts';
import { addIgnoredSeries } from '../../api/queries/addIgnoredSeries.ts';
import { addFavoriteSeries } from '../../api/queries/addFavoriteSeries.ts';
import type { Recommendation } from '../../api/types/recommendation.ts';
import type { SeriesDetails } from '../../api/types/series.ts';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Skeleton } from '../ui/Skeleton.tsx';

interface RecommendationWithDetails extends Recommendation {
  seriesDetails?: SeriesDetails;
}

interface RecommendationCardProps {
  recommendation: RecommendationWithDetails;
  isIgnored: boolean;
  isFavorite: boolean;
  isFadingOut: boolean;
  onIgnore: (seriesTmdbId: number) => void;
  onFavorite: (seriesTmdbId: number) => void;
}

export function RecommendationCard({
  recommendation,
  isIgnored,
  isFavorite,
  isFadingOut,
  onIgnore,
  onFavorite,
}: RecommendationCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleOpenImdb = async (seriesTmdbId: number, event?: React.MouseEvent) => {
    // Only handle left-click (button 0) and middle-click (button 1)
    if (event && event.button !== 0 && event.button !== 1) {
      return;
    }

    try {
      const externalIds = await getSeriesExternalIds(seriesTmdbId);

      if (externalIds.imdbId) {
        window.open(`https://www.imdb.com/title/${externalIds.imdbId}`);
      } else {
        toast.error('IMDb ID not available for this show');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get IMDb link';

      if (errorMessage.includes('Too many requests') || errorMessage.includes('Rate limit')) {
        toast.error('Slow down!', {
          description: 'Wait a moment before trying again.',
        });
      } else {
        toast.error('Could not open IMDb. Please try again.');
      }
    }
  };

  const handleIgnoreSeries = async () => {
    try {
      await addIgnoredSeries(recommendation.seriesTmdbId);
      toast.success(`"${recommendation.seriesDetails?.name}" added to your ignored list`, {
        description: "You won't see this show in future recommendations.",
      });
      onIgnore(recommendation.seriesTmdbId);
    } catch (error) {
      console.error('Failed to ignore series:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to ignore series';

      if (errorMessage.includes('Too many requests') || errorMessage.includes('Rate limit')) {
        toast.error('Slow down!', {
          description: 'Wait a moment before trying again.',
        });
      } else {
        toast.error('Could not skip show. Please try again.');
      }
    }
  };

  const handleLikeSeries = async (preferenceLevel: 'like' | 'love' = 'like') => {
    try {
      await addFavoriteSeries(recommendation.seriesTmdbId, preferenceLevel);
      toast.success(`"${recommendation.seriesDetails?.name}" added to your favorites!`, {
        description: "You won't see this show in future recommendations.",
      });
      onFavorite(recommendation.seriesTmdbId);
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add to favorites';

      if (errorMessage.includes('Too many requests') || errorMessage.includes('Rate limit')) {
        toast.error('Slow down!', {
          description: 'Wait a moment before trying again.',
        });
      } else {
        toast.error('Could not save rating. Please try again.');
      }
    }
  };

  return (
    <div
      className={`group relative rounded-xl border bg-card hover:border-primary/40 hover:shadow-xl transition-all duration-300 overflow-hidden ${
        isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-8 p-6">
        {/* Series Poster */}
        <button
          onMouseDown={(e) => handleOpenImdb(recommendation.seriesTmdbId, e)}
          className="relative shrink-0 w-full sm:w-48 h-auto p-0 rounded-xl overflow-hidden group/poster focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
        >
          {isImageLoading && <Skeleton className="absolute inset-0 h-72 w-full sm:w-48" />}
          {recommendation.seriesDetails?.posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w300${recommendation.seriesDetails.posterPath}`}
              alt={`${recommendation.seriesDetails.name} poster`}
              className="h-72 w-full sm:w-48 object-cover rounded-xl shadow-md group-hover/poster:shadow-xl transition-shadow"
              onLoad={() => setIsImageLoading(false)}
              style={{ display: isImageLoading ? 'none' : 'block' }}
            />
          ) : (
            <div className="h-72 w-full sm:w-48 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <TvMinimalPlay className="w-8 h-8 text-primary" />
            </div>
          )}
        </button>

        {/* Series Details */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="space-y-3">
            <button
              onMouseDown={(e) => handleOpenImdb(recommendation.seriesTmdbId, e)}
              className="group/title h-auto p-0 hover:bg-transparent justify-start text-left focus:outline-none focus:underline cursor-pointer"
            >
              <h4 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                {recommendation.seriesDetails?.name || 'Loading...'}
                <ExternalLink className="w-4 h-4 opacity-0 group-hover/title:opacity-100 transition-opacity" />
              </h4>
            </button>
            {recommendation.seriesDetails && (
              <div className="space-y-2">
                {/* Primary metadata: Year + Rating */}
                <div className="flex flex-wrap items-center gap-2">
                  {recommendation.seriesDetails.firstAirDate && (
                    <Badge
                      variant="secondary"
                      className="text-xs"
                    >
                      {new Date(recommendation.seriesDetails.firstAirDate).getFullYear()}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-foreground">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-semibold">{recommendation.seriesDetails.voteAverage.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">/10</span>
                  </div>
                </div>
                {/* Secondary metadata: Seasons + Status */}
                <div className="flex flex-wrap items-center gap-2">
                  {recommendation.seriesDetails.numberOfSeasons > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {recommendation.seriesDetails.numberOfSeasons}{' '}
                      {recommendation.seriesDetails.numberOfSeasons === 1 ? 'Season' : 'Seasons'}
                    </Badge>
                  )}
                  {recommendation.seriesDetails.status && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        recommendation.seriesDetails.status === 'Ended'
                          ? 'border-muted-foreground/30 text-muted-foreground'
                          : recommendation.seriesDetails.status === 'Canceled' ||
                              recommendation.seriesDetails.status === 'Cancelled'
                            ? 'border-red-500/30 text-red-600 dark:text-red-400'
                            : 'border-green-500/30 text-green-600 dark:text-green-400'
                      }`}
                    >
                      {recommendation.seriesDetails.status}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {recommendation.seriesDetails?.genres && recommendation.seriesDetails.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recommendation.seriesDetails.genres.slice(0, 4).map((genre) => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="text-xs font-normal bg-muted/50 text-muted-foreground border-0 hover:bg-muted transition-colors"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Recommendation Justification */}
          <div className="rounded-lg bg-primary/5 border-l-4 border-primary p-4 space-y-2 shadow-sm">
            <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Why we recommend this:
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">{recommendation.justification}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Love Button - Primary Action */}
            <Button
              size="sm"
              variant="outline"
              className={`flex-1 min-h-11 shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 group ${
                isFavorite
                  ? 'bg-linear-to-br from-red-400 to-red-500 text-white border-red-400 hover:from-red-500 hover:to-red-600'
                  : 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-400 dark:bg-red-950/20 dark:border-red-900/50 dark:hover:bg-red-900/30 dark:hover:border-red-700'
              }`}
              onClick={() => handleLikeSeries('love')}
              disabled={isFavorite || isIgnored || isFadingOut}
              aria-label="Mark as loved"
              aria-pressed={isFavorite}
            >
              <Heart
                className={`w-4 h-4 mr-1.5 transition-all duration-300 text-red-500 dark:text-red-400 ${
                  isFavorite
                    ? 'fill-current text-white!'
                    : 'group-hover:scale-110 group-hover:text-red-600 dark:group-hover:text-red-300'
                }`}
              />
              Love
            </Button>

            {/* Like Button - Secondary Action */}
            <Button
              size="sm"
              variant="outline"
              className={`flex-1 min-h-11 shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 group ${
                isFavorite
                  ? 'bg-linear-to-br from-sky-400 to-sky-500 text-white border-sky-400 hover:from-sky-500 hover:to-sky-600'
                  : 'bg-sky-50 border-sky-200 hover:bg-sky-100 hover:border-sky-400 dark:bg-sky-950/20 dark:border-sky-900/50 dark:hover:bg-sky-900/30 dark:hover:border-sky-700'
              }`}
              onClick={() => handleLikeSeries('like')}
              disabled={isFavorite || isIgnored || isFadingOut}
              aria-label="Mark as liked"
              aria-pressed={isFavorite}
            >
              <ThumbsUp
                className={`w-4 h-4 mr-1.5 transition-all duration-300 text-sky-500 dark:text-sky-400 ${
                  isFavorite
                    ? 'text-white!'
                    : 'group-hover:scale-110 group-hover:text-sky-600 dark:group-hover:text-sky-300'
                }`}
              />
              Like
            </Button>

            {/* Skip Button - Neutral Action */}
            <Button
              size="sm"
              variant="outline"
              className={`flex-1 min-h-11 shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 group ${
                isIgnored
                  ? 'bg-muted text-muted-foreground border-muted-foreground/50'
                  : 'bg-muted/30 hover:bg-muted/60 hover:border-muted-foreground/40'
              }`}
              onClick={handleIgnoreSeries}
              disabled={isIgnored || isFavorite || isFadingOut}
              aria-label="Mark as not interested"
              aria-pressed={isIgnored}
            >
              <EyeOff className={`w-4 h-4 mr-1.5 transition-all duration-300 ${isIgnored ? 'opacity-50' : ''}`} />
              {isIgnored ? 'Skipped' : 'Skip'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
