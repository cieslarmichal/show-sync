import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { searchSeries } from '../api/queries/searchSeries';
import { Series } from '../api/types/series';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import { Badge } from './ui/Badge';
import { Search, ThumbsUp, Heart, EyeOff } from 'lucide-react';

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
          <span className="font-medium">Like</span> or <span className="font-medium">Love</span> the series you enjoy •
          <span className="font-medium"> Skip</span> to exclude them from recommendations
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
                    {/* Love Button - Primary Action */}
                    <Button
                      size="sm"
                      variant="outline"
                      className={`flex-1 sm:flex-none min-h-11 shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 group ${
                        profileSeriesIds.has(series.id)
                          ? 'bg-linear-to-br from-red-400 to-red-500 text-white border-red-400 hover:from-red-500 hover:to-red-600'
                          : 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-400 dark:bg-red-950/20 dark:border-red-900/50 dark:hover:bg-red-900/30 dark:hover:border-red-700'
                      }`}
                      onClick={() => {
                        onAddToProfile(series, 'love');
                        setQuery('');
                      }}
                      disabled={profileSeriesIds.has(series.id)}
                      aria-label="Mark as loved"
                      aria-pressed={profileSeriesIds.has(series.id)}
                    >
                      <Heart
                        className={`w-4 h-4 mr-1.5 transition-all duration-300 text-red-500 dark:text-red-400 ${
                          profileSeriesIds.has(series.id)
                            ? 'fill-current text-white!'
                            : 'group-hover:scale-110 group-hover:text-red-600 dark:group-hover:text-red-300'
                        }`}
                      />
                      Love
                    </Button>

                    {/* Like Button - Secondary Action */}
                    <Button
                      size="sm"
                      variant="outline"
                      className={`flex-1 sm:flex-none min-h-11 shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 group ${
                        profileSeriesIds.has(series.id)
                          ? 'bg-linear-to-br from-sky-400 to-sky-500 text-white border-sky-400 hover:from-sky-500 hover:to-sky-600'
                          : 'bg-sky-50 border-sky-200 hover:bg-sky-100 hover:border-sky-400 dark:bg-sky-950/20 dark:border-sky-900/50 dark:hover:bg-sky-900/30 dark:hover:border-sky-700'
                      }`}
                      onClick={() => {
                        onAddToProfile(series, 'like');
                        setQuery('');
                      }}
                      disabled={profileSeriesIds.has(series.id)}
                      aria-label="Mark as liked"
                      aria-pressed={profileSeriesIds.has(series.id)}
                    >
                      <ThumbsUp
                        className={`w-4 h-4 mr-1.5 transition-all duration-300 text-sky-500 dark:text-sky-400 ${
                          profileSeriesIds.has(series.id)
                            ? 'text-white!'
                            : 'group-hover:scale-110 group-hover:text-sky-600 dark:group-hover:text-sky-300'
                        }`}
                      />
                      Like
                    </Button>

                    {/* Skip Button - Neutral Action */}
                    <Button
                      size="sm"
                      variant="outline"
                      className={`flex-1 sm:flex-none min-h-11 shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 group ${
                        ignoredSeriesIds?.has(series.id)
                          ? 'bg-muted text-muted-foreground border-muted-foreground/50'
                          : 'bg-muted/30 hover:bg-muted/60 hover:border-muted-foreground/40'
                      }`}
                      onClick={() => {
                        onAddToIgnored(series);
                        setQuery('');
                      }}
                      disabled={ignoredSeriesIds?.has(series.id)}
                      aria-label="Mark as not interested"
                      aria-pressed={ignoredSeriesIds?.has(series.id)}
                    >
                      <EyeOff
                        className={`w-4 h-4 mr-1.5 transition-all duration-300 ${
                          ignoredSeriesIds?.has(series.id) ? 'opacity-50' : ''
                        }`}
                      />
                      {ignoredSeriesIds?.has(series.id) ? 'Skipped' : 'Skip'}
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
