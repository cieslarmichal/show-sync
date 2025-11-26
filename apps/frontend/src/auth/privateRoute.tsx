import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext.tsx';
import { Navigate, useLocation } from 'react-router-dom';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { userData, userDataInitialized } = useContext(AuthContext);
  const { t } = useTranslation();
  const location = useLocation();

  // Show loading state while checking authentication
  if (!userDataInitialized) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
        <div className="text-lg text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!userData) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}
