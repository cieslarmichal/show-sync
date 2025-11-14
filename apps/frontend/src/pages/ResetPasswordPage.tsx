import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { validateOneTimeToken } from '@/api/queries/validateOneTimeToken';
import { resetPassword } from '@/api/queries/resetPassword';
import { useSEO } from '@/hooks/useSEO';

const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

export default function ResetPasswordPage() {
  useSEO({
    title: 'Set New Password - ShowSync',
    description: 'Create a new password for your ShowSync account.',
    keywords: ['reset password', 'new password', 'change password'],
  });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [tokenStatus, setTokenStatus] = useState<'validating' | 'valid' | 'invalid'>('validating');
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenStatus('invalid');
        return;
      }

      try {
        const response = await validateOneTimeToken({
          token,
          purpose: 'reset-password',
        });

        setTokenStatus(response.valid ? 'valid' : 'invalid');
      } catch {
        setTokenStatus('invalid');
      }
    };

    validateToken();
  }, [token]);

  async function onSubmit(values: FormValues) {
    if (!token) {
      form.setError('root', { message: 'Invalid reset token' });
      return;
    }

    try {
      await resetPassword({
        token,
        newPassword: values.newPassword,
      });

      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to reset password',
      });
    }
  }

  // Token is being validated
  if (tokenStatus === 'validating') {
    return (
      <div className="min-h-screen bg-background flex justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Validating Token</h2>
          </div>
          <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto border-2 border-border">
                <Loader2 className="w-8 h-8 text-foreground animate-spin" />
              </div>
              <p className="text-muted-foreground">Verifying your reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid or expired token
  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-background flex justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Link Expired</h2>
          </div>
          <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto border-2 border-destructive/20">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-medium">This reset link is no longer valid.</p>
                <p className="text-muted-foreground text-sm">
                  Password reset links expire after 1 hour for security. Request a new one below.
                </p>
              </div>
              <div className="space-y-3">
                <Link to="/forgot-password">
                  <Button
                    className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold"
                    data-testid="request-new-link-button"
                  >
                    Request New Reset Link
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    data-testid="back-to-login-button"
                  >
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Password Updated!</h2>
          </div>
          <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/20">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-medium">Your new password is active!</p>
                <p className="text-muted-foreground text-sm">Taking you to sign in...</p>
              </div>
              <Link to="/login">
                <Button
                  className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold"
                  data-testid="go-to-login-button"
                >
                  Go to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Valid token - show reset form
  return (
    <div className="min-h-screen bg-background flex justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Create New Password</h2>
          <p className="mt-2 text-sm text-muted-foreground">Choose a strong password you haven't used before</p>
        </div>

        {/* Form Container */}
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm space-y-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel
                      htmlFor="newPassword"
                      className="text-sm font-medium text-foreground"
                    >
                      New Password
                    </FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Enter new password"
                          className="pl-10 h-11"
                          aria-invalid={!!fieldState.error}
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-foreground"
                    >
                      Confirm Password
                    </FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm new password"
                          className="pl-10 h-11"
                          aria-invalid={!!fieldState.error}
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold"
                  disabled={!form.formState.isValid || form.formState.isSubmitting}
                  data-testid="reset-password-button"
                >
                  {form.formState.isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          </Form>

          {form.formState.errors.root && (
            <div className="text-destructive text-sm mt-4 text-center bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {form.formState.errors.root.message}
            </div>
          )}

          {/* Password requirements */}
          <div className="bg-muted/50 rounded-md p-4 space-y-2">
            <p className="text-xs font-medium text-foreground">Your password must include:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>At least 8 characters</li>
              <li>Uppercase and lowercase letters</li>
              <li>At least one number</li>
            </ul>
          </div>

          {/* Back to login link */}
          <div className="text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link
              to="/login"
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
