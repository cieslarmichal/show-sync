import { useState, useEffect, useRef } from 'react';
import { SeriesRating, SeriesDetails, Rating } from '../api/types/series';
import { Skeleton } from './ui/Skeleton';
import { getSeriesDetailsBatch } from '../api/queries/getSeriesDetailsBatch';
import { SeriesRatingCard } from './series/SeriesRatingCard.tsx';

interface SeriesRatingListProps {
  ratings: SeriesRating[];
  onRemoveRating: (seriesTmdbId: number) => void;
  onUpdateRating?: (seriesTmdbId: number, rating: Rating) => Promise<void>;
  isLoading: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
}

export default function SeriesRatingList({
  ratings,
  onRemoveRating,
  onUpdateRating,
  isLoading: externalLoading,
  emptyMessage = 'No rated shows yet',
  emptySubMessage = 'Search for shows above and rate the ones you like, love, or dislike!',
}: SeriesRatingListProps) {
  const [seriesDetails, setSeriesDetails] = useState<Map<number, SeriesDetails>>(new Map());
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const timeoutIds = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const loadSeriesDetails = async () => {
      if (ratings.length === 0) {
        setSeriesDetails(new Map());
        return;
      }

      const seriesDetailsBatchResults = await getSeriesDetailsBatch(ratings.map((rating) => rating.seriesTmdbId));

      const seriesDetailsMap = new Map<number, SeriesDetails>();
      seriesDetailsBatchResults.forEach((result) => {
        if (result) {
          seriesDetailsMap.set(result.id, result);
        }
      });

      setSeriesDetails(seriesDetailsMap);
    };

    loadSeriesDetails();
  }, [ratings]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const currentTimeouts = timeoutIds.current;
    return () => {
      currentTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      currentTimeouts.clear();
    };
  }, []);

  const handleRemoveRating = async (seriesTmdbId: number) => {
    // Add to removing set for animation
    setRemovingIds((prev) => new Set(prev).add(seriesTmdbId));

    try {
      await onRemoveRating(seriesTmdbId);

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

  const handleUpdateRating = async (seriesTmdbId: number, rating: Rating) => {
    if (!onUpdateRating) return;

    setUpdatingIds((prev) => new Set(prev).add(seriesTmdbId));

    try {
      await onUpdateRating(seriesTmdbId, rating);
    } catch {
      // Silently handle errors - parent component should handle user feedback
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
      {ratings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>{emptyMessage}</p>
          <p className="text-sm mt-1">{emptySubMessage}</p>
        </div>
      ) : (
        <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
            {ratings.map((rating) => {
              const details = seriesDetails.get(rating.seriesTmdbId);
              const isRemoving = removingIds.has(rating.seriesTmdbId);
              const isUpdating = updatingIds.has(rating.seriesTmdbId);

              return (
                <SeriesRatingCard
                  key={rating.seriesTmdbId}
                  seriesTmdbId={rating.seriesTmdbId}
                  details={details}
                  rating={rating.rating}
                  isRemoving={isRemoving}
                  isUpdating={isUpdating}
                  onRemove={handleRemoveRating}
                  onUpdateRating={onUpdateRating ? handleUpdateRating : undefined}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
