import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { useIsActiveRoute } from '../../hooks/useIsActiveRoute';
import type { NavSection } from '../../hooks/useNavigationSections';

interface NavigationItemProps {
  section: NavSection;
}

export function NavigationItem({ section }: NavigationItemProps) {
  const navigate = useNavigate();
  const isActive = useIsActiveRoute(section.href);

  return (
    <Button
      variant="ghost"
      onClick={() => navigate(section.href)}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap rounded-md',
        'text-muted-foreground hover:text-foreground hover:bg-accent/50',
        isActive && 'text-foreground bg-accent/30',
      )}
    >
      {section.name}
      {isActive && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-primary rounded-full" />
      )}
    </Button>
  );
}
