import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import { Button } from '@/components/ui/Button';
import { useSEO } from '../hooks/useSEO';

export default function RegisterPage() {
  useSEO({
    title: 'Create Account - ShowSync',
    description:
      'Join ShowSync for free and get AI-powered TV recommendations. Find shows everyone will love with smart matching for groups and solo viewers.',
    keywords: ['sign up', 'register', 'create account', 'join showsync', 'free account'],
  });

  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);

  const handleRegistrationSuccess = () => {
    setIsRegistrationSuccess(true);
  };

  const signInUrl = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';

  if (isRegistrationSuccess) {
    return (
      <div className="min-h-screen bg-background flex  justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">You're All Set!</h2>
          </div>

          {/* Success Card */}
          <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto border-2 border-border">
                  <svg
                    className="w-8 h-8 text-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground tracking-tight">Welcome to ShowSync!</h3>
                <p className="text-muted-foreground">
                  Your account is ready. Sign in to start rating shows and creating watch rooms.
                </p>
              </div>
              <Button
                onClick={() => (window.location.href = signInUrl)}
                className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold"
                data-testid="back-to-sign-in-button"
              >
                Back to Sign In
              </Button>
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
