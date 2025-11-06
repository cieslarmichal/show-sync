import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { UserMenu } from './UserMenu';

export function MobileAuthSection() {
  const { userData, userDataInitialized } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!userDataInitialized) {
    return <Skeleton className="h-8 w-8 rounded-full bg-muted" />;
  }

  if (userData) {
    const initial = (userData.email?.[0] || 'U').toUpperCase();

    return (
      <div className="flex items-center gap-2">
        <UserMenu
          initial={initial}
          size="small"
        />
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => navigate('/register')}
      className="text-xs bg-foreground hover:bg-foreground/90 text-background font-semibold h-8 px-4 rounded-md shadow-sm transition-all"
    >
      Sign Up
    </Button>
  );
}
