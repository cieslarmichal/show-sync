import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { registerUser } from '../api/queries/register';
import { useState } from 'react';
import { z } from 'zod';
import { EyeIcon, EyeOffIcon, InfoIcon, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/ApiError';

const formSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Invalid email address').max(64),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(64)
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one digit')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Passwords must match',
    path: ['passwordConfirmation'],
  });

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [existingEmail, setExistingEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirmation: '',
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
        onSuccess();
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
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="name"
                  className="text-sm font-medium text-foreground"
                >
                  Name
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      className="pl-10 h-11"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email address
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      placeholder="Enter your email"
                      className="pl-10 h-11"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </FormLabel>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-xs"
                    >
                      <p>
                        Password must contain at least 8 characters, one lowercase letter, one uppercase letter, one
                        digit and one special character.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      placeholder="At least 8 characters"
                      type={showPassword ? 'text' : 'password'}
                      className="pl-10 h-11"
                      {...field}
                    />
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordConfirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="passwordConfirmation"
                  className="text-sm font-medium text-foreground"
                >
                  Repeat Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="passwordConfirmation"
                      placeholder="Repeat password"
                      type={showPasswordConfirmation ? 'text' : 'password'}
                      className="pl-10 h-11"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      tabIndex={-1}
                      aria-label={
                        showPasswordConfirmation ? 'Hide password confirmation' : 'Show password confirmation'
                      }
                    >
                      {showPasswordConfirmation ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
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
