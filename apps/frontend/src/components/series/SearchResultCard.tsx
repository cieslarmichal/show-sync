import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ThumbsUp, Heart, EyeOff } from 'lucide-react';
import { Series } from '../../api/types/series';

interface SearchResultCardProps {
  series: Series;
  index: number;
  isInProfile: boolean;
  isIgnored: boolean;
  onAddToProfile: (series: Series, preferenceLevel: 'like' | 'love') => void;
  onAddToIgnored: (series: Series) => void;
}

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

export function SearchResultCard({
  series,
  index,
  isInProfile,
  isIgnored,
  onAddToProfile,
  onAddToIgnored,
}: SearchResultCardProps) {
  return (
    <Card className="p-4">
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
                isInProfile
                  ? 'bg-linear-to-br from-red-400 to-red-500 text-white border-red-400 hover:from-red-500 hover:to-red-600'
                  : 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-400 dark:bg-red-950/20 dark:border-red-900/50 dark:hover:bg-red-900/30 dark:hover:border-red-700'
              }`}
              onClick={() => onAddToProfile(series, 'love')}
              disabled={isInProfile}
              aria-label="Mark as loved"
              aria-pressed={isInProfile}
              data-testid={`search-result-love-button-${index}`}
            >
              <Heart
                className={`w-4 h-4 mr-1.5 transition-all duration-300 text-red-500 dark:text-red-400 ${
                  isInProfile
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
                isInProfile
                  ? 'bg-linear-to-br from-sky-400 to-sky-500 text-white border-sky-400 hover:from-sky-500 hover:to-sky-600'
                  : 'bg-sky-50 border-sky-200 hover:bg-sky-100 hover:border-sky-400 dark:bg-sky-950/20 dark:border-sky-900/50 dark:hover:bg-sky-900/30 dark:hover:border-sky-700'
              }`}
              onClick={() => onAddToProfile(series, 'like')}
              disabled={isInProfile}
              aria-label="Mark as liked"
              aria-pressed={isInProfile}
              data-testid={`search-result-like-button-${index}`}
            >
              <ThumbsUp
                className={`w-4 h-4 mr-1.5 transition-all duration-300 text-sky-500 dark:text-sky-400 ${
                  isInProfile
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
                isIgnored
                  ? 'bg-muted text-muted-foreground border-muted-foreground/50'
                  : 'bg-muted/30 hover:bg-muted/60 hover:border-muted-foreground/40'
              }`}
              onClick={() => onAddToIgnored(series)}
              disabled={isIgnored}
              aria-label="Mark as not interested"
              aria-pressed={isIgnored}
              data-testid={`search-result-skip-button-${index}`}
            >
              <EyeOff className={`w-4 h-4 mr-1.5 transition-all duration-300 ${isIgnored ? 'opacity-50' : ''}`} />
              {isIgnored ? 'Skipped' : 'Skip'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
