import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { registerUser } from '../api/queries/register';
import { useState } from 'react';
import { z } from 'zod';
import { EyeIcon, EyeOffIcon, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/ApiError';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64),
  email: z.string().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(64)
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one digit')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onSuccess?: (email?: string) => void;
}

export default function RegisterForm({ onSuccess }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [existingEmail, setExistingEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            message: 'Too many requests. Please try again later.',
          });
          return;
        }
      }

      form.setError('root', {
        message: 'Error during registration',
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
                  Name
                </FormLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      id="name"
                      placeholder="Enter your name"
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
                  Email address
                </FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      id="email"
                      placeholder="Enter your email"
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
              let strengthText = 'Weak';

              if (requirementsMet >= 5) {
                strengthColor = 'bg-green-500';
                strengthText = 'Strong';
              } else if (requirementsMet >= 4) {
                strengthColor = 'bg-yellow-500';
                strengthText = 'Good';
              } else if (requirementsMet >= 3) {
                strengthColor = 'bg-orange-500';
                strengthText = 'Fair';
              }

              return (
                <FormItem>
                  <FormLabel
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <FormControl>
                      <Input
                        id="password"
                        placeholder="Enter your password"
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
                          {hasMinLength ? '✓' : '○'} 8+ chars
                        </span>
                        <span className={hasLowercase ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}>
                          {hasLowercase ? '✓' : '○'} lowercase
                        </span>
                        <span className={hasUppercase ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}>
                          {hasUppercase ? '✓' : '○'} uppercase
                        </span>
                        <span className={hasDigit ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}>
                          {hasDigit ? '✓' : '○'} digit
                        </span>
                        <span className={hasSpecial ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}>
                          {hasSpecial ? '✓' : '○'} special character
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
                  Creating account..
                </>
              ) : (
                'Sign up'
              )}
            </Button>
          </div>
        </form>
      </Form>

      {existingEmail && (
        <div className="bg-red-50 mt-4 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <p>
            Account with email <span className="font-medium">{existingEmail}</span> already exists.
          </p>
          <div className="mt-2 flex items-center justify-center gap-1">
            <Link
              to="/forgot-password"
              className="text-black font-medium"
            >
              Reset password
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
