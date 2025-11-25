import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '../ThemeToggle';

export function DesktopAuthSection() {
  const { userData, userDataInitialized } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!userDataInitialized) {
    return (
      <div className="flex items-center gap-2 lg:gap-3">
        <ThemeToggle />
        <Skeleton className="h-10 w-10 rounded-full bg-muted" />
      </div>
    );
  }

  if (userData) {
    const initial = (userData.email?.[0] || 'U').toUpperCase();

    return (
      <div className="flex items-center justify-end gap-2">
        <ThemeToggle />
        <UserMenu
          initial={initial}
          size="large"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 lg:gap-4">
      <ThemeToggle />
      <Button
        variant="ghost"
        size="lg"
        onClick={() => navigate('/login')}
        className="text-sm text-foreground hover:text-foreground hover:bg-accent font-medium whitespace-nowrap h-10 px-4 rounded-md transition-colors"
      >
        Sign In
      </Button>
      <Button
        size="lg"
        onClick={() => navigate('/register')}
        className="text-sm bg-foreground hover:bg-foreground/90 text-background font-semibold whitespace-nowrap h-10 px-5 rounded-md shadow-sm hover:shadow transition-all duration-200"
      >
        Sign Up
      </Button>
    </div>
  );
}
