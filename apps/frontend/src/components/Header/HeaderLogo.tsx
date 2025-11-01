import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export function HeaderLogo() {
  const { userData } = useContext(AuthContext);

  return (
    <div className="shrink-0 flex items-center">
      <Link
        to={userData ? '/dashboard' : '/'}
        className="flex items-center gap-2"
      >
        <div className="h-8 w-8 bg-foreground rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
          <span className="text-background font-bold text-sm">SM</span>
        </div>
        <h2 className="text-lg font-semibold tracking-tight">10x Series Matcher</h2>
      </Link>
    </div>
  );
}
