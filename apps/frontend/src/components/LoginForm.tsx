import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState, useMemo } from 'react';

import { Button } from '@/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { loginUser } from '../api/queries/login';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { EyeIcon, EyeOffIcon, Mail, Lock, Loader } from 'lucide-react';
import { ApiError } from '../api/ApiError';
import { resendVerificationEmail } from '../api/queries/resendVerificationEmail';
import { toast } from 'sonner';
import { config } from '../config';
import { useTranslation } from 'react-i18next';

export default function LoginForm() {
  const { t } = useTranslation();

  const formSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('validation.invalidEmail')).max(254, t('validation.emailMaxLength')),
        password: z.string().min(8, t('validation.passwordMinLength')).max(64, t('validation.passwordMaxLength')),
      }),
    [t],
  );

  type FormValues = z.infer<typeof formSchema>;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const redirectTo = searchParams.get('redirect');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function handleResendVerificationEmail() {
    setIsResendingEmail(true);
    try {
      await resendVerificationEmail({ email: unverifiedEmail });
      toast.success(t('auth.login.verificationSent'));
      setEmailNotVerified(false);
      setUnverifiedEmail('');
    } catch (error) {
      console.error('Failed to resend verification email', error);
      toast.error(t('auth.login.verificationFailed'));
    } finally {
      setIsResendingEmail(false);
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      setEmailNotVerified(false);
      setUnverifiedEmail('');

      await loginUser({ email: values.email, password: values.password });

      // Small delay to allow the access token to be set in the context
      await new Promise((resolve) => setTimeout(resolve, 500));

      navigate(redirectTo || '/dashboard');
    } catch (error) {
      if (error instanceof ApiError) {
        // Handle email not verified error (only if email verification is enabled)
        if (config.emailVerification.enabled && error.isErrorType('UnauthorizedAccessError')) {
          const reason = error.getContextValue<string>('reason');
          if (reason === 'Email not verified') {
            setEmailNotVerified(true);
            setUnverifiedEmail(values.email);
            return;
          }
        }

        // Handle rate limiting
        if (error.isErrorType('TooManyRequestsError')) {
          form.setError('root', {
            message: t('auth.login.tooManyAttempts'),
          });
          return;
        }
      }

      form.setError('root', {
        message: t('auth.login.invalidCredentials'),
      });
    }
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  {t('auth.login.email')}
                </FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      id="email"
                      placeholder={t('auth.login.emailPlaceholder')}
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
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  {t('auth.login.password')}
                </FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      id="password"
                      placeholder={t('auth.login.passwordPlaceholder')}
                      type={showPassword ? 'text' : 'password'}
                      className="pl-10 h-11"
                      aria-invalid={!!fieldState.error}
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Forgot password link */}
          <div className="text-left pt-2">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-foreground hover:underline"
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold"
              disabled={!form.formState.isValid || form.formState.isSubmitting}
              data-testid="login-submit-button"
            >
              {form.formState.isSubmitting ? t('auth.login.signingIn') : t('auth.login.signIn')}
            </Button>
          </div>
        </form>
      </Form>
      {form.formState.errors.root && (
        <div className="text-destructive text-sm mt-4 text-center bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {form.formState.errors.root.message}
        </div>
      )}
      {emailNotVerified && (
        <div className="mt-4 bg-card border border-border rounded-md p-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t('auth.login.emailNotVerified')}</p>
              <p className="text-sm text-muted-foreground">
                {t('auth.login.emailNotVerifiedMessage')}{' '}
                <Button
                  onClick={handleResendVerificationEmail}
                  disabled={isResendingEmail}
                  variant="link"
                  className="h-auto p-0 text-sm font-semibold"
                >
                  {isResendingEmail ? (
                    <>
                      <Loader className="h-3 w-3 animate-spin" />
                      {t('auth.login.sending')}
                    </>
                  ) : (
                    t('auth.login.resendVerification')
                  )}
                </Button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
