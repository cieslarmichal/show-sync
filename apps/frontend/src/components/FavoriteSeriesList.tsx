import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getSeriesDetails } from '../api/queries/getSeriesDetails';
import { FavoriteSeries, SeriesDetails, PreferenceLevel } from '../api/types/series';
import { Skeleton } from './ui/Skeleton';
import { Button } from './ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import { PreferenceToggle } from './PreferenceToggle';

interface FavoriteSeriesListProps {
  favorites: FavoriteSeries[];
  onRemoveFavorite: (seriesTmdbId: number) => void;
  onUpdatePreference?: (seriesTmdbId: number, preferenceLevel: PreferenceLevel) => Promise<void>;
  isLoading: boolean;
}

export default function FavoriteSeriesList({
  favorites,
  onRemoveFavorite,
  onUpdatePreference,
  isLoading: externalLoading,
}: FavoriteSeriesListProps) {
  const [seriesDetails, setSeriesDetails] = useState<Map<number, SeriesDetails>>(new Map());
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const timeoutIds = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const loadSeriesDetails = async () => {
      if (favorites.length === 0) {
        setSeriesDetails(new Map());
        return;
      }

      // Load series details for each favorite
      const detailsPromises = favorites.map(async (favorite: FavoriteSeries) => {
        try {
          const details = await getSeriesDetails(favorite.seriesTmdbId);
          return { id: favorite.seriesTmdbId, details };
        } catch (err) {
          console.error(`Failed to load details for series ${favorite.seriesTmdbId}:`, err);
          return null;
        }
      });

      const detailsResults = await Promise.all(detailsPromises);
      const detailsMap = new Map<number, SeriesDetails>();
      detailsResults.forEach((result: { id: number; details: SeriesDetails } | null) => {
        if (result) {
          detailsMap.set(result.id, result.details);
        }
      });

      setSeriesDetails(detailsMap);
    };

    loadSeriesDetails();
  }, [favorites]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const currentTimeouts = timeoutIds.current;
    return () => {
      currentTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      currentTimeouts.clear();
    };
  }, []);

  const handleRemoveFavorite = async (seriesTmdbId: number) => {
    // Add to removing set for animation
    setRemovingIds((prev) => new Set(prev).add(seriesTmdbId));

    try {
      await onRemoveFavorite(seriesTmdbId);

      // Delay the actual removal to allow fade-out animation
      const timeoutId = setTimeout(() => {
        setSeriesDetails((prev) => {
          const newMap = new Map(prev);
          newMap.delete(seriesTmdbId);
          return newMap;
        });
        setRemovingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(seriesTmdbId);
          return newSet;
        });
        timeoutIds.current.delete(seriesTmdbId);
      }, 300);

      timeoutIds.current.set(seriesTmdbId, timeoutId);
    } catch (err) {
      // Remove from removing set if failed
      setRemovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(seriesTmdbId);
        return newSet;
      });
      console.error('Failed to remove favorite:', err);
    }
  };

  const handleUpdatePreference = async (seriesTmdbId: number, preferenceLevel: PreferenceLevel) => {
    if (!onUpdatePreference) return;

    setUpdatingIds((prev) => new Set(prev).add(seriesTmdbId));

    try {
      await onUpdatePreference(seriesTmdbId, preferenceLevel);
    } catch (err) {
      console.error('Failed to update preference:', err);
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(seriesTmdbId);
        return newSet;
      });
    }
  };

  if (externalLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="space-y-2"
            >
              <Skeleton className="w-full h-48 rounded-lg" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {favorites.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No favorite series yet.</p>
          <p className="text-sm mt-1">Search for series above and add them to your favorites!</p>
        </div>
      ) : (
        <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
            {favorites.map((favorite) => {
              const details = seriesDetails.get(favorite.seriesTmdbId);
              const isRemoving = removingIds.has(favorite.seriesTmdbId);
              const isUpdating = updatingIds.has(favorite.seriesTmdbId);

              return (
                <div
                  key={favorite.seriesTmdbId}
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
                      <div className="absolute top-2 left-2 z-10">
                        <PreferenceToggle
                          preferenceLevel={favorite.preferenceLevel}
                          onToggle={(newLevel) => handleUpdatePreference(favorite.seriesTmdbId, newLevel)}
                          disabled={isUpdating}
                        />
                      </div>
                    )}

                    {/* Remove Button - Top Right */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleRemoveFavorite(favorite.seriesTmdbId)}
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-red-600 rounded-full transition-all duration-200 shadow-lg"
                          aria-label={`Remove ${details?.name || 'series'} from favorites`}
                        >
                          <X className="w-4 h-4 text-white" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Remove from favorites</TooltipContent>
                    </Tooltip>

                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <h3 className="text-xs font-bold text-white truncate text-center leading-tight">
                        {details?.name || `Series ${favorite.seriesTmdbId}`}
                      </h3>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
