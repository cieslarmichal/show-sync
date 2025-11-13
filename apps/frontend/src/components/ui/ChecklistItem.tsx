import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChecklistItemProps {
  number: number;
  title: string;
  subtitle?: string;
  completed: boolean;
  onClick?: () => void;
}

export function ChecklistItem({ number, title, subtitle, completed, onClick }: ChecklistItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer group',
        completed
          ? 'bg-muted/20 border border-muted-foreground/20 hover:bg-muted/30 hover:shadow-sm'
          : 'bg-muted/30 hover:bg-muted/50 hover:shadow-sm border border-transparent',
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
          completed
            ? 'bg-emerald-500 text-white shadow-sm group-hover:scale-110'
            : 'bg-background text-muted-foreground border-2 border-border group-hover:scale-110',
        )}
      >
        {completed ? <Check className="w-3.5 h-3.5 animate-in zoom-in-50 duration-300" /> : <span>{number}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-sm font-medium transition-colors duration-300',
            completed ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className={cn(
              'text-xs transition-colors duration-300',
              completed ? 'text-muted-foreground/70' : 'text-muted-foreground',
            )}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
