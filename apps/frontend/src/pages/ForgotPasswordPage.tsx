import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { requestPasswordReset } from '@/api/queries/requestPasswordReset';
import { useSEO } from '@/hooks/useSEO';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  const formSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('validation.invalidEmail')).max(64, t('validation.emailMaxLength')),
      }),
    [t],
  );

  type FormValues = z.infer<typeof formSchema>;
  useSEO('forgotPassword');

  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await requestPasswordReset({ email: values.email });
      setIsSubmitted(true);
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to send reset email',
      });
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex  justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('auth.forgotPassword.checkInbox')}</h2>
          </div>

          {/* Success Card */}
          <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto border-2 border-border">
                  <Mail className="w-8 h-8 text-foreground" />
                </div>
                <p className="text-muted-foreground">{t('auth.forgotPassword.emailSent')}</p>
              </div>
              <Link to="/login">
                <Button
                  className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold"
                  data-testid="back-to-login-button"
                >
                  {t('auth.forgotPassword.backToSignIn')}
                </Button>
              </Link>
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
          <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('auth.forgotPassword.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.forgotPassword.subtitle')}</p>
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

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold"
                  disabled={!form.formState.isValid || form.formState.isSubmitting}
                  data-testid="reset-password-submit-button"
                >
                  {form.formState.isSubmitting
                    ? t('auth.forgotPassword.sending')
                    : t('auth.forgotPassword.sendInstructions')}
                </Button>
              </div>
            </form>
          </Form>

          {form.formState.errors.root && (
            <div className="text-destructive text-sm mt-4 text-center bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {form.formState.errors.root.message}
            </div>
          )}

          {/* Back to login link */}
          <div className="text-center text-sm text-muted-foreground">
            {t('auth.forgotPassword.rememberPassword')}{' '}
            <Link
              to="/login"
              className="font-semibold text-foreground hover:underline"
            >
              {t('auth.forgotPassword.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
