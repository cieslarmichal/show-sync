import { useState, useEffect, useRef } from 'react';
import { SeriesWatchlist, SeriesDetails } from '../api/types/series';
import { Skeleton } from './ui/Skeleton';
import { getSeriesDetailsBatch } from '../api/queries/getSeriesDetailsBatch';
import { SeriesWatchlistCard } from './series/SeriesWatchlistCard.tsx';

interface SeriesWatchlistListProps {
  watchlist: SeriesWatchlist[];
  onRemoveWatchlist: (seriesTmdbId: number) => void;
  isLoading: boolean;
}

export default function SeriesWatchlistList({
  watchlist,
  onRemoveWatchlist,
  isLoading: externalLoading,
}: SeriesWatchlistListProps) {
  const [seriesDetails, setSeriesDetails] = useState<Map<number, SeriesDetails>>(new Map());
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const timeoutIds = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const loadSeriesDetails = async () => {
      if (watchlist.length === 0) {
        setSeriesDetails(new Map());
        return;
      }

      const seriesDetailsBatchResults = await getSeriesDetailsBatch(
        watchlist.map((item) => item.seriesTmdbId),
      );

      const seriesDetailsMap = new Map<number, SeriesDetails>();
      seriesDetailsBatchResults.forEach((result) => {
        if (result) {
          seriesDetailsMap.set(result.id, result);
        }
      });

      setSeriesDetails(seriesDetailsMap);
    };

    loadSeriesDetails();
  }, [watchlist]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const currentTimeouts = timeoutIds.current;
    return () => {
      currentTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      currentTimeouts.clear();
    };
  }, []);

  const handleRemoveWatchlist = async (seriesTmdbId: number) => {
    // Add to removing set for animation
    setRemovingIds((prev) => new Set(prev).add(seriesTmdbId));

    try {
      await onRemoveWatchlist(seriesTmdbId);

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

  if (externalLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
          {[...Array(12)].map((_, i) => (
            <Skeleton
              key={i}
              className="w-full aspect-2/3 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {watchlist.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No watchlist items yet</p>
          <p className="text-sm mt-1">Shows you add to your watchlist will appear here.</p>
        </div>
      ) : (
        <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
            {watchlist.map((item) => {
              const details = seriesDetails.get(item.seriesTmdbId);
              const isRemoving = removingIds.has(item.seriesTmdbId);

              return (
                <SeriesWatchlistCard
                  key={item.seriesTmdbId}
                  seriesTmdbId={item.seriesTmdbId}
                  details={details}
                  type={item.type}
                  isRemoving={isRemoving}
                  onRemove={handleRemoveWatchlist}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
