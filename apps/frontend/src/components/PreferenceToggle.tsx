import { Heart } from 'lucide-react';
import { PreferenceLevel } from '../api/types/series.ts';
import { Button } from './ui/Button.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip.tsx';

interface PreferenceToggleProps {
  preferenceLevel: PreferenceLevel;
  onToggle: (newLevel: PreferenceLevel) => void;
  disabled?: boolean;
}

export function PreferenceToggle({ preferenceLevel, onToggle, disabled = false }: PreferenceToggleProps) {
  const isLoved = preferenceLevel === 'love';

  const handleClick = () => {
    onToggle(isLoved ? 'like' : 'love');
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleClick}
          disabled={disabled}
          variant="ghost"
          size="icon"
          className={`
            w-8 h-8 rounded-full transition-all duration-200
            ${
              isLoved
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500'
                : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
            }
          `}
          aria-label={isLoved ? 'Mark as liked' : 'Mark as loved'}
        >
          <Heart className={`w-4 h-4 transition-all ${isLoved ? 'fill-current' : ''}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isLoved ? 'Loved (click to change to Like)' : 'Liked (click to change to Love)'}
      </TooltipContent>
    </Tooltip>
  );
}
