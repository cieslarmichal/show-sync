import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { searchSeries } from '../api/queries/searchSeries';
import { Series, Rating, WatchlistType } from '../api/types/series';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { Search } from 'lucide-react';
import { SearchResultCard } from './series/SearchResultCard';
import { useTranslation } from 'react-i18next';

interface SearchSeriesProps {
  onAddRating: (series: Series, rating: Rating) => void;
  onAddToWatchlist: (series: Series, type: WatchlistType) => void;
  ratedSeriesIds: Set<number>;
  watchlistSeriesIds?: Set<number>;
}

export default function SearchSeries({
  onAddRating,
  onAddToWatchlist,
  ratedSeriesIds,
  watchlistSeriesIds,
}: SearchSeriesProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchResult = await searchSeries(debouncedQuery);
        setResults(searchResult.data);
      } catch {
        setError(t('series.searchError'));
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, t]);

  const handleAddRating = (series: Series, rating: Rating) => {
    onAddRating(series, rating);
    setQuery('');
  };

  const handleAddToWatchlist = (series: Series, type: WatchlistType) => {
    onAddToWatchlist(series, type);
    setQuery('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="relative">
          <label
            htmlFor="series-search"
            className="sr-only"
          >
            {t('series.searchLabel')}
          </label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="series-search"
            type="text"
            placeholder={t('series.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-6 text-base sm:text-lg rounded-full bg-muted border-2 border-transparent focus:border-primary focus:bg-background"
          />
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card
              key={i}
              className="p-4"
            >
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
                <Skeleton className="h-36 w-24 shrink-0 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <div className="flex items-center gap-2 mt-2.5">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
                <div className="shrink-0 w-full sm:w-auto mt-4 sm:mt-0 sm:ml-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-11 w-20" />
                      <Skeleton className="h-11 w-20" />
                      <Skeleton className="h-11 w-24" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-11 flex-1" />
                      <Skeleton className="h-11 flex-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          {results.map((series, index) => (
            <SearchResultCard
              key={series.id}
              series={series}
              index={index}
              isInProfile={ratedSeriesIds.has(series.id)}
              isInWatchlist={watchlistSeriesIds?.has(series.id) || false}
              onAddRating={handleAddRating}
              onAddToWatchlist={handleAddToWatchlist}
            />
          ))}
        </div>
      )}

      {!isLoading && query.trim() && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">{t('series.noResults', { query })}</div>
      )}
    </div>
  );
}
