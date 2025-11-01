import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { searchSeries } from '../api/queries/searchSeries';
import { Series } from '../api/types/series';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import { Badge } from './ui/Badge';
import { Search, ThumbsUp, EyeOff } from 'lucide-react';

interface SearchSeriesProps {
  onAddToProfile: (series: Series) => void;
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

  const truncateToTwoSentences = (text: string): string => {
    if (!text) return '';

    // Find the first two sentence endings (. followed by space or end of string)
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences = text.match(sentenceRegex);

    if (!sentences || sentences.length === 0) {
      return text;
    }

    // Take first two sentences and ensure it ends with a dot
    const twoSentences = sentences.slice(0, 2).join(' ').trim();
    return twoSentences.endsWith('.') ? twoSentences : twoSentences + '.';
  };

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
      } catch (err) {
        setError('Failed to search series. Please try again.');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="relative">
          <label
            htmlFor="series-search"
            className="sr-only"
          >
            Search for a TV series
          </label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="series-search"
            type="text"
            placeholder="Search for a TV series by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-6 text-base sm:text-lg rounded-full bg-muted border-2 border-transparent focus:border-primary focus:bg-background"
          />
        </div>
        <p className="text-xs text-muted-foreground px-1">
          <span className="font-medium">Like</span> the shows you enjoy • Mark as{' '}
          <span className="font-medium">Not Interested</span> to exclude them from AI recommendations
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
          {results.map((series) => (
            <Card
              key={series.id}
              className="p-4"
            >
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
                <div className="shrink-0">
                  {series.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w300${series.posterPath}`}
                      alt={`${series.name} poster`}
                      className="h-36 w-24 object-cover rounded"
                    />
                  ) : (
                    <div className="h-36 w-24 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{series.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {truncateToTwoSentences(series.overview || 'No description available.')}
                  </p>
                  <div className="space-y-2 mt-2.5">
                    <div className="flex items-center gap-2">
                      {series?.firstAirDate && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          {new Date(series.firstAirDate).getFullYear()}
                        </Badge>
                      )}
                      {series.originCountry && series.originCountry.length > 0 && (
                        <span className="text-xs text-muted-foreground">{series.originCountry[0]}</span>
                      )}
                      <span className="text-xs text-muted-foreground">★ {series.voteAverage.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 w-full sm:w-auto mt-4 sm:mt-0 sm:ml-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all"
                      onClick={() => {
                        onAddToProfile(series);
                        setQuery('');
                      }}
                      disabled={profileSeriesIds.has(series.id)}
                      variant={profileSeriesIds.has(series.id) ? 'secondary' : 'default'}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {profileSeriesIds.has(series.id) ? 'Liked' : 'Like'}
                    </Button>
                    <Button
                      size="sm"
                      variant={ignoredSeriesIds?.has(series.id) ? 'secondary' : 'outline'}
                      className="flex-1 sm:flex-none hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 hover:scale-105 active:scale-95 transition-all"
                      onClick={() => {
                        onAddToIgnored(series);
                        setQuery('');
                      }}
                      disabled={ignoredSeriesIds?.has(series.id)}
                    >
                      <EyeOff className="w-4 h-4 mr-1" />
                      {ignoredSeriesIds?.has(series.id) ? 'Ignored' : 'Not Interested'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && query.trim() && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No series found for "{query}"</div>
      )}
    </div>
  );
}
