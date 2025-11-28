import { useNavigate } from 'react-router-dom';
import { verifyEmail } from '../api/queries/verifyEmail';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Loader, Mail } from 'lucide-react';
import { resendVerificationEmail } from '../api/queries/resendVerificationEmail';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/Form';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { useTranslation } from 'react-i18next';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token');
  const [emailVerified, setEmailVerified] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showResendForm, setShowResendForm] = useState(false);
  const [emailResent, setEmailResent] = useState(false);
  const navigate = useNavigate();

  const resendSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('validation.invalidEmail')).max(254, t('validation.emailMaxLength')),
      }),
    [t],
  );
  type ResendFormValues = z.infer<typeof resendSchema>;

  const resendForm = useForm<ResendFormValues>({
    resolver: zodResolver(resendSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  async function verifyToken(token: string) {
    try {
      await verifyEmail({ token: token || '' });
      setEmailVerified(true);
    } catch (error) {
      console.error('Failed to verify email', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerificationEmail(values: ResendFormValues) {
    try {
      await resendVerificationEmail({ email: values.email });
      setShowResendForm(false);
      setEmailResent(true);
    } catch (error) {
      console.error('Failed to resend verification email', error);
      toast.error(t('verifyEmail.resendError'));
    }
  }

  useEffect(() => {
    if (!token) {
      toast.error(t('verifyEmail.noToken'));
      navigate('/login');
      return;
    }
    verifyToken(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const getContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <Loader className="h-6 w-6 text-foreground animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t('verifyEmail.verifying')}</h2>
            </div>
          </div>
          <p className="text-muted-foreground">{t('verifyEmail.pleaseWait')}</p>
        </div>
      );
    }

    if (emailVerified) {
      return (
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
              <svg
                className="h-8 w-8 text-foreground"
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
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('verifyEmail.verified')}</h2>
            <p className="text-muted-foreground">{t('verifyEmail.canLogin')}</p>
          </div>
          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            {t('verifyEmail.goToLogin')}
          </Button>
        </div>
      );
    }

    if (emailResent) {
      return (
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
              <Mail className="h-8 w-8 text-foreground" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('verifyEmail.linkSent')}</h2>
            <p className="text-muted-foreground">{t('verifyEmail.clickLink')}</p>
          </div>
          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            {t('verifyEmail.goToLogin')}
          </Button>
          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              {t('verifyEmail.didntReceive')}{' '}
              <Button
                onClick={() => {
                  setEmailResent(false);
                  setShowResendForm(true);
                }}
                variant="link"
                className="h-auto p-0 text-sm font-semibold"
              >
                {t('verifyEmail.sendAgain')}
              </Button>
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">{t('verifyEmail.error')}</h2>
            <p className="text-muted-foreground">{t('verifyEmail.errorMessage')}</p>
          </div>
          {!showResendForm ? (
            <Button
              onClick={() => setShowResendForm(true)}
              className="w-full"
            >
              <Mail className="h-4 w-4" />
              {t('verifyEmail.sendNew')}
            </Button>
          ) : (
            <Form {...resendForm}>
              <form
                onSubmit={resendForm.handleSubmit(handleResendVerificationEmail)}
                className="space-y-4"
              >
                <FormField
                  control={resendForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">{t('verifyEmail.emailAddress')}</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                        <FormControl>
                          <Input
                            placeholder="your@email.com"
                            type="email"
                            className="pl-11"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!resendForm.formState.isValid || resendForm.formState.isSubmitting}
                >
                  {resendForm.formState.isSubmitting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      {t('verifyEmail.sending')}
                    </>
                  ) : (
                    t('verifyEmail.sendLink')
                  )}
                </Button>
              </form>
            </Form>
          )}
        </div>
      );
    }

    return null;
  };

  const content = getContent();

  return (
    <div className="min-h-screen bg-background flex justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('verifyEmail.pageTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('verifyEmail.pageSubtitle')}</p>
        </div>
        <Card className="rounded-xl border border-border shadow-sm">
          <CardContent className="pt-6">{content}</CardContent>
        </Card>
      </div>
    </div>
  );
}
