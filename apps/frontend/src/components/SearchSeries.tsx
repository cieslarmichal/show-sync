import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { searchSeries } from '../api/queries/searchSeries';
import { Series } from '../api/types/series';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { Search } from 'lucide-react';
import { SearchResultCard } from './series/SearchResultCard';

interface SearchSeriesProps {
  onAddToProfile: (series: Series, preferenceLevel: 'like' | 'love') => void;
  onAddToIgnored: (series: Series) => void;
  profileSeriesIds: Set<number>;
  ignoredSeriesIds?: Set<number>;
}

export default function SearchSeries({
  onAddToProfile,
  onAddToIgnored,
  profileSeriesIds,
  ignoredSeriesIds,
}: SearchSeriesProps) {
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
        setError('Failed to search shows. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleAddToProfile = (series: Series, preferenceLevel: 'like' | 'love') => {
    onAddToProfile(series, preferenceLevel);
    setQuery('');
  };

  const handleAddToIgnored = (series: Series) => {
    onAddToIgnored(series);
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
            Search for a TV show
          </label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="series-search"
            type="text"
            placeholder="Search for a TV show by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-6 text-base sm:text-lg rounded-full bg-muted border-2 border-transparent focus:border-primary focus:bg-background"
          />
        </div>
        <p className="text-xs text-muted-foreground px-1">
          <span className="font-medium">Like</span> or <span className="font-medium">Love</span> shows you enjoy •
          <span className="font-medium"> Skip</span> shows you don't want to see
        </p>
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
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 flex-1 sm:flex-none" />
                    <Skeleton className="h-8 w-32 flex-1 sm:flex-none" />
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
              isInProfile={profileSeriesIds.has(series.id)}
              isIgnored={ignoredSeriesIds?.has(series.id) || false}
              onAddToProfile={handleAddToProfile}
              onAddToIgnored={handleAddToIgnored}
            />
          ))}
        </div>
      )}

      {!isLoading && query.trim() && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No shows found for "{query}"</div>
      )}
    </div>
  );
}
