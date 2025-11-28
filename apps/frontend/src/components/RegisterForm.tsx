import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { registerUser } from '../api/queries/register';
import { useState, useMemo } from 'react';
import { z } from 'zod';
import { EyeIcon, EyeOffIcon, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/ApiError';
import { useTranslation } from 'react-i18next';

interface Props {
  onSuccess?: (email?: string) => void;
}

export default function RegisterForm({ onSuccess }: Props) {
  const { t, i18n } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [existingEmail, setExistingEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('validation.nameRequired')).max(64, t('validation.nameMaxLength')),
        email: z.string().email(t('validation.invalidEmail')).max(255, t('validation.emailMaxLength')),
        password: z
          .string()
          .min(8, t('validation.passwordMinLength'))
          .max(64, t('validation.passwordMaxLength'))
          .regex(/[a-z]/, t('validation.passwordLowercase'))
          .regex(/[A-Z]/, t('validation.passwordUppercase'))
          .regex(/\d/, t('validation.passwordDigit'))
          .regex(/[!@#$%^&*(),.?":{}|<>]/, t('validation.passwordSpecial')),
      }),
    [t],
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        language: i18n.language as 'en' | 'pl',
      });

      // Call onSuccess callback if provided, otherwise redirect to dashboard
      if (onSuccess) {
        onSuccess(values.email);
      } else {
        navigate(redirectTo || '/dashboard');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.isErrorType('ResourceAlreadyExistsError')) {
          setExistingEmail(values.email);
          return;
        }

        if (error.isErrorType('TooManyRequestsError')) {
          form.setError('root', {
            message: t('auth.register.tooManyRequests'),
          });
          return;
        }
      }

      form.setError('root', {
        message: t('auth.register.registrationError'),
      });
    } finally {
      setIsSubmitting(false);
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
            name="name"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel
                  htmlFor="name"
                  className="text-sm font-medium text-foreground"
                >
                  {t('auth.register.name')}
                </FormLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      id="name"
                      placeholder={t('auth.register.namePlaceholder')}
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
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  {t('auth.register.email')}
                </FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      id="email"
                      placeholder={t('auth.register.emailPlaceholder')}
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
            render={({ field, fieldState }) => {
              const password = field.value || '';
              const hasMinLength = password.length >= 8;
              const hasLowercase = /[a-z]/.test(password);
              const hasUppercase = /[A-Z]/.test(password);
              const hasDigit = /\d/.test(password);
              const hasSpecial = /[^a-zA-Z0-9]/.test(password);

              const requirementsMet = [hasMinLength, hasLowercase, hasUppercase, hasDigit, hasSpecial].filter(
                Boolean,
              ).length;
              const strengthPercentage = (requirementsMet / 5) * 100;

              let strengthColor = 'bg-destructive';
              let strengthText = t('auth.register.passwordStrength.weak');

              if (requirementsMet >= 5) {
                strengthColor = 'bg-green-500';
                strengthText = t('auth.register.passwordStrength.strong');
              } else if (requirementsMet >= 4) {
                strengthColor = 'bg-yellow-500';
                strengthText = t('auth.register.passwordStrength.good');
              } else if (requirementsMet >= 3) {
                strengthColor = 'bg-orange-500';
                strengthText = t('auth.register.passwordStrength.fair');
              }

              return (
                <FormItem>
                  <FormLabel
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    {t('auth.register.password')}
                  </FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <FormControl>
                      <Input
                        id="password"
                        placeholder={t('auth.register.passwordPlaceholder')}
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
                      aria-label={showPassword ? t('auth.register.hidePassword') : t('auth.register.showPassword')}
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                  {password && (
                    <div className="space-y-1.5 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${strengthColor} transition-all duration-300`}
                            style={{ width: `${strengthPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground min-w-[45px]">{strengthText}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                        <span className={hasMinLength ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}>
                          {hasMinLength ? '✓' : '○'} {t('auth.register.passwordStrength.minLength')}
                        </span>
                        <span className={hasLowercase ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}>
                          {hasLowercase ? '✓' : '○'} {t('auth.register.passwordStrength.lowercase')}
                        </span>
                        <span className={hasUppercase ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}>
                          {hasUppercase ? '✓' : '○'} {t('auth.register.passwordStrength.uppercase')}
                        </span>
                        <span className={hasDigit ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}>
                          {hasDigit ? '✓' : '○'} {t('auth.register.passwordStrength.digit')}
                        </span>
                        <span className={hasSpecial ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}>
                          {hasSpecial ? '✓' : '○'} {t('auth.register.passwordStrength.special')}
                        </span>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold"
              disabled={!form.formState.isValid || form.formState.isSubmitting}
              data-testid="register-submit-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('auth.register.creatingAccount')}
                </>
              ) : (
                t('auth.register.signUp')
              )}
            </Button>
          </div>
        </form>
      </Form>

      {existingEmail && (
        <div className="bg-red-50 mt-4 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <p>{t('auth.register.accountExists', { email: existingEmail })}</p>
          <div className="mt-2 flex items-center justify-center gap-1">
            <Link
              to="/forgot-password"
              className="text-black font-medium"
            >
              {t('auth.register.resetPassword')}
            </Link>
          </div>
        </div>
      )}
      {!existingEmail && form.formState.errors.root && (
        <div className="text-destructive text-sm mt-4 text-center bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {form.formState.errors.root.message}
        </div>
      )}
    </div>
  );
}
