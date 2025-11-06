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
    if (disabled) return;
    onToggle(isLoved ? 'like' : 'love');
  };

  const label = isLoved ? 'Loved (click to set to Like)' : 'Like (click to set to Loved)';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleClick}
          disabled={disabled}
          variant="ghost"
          size="icon"
          data-testid="preference-toggle"
          aria-label={label}
          aria-pressed={isLoved}
          className={`relative h-8 w-8 rounded-full p-0 transition-colors
            hover:bg-white/20
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <Heart
            className={`size-6 transition-all duration-300 ease-in-out group-hover:scale-110 group-active:scale-95
              ${isLoved ? 'fill-red-500 text-red-500' : 'text-red-400'}`}
            strokeWidth={2.2}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
