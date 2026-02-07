import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">
                  Something went wrong
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  We couldn&apos;t verify your email or complete the
                  authentication. The link may have expired or already been
                  used.
                </p>
              </div>
              <Button asChild className="mt-2">
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
