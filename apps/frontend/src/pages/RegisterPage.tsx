import { useState, useContext } from 'react';
import { Link, useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import { useSEO } from '../hooks/useSEO';
import { AuthContext } from '../context/AuthContext';
import EmailConfirmationStep from '../components/EmailConfirmationStep';
import { Button } from '../components/ui/Button';
import { resendVerificationEmail } from '../api/queries/resendVerificationEmail';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { userData, userDataInitialized } = useContext(AuthContext);
  const navigate = useNavigate();

  useSEO('register');

  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  const handleRegistrationSuccess = (email?: string) => {
    setIsRegistrationSuccess(true);
    if (email) {
      setRegisteredEmail(email);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!registeredEmail) return;

    setIsResendingEmail(true);
    try {
      await resendVerificationEmail({ email: registeredEmail });
      toast.success(t('auth.login.verificationSent'));
    } catch (error) {
      console.error('Failed to resend verification email', error);
      toast.error(t('auth.login.verificationFailed'));
    } finally {
      setIsResendingEmail(false);
    }
  };

  const signInUrl = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';

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

  if (isRegistrationSuccess) {
    return (
      <div className="min-h-screen bg-background flex justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="w-full max-w-md space-y-8">
          <div className="bg-card rounded-xl border border-border p-8 shadow-sm space-y-6">
            <EmailConfirmationStep
              title={t('auth.register.verifyEmailTitle')}
              message={t('auth.register.verifyEmailMessage')}
              buttonText={t('auth.register.goToSignIn')}
              onButtonClick={() => navigate(signInUrl)}
              buttonTestId="back-to-sign-in-button"
            />
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                {t('auth.register.didntReceive')}{' '}
                <Button
                  onClick={handleResendVerificationEmail}
                  disabled={isResendingEmail}
                  variant="link"
                  className="h-auto p-0 text-sm font-semibold"
                >
                  {isResendingEmail ? (
                    <>
                      <Loader className="h-3 w-3 animate-spin" />
                      {t('auth.register.sending')}
                    </>
                  ) : (
                    t('auth.register.sendAgain')
                  )}
                </Button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('auth.register.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.register.subtitle')}</p>
        </div>

        {/* Form Container */}
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm space-y-6">
          <RegisterForm onSuccess={handleRegistrationSuccess} />

          {/* Sign in link */}
          <div className="text-center text-sm text-muted-foreground">
            {t('auth.register.hasAccount')}{' '}
            <Link
              to={signInUrl}
              className="font-semibold text-foreground hover:underline"
            >
              {t('auth.register.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
