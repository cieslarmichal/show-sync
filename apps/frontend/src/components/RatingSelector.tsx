import { ThumbsUp, Heart, ThumbsDown } from 'lucide-react';
import { useState } from 'react';
import { Rating } from '../api/types/series';
import { Button } from './ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';

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
        return 'text-white';
      case 'like':
        return 'text-white';
      case 'dislike':
        return 'text-white';
    }
  };

  const getRatingBgColor = (currentRating: Rating): string => {
    switch (currentRating) {
      case 'love':
        return 'bg-red-500/90';
      case 'like':
        return 'bg-emerald-500/90';
      case 'dislike':
        return 'bg-orange-500/90';
    }
  };

  const getRatingIcon = (currentRating: Rating) => {
    const className = `size-3.5 transition-all duration-200 ${getRatingColor(currentRating)}`;
    switch (currentRating) {
      case 'love':
        return (
          <Heart
            className={`${className} fill-current`}
            strokeWidth={2}
          />
        );
      case 'like':
        return (
          <ThumbsUp
            className={`${className} fill-current`}
            strokeWidth={2}
          />
        );
      case 'dislike':
        return (
          <ThumbsDown
            className={`${className} fill-current`}
            strokeWidth={2}
          />
        );
    }
  };

  const [open, setOpen] = useState(false);

  const handleSelect = (newRating: Rating) => {
    onSelect(newRating);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="ghost"
          size="icon"
          data-testid="rating-selector"
          aria-label={`Current rating: ${getRatingLabel(rating)}. Click to change.`}
          className={`relative h-8 w-8 rounded-full p-0 transition-all duration-200 shadow-md backdrop-blur-sm
            ${getRatingBgColor(rating)}
            ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 active:scale-95'}`}
        >
          {getRatingIcon(rating)}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        align="start"
      >
        <div className="flex gap-2">
          <Button
            onClick={() => handleSelect('like')}
            variant="ghost"
            size="icon"
            className={`h-10 w-10 rounded-full transition-all duration-200 bg-emerald-500/90 hover:bg-emerald-600 hover:scale-110 ${
              rating === 'like' ? 'ring-2 ring-emerald-300 ring-offset-2' : ''
            }`}
            aria-label="Like"
          >
            <ThumbsUp className="size-4 text-white fill-current" />
          </Button>
          <Button
            onClick={() => handleSelect('love')}
            variant="ghost"
            size="icon"
            className={`h-10 w-10 rounded-full transition-all duration-200 bg-red-500/90 hover:bg-red-600 hover:scale-110 ${
              rating === 'love' ? 'ring-2 ring-red-300 ring-offset-2' : ''
            }`}
            aria-label="Love"
          >
            <Heart className="size-4 text-white fill-current" />
          </Button>
          <Button
            onClick={() => handleSelect('dislike')}
            variant="ghost"
            size="icon"
            className={`h-10 w-10 rounded-full transition-all duration-200 bg-orange-500/90 hover:bg-orange-600 hover:scale-110 ${
              rating === 'dislike' ? 'ring-2 ring-orange-300 ring-offset-2' : ''
            }`}
            aria-label="Dislike"
          >
            <ThumbsDown className="size-4 text-white fill-current" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
