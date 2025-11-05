import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export function HeaderLogo() {
  const { userData } = useContext(AuthContext);

  return (
    <div className="shrink-0 flex items-center">
      <Link
        to={userData ? '/dashboard' : '/'}
        className="flex items-center gap-2 group"
      >
        <img 
          src="/logo.svg" 
          alt="10x Series Matcher Logo" 
          className="h-8 w-8 transition-transform group-hover:scale-105"
        />
        <h2 className="text-lg font-semibold tracking-tight">10x Series Matcher</h2>
      </Link>
    </div>
  );
}
