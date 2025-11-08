import { useState, useEffect, useRef } from 'react';
import { IgnoredSeries, SeriesDetails } from '../api/types/series';
import { Skeleton } from './ui/Skeleton';
import { getSeriesDetailsBatch } from '../api/queries/getSeriesDetailsBatch';
import { IgnoredSeriesCard } from './series/IgnoredSeriesCard';

interface IgnoredSeriesListProps {
  ignoredSeries: IgnoredSeries[];
  onRemoveIgnored: (seriesTmdbId: number) => void;
  isLoading: boolean;
}

export default function IgnoredSeriesList({
  ignoredSeries,
  onRemoveIgnored,
  isLoading: externalLoading,
}: IgnoredSeriesListProps) {
  const [seriesDetails, setSeriesDetails] = useState<Map<number, SeriesDetails>>(new Map());
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const timeoutIds = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const loadSeriesDetails = async () => {
      if (ignoredSeries.length === 0) {
        setSeriesDetails(new Map());
        return;
      }

      const seriesDetailsBatchResults = await getSeriesDetailsBatch(
        ignoredSeries.map((ignored) => ignored.seriesTmdbId),
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
  }, [ignoredSeries]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const currentTimeouts = timeoutIds.current;
    return () => {
      currentTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      currentTimeouts.clear();
    };
  }, []);

  const handleRemoveIgnored = async (seriesTmdbId: number) => {
    // Add to removing set for animation
    setRemovingIds((prev) => new Set(prev).add(seriesTmdbId));

    try {
      await onRemoveIgnored(seriesTmdbId);

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
        console.error('Failed to remove ignored show:', err);
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
      {ignoredSeries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No skipped shows yet</p>
          <p className="text-sm mt-1">
            Shows you "Skip" will appear here and won't be suggested to you.
          </p>
        </div>
      ) : (
        <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
            {ignoredSeries.map((ignored) => {
              const details = seriesDetails.get(ignored.seriesTmdbId);
              const isRemoving = removingIds.has(ignored.seriesTmdbId);

              return (
                <IgnoredSeriesCard
                  key={ignored.seriesTmdbId}
                  seriesTmdbId={ignored.seriesTmdbId}
                  details={details}
                  isRemoving={isRemoving}
                  onRemove={handleRemoveIgnored}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
