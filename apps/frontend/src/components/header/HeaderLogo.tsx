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
        className="flex items-center gap-2 group transition-opacity hover:opacity-90"
        aria-label="ShowSync - Home"
      >
        <img
          src={effectiveTheme === 'dark' ? '/logo-white.svg' : '/logo.svg'}
          alt="ShowSync Logo"
          className="h-8 w-8 transition-transform duration-200 group-hover:scale-110"
        />
        <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">ShowSync</h2>
      </Link>
    </div>
  );
}
