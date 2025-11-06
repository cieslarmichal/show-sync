import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { UserMenu } from './UserMenu';

export function DesktopAuthSection() {
  const { userData, userDataInitialized } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!userDataInitialized) {
    return (
      <div className="flex items-center gap-2 lg:gap-3">
        <Skeleton className="h-10 w-10 rounded-full bg-muted" />
      </div>
    );
  }

  if (userData) {
    const initial = (userData.email?.[0] || 'U').toUpperCase();

    return (
      <div className="flex items-center justify-end">
        <UserMenu
          initial={initial}
          size="large"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <Button
        variant="link"
        size="lg"
        onClick={() => navigate('/login')}
        className="text-sm text-muted-foreground whitespace-nowrap h-10 px-3"
      >
        Sign In
      </Button>
      <Button
        size="lg"
        onClick={() => navigate('/register')}
        className="text-sm bg-primary hover:bg-primary/90 transition-all duration-300 font-semibold text-primary-foreground rounded-md whitespace-nowrap h-10 px-3"
      >
        Sign Up
      </Button>
    </div>
  );
}
