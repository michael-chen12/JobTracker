'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import AuthDivider from '@/components/auth/AuthDivider';
import OAuthProviders from '@/components/auth/OAuthProviders';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const [oauthError, setOauthError] = useState<string | null>(null);

  const errorMessage =
    oauthError ||
    (urlError === 'authentication_failed'
      ? 'Authentication failed. Please try again.'
      : null);

  return (
    <>
      {errorMessage && (
        <div className="mb-4 p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
          {errorMessage}
        </div>
      )}

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="register">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <LoginForm />
          <AuthDivider text="or continue with" />
          <OAuthProviders onError={setOauthError} />
        </TabsContent>

        <TabsContent value="register">
          <RegisterForm />
          <AuthDivider text="or sign up with" />
          <OAuthProviders onError={setOauthError} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function LoginPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Track your job applications with AI-powered insights
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Suspense fallback={<LoginPageSkeleton />}>
              <LoginPageContent />
            </Suspense>

            <p className="mt-6 text-xs text-center text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
