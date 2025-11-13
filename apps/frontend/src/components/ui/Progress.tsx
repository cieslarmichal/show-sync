import { cn } from '@/lib/utils';

export interface ProgressProps {
  value: number;
  max: number;
  milestones?: Array<{ value: number; label: string; color?: string }>;
  showMilestones?: boolean;
  className?: string;
  barClassName?: string;
}

function Progress({ value, max, milestones = [], className, barClassName }: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const getBarColor = () => {
    if (milestones.length === 0) return 'bg-primary';

    // Find the current milestone tier
    const sortedMilestones = [...milestones].sort((a, b) => a.value - b.value);
    let currentColor = 'bg-gradient-to-r from-amber-500 to-amber-400';

    for (const milestone of sortedMilestones) {
      if (value >= milestone.value && milestone.color) {
        currentColor = milestone.color;
      }
    }

    return currentColor;
  };

  return (
    <div className={cn('relative', className)}>
      <div
        className="w-full rounded-full h-3 bg-gray-200 dark:bg-gray-700 border border-black/5 dark:border-white/10 overflow-visible relative"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        {/* Progress bar */}
        <div
          className={cn(
            'h-3 rounded-full transition-all duration-500 motion-reduce:transition-none',
            getBarColor(),
            barClassName,
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export { Progress };
