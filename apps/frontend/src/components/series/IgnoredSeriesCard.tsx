import { X } from 'lucide-react';
import { SeriesDetails } from '../../api/types/series';
import { Button } from '../ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

interface IgnoredSeriesCardProps {
  seriesTmdbId: number;
  details: SeriesDetails | undefined;
  isRemoving: boolean;
  onRemove: (seriesTmdbId: number) => void;
}

export function IgnoredSeriesCard({ seriesTmdbId, details, isRemoving, onRemove }: IgnoredSeriesCardProps) {
  return (
    <div
      data-testid="ignored-series-card"
      className={`group relative transition-all duration-300 ${
        isRemoving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <div className="relative w-full aspect-2/3 overflow-hidden rounded-lg bg-muted shadow-md transition-all duration-300 group-hover:shadow-xl">
        {details?.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w342${details.posterPath}`}
            alt={`${details.name} poster`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 opacity-60 grayscale"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-xs text-center text-muted-foreground p-2">No Image Available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-100 group-hover:opacity-100 transition-opacity" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onRemove(seriesTmdbId)}
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-red-600 rounded-full transition-all duration-200 shadow-lg"
              aria-label={`Remove ${details?.name || 'show'} from skipped list`}
            >
              <X className="w-4 h-4 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Remove from ignored list</TooltipContent>
        </Tooltip>
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h3 className="text-xs font-bold text-white truncate text-center leading-tight">
            {details?.name || `Show ${seriesTmdbId}`}
          </h3>
        </div>
      </div>
    </div>
  );
}
