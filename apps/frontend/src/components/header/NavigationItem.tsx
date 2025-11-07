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
        'relative px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
        'text-muted-foreground hover:text-primary hover:bg-transparent',
        isActive && 'text-primary',
      )}
    >
      {section.name}
      {isActive && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary" />}
    </Button>
  );
}
