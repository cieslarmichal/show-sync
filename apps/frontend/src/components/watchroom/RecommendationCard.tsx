import { useState, useContext } from 'react';
import { toast } from 'sonner';
import {
  Sparkles,
  TvMinimalPlay,
  EyeOff,
  ThumbsUp,
  Heart,
  Star,
  ExternalLink,
  ThumbsDown,
  CalendarPlus,
} from 'lucide-react';

import { getSeriesExternalIds } from '../../api/queries/getSeriesExternalIds.ts';
import { addSeriesWatchlist } from '../../api/queries/addSeriesWatchlist.ts';
import { addSeriesRating } from '../../api/queries/addSeriesRating.ts';
import type { Recommendation } from '../../api/types/recommendation.ts';
import type { SeriesDetails, Rating, WatchlistType } from '../../api/types/series.ts';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Skeleton } from '../ui/Skeleton.tsx';
import { SeriesContext } from '../../context/SeriesContext.tsx';

interface RecommendationWithDetails extends Recommendation {
  seriesDetails?: SeriesDetails;
}

interface RecommendationCardProps {
  recommendation: RecommendationWithDetails;
  isInWatchlist: boolean;
  isRated: boolean;
  isFadingOut: boolean;
  onAddToWatchlist: (seriesTmdbId: number) => void;
  onAddRating: (seriesTmdbId: number) => void;
}

