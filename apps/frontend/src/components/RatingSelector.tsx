import { ThumbsUp, Heart, ThumbsDown } from 'lucide-react';
import { Rating } from '../api/types/series';
import { Button } from './ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';

interface RatingSelectorProps {
  rating: Rating;
  onSelect: (rating: Rating) => void;
  disabled?: boolean;
}

export function RatingSelector({ rating, onSelect, disabled = false }: RatingSelectorProps) {
  const getRatingLabel = (currentRating: Rating): string => {
    switch (currentRating) {
      case 'love':
        return 'Love';
      case 'like':
        return 'Like';
      case 'dislike':
        return 'Dislike';
    }
  };

  const getRatingColor = (currentRating: Rating): string => {
    switch (currentRating) {
      case 'love':
        return 'text-red-500';
      case 'like':
        return 'text-sky-500';
      case 'dislike':
        return 'text-amber-500';
    }
  };

  const getRatingIcon = (currentRating: Rating) => {
    const className = `size-6 transition-all duration-300 ${getRatingColor(currentRating)}`;
    switch (currentRating) {
      case 'love':
        return <Heart className={`${className} fill-current`} strokeWidth={2.2} />;
      case 'like':
        return <ThumbsUp className={className} strokeWidth={2.2} />;
      case 'dislike':
        return <ThumbsDown className={`${className} fill-current`} strokeWidth={2.2} />;
    }
  };

  const cycleRating = () => {
    if (disabled) return;
    
    const ratingCycle: Rating[] = ['like', 'love', 'dislike'];
    const currentIndex = ratingCycle.indexOf(rating);
    const nextIndex = (currentIndex + 1) % ratingCycle.length;
    onSelect(ratingCycle[nextIndex]);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={cycleRating}
          disabled={disabled}
          variant="ghost"
          size="icon"
          data-testid="rating-selector"
          aria-label={`Current: ${getRatingLabel(rating)} (click to change)`}
          className={`relative h-8 w-8 rounded-full p-0 transition-colors
            hover:bg-white/20
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {getRatingIcon(rating)}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="hidden sm:block"
      >
        {getRatingLabel(rating)} (click to change)
      </TooltipContent>
    </Tooltip>
  );
}
