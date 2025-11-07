import { X } from 'lucide-react';
import { SeriesDetails, PreferenceLevel } from '../../api/types/series';
import { Button } from '../ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import { PreferenceToggle } from '../PreferenceToggle';

interface FavoriteSeriesCardProps {
  seriesTmdbId: number;
  details: SeriesDetails | undefined;
  preferenceLevel: PreferenceLevel;
  isRemoving: boolean;
  isUpdating: boolean;
  onRemove: (seriesTmdbId: number) => void;
  onUpdatePreference?: (seriesTmdbId: number, preferenceLevel: PreferenceLevel) => void;
}

export function FavoriteSeriesCard({
  seriesTmdbId,
  details,
  preferenceLevel,
  isRemoving,
  isUpdating,
  onRemove,
  onUpdatePreference,
}: FavoriteSeriesCardProps) {
  return (
    <div
      data-testid="favorite-series-card"
      className={`group relative transition-all duration-300 ${
        isRemoving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <div className="relative w-full aspect-2/3 overflow-hidden rounded-lg bg-muted shadow-md transition-all duration-300 group-hover:shadow-xl">
        {details?.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w342${details.posterPath}`}
            alt={`${details.name} poster`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-xs text-center text-muted-foreground p-2">No Image Available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-100 group-hover:opacity-100 transition-opacity" />

        {/* Preference Toggle - Top Left */}
        {onUpdatePreference && (
          <div className="absolute top-1 left-1">
            <PreferenceToggle
              preferenceLevel={preferenceLevel}
              onToggle={(newLevel) => onUpdatePreference(seriesTmdbId, newLevel)}
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
              className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/50 hover:bg-red-600 rounded-full transition-all duration-200 shadow-lg"
              aria-label={`Remove ${details?.name || 'series'} from favorites`}
            >
              <X className="w-4 h-4 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Remove from favorites</TooltipContent>
        </Tooltip>

        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h3 className="text-xs font-bold text-white truncate text-center leading-tight">
            {details?.name || `Series ${seriesTmdbId}`}
          </h3>
        </div>
      </div>
    </div>
  );
}
