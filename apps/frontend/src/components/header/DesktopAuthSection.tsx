import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';

export function DesktopAuthSection() {
  const { userData, userDataInitialized } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!userDataInitialized) {
    return (
      <div className="flex items-center gap-2 lg:gap-3">
        <LanguageToggle />
        <ThemeToggle />
        <Skeleton className="h-10 w-10 rounded-full bg-muted" />
      </div>
    );
  }

  if (userData) {
    const initial = (userData.email?.[0] || 'U').toUpperCase();

    return (
      <div className="flex items-center justify-end gap-2">
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="h-6 w-px bg-border mx-1" />
        <UserMenu
          initial={initial}
          size="large"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="h-6 w-px bg-border mx-1" />
      <Button
        variant="ghost"
        size="lg"
        onClick={() => navigate('/login')}
        className="text-sm text-foreground hover:text-foreground hover:bg-accent font-medium whitespace-nowrap h-9 px-4 rounded-lg transition-all duration-200"
      >
        {t('nav.signIn')}
      </Button>
      <Button
        size="lg"
        onClick={() => navigate('/register')}
        className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold whitespace-nowrap h-9 px-5 rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
      >
        {t('nav.signUp')}
      </Button>
    </div>
  );
}
