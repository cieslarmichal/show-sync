import { Link, useSearchParams, Navigate } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import { useSEO } from '../hooks/useSEO';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function LoginPage() {
  const { userData, userDataInitialized } = useContext(AuthContext);
  const { t } = useTranslation();

  useSEO('login');

  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  // Handle OAuth error
  useEffect(() => {
    if (searchParams.get('error') === 'oauth_failed') {
      toast.error(t('auth.login.oauthFailed'));
    }
  }, [searchParams, t]);

  const registerUrl = redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register';

  // Show loading state while checking authentication
  if (!userDataInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (userData) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('auth.login.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.login.subtitle')}</p>
        </div>

        {/* Form Container */}
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm space-y-6">
          <LoginForm />

          {/* Sign up link */}
          <div className="text-center text-sm text-muted-foreground">
            {t('auth.login.noAccount')}{' '}
            <Link
              to={registerUrl}
              className="font-semibold text-foreground hover:underline"
            >
              {t('auth.login.signUp')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
