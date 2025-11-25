import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';

export function HeaderLogo() {
  const { userData } = useContext(AuthContext);
  const { effectiveTheme } = useTheme();

  return (
    <div className="shrink-0 flex items-center">
      <Link
        to={userData ? '/dashboard' : '/'}
        className="flex items-center gap-1.5 sm:gap-2 group"
      >
        <img
          src={effectiveTheme === 'dark' ? '/logo-white.svg' : '/logo.svg'}
          alt="ShowSync Logo"
          className="h-7 w-7 sm:h-8 sm:w-8 transition-transform group-hover:scale-105"
        />
        <h2 className="text-base sm:text-lg font-semibold tracking-tight">ShowSync</h2>
      </Link>
    </div>
  );
}
