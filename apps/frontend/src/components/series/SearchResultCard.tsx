import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ThumbsUp, Heart, ThumbsDown, EyeOff, CalendarPlus } from 'lucide-react';
import { Series, Rating, WatchlistType } from '../../api/types/series';

interface SearchResultCardProps {
  series: Series;
  index: number;
  isInProfile: boolean;
  isInWatchlist: boolean;
  onAddRating: (series: Series, rating: Rating) => void;
  onAddToWatchlist: (series: Series, type: WatchlistType) => void;
}

const truncateToTwoSentences = (text: string): string => {
  if (!text) return '';
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences = text.match(sentenceRegex);
  if (!sentences || sentences.length === 0) return text;
  const twoSentences = sentences.slice(0, 2).join(' ').trim();
  return twoSentences.endsWith('.') ? twoSentences : twoSentences + '.';
};

export function SearchResultCard({
  series,
  index,
  isInProfile,
  isInWatchlist,
  onAddRating,
  onAddToWatchlist,
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
                <Badge variant="secondary" className="text-xs">
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
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddRating(series, 'love')}
                disabled={isInProfile}
                data-testid={`search-result-love-button-${index}`}
              >
                <Heart className="w-4 h-4 mr-1.5" />
                Love
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddRating(series, 'like')}
                disabled={isInProfile}
                data-testid={`search-result-like-button-${index}`}
              >
                <ThumbsUp className="w-4 h-4 mr-1.5" />
                Like
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddRating(series, 'dislike')}
                disabled={isInProfile}
                data-testid={`search-result-dislike-button-${index}`}
              >
                <ThumbsDown className="w-4 h-4 mr-1.5" />
                Dislike
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddToWatchlist(series, 'notInterested')}
                disabled={isInWatchlist}
                data-testid={`search-result-not-interested-button-${index}`}
              >
                <EyeOff className="w-4 h-4 mr-1.5" />
                Not Interested
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddToWatchlist(series, 'wantToWatch')}
                disabled={isInWatchlist}
                data-testid={`search-result-want-to-watch-button-${index}`}
              >
                <CalendarPlus className="w-4 h-4 mr-1.5" />
                Want to Watch
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
