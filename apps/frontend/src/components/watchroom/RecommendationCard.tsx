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
  Eye,
  Check,
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionTaken, setActionTaken] = useState<'rating' | 'watchlist' | null>(null);

  const handleOpenImdb = async (seriesTmdbId: number) => {
    try {
      const externalIds = await getSeriesExternalIds(seriesTmdbId);

      if (externalIds.imdbId) {
        window.open(`https://www.imdb.com/title/${externalIds.imdbId}`, '_blank', 'noopener,noreferrer');
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
    if (isProcessing) return;

    setIsProcessing(true);
    setActionTaken('watchlist');

    try {
      await addSeriesWatchlist(recommendation.seriesTmdbId, type);
      const typeLabel = type === 'notInterested' ? 'Not Interested' : 'Want to Watch';
      toast.success(`Added to ${typeLabel}`, {
        description: recommendation.seriesDetails?.name,
      });
      onAddToWatchlist(recommendation.seriesTmdbId);
      await refreshCounts();
    } catch (error) {
      setIsProcessing(false);
      setActionTaken(null);

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
    if (isProcessing) return;

    setIsProcessing(true);
    setActionTaken('rating');

    try {
      await addSeriesRating(recommendation.seriesTmdbId, rating);
      const ratingLabel = rating === 'love' ? 'Love' : rating === 'like' ? 'Like' : 'Dislike';
      toast.success(`Rated as ${ratingLabel}`, {
        description: recommendation.seriesDetails?.name,
      });
      onAddRating(recommendation.seriesTmdbId);
      await refreshCounts();
    } catch (error) {
      setIsProcessing(false);
      setActionTaken(null);

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

  const isDisabled = isInWatchlist || isRated || isFadingOut || isProcessing;

  return (
    <div
      className={`group relative rounded-lg border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300 overflow-hidden ${
        isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      {/* Success overlay */}
      {actionTaken && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium">{actionTaken === 'rating' ? 'Rating saved!' : 'Added to watchlist!'}</p>
          </div>
        </div>
      )}

      {/* Mobile: Full-width poster banner */}
      <button
        onClick={() => handleOpenImdb(recommendation.seriesTmdbId)}
        className="relative w-full h-48 sm:hidden p-0 overflow-hidden group/poster focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        type="button"
      >
        {isImageLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
        {recommendation.seriesDetails?.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w780${recommendation.seriesDetails.posterPath}`}
            alt={`${recommendation.seriesDetails.name} poster`}
            className="w-full h-full object-cover"
            onLoad={() => setIsImageLoading(false)}
            style={{ display: isImageLoading ? 'none' : 'block' }}
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <TvMinimalPlay className="w-10 h-10 text-primary" />
          </div>
        )}
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover/poster:bg-black/40 transition-colors flex items-center justify-center">
          <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover/poster:opacity-100 transition-opacity" />
        </div>
      </button>

      {/* Desktop: Side-by-side layout */}
      <div className="flex gap-3 sm:gap-5 p-3 sm:p-5">
        {/* Series Poster - Desktop only */}
        <button
          onClick={() => handleOpenImdb(recommendation.seriesTmdbId)}
          className="relative shrink-0 w-44 h-auto p-0 rounded-lg overflow-hidden group/poster focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer hidden sm:block"
          type="button"
        >
          {isImageLoading && <Skeleton className="absolute inset-0 h-64 w-full" />}
          {recommendation.seriesDetails?.posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w342${recommendation.seriesDetails.posterPath}`}
              alt={`${recommendation.seriesDetails.name} poster`}
              className="h-64 w-full object-cover rounded-lg shadow-sm group-hover/poster:shadow-md transition-shadow"
              onLoad={() => setIsImageLoading(false)}
              style={{ display: isImageLoading ? 'none' : 'block' }}
            />
          ) : (
            <div className="h-64 w-full rounded-lg bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <TvMinimalPlay className="w-7 h-7 text-primary" />
            </div>
          )}
          {/* Hover overlay with IMDb icon */}
          <div className="absolute inset-0 bg-black/0 group-hover/poster:bg-black/40 transition-colors flex items-center justify-center">
            <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover/poster:opacity-100 transition-opacity" />
          </div>
        </button>

        {/* Series Details */}
        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
          {/* Title and Main Info */}
          <div className="space-y-1">
            <button
              onClick={() => handleOpenImdb(recommendation.seriesTmdbId)}
              className="group/title h-auto p-0 hover:bg-transparent justify-start text-left focus:outline-none focus:underline cursor-pointer w-full"
              type="button"
            >
              <h4 className="text-sm sm:text-lg font-bold text-foreground group-hover/title:text-primary transition-colors flex items-center gap-1">
                {recommendation.seriesDetails?.name || 'Loading...'}
                <ExternalLink className="w-3 sm:w-3.5 h-3 sm:h-3.5 opacity-0 group-hover/title:opacity-100 transition-opacity" />
              </h4>
            </button>

            {/* Metadata Row - Year, Rating, Seasons, Episodes, Status */}
            {recommendation.seriesDetails && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {/* Year and Rating */}
                <div className="flex items-center gap-1.5">
                  {recommendation.seriesDetails.firstAirDate && (
                    <span className="text-[11px] sm:text-sm text-muted-foreground font-medium">
                      {new Date(recommendation.seriesDetails.firstAirDate).getFullYear()}
                    </span>
                  )}
                  {recommendation.seriesDetails.firstAirDate && (
                    <span className="text-muted-foreground/40 text-xs">•</span>
                  )}
                  <div className="flex items-center gap-0.5 text-foreground">
                    <Star className="w-3 sm:w-4 h-3 sm:h-4 fill-current text-yellow-500" />
                    <span className="text-[11px] sm:text-sm font-semibold">
                      {recommendation.seriesDetails.voteAverage.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Seasons and Episodes */}
                {(recommendation.seriesDetails.numberOfSeasons > 0 || recommendation.seriesDetails.numberOfEpisodes > 0) && (
                  <>
                    <span className="text-muted-foreground/40 text-xs">•</span>
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-sm text-muted-foreground">
                      {recommendation.seriesDetails.numberOfSeasons > 0 && (
                        <span>
                          {recommendation.seriesDetails.numberOfSeasons}{' '}
                          {recommendation.seriesDetails.numberOfSeasons === 1 ? 'Season' : 'Seasons'}
                        </span>
                      )}
                      {recommendation.seriesDetails.numberOfSeasons > 0 && recommendation.seriesDetails.numberOfEpisodes > 0 && (
                        <span className="text-muted-foreground/40">·</span>
                      )}
                      {recommendation.seriesDetails.numberOfEpisodes > 0 && (
                        <span>{recommendation.seriesDetails.numberOfEpisodes} Episodes</span>
                      )}
                    </div>
                  </>
                )}

                {/* Status Badge */}
                {recommendation.seriesDetails.status && (
                  <>
                    <span className="text-muted-foreground/40 text-xs">•</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 ${
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
              <div className="flex flex-wrap gap-1">
                {recommendation.seriesDetails.genres.slice(0, 3).map((genre) => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="text-[9px] sm:text-xs font-normal bg-muted/60 text-foreground/70 border-0 px-1.5 sm:px-2 py-0.5"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Series Overview */}
          {recommendation.seriesDetails?.overview && (
            <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed line-clamp-2 sm:line-clamp-2">
              {recommendation.seriesDetails.overview}
            </p>
          )}

          {/* Watch Providers (only show if available) */}
          {recommendation.seriesDetails && recommendation.seriesDetails.watchProviders.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-foreground/80">Available on:</span>
              <div className="flex items-center gap-1.5">
                {recommendation.seriesDetails.watchProviders.slice(0, 3).map((provider) => (
                  <div
                    key={provider.providerId}
                    className="relative group/provider"
                    title={provider.providerName}
                  >
                    {provider.logoPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w45${provider.logoPath}`}
                        alt={provider.providerName}
                        className="w-6 sm:w-7 h-6 sm:h-7 rounded shadow-sm hover:shadow-md transition-shadow"
                      />
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                      >
                        {provider.providerName}
                      </Badge>
                    )}
                  </div>
                ))}
                {recommendation.seriesDetails.watchProviders.length > 3 && (
                  <span className="text-xs text-muted-foreground font-medium">
                    +{recommendation.seriesDetails.watchProviders.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Recommendation Justification */}
          <div className="border-l-2 border-primary/40 pl-2 sm:pl-3 space-y-1 bg-muted/30 py-2 rounded-r">
            <p className="text-xs sm:text-sm font-semibold text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Why we recommend this
            </p>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">{recommendation.justification}</p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2 pt-1">
            {/* Action buttons organized by type */}
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {/* Rating actions */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAddRating('love')}
                  disabled={isDisabled}
                  className="flex-1 sm:flex-none h-8 sm:h-9 text-xs font-semibold bg-linear-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-sm hover:shadow"
                >
                  <Heart className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  <span>Love</span>
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAddRating('like')}
                  disabled={isDisabled}
                  className="flex-1 sm:flex-none h-8 sm:h-9 text-xs font-semibold shadow-sm hover:shadow"
                >
                  <ThumbsUp className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  <span>Like</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddRating('dislike')}
                  disabled={isDisabled}
                  className="flex-1 sm:flex-none h-8 sm:h-9 text-xs font-medium"
                >
                  <ThumbsDown className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  <span>Dislike</span>
                </Button>
              </div>

              {/* Watchlist actions */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddToWatchlist('wantToWatch')}
                  disabled={isDisabled}
                  className="flex-1 sm:flex-none h-8 sm:h-9 text-xs font-medium"
                >
                  <Eye className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  <span className="hidden sm:inline">Want to Watch</span>
                  <span className="sm:hidden">Watchlist</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddToWatchlist('notInterested')}
                  disabled={isDisabled}
                  className="flex-1 sm:flex-none h-8 sm:h-9 text-xs font-medium"
                >
                  <EyeOff className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  <span className="hidden sm:inline">Not Interested</span>
                  <span className="sm:hidden">Skip</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
