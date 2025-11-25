import { X } from 'lucide-react';
import { SeriesDetails, Rating } from '../../api/types/series';
import { Button } from '../ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import { RatingSelector } from '../RatingSelector';

interface SeriesRatingCardProps {
  seriesTmdbId: number;
  details: SeriesDetails | undefined;
  rating: Rating;
  isRemoving: boolean;
  isUpdating: boolean;
  onRemove: (seriesTmdbId: number) => void;
  onUpdateRating?: (seriesTmdbId: number, rating: Rating) => void;
}

export function SeriesRatingCard({
  seriesTmdbId,
  details,
  rating,
  isRemoving,
  isUpdating,
  onRemove,
  onUpdateRating,
}: SeriesRatingCardProps) {
  return (
    <div
      data-testid="series-rating-card"
      className={`group relative transition-all duration-300 ${
        isRemoving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <div className="relative w-full aspect-2/3 overflow-hidden rounded-lg bg-muted shadow-md transition-all duration-300 group-hover:shadow-xl">
        {details?.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w342${details.posterPath}`}
            alt={`${details.name} poster`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-xs text-center text-muted-foreground p-2">No Image Available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300" />

        {/* Rating Selector - Top Left */}
        {onUpdateRating && (
          <div className="absolute top-2 left-2 z-10">
            <RatingSelector
              rating={rating}
              onSelect={(newRating: Rating) => onUpdateRating(seriesTmdbId, newRating)}
              disabled={isUpdating}
            />
          </div>
        )}

        {/* Remove Button - Top Right */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onRemove(seriesTmdbId)}
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-red-600 rounded-full transition-all duration-200 shadow-md backdrop-blur-sm hover:scale-105 active:scale-95 z-10"
              aria-label={`Remove ${details?.name || 'show'} from ratings`}
            >
              <X className="w-3.5 h-3.5 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="hidden sm:block"
          >
            Remove from ratings
          </TooltipContent>
        </Tooltip>

        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <h3 className="text-xs font-semibold text-white truncate text-center leading-tight drop-shadow-md">
            {details?.name || `Show ${seriesTmdbId}`}
          </h3>
        </div>
      </div>
    </div>
  );
}
