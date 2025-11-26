import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { useNavigationSections } from '../../hooks/useNavigationSections';

interface MobileNavigationProps {
  onItemClick: () => void;
}

export function MobileNavigation({ onItemClick }: MobileNavigationProps) {
  const { userData, userDataInitialized } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const sections = useNavigationSections(userData);

  const handleNavigation = (href: string) => {
    navigate(href);
    onItemClick();
  };

  const isActiveRoute = (href: string) => {
    if (location.pathname === '/' && href === '/') return true;
    if (href !== '/') return location.pathname.startsWith(href);
    return false;
  };

  return (
    <div className="px-3 py-2 space-y-1">
      {sections.map((section) => {
        const isActive = isActiveRoute(section.href);

        return (
          <Button
            key={section.href}
            variant="ghost"
            onClick={() => handleNavigation(section.href)}
            className={cn(
              'w-full justify-start px-3 py-2 text-sm font-medium rounded-md transition-colors',
              'text-muted-foreground hover:text-primary hover:bg-primary/10',
              isActive && 'text-primary bg-primary/10',
            )}
          >
            {section.name}
          </Button>
        );
      })}

      {userDataInitialized && !userData && (
        <div className="pt-3 mt-2 border-t border-border space-y-1">
          <Button
            variant="ghost"
            onClick={() => handleNavigation('/login')}
            className="w-full justify-start px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-foreground hover:text-foreground hover:bg-accent"
          >
            {t('nav.signIn')}
          </Button>
          <Button
            onClick={() => handleNavigation('/register')}
            className="w-full justify-start px-3 py-2.5 text-sm font-semibold rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            {t('nav.signUp')}
          </Button>
        </div>
      )}
    </div>
  );
}
