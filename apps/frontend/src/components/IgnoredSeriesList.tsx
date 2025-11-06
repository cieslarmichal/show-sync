import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IgnoredSeries, SeriesDetails } from '../api/types/series';
import { Skeleton } from './ui/Skeleton';
import { Button } from './ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import { getSeriesDetailsBatch } from '../api/queries/getSeriesDetailsBatch';

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
      console.error('Failed to remove ignored series:', err);
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
          <p>No ignored series yet.</p>
          <p className="text-sm mt-1">
            Series you "Skip" will appear here and will be excluded from AI recommendations.
          </p>
        </div>
      ) : (
        <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
            {ignoredSeries.map((ignored) => {
              const details = seriesDetails.get(ignored.seriesTmdbId);
              const isRemoving = removingIds.has(ignored.seriesTmdbId);

              return (
                <div
                  key={ignored.seriesTmdbId}
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
                          onClick={() => handleRemoveIgnored(ignored.seriesTmdbId)}
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-red-600 rounded-full transition-all duration-200 shadow-lg"
                          aria-label={`Remove ${details?.name || 'series'} from ignored list`}
                        >
                          <X className="w-4 h-4 text-white" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Remove from ignored list</TooltipContent>
                    </Tooltip>
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <h3 className="text-xs font-bold text-white truncate text-center leading-tight">
                        {details?.name || `Series ${ignored.seriesTmdbId}`}
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
