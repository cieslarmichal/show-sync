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
import { config } from '../config';

export default function RegisterPage() {
  const { userData, userDataInitialized } = useContext(AuthContext);
  const navigate = useNavigate();

  useSEO({
    title: 'Create Account - ShowSync',
    description:
      'Join ShowSync for free and get AI-powered TV recommendations. Find shows everyone will love with smart matching for groups and solo viewers.',
    keywords: ['sign up', 'register', 'create account', 'join showsync', 'free account'],
  });

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
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Failed to resend verification email', error);
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setIsResendingEmail(false);
    }
  };

  const signInUrl = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';

  // Show loading state while checking authentication
  if (!userDataInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
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
            {config.emailVerification.enabled ? (
              <>
                <EmailConfirmationStep
                  title="Verify Your Email"
                  message="We've sent you a verification email. Click the link in the email to activate your account."
                  buttonText="Go to Sign In"
                  onButtonClick={() => navigate(signInUrl)}
                />
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground text-center">
                    Didn't receive the email?{' '}
                    <Button
                      onClick={handleResendVerificationEmail}
                      disabled={isResendingEmail}
                      variant="link"
                      className="h-auto p-0 text-sm font-semibold"
                    >
                      {isResendingEmail ? (
                        <>
                          <Loader className="h-3 w-3 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send again'
                      )}
                    </Button>
                  </p>
                </div>
              </>
            ) : (
              <EmailConfirmationStep
                title="You're All Set!"
                message="Your account is ready. Sign in to start rating shows and creating watch rooms."
                buttonText="Go to Sign In"
                onButtonClick={() => navigate(signInUrl)}
                icon="check"
              />
            )}
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
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Start Discovering</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create your free account in seconds</p>
        </div>

        {/* Form Container */}
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm space-y-6">
          <RegisterForm onSuccess={handleRegistrationSuccess} />

          {/* Sign in link */}
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to={signInUrl}
              className="font-semibold text-foreground hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
