import { useState, useEffect, useRef } from 'react';
import { FavoriteSeries, SeriesDetails, PreferenceLevel } from '../api/types/series';
import { Skeleton } from './ui/Skeleton';
import { getSeriesDetailsBatch } from '../api/queries/getSeriesDetailsBatch';
import { FavoriteSeriesCard } from './series/FavoriteSeriesCard';

interface FavoriteSeriesListProps {
  favorites: FavoriteSeries[];
  onRemoveFavorite: (seriesTmdbId: number) => void;
  onUpdatePreference?: (seriesTmdbId: number, preferenceLevel: PreferenceLevel) => Promise<void>;
  isLoading: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
}

export default function FavoriteSeriesList({
  favorites,
  onRemoveFavorite,
  onUpdatePreference,
  isLoading: externalLoading,
  emptyMessage = 'No favorite shows yet',
  emptySubMessage = 'Search for shows above and mark the ones you like or love!',
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

      const seriesDetailsBatchResults = await getSeriesDetailsBatch(favorites.map((favorite) => favorite.seriesTmdbId));

      const seriesDetailsMap = new Map<number, SeriesDetails>();
      seriesDetailsBatchResults.forEach((result) => {
        if (result) {
          seriesDetailsMap.set(result.id, result);
        }
      });

      setSeriesDetails(seriesDetailsMap);
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
    } catch {
      // Remove from removing set if failed
      setRemovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(seriesTmdbId);
        return newSet;
      });
    }
  };

  const handleUpdatePreference = async (seriesTmdbId: number, preferenceLevel: PreferenceLevel) => {
    if (!onUpdatePreference) return;

    setUpdatingIds((prev) => new Set(prev).add(seriesTmdbId));

    try {
      await onUpdatePreference(seriesTmdbId, preferenceLevel);
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
          <p>{emptyMessage}</p>
          <p className="text-sm mt-1">{emptySubMessage}</p>
        </div>
      ) : (
        <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
            {favorites.map((favorite) => {
              const details = seriesDetails.get(favorite.seriesTmdbId);
              const isRemoving = removingIds.has(favorite.seriesTmdbId);
              const isUpdating = updatingIds.has(favorite.seriesTmdbId);

              return (
                <FavoriteSeriesCard
                  key={favorite.seriesTmdbId}
                  seriesTmdbId={favorite.seriesTmdbId}
                  details={details}
                  preferenceLevel={favorite.preferenceLevel}
                  isRemoving={isRemoving}
                  isUpdating={isUpdating}
                  onRemove={handleRemoveFavorite}
                  onUpdatePreference={onUpdatePreference ? handleUpdatePreference : undefined}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
