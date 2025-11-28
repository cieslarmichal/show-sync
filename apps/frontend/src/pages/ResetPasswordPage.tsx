import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { validateOneTimeToken } from '@/api/queries/validateOneTimeToken';
import { resetPassword } from '@/api/queries/resetPassword';
import { useSEO } from '@/hooks/useSEO';
import { useTranslation } from 'react-i18next';

export default function ResetPasswordPage() {
  const { t } = useTranslation();

  const formSchema = useMemo(
    () =>
      z
        .object({
          newPassword: z
            .string()
            .min(8, t('validation.passwordMinLength'))
            .max(128, t('validation.passwordMaxLength'))
            .regex(/[A-Z]/, t('validation.passwordUppercase'))
            .regex(/[a-z]/, t('validation.passwordLowercase'))
            .regex(/[0-9]/, t('validation.passwordDigit'))
            .regex(/[!@#$%^&*(),.?":{}|<>]/, t('validation.passwordSpecial')),
          confirmPassword: z.string(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          path: ['confirmPassword'],
          message: t('validation.passwordsMatch'),
        }),
    [t],
  );

  type FormValues = z.infer<typeof formSchema>;
  useSEO('resetPassword');

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [tokenStatus, setTokenStatus] = useState<'validating' | 'valid' | 'invalid'>('validating');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('auth.resetPassword.validating')}</h2>
          </div>
          <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto border-2 border-border">
                <Loader2 className="w-8 h-8 text-foreground animate-spin" />
              </div>
              <p className="text-muted-foreground">{t('auth.resetPassword.verifying')}</p>
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
            <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('auth.resetPassword.linkExpired')}</h2>
          </div>
          <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto border-2 border-destructive/20">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-medium">{t('auth.resetPassword.invalidLink')}</p>
                <p className="text-muted-foreground text-sm">{t('auth.resetPassword.expiredMessage')}</p>
              </div>
              <div className="space-y-3">
                <Link to="/forgot-password">
                  <Button
                    className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold"
                    data-testid="request-new-link-button"
                  >
                    {t('auth.resetPassword.requestNew')}
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    data-testid="back-to-login-button"
                  >
                    {t('auth.resetPassword.backToSignIn')}
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
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              {t('auth.resetPassword.successTitle')}
            </h2>
          </div>
          <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/20">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-medium">{t('auth.resetPassword.successMessage')}</p>
                <p className="text-muted-foreground text-sm">{t('auth.resetPassword.redirecting')}</p>
              </div>
              <Link to="/login">
                <Button
                  className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold"
                  data-testid="go-to-login-button"
                >
                  {t('auth.resetPassword.goToSignIn')}
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
          <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('auth.resetPassword.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.resetPassword.subtitle')}</p>
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
                      {t('auth.resetPassword.newPassword')}
                    </FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
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
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex={-1}
                        aria-label={showNewPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
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
                      {t('auth.resetPassword.confirmPassword')}
                    </FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
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
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
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
                  {form.formState.isSubmitting
                    ? t('auth.resetPassword.resetting')
                    : t('auth.resetPassword.resetButton')}
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
            <p className="text-xs font-medium text-foreground">{t('auth.resetPassword.requirements')}</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>{t('auth.resetPassword.requirement1')}</li>
              <li>{t('auth.resetPassword.requirement2')}</li>
              <li>{t('auth.resetPassword.requirement3')}</li>
              <li>{t('auth.resetPassword.requirement4')}</li>
              <li>{t('auth.resetPassword.requirement5')}</li>
            </ul>
          </div>

          {/* Back to login link */}
          <div className="text-center text-sm text-muted-foreground">
            {t('auth.resetPassword.rememberPassword')}{' '}
            <Link
              to="/login"
              className="font-semibold text-foreground hover:underline"
            >
              {t('auth.resetPassword.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
