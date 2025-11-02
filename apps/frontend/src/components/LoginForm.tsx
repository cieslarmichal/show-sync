'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { loginUser } from '../api/queries/login';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email().max(64),
  password: z.string().min(8).max(64),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const redirectTo = searchParams.get('redirect');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await loginUser({ email: values.email, password: values.password });

      navigate(redirectTo || '/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid email or password';
      
      if (errorMessage.includes('Too many requests') || errorMessage.includes('Rate limit')) {
        form.setError('root', {
          message: 'Too many login attempts. Please wait 10 minutes before trying again.',
        });
      } else {
        form.setError('root', {
          message: 'Invalid email or password',
        });
      }
    }
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    id="email"
                    placeholder="name@domain.com"
                    {...field}
                  />
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
                <FormLabel
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="password"
                      placeholder="Enter your password"
                      type={showPassword ? 'text' : 'password'}
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

          <Button
            type="submit"
            className="w-full h-11 mt-6"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
            data-testid="login-submit-button"
          >
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Form>
      {form.formState.errors.root && (
        <div className="text-destructive text-sm mt-4 text-center bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {form.formState.errors.root.message}
        </div>
      )}
    </div>
  );
}