export function RecommendationCard({
  recommendation,
  isInWatchlist,
  isRated,
  isFadingOut,
  onAddToWatchlist,
  onAddRating,
}: RecommendationCardProps) {
  const { refreshCounts } = useContext(SeriesContext);
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

  const handleAddToWatchlist = async (type: WatchlistType) => {
    try {
      await addSeriesWatchlist(recommendation.seriesTmdbId, type);
      const typeLabel = type === 'notInterested' ? 'Not Interested' : 'Want to Watch';
      toast.success(`"${recommendation.seriesDetails?.name}" added to watchlist as ${typeLabel}`, {
        description: "You won't see this show in future recommendations.",
      });
      onAddToWatchlist(recommendation.seriesTmdbId);
      await refreshCounts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add to watchlist';

      if (errorMessage.includes('Too many requests') || errorMessage.includes('Rate limit')) {
        toast.error('Slow down!', {
          description: 'Wait a moment before trying again.',
        });
      } else {
        toast.error('Could not add to watchlist. Please try again.');
      }
    }
  };

  const handleAddRating = async (rating: Rating = 'like') => {
    try {
      await addSeriesRating(recommendation.seriesTmdbId, rating);
      const ratingLabel = rating === 'love' ? '❤️ Love' : rating === 'like' ? '👍 Like' : '👎 Dislike';
      toast.success(`"${recommendation.seriesDetails?.name}" rated as ${ratingLabel}!`, {
        description: "You won't see this show in future recommendations.",
      });
      onAddRating(recommendation.seriesTmdbId);
      await refreshCounts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save rating';

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
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 p-3 sm:p-5 md:p-6">
        {/* Series Poster */}
        <button
          onMouseDown={(e) => handleOpenImdb(recommendation.seriesTmdbId, e)}
          className="relative shrink-0 w-full sm:w-40 md:w-48 h-auto p-0 rounded-lg sm:rounded-xl overflow-hidden group/poster focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
        >
          {isImageLoading && <Skeleton className="absolute inset-0 h-56 sm:h-60 md:h-72 w-full" />}
          {recommendation.seriesDetails?.posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w300${recommendation.seriesDetails.posterPath}`}
              alt={`${recommendation.seriesDetails.name} poster`}
              className="h-56 sm:h-60 md:h-72 w-full object-cover rounded-lg sm:rounded-xl shadow-md group-hover/poster:shadow-xl transition-shadow"
              onLoad={() => setIsImageLoading(false)}
              style={{ display: isImageLoading ? 'none' : 'block' }}
            />
          ) : (
            <div className="h-56 sm:h-60 md:h-72 w-full rounded-lg sm:rounded-xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <TvMinimalPlay className="w-8 h-8 text-primary" />
            </div>
          )}
        </button>

        {/* Series Details */}
        <div className="flex-1 min-w-0 space-y-3 sm:space-y-3.5">
          {/* Title and Main Info */}
          <div className="space-y-2">
            <button
              onMouseDown={(e) => handleOpenImdb(recommendation.seriesTmdbId, e)}
              className="group/title h-auto p-0 hover:bg-transparent justify-start text-left focus:outline-none focus:underline cursor-pointer w-full"
            >
              <h4 className="text-base sm:text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 sm:gap-2">
                {recommendation.seriesDetails?.name || 'Loading...'}
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-0 group-hover/title:opacity-100 transition-opacity" />
              </h4>
            </button>

            {/* Metadata Row - Year, Rating, Seasons, Episodes, Status */}
            {recommendation.seriesDetails && (
              <div className="flex flex-wrap items-center gap-2">
                {recommendation.seriesDetails.firstAirDate && (
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                    {new Date(recommendation.seriesDetails.firstAirDate).getFullYear()}
                  </span>
                )}
                {recommendation.seriesDetails.firstAirDate && <span className="text-muted-foreground/40">•</span>}
                <div className="flex items-center gap-1 text-foreground">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                  <span className="text-xs sm:text-sm font-semibold">
                    {recommendation.seriesDetails.voteAverage.toFixed(1)}
                  </span>
                </div>
                {recommendation.seriesDetails.numberOfSeasons > 0 && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {recommendation.seriesDetails.numberOfSeasons}{' '}
                      {recommendation.seriesDetails.numberOfSeasons === 1 ? 'Season' : 'Seasons'}
                    </span>
                  </>
                )}
                {recommendation.seriesDetails.numberOfEpisodes > 0 && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {recommendation.seriesDetails.numberOfEpisodes} Episodes
                    </span>
                  </>
                )}
                {recommendation.seriesDetails.status && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] sm:text-xs px-2 py-0.5 ${
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
                  </>
                )}
              </div>
            )}

            {/* Genres */}
            {recommendation.seriesDetails?.genres && recommendation.seriesDetails.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recommendation.seriesDetails.genres.slice(0, 4).map((genre) => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="text-[10px] sm:text-xs font-normal bg-muted/50 text-muted-foreground border-0 px-2 py-0.5"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Series Overview */}
          {recommendation.seriesDetails?.overview && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {recommendation.seriesDetails.overview}
            </p>
          )}

          {/* Watch Providers (only show if available) */}
          {recommendation.seriesDetails && recommendation.seriesDetails.watchProviders.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Available on:</span>
                <div className="flex items-center gap-1.5">
                  {recommendation.seriesDetails.watchProviders.slice(0, 4).map((provider) => (
                    <div
                      key={provider.providerId}
                      className="relative group/provider"
                      title={provider.providerName}
                    >
                      {provider.logoPath ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w45${provider.logoPath}`}
                          alt={provider.providerName}
                          className="w-6 h-6 rounded shadow-sm hover:shadow-md transition-shadow"
                        />
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0.5"
                        >
                          {provider.providerName}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {recommendation.seriesDetails.watchProviders.length > 4 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{recommendation.seriesDetails.watchProviders.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recommendation Justification */}
          <div className="rounded-lg bg-primary/5 border-l-2 sm:border-l-4 border-primary p-2.5 sm:p-3 md:p-4 space-y-1 sm:space-y-1.5 shadow-sm">
            <p className="text-[10px] sm:text-xs font-semibold text-primary flex items-center gap-1">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Why we recommend this:
            </p>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{recommendation.justification}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddRating('like')}
              disabled={isRated || isInWatchlist || isFadingOut}
            >
              <ThumbsUp className="w-4 h-4 mr-1.5" />
              Like
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddRating('love')}
              disabled={isRated || isInWatchlist || isFadingOut}
            >
              <Heart className="w-4 h-4 mr-1.5" />
              Love
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddRating('dislike')}
              disabled={isRated || isInWatchlist || isFadingOut}
            >
              <ThumbsDown className="w-4 h-4 mr-1.5" />
              Dislike
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddToWatchlist('wantToWatch')}
              disabled={isInWatchlist || isRated || isFadingOut}
            >
              <CalendarPlus className="w-4 h-4 mr-1.5" />
              Want to Watch
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddToWatchlist('notInterested')}
              disabled={isInWatchlist || isRated || isFadingOut}
            >
              <EyeOff className="w-4 h-4 mr-1.5" />
              Not Interested
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
