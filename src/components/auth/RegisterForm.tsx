'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { registerSchema, type RegisterInput } from '@/schemas/auth';
import { signUpWithEmail } from '@/lib/supabase/auth';
import PasswordStrengthMeter from './PasswordStrengthMeter';

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = form.watch('password');

  const onSubmit = async (data: RegisterInput) => {
    try {
      setError(null);
      const result = await signUpWithEmail(
        data.email,
        data.password,
        data.displayName
      );

      // If user exists but no session, email confirmation is needed
      if (result.user && !result.session) {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create account';

      if (message.includes('already registered')) {
        setError(
          'An account with this email already exists. Try signing in instead.'
        );
      } else {
        setError(message);
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
        <div>
          <h3 className="text-lg font-semibold">Check your email</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ve sent a confirmation link to your email address. Click the
            link to verify your account and get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
            {error}
          </div>
        )}

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Display Name{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  autoComplete="name"
                  {...field}
                />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <PasswordStrengthMeter password={watchedPassword} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {form.formState.isSubmitting ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </Form>
  );
}
